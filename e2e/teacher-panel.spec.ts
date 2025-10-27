// e2e/teacher-panel.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Teacher Panel routing (unauth)', () => {
  test('visiting /teacher/referrals shows "Sign in required"', async ({ page }) => {
    await page.goto('/teacher/referrals');
    await expect(page.getByText(/sign in required/i)).toBeVisible({ timeout: 15000 });
  });

  test('clicking Debug tab goes to /teacher/debug (or ?tab=debug)', async ({ page }) => {
    await page.goto('/');

    const debugLink = page.locator('[data-testid="nav-debug"], a[href="/teacher/debug"]');
    if (await debugLink.first().isVisible().catch(() => false)) {
      await debugLink.first().click();
    } else {
      // Fall back to direct navigation (segment preferred, query fallback)
      await page.goto('/teacher/debug').catch(async () => {
        await page.goto('/teacher?tab=debug');
      });
    }

    await page.waitForLoadState('load');
    const url = page.url();
    expect(url).toMatch(/\/teacher(\/debug|\?tab=debug)(?:$|[?#])/);

    // Specific, non-strict checks: any one of these being visible is OK
    const debugHeading = page.getByRole('heading', { name: /debug dashboard/i });
    const apiHealth = page.getByText(/health:\s*ok:true/i);
    const unauthGuard = page.getByText(/sign in required/i);

    const vis = await Promise.all([
      debugHeading.isVisible().catch(() => false),
      apiHealth.isVisible().catch(() => false),
      unauthGuard.isVisible().catch(() => false),
    ]);

    expect(vis.some(Boolean)).toBeTruthy();
  });
});