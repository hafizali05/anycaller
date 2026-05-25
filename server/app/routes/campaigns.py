"""Campaigns — wizard-driven CRUD. PRD §6.2.

DDB layout (single-table):
  pk = "WS#<workspace_id>"
  sk = "CAMPAIGN#<campaign_id>"
  Attrs: type, name, brief, persona, voice, pace, voicemail, retry…,
         audienceTags, schedule, status, contactCount, createdAt, updatedAt

v0 omits per-type fields (Survey questions, Sales value-props, etc.) —
the `brief` free-text field carries the intent; type-specific UI lands
in a follow-up slice. Launch flips status draft → scheduled but does
NOT dial — actual dialing is gated on the voice-AI tech spike.
"""

import csv
import io
import re
from datetime import datetime, timezone
from typing import Any, Literal
from uuid import uuid4

from boto3.dynamodb.conditions import Attr, Key
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from ..auth import CognitoUser
from ..db import table
from .workspaces import _get_or_create_workspace

router = APIRouter(prefix="/campaigns", tags=["campaigns"])

CampaignType = Literal["survey", "sales", "custom"]
CampaignStatus = Literal["draft", "scheduled", "running", "paused", "completed"]
Pace = Literal["slow", "natural", "fast"]
VoicemailBehavior = Literal["leave", "hangup", "retry"]
ScheduleMode = Literal["now", "scheduled"]


# ──────────────────────────────────────────────────────────────────────
# Models
# ──────────────────────────────────────────────────────────────────────
class Schedule(BaseModel):
    mode: ScheduleMode = "now"
    scheduledAt: str | None = None  # ISO-8601 UTC


class CampaignIn(BaseModel):
    type: CampaignType = "custom"
    name: str = Field(min_length=1, max_length=120)
    brief: str = ""
    persona: str = "formal"
    voice: str = "sage"
    pace: Pace = "natural"
    voicemail: VoicemailBehavior = "leave"
    maxDurationMin: int = Field(default=5, ge=1, le=15)
    retryMaxAttempts: int = Field(default=2, ge=0, le=5)
    retryGapHours: int = Field(default=24, ge=1, le=168)
    maxConcurrent: int = Field(default=20, ge=1, le=200)
    audienceTags: list[str] = Field(default_factory=list)
    schedule: Schedule = Field(default_factory=Schedule)


class CampaignPatch(BaseModel):
    type: CampaignType | None = None
    name: str | None = None
    brief: str | None = None
    persona: str | None = None
    voice: str | None = None
    pace: Pace | None = None
    voicemail: VoicemailBehavior | None = None
    maxDurationMin: int | None = None
    retryMaxAttempts: int | None = None
    retryGapHours: int | None = None
    maxConcurrent: int | None = None
    audienceTags: list[str] | None = None
    schedule: Schedule | None = None


class Campaign(CampaignIn):
    id: str
    status: CampaignStatus
    contactCount: int = 0
    createdAt: str
    updatedAt: str


class ListResponse(BaseModel):
    items: list[Campaign]


# ──────────────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────────────
def _ws_pk(workspace_id: str) -> str:
    return f"WS#{workspace_id}"


def _campaign_sk(campaign_id: str) -> str:
    return f"CAMPAIGN#{campaign_id}"


def _item_to_campaign(item: dict) -> Campaign:
    sched_raw = item.get("schedule") or {}
    return Campaign(
        id=item["campaignId"],
        type=item.get("type", "custom"),
        name=item.get("name", ""),
        brief=item.get("brief", ""),
        persona=item.get("persona", "formal"),
        voice=item.get("voice", "sage"),
        pace=item.get("pace", "natural"),
        voicemail=item.get("voicemail", "leave"),
        maxDurationMin=int(item.get("maxDurationMin", 5)),
        retryMaxAttempts=int(item.get("retryMaxAttempts", 2)),
        retryGapHours=int(item.get("retryGapHours", 24)),
        maxConcurrent=int(item.get("maxConcurrent", 20)),
        audienceTags=list(item.get("audienceTags") or []),
        schedule=Schedule(
            mode=sched_raw.get("mode", "now"),
            scheduledAt=sched_raw.get("scheduledAt"),
        ),
        status=item.get("status", "draft"),
        contactCount=int(item.get("contactCount", 0)),
        createdAt=item["createdAt"],
        updatedAt=item["updatedAt"],
    )


