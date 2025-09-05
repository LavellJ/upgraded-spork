import { test, expect, Page } from '@playwright/test';

/**
 * Governance Feature E2E Tests
 * Tests privacy compliance features including DSAR, erasure, and privacy strict mode
 */

test.describe('Governance Features', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto('/');
    
    // Wait for app to load
    await page.waitForSelector('[data-testid="app-loaded"]', { timeout: 10000 });
  });

  test.describe('Privacy Strict Mode', () => {
    test('should hide Growth tab when privacy strict mode enabled', async () => {
      // Navigate to feature flags panel (development mode)
      await page.click('[data-testid="button-dev-panel"]');
      await page.waitForSelector('[data-testid="panel-feature-flags"]');

      // Enable privacy strict mode
      await page.click('[data-testid="toggle-privacy-strict-mode"]');
      await page.waitForTimeout(500); // Allow state update

      // Navigate to Reports section
      await page.click('[data-testid="link-reports"]');
      await page.waitForSelector('[data-testid="reports-tabs"]');

      // Verify Growth tab is hidden
      const growthTab = page.locator('[data-testid="tab-growth"]');
      await expect(growthTab).not.toBeVisible();

      // Verify Trends and Audit tabs are still visible
      await expect(page.locator('[data-testid="tab-trends"]')).toBeVisible();
      await expect(page.locator('[data-testid="tab-audit"]')).toBeVisible();
    });

    test('should restrict referral UI when privacy strict mode enabled', async () => {
      // Enable privacy strict mode
      await page.click('[data-testid="button-dev-panel"]');
      await page.click('[data-testid="toggle-privacy-strict-mode"]');

      // Navigate to settings/growth area (if accessible)
      await page.goto('/settings');
      
      // Verify referral components are hidden
      const referralSection = page.locator('[data-testid="section-referrals"]');
      await expect(referralSection).not.toBeVisible();

      const inviteButton = page.locator('[data-testid="button-invite-teacher"]');
      await expect(inviteButton).not.toBeVisible();
    });

    test('should block non-essential analytics events in strict mode', async () => {
      // Setup console monitoring
      const consoleMessages: string[] = [];
      page.on('console', msg => {
        if (msg.text().includes('[Privacy] Blocked')) {
          consoleMessages.push(msg.text());
        }
      });

      // Enable privacy strict mode  
      await page.click('[data-testid="button-dev-panel"]');
      await page.click('[data-testid="toggle-privacy-strict-mode"]');

      // Trigger analytics events (scout interactions, etc.)
      await page.click('[data-testid="button-scout-help"]', { timeout: 5000 });
      
      // Wait for console message
      await page.waitForTimeout(1000);
      
      // Verify analytics events were blocked
      expect(consoleMessages.length).toBeGreaterThan(0);
      expect(consoleMessages[0]).toContain('[Privacy] Blocked non-essential event');
    });
  });

  test.describe('Data Subject Access Rights (DSAR)', () => {
    test('should submit DSAR request and generate export', async () => {
      // Navigate to Privacy Hub
      await page.click('[data-testid="link-privacy-hub"]');
      await page.waitForSelector('[data-testid="privacy-hub"]');

      // Click Data Export section
      await page.click('[data-testid="section-data-export"]');
      await page.waitForSelector('[data-testid="form-dsar-request"]');

      // Fill and submit DSAR form
      await page.fill('[data-testid="input-email"]', 'test@example.com');
      await page.fill('[data-testid="textarea-reason"]', 'Requesting all my data for personal records');
      
      await page.click('[data-testid="button-submit-dsar"]');

      // Verify success message
      await expect(page.locator('[data-testid="message-dsar-submitted"]')).toBeVisible();
      await expect(page.locator('[data-testid="message-dsar-submitted"]'))
        .toContainText('Data export request submitted successfully');

      // Verify request appears in management panel (if accessible)
      await page.click('[data-testid="tab-dsar-management"]');
      const requestRow = page.locator('[data-testid*="dsar-request-"]').first();
      await expect(requestRow).toBeVisible();
      await expect(requestRow).toContainText('test@example.com');
    });

    test('should generate and download CSV audit export', async () => {
      // Navigate to Privacy Hub → Audit Export
      await page.click('[data-testid="link-privacy-hub"]');
      await page.click('[data-testid="section-audit-export"]');

      // Configure export filters
      await page.selectOption('[data-testid="select-date-range"]', '30');
      await page.selectOption('[data-testid="select-action-type"]', 'all');

      // Setup download handler
      const downloadPromise = page.waitForEvent('download');
      
      // Trigger CSV export
      await page.click('[data-testid="button-export-csv"]');
      
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/audit-export-.*\.csv/);

      // Verify download completed
      await download.path();
    });
  });

  test.describe('Data Erasure (Right to be Forgotten)', () => {
    test('should submit erasure request with grace period', async () => {
      // Navigate to Privacy Hub → Data Erasure
      await page.click('[data-testid="link-privacy-hub"]');
      await page.click('[data-testid="section-data-erasure"]');

      // Fill erasure form
      await page.fill('[data-testid="input-email"]', 'erase@example.com');
      await page.fill('[data-testid="textarea-erasure-reason"]', 'No longer need the account');
      
      // Acknowledge warnings
      await page.check('[data-testid="checkbox-confirm-erasure"]');
      await page.check('[data-testid="checkbox-understand-permanent"]');

      await page.click('[data-testid="button-submit-erasure"]');

      // Verify grace period notification
      await expect(page.locator('[data-testid="message-grace-period"]')).toBeVisible();
      await expect(page.locator('[data-testid="grace-period-countdown"]')).toBeVisible();

      // Verify cancellation option available
      await expect(page.locator('[data-testid="button-cancel-erasure"]')).toBeVisible();
    });

    test('should allow cancellation during grace period', async () => {
      // Submit erasure request first
      await page.click('[data-testid="link-privacy-hub"]');
      await page.click('[data-testid="section-data-erasure"]');
      await page.fill('[data-testid="input-email"]', 'cancel@example.com');
      await page.check('[data-testid="checkbox-confirm-erasure"]');
      await page.click('[data-testid="button-submit-erasure"]');

      // Cancel the request
      await page.click('[data-testid="button-cancel-erasure"]');
      
      // Confirm cancellation
      await page.click('[data-testid="button-confirm-cancel"]');

      // Verify cancellation success
      await expect(page.locator('[data-testid="message-erasure-cancelled"]')).toBeVisible();
      await expect(page.locator('[data-testid="message-erasure-cancelled"]'))
        .toContainText('Data erasure request has been cancelled');
    });
  });

  test.describe('Feature Flag Kill-Switches', () => {
    test('should disable growth features with kill-switches', async () => {
      // Access development panel
      await page.click('[data-testid="button-dev-panel"]');
      
      // Disable invite features
      await page.click('[data-testid="toggle-enable-invites"]');
      await page.click('[data-testid="toggle-enable-referrals"]');
      
      // Navigate to areas where these features would appear
      await page.goto('/settings');
      
      // Verify features are disabled
      const inviteSection = page.locator('[data-testid="section-invites"]');
      const referralSection = page.locator('[data-testid="section-referrals"]');
      
      await expect(inviteSection).not.toBeVisible();
      await expect(referralSection).not.toBeVisible();
    });

    test('should disable share/rate prompts with kill-switches', async () => {
      // Disable share and rate prompts
      await page.click('[data-testid="button-dev-panel"]');
      await page.click('[data-testid="toggle-enable-share-prompt"]');
      await page.click('[data-testid="toggle-enable-rate-prompt"]');

      // Trigger conditions that would normally show prompts
      // (complete lessons, achieve milestones, etc.)
      await page.click('[data-testid="button-complete-lesson"]', { timeout: 5000 });
      
      // Wait for any potential prompts
      await page.waitForTimeout(2000);
      
      // Verify prompts don't appear
      const sharePrompt = page.locator('[data-testid="modal-share-prompt"]');
      const ratePrompt = page.locator('[data-testid="modal-rate-prompt"]');
      
      await expect(sharePrompt).not.toBeVisible();
      await expect(ratePrompt).not.toBeVisible();
    });
  });

  test.describe('Audit System', () => {
    test('should log privacy-related events correctly', async () => {
      // Navigate to Audit Viewer
      await page.click('[data-testid="link-reports"]');
      await page.click('[data-testid="tab-audit"]');
      
      // Clear existing logs for clean test
      await page.click('[data-testid="button-clear-filters"]');

      // Perform privacy-related actions
      await page.click('[data-testid="link-privacy-hub"]');
      await page.click('[data-testid="section-data-export"]');
      await page.fill('[data-testid="input-email"]', 'audit@test.com');
      await page.click('[data-testid="button-submit-dsar"]');

      // Return to audit viewer
      await page.click('[data-testid="link-reports"]');
      await page.click('[data-testid="tab-audit"]');

      // Verify DSAR event logged
      const auditEntry = page.locator('[data-testid*="audit-entry-"]').first();
      await expect(auditEntry).toBeVisible();
      await expect(auditEntry).toContainText('dsar_request');
      await expect(auditEntry).toContainText('audit@test.com');
    });

    test('should filter audit events in privacy strict mode', async () => {
      // Enable privacy strict mode
      await page.click('[data-testid="button-dev-panel"]');
      await page.click('[data-testid="toggle-privacy-strict-mode"]');

      // Generate various events
      await page.click('[data-testid="button-scout-help"]', { timeout: 5000 });
      await page.click('[data-testid="link-lesson-1"]', { timeout: 5000 });

      // Check audit logs
      await page.click('[data-testid="link-reports"]');
      await page.click('[data-testid="tab-audit"]');

      // Verify only essential events are shown
      const auditEntries = page.locator('[data-testid*="audit-entry-"]');
      const count = await auditEntries.count();
      
      // Should only see essential events (lesson_start, etc.)
      for (let i = 0; i < count; i++) {
        const entry = auditEntries.nth(i);
        const text = await entry.textContent();
        
        // Verify event type is in essential list
        const isEssential = ['lesson_start', 'lesson_finish', 'journal_start', 'journal_finish', 'tuning_applied', 'difficulty_adjusted'].some(
          eventType => text?.includes(eventType)
        );
        expect(isEssential).toBeTruthy();
      }
    });
  });

  test.afterEach(async () => {
    await page.close();
  });
});

/**
 * Helper function to simulate user interactions that generate events
 */
async function simulateUserActivity(page: Page) {
  // Complete a lesson
  await page.click('[data-testid="link-lesson-1"]', { timeout: 5000 });
  await page.waitForTimeout(1000);
  await page.click('[data-testid="button-start-lesson"]', { timeout: 5000 });
  await page.waitForTimeout(2000);
  await page.click('[data-testid="button-complete-lesson"]', { timeout: 5000 });

  // Use scout features  
  await page.click('[data-testid="button-scout-help"]', { timeout: 5000 });
  await page.waitForTimeout(500);
  
  // Navigate between sections
  await page.click('[data-testid="link-journal"]', { timeout: 5000 });
  await page.waitForTimeout(500);
  await page.click('[data-testid="link-campfire"]', { timeout: 5000 });
}