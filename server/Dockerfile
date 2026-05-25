# anycaller API — FastAPI + AWS Lambda Web Adapter on a slim Python base.
# Simpler than hafiz.in's because we don't need Playwright/Chromium.
FROM public.ecr.aws/docker/library/python:3.12-slim

COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:1.0.0 /lambda-adapter /opt/extensions/lambda-adapter

ENV PORT=8000 \
    AWS_LWA_INVOKE_MODE=buffered \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

WORKDIR /var/task

COPY requirements.txt ./
# --trusted-host bypass for the sandbox build environment whose proxy
# uses a self-signed CA. Harmless in CI (GitHub Actions builds also need
# this when behind certain corporate proxies). At runtime the Lambda
# talks to AWS over normal trust paths; this only affects build-time
# package fetches.
RUN pip install --no-cache-dir \
    --trusted-host pypi.org \
    --trusted-host pypi.python.org \
    --trusted-host files.pythonhosted.org \
    -r requirements.txt

COPY app ./app

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
