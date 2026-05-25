# Voice-AI tech spike — AWS-native stack (UK)

> First plan doc in this repo. This template (the section list below) is
> the one we'll use for subsequent slice plans unless we find a reason to
> diverge. Slices that need provider/vendor decisions live in
> `docs/decisions/<topic>.md`; slices that need implementation live here
> in `docs/plans/<slice>.md`. STATUS.md remains the high-level ledger.

**Slice:** Voice-AI provider tech spike (PRD §8 open question #1).
**Owner:** Hafiz.
**Status:** Planned. Not started.
**Created:** 2026-05-25.

---

## 1. Goal in one sentence

Place a 60-second AI-handled phone call on a UK number, using only AWS
services (Chime SDK + Transcribe + Bedrock + Polly), and decide whether
the latency and naturalness clear the bar set in PRD §8 (sub-500ms
response, ≥4/5 "would you accept this from a human").

## 2. Why now / why this shape

PRD §7 originally listed Twilio + OpenAI Realtime as the preliminary
stack, with Retell/Vapi as managed fallbacks. The cost line in §8
("telephony cost explodes during runaway campaign") plus the operational
overhead of managing two non-AWS vendor accounts (Twilio + OpenAI org
with Realtime entitlement) pushed us to look at whether the whole stack
can sit inside AWS — same account, same IAM, same billing, same region.

The candidate AWS-native stack:

- **Amazon Chime SDK Voice Connector + SIP Media Application** for the
  phone number, SIP trunk, and the WebSocket bridge that streams call
  audio into our code.
- **Amazon Transcribe Streaming** for STT.
- **Amazon Bedrock** (Claude Haiku 4.5 or Sonnet 4.6) for the
  conversation LLM.
- **Amazon Polly** (neural / generative voice) for TTS.

We're not committing to this stack — we're spiking it. If it fails the
latency or naturalness bar we fall back to Retell/Vapi (see §9). The
spike is **UK-only**: a single UK DID, UK address verification, en-GB
Transcribe + Polly voices, eu-west-2 throughout. US is a separate
problem we'll come back to once the UK loop closes.

The spike isn't trying to replace voice-to-voice models (OpenAI
Realtime, Gemini Live) on principle — those don't yet exist inside
Bedrock, so picking them re-introduces the cross-vendor problem we're
trying to avoid. If AWS announces a voice-to-voice model on Bedrock,
revisit.

## 3. Non-goals

Explicitly **out** of this slice:

- Interruption / barge-in handling beyond a naïve "stop TTS on speech
  detected" — proper full-duplex VAD is Stage 6 only as a stretch, see §5.
- Multi-language. en-GB only. No en-US, no other locales.
- Recording UI in the operator app. We'll capture the raw call audio to
  S3 for our own QA, but the Call detail page already exists with a
  recording strip — wiring it up is the worker slice, not this spike.
- Production deployment, custom domain, real customer traffic. The spike
  Lambda lives in the same `anycaller` stack but behind a separate
  Function URL, only callable by Chime.
- DynamoDB writes for the test call. We'll log JSON to CloudWatch and
  inspect by eye. The worker slice owns DDB.
- Voicemail / AMD handling. We dial our own mobile, a human picks up.
- Outbound dialing. The spike is **inbound** only — we dial the DID
  from a personal phone. Outbound adds SIP-trunk caller-ID work that
  isn't on the critical path for the latency/naturalness question.
- Cost optimisation beyond a sanity-check sum (§8). Real cost modelling
  comes after we know the stack works.

## 4. Architecture

Audio flows in a loop. The phone is the source and sink; everything
else is glue.

```
  ┌────────────┐    PSTN     ┌──────────────────┐    SIP    ┌──────────────────────┐
  │ Mobile     │ ───────────▶│ Chime UK DID     │ ────────▶ │ SIP Media App        │
  │ phone      │ ◀───────────│ (Voice Connector)│ ◀──────── │ (Lambda trigger)     │
  └────────────┘             └──────────────────┘           └──────────┬───────────┘
                                                                       │ WebSocket
                                                                       │ (audio + control)
                                                                       ▼
                                                            ┌──────────────────────┐
                                                            │ Spike Lambda         │
                                                            │  (eu-west-2,         │
                                                            │   FastAPI on Web     │
                                                            │   Adapter, streaming)│
                                                            └──┬────────┬────────┬─┘
                                                               │        │        │
                                                  PCM frames   │        │ prompt │ SSML
                                                  ▼            │        ▼        ▼
                                       ┌──────────────────┐    │  ┌──────────┐ ┌──────────┐
                                       │ Transcribe       │    │  │ Bedrock  │ │ Polly    │
                                       │ Streaming        │    │  │ (Claude) │ │ Neural   │
                                       │ (en-GB)          │    │  └──────────┘ └──────────┘
                                       └────────┬─────────┘    │       │            │
                                                │ partial+     │       │ assistant  │ MP3/PCM
                                                │ final tx     │       │ text       │ frames
                                                └──────────────┴───────┴────────────┘
                                                       (orchestrated in the Lambda)
```

