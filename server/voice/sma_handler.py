"""
anycaller — SIP Media Application (SMA) Lambda handler.

This Lambda is invoked by **Amazon Chime SDK Voice** every time the SIP
Media Application has something for us to do on a PSTN call (new inbound
call, an action completed, a digit was pressed, the call ended, etc.).

Architecture overview (voice path — pure AWS-native, no Twilio / VAPI):

    Caller's phone
       │  (PSTN)
       ▼
    Chime SDK Voice number  ──►  SIP Media Application  ──►  THIS Lambda
                                       ▲                          │
                                       │   PSTN audio actions     │
                                       └──────────────────────────┘
                                       (Speak / Hangup / ...)

We do NOT stream the audio ourselves; instead we *return* a list of
actions (a tiny DSL) and Chime executes them on our behalf — TTS via
Polly, DTMF capture, joining bridges, hangup, and so on.

Reference:
  https://docs.aws.amazon.com/chime-sdk/latest/dg/pstn-audio-actions.html

Stages this file currently supports:
  • Stage 2 — answer the call, speak a static greeting via Polly, hang up.
  • Stage 3 — same as Stage 2 but the greeting text is read from
              `event["CallDetails"]["SipMediaApplication"]["Parameters"]`
              (`AlexaForBusiness` style metadata), OR from the
              `Parameters` block on the inbound call itself. This lets
              the user/SAM template configure the greeting without a
              code change.

Stages explicitly NOT here yet (later work):
  • Stage 4 — Transcribe Streaming + Bedrock for full dialogue.
  • Stage 5 — turn-taking / interrupt / barge-in logic.

Voice convention: we always use **Amy (UK English, female)**. PRD §6.3
lists Friendly/Professional male/female presets; Amy maps to our default
"friendly female (UK)". When we expose voice selection per-campaign,
this becomes a lookup from `Parameters`.
"""

from __future__ import annotations

import json
import logging
from typing import Any

# Standard Lambda logger. CloudWatch picks up anything at INFO+.
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# ─────────────────────────────────────────────────────────────────────
# Defaults — these can be overridden per-call via SMA `Parameters`
# (see `_resolve_greeting()` below). Keeping them as module constants
# means a brand-new SIP Media Application that passes no params at all
# still produces a sensible call.
# ─────────────────────────────────────────────────────────────────────
DEFAULT_GREETING = (
    "Hello, this is an AI assistant calling on behalf of anycaller. "
    "Thank you for picking up. This is a test call from our voice stack. "
    "Goodbye."
)

# Polly voice id. "Amy" = en-GB female, generative-capable. The full list
# is at https://docs.aws.amazon.com/polly/latest/dg/voicelist.html — when
# we add voice-persona selection in the UI we'll map presets to ids here.
DEFAULT_VOICE_ID = "Amy"

# Polly engine. "generative" is the highest-quality engine (closest to a
# real voice), available for Amy in en-GB. Fall back to "neural" if a
# region or voice doesn't support it.
DEFAULT_ENGINE = "generative"


# ─────────────────────────────────────────────────────────────────────
# Action builders — each returns a single PSTN audio action dict in
# exactly the shape Chime expects. Splitting them out keeps the main
# handler readable and makes future actions (PlayAudio, RecordAudio,
# StartCallRecording, etc.) easy to add without touching the dispatcher.
#
# Action reference:
#   https://docs.aws.amazon.com/chime-sdk/latest/dg/specify-actions.html
# ─────────────────────────────────────────────────────────────────────
def _speak_action(
    text: str,
    *,
    voice_id: str = DEFAULT_VOICE_ID,
    engine: str = DEFAULT_ENGINE,
    language_code: str = "en-GB",
) -> dict[str, Any]:
    """Build a `Speak` action that hands `text` to Polly for TTS playback.

    The caller hears whatever Polly synthesises before the next action
    runs. Speak is *blocking* in the action chain — Chime will not run
    the action after this one until the speech finishes (or the caller
    hangs up).
    """
    return {
        "Type": "Speak",
        "Parameters": {
            "Text": text,
            "Engine": engine,            # "generative" | "neural" | "standard" | "long-form"
            "LanguageCode": language_code,
            "TextType": "text",          # use "ssml" if we ever want SSML tags
            "VoiceId": voice_id,
        },
    }


def _hangup_action(sip_response_code: str = "0") -> dict[str, Any]:
    """Build a `Hangup` action.

    `SipResponseCode` "0" is the normal "graceful hangup we initiated"
    code. Use "486" for busy, "480" for unavailable, etc. — see the SIP
    response code table in the docs.
    """
    return {
        "Type": "Hangup",
        "Parameters": {
            # The "ParticipantTag" defaults to the leg Chime is talking
            # to (the caller). For our Stage-2 flow we never have a
            # second leg, so leaving this empty is fine.
            "SipResponseCode": sip_response_code,
        },
    }


