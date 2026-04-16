#!/usr/bin/env bash
set -euo pipefail

# Brings up the manually-managed infrastructure services that are NOT
# touched by the CI/CD pipeline:
#   - spirala-nginx    (reverse proxy)
#   - tunnel-spirala   (Cloudflare tunnel)
#
# Run this once on the server after reboot, or whenever you need to
# restore these services without disturbing the backend/frontend.

cd "$(dirname "$0")"

echo "==> Starting Nginx..."
docker compose -f docker-compose.nginx.yml up -d

echo "==> Starting Cloudflare Tunnel..."
docker compose -f docker-compose.tunnel.yml up -d

echo "==> Done. Status:"
docker compose -f docker-compose.nginx.yml ps
docker compose -f docker-compose.tunnel.yml ps
