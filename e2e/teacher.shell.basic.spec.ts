import { test, expect } from '@playwright/test';

const tabs = ['overview','quickstart','timeline','assignments','content','roster','classes','dashboard','studio','qa'];

for (const tab of tabs) {
  test(`shell visible on ${tab}`, async ({ page }) => {
    await page.goto(`/#/guide?tab=${tab}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
}