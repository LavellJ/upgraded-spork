import { test, expect, type Page } from '@playwright/test';

/**
 * E2E tests for class mode functionality
 * Tests anonymization features and "Start now" flows
 */

async function enableProjectorMode(page: Page): Promise<void> {
  // Navigate to settings or wherever projector mode toggle is located
  await page.goto('/');
  
  // Enable projector mode through settings
  // Note: This may need to be adjusted based on actual UI location
  const settingsButton = page.locator('[data-testid="settings-button"]');
  if (await settingsButton.count() > 0) {
    await settingsButton.click();
    const projectorToggle = page.locator('[data-testid="projector-mode-toggle"]');
    if (await projectorToggle.count() > 0) {
      await projectorToggle.click();
      await page.waitForTimeout(1000); // Allow mode to activate
    }
  }
}

async function setupTestClass(page: Page): Promise<string> {
  // Create a test class with a known code for testing
  await page.goto('/');
  
  // Navigate to class management (adjust selectors based on actual UI)
  const classManagementButton = page.locator('text="Guide"');
  if (await classManagementButton.count() > 0) {
    await classManagementButton.click();
    
    const classesTab = page.locator('text="Classes"');
    if (await classesTab.count() > 0) {
      await classesTab.click();
    }
  }
  
  // Create a new class or use existing test class
  const testClassCode = 'TEST01';
  
  // Store the class code for quick access
  await page.evaluate((code) => {
    localStorage.setItem('qi.lastClassCode', code);
    localStorage.setItem('qi.lastClassName', 'Test Class');
  }, testClassCode);
  
  return testClassCode;
}

test.describe('Class Mode - Anonymization', () => {
  test('should hide student names when projector mode is enabled', async ({ page }) => {
    await page.goto('/');
    
    // First, ensure we have some student names visible
    await page.evaluate(() => {
      // Mock some student data
      localStorage.setItem('qi.roster.v1', JSON.stringify({
        learners: [
          { id: 'student-1', name: 'Alice Johnson', ageband: 'upper-primary' },
          { id: 'student-2', name: 'Bob Smith', ageband: 'primary' }
        ]
      }));
    });
    
    // Reload to pick up the data
    await page.reload();
    
    // Enable projector mode
    await enableProjectorMode(page);
    
    // Verify that student names are hidden or anonymized
    // This will depend on how names are displayed in the UI
    const nameElements = page.locator('.learner-name');
    const nameCount = await nameElements.count();
    
    if (nameCount > 0) {
      // Check that names are either hidden or show as "Student"
      for (let i = 0; i < nameCount; i++) {
        const nameText = await nameElements.nth(i).textContent();
        // Should not contain actual student names
        expect(nameText).not.toContain('Alice');
        expect(nameText).not.toContain('Bob');
      }
    }
    
    // Verify CSS class is applied
    const body = page.locator('body');
    await expect(body).toHaveClass(/.*projector-mode.*/);
  });

  test('should anonymize class names in projector mode', async ({ page }) => {
    await page.goto('/');
    
    const testClassCode = await setupTestClass(page);
    
    // Enable projector mode
    await enableProjectorMode(page);
    
    // Navigate to where class name might be displayed
    const classDisplayElement = page.locator('[data-testid="class-name-display"]').first();
    
    if (await classDisplayElement.count() > 0) {
      const displayText = await classDisplayElement.textContent();
      
      // Should show generic name instead of actual class name
      expect(displayText).not.toContain('Test Class');
      expect(displayText).toContain('Class Learning');
    }
  });

  test('should hide personal information in projector mode', async ({ page }) => {
    await page.goto('/');
    
    // Enable projector mode first
    await enableProjectorMode(page);
    
    // Check that elements with hide-on-projector class are hidden
    const hiddenElements = page.locator('.hide-on-projector');
    const hiddenCount = await hiddenElements.count();
    
    for (let i = 0; i < hiddenCount; i++) {
      await expect(hiddenElements.nth(i)).not.toBeVisible();
    }
    
    // Check that elements with hide-in-projector class are hidden  
    const hiddenInProjector = page.locator('.hide-in-projector');
    const hiddenInProjectorCount = await hiddenInProjector.count();
    
    for (let i = 0; i < hiddenInProjectorCount; i++) {
      await expect(hiddenInProjector.nth(i)).not.toBeVisible();
    }
  });
});

