#!/usr/bin/env bash
set -euo pipefail

# Spirala Ollama Setup — shared between dev and prod environments
# Run once on the server, or triggered by infra pipeline.

COMPOSE_FILE="$(dirname "$0")/docker-compose.ollama.yml"
MODEL="qwen2.5:3b"
CONTAINER="spirala-ollama"

echo "==> Starting Ollama container..."
docker compose -f "$COMPOSE_FILE" up -d --force-recreate

echo "==> Waiting for Ollama to be ready..."
for i in $(seq 1 30); do
  if curl -sf http://localhost:45020/ > /dev/null 2>&1; then
    echo "    Ollama ready (attempt $i)"
    break
  fi
  echo "    Waiting... (attempt $i/30)"
  sleep 2
done

# Check if model already exists
if docker exec "$CONTAINER" ollama list 2>/dev/null | grep -q "$MODEL"; then
  echo "==> Model $MODEL already present, skipping pull."
else
  echo "==> Pulling model $MODEL (~2GB, this may take a few minutes)..."
  docker exec "$CONTAINER" ollama pull "$MODEL"
fi

echo "==> Verifying model..."
docker exec "$CONTAINER" ollama list

echo "==> Done. Ollama running on port 45020 with model $MODEL"
echo "    Both dev and prod backends can reach it at http://localhost:45020"
