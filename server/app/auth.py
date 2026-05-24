"""Cognito ID-token verifier. Mirrors hafiz.in/server/app/auth.py."""

import os
from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, Request, status
from jwt import PyJWKClient

USER_POOL_ID = os.environ["COGNITO_USER_POOL_ID"]
APP_CLIENT_ID = os.environ["COGNITO_APP_CLIENT_ID"]
REGION = USER_POOL_ID.split("_", 1)[0]

ISSUER = f"https://cognito-idp.{REGION}.amazonaws.com/{USER_POOL_ID}"
JWKS_URL = f"{ISSUER}/.well-known/jwks.json"

# PyJWKClient caches the JWKS document; reuse across requests inside the
# same Lambda container.
_jwks_client = PyJWKClient(JWKS_URL, cache_jwk_set=True, lifespan=3600)


def _bearer_token(request: Request) -> str:
    scheme, _, token = request.headers.get("authorization", "").partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            "Missing bearer token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return token


def _verify(token: str) -> dict:
    try:
        signing_key = _jwks_client.get_signing_key_from_jwt(token).key
        claims = jwt.decode(
            token,
            signing_key,
            algorithms=["RS256"],
            audience=APP_CLIENT_ID,
            issuer=ISSUER,
        )
    except jwt.PyJWTError as e:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            f"Invalid token: {e}",
            headers={"WWW-Authenticate": "Bearer"},
        ) from e
    if claims.get("token_use") != "id":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Expected ID token")
    return claims


def require_cognito_user(request: Request) -> dict:
    return _verify(_bearer_token(request))


CognitoUser = Annotated[dict, Depends(require_cognito_user)]
