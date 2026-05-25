"""Calls — per-attempt call records. Written by the call worker when
that exists; for now only read endpoints have real users.

DDB layout (single-table):
  pk = "WS#<workspace_id>"
  sk = "CALL#<call_id>"
  Attrs: campaignId, contactId, status, outcome, attempt,
         startedAt, endedAt, durationSec,
         transcript (list of {who, t, text}),
         extraction (map of {field: {value, confidence}}),
         recordingUrl, sentiment, snippet, createdAt, updatedAt

Listing by campaign currently filters in app code — fine until a single
workspace has ~10k calls; add a GSI on campaignId then.
"""

from datetime import datetime, timezone
from typing import Any, Literal
from uuid import uuid4

from boto3.dynamodb.conditions import Attr, Key
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from ..auth import CognitoUser
from ..db import table
from .workspaces import _get_or_create_workspace

router = APIRouter(prefix="/calls", tags=["calls"])

CallStatus = Literal["queued", "ringing", "live", "completed", "voicemail", "failed", "optout"]
CallOutcome = Literal["yes", "maybe", "no"] | None


class TranscriptLine(BaseModel):
    who: Literal["ava", "them"]
    t: str  # mm:ss
    text: str


class ExtractedField(BaseModel):
    value: Any
    confidence: float | None = None


class CallIn(BaseModel):
    campaignId: str
    contactId: str
    status: CallStatus = "queued"
    outcome: CallOutcome = None
    attempt: int = 1
    durationSec: int | None = None
    startedAt: str | None = None
    endedAt: str | None = None
    transcript: list[TranscriptLine] = Field(default_factory=list)
    extraction: dict[str, ExtractedField] = Field(default_factory=dict)
    recordingUrl: str | None = None
    sentiment: str | None = None
    snippet: str | None = None


class Call(CallIn):
    id: str
    createdAt: str
    updatedAt: str


class ListResponse(BaseModel):
    items: list[Call]


def _ws_pk(workspace_id: str) -> str:
    return f"WS#{workspace_id}"


def _call_sk(call_id: str) -> str:
    return f"CALL#{call_id}"


def _item_to_call(item: dict) -> Call:
    return Call(
        id=item["callId"],
        campaignId=item.get("campaignId", ""),
        contactId=item.get("contactId", ""),
        status=item.get("status", "queued"),
        outcome=item.get("outcome"),
        attempt=int(item.get("attempt", 1)),
        durationSec=int(item["durationSec"]) if item.get("durationSec") is not None else None,
        startedAt=item.get("startedAt"),
        endedAt=item.get("endedAt"),
        transcript=[TranscriptLine(**t) for t in (item.get("transcript") or [])],
        extraction={k: ExtractedField(**v) for k, v in (item.get("extraction") or {}).items()},
        recordingUrl=item.get("recordingUrl"),
        sentiment=item.get("sentiment"),
        snippet=item.get("snippet"),
        createdAt=item["createdAt"],
        updatedAt=item["updatedAt"],
    )


@router.get("", response_model=ListResponse)
def list_calls(user: CognitoUser, campaignId: str = "", limit: int = 200) -> ListResponse:
    workspace = _get_or_create_workspace(user["sub"], user.get("email"))
    limit = max(1, min(limit, 1000))

    items: list[Call] = []
    last_key: dict | None = None
    while len(items) < limit:
        kwargs: dict[str, Any] = {
            "KeyConditionExpression": Key("pk").eq(_ws_pk(workspace.id))
            & Key("sk").begins_with("CALL#"),
            "Limit": limit,
        }
        if last_key:
            kwargs["ExclusiveStartKey"] = last_key
        resp = table.query(**kwargs)
        for raw in resp.get("Items", []):
            if campaignId and raw.get("campaignId") != campaignId:
                continue
            items.append(_item_to_call(raw))
            if len(items) >= limit:
                break
        last_key = resp.get("LastEvaluatedKey")
        if not last_key:
            break

    items.sort(key=lambda c: c.createdAt, reverse=True)
    return ListResponse(items=items)


@router.get("/{call_id}", response_model=Call)
def get_call(call_id: str, user: CognitoUser) -> Call:
    workspace = _get_or_create_workspace(user["sub"], user.get("email"))
    resp = table.get_item(Key={"pk": _ws_pk(workspace.id), "sk": _call_sk(call_id)})
    item = resp.get("Item")
    if not item:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Call not found")
    return _item_to_call(item)


@router.post("", response_model=Call, status_code=status.HTTP_201_CREATED)
def create_call(payload: CallIn, user: CognitoUser) -> Call:
    """Worker-only endpoint. Frontend never calls this directly. Kept
    open (auth-gated) so the worker can write via the same JWT path
    once it exists."""
    workspace = _get_or_create_workspace(user["sub"], user.get("email"))
    now = datetime.now(timezone.utc).isoformat()
    call_id = uuid4().hex
    item = {
        "pk": _ws_pk(workspace.id),
        "sk": _call_sk(call_id),
        "callId": call_id,
        "createdAt": now,
        "updatedAt": now,
        **payload.model_dump(),
    }
    table.put_item(Item=item)
    return _item_to_call(item)


@router.patch("/{call_id}", response_model=Call)
def update_call(call_id: str, patch: dict, user: CognitoUser) -> Call:
    workspace = _get_or_create_workspace(user["sub"], user.get("email"))
    key = {"pk": _ws_pk(workspace.id), "sk": _call_sk(call_id)}
    patch = {k: v for k, v in patch.items() if v is not None}
    if not patch:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Nothing to update")
    patch["updatedAt"] = datetime.now(timezone.utc).isoformat()
    set_expr = ", ".join(f"#{k} = :{k}" for k in patch)
    try:
        resp = table.update_item(
            Key=key,
            UpdateExpression=f"SET {set_expr}",
            ExpressionAttributeNames={f"#{k}": k for k in patch},
            ExpressionAttributeValues={f":{k}": v for k, v in patch.items()},
            ConditionExpression=Attr("pk").exists(),
            ReturnValues="ALL_NEW",
        )
    except table.meta.client.exceptions.ConditionalCheckFailedException:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Call not found")
    return _item_to_call(resp["Attributes"])