def _count_audience(workspace_id: str, tags: list[str]) -> int:
    """How many non-DNC contacts match the tag filter (any-of). Used at
    launch time to snapshot `contactCount`."""
    tag_set = set(tags)
    matched = 0
    last_key: dict | None = None
    while True:
        kwargs: dict[str, Any] = {
            "KeyConditionExpression": Key("pk").eq(_ws_pk(workspace_id))
            & Key("sk").begins_with("CONTACT#"),
            "ProjectionExpression": "tags, dnc",
        }
        if last_key:
            kwargs["ExclusiveStartKey"] = last_key
        resp = table.query(**kwargs)
        for item in resp.get("Items", []):
            if item.get("dnc"):
                continue
            if not tag_set:
                matched += 1
                continue
            contact_tags = set(item.get("tags") or [])
            if contact_tags & tag_set:
                matched += 1
        last_key = resp.get("LastEvaluatedKey")
        if not last_key:
            break
    return matched


# ──────────────────────────────────────────────────────────────────────
# Routes
# ──────────────────────────────────────────────────────────────────────
@router.get("", response_model=ListResponse)
def list_campaigns(user: CognitoUser) -> ListResponse:
    workspace = _get_or_create_workspace(user["sub"], user.get("email"))
    resp = table.query(
        KeyConditionExpression=Key("pk").eq(_ws_pk(workspace.id))
        & Key("sk").begins_with("CAMPAIGN#"),
    )
    items = [_item_to_campaign(r) for r in resp.get("Items", [])]
    items.sort(key=lambda c: c.createdAt, reverse=True)
    return ListResponse(items=items)


@router.post("", response_model=Campaign, status_code=status.HTTP_201_CREATED)
def create_campaign(payload: CampaignIn, user: CognitoUser) -> Campaign:
    workspace = _get_or_create_workspace(user["sub"], user.get("email"))
    now = datetime.now(timezone.utc).isoformat()
    campaign_id = uuid4().hex
    item = {
        "pk": _ws_pk(workspace.id),
        "sk": _campaign_sk(campaign_id),
        "campaignId": campaign_id,
        "status": "draft",
        "contactCount": 0,
        "createdAt": now,
        "updatedAt": now,
        **payload.model_dump(),
    }
    table.put_item(Item=item)
    return _item_to_campaign(item)


@router.get("/{campaign_id}", response_model=Campaign)
def get_campaign(campaign_id: str, user: CognitoUser) -> Campaign:
    workspace = _get_or_create_workspace(user["sub"], user.get("email"))
    resp = table.get_item(
        Key={"pk": _ws_pk(workspace.id), "sk": _campaign_sk(campaign_id)}
    )
    item = resp.get("Item")
    if not item:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Campaign not found")
    return _item_to_campaign(item)


@router.patch("/{campaign_id}", response_model=Campaign)
def update_campaign(campaign_id: str, patch: CampaignPatch, user: CognitoUser) -> Campaign:
    workspace = _get_or_create_workspace(user["sub"], user.get("email"))
    key = {"pk": _ws_pk(workspace.id), "sk": _campaign_sk(campaign_id)}

    updates: dict[str, Any] = {k: v for k, v in patch.model_dump(exclude_unset=True).items() if v is not None}
    if not updates:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Nothing to update")
    updates["updatedAt"] = datetime.now(timezone.utc).isoformat()

    set_expr = ", ".join(f"#{k} = :{k}" for k in updates)
    expr_attr_names = {f"#{k}": k for k in updates}
    expr_attr_values = {f":{k}": v for k, v in updates.items()}

    try:
        resp = table.update_item(
            Key=key,
            UpdateExpression=f"SET {set_expr}",
            ExpressionAttributeNames=expr_attr_names,
            ExpressionAttributeValues=expr_attr_values,
            ConditionExpression=Attr("pk").exists(),
            ReturnValues="ALL_NEW",
        )
    except table.meta.client.exceptions.ConditionalCheckFailedException:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Campaign not found")
    return _item_to_campaign(resp["Attributes"])


