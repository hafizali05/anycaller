"""Workspace lifecycle. PRD §6.7: one workspace per account at MVP.

DDB single-table layout:
  pk = "USR#<cognito_sub>"   sk = "PROFILE"     → user profile + workspaceId
  pk = "WS#<workspaceId>"    sk = "META"        → workspace metadata
  pk = "WS#<workspaceId>"    sk = "MEMBER#<sub>"→ membership (single member at MVP)
"""

import os
from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter
from pydantic import BaseModel, Field

from ..auth import CognitoUser
from ..db import table

router = APIRouter(prefix="/workspaces", tags=["workspaces"])


class Workspace(BaseModel):
    id: str
    name: str
    createdAt: str = Field(description="ISO-8601 UTC timestamp")


class MeResponse(BaseModel):
    sub: str
    email: str | None = None
    workspace: Workspace


def _user_key(sub: str) -> dict:
    return {"pk": f"USR#{sub}", "sk": "PROFILE"}


def _workspace_key(workspace_id: str) -> dict:
    return {"pk": f"WS#{workspace_id}", "sk": "META"}


def _get_or_create_workspace(sub: str, email: str | None) -> Workspace:
    """Idempotently provision a workspace for a freshly authenticated user."""
    profile = table.get_item(Key=_user_key(sub)).get("Item")
    if profile and profile.get("workspaceId"):
        ws_item = table.get_item(Key=_workspace_key(profile["workspaceId"])).get("Item")
        if ws_item:
            return Workspace(
                id=ws_item["workspaceId"],
                name=ws_item["name"],
                createdAt=ws_item["createdAt"],
            )

    workspace_id = uuid4().hex
    now = datetime.now(timezone.utc).isoformat()
    name = (email.split("@", 1)[0] if email else "Workspace") + "’s workspace"

    table.put_item(
        Item={
            **_workspace_key(workspace_id),
            "workspaceId": workspace_id,
            "name": name,
            "createdAt": now,
            "ownerSub": sub,
        }
    )
    table.put_item(
        Item={
            **_user_key(sub),
            "sub": sub,
            "email": email,
            "workspaceId": workspace_id,
            "createdAt": now,
        }
    )
    return Workspace(id=workspace_id, name=name, createdAt=now)


@router.get("/me", response_model=MeResponse)
def me(user: CognitoUser) -> MeResponse:
    workspace = _get_or_create_workspace(user["sub"], user.get("email"))
    return MeResponse(sub=user["sub"], email=user.get("email"), workspace=workspace)
