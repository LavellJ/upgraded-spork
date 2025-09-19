// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5000',
  },
  webServer: {
    command: `bash -lc 'mkdir -p .data .backups && JWT_SECRET=devsecret APP_BASE_URL=http://localhost:5000 npx tsx server/index.ts'`,
    url: 'http://localhost:5000',
    timeout: 180_000,
    reuseExistingServer: !process.env.CI,
  },
});