// e2e/teacher-tabs.spec.ts
import { test, expect } from '@playwright/test';

test('debug via segment', async ({ page }) => {
  await page.goto('/teacher/debug');               // segment URL
  await page.waitForLoadState('load');

  // Accept either the debug dashboard heading or health text
  const heading = page.getByRole('heading', { name: /debug dashboard/i });
  const health  = page.getByText(/health:\s*ok:true/i);

  const seen = await Promise.all([heading.isVisible().catch(() => false), health.isVisible().catch(() => false)]);
  expect(seen.some(Boolean)).toBeTruthy();
});

test('referrals via segment', async ({ page }) => {
  await page.goto('/teacher/referrals');
  await page.waitForLoadState('load');

  // Prefer data-testid if present; otherwise fall back to a heading/text
  const byTestId = page.getByTestId('referrals-root');
  const byHeading = page.getByRole('heading', { name: /referrals/i }).first();
  const byText = page.getByText(/referrals/i);

  const vis = await Promise.all([
    byTestId.isVisible().catch(() => false),
    byHeading.isVisible().catch(() => false),
    byText.isVisible().catch(() => false),
  ]);
  expect(vis.some(Boolean)).toBeTruthy();
});

test('debug via query param (back-compat)', async ({ page }) => {
  await page.goto('/teacher?tab=debug');           // legacy query fallback
  await page.waitForLoadState('load');

  const heading = page.getByRole('heading', { name: /debug dashboard/i });
  const health  = page.getByText(/health:\s*ok:true/i);

  const seen = await Promise.all([heading.isVisible().catch(() => false), health.isVisible().catch(() => false)]);
  expect(seen.some(Boolean)).toBeTruthy();
});