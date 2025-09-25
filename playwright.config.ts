// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

const APP_URL = process.env.APP_BASE_URL || 'http://127.0.0.1:4173';

export default defineConfig({
  testDir: 'e2e',                  // adjust if your tests live elsewhere
  use: {
    baseURL: APP_URL,
    trace: 'on-first-retry',
  },
  // Let Playwright reuse the server your workflow starts on port 4173
  webServer: {
    command: 'npx http-server dist/public -p 4173 --silent',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // If you later want more browsers, uncomment:
    // { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    // { name: 'webkit',  use: { ...devices['Desktop Safari'] } },
  ],
});