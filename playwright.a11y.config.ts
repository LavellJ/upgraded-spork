import { defineConfig } from '@playwright/test';
import fs from 'fs';
import { execSync } from 'node:child_process';

const has = (p: string) => fs.existsSync(p);
const distDir = has('./client/dist') ? './client/dist' : './dist';
const distIndex = `${distDir}/index.html`;

if (!has(distIndex)) {
  console.log(`🔧 No build found at ${distIndex} — running "npm run build"`);
  execSync('npm run build', { stdio: 'inherit' });
}

export default defineConfig({
  timeout: 60000,
  use: { baseURL: 'http://127.0.0.1:4173' },
  webServer: {
    command: `npx http-server ${distDir} -p 4173 --silent`,
    port: 4173,
    reuseExistingServer: !process.env.CI,
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});
