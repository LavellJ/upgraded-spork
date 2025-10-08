// e2e/smoke.spec.ts
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.CI_BASE_URL ?? 'http://127.0.0.1:4173';

test('@ci smoke: app boots and serves', async ({ page }) => {
  if (process.env.SKIP_E2E_LOCAL) test.skip(true, 'Skipping E2E locally (SKIP_E2E_LOCAL=1)');

  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/(localhost|127\.0\.0\.1)/);

  const body = page.locator('body');
  await expect(body).toBeVisible({ timeout: 10000 });
});