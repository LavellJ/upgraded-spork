// playwright.config.ts
import { defineConfig } from '@playwright/test';

const APP_URL = process.env.APP_BASE_URL || 'http://127.0.0.1:4173';

export default defineConfig({
  testDir: 'e2e',
  use: {
    baseURL: APP_URL,
    trace: 'on-first-retry',
  },
  webServer: {
    // Matches the server your workflow starts.
    command: 'npx http-server dist/public -p 4173 --silent',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: true,   // <<< THIS avoids the “already used” error
    timeout: 120_000,
  },
});