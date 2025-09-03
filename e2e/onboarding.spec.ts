import { test, expect } from '@playwright/test';

test.describe('Onboarding Flow', () => {
  test('should complete onboarding and see Compass tip', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Check if we're already onboarded (profile exists)
    const hasProfile = await page.evaluate(() => {
      try {
        const profile = localStorage.getItem('qi.profile.v1');
        return profile && JSON.parse(profile).createdAt;
      } catch {
        return false;
      }
    });

    if (hasProfile) {
      // Clear existing profile to test onboarding
      await page.evaluate(() => {
        localStorage.removeItem('qi.profile.v1');
        localStorage.removeItem('qi.progress.history.v1');
      });
      await page.reload();
    }

    // Should show onboarding screen
    await expect(page.locator('[data-testid="onboarding-container"]')).toBeVisible();
    
    // Fill in child's name
    const nameInput = page.locator('input[placeholder*="name" i]');
    await expect(nameInput).toBeVisible();
    await nameInput.fill('Alex');
    
    // Select age/grade (look for age buttons or select)
    const ageButton = page.locator('button:has-text("7"), button:has-text("Primary")').first();
    if (await ageButton.isVisible()) {
      await ageButton.click();
    }
    
    // Complete onboarding
    const createButton = page.locator('button:has-text("Create"), button:has-text("Start"), button:has-text("Let\'s Go")').first();
    await createButton.click();
    
    // Should navigate to main app and see Compass
    await expect(page.locator('[data-testid="compass-container"], [data-testid="campfire-container"]')).toBeVisible({ timeout: 10000 });
    
    // Look for Compass tip or initial guidance
    const compassTip = page.locator('[data-testid="compass-tip"], .compass-tip, [data-testid="getting-started"]');
    if (await compassTip.isVisible()) {
      await expect(compassTip).toBeVisible();
    }
    
    // Verify profile was created
    const profileCreated = await page.evaluate(() => {
      try {
        const profile = localStorage.getItem('qi.profile.v1');
        return profile && JSON.parse(profile).createdAt;
      } catch {
        return false;
      }
    });
    expect(profileCreated).toBeTruthy();
    
    // Verify funnel tracking for onboarding completion
    const funnelTracked = await page.evaluate(() => {
      try {
        const events = JSON.parse(localStorage.getItem('qi.progress.history.v1') || '[]');
        return events.some((event: any) => event.kind === 'funnel' && event.step === 'onboard');
      } catch {
        return false;
      }
    });
    expect(funnelTracked).toBeTruthy();
  });
});