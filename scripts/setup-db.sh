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

log "Postgres and redis are ready"

cd "$PROJECT_DIR"

log "Running pnpm dbgenerate"
pnpm dbgenerate

log "Running pnpm dbmigrate"
pnpm dbmigrate

log "Running pnpm dbseed"
pnpm dbseed

log "Done"
