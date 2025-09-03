#!/bin/bash
# Script to run Playwright E2E tests for LearnOz

echo "🎭 Running LearnOz E2E Test Suite"
echo "================================="

# Check if app is running
if ! curl -s http://localhost:5000 > /dev/null; then
    echo "❌ App not running on port 5000. Please start with 'npm run dev'"
    exit 1
fi

echo "✅ App is running on port 5000"

# Run tests
echo ""
echo "🧪 Running E2E tests..."
npx playwright test --reporter=line

echo ""
echo "📊 To view detailed HTML report:"
echo "npx playwright show-report"