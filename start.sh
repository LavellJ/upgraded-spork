#!/bin/bash
# Replit development startup script
echo "Building frontend..."
npm run build
echo "Starting unified Express server..."
npx tsx server/index.ts