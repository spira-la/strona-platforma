#!/usr/bin/env bash
set -euo pipefail

# =====================================================================
# Spirala — Manual rebuild script
# Run from the project root directory (where docker-compose files live)
# =====================================================================

echo ""
echo "  ╔═══════════════════════════════════════╗"
echo "  ║       Spirala — Rebuild Script         ║"
echo "  ╚═══════════════════════════════════════╝"
echo ""

# ---------------------------------------------------------------------------
# 1. Choose environment
# ---------------------------------------------------------------------------
echo "  Entorno:"
echo "    1) Dev"
echo "    2) Prod"
echo ""
read -rp "  Selecciona [1/2]: " ENV_CHOICE

case "$ENV_CHOICE" in
  1)
    ENV="dev"
    BRANCH="dev"
    BE_COMPOSE="docker-compose.dev.yml"
    FE_COMPOSE="docker-compose.dev.yml"
    ENV_FILE=".env.development"
    BE_HEALTH="http://localhost:45002/api/health"
    FE_HEALTH="http://localhost:45000/health"
    ;;
  2)
    ENV="prod"
    BRANCH="main"
    BE_COMPOSE="docker-compose.yml"
    FE_COMPOSE="docker-compose.prod.yml"
    ENV_FILE=".env.production"
    BE_HEALTH="http://localhost:45003/api/health"
    FE_HEALTH="http://localhost:45001/health"
    ;;
  *)
    echo "  Opcion invalida. Saliendo."
    exit 1
    ;;
esac

echo ""
echo "  Entorno: $ENV (branch: $BRANCH)"
echo ""

# ---------------------------------------------------------------------------
# 2. Choose what to rebuild
# ---------------------------------------------------------------------------
echo "  Que quieres reconstruir?"
echo "    1) Todo (git pull + migraciones + backend + frontend + nginx)"
echo "    2) Solo backend"
echo "    3) Solo frontend"
echo "    4) Solo nginx router"
echo "    5) Solo migraciones (sin rebuild)"
echo "    6) Backend + Frontend (sin nginx)"
echo ""
read -rp "  Selecciona [1-6]: " ACTION

echo ""
echo "  ─────────────────────────────────────────"

# ---------------------------------------------------------------------------
# Helper functions
# ---------------------------------------------------------------------------
pull_latest() {
  echo ""
  echo "  [1/5] Pulling latest from origin/$BRANCH..."
  git fetch --all --prune --force
  git reset --hard "origin/$BRANCH"
  echo "  Done."
}

run_migrations() {
  echo ""
  echo "  [2/5] Running database migrations..."
  cd backend
  if [ -f "$ENV_FILE" ]; then
    set -a
    source "$ENV_FILE"
    set +a
    export NODE_TLS_REJECT_UNAUTHORIZED=0
    npm ci --silent 2>/dev/null || npm install --silent
    npm run db:migrate 2>&1 || echo "  WARNING: migration failed or no pending migrations"
  else
    echo "  WARNING: $ENV_FILE not found, skipping migrations"
  fi
  cd ..
  echo "  Done."
}

rebuild_backend() {
  echo ""
  echo "  [3/5] Rebuilding backend..."
  cd backend
  docker compose -f "$BE_COMPOSE" build --no-cache
  docker compose -f "$BE_COMPOSE" up -d --force-recreate
  cd ..
  echo "  Waiting for backend health check..."
  for i in $(seq 1 15); do
    if curl -sf "$BE_HEALTH" > /dev/null 2>&1; then
      echo "  Backend healthy (attempt $i)"
      return 0
    fi
    sleep 2
  done
  echo "  WARNING: Backend health check failed after 30s"
}

rebuild_frontend() {
  echo ""
  echo "  [4/5] Rebuilding frontend..."
  docker compose -f "$FE_COMPOSE" build --no-cache
  docker compose -f "$FE_COMPOSE" up -d --force-recreate
  sleep 3
  if curl -sf "$FE_HEALTH" > /dev/null 2>&1; then
    echo "  Frontend healthy"
  else
    echo "  WARNING: Frontend health check failed"
  fi
}

restart_nginx() {
  echo ""
  echo "  [5/5] Restarting nginx router..."
  docker compose -f docker-compose.nginx.yml down
  docker compose -f docker-compose.nginx.yml up -d
  echo "  Nginx router restarted."
}

cleanup() {
  echo ""
  echo "  Cleaning up dangling images..."
  docker image prune -f
  echo "  Done."
}

# ---------------------------------------------------------------------------
# 3. Execute
# ---------------------------------------------------------------------------
case "$ACTION" in
  1) # Todo
    pull_latest
    run_migrations
    rebuild_backend
    rebuild_frontend
    restart_nginx
    cleanup
    ;;
  2) # Solo backend
    pull_latest
    run_migrations
    rebuild_backend
    cleanup
    ;;
  3) # Solo frontend
    pull_latest
    rebuild_frontend
    cleanup
    ;;
  4) # Solo nginx
    pull_latest
    restart_nginx
    ;;
  5) # Solo migraciones
    pull_latest
    run_migrations
    ;;
  6) # Backend + Frontend
    pull_latest
    run_migrations
    rebuild_backend
    rebuild_frontend
    cleanup
    ;;
  *)
    echo "  Opcion invalida. Saliendo."
    exit 1
    ;;
esac

echo ""
echo "  ═══════════════════════════════════════"
echo "  Rebuild completo ($ENV)"
echo "  ═══════════════════════════════════════"
echo ""
