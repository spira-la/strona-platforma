#!/bin/bash
# =====================================================================
# Spirala — Frontend Prod Deployment Script
# Builds the frontend on the current machine and launches the
# prod nginx container serving port 45001.
# =====================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== Deploying Spirala Frontend (Prod) ==="
echo "Directory: $SCRIPT_DIR"

# Load .env if present
if [ -f "$SCRIPT_DIR/.env" ]; then
  echo "Loading .env..."
  export $(grep -v '^#' "$SCRIPT_DIR/.env" | xargs)
fi

# Build the frontend
echo "--- Building frontend (production build) ---"
cd "$SCRIPT_DIR/frontend"
npm ci
npm run build

# Build Docker image and start container
echo "--- Building and starting Docker container ---"
cd "$SCRIPT_DIR"
export DOCKER_BUILDKIT=1 COMPOSE_DOCKER_CLI_BUILD=1
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d --force-recreate

# Wait for container to be ready
sleep 3

# Health check
if curl -sf http://localhost:45001/health > /dev/null; then
  echo "Frontend prod healthy at http://localhost:45001"
else
  echo "WARN: health check failed — check 'docker logs spirala-fe'"
fi

# Remove dangling images
echo "--- Cleaning up old images ---"
docker image prune -f --filter "until=24h"

echo "=== Done ==="
