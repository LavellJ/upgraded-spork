import { test, expect } from '@playwright/test';

test('debug via segment', async ({ page }) => {
  await page.goto('/teacher/debug');
  await expect(page.locator('text=Debug')).toBeVisible();
});

test('referrals via segment', async ({ page }) => {
  await page.goto('/teacher/referrals');
  await expect(page.locator('[data-testid="referrals-root"], text=Referrals')).toBeVisible();
});

test('debug via query param (back-compat)', async ({ page }) => {
  await page.goto('/teacher?tab=debug');
  await expect(page.locator('text=Debug')).toBeVisible();
});