import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:5000';

test.describe('Teacher Panel routing (unauth)', () => {
  test('visiting /teacher/referrals shows unauth OR the referrals UI', async ({ page }) => {
    await page.goto(`${BASE}/teacher/referrals`, { waitUntil: 'networkidle' });

    // Accept either an unauth screen OR a real referrals screen
    const unauthCandidates = [
      page.getByRole('button', { name: /sign in/i }),
      page.getByRole('link',   { name: /sign in/i }),
      page.getByText(/sign in required|sign in to continue|unauthorized|please sign in/i),
    ];

    const referralsCandidates = [
      page.getByRole('heading', { name: /referrals/i }),           // H1/H2 “Referrals”
      page.getByText(/invite|copy link|share.*link/i),             // CTA-ish copy
      page.getByTestId('referrals-root'),                          // if you add a test id later
    ];

    async function anyVisible(list: Array<ReturnType<typeof page.locator>>) {
      for (const el of list) {
        if (await el.count()) {
          try { await expect(el.first()).toBeVisible({ timeout: 2000 }); return true; } catch {}
        }
      }
      return false;
    }

    const sawUnauth = await anyVisible(unauthCandidates);
    const sawReferrals = await anyVisible(referralsCandidates);

    expect(sawUnauth || sawReferrals).toBeTruthy();
  });

  test('clicking Debug tab goes to /teacher/debug', async ({ page }) => {
    await page.goto(`${BASE}/teacher/referrals`, { waitUntil: 'networkidle' });

    const devNav = page.getByTestId('nav-dev');
    if (await devNav.count()) {
      await devNav.click();
    } else {
      await page.getByRole('link', { name: /^dev$/i }).first().click();
    }

    await page.waitForURL(/\/teacher\/debug$/);
    await expect(page.getByRole('heading', { name: /debug dashboard/i })).toBeVisible();
  });
});
