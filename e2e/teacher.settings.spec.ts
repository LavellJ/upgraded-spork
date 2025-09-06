import { test, expect } from '@playwright/test';

const tabs = ['appearance','privacy','consent','reports','dev','audit','pilot','funnel'];

for (const tab of tabs) {
  test(`settings page has list UI: ${tab}`, async ({ page }) => {
    await page.goto(`/#/guide?tab=${tab}`);
    await page.waitForSelector('.list-card', { timeout: 5000 });
    const rows = await page.locator('.list-card .list-row').count();
    expect(rows).toBeGreaterThan(0);
  });
}