#!/bin/bash
# Claude Code on the web — SessionStart hook for anycaller.
# Installs the tools and deps that aren't in the base container:
#   - AWS CLI v2          (for CloudWatch / Lambda / S3 / Cognito ops)
#   - boto3               (Python scripting against AWS)
#   - server/ Python deps (so we can run / lint the FastAPI Lambda)
#   - web/ npm deps       (so `npm run lint` and `next build` work)
#
# Idempotent: skips already-installed pieces. Web-only: skipped during
# local dev (no need to reinstall on every local `claude` launch).
#
# AWS credentials come from session secrets you set in the Claude Code
# on the web UI: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY. The script
# does not store credentials.

set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

# Silence pip's "running as root" warning — we're in a throwaway container.
export PIP_ROOT_USER_ACTION=ignore

# Default region — project convention is eu-west-2 (London). A session
# secret named AWS_DEFAULT_REGION will override.
echo 'export AWS_DEFAULT_REGION="${AWS_DEFAULT_REGION:-eu-west-2}"' >> "$CLAUDE_ENV_FILE"

# --- AWS CLI v2 -------------------------------------------------------
if ! command -v aws >/dev/null 2>&1; then
  TMP="$(mktemp -d)"
  curl -fsSL "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "$TMP/awscliv2.zip"
  unzip -q "$TMP/awscliv2.zip" -d "$TMP"
  "$TMP/aws/install" --update >/dev/null
  rm -rf "$TMP"
fi

# --- Python deps ------------------------------------------------------
# --ignore-installed: the base container has some Debian-packaged
# Python libs (e.g. PyJWT 2.7) that pip can't uninstall (no RECORD
# file). Skipping the uninstall step lets pip drop the requested
# versions into /usr/local/... where they shadow the OS copies.
python3 -m pip install --quiet --disable-pip-version-check --ignore-installed boto3
python3 -m pip install --quiet --disable-pip-version-check --ignore-installed -r "$CLAUDE_PROJECT_DIR/server/requirements.txt"

# --- Node deps for the Next.js frontend -------------------------------
( cd "$CLAUDE_PROJECT_DIR/web" && npm install --silent --no-audit --no-fund )

# --- Status summary ---------------------------------------------------
echo "[session-start] aws        $(aws --version 2>&1)"
echo "[session-start] boto3      $(python3 -c 'import boto3; print(boto3.__version__)')"
echo "[session-start] node       $(node --version)  npm $(npm --version)"
echo "[session-start] web deps   node_modules present: $([ -d "$CLAUDE_PROJECT_DIR/web/node_modules" ] && echo yes || echo no)"
if [ -n "${AWS_ACCESS_KEY_ID:-}" ]; then
  echo "[session-start] AWS creds  present (region ${AWS_DEFAULT_REGION:-eu-west-2})"
else
  echo "[session-start] AWS creds  NOT set — add AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY as session secrets to enable AWS ops"
fi
