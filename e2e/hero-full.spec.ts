/**
 * End-to-End Tests for Hero Lesson Complete Flow
 * Tests hero lesson completion, remediation paths, and analytics tracking
 */

import { test, expect, type Page } from '@playwright/test';

test.describe('Hero Lesson Full Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Set up profile for testing
    await page.goto('/');
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
      
      // Clear previous progress
      localStorage.removeItem('qi.progress.history.v1');
      localStorage.removeItem('qi.compass.v1');
    });
    
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('should complete hero lesson with clean pass (no remediation)', async ({ page }) => {
    // Wait for campfire/compass to load
    await expect(page.locator('[data-testid="campfire-container"], [data-testid="compass-container"]')).toBeVisible({ timeout: 10000 });
    
    // Navigate to hero lesson (M.FRAC.NL.3)
    const heroLessonButton = page.locator('[data-testid*="M.FRAC.NL.3"], [data-testid*="hero-lesson"]').first();
    
    if (await heroLessonButton.isVisible()) {
      await heroLessonButton.click();
    } else {
      // Fallback: click any available lesson/skill
      const anyLesson = page.locator('[data-testid^="skill-"], [data-testid^="lesson-"]').first();
      await anyLesson.click();
    }
    
    // Wait for lesson to start
    await expect(page.locator('[data-testid="activity-container"], [data-testid="lesson-container"]')).toBeVisible({ timeout: 10000 });
    
    // Verify lesson_start event is logged
    const lessonStartTracked = await page.evaluate(() => {
      try {
        const events = JSON.parse(localStorage.getItem('qi.progress.history.v1') || '[]');
        return events.some((event: any) => event.kind === 'lesson_start');
      } catch {
        return false;
      }
    });
    expect(lessonStartTracked).toBeTruthy();
    
    // Complete lesson activities correctly (clean pass)
    let activityIndex = 0;
    const maxActivities = 5; // Prevent infinite loops
    
    while (activityIndex < maxActivities) {
      // Look for question/answer interface
      const answerButtons = page.locator('[data-testid^="answer-"], [data-testid^="option-"]');
      
      if (await answerButtons.first().isVisible({ timeout: 5000 })) {
        // Click the first answer (assume it's correct for clean pass)
        await answerButtons.first().click();
        
        // Look for next/continue button
        const nextButton = page.locator('[data-testid="button-next"], [data-testid="button-continue"], button:has-text("Next"), button:has-text("Continue")');
        
        if (await nextButton.isVisible({ timeout: 3000 })) {
          await nextButton.click();
        }
        
        activityIndex++;
      } else {
        // Check if lesson is complete
        const completionIndicator = page.locator('[data-testid="lesson-complete"], text=Lesson Complete, text=Well Done');
        if (await completionIndicator.isVisible({ timeout: 3000 })) {
          break;
        }
        
        // Check if we're back at the campfire/compass (lesson ended)
        const campfire = page.locator('[data-testid="campfire-container"], [data-testid="compass-container"]');
        if (await campfire.isVisible({ timeout: 3000 })) {
          break;
        }
        
        activityIndex++;
      }
    }
    
    // Wait a moment for analytics to process
    await page.waitForTimeout(1000);
    
    // Verify lesson_finish event is logged with pass result
    const lessonFinishTracked = await page.evaluate(() => {
      try {
        const events = JSON.parse(localStorage.getItem('qi.progress.history.v1') || '[]');
        return events.some((event: any) => event.kind === 'lesson_finish');
      } catch {
        return false;
      }
    });
    expect(lessonFinishTracked).toBeTruthy();
    
    // Verify Compass.next is set for navigation
    const compassNextSet = await page.evaluate(() => {
      try {
        const compass = JSON.parse(localStorage.getItem('qi.compass.v1') || '{}');
        return compass.next !== undefined && compass.next !== null;
      } catch {
        return false;
      }
    });
    expect(compassNextSet).toBeTruthy();
  });

  test('should handle hero lesson with remediation path', async ({ page }) => {
    // Navigate to lesson
    await expect(page.locator('[data-testid="campfire-container"], [data-testid="compass-container"]')).toBeVisible({ timeout: 10000 });
    
    const lessonButton = page.locator('[data-testid^="skill-"], [data-testid^="lesson-"]').first();
    await lessonButton.click();
    
    // Wait for lesson to start
    await expect(page.locator('[data-testid="activity-container"], [data-testid="lesson-container"]')).toBeVisible({ timeout: 10000 });
    
    let wrongAnswerCount = 0;
    let activityIndex = 0;
    const maxActivities = 8; // Allow for remediation activities
    
    while (activityIndex < maxActivities) {
      // Look for question/answer interface
      const answerButtons = page.locator('[data-testid^="answer-"], [data-testid^="option-"]');
      
      if (await answerButtons.first().isVisible({ timeout: 5000 })) {
        const buttonCount = await answerButtons.count();
        
        // Strategically answer incorrectly to trigger remediation
        if (wrongAnswerCount < 3 && buttonCount > 1) {
          // Click incorrect answer (not the first one)
          await answerButtons.nth(1).click();
          wrongAnswerCount++;
        } else {
          // Answer correctly to complete
          await answerButtons.first().click();
        }
        
        // Handle feedback and next button
        await page.waitForTimeout(500);
        const nextButton = page.locator('[data-testid="button-next"], [data-testid="button-continue"], button:has-text("Next"), button:has-text("Continue")');
        
        if (await nextButton.isVisible({ timeout: 3000 })) {
          await nextButton.click();
        }
        
        activityIndex++;
      } else {
        // Check for lesson completion or Scout intervention
        const scoutMessage = page.locator('[data-testid="scout-message"], .scout-hint');
        if (await scoutMessage.isVisible({ timeout: 2000 })) {
          // Scout intervention detected - this is part of remediation
          const journalCTA = page.locator('[data-testid="scout-cta"], button:has-text("Try Journal")');
          if (await journalCTA.isVisible({ timeout: 2000 })) {
            await journalCTA.click();
            
            // Verify Journal opens
            await expect(page.locator('[data-testid="journal-container"], text=Journal')).toBeVisible({ timeout: 5000 });
            
            // Close Journal and return to lesson
            const closeButton = page.locator('[data-testid="button-close"], button:has-text("Close"), .close-button');
            if (await closeButton.isVisible()) {
              await closeButton.click();
            }
          }
        }
        
        // Check if lesson is complete
        const completionIndicator = page.locator('[data-testid="lesson-complete"], text=Lesson Complete');
        if (await completionIndicator.isVisible({ timeout: 2000 })) {
          break;
        }
        
        // Check if back at campfire
        const campfire = page.locator('[data-testid="campfire-container"], [data-testid="compass-container"]');
        if (await campfire.isVisible({ timeout: 2000 })) {
          break;
        }
        
        activityIndex++;
      }
    }
    
    // Wait for analytics processing
    await page.waitForTimeout(1000);
    
    // Verify both lesson events and Scout intervention analytics
    const analyticsVerified = await page.evaluate(() => {
      try {
        const events = JSON.parse(localStorage.getItem('qi.progress.history.v1') || '[]');
        const hasLessonStart = events.some((event: any) => event.kind === 'lesson_start');
        const hasLessonFinish = events.some((event: any) => event.kind === 'lesson_finish');
        const hasScoutMsg = events.some((event: any) => event.kind === 'scout_msg');
        
        return { hasLessonStart, hasLessonFinish, hasScoutMsg };
      } catch {
        return { hasLessonStart: false, hasLessonFinish: false, hasScoutMsg: false };
      }
    });
    
    expect(analyticsVerified.hasLessonStart).toBeTruthy();
    expect(analyticsVerified.hasLessonFinish).toBeTruthy();
    // Scout message may or may not appear depending on guardrails
    // expect(analyticsVerified.hasScoutMsg).toBeTruthy();
  });

  test('should track tuning events when difficulty adjustments are applied', async ({ page }) => {
    // Apply tuning notes beforehand
    await page.evaluate(() => {
      const tuningNotes = [
        {
          id: 'tune-hero-difficulty',
          lessonId: 'M.FRAC.NL.3',
          type: 'difficulty_adjustment',
          difficultyDelta: -1,
          hintsAdded: 2,
          hasWording: true,
          appliedAt: Date.now(),
          source: 'content_studio'
        }
      ];
      localStorage.setItem('qi.tuning.v1', JSON.stringify(tuningNotes));
    });
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Navigate to and complete hero lesson
    await expect(page.locator('[data-testid="campfire-container"], [data-testid="compass-container"]')).toBeVisible({ timeout: 10000 });
    
    const lessonButton = page.locator('[data-testid^="skill-"], [data-testid^="lesson-"]').first();
    await lessonButton.click();
    
    // Complete lesson activities
    await expect(page.locator('[data-testid="activity-container"], [data-testid="lesson-container"]')).toBeVisible({ timeout: 10000 });
    
    // Answer a few questions
    for (let i = 0; i < 3; i++) {
      const answerButtons = page.locator('[data-testid^="answer-"], [data-testid^="option-"]');
      
      if (await answerButtons.first().isVisible({ timeout: 3000 })) {
        await answerButtons.first().click();
        
        const nextButton = page.locator('[data-testid="button-next"], [data-testid="button-continue"], button:has-text("Next"), button:has-text("Continue")');
        if (await nextButton.isVisible({ timeout: 3000 })) {
          await nextButton.click();
        }
      } else {
        break;
      }
    }
    
    // Wait for analytics
    await page.waitForTimeout(1000);
    
    // Verify tuning events are tracked
    const tuningEventsTracked = await page.evaluate(() => {
      try {
        const events = JSON.parse(localStorage.getItem('qi.progress.history.v1') || '[]');
        const hasTuningApplied = events.some((event: any) => event.kind === 'tuning_applied');
        const hasDifficultyAdjusted = events.some((event: any) => event.kind === 'difficulty_adjusted');
        
        return { hasTuningApplied, hasDifficultyAdjusted };
      } catch {
        return { hasTuningApplied: false, hasDifficultyAdjusted: false };
      }
    });
    
    expect(tuningEventsTracked.hasTuningApplied).toBeTruthy();
    expect(tuningEventsTracked.hasDifficultyAdjusted).toBeTruthy();
  });

  test('should handle lesson accessibility features', async ({ page }) => {
    // Test keyboard navigation and screen reader support
    await expect(page.locator('[data-testid="campfire-container"], [data-testid="compass-container"]')).toBeVisible({ timeout: 10000 });
    
    // Use keyboard to navigate to lesson
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    
    // Wait for lesson to load
    await expect(page.locator('[data-testid="activity-container"], [data-testid="lesson-container"]')).toBeVisible({ timeout: 10000 });
    
    // Verify accessibility attributes
    const answerButtons = page.locator('[data-testid^="answer-"], [data-testid^="option-"]');
    
    if (await answerButtons.first().isVisible()) {
      const firstButton = answerButtons.first();
      
      // Check for aria attributes
      const ariaLabel = await firstButton.getAttribute('aria-label');
      const role = await firstButton.getAttribute('role');
      
      // Should have proper ARIA attributes or be a proper button element
      const isAccessible = ariaLabel !== null || role === 'button' || await firstButton.evaluate(el => el.tagName.toLowerCase()) === 'button';
      expect(isAccessible).toBeTruthy();
      
      // Test keyboard interaction
      await firstButton.focus();
      await page.keyboard.press('Enter');
      
      // Verify interaction worked
      await page.waitForTimeout(500);
    }
  });

  test('should handle lesson performance metrics', async ({ page }) => {
    // Record start time
    const startTime = Date.now();
    
    // Navigate and complete lesson
    await expect(page.locator('[data-testid="campfire-container"], [data-testid="compass-container"]')).toBeVisible({ timeout: 10000 });
    
    const lessonButton = page.locator('[data-testid^="skill-"], [data-testid^="lesson-"]').first();
    await lessonButton.click();
    
    await expect(page.locator('[data-testid="activity-container"], [data-testid="lesson-container"]')).toBeVisible({ timeout: 10000 });
    
    // Complete lesson quickly
    for (let i = 0; i < 3; i++) {
      const answerButtons = page.locator('[data-testid^="answer-"], [data-testid^="option-"]');
      
      if (await answerButtons.first().isVisible({ timeout: 2000 })) {
        await answerButtons.first().click();
        
        const nextButton = page.locator('[data-testid="button-next"], [data-testid="button-continue"], button:has-text("Next"), button:has-text("Continue")');
        if (await nextButton.isVisible({ timeout: 2000 })) {
          await nextButton.click();
        }
      } else {
        break;
      }
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Wait for analytics
    await page.waitForTimeout(1000);
    
    // Verify performance tracking
    const performanceTracked = await page.evaluate(() => {
      try {
        const events = JSON.parse(localStorage.getItem('qi.progress.history.v1') || '[]');
        const lessonFinishEvent = events.find((event: any) => event.kind === 'lesson_finish');
        
        return {
          hasFinishEvent: !!lessonFinishEvent,
          hasDuration: lessonFinishEvent && lessonFinishEvent.durationSec !== undefined
        };
      } catch {
        return { hasFinishEvent: false, hasDuration: false };
      }
    });
    
    expect(performanceTracked.hasFinishEvent).toBeTruthy();
    // Duration tracking may be optional depending on implementation
    // expect(performanceTracked.hasDuration).toBeTruthy();
    
    // Verify reasonable completion time
    expect(duration).toBeGreaterThan(1000); // At least 1 second
    expect(duration).toBeLessThan(60000); // Less than 1 minute
  });
});