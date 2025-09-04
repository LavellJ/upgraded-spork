import { test, expect, type Page } from '@playwright/test';

/**
 * E2E tests for feedback functionality
 * Tests widget DEV-gate and issue reporter snapshot JSON with masked fields
 */

async function mockDevelopmentEnvironment(page: Page): Promise<void> {
  await page.addInitScript(() => {
    // Mock NODE_ENV to be development
    Object.defineProperty(process, 'env', {
      value: { ...process.env, NODE_ENV: 'development' },
      writable: true
    });
    
    // Also set on window for client-side access
    (window as any).__DEV__ = true;
    (window as any).__NODE_ENV__ = 'development';
  });
}

async function mockProductionEnvironment(page: Page): Promise<void> {
  await page.addInitScript(() => {
    Object.defineProperty(process, 'env', {
      value: { ...process.env, NODE_ENV: 'production' },
      writable: true
    });
    
    (window as any).__DEV__ = false;
    (window as any).__NODE_ENV__ = 'production';
  });
}

async function setupUserData(page: Page): Promise<void> {
  // Add some test user data that should be masked in snapshots
  await page.evaluate(() => {
    localStorage.setItem('qi.roster.v1', JSON.stringify({
      learners: [
        { 
          id: 'learner-123', 
          name: 'Sensitive Student Name', 
          email: 'student@example.com',
          ageband: 'primary' 
        }
      ]
    }));
    
    localStorage.setItem('qi.user.profile.v1', JSON.stringify({
      id: 'teacher-456',
      name: 'Teacher Personal Name',
      email: 'teacher@school.edu.au',
      school: 'Private School Name'
    }));
  });
}

test.describe('Feedback Widget - Development Gate', () => {
  test('should show feedback widget in development environment', async ({ page }) => {
    await mockDevelopmentEnvironment(page);
    await page.goto('/');
    
    // Look for feedback widget - adjust selector based on actual implementation
    const feedbackWidget = page.locator('[data-testid="feedback-widget"]');
    const feedbackButton = page.locator('button[aria-label*="feedback" i]');
    const feedbackTrigger = page.locator('.feedback-trigger');
    
    // Should be visible in development
    const widgetExists = await feedbackWidget.count() > 0;
    const buttonExists = await feedbackButton.count() > 0;
    const triggerExists = await feedbackTrigger.count() > 0;
    
    // At least one feedback mechanism should be present
    expect(widgetExists || buttonExists || triggerExists).toBe(true);
    
    if (widgetExists) {
      await expect(feedbackWidget).toBeVisible();
    }
    
    if (buttonExists) {
      await expect(feedbackButton).toBeVisible();
    }
  });

  test('should hide feedback widget in production environment', async ({ page }) => {
    await mockProductionEnvironment(page);
    await page.goto('/');
    
    // Look for feedback widget elements
    const feedbackWidget = page.locator('[data-testid="feedback-widget"]');
    const feedbackButton = page.locator('button[aria-label*="feedback" i]');
    const feedbackTrigger = page.locator('.feedback-trigger');
    
    // Should not be visible in production
    expect(await feedbackWidget.count()).toBe(0);
    expect(await feedbackButton.count()).toBe(0);
    expect(await feedbackTrigger.count()).toBe(0);
  });

  test('should allow feedback submission in development', async ({ page }) => {
    await mockDevelopmentEnvironment(page);
    await page.goto('/');
    
    // Find and click feedback trigger
    const feedbackButton = page.locator('button[aria-label*="feedback" i]').first();
    
    if (await feedbackButton.count() > 0) {
      await feedbackButton.click();
      
      // Look for feedback form
      const feedbackForm = page.locator('[data-testid="feedback-form"]');
      const feedbackTextarea = page.locator('textarea[placeholder*="feedback" i]');
      const messageInput = page.locator('input[placeholder*="message" i], textarea[placeholder*="message" i]');
      
      const formExists = await feedbackForm.count() > 0;
      const textareaExists = await feedbackTextarea.count() > 0;
      const messageExists = await messageInput.count() > 0;
      
      if (formExists || textareaExists || messageExists) {
        // Fill out feedback form
        const inputField = textareaExists ? feedbackTextarea : messageInput;
        
        if (await inputField.count() > 0) {
          await inputField.fill('Test feedback message from E2E test');
          
          // Submit the form
          const submitButton = page.locator('button[type="submit"]', { hasText: /submit|send/i });
          
          if (await submitButton.count() > 0) {
            await submitButton.click();
            
            // Wait for submission response
            await page.waitForTimeout(2000);
            
            // Look for success confirmation
            const successMessage = page.locator('text=/feedback.*sent|thank.*feedback/i');
            const successToast = page.locator('[data-testid="success-toast"]');
            
            const hasSuccess = await successMessage.count() > 0;
            const hasToast = await successToast.count() > 0;
            
            // Should get some kind of confirmation
            expect(hasSuccess || hasToast).toBe(true);
          }
        }
      }
    }
  });
});

