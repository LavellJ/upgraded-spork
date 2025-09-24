import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.PORT || 4173);

export default defineConfig({
  timeout: 30_000,
  expect: { timeout: 10_000 },
  retries: process.env.CI ? 2 : 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    viewport: { width: 1366, height: 800 },
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    // Load .env into the process, then build and preview
    command: 'bash -lc "set -a; [ -f .env ] && source .env; set +a; npm run build && npm run preview"',
    port: PORT,
    timeout: 180_000,
    reuseExistingServer: !process.env.CI,
  },
});
