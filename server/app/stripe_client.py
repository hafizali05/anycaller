"""Lazy Stripe client. Reads STRIPE_SECRET_KEY at first use so the
import doesn't blow up when the key isn't configured yet (e.g. during
local dev or before the user provisions their Stripe account).
"""

import os
from typing import Optional

import stripe as _stripe

_initialized = False


def is_configured() -> bool:
    return bool(os.environ.get("STRIPE_SECRET_KEY"))


def webhook_secret() -> Optional[str]:
    return os.environ.get("STRIPE_WEBHOOK_SECRET") or None


def client():
    """Return the configured `stripe` module, or raise if not set up."""
    global _initialized
    key = os.environ.get("STRIPE_SECRET_KEY")
    if not key:
        raise RuntimeError(
            "STRIPE_SECRET_KEY is not set on the Lambda. "
            "Add it via `sam deploy --parameter-overrides StripeSecretKey=sk_test_...`."
        )
    if not _initialized:
        _stripe.api_key = key
        _stripe.api_version = "2024-11-20.acacia"
        _initialized = True
    return _stripe
