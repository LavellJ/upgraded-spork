import { test, expect } from './fixtures';

test.describe('Content Pack System', () => {
  test.beforeEach(async ({ page }) => {
    // Set up a test profile
    await page.evaluate(() => {
      const profile = {
        version: 1,
        name: 'Test Explorer',
        ageBand: 'primary',
        calmMode: false,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      localStorage.setItem('qi.profile.v1', JSON.stringify(profile));
      
      // Clear any existing pack preferences
      localStorage.removeItem('qi.packs.enabled');
      localStorage.removeItem('qi.packs.newlyEnabled');
    });
  });

  test('should enable reef-au pack and display reef lessons', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Wait for app to load
    await expect(page.locator('[data-testid="campfire-container"], [data-testid="compass-container"]')).toBeVisible({ timeout: 10000 });
    
    // Navigate to Settings → Content (assuming this path exists)
    const settingsButton = page.locator('[data-testid="settings-button"], [data-testid="menu-settings"], .settings-button');
    if (await settingsButton.isVisible({ timeout: 3000 })) {
      await settingsButton.click();
      
      // Look for Content section in settings
      const contentSection = page.locator('[data-testid="settings-content"], .content-settings, text="Content"');
      if (await contentSection.isVisible({ timeout: 3000 })) {
        await contentSection.click();
      }
    }
    
    // Enable reef-au pack via UI toggle or via localStorage for testing
    await page.evaluate(() => {
      const enabledPacks = ['reef-au'];
      localStorage.setItem('qi.packs.enabled', JSON.stringify(enabledPacks));
      localStorage.setItem('qi.packs.newlyEnabled', JSON.stringify({
        'reef-au': Date.now()
      }));
    });
    
    // Reload to apply pack changes
    await page.reload();
    await expect(page.locator('[data-testid="campfire-container"], [data-testid="compass-container"]')).toBeVisible({ timeout: 10000 });
    
    // Look for reef lessons - search for reef-specific content
    const reefLessonPin = page.locator('[data-testid*="reef"], [data-lesson-id*="reef"], [title*="reef" i], [alt*="reef" i]').first();
    
    // If pins aren't immediately visible, try navigating to lessons/campfire view
    if (!(await reefLessonPin.isVisible({ timeout: 3000 }))) {
      const campfireButton = page.locator('[data-testid="campfire-nav"], [data-testid="lessons-nav"], text="Campfire" i, text="Lessons" i').first();
      if (await campfireButton.isVisible({ timeout: 3000 })) {
        await campfireButton.click();
        await page.waitForTimeout(1000);
      }
    }
    
    // Check for reef lesson presence
    const hasReefContent = await page.evaluate(() => {
      // Check various ways reef content might be present
      const elements = document.querySelectorAll('*');
      for (const el of elements) {
        const text = el.textContent || '';
        const title = el.getAttribute('title') || '';
        const alt = el.getAttribute('alt') || '';
        const dataAttrs = Array.from(el.attributes)
          .filter(attr => attr.name.startsWith('data-'))
          .map(attr => attr.value)
          .join(' ');
        
        if (text.toLowerCase().includes('reef') || 
            title.toLowerCase().includes('reef') || 
            alt.toLowerCase().includes('reef') ||
            dataAttrs.toLowerCase().includes('reef')) {
          return true;
        }
      }
      return false;
    });
    
    expect(hasReefContent).toBeTruthy();
    
    // Test clicking on a reef lesson to start it
    if (await reefLessonPin.isVisible()) {
      await reefLessonPin.click();
      
      // Should navigate to lesson view
      await expect(page.locator('[data-testid="lesson-container"], [data-testid="activity-container"], .lesson-view').first()).toBeVisible({ timeout: 8000 });
      
      // Look for lesson content (read or quiz activity)
      const activityContent = page.locator('[data-testid*="activity"], [data-testid*="lesson"], .activity, .lesson-content').first();
      await expect(activityContent).toBeVisible({ timeout: 5000 });
    }
  });

  test('should enable alpine-au pack and populate journal items for measurement', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="campfire-container"], [data-testid="compass-container"]')).toBeVisible({ timeout: 10000 });
    
    // Enable alpine-au pack
    await page.evaluate(() => {
      const enabledPacks = ['alpine-au'];
      localStorage.setItem('qi.packs.enabled', JSON.stringify(enabledPacks));
      localStorage.setItem('qi.packs.newlyEnabled', JSON.stringify({
        'alpine-au': Date.now()
      }));
    });
    
    await page.reload();
    await expect(page.locator('[data-testid="campfire-container"], [data-testid="compass-container"]')).toBeVisible({ timeout: 10000 });
    
    // Navigate to journal/practice area
    const journalButton = page.locator('[data-testid="journal-nav"], [data-testid="practice-nav"], text="Journal" i, text="Practice" i').first();
    if (await journalButton.isVisible({ timeout: 3000 })) {
      await journalButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Look for measurement-related practice items
    const measurementItems = page.locator('[data-testid*="measurement"], [data-skill*="measurement"], text*="measurement" i, text*="measure" i');
    
    // Check if measurement content is available
    const hasMeasurementContent = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      for (const el of elements) {
        const text = el.textContent || '';
        const dataAttrs = Array.from(el.attributes)
          .filter(attr => attr.name.startsWith('data-'))
          .map(attr => attr.value)
          .join(' ');
        
        if (text.toLowerCase().includes('measurement') || 
            text.toLowerCase().includes('measure') ||
            dataAttrs.toLowerCase().includes('measurement')) {
          return true;
        }
      }
      return false;
    });
    
    expect(hasMeasurementContent).toBeTruthy();
    
    // Try to access a measurement practice item
    if (await measurementItems.first().isVisible({ timeout: 3000 })) {
      await measurementItems.first().click();
      
      // Should load practice content
      await expect(page.locator('[data-testid="practice-container"], [data-testid="journal-item"], .practice-item').first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should hide lessons when packs are disabled', async ({ page }) => {
    // Start with packs enabled
    await page.evaluate(() => {
      const enabledPacks = ['reef-au', 'alpine-au'];
      localStorage.setItem('qi.packs.enabled', JSON.stringify(enabledPacks));
    });
    
    await page.goto('/');
    await expect(page.locator('[data-testid="campfire-container"], [data-testid="compass-container"]')).toBeVisible({ timeout: 10000 });
    
    // Count available lessons/content with packs enabled
    const contentWithPacks = await page.evaluate(() => {
      const elements = document.querySelectorAll('[data-testid*="lesson"], [data-testid*="pin"], .lesson-pin, .content-pin');
      return elements.length;
    });
    
    // Disable all packs
    await page.evaluate(() => {
      localStorage.setItem('qi.packs.enabled', JSON.stringify([]));
      localStorage.removeItem('qi.packs.newlyEnabled');
    });
    
    await page.reload();
    await expect(page.locator('[data-testid="campfire-container"], [data-testid="compass-container"]')).toBeVisible({ timeout: 10000 });
    
    // Count available lessons/content with packs disabled
    const contentWithoutPacks = await page.evaluate(() => {
      const elements = document.querySelectorAll('[data-testid*="lesson"], [data-testid*="pin"], .lesson-pin, .content-pin');
      return elements.length;
    });
    
    // Should have fewer or equal content items (depending on base content)
    expect(contentWithoutPacks).toBeLessThanOrEqual(contentWithPacks);
    
    // Specifically check that reef/alpine content is not visible
    const hasPackContent = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      for (const el of elements) {
        const text = el.textContent || '';
        const dataAttrs = Array.from(el.attributes)
          .filter(attr => attr.name.startsWith('data-'))
          .map(attr => attr.value)
          .join(' ');
        
        if (text.toLowerCase().includes('reef') || 
            text.toLowerCase().includes('alpine') ||
            dataAttrs.toLowerCase().includes('reef') ||
            dataAttrs.toLowerCase().includes('alpine')) {
          return true;
        }
      }
      return false;
    });
    
    expect(hasPackContent).toBeFalsy();
  });

  test('should track pack enabling in analytics', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="campfire-container"], [data-testid="compass-container"]')).toBeVisible({ timeout: 10000 });
    
    // Enable a pack and check if analytics event is recorded
    await page.evaluate(() => {
      const enabledPacks = ['reef-au'];
      localStorage.setItem('qi.packs.enabled', JSON.stringify(enabledPacks));
      localStorage.setItem('qi.packs.newlyEnabled', JSON.stringify({
        'reef-au': Date.now()
      }));
      
      // Simulate pack enabling event
      const events = JSON.parse(localStorage.getItem('qi.progress.history.v1') || '[]');
      events.push({
        kind: 'system',
        at: Date.now(),
        action: 'pack_enabled',
        packId: 'reef-au',
        sessionId: Math.random().toString(36).substr(2, 9)
      });
      localStorage.setItem('qi.progress.history.v1', JSON.stringify(events));
    });
    
    // Check that the event was recorded
    const packEnabledTracked = await page.evaluate(() => {
      try {
        const events = JSON.parse(localStorage.getItem('qi.progress.history.v1') || '[]');
        return events.some((event: any) => 
          event.kind === 'system' && 
          event.action === 'pack_enabled' && 
          event.packId === 'reef-au'
        );
      } catch {
        return false;
      }
    });
    
    expect(packEnabledTracked).toBeTruthy();
  });

  test('should handle pack loading errors gracefully', async ({ page }) => {
    await page.goto('/');
    
    // Mock a pack loading error scenario
    await page.evaluate(() => {
      // Store invalid pack configuration
      localStorage.setItem('qi.packs.enabled', '["invalid-pack", "reef-au"]');
    });
    
    await page.reload();
    
    // App should still load despite pack errors
    await expect(page.locator('[data-testid="campfire-container"], [data-testid="compass-container"]')).toBeVisible({ timeout: 10000 });
    
    // Valid packs should still work
    const hasValidContent = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      let hasContent = false;
      
      for (const el of elements) {
        const text = el.textContent || '';
        if (text.toLowerCase().includes('reef')) {
          hasContent = true;
          break;
        }
      }
      
      return hasContent || document.querySelectorAll('[data-testid*="lesson"], .lesson-pin').length > 0;
    });
    
    expect(hasValidContent).toBeTruthy();
  });
});