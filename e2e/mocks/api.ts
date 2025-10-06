import { Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function fixture(name: string): string {
  const file = path.join(__dirname, '../fixtures', name);
  return fs.readFileSync(file, 'utf-8');
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
    await route.fulfill({
      status: 200,
      headers: { 'content-type': 'application/json' },
      body: '[]',
    });
  });
}