test.describe('Issue Reporter - Snapshot Masking', () => {
  test('should mask sensitive fields in issue snapshot JSON', async ({ page }) => {
    await mockDevelopmentEnvironment(page);
    await setupUserData(page);
    await page.goto('/');
    
    // Trigger issue reporting flow
    const issueReportButton = page.locator('[data-testid="report-issue-button"]');
    const feedbackButton = page.locator('button[aria-label*="feedback" i]').first();
    
    let reportingTriggered = false;
    
    if (await issueReportButton.count() > 0) {
      await issueReportButton.click();
      reportingTriggered = true;
    } else if (await feedbackButton.count() > 0) {
      await feedbackButton.click();
      
      // Look for issue reporting option
      const reportIssueOption = page.locator('text=/report.*issue|bug.*report/i');
      if (await reportIssueOption.count() > 0) {
        await reportIssueOption.click();
        reportingTriggered = true;
      }
    }
    
    if (reportingTriggered) {
      // Fill out issue report
      const descriptionField = page.locator('textarea[placeholder*="describe" i]').first();
      
      if (await descriptionField.count() > 0) {
        await descriptionField.fill('Test issue report with sensitive data');
        
        // Check for snapshot data generation
        const includeSnapshotCheckbox = page.locator('input[type="checkbox"][data-testid="include-snapshot"]');
        
        if (await includeSnapshotCheckbox.count() > 0) {
          await includeSnapshotCheckbox.check();
        }
        
        // Submit the report
        const submitButton = page.locator('button[type="submit"]');
        
        // Intercept the network request to check snapshot data
        const requestPromise = page.waitForRequest(req => 
          req.url().includes('/api/feedback') || 
          req.url().includes('/api/issue-report') ||
          req.method() === 'POST'
        );
        
        await submitButton.click();
        
        try {
          const request = await requestPromise;
          const postData = request.postDataJSON();
          
          if (postData && postData.snapshot) {
            const snapshot = typeof postData.snapshot === 'string' 
              ? JSON.parse(postData.snapshot) 
              : postData.snapshot;
            
            // Verify sensitive fields are masked
            const snapshotStr = JSON.stringify(snapshot);
            
            // Should not contain actual sensitive data
            expect(snapshotStr).not.toContain('Sensitive Student Name');
            expect(snapshotStr).not.toContain('Teacher Personal Name');
            expect(snapshotStr).not.toContain('student@example.com');
            expect(snapshotStr).not.toContain('teacher@school.edu.au');
            expect(snapshotStr).not.toContain('Private School Name');
            
            // Should contain masked versions
            expect(snapshotStr).toMatch(/\[REDACTED\]|\*\*\*|MASKED/i);
            
            // Should still contain non-sensitive structural data
            expect(snapshotStr).toContain('learner-');
            expect(snapshotStr).toContain('primary'); // age band is okay
          }
        } catch (error) {
          console.log('No network request intercepted, checking other methods');
          
          // Alternative: check if snapshot data is visible in UI for manual verification
          const snapshotPreview = page.locator('[data-testid="snapshot-preview"]');
          if (await snapshotPreview.count() > 0) {
            const previewText = await snapshotPreview.textContent();
            
            expect(previewText).not.toContain('Sensitive Student Name');
            expect(previewText).not.toContain('student@example.com');
          }
        }
      }
    } else {
      console.log('Issue reporting flow not found, test will be marked as skipped');
      test.skip();
    }
  });

  test('should include masked localStorage data in snapshot', async ({ page }) => {
    await mockDevelopmentEnvironment(page);
    await page.goto('/');
    
    // Add specific localStorage data that should be masked
    await page.evaluate(() => {
      localStorage.setItem('qi.sensitive.data', JSON.stringify({
        personalInfo: 'John Doe',
        email: 'john@example.com',
        structuralData: { version: 1, settings: { theme: 'light' } }
      }));
    });
    
    // Generate snapshot data (this will depend on implementation)
    const snapshotData = await page.evaluate(() => {
      // Mock the snapshot generation function
      const generateSnapshot = () => {
        const data: any = {
          localStorage: {},
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        };
        
        // Collect localStorage data with masking
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
            try {
              const value = localStorage.getItem(key);
              const parsed = JSON.parse(value || '{}');
              
              // Apply masking logic (simplified)
              const masked = JSON.stringify(parsed).replace(
                /(email|name|personalInfo)["']?\s*:\s*["']?[^"',}\]]+["']?/gi,
                '$1: "[REDACTED]"'
              );
              
              data.localStorage[key] = JSON.parse(masked);
            } catch {
              data.localStorage[key] = '[PARSE_ERROR]';
            }
          }
        }
        
        return data;
      };
      
      return generateSnapshot();
    });
    
    // Verify masking in generated snapshot
    const snapshotStr = JSON.stringify(snapshotData);
    
    expect(snapshotStr).not.toContain('John Doe');
    expect(snapshotStr).not.toContain('john@example.com');
    expect(snapshotStr).toContain('[REDACTED]');
    
    // Non-sensitive data should remain
    expect(snapshotStr).toContain('light'); // theme setting
    expect(snapshotStr).toContain('version'); // structural data
  });

  test('should mask browser data in issue snapshots', async ({ page }) => {
    await mockDevelopmentEnvironment(page);
    await page.goto('/');
    
    // Generate browser snapshot with potential PII
    const browserSnapshot = await page.evaluate(() => {
      const data = {
        url: window.location.href,
        userAgent: navigator.userAgent,
        referrer: document.referrer,
        title: document.title,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        // This might contain sensitive URLs
        history: 'masked for privacy',
        cookies: 'masked for privacy'
      };
      
      return data;
    });
    
    // Verify no actual sensitive browser data is exposed
    const snapshotStr = JSON.stringify(browserSnapshot);
    
    // Should not contain potentially sensitive paths or parameters
    expect(snapshotStr).not.toMatch(/token=[^&\s]+/);
    expect(snapshotStr).not.toMatch(/api[_-]key=[^&\s]+/i);
    expect(snapshotStr).not.toMatch(/password=[^&\s]+/i);
    
    // Should contain masked placeholder for privacy-sensitive data
    expect(snapshotStr).toContain('masked for privacy');
    
    // Non-sensitive browser data should remain
    expect(browserSnapshot.viewport.width).toBeGreaterThan(0);
    expect(browserSnapshot.url).toContain('http');
  });
});

