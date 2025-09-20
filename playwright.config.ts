// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

const isFull = process.env.FULL_E2E === '1';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['line']] : [['html'], ['line']],

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5000',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // ✅ Build first so /dist/public/index.html exists, then start the unified server
  webServer: {
    command: `bash -lc 'set -euo pipefail
      mkdir -p .data .backups
      # Build client → emits dist/public/*
      npm run build
      # Start server with required env
      JWT_SECRET=ci_jwt_secret_please_rotate_xxxx \\
      DATABASE_URL=file:.data/qi.db \\
      APP_BASE_URL=http://localhost:5000 \\
      node --loader tsx server/index.ts
    '`,
    url: 'http://localhost:5000',
    timeout: 300_000,               // allow extra time in cold CI
    reuseExistingServer: !process.env.CI,
  },

  // Optional: keep your HEAVY_SPECS/quarantine filtering if you already added it
  // testIgnore: isFull ? [] : [
  //   'e2e/a11y*.spec.ts',
  //   'e2e/art.*.spec.ts',
  //   'e2e/visual.*.spec.ts',
  //   'e2e/offline*.spec.ts',
  //   'e2e/hero-full.spec.ts',
  //   // ...etc
  // ],
});