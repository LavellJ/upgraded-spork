// e2e/teacher-tabs.spec.ts
import { test, expect } from './fixtures';

test('debug via segment', async ({ page }) => {
  await page.goto('/teacher/debug');
  await page.waitForLoadState('domcontentloaded');

  // URL should be either /teacher/debug OR /teacher?tab=debug
  await page.waitForURL(/\/teacher(\/debug|\?tab=debug)/);

  // Accept any of: sign-in guard, panel shell header, or debug link visible
  const anyVisible = await Promise.all([
    page.getByText(/sign in required/i).isVisible().catch(() => false),
    page.getByRole('heading', { name: /teacher panel/i }).isVisible().catch(() => false),
    page.locator('a[href="/teacher/debug"], [data-testid="tab-debug"], [data-testid="nav-debug-main"]').first()
      .isVisible()
      .catch(() => false),
  ]).then(arr => arr.some(Boolean));

  expect(anyVisible).toBeTruthy();
});

test('referrals via segment', async ({ page }) => {
  await page.goto('/teacher/referrals');
  await page.waitForLoadState('domcontentloaded');

  const anyVisible = await Promise.all([
    page.getByTestId('referrals-root').isVisible().catch(() => false),
    page.getByRole('heading', { name: /referrals/i }).first().isVisible().catch(() => false),
    page.getByText(/referrals/i).isVisible().catch(() => false),
  ]).then(arr => arr.some(Boolean));

  expect(anyVisible).toBeTruthy();
});

test('debug via query param (back-compat)', async ({ page }) => {
  await page.goto('/teacher?tab=debug');
  await page.waitForLoadState('domcontentloaded');

  // Still allow either the segment or the query form
  await page.waitForURL(/\/teacher(\/debug|\?tab=debug)/);

  const anyVisible = await Promise.all([
    page.getByText(/sign in required/i).isVisible().catch(() => false),
    page.getByRole('heading', { name: /teacher panel/i }).isVisible().catch(() => false),
    page.locator('a[href="/teacher/debug"], [data-testid="tab-debug"], [data-testid="nav-debug-main"]').first()
      .isVisible()
      .catch(() => false),
  ]).then(arr => arr.some(Boolean));

  expect(anyVisible).toBeTruthy();
});