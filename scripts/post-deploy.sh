#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

log() { printf "[%s] %s\n" "$(date '+%Y-%m-%d %H:%M:%S')" "$*"; }

trap 'log "Error on line $LINENO"; exit 1' ERR

cd "$PROJECT_DIR"

PRISMA_BIN="$PROJECT_DIR/node_modules/.bin/prisma"
TSX_BIN="$PROJECT_DIR/node_modules/.bin/tsx"
DOTENV_BIN="$PROJECT_DIR/node_modules/.bin/dotenv"

if [[ ! -x "$PRISMA_BIN" ]]; then
	log "prisma binary not found at $PRISMA_BIN"
	exit 1
fi

if [[ ! -x "$TSX_BIN" ]]; then
	log "tsx binary not found at $TSX_BIN"
	exit 1
fi

# Coolify injects env vars into the process environment. Locally we still support
# loading from .env when present; dotenv-cli fails if the file is missing.
run_with_env() {
	if [[ -f .env && -x "$DOTENV_BIN" ]]; then
		"$DOTENV_BIN" -e .env -o -- "$@"
	else
		"$@"
	fi
}

log "Running prisma migrate deploy"
run_with_env "$PRISMA_BIN" migrate deploy

log "Running data migrations"
run_with_env "$TSX_BIN" scripts/dataMigrations/runDataMigrations.ts

log "Post-deployment steps complete"
