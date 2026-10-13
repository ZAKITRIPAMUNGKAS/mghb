#!/usr/bin/env bash
set -euo pipefail

# Zero-downtime Blue/Green deployment for OTP
CURRENT_TARGET="${1:-green}"

echo "Deploying to ${CURRENT_TARGET}..."
docker compose -f infra/docker-compose.yml up -d "otp-${CURRENT_TARGET}"

echo "Waiting for healthcheck on ${CURRENT_TARGET}..."
until curl -sf "http://localhost:$([ "$CURRENT_TARGET" = "blue" ] && echo "8080" || echo "8081")/otp/actuators/health" | grep -q "UP"; do
  printf '.'
  sleep 3
done
echo " Target is healthy!"

echo "Swapping traffic and stopping old instance..."
# In production, swap reverse proxy upstream (e.g. nginx or Caddy)
