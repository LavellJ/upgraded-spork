// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',                       // location of your e2e tests
  fullyParallel: true,                    // run in parallel
  forbidOnly: !!process.env.CI,           // fail CI if .only is left in
  retries: process.env.CI ? 2 : 0,        // retry on CI, not locally
  workers: process.env.CI ? 1 : undefined,

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5000',
    trace: 'on-first-retry',              // helpful for debugging
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  webServer: {
    // Build static assets and start server with correct env
    command: `bash -lc 'set -euo pipefail; mkdir -p .data .backups; npm run build; \
      JWT_SECRET=ci_jwt_secret_please_rotate \
      DATABASE_URL=file:.data/qi.db \
      APP_BASE_URL=http://localhost:5000 \
      npx tsx server/index.ts'`,
    url: 'http://localhost:5000',
    timeout: 300_000,                     // allow up to 5 minutes in CI
    reuseExistingServer: !process.env.CI, // reuse when running locally
  },

  reporter: [
    ['line'],                             // simple output in CI
    ['html', { open: 'never' }],          // keep HTML report artifacts
  ],
});