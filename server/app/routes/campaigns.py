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

from datetime import datetime, timezone
from typing import Any, Literal
from uuid import uuid4

from boto3.dynamodb.conditions import Attr, Key
from fastapi import APIRouter, HTTPException, status
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
