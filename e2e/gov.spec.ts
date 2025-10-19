import { test, expect } from './fixtures';

test.describe.configure({ mode: 'parallel' });

test.describe('Governance Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
  });

  test('Audit System › should log privacy-related events correctly', async ({ page }) => {
    test.setTimeout(120_000);

    await test.step('Open Audit Log UI', async () => {
      await page.getByRole('link', { name: /audit/i }).click();
      await expect(page).toHaveURL(/\/audit/i, { timeout: 15_000 });
      await expect(page.getByRole('heading', { name: /audit/i })).toBeVisible();
    });

    await test.step('Trigger privacy event', async () => {
      const toggle = page.getByTestId('privacy-optin-toggle');
      if (await toggle.isVisible().catch(() => false)) {
        await toggle.click();
      } else {
        await page.getByRole('button', { name: /settings/i }).click();
        await page.getByRole('switch', { name: /privacy/i }).click();
      }
    });

    await test.step('Verify audit entry', async () => {
      const rows = page.locator('[data-testid="audit-row"]');
      await expect.poll(async () => await rows.count(), {
        message: 'Waiting for at least one audit row',
        timeout: 30_000,
        intervals: [500, 750, 1000],
      }).toBeGreaterThan(0);

      const latest = rows.first();
      await expect(latest.getByTestId('audit-event')).toContainText(/privacy|consent|pii/i);
      await expect(latest.getByTestId('audit-user')).toHaveText(/system|admin|test/i);
      await expect(latest.getByTestId('audit-timestamp')).toBeVisible();

      const detailsBtn = latest.getByRole('button', { name: /details|expand/i });
      if (await detailsBtn.isVisible().catch(() => false)) {
        await detailsBtn.click();
        const jsonView = page.getByTestId('audit-json');
        await expect(jsonView).toBeVisible();
        await expect(jsonView).toContainText(/eventType|entity|timestamp/i);
      }
    });
  });

  test('Kill Switches › feature flags can disable sensitive flows', async ({ page }) => {
    test.setTimeout(90_000);

    await test.step('Open Feature Flags', async () => {
      await page.getByRole('link', { name: /governance|flags|kill/i }).click();
      await expect(page).toHaveURL(/\/flags|\/governance/i);
      await expect(page.getByRole('heading', { name: /feature flags|governance/i })).toBeVisible();
    });

    await test.step('Disable flag and verify effect', async () => {
      const flag = page.getByTestId('flag-sensitive-op');
      await expect(flag).toBeVisible();
      const toggle = flag.getByRole('switch');

      if ((await toggle.getAttribute('aria-checked')) !== 'false') {
        await toggle.click();
      }
      await expect(toggle).toHaveAttribute('aria-checked', 'false');

      await page.getByRole('link', { name: /start sensitive flow/i }).click();
      await expect(page.getByTestId('blocked-banner')).toBeVisible();
      await expect(page.getByTestId('blocked-banner')).toContainText(/disabled|kill switch|flag/i);
    });
  });
});
