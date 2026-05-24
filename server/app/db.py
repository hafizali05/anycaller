"""Single DynamoDB document client (anycaller-data). Reused across routes."""

import os

import boto3

TABLE_NAME = os.environ["DDB_TABLE"]
REGION = os.environ.get("AWS_REGION") or "eu-west-2"

_dynamodb = boto3.resource("dynamodb", region_name=REGION)
table = _dynamodb.Table(TABLE_NAME)
