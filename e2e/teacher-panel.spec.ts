import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:5000';

test.describe('Teacher Panel routing (unauth)', () => {
  test('visiting /teacher/referrals shows an unauth screen (or sign-in affordance)', async ({ page }) => {
    await page.goto(`${BASE}/teacher/referrals`, { waitUntil: 'networkidle' });

    // Minimal contract: page renders (no crash/404)
    await expect(page).toHaveURL(/\/teacher\/(referrals|login|signin|debug)?/);

    // Be flexible about the unauth copy — check a few common variants.
    const candidates = [
      page.getByRole('button', { name: /sign in/i }),
      page.getByRole('link',   { name: /sign in/i }),
      page.getByText(/sign in required|sign in to continue|unauthorized|please sign in/i),
    ];

    let sawUnauth = false;
    for (const el of candidates) {
      if (await el.count()) {
        try {
          await expect(el.first()).toBeVisible({ timeout: 2000 });
          sawUnauth = true;
          break;
        } catch (_) { /* keep trying */ }
      }
    }

    expect(sawUnauth).toBeTruthy();
  });

  test('clicking Debug tab goes to /teacher/debug', async ({ page }) => {
    await page.goto(`${BASE}/teacher/referrals`, { waitUntil: 'networkidle' });

    // Prefer a unique and stable locator if present.
    const devNav = page.getByTestId('nav-dev');
    if (await devNav.count()) {
      await devNav.click();
    } else {
      // Fallback: click the tab by role/name if test id is missing.
      await page.getByRole('link', { name: /^dev$/i }).first().click();
    }

    await page.waitForURL(/\/teacher\/debug$/);
    // Assert a unique heading on the Debug page.
    await expect(page.getByRole('heading', { name: /debug dashboard/i })).toBeVisible();
  });
});
