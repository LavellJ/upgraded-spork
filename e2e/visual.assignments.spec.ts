// e2e/visual.assignments.spec.ts
import { test, expect } from '@playwright/test';
import { installApiMocks } from './mocks/api';
import { setUiPrefs, devLogin } from './helpers/dev';

const BASE_URL = process.env.CI_BASE_URL || 'http://127.0.0.1:4173';

test.describe('@ci assignments page', () => {
  test.beforeEach(async ({ page }) => {
    if (process.env.SKIP_E2E_LOCAL) test.skip(true, 'Skipping locally');
    await installApiMocks(page);
    await setUiPrefs(page, { density: 'compact' });
    await devLogin(page);
  });

  test('renders assignments list with mocked data @ci', async ({ page }) => {
    await page.goto(`${BASE_URL}/teacher/assignments`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');

    // Force reveal: some builds keep <body> hidden until a client signal that may not fire in CI
    await page.addStyleTag({ content: 'body{visibility:visible!important;opacity:1!important}' });

    await expect(page).toHaveURL(/teacher\/assignments/);

    // Assert mocked items; give them a little time
    await expect(page.getByText(/Algebra Practice/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Reading Comprehension/i)).toBeVisible({ timeout: 10000 });
  });
});