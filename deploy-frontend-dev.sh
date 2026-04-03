#!/bin/bash
# =====================================================================
# Spirala — Frontend Dev Deployment Script
# Builds the frontend on the current machine and launches the
# dev nginx container serving port 45000.
# =====================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== Deploying Spirala Frontend (Dev) ==="
echo "Directory: $SCRIPT_DIR"

# Load .env if present
if [ -f "$SCRIPT_DIR/.env" ]; then
  echo "Loading .env..."
  export $(grep -v '^#' "$SCRIPT_DIR/.env" | xargs)
fi

# Build the frontend
echo "--- Building frontend (dev build) ---"
cd "$SCRIPT_DIR/frontend"
npm ci
npm run build:dev

# Build Docker image and start container
echo "--- Building and starting Docker container ---"
cd "$SCRIPT_DIR"
docker compose -f docker-compose.dev.yml build --no-cache
docker compose -f docker-compose.dev.yml up -d --force-recreate --remove-orphans

# Wait for container to be ready
sleep 3

# Health check
if curl -sf http://localhost:45000/health > /dev/null; then
  echo "Frontend dev healthy at http://localhost:45000"
else
  echo "WARN: health check failed — check 'docker logs spirala-fe-dev'"
fi

# Remove dangling images
echo "--- Cleaning up old images ---"
docker image prune -f --filter "until=24h"

echo "=== Done ==="
