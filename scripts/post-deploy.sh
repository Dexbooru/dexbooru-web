#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

log() { printf "[%s] %s\n" "$(date '+%Y-%m-%d %H:%M:%S')" "$*"; }

trap 'log "Error on line $LINENO"; exit 1' ERR

cd "$PROJECT_DIR"

log "Running pnpm dbpredeploy"
pnpm dbpredeploy

log "Running pnpm datamigration:run"
pnpm datamigration:run

log "Post-deployment steps complete"