@router.delete("/{campaign_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_campaign(campaign_id: str, user: CognitoUser) -> None:
    workspace = _get_or_create_workspace(user["sub"], user.get("email"))
    table.delete_item(Key={"pk": _ws_pk(workspace.id), "sk": _campaign_sk(campaign_id)})


def _transition(workspace_id: str, campaign_id: str, allowed_from: set[str], new_status: CampaignStatus) -> Campaign:
    key = {"pk": _ws_pk(workspace_id), "sk": _campaign_sk(campaign_id)}
    item = table.get_item(Key=key).get("Item")
    if not item:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Campaign not found")
    if item.get("status") not in allowed_from:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            f"Can't transition from {item.get('status')!r} to {new_status!r}",
        )
    now = datetime.now(timezone.utc).isoformat()
    resp = table.update_item(
        Key=key,
        UpdateExpression="SET #status = :s, updatedAt = :u",
        ExpressionAttributeNames={"#status": "status"},
        ExpressionAttributeValues={":s": new_status, ":u": now},
        ReturnValues="ALL_NEW",
    )
    return _item_to_campaign(resp["Attributes"])


@router.post("/{campaign_id}/pause", response_model=Campaign)
def pause_campaign(campaign_id: str, user: CognitoUser) -> Campaign:
    workspace = _get_or_create_workspace(user["sub"], user.get("email"))
    return _transition(workspace.id, campaign_id, {"running", "scheduled"}, "paused")


@router.post("/{campaign_id}/resume", response_model=Campaign)
def resume_campaign(campaign_id: str, user: CognitoUser) -> Campaign:
    workspace = _get_or_create_workspace(user["sub"], user.get("email"))
    return _transition(workspace.id, campaign_id, {"paused"}, "running")


@router.post("/{campaign_id}/stop", response_model=Campaign)
def stop_campaign(campaign_id: str, user: CognitoUser) -> Campaign:
    """Hard stop. Marks completed; the orchestrator (when it exists)
    drains in-flight calls."""
    workspace = _get_or_create_workspace(user["sub"], user.get("email"))
    return _transition(workspace.id, campaign_id, {"running", "scheduled", "paused"}, "completed")


@router.post("/{campaign_id}/launch", response_model=Campaign)
def launch_campaign(campaign_id: str, user: CognitoUser) -> Campaign:
    """Flip status draft → scheduled and snapshot the audience size.
    Does NOT actually dial — the orchestrator + worker land after the
    voice-AI tech spike concludes."""
    workspace = _get_or_create_workspace(user["sub"], user.get("email"))
    key = {"pk": _ws_pk(workspace.id), "sk": _campaign_sk(campaign_id)}

    existing = table.get_item(Key=key).get("Item")
    if not existing:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Campaign not found")
    if existing.get("status") != "draft":
        raise HTTPException(status.HTTP_409_CONFLICT, "Campaign already launched")

    count = _count_audience(workspace.id, list(existing.get("audienceTags") or []))
    if count == 0:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "Audience is empty (no non-DNC contacts match the selected tags)",
        )

    now = datetime.now(timezone.utc).isoformat()
    resp = table.update_item(
        Key=key,
        UpdateExpression="SET #status = :s, contactCount = :c, updatedAt = :u",
        ExpressionAttributeNames={"#status": "status"},
        ExpressionAttributeValues={":s": "scheduled", ":c": count, ":u": now},
        ReturnValues="ALL_NEW",
    )
    return _item_to_campaign(resp["Attributes"])


# ──────────────────────────────────────────────────────────────────────
# Export — PRD §6.4: "Bulk export to CSV — one row per call, with all
# extracted fields as columns."
# ──────────────────────────────────────────────────────────────────────
_FIXED_COLUMNS = [
    "call_id",
    "contact_name",
    "contact_phone",
    "contact_company",
    "status",
    "outcome",
    "attempt",
    "duration_sec",
    "started_at",
    "ended_at",
    "sentiment",
    "snippet",
]


def _slugify(name: str) -> str:
    """Filename-safe slug. Lowercased, ascii letters/digits/dashes only."""
    s = re.sub(r"[^a-zA-Z0-9]+", "-", (name or "").strip().lower()).strip("-")
    return s or "campaign"


def _query_workspace_calls(workspace_id: str, campaign_id: str) -> list[dict]:
    """All raw call items in the workspace that belong to the campaign.
    Mirrors calls.list_calls: workspace-scoped Query + filter by
    campaignId in app code (no GSI in v0)."""
    items: list[dict] = []
    last_key: dict | None = None
    while True:
        kwargs: dict[str, Any] = {
            "KeyConditionExpression": Key("pk").eq(_ws_pk(workspace_id))
            & Key("sk").begins_with("CALL#"),
        }
        if last_key:
            kwargs["ExclusiveStartKey"] = last_key
        resp = table.query(**kwargs)
        for raw in resp.get("Items", []):
            if raw.get("campaignId") == campaign_id:
                items.append(raw)
        last_key = resp.get("LastEvaluatedKey")
        if not last_key:
            break
    return items


