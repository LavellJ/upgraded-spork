#!/bin/bash
# Build and check bundle sizes

echo "🏗️  Building LearnOz..."
npm run build

echo ""
echo "📏 Checking bundle sizes..."
node scripts/check-bundlesize.mjs