"""Contacts — CSV import, manual add, list, update, delete.

PRD §6.1:
- Required column: phone. Suggested: name, email. Extra columns become custom fields.
- Phone validated + normalized to E.164 via libphonenumber.
- Dedup by normalized phone, count shown to the user.
- Tags (multi-valued) drive audience selection in campaign builder.
- DNC flag excludes from all campaigns.

DDB layout (single-table):
  pk = "WS#<workspace_id>"
  sk = "CONTACT#<contact_id>"
  Attrs: name, email, phone (E.164), company, tags (str set | None),
         dnc (bool), custom (map), createdAt, updatedAt
Dedup uses the phone, but the id is a UUID so URLs are stable even if a
phone needs re-normalization later.
"""

from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

import phonenumbers
from boto3.dynamodb.conditions import Attr, Key
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from ..auth import CognitoUser
from ..db import table
from .workspaces import _get_or_create_workspace

router = APIRouter(prefix="/contacts", tags=["contacts"])

DEFAULT_REGION = "US"  # libphonenumber region hint when a number has no +cc prefix


# ──────────────────────────────────────────────────────────────────────
# Models
# ──────────────────────────────────────────────────────────────────────
class ContactIn(BaseModel):
    phone: str
    name: str | None = None
    email: str | None = None
    company: str | None = None
    tags: list[str] = Field(default_factory=list)
    custom: dict[str, Any] = Field(default_factory=dict)


class Contact(BaseModel):
    id: str
    phone: str
    name: str | None = None
    email: str | None = None
    company: str | None = None
    tags: list[str] = Field(default_factory=list)
    custom: dict[str, Any] = Field(default_factory=dict)
    dnc: bool = False
    createdAt: str
    updatedAt: str


class ContactPatch(BaseModel):
    name: str | None = None
    email: str | None = None
    company: str | None = None
    tags: list[str] | None = None
    dnc: bool | None = None


class BulkResult(BaseModel):
    created: int
    skippedDuplicate: int
    invalid: list[dict[str, str]]  # [{row: "<original phone>", reason: "..."}]


class ListResponse(BaseModel):
    items: list[Contact]
    nextCursor: str | None = None


# ──────────────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────────────
def _ws_pk(workspace_id: str) -> str:
    return f"WS#{workspace_id}"


def _contact_sk(contact_id: str) -> str:
    return f"CONTACT#{contact_id}"


def _normalize_phone(raw: str) -> str:
    """Return E.164 form (e.g. '+14155550142') or raise ValueError."""
    if not raw or not raw.strip():
        raise ValueError("empty")
    try:
        parsed = phonenumbers.parse(raw, DEFAULT_REGION)
    except phonenumbers.NumberParseException as e:
        raise ValueError(str(e)) from e
    if not phonenumbers.is_valid_number(parsed):
        raise ValueError("not a valid number")
    return phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)


def _existing_phones(workspace_id: str) -> set[str]:
    """All phones currently in the workspace. For dedup. Single Query;
    paginated under the hood by boto3.resource."""
    phones: set[str] = set()
    last_key: dict | None = None
    while True:
        kwargs = {
            "KeyConditionExpression": Key("pk").eq(_ws_pk(workspace_id))
            & Key("sk").begins_with("CONTACT#"),
            "ProjectionExpression": "phone",
        }
        if last_key:
            kwargs["ExclusiveStartKey"] = last_key
        resp = table.query(**kwargs)
        for item in resp.get("Items", []):
            if item.get("phone"):
                phones.add(item["phone"])
        last_key = resp.get("LastEvaluatedKey")
        if not last_key:
            break
    return phones


def _item_to_contact(item: dict) -> Contact:
    return Contact(
        id=item["contactId"],
        phone=item["phone"],
        name=item.get("name"),
        email=item.get("email"),
        company=item.get("company"),
        tags=list(item.get("tags") or []),
        custom=dict(item.get("custom") or {}),
        dnc=bool(item.get("dnc", False)),
        createdAt=item["createdAt"],
        updatedAt=item["updatedAt"],
    )


def _matches_search(item: dict, q: str) -> bool:
    needle = q.lower()
    for field in ("name", "phone", "email", "company"):
        v = item.get(field)
        if v and needle in str(v).lower():
            return True
    return False


