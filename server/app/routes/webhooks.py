"""Stripe webhook handler.

Stripe sends signed callbacks for identity events. We verify the
signature with STRIPE_WEBHOOK_SECRET and update the user profile in
DDB. The cognito_sub is round-tripped through the VerificationSession
metadata so we can look up the right user without a secondary index.
"""

from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Request, status

from .. import stripe_client
from ..db import table
from .workspaces import _user_key

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


@router.post("/stripe", status_code=status.HTTP_200_OK)
async def stripe_webhook(request: Request) -> dict:
    if not stripe_client.is_configured():
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            "Stripe is not configured.",
        )

    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")
    secret = stripe_client.webhook_secret()
    if not secret:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            "STRIPE_WEBHOOK_SECRET is not set; cannot verify webhook.",
        )

    s = stripe_client.client()
    try:
        event = s.Webhook.construct_event(payload, sig_header, secret)
    except (s.error.SignatureVerificationError, ValueError) as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Invalid webhook signature: {e}")

    etype = event["type"]
    obj = event["data"]["object"]
    metadata = obj.get("metadata") or {}
    sub = metadata.get("cognito_sub")

    # We only care about identity events for now.
    if not etype.startswith("identity.verification_session."):
        return {"ignored": etype}
    if not sub:
        # Session created outside our flow — nothing to update.
        return {"ignored": "no cognito_sub in metadata"}

    now = datetime.now(timezone.utc).isoformat()
    key = _user_key(sub)

    if etype == "identity.verification_session.verified":
        table.update_item(
            Key=key,
            UpdateExpression="SET verified = :v, verifiedAt = :t, updatedAt = :u",
            ExpressionAttributeValues={":v": True, ":t": now, ":u": now},
        )
        return {"applied": "verified", "sub": sub}

    if etype in (
        "identity.verification_session.canceled",
        "identity.verification_session.requires_input",
    ):
        # Don't flip an already-verified user back to unverified — Stripe
        # can emit `requires_input` mid-flow even after success.
        table.update_item(
            Key=key,
            UpdateExpression="SET stripeVerificationStatus = :s, updatedAt = :u",
            ExpressionAttributeValues={":s": obj.get("status", "unknown"), ":u": now},
        )
        return {"applied": etype, "sub": sub}

    return {"ignored": etype}
