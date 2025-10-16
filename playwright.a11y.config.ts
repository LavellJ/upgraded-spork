import { defineConfig } from '@playwright/test';
import fs from 'fs';

const dist = fs.existsSync('./client/dist') ? './client/dist' : './dist';

export default defineConfig({
  timeout: 60000,
  use: { baseURL: 'http://127.0.0.1:4173' },
  webServer: {
    command: `npx http-server ${dist} -p 4173 --silent`,
    port: 4173,
    reuseExistingServer: !process.env.CI,
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});
