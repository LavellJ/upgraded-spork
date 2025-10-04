import { test, expect } from '@playwright/test';

test('smoke @ci', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/127\.0\.0\.1|localhost|\/$/);
});
