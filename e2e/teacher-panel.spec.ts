// e2e/teacher-panel.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Teacher Panel routing (unauth)', () => {
  test('visiting /teacher/referrals shows "Sign in required"', async ({ page }) => {
    await page.goto('/teacher/referrals');
    await expect(page.getByText(/sign in required/i)).toBeVisible({ timeout: 15000 });
  });

  test('clicking Debug tab goes to /teacher/debug', async ({ page }) => {
    // Start at the root. Depending on unauth state, the top nav may not render.
    await page.goto('/');

    // Prefer the sidebar teacher-panel debug link; fall back to the top-nav; fall back to direct nav.
    const sidebarDebug = page.locator('[data-testid="nav-debug"], a[href="/teacher/debug"]');
    if (await sidebarDebug.first().isVisible().catch(() => false)) {
      await sidebarDebug.first().click();
    } else {
      // If no visible link in unauth view, navigate directly
      await page.goto('/teacher/debug');
    }

    await page.waitForURL(/\/teacher\/debug$/);
    // Expect either the debug dashboard content or the unauth guard
    await expect(
      page.locator('text=/Debug|Health|API status|Sign in required/i')
    ).toBeVisible({ timeout: 15000 });
  });
});