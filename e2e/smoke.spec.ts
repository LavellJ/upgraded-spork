import { test, expect } from '@playwright/test';

const BASE_URL = process.env.CI_BASE_URL || 'http://127.0.0.1:4173';

test('@ci smoke: app boots and serves', async ({ page }) => {
  if (process.env.SKIP_E2E_LOCAL) test.skip(true, 'Skipping E2E locally (SKIP_E2E_LOCAL=1)');
  await page.goto(BASE_URL);
  await expect(page).toHaveURL(/(localhost|127\.0\.0\.1)/);
  await expect(page.locator('body')).toBeVisible();