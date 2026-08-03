#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

log() { printf "[%s] %s\n" "$(date '+%Y-%m-%d %H:%M:%S')" "$*"; }

trap 'log "Error on line $LINENO"; exit 1' ERR

cd "$PROJECT_DIR"

if ! command -v pnpm >/dev/null 2>&1; then
	log "pnpm is not installed or not on PATH"
	exit 1
fi

# Coolify injects env vars into the process environment. Locally we still support
# loading from .env when present; dotenv-cli fails if the file is missing.
run_with_env() {
	if [[ -f .env ]]; then
		pnpm exec dotenv -e .env -o -- "$@"
	else
		pnpm exec "$@"
	fi
}

log "Running prisma migrate deploy"
run_with_env prisma migrate deploy

log "Running data migrations"
run_with_env tsx scripts/dataMigrations/runDataMigrations.ts

log "Post-deployment steps complete"
