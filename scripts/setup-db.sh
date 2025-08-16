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

log() { printf "[%s] %s\n" "$(date '+%Y-%m-%d %H:%M:%S')" "$*"; }

trap 'log "Error on line $LINENO"; exit 1' ERR

log "Starting postgres and redis"
$COMPOSE -f "$COMPOSE_FILE" --project-directory "$PROJECT_DIR" up -d postgres redis
log "Containers started"

log "Waiting for postgres readiness"
deadline=$((SECONDS+120))
until docker exec dexbooru-postgres pg_isready -h localhost -p 5432 >/dev/null 2>&1; do
  if (( SECONDS >= deadline )); then
    log "Postgres not ready after timeout"
    exit 1
  fi
  sleep 2
done
log "Postgres is ready"

log "Waiting for redis readiness"
deadline=$((SECONDS+90))
REDIS_PASS="$(docker exec dexbooru-redis printenv DB_REDIS_PASSWORD 2>/dev/null || true)"
until docker exec dexbooru-redis sh -lc "redis-cli ${REDIS_PASS:+-a \"$REDIS_PASS\"} ping | grep -qi PONG" >/dev/null 2>&1; do
  if (( SECONDS >= deadline )); then
    log "Redis not ready after timeout"
    exit 1
  fi
  sleep 2
done
log "Redis is ready"

log "Running pnpm dbgenerate"
cd "$PROJECT_DIR"
pnpm dbgenerate

log "Running pnpm dbseed"
pnpm dbseed

log "Done"
