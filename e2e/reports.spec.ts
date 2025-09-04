import { test, expect, type Page } from '@playwright/test';

/**
 * E2E tests for the reports functionality
 * Tests Trends view, Parent Email, and digest features
 */

async function setupLearnerData(page: Page) {
  // Navigate to home and ensure we have some test learners set up
  await page.goto('/');
  
  // Check if roster setup is needed (for fresh instances)
  const needsSetup = await page.locator('text="Welcome to LearnOz"').count();
  if (needsSetup > 0) {
    // Quick onboarding flow to get past initial setup
    await page.click('[data-testid="onboarding-continue"]');
    await page.fill('[data-testid="learner-name-input"]', 'Test Learner');
    await page.click('[data-testid="add-learner-btn"]');
    await page.click('[data-testid="complete-setup"]');
  }

  // Ensure we're on the main interface
  await expect(page.locator('[data-testid="main-navigation"]')).toBeVisible({ timeout: 10000 });
}

async function navigateToReports(page: Page) {
  // Navigate to reports tab
  await page.click('[data-testid="nav-reports"]');
  await expect(page.locator('text="Reports"')).toBeVisible();
}

test.describe('Reports E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await setupLearnerData(page);
  });

  test('Trends view: change week range and download CSV', async ({ page }) => {
    await navigateToReports(page);
    
    // Click on Cohort Trends
    await page.click('text="Cohort Trends"');
    await expect(page.locator('text="Cohort Trends Dashboard"')).toBeVisible();
    
    // Change week range from default to different value
    await page.click('[data-testid="week-range-selector"]');
    await page.selectOption('[data-testid="week-range-selector"]', '12');
    
    // Wait for data to load
    await page.waitForTimeout(2000);
    
    // Set up download event listener
    const downloadPromise = page.waitForEvent('download');
    
    // Click download CSV button
    await page.click('[data-testid="download-csv-trends"]');
    
    // Verify download occurred
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/cohort-trends.*\.csv$/);
    
    // Verify the downloaded file is not empty
    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();
    
    // Read file to verify it has content
    const fs = require('fs');
    const csvContent = fs.readFileSync(downloadPath!, 'utf8');
    expect(csvContent.length).toBeGreaterThan(50); // Should have headers + data
    expect(csvContent).toContain('week_display'); // Check for expected header
  });

  test('Parent Email: preview and print functionality', async ({ page }) => {
    await navigateToReports(page);
    
    // Click on Parent Email
    await page.click('text="Parent Email"');
    await expect(page.locator('text="Parent Summary Email"')).toBeVisible();
    
    // Select a learner
    await page.check('[data-testid="learner-checkbox-0"]'); // Select first learner
    
    // Generate preview
    await page.click('[data-testid="generate-preview"]');
    await expect(page.locator('[data-testid="email-preview"]')).toBeVisible();
    
    // Test print functionality
    await page.click('[data-testid="print-preview"]');
    
    // Verify print route is accessible (check for print-specific content)
    await expect(page.locator('[data-testid="print-content"]')).toBeVisible();
    
    // Verify print styles are applied (content should be formatted for print)
    const printContent = page.locator('[data-testid="print-content"]');
    await expect(printContent).toHaveCSS('color', 'rgb(0, 0, 0)'); // Black text for print
    
    // Check that accomplishments section renders
    await expect(page.locator('text="Accomplishments"')).toBeVisible();
    await expect(page.locator('text="Next Steps"')).toBeVisible();
  });

  test('Digest settings: enable and trigger test digest (DEV)', async ({ page }) => {
    // Only run this test in development mode
    await page.addInitScript(() => {
      Object.defineProperty(window, 'process', {
        value: { env: { NODE_ENV: 'development' } }
      });
    });
    
    await navigateToReports(page);
    
    // Navigate to Digest Settings
    await page.click('text="Digest Settings"');
    await expect(page.locator('text="Teacher Digest Settings"')).toBeVisible();
    
    // Enable digest if not already enabled
    const digestToggle = page.locator('[data-testid="digest-toggle-switch"]');
    const isEnabled = await digestToggle.isChecked();
    
    if (!isEnabled) {
      await digestToggle.click();
      await expect(page.locator('text="Digest enabled"')).toBeVisible();
    }
    
    // Verify development tools are visible
    await expect(page.locator('text="Development Tools"')).toBeVisible();
    
    // Trigger test digest
    await page.click('[data-testid="manual-digest-trigger"]');
    
    // Verify success toast appears
    await expect(page.locator('text="Digest triggered"')).toBeVisible({ timeout: 10000 });
    
    // Verify button shows loading state during request
    const triggerButton = page.locator('[data-testid="manual-digest-trigger"]');
    await expect(triggerButton).toContainText('Send Test Digest'); // Should be back to normal after success
  });

  test('Weekly engagement export: generate and download CSV', async ({ page }) => {
    await navigateToReports(page);
    
    // Navigate to Weekly Engagement
    await page.click('text="Weekly Export"');
    await expect(page.locator('text="Weekly Engagement Export"')).toBeVisible();
    
    // Select a week (use current week)
    const weekPicker = page.locator('[data-testid="week-picker"]');
    await weekPicker.fill('2025-01-13'); // Monday of a test week
    
    // Generate preview first
    await page.click('[data-testid="generate-preview"]');
    await expect(page.locator('text="Data Preview"')).toBeVisible();
    
    // Set up download event listener
    const downloadPromise = page.waitForEvent('download');
    
    // Download CSV
    await page.click('[data-testid="download-csv"]');
    
    // Verify download
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/weekly_engagement.*\.csv$/);
    
    // Verify file content
    const downloadPath = await download.path();
    const fs = require('fs');
    const csvContent = fs.readFileSync(downloadPath!, 'utf8');
    expect(csvContent).toContain('learner_id'); // Check for expected header
    expect(csvContent).toContain('minutes'); // Check for another expected header
  });

  test('Accessibility: Charts have data tables for screen readers', async ({ page }) => {
    await navigateToReports(page);
    
    // Navigate to Trends view
    await page.click('text="Cohort Trends"');
    await expect(page.locator('text="Cohort Trends Dashboard"')).toBeVisible();
    
    // Wait for charts to load
    await page.waitForTimeout(3000);
    
    // Check for sparklines (trend charts)
    const sparklines = page.locator('svg[role="img"]');
    const sparklineCount = await sparklines.count();
    
    if (sparklineCount > 0) {
      // For each sparkline, verify there's an associated data table
      for (let i = 0; i < sparklineCount; i++) {
        const sparkline = sparklines.nth(i);
        
        // Get the aria-describedby attribute
        const describedBy = await sparkline.getAttribute('aria-describedby');
        expect(describedBy).toBeTruthy();
        
        // Verify the data table exists and is screen reader accessible
        const dataTable = page.locator(`#${describedBy}`);
        await expect(dataTable).toHaveClass(/sr-only/);
        
        // Verify table has proper structure
        await expect(dataTable.locator('caption')).toBeVisible();
        await expect(dataTable.locator('thead th')).toHaveCount(2, { timeout: 1000 }); // At least Point and Value columns
      }
    }
  });

  test('Performance: Trends view loads efficiently', async ({ page }) => {
    // Set up performance monitoring
    const startTime = Date.now();
    
    await navigateToReports(page);
    
    // Navigate to Trends view and measure load time
    await page.click('text="Cohort Trends"');
    await expect(page.locator('text="Cohort Trends Dashboard"')).toBeVisible();
    
    // Wait for charts to fully load
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Verify reasonable load time (should be under 5 seconds for E2E)
    expect(loadTime).toBeLessThan(5000);
    
    // Verify main components are visible
    await expect(page.locator('[data-testid="trends-metrics-cards"]')).toBeVisible();
    await expect(page.locator('[data-testid="trends-data-table"]')).toBeVisible();
  });

  test('Error handling: Reports handle empty data gracefully', async ({ page }) => {
    await navigateToReports(page);
    
    // Test Trends view with no data
    await page.click('text="Cohort Trends"');
    await expect(page.locator('text="Cohort Trends Dashboard"')).toBeVisible();
    
    // Look for empty state messaging
    const emptyStateMessage = page.locator('text="No trend data available"');
    const hasData = await page.locator('[data-testid="trends-data-table"] tbody tr').count();
    
    if (hasData === 0) {
      await expect(emptyStateMessage).toBeVisible();
    }
    
    // Test Weekly Engagement with future date (no data expected)
    await page.click('[data-testid="back-to-reports"]');
    await page.click('text="Weekly Export"');
    
    const weekPicker = page.locator('[data-testid="week-picker"]');
    await weekPicker.fill('2030-01-01'); // Future date
    
    await page.click('[data-testid="generate-preview"]');
    
    // Should handle gracefully
    await expect(page.locator('text="No learners found for this time period"')).toBeVisible();
  });
});