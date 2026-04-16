#!/usr/bin/env bash
set -euo pipefail

# Brings up the manually-managed infrastructure services that are NOT
# touched by the CI/CD pipeline:
#   - spirala-db       (PostgreSQL — dev + prod databases)
#   - spirala-redis    (cache — dev + prod)
#   - spirala-ollama   (LLM for translations)
#   - spirala-nginx    (reverse proxy)
#   - tunnel-spirala   (Cloudflare tunnel)
#
# Run this once on the server after reboot, or whenever you need to
# restore these services without disturbing the backend/frontend.

cd "$(dirname "$0")"

# Ensure shared networks exist before starting services that use them
# as external. Idempotent — does nothing if the network already exists.
docker network inspect spirala-dev-network >/dev/null 2>&1 \
  || docker network create spirala-dev-network
docker network inspect spirala-prod-network >/dev/null 2>&1 \
  || docker network create spirala-prod-network

# Ensure volumes for Redis exist before switching to external: true
docker volume inspect spirala-redis-dev-data >/dev/null 2>&1 \
  || docker volume create spirala-redis-dev-data
docker volume inspect spirala-redis-data >/dev/null 2>&1 \
  || docker volume create spirala-redis-data

echo "==> Starting PostgreSQL..."
docker compose -f docker-compose.db.yml up -d

echo "==> Starting Redis (dev + prod)..."
docker compose -f infra/docker-compose.redis.yml up -d

echo "==> Starting Ollama..."
docker compose -f infra/docker-compose.ollama.yml up -d

echo "==> Starting Nginx..."
docker compose -f docker-compose.nginx.yml up -d

echo "==> Starting Cloudflare Tunnel..."
docker compose -f docker-compose.tunnel.yml up -d

echo "==> Done. Status:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" \
  | grep -E "spirala-db|spirala-redis|spirala-ollama|spirala-nginx|tunnel-spirala" || true