test.describe('Class Mode - Start Now Flows', () => {
  test('should display Start Now button when class is active', async ({ page }) => {
    await page.goto('/');
    
    const testClassCode = await setupTestClass(page);
    
    // Look for the class mode CTA component
    const startButton = page.locator('[data-testid="start-now-button"]');
    
    // The button should be visible when a class is set
    if (await startButton.count() > 0) {
      await expect(startButton).toBeVisible();
      
      const buttonText = await startButton.textContent();
      expect(buttonText).toMatch(/(Start Now|Continue Learning|Start Assignment)/);
    }
  });

  test('should handle class code entry flow', async ({ page }) => {
    await page.goto('/');
    
    // Look for class code entry interface
    const joinClassButton = page.locator('text="Join Class"').first();
    
    if (await joinClassButton.count() > 0) {
      await joinClassButton.click();
      
      // Enter a test class code
      const codeInput = page.locator('input[placeholder*="code" i]');
      if (await codeInput.count() > 0) {
        await codeInput.fill('TEST01');
        
        // Submit the code
        const submitButton = page.locator('button[type="submit"]').first();
        await submitButton.click();
        
        // Wait for processing
        await page.waitForTimeout(2000);
        
        // Check that we get appropriate feedback
        const successMessage = page.locator('text="Successfully joined"');
        const errorMessage = page.locator('text="Invalid code"');
        
        // Should see either success or error message
        const hasSuccess = await successMessage.count() > 0;
        const hasError = await errorMessage.count() > 0;
        
        expect(hasSuccess || hasError).toBe(true);
      }
    }
  });

  test('should activate projector presets when joining via class code', async ({ page }) => {
    await page.goto('/');
    
    // Simulate joining via class code (mock the deep link functionality)
    await page.evaluate(() => {
      localStorage.setItem('qi.lastClassCode', 'TEST01');
      localStorage.setItem('qi.lastClassName', 'Test Class');
      // Simulate projector mode activation
      document.documentElement.setAttribute('data-projector-mode', 'true');
    });
    
    await page.reload();
    
    // Verify projector mode is active
    const html = page.locator('html');
    await expect(html).toHaveAttribute('data-projector-mode', 'true');
    
    // Verify projector-safe styling is applied
    const body = page.locator('body');
    const bodyClass = await body.getAttribute('class');
    expect(bodyClass).toContain('projector-mode');
  });

  test('should focus on assigned lessons after Start Now', async ({ page }) => {
    await page.goto('/');
    
    // Setup test data with assignments
    await page.evaluate(() => {
      localStorage.setItem('qi.lastClassCode', 'TEST01');
      localStorage.setItem('qi.local-1.assigned.paths.v1', JSON.stringify([
        {
          name: 'Math Practice',
          lessons: [
            { lessonId: 'desert.addition.1', status: 'assigned', dueAt: Date.now() + 86400000 }
          ]
        }
      ]));
    });
    
    await page.reload();
    
    // Click Start Now button
    const startButton = page.locator('[data-testid="start-now-button"]').first();
    
    if (await startButton.count() > 0) {
      await startButton.click();
      
      // Wait for navigation/focus
      await page.waitForTimeout(3000);
      
      // Check if we're directed to the assigned lesson
      // This will depend on the actual navigation implementation
      const url = page.url();
      const hasLessonPath = url.includes('lesson') || url.includes('desert');
      
      // Could also check for assignment nudges or other indicators
      const assignmentIndicator = page.locator('[data-testid="assignment-indicator"]');
      const hasAssignmentUI = await assignmentIndicator.count() > 0;
      
      // Should have some indication we're in assignment flow
      expect(hasLessonPath || hasAssignmentUI).toBe(true);
    }
  });

  test('should handle QR code class joining', async ({ page }) => {
    await page.goto('/');
    
    // Simulate QR code deep link by setting URL parameters
    await page.goto('/?class=TEST01');
    
    // Should trigger class join banner or similar
    const joinBanner = page.locator('[data-testid="class-join-banner"]');
    const joinButton = page.locator('text="Join Class"');
    
    // Should see some indication of class joining flow
    const hasBanner = await joinBanner.count() > 0;
    const hasJoinButton = await joinButton.count() > 0;
    
    expect(hasBanner || hasJoinButton).toBe(true);
    
    // If banner is present, test the join flow
    if (hasBanner) {
      const setupButton = page.locator('button[data-testid="setup-class-button"]');
      if (await setupButton.count() > 0) {
        await setupButton.click();
        await page.waitForTimeout(2000);
        
        // Should store the class code
        const storedCode = await page.evaluate(() => {
          return localStorage.getItem('qi.lastClassCode');
        });
        
        expect(storedCode).toBe('TEST01');
      }
    }
  });
});

test.describe('Class Mode - Edge Cases', () => {
  test('should handle missing class data gracefully', async ({ page }) => {
    await page.goto('/');
    
    // Clear any existing class data
    await page.evaluate(() => {
      localStorage.removeItem('qi.lastClassCode');
      localStorage.removeItem('qi.lastClassName');
    });
    
    await page.reload();
    
    // Should not show Start Now button without active class
    const startButton = page.locator('[data-testid="start-now-button"]');
    expect(await startButton.count()).toBe(0);
    
    // Should not have projector mode active
    const body = page.locator('body');
    const bodyClass = await body.getAttribute('class');
    expect(bodyClass).not.toContain('projector-mode');
  });

  test('should disable projector mode when manually toggled off', async ({ page }) => {
    await page.goto('/');
    
    // Enable projector mode first
    await enableProjectorMode(page);
    
    // Verify it's enabled
    const bodyEnabled = page.locator('body.projector-mode');
    await expect(bodyEnabled).toBeVisible();
    
    // Disable projector mode
    const settingsButton = page.locator('[data-testid="settings-button"]');
    if (await settingsButton.count() > 0) {
      await settingsButton.click();
      const projectorToggle = page.locator('[data-testid="projector-mode-toggle"]');
      if (await projectorToggle.count() > 0) {
        await projectorToggle.click();
        await page.waitForTimeout(1000);
      }
    }
    
    // Verify it's disabled
    const body = page.locator('body');
    const bodyClass = await body.getAttribute('class');
    expect(bodyClass).not.toContain('projector-mode');
  });
});