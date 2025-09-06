import { test, expect } from '@playwright/test';

const tabs = ['overview','quickstart','timeline','assignments','content','roster','classes','dashboard','studio','qa'];

for (const tab of tabs) {
  test(`shell applies on ${tab}`, async ({ page }) => {
    await page.goto(`/#/guide?tab=${tab}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible(); // PageHeader title
    // at least one card or table
    const hasCardOrTable = await page.locator('.border').count();
    expect(hasCardOrTable).toBeGreaterThan(0);
  });
}