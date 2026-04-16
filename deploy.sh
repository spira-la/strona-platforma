#!/bin/bash
# =====================================================================
# Spirala — Manual Deployment Script
# Interactive wrapper around the GitHub Actions pipelines
# (.github/workflows/deploy-dev.yml and deploy-prod.yml).
#
# Prompts for the target environment, syncs git, runs DB migrations,
# rebuilds backend + frontend containers, health-checks each service,
# and prunes dangling Docker images.
#
# Usage:
#   ./deploy.sh              # interactive prompt
#   ./deploy.sh dev          # skip prompt
#   ./deploy.sh prod
# =====================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# ─── Pick environment ─────────────────────────────────────────────────
TARGET="${1:-}"
if [ -z "$TARGET" ]; then
  echo "Which environment do you want to deploy?"
  echo "  1) dev"
  echo "  2) prod"
  read -r -p "Selection [1/2]: " choice
  case "$choice" in
    1|dev)  TARGET="dev"  ;;
    2|prod) TARGET="prod" ;;
    *) echo "Invalid selection"; exit 1 ;;
  esac
fi

case "$TARGET" in
  dev)
    GIT_BRANCH="dev"
    ENV_FILE="backend/.env.development"
    BACKEND_COMPOSE="docker-compose.dev.yml"
    FRONTEND_COMPOSE="docker-compose.dev.yml"
    BACKEND_HEALTH="http://localhost:45002/api/health"
    FRONTEND_HEALTH="http://localhost:45000/health"
    ;;
  prod)
    GIT_BRANCH="main"
    ENV_FILE="backend/.env.production"
    BACKEND_COMPOSE="docker-compose.yml"
    FRONTEND_COMPOSE="docker-compose.prod.yml"
    BACKEND_HEALTH="http://localhost:45003/api/health"
    FRONTEND_HEALTH="http://localhost:45001/health"
    ;;
  *)
    echo "Unknown target: $TARGET (expected 'dev' or 'prod')"
    exit 1
    ;;
esac

echo "=== Spirala Deployment: $TARGET ==="

# ─── Confirm prod ─────────────────────────────────────────────────────
if [ "$TARGET" = "prod" ]; then
  read -r -p "Deploying to PRODUCTION. Continue? [y/N] " confirm
  [[ "$confirm" =~ ^[Yy]$ ]] || { echo "Aborted"; exit 1; }
fi

# ─── Git sync ─────────────────────────────────────────────────────────
echo "--- Syncing git (origin/$GIT_BRANCH) ---"
git fetch --all --prune --force
git reset --hard "origin/$GIT_BRANCH"

# ─── Backend ─────────────────────────────────────────────────────────
echo "--- Deploying backend ---"
(
  cd backend

  if [ ! -f "../$ENV_FILE" ]; then
    echo "ERROR: $ENV_FILE not found"
    exit 1
  fi

  set -a
  # shellcheck disable=SC1090
  source "../$ENV_FILE"
  set +a
  export NODE_TLS_REJECT_UNAUTHORIZED=0

  npm ci
  npm run db:migrate 2>&1 || echo "WARNING: migration failed or no pending migrations"

  docker compose -f "$BACKEND_COMPOSE" build --no-cache
  docker compose -f "$BACKEND_COMPOSE" up -d --force-recreate
)

echo "--- Backend health check ---"
backend_ok=0
for i in $(seq 1 15); do
  if curl -sf "$BACKEND_HEALTH" > /dev/null 2>&1; then
    echo "Backend healthy (attempt $i)"
    backend_ok=1
    break
  fi
  echo "Waiting for backend... (attempt $i/15)"
  sleep 2
done
[ "$backend_ok" -eq 1 ] || echo "WARNING: backend health check failed after 30s"

# ─── Frontend ────────────────────────────────────────────────────────
echo "--- Deploying frontend ---"
if [ "$TARGET" = "prod" ]; then
  # Prod pipeline builds locally before packaging into the nginx image
  (
    cd frontend
    npm ci
    npm run build
  )
fi

docker compose -f "$FRONTEND_COMPOSE" build --no-cache
docker compose -f "$FRONTEND_COMPOSE" up -d --force-recreate

sleep 3
if curl -sf "$FRONTEND_HEALTH" > /dev/null 2>&1; then
  echo "Frontend healthy"
else
  echo "WARNING: frontend health check failed"
fi

# ─── Cleanup ─────────────────────────────────────────────────────────
echo "--- Pruning dangling Docker resources ---"
docker image prune -f
docker builder prune -af --filter "until=24h"

echo "=== Deployment to $TARGET complete ==="
