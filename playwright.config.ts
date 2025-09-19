import { defineConfig } from '@playwright/test';

export default defineConfig({
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5000',
  },
  webServer: {
    // Ensure runtime dirs exist AND provide required env vars
    command: `bash -lc 'mkdir -p .data .backups && \
      JWT_SECRET=ci_jwt_secret_please_rotate \
      DATABASE_URL=file:.data/qi.db \
      APP_BASE_URL=http://localhost:5000 \
      npx tsx server/index.ts'`,
    url: 'http://localhost:5000',
    timeout: 240_000,                 // give it up to 4 minutes to boot in CI
    reuseExistingServer: !process.env.CI,
  },
});