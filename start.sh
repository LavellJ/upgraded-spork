#!/usr/bin/env bash
set -euo pipefail
export NODE_ENV="${NODE_ENV:-development}"
export PORT="${PORT:-5000}"
export HOST="0.0.0.0"
echo "[start.sh] Starting server on $HOST:$PORT ..."
exec npx tsx server/index.ts