"""anycaller API entry point. FastAPI + AWS Lambda Web Adapter."""

import os
from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routes import campaigns, contacts, workspaces

ALLOWED_ORIGIN = os.environ.get("ALLOWED_ORIGIN", "http://localhost:3000")

app = FastAPI(title="anycaller-api", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[ALLOWED_ORIGIN],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(workspaces.router)
app.include_router(contacts.router)
app.include_router(campaigns.router)


@app.get("/healthz")
async def healthz() -> dict:
    return {"ok": True, "ts": datetime.now(timezone.utc).isoformat()}
