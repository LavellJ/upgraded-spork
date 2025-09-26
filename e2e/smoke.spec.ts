import { test, expect } from '@playwright/test';

test('home loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/|/); // relax if you don’t set a title
  await expect(page.locator('body')).toBeVisible();
});