| Hop | Component | Region | Notes |
|---|---|---|---|
| Phone → DID | Chime Voice Connector + DID | eu-west-2 | UK number (`+44…`) provisioned via Chime SDK. |
| DID → Lambda | Chime SIP Media Application | eu-west-2 | SMA triggers Lambda on inbound INVITE. |
| Lambda ↔ Audio | Chime SDK call-media WebSocket | eu-west-2 | 8 kHz μ-law frames in both directions. |
| Lambda → STT | Transcribe Streaming (WebSocket) | eu-west-2 | `en-GB`, partial + final results. |
| Lambda → LLM | Bedrock Runtime `InvokeModelWithResponseStream` | eu-west-2 | Streaming text out. |
| Lambda → TTS | Polly `SynthesizeSpeech` (or streaming) | eu-west-2 | Neural / generative voice. |
| Recording → S3 | Optional `s3://anycaller-spike-recordings/` | eu-west-2 | KMS-encrypted, 30d lifecycle. |

Everything is in `eu-west-2` to keep round-trip latency tight and to
match the rest of the `anycaller` stack.

## 5. Stages

Six stages, gated. Each stage has a verifiable checkpoint — if the
checkpoint doesn't pass, we don't move on. Time estimates are
optimistic; double them if AWS approval queues come into play (UK
address verification in particular).

### Stage 1 — UK number, ringing

**Goal:** A real UK mobile-dialable DID that rings into a no-op SIP
Media App.

- Create Chime SDK Voice Connector in `eu-west-2`.
- Submit UK address verification (this is the SLA we don't control —
  could be hours, could be days; see §6).
- Provision one UK DID.
- Create a stub SIP Media Application + Lambda that answers, plays the
  built-in Chime hold music for 5 seconds, hangs up.
- Wire the SMA to the DID's inbound rule.

**Done when:** dialling the DID from a personal phone connects within
3 rings and plays audio for 5 seconds before hanging up cleanly. Call
shows up in Chime SDK call logs.

**Estimate:** 1 dev-day of work + UK verification wait (0–5 business
days).

### Stage 2 — Polly "hello world"

**Goal:** Replace the hold music with a Polly-generated greeting.