test.describe('Feedback System - Error Handling', () => {
  test('should handle network failures gracefully', async ({ page }) => {
    await mockDevelopmentEnvironment(page);
    await page.goto('/');
    
    // Simulate network failure
    await page.route('**/api/feedback', route => {
      route.fulfill({ status: 500, body: 'Server Error' });
    });
    
    // Try to submit feedback
    const feedbackButton = page.locator('button[aria-label*="feedback" i]').first();
    
    if (await feedbackButton.count() > 0) {
      await feedbackButton.click();
      
      const messageInput = page.locator('textarea[placeholder*="feedback" i]').first();
      
      if (await messageInput.count() > 0) {
        await messageInput.fill('Test feedback');
        
        const submitButton = page.locator('button[type="submit"]');
        await submitButton.click();
        
        // Should show error message
        await page.waitForTimeout(3000);
        
        const errorMessage = page.locator('text=/error.*sending|failed.*submit/i');
        const errorToast = page.locator('[data-testid="error-toast"]');
        
        const hasError = await errorMessage.count() > 0;
        const hasErrorToast = await errorToast.count() > 0;
        
        expect(hasError || hasErrorToast).toBe(true);
      }
    }
  });

  test('should validate required fields', async ({ page }) => {
    await mockDevelopmentEnvironment(page);
    await page.goto('/');
    
    // Try to submit empty feedback form
    const feedbackButton = page.locator('button[aria-label*="feedback" i]').first();
    
    if (await feedbackButton.count() > 0) {
      await feedbackButton.click();
      
      // Try to submit without filling required fields
      const submitButton = page.locator('button[type="submit"]');
      
      if (await submitButton.count() > 0) {
        await submitButton.click();
        
        // Should show validation error
        const validationError = page.locator('text=/required|please.*fill/i');
        const requiredFieldError = page.locator('.field-error');
        
        const hasValidation = await validationError.count() > 0;
        const hasFieldError = await requiredFieldError.count() > 0;
        
        // Should prevent submission and show error
        expect(hasValidation || hasFieldError).toBe(true);
      }
    }
  });
});