def _query_workspace_contacts(workspace_id: str) -> dict[str, dict]:
    """Map of contactId -> contact item. Mirrors contacts.list_contacts."""
    by_id: dict[str, dict] = {}
    last_key: dict | None = None
    while True:
        kwargs: dict[str, Any] = {
            "KeyConditionExpression": Key("pk").eq(_ws_pk(workspace_id))
            & Key("sk").begins_with("CONTACT#"),
        }
        if last_key:
            kwargs["ExclusiveStartKey"] = last_key
        resp = table.query(**kwargs)
        for raw in resp.get("Items", []):
            cid = raw.get("contactId")
            if cid:
                by_id[cid] = raw
        last_key = resp.get("LastEvaluatedKey")
        if not last_key:
            break
    return by_id


def _stringify_extracted(value: Any) -> str:
    """Extraction values may be scalars, lists, or dicts — flatten to a
    CSV-safe string. csv.writer handles quoting; we just need a string."""
    if value is None:
        return ""
    if isinstance(value, (str, int, float, bool)):
        return str(value)
    # Lists/dicts — render with json so structure isn't lost.
    import json

    try:
        return json.dumps(value, default=str, ensure_ascii=False)
    except (TypeError, ValueError):
        return str(value)


@router.get("/{campaign_id}/export.csv")
def export_campaign_csv(campaign_id: str, user: CognitoUser) -> StreamingResponse:
    """CSV download of every call in the campaign. One row per call;
    fixed columns first, then one column per unique extracted field
    (`extracted.<field_name>`) across the campaign's calls.

    Streamed via StreamingResponse so a large export doesn't materialize
    the whole CSV in memory."""
    workspace = _get_or_create_workspace(user["sub"], user.get("email"))

    # Confirm the campaign exists in this workspace (404 otherwise — same
    # contract as get_campaign).
    camp_item = table.get_item(
        Key={"pk": _ws_pk(workspace.id), "sk": _campaign_sk(campaign_id)}
    ).get("Item")
    if not camp_item:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Campaign not found")

    call_items = _query_workspace_calls(workspace.id, campaign_id)
    # Sort oldest-first for the CSV so the file reads chronologically.
    call_items.sort(key=lambda i: i.get("createdAt") or "")

    contacts = _query_workspace_contacts(workspace.id)

    # Collect every extracted field name seen across the campaign's
    # calls, preserving first-seen order for stable column ordering.
    extracted_fields: list[str] = []
    seen_fields: set[str] = set()
    for raw in call_items:
        for k in (raw.get("extraction") or {}).keys():
            if k not in seen_fields:
                seen_fields.add(k)
                extracted_fields.append(k)

    header = _FIXED_COLUMNS + [f"extracted.{f}" for f in extracted_fields]

    def _row_iter():
        # csv.writer needs a file-like target; use a per-row StringIO so
        # we yield each row independently to the response body rather
        # than buffering the whole CSV.
        buf = io.StringIO()
        writer = csv.writer(buf)
        writer.writerow(header)
        yield buf.getvalue()
        buf.seek(0)
        buf.truncate(0)

        for raw in call_items:
            contact = contacts.get(raw.get("contactId") or "", {})
            extraction = raw.get("extraction") or {}
            duration = raw.get("durationSec")
            row = [
                raw.get("callId", ""),
                contact.get("name") or "",
                contact.get("phone") or "",
                contact.get("company") or "",
                raw.get("status", ""),
                raw.get("outcome") or "",
                str(int(raw.get("attempt") or 1)),
                "" if duration is None else str(int(duration)),
                raw.get("startedAt") or "",
                raw.get("endedAt") or "",
                raw.get("sentiment") or "",
                raw.get("snippet") or "",
            ]
            for field in extracted_fields:
                cell = extraction.get(field) or {}
                row.append(_stringify_extracted(cell.get("value") if isinstance(cell, dict) else cell))
            writer.writerow(row)
            yield buf.getvalue()
            buf.seek(0)
            buf.truncate(0)

    filename = f"campaign-{_slugify(camp_item.get('name', ''))}-calls.csv"
    return StreamingResponse(
        _row_iter(),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
