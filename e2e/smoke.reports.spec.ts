// e2e/smoke.reports.spec.ts
import { test, expect } from '@playwright/test';
import { forceRevealBodyIfCI } from './helpers/ci';
import { installApiMocks } from './mocks/api';
import { setUiPrefs, devLogin } from './helpers/dev';

const BASE_URL = process.env.CI_BASE_URL ?? 'http://127.0.0.1:4173';
const REPORTS_PATHS = [process.env.CI_REPORTS_PATH || '/teacher/reports', '/reports'];

test.describe('@ci reports smoke', () => {
  test.beforeEach(async ({ page }) => {
    if (process.env.SKIP_E2E_LOCAL) test.skip(true, 'Skipping locally');
    await installApiMocks(page);
    await setUiPrefs(page, { density: 'compact' });
    await devLogin(page); // ensure the app fetches teacher data
  });

  test('@ci smoke: reports route serves and trends request made', async ({ page }) => {
    let trendsSeen = false;

    // mark when trends is requested
    page.on('request', (req) => {
      if (/\/api\/.*reports.*trends/i.test(req.url())) trendsSeen = true;
    });

    for (const path of REPORTS_PATHS) {
      const trendsResp = page
        .waitForResponse((res) => /\/api\/.*reports.*trends/i.test(res.url()), { timeout: 3000 })
        .catch(() => null);

      await page.goto(`${BASE_URL}${path}`, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle');
      await forceRevealBodyIfCI(page);

      if (trendsSeen || (await trendsResp)) break;
    }

    await expect(page.locator('body')).toBeVisible();
    expect(trendsSeen).toBeTruthy();
  });
});