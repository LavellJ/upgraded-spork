import { test, expect } from '@playwright/test';

test.describe('Profile and Export Coverage', () => {
  test('should export all analytics datasets including onTask and funnel data', async ({ page }) => {
    // Navigate to app and set up test data
    await page.goto('/');
    
    // Set up comprehensive test data
    await page.evaluate(() => {
      // Create test profile
      const profile = {
        version: 1,
        name: 'Export Test Child',
        ageBand: 'primary',
        calmMode: true,
        createdAt: Date.now() - 100000,
        updatedAt: Date.now()
      };
      localStorage.setItem('qi.profile.v1', JSON.stringify(profile));
      
      // Create test roster
      const roster = {
        version: 1,
        learners: [{
          id: 'test-learner-1',
          name: 'Test Learner',
          ageBand: 'primary',
          createdAt: Date.now(),
          updatedAt: Date.now()
        }],
        activeLearnerId: 'test-learner-1',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      localStorage.setItem('qi.roster.v1', JSON.stringify(roster));
      
      // Create test progress events (including funnel data)
      const progressEvents = [
        { kind: 'funnel', at: Date.now() - 90000, step: 'onboard' },
        { kind: 'lesson_start', at: Date.now() - 80000, lessonId: 'f1', biomeId: 'forest' },
        { kind: 'funnel', at: Date.now() - 70000, step: 'first_lesson_start' },
        { kind: 'lesson_finish', at: Date.now() - 60000, lessonId: 'f1', biomeId: 'forest', result: 'pass' },
        { kind: 'funnel', at: Date.now() - 50000, step: 'first_lesson_finish' },
        { kind: 'journal_start', at: Date.now() - 40000, skillId: 'literacy.phonics', source: 'manual' },
        { kind: 'funnel', at: Date.now() - 30000, step: 'first_journal' },
        { kind: 'scout_analytics', at: Date.now() - 20000, id: 'msg1', priority: 'actionable', action: 'shown', dwellMs: 5000, sessionId: 'sess1' },
        { kind: 'scout_analytics', at: Date.now() - 10000, id: 'msg1', priority: 'actionable', action: 'clicked', sessionId: 'sess1' }
      ];
      localStorage.setItem('qi.test-learner-1.progress.history.v1', JSON.stringify(progressEvents));
      
      // Create test onTask data
      const onTaskTicks = [
        { at: Date.now() - 95000, kind: 'start', source: 'lesson' },
        { at: Date.now() - 85000, kind: 'idle', source: 'lesson' },
        { at: Date.now() - 75000, kind: 'resume', source: 'lesson' },
        { at: Date.now() - 65000, kind: 'stop', source: 'lesson' },
        { at: Date.now() - 45000, kind: 'start', source: 'journal' },
        { at: Date.now() - 35000, kind: 'stop', source: 'journal' }
      ];
      localStorage.setItem('qi.test-learner-1.onTask.v1', JSON.stringify(onTaskTicks));
      
      // Create test journal history
      const journalHistory = [
        { skillId: 'literacy.phonics', entries: [{ text: 'Test entry', at: Date.now() - 40000 }] }
      ];
      localStorage.setItem('qi.test-learner-1.journal.history.v1', JSON.stringify(journalHistory));
      
      // Create test learner model
      const learnerModel = { version: 1, skills: {}, preferences: {} };
      localStorage.setItem('qi.test-learner-1.learner.v1', JSON.stringify(learnerModel));
    });
    
    await page.reload();
    
    // Open Teacher Panel and navigate to Privacy
    const teacherButton = page.locator('[data-testid="teacher-panel"], button:has-text("⚙️")');
    await teacherButton.click();
    
    // Look for Privacy tab or button
    const privacyTab = page.locator('[data-testid="privacy-tab"], button:has-text("Privacy")');
    await privacyTab.click();
    
    // Wait for Privacy sheet to open
    await expect(page.locator('[data-testid="privacy-sheet"], .privacy-content')).toBeVisible({ timeout: 10000 });
    
    // Find and click export button
    const exportButton = page.locator('button:has-text("Export"), button:has-text("Download")');
    await exportButton.click();
    
    // Handle the download and verify export content
    const downloadPromise = page.waitForEvent('download');
    const download = await downloadPromise;
    
    // Get the downloaded file content
    const downloadPath = await download.path();
    const fs = require('fs');
    const exportedData = JSON.parse(fs.readFileSync(downloadPath, 'utf8'));
    
    // Verify export structure
    expect(exportedData).toHaveProperty('version', '2.0');
    expect(exportedData).toHaveProperty('roster');
    expect(exportedData).toHaveProperty('data');
    expect(exportedData).toHaveProperty('exportedAt');
    
    // Verify roster data
    expect(exportedData.roster.learners).toHaveLength(1);
    expect(exportedData.roster.learners[0].id).toBe('test-learner-1');
    
    // Verify learner data includes all expected datasets
    const learnerData = exportedData.data['test-learner-1'];
    expect(learnerData).toBeDefined();
    
    // Check that all key datasets are included
    expect(learnerData).toHaveProperty('events'); // Progress events (includes funnel data)
    expect(learnerData).toHaveProperty('onTask'); // OnTask ticks
    expect(learnerData).toHaveProperty('journal'); // Journal history
    expect(learnerData).toHaveProperty('model'); // Learner model
    
    // Verify funnel events are included in progress events
    const events = learnerData.events;
    expect(events).toBeInstanceOf(Array);
    
    const funnelEvents = events.filter((event: any) => event.kind === 'funnel');
    expect(funnelEvents).toHaveLength(4); // onboard, first_lesson_start, first_lesson_finish, first_journal
    
    const funnelSteps = funnelEvents.map((event: any) => event.step);
    expect(funnelSteps).toContain('onboard');
    expect(funnelSteps).toContain('first_lesson_start');
    expect(funnelSteps).toContain('first_lesson_finish');
    expect(funnelSteps).toContain('first_journal');
    
    // Verify scout analytics events are included
    const scoutEvents = events.filter((event: any) => event.kind === 'scout_analytics');
    expect(scoutEvents).toHaveLength(2); // shown and clicked events
    
    // Verify onTask data is included
    const onTaskData = learnerData.onTask;
    expect(onTaskData).toBeInstanceOf(Array);
    expect(onTaskData).toHaveLength(6); // All tick events
    
    const tickKinds = onTaskData.map((tick: any) => tick.kind);
    expect(tickKinds).toContain('start');
    expect(tickKinds).toContain('stop');
    expect(tickKinds).toContain('idle');
    expect(tickKinds).toContain('resume');
    
    // Verify onTask sources
    const tickSources = onTaskData.map((tick: any) => tick.source);
    expect(tickSources).toContain('lesson');
    expect(tickSources).toContain('journal');
    
    // Verify journal history is included
    const journalData = learnerData.journal;
    expect(journalData).toBeInstanceOf(Array);
    expect(journalData[0]).toHaveProperty('skillId', 'literacy.phonics');
    expect(journalData[0].entries[0]).toHaveProperty('text', 'Test entry');
    
    console.log('✅ Export verification complete:');
    console.log(`- Roster: ${exportedData.roster.learners.length} learners`);
    console.log(`- Progress events: ${events.length} total`);
    console.log(`- Funnel events: ${funnelEvents.length} milestones`);
    console.log(`- Scout analytics: ${scoutEvents.length} interactions`);
    console.log(`- OnTask ticks: ${onTaskData.length} engagement points`);
    console.log(`- Journal entries: ${journalData.length} skill sessions`);
  });
  
  test('should handle export when no data exists', async ({ page }) => {
    // Clear all data first
    await page.goto('/');
    
    await page.evaluate(() => {
      localStorage.clear();
      
      // Create minimal roster to allow export
      const roster = {
        version: 1,
        learners: [{
          id: 'empty-learner',
          name: 'Empty Learner',
          ageBand: 'primary',
          createdAt: Date.now(),
          updatedAt: Date.now()
        }],
        activeLearnerId: 'empty-learner',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      localStorage.setItem('qi.roster.v1', JSON.stringify(roster));
    });
    
    await page.reload();
    
    // Open Teacher Panel and export
    const teacherButton = page.locator('[data-testid="teacher-panel"], button:has-text("⚙️")');
    await teacherButton.click();
    
    const privacyTab = page.locator('[data-testid="privacy-tab"], button:has-text("Privacy")');
    await privacyTab.click();
    
    await expect(page.locator('[data-testid="privacy-sheet"], .privacy-content')).toBeVisible({ timeout: 10000 });
    
    const exportButton = page.locator('button:has-text("Export"), button:has-text("Download")');
    await exportButton.click();
    
    // Verify export still works with empty data
    const downloadPromise = page.waitForEvent('download');
    const download = await downloadPromise;
    
    const downloadPath = await download.path();
    const fs = require('fs');
    const exportedData = JSON.parse(fs.readFileSync(downloadPath, 'utf8'));
    
    // Verify basic structure exists even with no data
    expect(exportedData).toHaveProperty('version', '2.0');
    expect(exportedData).toHaveProperty('roster');
    expect(exportedData).toHaveProperty('data');
    
    const learnerData = exportedData.data['empty-learner'];
    expect(learnerData).toBeDefined();
    
    // Empty learner should have empty or undefined datasets, but structure should be preserved
    console.log('✅ Empty data export verification complete');
  });
});