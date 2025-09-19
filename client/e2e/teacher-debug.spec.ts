import { test, expect } from '@playwright/test';

test('Teacher debug panel renders', async ({ page }) => {
  await page.goto('/teacher/debug');
  await expect(page.locator('text=Debug')).toBeVisible(); // adjust selector if needed
  // basic health check widget if present:
  await expect(page.locator('text=API')).toBeVisible();
});