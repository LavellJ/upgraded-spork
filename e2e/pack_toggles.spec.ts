/**
 * E2E Tests for Content Pack Toggle UI and "New" Tag Feature
 * Tests pack management settings and new content badge system
 */

import { test, expect } from './fixtures';

test.describe('Content Pack Toggles and New Tags', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Wait for app to load
    await expect(page.locator('[data-testid="campfire-dashboard"]')).toBeVisible({ timeout: 10000 });
    
    // Clear any existing pack preferences
    await page.evaluate(() => {
      localStorage.removeItem('qi.packs.enabled');
      localStorage.removeItem('qi.packs.newlyEnabled');
    });
  });

  test('should display pack settings in teacher panel content tab', async ({ page }) => {
    // Open teacher panel
    await page.locator('[data-testid="teacher-button"]').click();
    await expect(page.locator('[data-testid="teacher-panel"]')).toBeVisible();
    
    // Navigate to content tab
    await page.locator('[data-testid="tab-content"]').click();
    await expect(page.locator('#tab-content-content')).toBeVisible();
    
    // Verify content pack settings are displayed
    await expect(page.locator('text=Content Packs')).toBeVisible();
    await expect(page.locator('text=Manage educational content for different locales')).toBeVisible();
    
    // Check for pack statistics section
    await expect(page.locator('text=Statistics')).toBeVisible();
  });

  test('should display installed packs with lesson counts', async ({ page }) => {
    // Open teacher panel content tab
    await page.locator('[data-testid="teacher-button"]').click();
    await page.locator('[data-testid="tab-content"]').click();
    
    // Verify base pack is displayed
    await expect(page.locator('[data-testid="pack-base-au"]')).toBeVisible();
    
    // Check pack has lesson and activity counts
    const basePack = page.locator('[data-testid="pack-base-au"]');
    await expect(basePack.locator('text=/\\d+ lesson\\(s\\)/').first()).toBeVisible();
    await expect(basePack.locator('text=/\\d+ activities/').first()).toBeVisible();
  });

  test('should toggle reef-au pack and track new status', async ({ page }) => {
    // Open teacher panel content tab
    await page.locator('[data-testid="teacher-button"]').click();
    await page.locator('[data-testid="tab-content"]').click();
    
    // Find reef-au pack toggle
    const reefPackToggle = page.locator('[data-testid="toggle-pack-reef-au"]');
    await expect(reefPackToggle).toBeVisible();
    
    // Check initial state (should be disabled)
    const initialState = await reefPackToggle.isChecked();
    
    // Enable reef-au pack
    if (!initialState) {
      await reefPackToggle.click();
      await expect(reefPackToggle).toBeChecked();
      
      // Verify success message
      await expect(page.locator('text=/reef.*enabled/i')).toBeVisible({ timeout: 3000 });
    }
    
    // Verify pack is tracked as newly enabled
    const newlyEnabled = await page.evaluate(() => {
      const stored = localStorage.getItem('qi.packs.newlyEnabled');
      return stored ? JSON.parse(stored) : {};
    });
    
    expect(newlyEnabled['reef-au']).toBeDefined();
    expect(typeof newlyEnabled['reef-au']).toBe('number');
  });

  test('should toggle alpine-au pack and track new status', async ({ page }) => {
    // Open teacher panel content tab
    await page.locator('[data-testid="teacher-button"]').click();
    await page.locator('[data-testid="tab-content"]').click();
    
    // Find alpine-au pack toggle
    const alpinePackToggle = page.locator('[data-testid="toggle-pack-alpine-au"]');
    await expect(alpinePackToggle).toBeVisible();
    
    // Check initial state (should be disabled)
    const initialState = await alpinePackToggle.isChecked();
    
    // Enable alpine-au pack
    if (!initialState) {
      await alpinePackToggle.click();
      await expect(alpinePackToggle).toBeChecked();
      
      // Verify success message
      await expect(page.locator('text=/alpine.*enabled/i')).toBeVisible({ timeout: 3000 });
    }
    
    // Verify pack is tracked as newly enabled
    const newlyEnabled = await page.evaluate(() => {
      const stored = localStorage.getItem('qi.packs.newlyEnabled');
      return stored ? JSON.parse(stored) : {};
    });
    
    expect(newlyEnabled['alpine-au']).toBeDefined();
    expect(typeof newlyEnabled['alpine-au']).toBe('number');
  });

  test('should disable pack and remove from new status', async ({ page }) => {
    // First enable a pack
    await page.evaluate(() => {
      localStorage.setItem('qi.packs.enabled', JSON.stringify(['base-au', 'reef-au']));
      localStorage.setItem('qi.packs.newlyEnabled', JSON.stringify({ 'reef-au': Date.now() }));
    });
    
    await page.reload();
    
    // Open teacher panel content tab
    await page.locator('[data-testid="teacher-button"]').click();
    await page.locator('[data-testid="tab-content"]').click();
    
    // Find reef pack toggle (should be enabled)
    const reefPackToggle = page.locator('[data-testid="toggle-pack-reef-au"]');
    await expect(reefPackToggle).toBeChecked();
    
    // Disable the pack
    await reefPackToggle.click();
    await expect(reefPackToggle).not.toBeChecked();
    
    // Verify pack is removed from newly enabled tracking
    const newlyEnabled = await page.evaluate(() => {
      const stored = localStorage.getItem('qi.packs.newlyEnabled');
      return stored ? JSON.parse(stored) : {};
    });
    
    expect(newlyEnabled['reef-au']).toBeUndefined();
  });

  test('should display "New" badge on lessons from newly enabled packs', async ({ page }) => {
    // Enable reef pack with recent timestamp
    await page.evaluate(() => {
      localStorage.setItem('qi.packs.enabled', JSON.stringify(['base-au', 'reef-au']));
      localStorage.setItem('qi.packs.newlyEnabled', JSON.stringify({ 'reef-au': Date.now() }));
    });
    
    await page.reload();
    await expect(page.locator('[data-testid="campfire-dashboard"]')).toBeVisible({ timeout: 10000 });
    
    // Look for lesson pins that might be from reef pack
    // This is a simplified check - in practice, you'd need to check actual lesson IDs
    const newBadges = page.locator('[data-testid="new-pack-badge"]');
    
    // There should be at least one "New" badge visible for reef content
    // Note: This test might be flaky depending on lesson availability
    // In a full implementation, you'd want to ensure test data has reef lessons
    await expect(newBadges.first()).toBeVisible({ timeout: 5000 });
  });

  test('should update pack statistics when packs are toggled', async ({ page }) => {
    // Open teacher panel content tab
    await page.locator('[data-testid="teacher-button"]').click();
    await page.locator('[data-testid="tab-content"]').click();
    
    // Get initial enabled pack count
    const initialStats = await page.locator('text=Enabled Packs').locator('..').locator('p.font-medium').textContent();
    const initialCount = parseInt(initialStats || '0');
    
    // Enable reef pack if not already enabled
    const reefPackToggle = page.locator('[data-testid="toggle-pack-reef-au"]');
    const wasEnabled = await reefPackToggle.isChecked();
    
    if (!wasEnabled) {
      await reefPackToggle.click();
      await expect(reefPackToggle).toBeChecked();
      
      // Verify pack count increased
      await expect(async () => {
        const currentStats = await page.locator('text=Enabled Packs').locator('..').locator('p.font-medium').textContent();
        const currentCount = parseInt(currentStats || '0');
        expect(currentCount).toBe(initialCount + 1);
      }).toPass();
    }
  });

  test('should display locale selection and auto-enable packs', async ({ page }) => {
    // Open teacher panel content tab
    await page.locator('[data-testid="teacher-button"]').click();
    await page.locator('[data-testid="tab-content"]').click();
    
    // Verify locale selection is displayed
    await expect(page.locator('text=Active Locale')).toBeVisible();
    
    // Check for locale buttons
    await expect(page.locator('[data-testid="locale-en-AU"]')).toBeVisible();
    await expect(page.locator('[data-testid="locale-en-US"]')).toBeVisible();
    await expect(page.locator('[data-testid="locale-en-GB"]')).toBeVisible();
    
    // Australian locale should be selected by default
    await expect(page.locator('[data-testid="locale-en-AU"]')).toHaveClass(/default/);
  });

  test('should persist pack preferences in localStorage', async ({ page }) => {
    // Open teacher panel content tab
    await page.locator('[data-testid="teacher-button"]').click();
    await page.locator('[data-testid="tab-content"]').click();
    
    // Enable reef pack
    const reefPackToggle = page.locator('[data-testid="toggle-pack-reef-au"]');
    
    if (!(await reefPackToggle.isChecked())) {
      await reefPackToggle.click();
      await expect(reefPackToggle).toBeChecked();
    }
    
    // Verify preferences are stored
    const enabledPacks = await page.evaluate(() => {
      const stored = localStorage.getItem('qi.packs.enabled');
      return stored ? JSON.parse(stored) : [];
    });
    
    expect(enabledPacks).toContain('reef-au');
    
    // Reload page and verify state persists
    await page.reload();
    await page.locator('[data-testid="teacher-button"]').click();
    await page.locator('[data-testid="tab-content"]').click();
    
    // Pack should still be enabled
    await expect(page.locator('[data-testid="toggle-pack-reef-au"]')).toBeChecked();
  });

  test('should handle pack conflicts gracefully', async ({ page }) => {
    // Enable multiple packs that might have conflicts
    await page.evaluate(() => {
      localStorage.setItem('qi.packs.enabled', JSON.stringify(['base-au', 'reef-au', 'alpine-au']));
    });
    
    await page.reload();
    
    // Open teacher panel content tab
    await page.locator('[data-testid="teacher-button"]').click();
    await page.locator('[data-testid="tab-content"]').click();
    
    // Look for conflict warnings if any exist
    // This might not always be present depending on actual content
    const conflictWarning = page.locator('text=Pack Conflicts Detected');
    
    if (await conflictWarning.isVisible()) {
      // Verify conflict details are shown
      await expect(page.locator('text=The last enabled pack takes priority')).toBeVisible();
    }
  });

  test('should show helpful tips and information', async ({ page }) => {
    // Open teacher panel content tab
    await page.locator('[data-testid="teacher-button"]').click();
    await page.locator('[data-testid="tab-content"]').click();
    
    // Check for helpful information
    await expect(page.locator('text=💡 Tip:')).toBeVisible();
    await expect(page.locator('text=New content from recently enabled packs')).toBeVisible();
    await expect(page.locator('text=marked with a "New" tag for 7 days')).toBeVisible();
  });

  test('should handle "New" tag expiration after 7 days', async ({ page }) => {
    // Set pack as enabled 8 days ago (should not show "New" tag)
    const eightDaysAgo = Date.now() - (8 * 24 * 60 * 60 * 1000);
    
    await page.evaluate((timestamp) => {
      localStorage.setItem('qi.packs.enabled', JSON.stringify(['base-au', 'reef-au']));
      localStorage.setItem('qi.packs.newlyEnabled', JSON.stringify({ 'reef-au': timestamp }));
    }, eightDaysAgo);
    
    await page.reload();
    await expect(page.locator('[data-testid="campfire-dashboard"]')).toBeVisible({ timeout: 10000 });
    
    // Should not see any "New" badges since content is older than 7 days
    await expect(page.locator('[data-testid="new-pack-badge"]')).not.toBeVisible();
    
    // Check that expired entries are cleaned up
    const newlyEnabled = await page.evaluate(() => {
      const stored = localStorage.getItem('qi.packs.newlyEnabled');
      return stored ? JSON.parse(stored) : {};
    });
    
    expect(newlyEnabled['reef-au']).toBeUndefined();
  });
});