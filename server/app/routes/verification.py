"""Identity verification (Stripe Identity).

Flow:
  1. New user signs up + verifies email (Cognito).
  2. Frontend hits POST /verification/start → we create a Stripe
     VerificationSession scoped to this Cognito sub.
  3. Frontend opens Stripe.js's `verifyIdentity(clientSecret)` modal.
  4. When the user completes (or cancels) the flow, Stripe sends a
     webhook to /webhooks/stripe which updates DDB.
  5. Frontend polls GET /verification/me to learn the result and
     unblock the rest of the app.

DDB profile item shape:
  pk = "USR#<sub>"  sk = "PROFILE"
  +verified (bool), +verifiedAt (iso), +stripeVerificationSessionId
"""

from datetime import datetime, timezone
from typing import Literal

from boto3.dynamodb.conditions import Attr
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from .. import stripe_client
from ..auth import CognitoUser
from ..db import table
from .workspaces import _get_or_create_workspace, _user_key

router = APIRouter(prefix="/verification", tags=["verification"])

VerificationStatus = Literal["unverified", "pending", "verified"]


class StartResponse(BaseModel):
    clientSecret: str
    url: str  # hosted fallback (in case the modal isn't available)
    sessionId: str


class StatusResponse(BaseModel):
    status: VerificationStatus
    verifiedAt: str | None = None


def _profile_verified(sub: str) -> tuple[VerificationStatus, str | None]:
    item = table.get_item(Key=_user_key(sub)).get("Item") or {}
    if item.get("verified"):
        return "verified", item.get("verifiedAt")
    if item.get("stripeVerificationSessionId"):
        return "pending", None
    return "unverified", None


@router.get("/me", response_model=StatusResponse)
def get_status(user: CognitoUser) -> StatusResponse:
    _get_or_create_workspace(user["sub"], user.get("email"))
    s, t = _profile_verified(user["sub"])
    return StatusResponse(status=s, verifiedAt=t)


@router.post("/start", response_model=StartResponse)
def start(user: CognitoUser) -> StartResponse:
    if not stripe_client.is_configured():
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            "Stripe Identity is not configured yet. Set STRIPE_SECRET_KEY on the Lambda and redeploy.",
        )
    _get_or_create_workspace(user["sub"], user.get("email"))
    s = stripe_client.client()
    session = s.identity.VerificationSession.create(
        type="document",
        provided_details={"email": user.get("email")} if user.get("email") else None,
        metadata={"cognito_sub": user["sub"]},
        options={
            "document": {
                "require_matching_selfie": True,
                "require_live_capture": True,
            },
        },
    )
    # Persist the session id so the webhook can correlate when it
    # arrives (and so /verification/me returns "pending" in the
    # meantime).
    table.update_item(
        Key=_user_key(user["sub"]),
        UpdateExpression="SET stripeVerificationSessionId = :sid, updatedAt = :u",
        ExpressionAttributeValues={
            ":sid": session.id,
            ":u": datetime.now(timezone.utc).isoformat(),
        },
        ConditionExpression=Attr("pk").exists(),
    )
    return StartResponse(
        clientSecret=session.client_secret,
        url=session.url,
        sessionId=session.id,
    )
