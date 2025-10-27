import { defineConfig } from '@playwright/test';
import fs from 'fs';
import { execSync } from 'node:child_process';

const candidates = [
  './dist/public',
  './client/dist',
  './dist',
  './client/build',
  './build',
];

function findDist() {
  for (const d of candidates) {
    if (fs.existsSync(`${d}/index.html`)) return d;
  }
  return null;
}

let distDir = findDist();
if (!distDir) {
  console.log('🔧 No built index.html found — running "npm run build"...');
  execSync('npm run build', { stdio: 'inherit' });
  distDir = findDist();
  if (!distDir) {
    throw new Error('❌ Could not find built index.html after build. Checked: ' + candidates.join(', '));
  }
}

console.log(`✅ Serving dist from: ${distDir}`);

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