- In the SMA Lambda, on call answer, synthesize a fixed string ("Hi,
  this is the anycaller spike — testing voice synthesis.") with Polly
  Neural, voice `Amy` (en-GB) as the default. Save the MP3 to S3.
- Use the SMA `PlayAudio` action pointing at the S3 object.
- Hang up after playback.

**Done when:** the call plays a recognisably-Polly UK voice saying the
fixed string. Audio sounds clean (no clipping, no obvious artefacts).

**Estimate:** half a dev-day.

### Stage 3 — Dynamic greeting via Bedrock

**Goal:** Greeting is generated per-call by Bedrock, not hard-coded.

- On call answer, call Bedrock (`anthropic.claude-haiku-4-5-v1` or
  whichever Haiku 4.5 model ID is available in `eu-west-2`) with a
  short system prompt: "Generate a 1-sentence friendly greeting for a
  test call from anycaller. Don't say the word 'AI'."
- Pipe the response into Polly, play via SMA.
- Hang up after playback.

**Done when:** two consecutive test calls give different greetings,
both coherent, both played in <3s from connect.

**Estimate:** half a dev-day.

### Stage 4 — Transcribe capture (one-shot)

**Goal:** After the greeting plays, listen for 10 seconds, transcribe
what was said, log the transcript, hang up.

- Open a Transcribe Streaming WebSocket from the Lambda. Pipe inbound
  call audio (μ-law → PCM 16 kHz) into Transcribe.
- Collect final transcripts for 10s.
- Log the transcript JSON to CloudWatch.
- Hang up.

**Done when:** a 10-second spoken sentence comes back as a readable
transcript with >90% word accuracy on a clear-voice test.

**Estimate:** 1 dev-day. This is the first non-trivial integration —
expect to spend most of it on audio framing / sample-rate conversion.

### Stage 5 — End-to-end Bedrock loop (the real test)

**Goal:** Full conversational loop. The 60-second call from §1.

- After the greeting, enter a loop:
  1. Listen via Transcribe until ~500ms of silence after a final result.
  2. Send the user turn to Bedrock with a short system prompt
     ("You're calling on behalf of anycaller to ask 3 questions about
     how the call quality sounds. Keep replies under 20 words.").
  3. Stream Bedrock response → Polly → SMA play.
  4. Repeat until either 60s elapsed or user says a stop phrase.
- Save the full transcript + a JSON timing log (turn boundaries, STT
  latency, LLM latency, TTS latency) to S3.

**Done when:**

- A 60-second test call holds a 3-turn-each conversation.
- Median end-of-user-speech → start-of-AI-speech latency is **under
  1500ms** (PRD target is 500ms; we'll likely miss that on the first
  pass — 1500ms is the spike pass-bar; 500ms is the production bar).
- We have a self-rating of ≥3/5 on the "would you accept this from a
  human" rubric, and we send the recording to one other person for an
  independent rating.

**Estimate:** 2–3 dev-days. This is where most of the work lives.

### Stage 6 — Interruption + recording (stretch)

**Goal:** Caller can interrupt; we keep a clean recording of the whole
call.

- Add naïve barge-in: if Transcribe emits a partial while Polly audio
  is playing, send SMA `StopAudio`, then jump to the listen loop.
- Stream both legs of the audio to S3 via Chime call recording (or
  via the SMA media stream tee).

**Done when:** mid-sentence interrupt cuts the AI off within ~300ms,
and the S3 recording captures the full call (both sides) as a single
WAV/MP3.

**Estimate:** 1–2 dev-days. Stretch — drop if Stage 5 used the budget.

## 6. Open questions

These are the unknowns that could shift the plan; flag answers in the
decision doc when we have them.

| # | Question | Why it matters |
|---|---|---|
| 1 | **UK DID address-verification SLA via Chime.** No published timeline; community reports range from "same day" to "5 business days". | Gates Stage 1. If verification stalls, we either escalate via AWS support or fall back to a sandbox `+44` number from a SIP provider that already terminates into Chime. |
| 2 | **Polly voice choice.** Amy, Brian, Olivia (en-GB Neural), plus the newer Generative voices (Amy-Generative is en-GB) | Affects naturalness rating directly. Default to Amy Neural for Stage 2; A/B against Amy-Generative + Olivia in Stage 5. |
| 3 | **Bedrock model.** Claude Haiku 4.5 vs Claude Sonnet 4.6 (both available in eu-west-2). | Haiku is ~5× cheaper and ~2× faster per token; Sonnet handles ambiguity better. Start Haiku 4.5; record latency + an objection-handling sample for both. |
| 4 | **Transcribe Streaming vs newer realtime APIs.** Transcribe Streaming has been the AWS default for years; recent re:Invent announcements floated lower-latency streaming options that may or may not be live in eu-west-2 by 2026-05. | Audit available APIs at Stage 4 start; if a sub-300ms-latency option is GA in eu-west-2, use it. Otherwise Transcribe Streaming. |
| 5 | **Audio framing between Chime SMA and Transcribe.** Chime gives μ-law 8 kHz; Transcribe prefers PCM 16 kHz. | Resampling adds latency. Measure cost; consider whether 8 kHz Transcribe mode loses accuracy enough to matter for en-GB. |
| 6 | **Polly streaming vs synthesise-to-S3-then-play.** Streaming TTS would let the AI start speaking before the full sentence is rendered. SMA's `PlayAudio` action takes an S3 URL — does it support streaming sources, or do we need to chunk into multiple `PlayAudio` calls? | Affects perceived latency. Cheapest path is synthesise-to-S3 in Stage 2/3; revisit in Stage 5 if total latency is the blocker. |
| 7 | **Concurrency cap on Chime SDK Voice Connector.** Default per-account is low (one or two simultaneous calls). | Doesn't block the spike (1 call at a time), but flag for the worker slice — we'll need a quota bump before any real campaign. |
| 8 | **Bedrock prompt-cache and tool-use availability for streaming.** Both supported on `InvokeModelWithResponseStream` in some regions but not others. | Not a Stage 5 blocker, but if we want to keep cost down on production campaigns the system prompt should be cached. |

## 7. Success criteria

If the spike passes, we write `docs/decisions/voice-ai-provider.md`
selecting the AWS-native stack and pinning the choices below. The bar:

| Dimension | Pass | Stretch |
|---|---|---|
| End-of-user-speech → start-of-AI-speech latency (median) | ≤ 1500ms | ≤ 500ms (PRD §8 target) |
| Naturalness rating ("would you accept this call from a human", 1–5) | ≥ 3.5 self + 1 independent rater | ≥ 4.0 (PRD §10 target) |
| Word error rate on en-GB clear-voice 10-turn dialog | ≤ 10% | ≤ 5% |
| Cost per connected minute, fully loaded (Chime DID + telephony + STT + LLM + TTS) | ≤ $0.10/min (parity with VAPI) | ≤ $0.06/min |
| 60-second test call completes without dropped audio, dropped Bedrock response, or unhandled SMA error | yes | n/a |

If we pass 4/5 but miss latency, we still pick AWS-native — latency is
optimisable. If we pass 4/5 but miss naturalness, we re-spike with a
voice-to-voice provider (see §9).

## 8. Cost estimate

UK rates, eu-west-2, rough. Pulled from AWS pricing pages as of
2026-05-25; recompute when filing the decision doc — AWS prices drift.

| Line | Unit | Per-minute cost (est.) |
|---|---|---|
| Chime SDK Voice Connector inbound (UK DID, PSTN termination) | $0.0179/min inbound | $0.018 |
| Chime SDK SIP Media Application (audio handling) | $0.002/min | $0.002 |
| Transcribe Streaming (en-GB) | $0.024/min | $0.024 |
| Bedrock — Claude Haiku 4.5 (assume ~600 input + ~250 output tokens/min) | ~$0.001/1k in, ~$0.005/1k out | $0.002 |
| Polly Neural (assume ~600 chars synthesized/min) | $16/1M chars | $0.010 |
| Lambda compute + data transfer | negligible at single-call scale | $0.001 |
| **Sub-total per minute** | | **~$0.057** |
| DID rental (UK), per-month amortised over 1000 min/mo | $1/mo | $0.001 |
| **All-in per minute (assuming 1000+ min/mo on the DID)** | | **~$0.058** |

For comparison: VAPI's posted rate is ~$0.10/min (model + telephony +
their margin). Twilio Media Streams + OpenAI Realtime is more variable
but typically $0.10–0.15/min in our use shape.

**If the spike works, AWS-native is ~40% cheaper than VAPI before
margin.** That's enough margin to either drop our price or fund a
voice-to-voice upgrade later.

Caveats:
- Polly **Generative** voice is ~$30/1M chars (roughly 2× Neural).
  If we pick Generative for naturalness we lose ~$0.01/min.
- If we move to Sonnet 4.6 from Haiku 4.5 the Bedrock line jumps from
  $0.002 to ~$0.020/min. That alone wipes the cost advantage.

## 9. Risks / fallbacks

| Risk | Likelihood | Fallback |
|---|---|---|
| UK address verification doesn't return inside the spike window. | Medium | Use a sandboxed test DID from Twilio terminating into Chime via SIP trunk for Stages 2–5. Address verification can finish in parallel; switch DID at the end. |
| Total round-trip latency stays above 2s after Stage 5 optimisation. | Medium-High | Spike a **second** track: VAPI account + their managed pipeline + same Polly/Bedrock to compare. If VAPI is materially faster, switch the stack and document why in the decision doc. |
| Polly Neural voices sound robotic enough to fail naturalness. | Medium | Test Polly Generative voices (Amy-Generative). If still failing, accept that voice-to-voice (OpenAI Realtime or Gemini Live) is required and re-plan; this would mean leaving the pure AWS-native goal behind. |
| Chime SMA + Transcribe + Polly orchestration in a single Lambda hits 15-min timeout or 6 MB response size in a way we can't engineer around. | Low | Move to ECS Fargate worker (PRD §7 already lists Fargate as an option for the call worker). Adds ~1 day. |
| Bedrock in eu-west-2 lacks the model we want. | Low | Use cross-region inference profile (Bedrock supports calling models in another region transparently). Adds ~50–100ms latency per LLM call. |
| Cost lines come in materially higher than the §8 estimate. | Medium | Re-spike with the cheaper components first (Haiku 4.5 over Sonnet, Neural over Generative, drop Stage 6 recording). |
| AWS quota bumps (Chime concurrency, Polly TPS, Transcribe concurrency, Bedrock TPM) become a blocker for the worker slice. | Medium | File quota bumps the moment Stage 5 passes — they take 1–3 business days. Worker slice plan will list the exact quotas to request. |

If we hit two or more reds at the same time (e.g. UK verification +
latency miss), the recommendation will be: **adopt VAPI for v1**, ship
the MVP on it, revisit AWS-native once the rest of the product is in
customers' hands. That's a documented trade — VAPI managed = faster
shipping, AWS-native = better unit economics + tighter ops.

---

## Living doc

This file is **updated as stages complete** — every stage gets a short
"actual:" note appended under its section with what we measured (latency
numbers, transcript samples, cost surprises) and what changed in the
plan as a result. When all stages are either done or explicitly dropped,
we promote the findings to `docs/decisions/voice-ai-provider.md` and
mark this plan as `Status: closed` at the top.
