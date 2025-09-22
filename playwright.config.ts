// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: [
    ['line'],
    ['html', { open: 'never' }],
  ],

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  // ✅ Define the chromium project so `--project=chromium` works
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Alternatively: browserName: 'chromium'
      },
    },
    // If you later want firefox/webkit, uncomment:
    // { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    // { name: 'webkit',  use: { ...devices['Desktop Safari'] } },
  ],

  webServer: {
    // Build and start the server with required env
    command: `bash -lc 'set -euo pipefail; mkdir -p .data .backups; npm run build; \
      JWT_SECRET=ci_jwt_secret_please_rotate \
      DATABASE_URL=file:.data/qi.db \
      APP_BASE_URL=http://localhost:5000 \
      npx tsx server/index.ts'`,
    url: 'http://localhost:5000',
    timeout: 300_000,
    reuseExistingServer: !process.env.CI,
  },
})