# ─────────────────────────────────────────────────────────────────────
# Parameter resolution — SMA event payloads can carry per-application
# parameters (configured when the SIP Media Application is created) AND
# per-call parameters (passed when an outbound call is created). For an
# inbound call only the application-level parameters are present.
#
# Stage 3 wants the greeting to be configurable, so we look in both
# places. First match wins; falls back to DEFAULT_GREETING.
# ─────────────────────────────────────────────────────────────────────
def _resolve_greeting(event: dict[str, Any]) -> str:
    """Pick the greeting text for this call.

    Lookup order:
      1. `event["CallDetails"]["TransactionAttributes"]["greeting"]`
         — set by a previous action in the same call (we don't use this
         yet, but it's the canonical place for "state carried across
         actions in one call").
      2. `event["CallDetails"]["Participants"][0]["Parameters"]["greeting"]`
         — set per-call when CreateCall was invoked (outbound only).
      3. `event["SipMediaApplication"]["Parameters"]["greeting"]` — set
         on the SIP Media Application itself; applies to every call.
      4. DEFAULT_GREETING.
    """
    call_details = event.get("CallDetails", {}) or {}

    # (1) Transaction attributes — survive across actions in one call.
    tx_attrs = call_details.get("TransactionAttributes") or {}
    if isinstance(tx_attrs, dict) and tx_attrs.get("greeting"):
        return str(tx_attrs["greeting"])

    # (2) Per-participant parameters — set on outbound CreateCall.
    participants = call_details.get("Participants") or []
    for p in participants:
        params = (p or {}).get("Parameters") or {}
        if isinstance(params, dict) and params.get("greeting"):
            return str(params["greeting"])

    # (3) SIP Media Application parameters — configured at SMA-create time.
    sma = event.get("SipMediaApplication") or call_details.get("SipMediaApplication") or {}
    sma_params = (sma or {}).get("Parameters") or {}
    if isinstance(sma_params, dict) and sma_params.get("greeting"):
        return str(sma_params["greeting"])

    # (4) Hard-coded default.
    return DEFAULT_GREETING


# ─────────────────────────────────────────────────────────────────────
# Event dispatch — Chime sends an `InvocationEventType` on every call.
# We branch on it to decide what actions (if any) to return.
#
# Full event-type list:
#   https://docs.aws.amazon.com/chime-sdk/latest/dg/pstn-invocations.html
#
# For Stage 2/3 we really only care about NEW_INBOUND_CALL and the
# terminal events (HANGUP, ACTION_SUCCESSFUL after our Hangup). For
# everything else we return an empty action list, which tells Chime
# "carry on, I have nothing to add."
# ─────────────────────────────────────────────────────────────────────
def _handle_new_inbound_call(event: dict[str, Any]) -> list[dict[str, Any]]:
    """Greet the caller via Polly, then hang up.

    Stage 2/3 behaviour: speak the resolved greeting and disconnect.
    Chime runs Speak first (caller hears it fully), then immediately
    fires Hangup. The "5 seconds" budget in the spec is roughly the
    duration of a short Polly utterance — the greeting itself paces
    the call.
    """
    greeting = _resolve_greeting(event)
    logger.info("NEW_INBOUND_CALL — greeting=%r", greeting)
    return [
        _speak_action(greeting),
        _hangup_action(),
    ]


def _empty_response() -> dict[str, Any]:
    """A no-op SMA response. Used when there's nothing for us to do."""
    return {
        "SchemaVersion": "1.0",
        "Actions": [],
    }


def lambda_handler(event: dict[str, Any], context: Any) -> dict[str, Any]:
    """Entry point invoked by Chime SDK Voice for every PSTN event.

    The response *must* be a dict with `SchemaVersion` and `Actions`,
    even if `Actions` is empty. Returning anything else makes Chime
    drop the call.
    """
    # Log the full event at INFO so we can debug from CloudWatch. Chime
    # event payloads are small (a few KB) so this is fine; if it ever
    # gets noisy, drop to DEBUG.
    logger.info("SMA event: %s", json.dumps(event, default=str))

    invocation_type = event.get("InvocationEventType", "")
    actions: list[dict[str, Any]] = []

    if invocation_type == "NEW_INBOUND_CALL":
        # Someone called our Chime SDK Voice phone number.
        actions = _handle_new_inbound_call(event)

    elif invocation_type == "NEW_OUTBOUND_CALL":
        # Reserved for when we initiate calls from the campaign worker.
        # For now, treat outbound identically to inbound so manual
        # CreateCall tests still play the greeting.
        actions = _handle_new_inbound_call(event)

    elif invocation_type == "ACTION_SUCCESSFUL":
        # The previous action (Speak or Hangup) finished cleanly. We
        # already queued both Speak+Hangup in NEW_INBOUND_CALL, so we
        # have nothing more to add — Chime will fire HANGUP next.
        logger.info("ACTION_SUCCESSFUL — no further actions")

    elif invocation_type == "ACTION_FAILED":
        # Something went wrong with the previous action (e.g. Polly
        # couldn't synthesise the text). Best we can do here is end
        # the call cleanly.
        action_data = event.get("ActionData") or {}
        logger.error("ACTION_FAILED — data=%s", json.dumps(action_data, default=str))
        actions = [_hangup_action()]

    elif invocation_type in ("HANGUP", "CALL_ANSWERED"):
        # HANGUP fires once the call has ended (either side). CALL_ANSWERED
        # only fires for outbound calls. Neither needs a response from us.
        logger.info("Terminal/transitional event: %s", invocation_type)

    elif invocation_type == "DIGITS_RECEIVED":
        # DTMF capture — not used in Stage 2/3. Logged for future stages.
        logger.info("DIGITS_RECEIVED (ignored for now)")

    else:
        # Unknown / new event type — log and return empty so we don't
        # accidentally kill the call.
        logger.warning("Unhandled InvocationEventType: %r", invocation_type)

    response = {
        "SchemaVersion": "1.0",
        "Actions": actions,
    }
    logger.info("SMA response: %s", json.dumps(response, default=str))
    return response
