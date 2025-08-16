#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="$SCRIPT_DIR/../docker-compose.yml"
PROJECT_DIR="$(dirname "$COMPOSE_FILE")"

if docker compose version >/dev/null 2>&1; then
  COMPOSE="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE="docker-compose"
else
  echo "docker compose not found" >&2
  exit 1
fi

if [[ ! -f "$COMPOSE_FILE" ]]; then
  echo "compose file not found at $COMPOSE_FILE" >&2
  exit 1
fi

ENDPOINT="http://localhost:4566"
BUCKETS=(
  dexbooru-dev-pfps
  dexbooru-dev-posts
  dexbooru-dev-collections
  dexbooru-prd-pfps
  dexbooru-prd-posts
  dexbooru-prd-collections
)

log() { printf "[%s] %s\n" "$(date '+%Y-%m-%d %H:%M:%S')" "$*"; }

trap 'log "Error on line $LINENO"; exit 1' ERR

log "Starting localstack container in background"
if ! $COMPOSE -f "$COMPOSE_FILE" --project-directory "$PROJECT_DIR" up -d localstack; then
  log "Failed to start localstack container"
  exit 1
fi
log "Localstack container started in background"

log "Checking LocalStack S3 at ${ENDPOINT}"
deadline=$((SECONDS+90))
until curl -s "${ENDPOINT}/_localstack/health" | grep -Eiq '"s3"[[:space:]]*:[[:space:]]*"running"'; do
  if (( SECONDS >= deadline )); then
    log "LocalStack S3 not healthy after timeout"
    exit 1
  fi
  sleep 2
done
log "LocalStack S3 is healthy"

log "Creating required S3 buckets if missing"
for b in "${BUCKETS[@]}"; do
  if aws --endpoint-url="${ENDPOINT}" s3 ls "s3://${b}" >/dev/null 2>&1; then
    log "Bucket exists: s3://${b}"
  else
    log "Creating bucket: s3://${b}"
    aws --endpoint-url="${ENDPOINT}" s3 mb "s3://${b}"
  fi
done

log "Listing all buckets"
aws --endpoint-url="${ENDPOINT}" s3 ls
log "Done"
