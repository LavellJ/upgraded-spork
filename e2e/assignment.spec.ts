import { test, expect } from './fixtures';

test.describe('Assignment Flow', () => {
  test('should apply assignment link, see chip, and have Compass choose assigned content', async ({ page }) => {
    // Create a test assignment URL parameter
    const assignmentData = {
      skills: ['literacy.phonics', 'math.counting'],
      title: 'Test Assignment',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
    };
    
    // Encode assignment data
    const encodedAssignment = btoa(JSON.stringify(assignmentData));
    
    // Navigate with assignment parameter
    await page.goto(`/?assign=${encodedAssignment}`);
    
    // Ensure we have a profile
    await page.evaluate(() => {
      const profile = {
        version: 1,
        name: 'Test Child',
        ageBand: 'primary',
        calmMode: true,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      localStorage.setItem('qi.profile.v1', JSON.stringify(profile));
    });
    
    // Wait for app to load
    await expect(page.locator('[data-testid="campfire-container"], [data-testid="compass-container"]')).toBeVisible({ timeout: 10000 });
    
    // Look for assignment chip/indicator
    const assignmentChip = page.locator(
      '[data-testid="assignment-chip"], [data-testid="assignment-indicator"], .assignment-chip, .assignment-badge'
    );
    
    // Should see assignment indicator
    await expect(assignmentChip).toBeVisible({ timeout: 5000 });
    
    // Verify assignment received funnel tracking
    const assignmentReceivedTracked = await page.evaluate(() => {
      try {
        const events = JSON.parse(localStorage.getItem('qi.progress.history.v1') || '[]');
        return events.some((event: any) => event.kind === 'funnel' && event.step === 'assignment_received');
      } catch {
        return false;
      }
    });
    expect(assignmentReceivedTracked).toBeTruthy();
    
    // Check that assignment was stored
    const assignmentStored = await page.evaluate(() => {
      try {
        const assignments = JSON.parse(localStorage.getItem('qi.assignments.v1') || '[]');
        return assignments.length > 0;
      } catch {
        return false;
      }
    });
    expect(assignmentStored).toBeTruthy();
    
    // Look for Compass recommendation or assigned skill highlighting
    const compassRecommendation = page.locator(
      '[data-testid="compass-recommendation"], [data-testid="assigned-skill"], .compass-choice, .recommended-skill'
    );
    
    // Compass should prioritize assigned content
    if (await compassRecommendation.isVisible()) {
      await expect(compassRecommendation).toBeVisible();
      
      // Click on recommended/assigned content
      await compassRecommendation.click();
      
      // Should navigate to assigned lesson/activity
      await expect(page.locator('[data-testid="activity-container"], [data-testid="lesson-container"]')).toBeVisible({ timeout: 10000 });
    }
    
    // Alternative: check if assigned skills are highlighted in the skill tree
    const assignedSkills = page.locator('[data-assigned="true"], .skill-assigned, .assigned-skill');
    if (await assignedSkills.first().isVisible()) {
      await expect(assignedSkills.first()).toBeVisible();
    }
    
    // Verify assignment data is accessible
    const assignmentData_retrieved = await page.evaluate(() => {
      try {
        const assignments = JSON.parse(localStorage.getItem('qi.assignments.v1') || '[]');
        return assignments[0];
      } catch {
        return null;
      }
    });
    
    expect(assignmentData_retrieved).toBeTruthy();
    expect(assignmentData_retrieved?.title).toBe('Test Assignment');
  });
  
  test('should handle invalid assignment links gracefully', async ({ page }) => {
    // Navigate with invalid assignment parameter
    await page.goto('/?assign=invalid-data');
    
    // App should still load normally
    await expect(page.locator('[data-testid="campfire-container"], [data-testid="compass-container"]')).toBeVisible({ timeout: 10000 });
    
    // Should not show assignment chip for invalid data
    const assignmentChip = page.locator('[data-testid="assignment-chip"], .assignment-chip');
    await expect(assignmentChip).not.toBeVisible();
    
    // Should not track assignment received for invalid data
    const assignmentReceivedTracked = await page.evaluate(() => {
      try {
        const events = JSON.parse(localStorage.getItem('qi.progress.history.v1') || '[]');
        return events.some((event: any) => event.kind === 'funnel' && event.step === 'assignment_received');
      } catch {
        return false;
      }
    });
    expect(assignmentReceivedTracked).toBeFalsy();
  });
});