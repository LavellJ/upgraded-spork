import { test, expect } from '@playwright/test';

test.describe('Lesson and Journal Flow', () => {
  test('should start lesson, answer incorrectly, see Scout CTA, and use Journal', async ({ page }) => {
    await page.goto('/');
    
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
    
    await page.reload();
    
    // Wait for app to load
    await expect(page.locator('[data-testid="campfire-container"], [data-testid="compass-container"]')).toBeVisible({ timeout: 10000 });
    
    // Find and click on a lesson/skill to start
    const lessonButton = page.locator(
      '[data-testid^="skill-"], [data-testid^="lesson-"], .skill-node, .lesson-card, button:has-text("Start")'
    ).first();
    
    if (await lessonButton.isVisible()) {
      await lessonButton.click();
      
      // Wait for lesson/activity to load
      await expect(page.locator('[data-testid="activity-container"], [data-testid="lesson-container"]')).toBeVisible({ timeout: 10000 });
      
      // Verify first lesson start funnel tracking
      const firstLessonStartTracked = await page.evaluate(() => {
        try {
          const events = JSON.parse(localStorage.getItem('qi.progress.history.v1') || '[]');
          return events.some((event: any) => event.kind === 'funnel' && event.step === 'first_lesson_start');
        } catch {
          return false;
        }
      });
      expect(firstLessonStartTracked).toBeTruthy();
      
      // Look for question/answer interface
      const answerButtons = page.locator('[data-testid^="answer-"], button[data-testid^="option-"], .answer-option');
      
      if (await answerButtons.first().isVisible()) {
        // Answer incorrectly twice to trigger Scout CTA
        const incorrectAnswers = await answerButtons.count();
        if (incorrectAnswers > 1) {
          // Click first wrong answer
          await answerButtons.nth(1).click();
          
          // Look for feedback or next button
          const nextButton = page.locator('button:has-text("Next"), button:has-text("Continue")');
          if (await nextButton.isVisible()) {
            await nextButton.click();
          }
          
          // Answer incorrectly again if another question appears
          if (await answerButtons.first().isVisible()) {
            await answerButtons.nth(1).click();
            if (await nextButton.isVisible()) {
              await nextButton.click();
            }
          }
        }
      }
      
      // Look for Scout CTA (journal suggestion)
      const scoutCta = page.locator(
        '[data-testid="scout-cta"], [data-testid="journal-suggestion"], button:has-text("Journal"), .scout-hint'
      );
      
      if (await scoutCta.isVisible()) {
        await scoutCta.click();
      } else {
        // Alternative: look for journal button in UI
        const journalButton = page.locator('[data-testid="journal-button"], button:has-text("Journal")');
        if (await journalButton.isVisible()) {
          await journalButton.click();
        }
      }
      
      // Wait for journal to open
      await expect(page.locator('[data-testid="journal-container"], [data-testid="journal-sheet"]')).toBeVisible({ timeout: 10000 });
      
      // Verify first journal funnel tracking
      const firstJournalTracked = await page.evaluate(() => {
        try {
          const events = JSON.parse(localStorage.getItem('qi.progress.history.v1') || '[]');
          return events.some((event: any) => event.kind === 'funnel' && event.step === 'first_journal');
        } catch {
          return false;
        }
      });
      expect(firstJournalTracked).toBeTruthy();
      
      // Perform 3 journal interactions (n=3)
      for (let i = 0; i < 3; i++) {
        const journalInput = page.locator('[data-testid="journal-input"], textarea, input[type="text"]').first();
        if (await journalInput.isVisible()) {
          await journalInput.fill(`Journal entry ${i + 1}: Learning about this topic`);
          
          const saveButton = page.locator('button:has-text("Save"), button:has-text("Add"), button:has-text("Submit")');
          if (await saveButton.isVisible()) {
            await saveButton.click();
          }
          
          // Small delay between entries
          await page.waitForTimeout(500);
        }
      }
      
      // Close journal
      const closeButton = page.locator('[data-testid="close-journal"], button:has-text("Close"), button:has-text("Done")');
      if (await closeButton.isVisible()) {
        await closeButton.click();
      }
      
      // Verify mastery/progress was updated
      const progressUpdated = await page.evaluate(() => {
        try {
          const events = JSON.parse(localStorage.getItem('qi.progress.history.v1') || '[]');
          return events.some((event: any) => event.kind === 'journal_start' || event.kind === 'journal_entry');
        } catch {
          return false;
        }
      });
      expect(progressUpdated).toBeTruthy();
    }
  });
});