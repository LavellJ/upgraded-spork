import { type Page } from '@playwright/test';

/**
 * Installs API mocks for stable E2E testing
 */
export async function installApiMocks(page: Page) {
  await page.route('**/api/reports/trends', async (route) => {
    const fixture = await import('../fixtures/reports-trends.json');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(fixture.default || fixture),
    });
  });

  await page.route('**/api/assignments', async (route) => {
    const fixture = await import('../fixtures/assignments-list.json');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(fixture.default || fixture),
    });
  });

  // Catch-all for other API routes - return empty array
  await page.route('**/api/**', async (route) => {
    // Skip if already handled by specific routes above
    const url = route.request().url();
    if (url.includes('/api/reports/trends') || url.includes('/api/assignments')) {
      return;
    }
    
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });
}
