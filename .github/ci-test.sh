#!/bin/bash
set -euo pipefail

echo "🔎 Repo sanity:"
pwd
ls -la | head -20

echo "📦 Install dependencies (monorepo)…"
# Prefer npm ci if lockfile exists
if [ -f package-lock.json ]; then 
  npm ci
else 
  npm i
fi

echo "🏗️ Build application (Vite)…"
npm run build

echo "🧪 Verify build output:"
ls -la dist/public | head -10

echo "🚀 Serve the built SPA (dist/public) on :4173…"
npx http-server dist/public -p 4173 --spa --silent &
SERVER_PID=$!
npx wait-on http://127.0.0.1:4173

echo "🔁 Sanity check a shimmed route:"
curl -sI "http://127.0.0.1:4173/island?shim=1" | sed -n '1,5p'

echo "🎭 Run @ci tests against the built SPA:"
PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=1 npx playwright test --project=chromium --grep "@ci" --reporter=line --trace on

echo "🧹 Cleanup:"
kill $SERVER_PID || true

echo "✅ CI test complete!"
