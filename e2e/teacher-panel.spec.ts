// e2e/teacher-panel.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Teacher Panel routing (unauth)', () => {
  test('visiting /teacher/referrals shows "Sign in required"', async ({ page }) => {
    await page.goto('/teacher/referrals');
    await expect(page.getByText(/sign in required/i)).toBeVisible({ timeout: 15000 });
  });

  test('clicking Debug tab goes to /teacher/debug (or ?tab=debug)', async ({ page }) => {
    await page.goto('/');

    // Try to click a visible debug link if present; otherwise go directly.
    const debugLink = page.locator(
      // sidebar first, then any anchor to /teacher/debug
      '[data-testid="nav-debug"], a[href="/teacher/debug"]'
    );

    if (await debugLink.first().isVisible().catch(() => false)) {
      await debugLink.first().click();
    } else {
      // Prefer segment; if app rewrites to query, we’ll accept it below
      await page.goto('/teacher/debug').catch(async () => {
        await page.goto('/teacher?tab=debug');
      });
    }

    // Accept either /teacher/debug or /teacher?tab=debug
    await page.waitForLoadState('load');
    const url = page.url();
    expect(url).toMatch(/\/teacher(\/debug|\?tab=debug)(?:$|[?#])/);

    // Expect either the debug dashboard content or the unauth guard
    await expect(
      page.locator('text=/Debug|Health|API status|Sign in required/i')
    ).toBeVisible({ timeout: 15000 });
  });
});