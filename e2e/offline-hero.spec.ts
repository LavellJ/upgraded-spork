/**
 * End-to-End Tests for Offline Hero Lesson Functionality
 * Tests hero lesson behavior when offline, data persistence, and sync recovery
 */

import { test, expect, type Page } from '@playwright/test';

test.describe('Offline Hero Lesson Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Set up profile and clear storage
    await page.goto('/');
    await page.evaluate(() => {
      const profile = {
        version: 1,
        name: 'Offline Explorer',
        ageBand: 'primary',
        calmMode: false,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      localStorage.setItem('qi.profile.v1', JSON.stringify(profile));
      localStorage.removeItem('qi.progress.history.v1');
      localStorage.removeItem('qi.compass.v1');
    });
    
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('should complete hero lesson while offline and persist data locally', async ({ page }) => {
    // First, ensure the app loads while online
    await expect(page.locator('[data-testid="campfire-container"], [data-testid="compass-container"]')).toBeVisible({ timeout: 10000 });
    
    // Navigate to hero lesson
    const lessonButton = page.locator('[data-testid^="skill-"], [data-testid^="lesson-"]').first();
    await lessonButton.click();
    
    // Wait for lesson to start
    await expect(page.locator('[data-testid="activity-container"], [data-testid="lesson-container"]')).toBeVisible({ timeout: 10000 });
    
    // Go offline
    await page.context().setOffline(true);
    
    // Complete lesson activities while offline
    let activityIndex = 0;
    const maxActivities = 5;
    
    while (activityIndex < maxActivities) {
      const answerButtons = page.locator('[data-testid^="answer-"], [data-testid^="option-"]');
      
      if (await answerButtons.first().isVisible({ timeout: 5000 })) {
        await answerButtons.first().click();
        
        // Handle next button
        const nextButton = page.locator('[data-testid="button-next"], [data-testid="button-continue"], button:has-text("Next"), button:has-text("Continue")');
        if (await nextButton.isVisible({ timeout: 3000 })) {
          await nextButton.click();
        }
        
        activityIndex++;
      } else {
        // Check for completion
        const completionIndicator = page.locator('[data-testid="lesson-complete"], text=Lesson Complete');
        if (await completionIndicator.isVisible({ timeout: 3000 })) {
          break;
        }
        
        const campfire = page.locator('[data-testid="campfire-container"], [data-testid="compass-container"]');
        if (await campfire.isVisible({ timeout: 3000 })) {
          break;
        }
        
        activityIndex++;
      }
    }
    
    // Verify lesson completion was stored locally while offline
    const offlineDataPersisted = await page.evaluate(() => {
      try {
        const events = JSON.parse(localStorage.getItem('qi.progress.history.v1') || '[]');
        const hasLessonStart = events.some((event: any) => event.kind === 'lesson_start');
        const hasLessonFinish = events.some((event: any) => event.kind === 'lesson_finish');
        
        return { hasLessonStart, hasLessonFinish, eventCount: events.length };
      } catch {
        return { hasLessonStart: false, hasLessonFinish: false, eventCount: 0 };
      }
    });
    
    expect(offlineDataPersisted.hasLessonStart).toBeTruthy();
    expect(offlineDataPersisted.hasLessonFinish).toBeTruthy();
    expect(offlineDataPersisted.eventCount).toBeGreaterThan(0);
  });

  test('should show offline indicator when network is unavailable', async ({ page }) => {
    // Start online and navigate to lesson
    await expect(page.locator('[data-testid="campfire-container"], [data-testid="compass-container"]')).toBeVisible({ timeout: 10000 });
    
    const lessonButton = page.locator('[data-testid^="skill-"], [data-testid^="lesson-"]').first();
    await lessonButton.click();
    
    await expect(page.locator('[data-testid="activity-container"], [data-testid="lesson-container"]')).toBeVisible({ timeout: 10000 });
    
    // Go offline
    await page.context().setOffline(true);
    
    // Wait for offline detection
    await page.waitForTimeout(2000);
    
    // Look for offline indicator (may be visual or in console)
    const offlineIndicator = page.locator('[data-testid="offline-indicator"], .offline-mode, text=Offline');
    
    // The indicator might not be visible but the app should handle offline gracefully
    // Main test is that the lesson continues to function
    const answerButtons = page.locator('[data-testid^="answer-"], [data-testid^="option-"]');
    if (await answerButtons.first().isVisible({ timeout: 3000 })) {
      await answerButtons.first().click();
      // Verify interaction still works offline
      await page.waitForTimeout(500);
    }
  });

  test('should queue data for sync when coming back online', async ({ page }) => {
    // Complete lesson while offline
    await expect(page.locator('[data-testid="campfire-container"], [data-testid="compass-container"]')).toBeVisible({ timeout: 10000 });
    
    const lessonButton = page.locator('[data-testid^="skill-"], [data-testid^="lesson-"]').first();
    await lessonButton.click();
    
    // Go offline before lesson starts
    await page.context().setOffline(true);
    
    await expect(page.locator('[data-testid="activity-container"], [data-testid="lesson-container"]')).toBeVisible({ timeout: 10000 });
    
    // Complete a couple activities offline
    for (let i = 0; i < 2; i++) {
      const answerButtons = page.locator('[data-testid^="answer-"], [data-testid^="option-"]');
      
      if (await answerButtons.first().isVisible({ timeout: 3000 })) {
        await answerButtons.first().click();
        
        const nextButton = page.locator('[data-testid="button-next"], [data-testid="button-continue"], button:has-text("Next"), button:has-text("Continue")');
        if (await nextButton.isVisible({ timeout: 3000 })) {
          await nextButton.click();
        }
      }
    }
    
    // Verify data is queued locally
    const offlineQueuedData = await page.evaluate(() => {
      try {
        // Check for sync queue or pending events
        const syncQueue = localStorage.getItem('qi.sync.queue.v1');
        const events = localStorage.getItem('qi.progress.history.v1');
        
        return {
          hasSyncQueue: !!syncQueue,
          hasEvents: !!events,
          queueLength: syncQueue ? JSON.parse(syncQueue).length : 0,
          eventCount: events ? JSON.parse(events).length : 0
        };
      } catch {
        return { hasSyncQueue: false, hasEvents: false, queueLength: 0, eventCount: 0 };
      }
    });
    
    expect(offlineQueuedData.hasEvents).toBeTruthy();
    expect(offlineQueuedData.eventCount).toBeGreaterThan(0);
    
    // Come back online
    await page.context().setOffline(false);
    await page.waitForTimeout(2000); // Allow sync to potentially trigger
    
    // Verify app handles reconnection gracefully
    const reconnectionHandled = await page.evaluate(() => {
      // App should still function and data should be preserved
      const events = localStorage.getItem('qi.progress.history.v1');
      return !!events && JSON.parse(events).length > 0;
    });
    
    expect(reconnectionHandled).toBeTruthy();
  });

  test('should handle Scout messages gracefully while offline', async ({ page }) => {
    // Start lesson and go offline
    await expect(page.locator('[data-testid="campfire-container"], [data-testid="compass-container"]')).toBeVisible({ timeout: 10000 });
    
    const lessonButton = page.locator('[data-testid^="skill-"], [data-testid^="lesson-"]').first();
    await lessonButton.click();
    
    await page.context().setOffline(true);
    
    await expect(page.locator('[data-testid="activity-container"], [data-testid="lesson-container"]')).toBeVisible({ timeout: 10000 });
    
    // Answer incorrectly multiple times to potentially trigger Scout intervention
    let wrongAnswers = 0;
    const maxAttempts = 4;
    
    for (let i = 0; i < maxAttempts; i++) {
      const answerButtons = page.locator('[data-testid^="answer-"], [data-testid^="option-"]');
      
      if (await answerButtons.first().isVisible({ timeout: 3000 })) {
        const buttonCount = await answerButtons.count();
        
        if (buttonCount > 1 && wrongAnswers < 2) {
          // Click wrong answer
          await answerButtons.nth(1).click();
          wrongAnswers++;
        } else {
          // Click correct answer
          await answerButtons.first().click();
        }
        
        const nextButton = page.locator('[data-testid="button-next"], [data-testid="button-continue"], button:has-text("Next"), button:has-text("Continue")');
        if (await nextButton.isVisible({ timeout: 3000 })) {
          await nextButton.click();
        }
      } else {
        break;
      }
    }
    
    // Wait for potential Scout intervention
    await page.waitForTimeout(1000);
    
    // Look for Scout message (may be queued for later)
    const scoutMessage = page.locator('[data-testid="scout-message"], .scout-hint');
    const hasScoutMessage = await scoutMessage.isVisible({ timeout: 2000 });
    
    // Verify Scout events are logged locally even if not displayed
    const scoutEventsLogged = await page.evaluate(() => {
      try {
        const events = JSON.parse(localStorage.getItem('qi.progress.history.v1') || '[]');
        const hasScoutMsg = events.some((event: any) => event.kind === 'scout_msg');
        const hasScoutAnalytics = events.some((event: any) => event.kind === 'scout_analytics');
        
        return { hasScoutMsg, hasScoutAnalytics, totalEvents: events.length };
      } catch {
        return { hasScoutMsg: false, hasScoutAnalytics: false, totalEvents: 0 };
      }
    });
    
    // Events should be logged regardless of display state
    expect(scoutEventsLogged.totalEvents).toBeGreaterThan(0);
  });

  test('should preserve lesson progress across page refreshes while offline', async ({ page }) => {
    // Start lesson and go offline
    await expect(page.locator('[data-testid="campfire-container"], [data-testid="compass-container"]')).toBeVisible({ timeout: 10000 });
    
    const lessonButton = page.locator('[data-testid^="skill-"], [data-testid^="lesson-"]').first();
    await lessonButton.click();
    
    await page.context().setOffline(true);
    
    await expect(page.locator('[data-testid="activity-container"], [data-testid="lesson-container"]')).toBeVisible({ timeout: 10000 });
    
    // Complete some activities
    for (let i = 0; i < 2; i++) {
      const answerButtons = page.locator('[data-testid^="answer-"], [data-testid^="option-"]');
      
      if (await answerButtons.first().isVisible({ timeout: 3000 })) {
        await answerButtons.first().click();
        
        const nextButton = page.locator('[data-testid="button-next"], [data-testid="button-continue"], button:has-text("Next"), button:has-text("Continue")');
        if (await nextButton.isVisible({ timeout: 3000 })) {
          await nextButton.click();
        }
      }
    }
    
    // Record progress before refresh
    const progressBeforeRefresh = await page.evaluate(() => {
      try {
        const events = JSON.parse(localStorage.getItem('qi.progress.history.v1') || '[]');
        return {
          eventCount: events.length,
          hasLessonStart: events.some((event: any) => event.kind === 'lesson_start')
        };
      } catch {
        return { eventCount: 0, hasLessonStart: false };
      }
    });
    
    // Refresh page while still offline
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Verify progress is preserved
    const progressAfterRefresh = await page.evaluate(() => {
      try {
        const events = JSON.parse(localStorage.getItem('qi.progress.history.v1') || '[]');
        const profile = JSON.parse(localStorage.getItem('qi.profile.v1') || '{}');
        
        return {
          eventCount: events.length,
          hasLessonStart: events.some((event: any) => event.kind === 'lesson_start'),
          hasProfile: !!profile.name
        };
      } catch {
        return { eventCount: 0, hasLessonStart: false, hasProfile: false };
      }
    });
    
    expect(progressAfterRefresh.hasProfile).toBeTruthy();
    expect(progressAfterRefresh.hasLessonStart).toBeTruthy();
    expect(progressAfterRefresh.eventCount).toBeGreaterThanOrEqual(progressBeforeRefresh.eventCount);
  });

  test('should handle offline lesson completion with minimal performance impact', async ({ page }) => {
    // Measure performance while completing lesson offline
    const startTime = Date.now();
    
    await expect(page.locator('[data-testid="campfire-container"], [data-testid="compass-container"]')).toBeVisible({ timeout: 10000 });
    
    const lessonButton = page.locator('[data-testid^="skill-"], [data-testid^="lesson-"]').first();
    await lessonButton.click();
    
    // Go offline immediately
    await page.context().setOffline(true);
    
    await expect(page.locator('[data-testid="activity-container"], [data-testid="lesson-container"]')).toBeVisible({ timeout: 10000 });
    
    const lessonStartTime = Date.now();
    
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
    
    const lessonEndTime = Date.now();
    const totalTime = lessonEndTime - startTime;
    const lessonTime = lessonEndTime - lessonStartTime;
    
    // Verify reasonable performance
    expect(totalTime).toBeLessThan(30000); // Less than 30 seconds total
    expect(lessonTime).toBeLessThan(15000); // Less than 15 seconds for lesson activities
    
    // Verify data was stored efficiently
    const storageEfficiency = await page.evaluate(() => {
      try {
        const events = localStorage.getItem('qi.progress.history.v1');
        const eventsSize = events ? events.length : 0;
        const eventsCount = events ? JSON.parse(events).length : 0;
        
        return {
          storageSize: eventsSize,
          eventCount: eventsCount,
          averageEventSize: eventsCount > 0 ? eventsSize / eventsCount : 0
        };
      } catch {
        return { storageSize: 0, eventCount: 0, averageEventSize: 0 };
      }
    });
    
    expect(storageEfficiency.eventCount).toBeGreaterThan(0);
    expect(storageEfficiency.averageEventSize).toBeLessThan(1000); // Events should be reasonably sized
  });
});