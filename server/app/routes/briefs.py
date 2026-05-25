"""Briefs — reusable call brief templates. Designs surface them as a
Library so an operator can write a brief once and start campaigns from
it later.

DDB layout (single-table):
  pk = "WS#<workspace_id>"
  sk = "BRIEF#<brief_id>"
  Attrs: name, type (survey/sales/custom), brief, persona, voice, pace,
         usageCount, createdAt, updatedAt
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

router = APIRouter(prefix="/briefs", tags=["briefs"])

BriefType = Literal["survey", "sales", "custom"]
Pace = Literal["slow", "natural", "fast"]


class BriefIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    type: BriefType = "custom"
    brief: str = ""
    persona: str = "formal"
    voice: str = "sage"
    pace: Pace = "natural"


class Brief(BriefIn):
    id: str
    usageCount: int = 0
    createdAt: str
    updatedAt: str


class ListResponse(BaseModel):
    items: list[Brief]


def _ws_pk(workspace_id: str) -> str:
    return f"WS#{workspace_id}"


def _brief_sk(brief_id: str) -> str:
    return f"BRIEF#{brief_id}"


def _item_to_brief(item: dict) -> Brief:
    return Brief(
        id=item["briefId"],
        name=item.get("name", ""),
        type=item.get("type", "custom"),
        brief=item.get("brief", ""),
        persona=item.get("persona", "formal"),
        voice=item.get("voice", "sage"),
        pace=item.get("pace", "natural"),
        usageCount=int(item.get("usageCount", 0)),
        createdAt=item["createdAt"],
        updatedAt=item["updatedAt"],
    )


@router.get("", response_model=ListResponse)
def list_briefs(user: CognitoUser) -> ListResponse:
    workspace = _get_or_create_workspace(user["sub"], user.get("email"))
    resp = table.query(
        KeyConditionExpression=Key("pk").eq(_ws_pk(workspace.id)) & Key("sk").begins_with("BRIEF#"),
    )
    items = [_item_to_brief(r) for r in resp.get("Items", [])]
    items.sort(key=lambda b: b.updatedAt, reverse=True)
    return ListResponse(items=items)


@router.post("", response_model=Brief, status_code=status.HTTP_201_CREATED)
def create_brief(payload: BriefIn, user: CognitoUser) -> Brief:
    workspace = _get_or_create_workspace(user["sub"], user.get("email"))
    now = datetime.now(timezone.utc).isoformat()
    brief_id = uuid4().hex
    item = {
        "pk": _ws_pk(workspace.id),
        "sk": _brief_sk(brief_id),
        "briefId": brief_id,
        "usageCount": 0,
        "createdAt": now,
        "updatedAt": now,
        **payload.model_dump(),
    }
    table.put_item(Item=item)
    return _item_to_brief(item)


@router.get("/{brief_id}", response_model=Brief)
def get_brief(brief_id: str, user: CognitoUser) -> Brief:
    workspace = _get_or_create_workspace(user["sub"], user.get("email"))
    resp = table.get_item(Key={"pk": _ws_pk(workspace.id), "sk": _brief_sk(brief_id)})
    item = resp.get("Item")
    if not item:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Brief not found")
    return _item_to_brief(item)


@router.patch("/{brief_id}", response_model=Brief)
def update_brief(brief_id: str, patch: dict, user: CognitoUser) -> Brief:
    workspace = _get_or_create_workspace(user["sub"], user.get("email"))
    key = {"pk": _ws_pk(workspace.id), "sk": _brief_sk(brief_id)}
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
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Brief not found")
    return _item_to_brief(resp["Attributes"])


@router.delete("/{brief_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_brief(brief_id: str, user: CognitoUser) -> None:
    workspace = _get_or_create_workspace(user["sub"], user.get("email"))
    table.delete_item(Key={"pk": _ws_pk(workspace.id), "sk": _brief_sk(brief_id)})


@router.post("/{brief_id}/bump-usage", response_model=Brief)
def bump_usage(brief_id: str, user: CognitoUser) -> Brief:
    """Called when a campaign is launched from this brief."""
    workspace = _get_or_create_workspace(user["sub"], user.get("email"))
    key = {"pk": _ws_pk(workspace.id), "sk": _brief_sk(brief_id)}
    try:
        resp = table.update_item(
            Key=key,
            UpdateExpression="ADD usageCount :inc SET updatedAt = :u",
            ExpressionAttributeValues={
                ":inc": 1,
                ":u": datetime.now(timezone.utc).isoformat(),
            },
            ConditionExpression=Attr("pk").exists(),
            ReturnValues="ALL_NEW",
        )
    except table.meta.client.exceptions.ConditionalCheckFailedException:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Brief not found")
    return _item_to_brief(resp["Attributes"])
