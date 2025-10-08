// e2e/visual.assignments.spec.ts
import { test, expect } from '@playwright/test';
import { installApiMocks } from './mocks/api';
import { setUiPrefs, devLogin } from './helpers/dev';

const BASE_URL = process.env.CI_BASE_URL || 'http://127.0.0.1:4173';

test.describe('@ci assignments page', () => {
  test.beforeEach(async ({ page }) => {
    // In CI this will be unset/empty so tests run; locally you can export SKIP_E2E_LOCAL=1 to skip
    if (process.env.SKIP_E2E_LOCAL) test.skip(true, 'Skipping locally');

    // Install mocks + stable UI + fake auth before any navigation
    await installApiMocks(page);
    await setUiPrefs(page, { density: 'compact' });
    await devLogin(page);
  });

  test('renders assignments list with mocked data @ci', async ({ page }) => {
    await page.goto(`${BASE_URL}/teacher/assignments`, { waitUntil: 'domcontentloaded' });

    // 🛠 stability boost: allow all network to settle (mocked routes, fonts, etc.)
    await page.waitForLoadState('networkidle');

    // Sanity: page is up and we’re on the right route
    await expect(page.locator('body')).toBeVisible();
    await expect(page).toHaveURL(/teacher\/assignments/);

    // Mocked items should be visible
    await expect(page.getByText(/Algebra Practice/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Reading Comprehension/i)).toBeVisible({ timeout: 10000 });
  });
});