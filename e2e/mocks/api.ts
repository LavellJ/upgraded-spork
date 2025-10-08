import { Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

// Use CWD so it works in both CJS/ESM and on GitHub runners
const fixturesDir = path.join(process.cwd(), 'e2e', 'fixtures');

function fixture(name: string): string {
  return fs.readFileSync(path.join(fixturesDir, name), 'utf-8');
}

export async function installApiMocks(page: Page) {
  await page.route('**/api/reports/trends', async (route) => {
    const body = fixture('reports-trends.json');
    await route.fulfill({ status: 200, headers: { 'content-type': 'application/json' }, body });
  });

  await page.route('**/api/assignments', async (route) => {
    const body = fixture('assignments-list.json');
    await route.fulfill({ status: 200, headers: { 'content-type': 'application/json' }, body });
  });

  await page.route('**/api/**', async (route) => {
    await route.fulfill({ status: 200, headers: { 'content-type': 'application/json' }, body: '[]' });
  });
}