# ──────────────────────────────────────────────────────────────────────
# Routes
# ──────────────────────────────────────────────────────────────────────
@router.get("", response_model=ListResponse)
def list_contacts(user: CognitoUser, q: str = "", limit: int = 100) -> ListResponse:
    """List contacts in the caller's workspace. Free-text search is
    applied server-side (we scan and filter — fine up to ~10k contacts
    per workspace; we add a search index in a later slice if needed)."""
    workspace = _get_or_create_workspace(user["sub"], user.get("email"))
    limit = max(1, min(limit, 500))

    items: list[Contact] = []
    last_key: dict | None = None
    while len(items) < limit:
        kwargs: dict[str, Any] = {
            "KeyConditionExpression": Key("pk").eq(_ws_pk(workspace.id))
            & Key("sk").begins_with("CONTACT#"),
            "Limit": limit,
        }
        if last_key:
            kwargs["ExclusiveStartKey"] = last_key
        resp = table.query(**kwargs)
        for raw in resp.get("Items", []):
            if q and not _matches_search(raw, q):
                continue
            items.append(_item_to_contact(raw))
            if len(items) >= limit:
                break
        last_key = resp.get("LastEvaluatedKey")
        if not last_key:
            break

    return ListResponse(items=items, nextCursor=None)


@router.post("", response_model=Contact, status_code=status.HTTP_201_CREATED)
def create_contact(payload: ContactIn, user: CognitoUser) -> Contact:
    try:
        e164 = _normalize_phone(payload.phone)
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Invalid phone: {e}")

    workspace = _get_or_create_workspace(user["sub"], user.get("email"))

    if e164 in _existing_phones(workspace.id):
        raise HTTPException(status.HTTP_409_CONFLICT, "Contact with this phone already exists")

    now = datetime.now(timezone.utc).isoformat()
    contact_id = uuid4().hex
    item = {
        "pk": _ws_pk(workspace.id),
        "sk": _contact_sk(contact_id),
        "contactId": contact_id,
        "phone": e164,
        "name": payload.name,
        "email": payload.email,
        "company": payload.company,
        "tags": payload.tags,
        "custom": payload.custom,
        "dnc": False,
        "createdAt": now,
        "updatedAt": now,
    }
    table.put_item(Item=item)
    return _item_to_contact(item)


@router.post("/bulk", response_model=BulkResult)
def bulk_create(payload: list[ContactIn], user: CognitoUser) -> BulkResult:
    """Bulk-insert contacts from a parsed CSV. Returns counts so the UI
    can show 'X created · Y duplicates · Z invalid'."""
    workspace = _get_or_create_workspace(user["sub"], user.get("email"))
    existing = _existing_phones(workspace.id)

    invalid: list[dict[str, str]] = []
    valid_items: list[dict] = []
    seen_in_batch: set[str] = set()
    skipped_dup = 0
    now = datetime.now(timezone.utc).isoformat()

    for row in payload:
        raw_phone = (row.phone or "").strip()
        try:
            e164 = _normalize_phone(raw_phone)
        except ValueError as e:
            invalid.append({"row": raw_phone, "reason": str(e)})
            continue
        if e164 in existing or e164 in seen_in_batch:
            skipped_dup += 1
            continue
        seen_in_batch.add(e164)

        contact_id = uuid4().hex
        valid_items.append(
            {
                "pk": _ws_pk(workspace.id),
                "sk": _contact_sk(contact_id),
                "contactId": contact_id,
                "phone": e164,
                "name": row.name,
                "email": row.email,
                "company": row.company,
                "tags": row.tags,
                "custom": row.custom,
                "dnc": False,
                "createdAt": now,
                "updatedAt": now,
            }
        )

    # BatchWriteItem is capped at 25 items per call.
    for i in range(0, len(valid_items), 25):
        chunk = valid_items[i : i + 25]
        with table.batch_writer() as batch:
            for it in chunk:
                batch.put_item(Item=it)

    return BulkResult(created=len(valid_items), skippedDuplicate=skipped_dup, invalid=invalid)


@router.patch("/{contact_id}", response_model=Contact)
def update_contact(contact_id: str, patch: ContactPatch, user: CognitoUser) -> Contact:
    workspace = _get_or_create_workspace(user["sub"], user.get("email"))
    key = {"pk": _ws_pk(workspace.id), "sk": _contact_sk(contact_id)}

    updates: dict[str, Any] = {k: v for k, v in patch.model_dump(exclude_unset=True).items() if v is not None or k == "dnc"}
    if not updates:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Nothing to update")
    updates["updatedAt"] = datetime.now(timezone.utc).isoformat()

    set_expr = ", ".join(f"#{k} = :{k}" for k in updates)
    expr_attr_names = {f"#{k}": k for k in updates}
    expr_attr_values = {f":{k}": v for k, v in updates.items()}

    resp = table.update_item(
        Key=key,
        UpdateExpression=f"SET {set_expr}",
        ExpressionAttributeNames=expr_attr_names,
        ExpressionAttributeValues=expr_attr_values,
        ConditionExpression=Attr("pk").exists(),
        ReturnValues="ALL_NEW",
    )
    return _item_to_contact(resp["Attributes"])


@router.delete("/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_contact(contact_id: str, user: CognitoUser) -> None:
    workspace = _get_or_create_workspace(user["sub"], user.get("email"))
    table.delete_item(Key={"pk": _ws_pk(workspace.id), "sk": _contact_sk(contact_id)})
