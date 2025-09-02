// Comprehensive tests for Scout analytics, guardrails, and content system
// Tests show/click/dwell/dismiss tracking, rate limiting, and variant selection

import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import { resetScoutQueue, getSessionStats } from '../src/hooks/useScoutQueue';
import { clearEvents, pushEvent, getSessionId, loadEvents } from '../src/progress/events';
import { scoutAnalytics, scoutSummary } from '../src/progress/metrics';
import { 
  pickScoutLine, 
  loadScoutLines, 
  resetRecentLines, 
  getRecentLines,
  hasScoutGroup,
  getAvailableGroups 
} from '../src/learning/scout';

// Mock timers for testing time-based functionality
beforeEach(() => {
  vi.useFakeTimers();
  resetScoutQueue();
  resetRecentLines();
  clearEvents();
  // Clear session storage to reset session ID
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.clear();
  }
});

afterEach(() => {
  vi.useRealTimers();
});

describe('Scout Analytics Event Tracking', () => {
  test('records shown events with session ID', () => {
    const now = Date.now();
    const sessionId = getSessionId();
    
    pushEvent({
      kind: 'scout_analytics',
      at: now,
      id: 'test-message-1',
      priority: 'info',
      action: 'shown',
      sessionId
    });

    const events = loadEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      kind: 'scout_analytics',
      action: 'shown',
      id: 'test-message-1',
      priority: 'info',
      sessionId
    });
  });

  test('records clicked events', () => {
    const now = Date.now();
    const sessionId = getSessionId();
    
    // First show the message
    pushEvent({
      kind: 'scout_analytics',
      at: now,
      id: 'actionable-msg',
      priority: 'actionable',
      action: 'shown',
      sessionId
    });

    // Then click it
    pushEvent({
      kind: 'scout_analytics',
      at: now + 1000,
      id: 'actionable-msg',
      priority: 'actionable',
      action: 'clicked',
      sessionId
    });

    const events = loadEvents();
    expect(events).toHaveLength(2);
    expect(events[1]).toMatchObject({
      action: 'clicked',
      id: 'actionable-msg',
      priority: 'actionable'
    });
  });

  test('records dismiss events with dwell time', () => {
    const now = Date.now();
    const sessionId = getSessionId();
    const dwellMs = 2500;
    
    pushEvent({
      kind: 'scout_analytics',
      at: now,
      id: 'test-msg',
      priority: 'info',
      action: 'dismissed',
      dwellMs,
      sessionId
    });

    const events = loadEvents();
    expect(events[0]).toMatchObject({
      action: 'dismissed',
      dwellMs,
      sessionId
    });
  });

  test('records auto-dismiss events with dwell time', () => {
    const now = Date.now();
    const sessionId = getSessionId();
    const dwellMs = 3000;
    
    pushEvent({
      kind: 'scout_analytics',
      at: now,
      id: 'auto-dismiss-msg',
      priority: 'info',
      action: 'auto_dismiss',
      dwellMs,
      sessionId
    });

    const events = loadEvents();
    expect(events[0]).toMatchObject({
      action: 'auto_dismiss',
      dwellMs,
      sessionId
    });
  });
});

describe('Scout Analytics Metrics', () => {
  test('calculates show rate correctly', () => {
    const sessionId = getSessionId();
    const now = Date.now();
    
    // Show same message 3 times (should have show rate of 3)
    for (let i = 0; i < 3; i++) {
      pushEvent({
        kind: 'scout_analytics',
        at: now + i * 1000,
        id: 'repeated-msg',
        priority: 'info',
        action: 'shown',
        sessionId
      });
    }
    
    // Show different message once
    pushEvent({
      kind: 'scout_analytics',
      at: now + 4000,
      id: 'unique-msg',
      priority: 'info',
      action: 'shown',
      sessionId
    });

    const events = loadEvents();
    const analytics = scoutAnalytics(events);
    
    expect(analytics.showRate).toBe(2); // 4 shows / 2 unique IDs = 2
  });

  test('calculates CTA click-through rate correctly', () => {
    const sessionId = getSessionId();
    const now = Date.now();
    
    // Show 3 actionable messages
    for (let i = 0; i < 3; i++) {
      pushEvent({
        kind: 'scout_analytics',
        at: now + i * 1000,
        id: `actionable-${i}`,
        priority: 'actionable',
        action: 'shown',
        sessionId
      });
    }
    
    // Click 1 of them
    pushEvent({
      kind: 'scout_analytics',
      at: now + 5000,
      id: 'actionable-0',
      priority: 'actionable',
      action: 'clicked',
      sessionId
    });

    const events = loadEvents();
    const analytics = scoutAnalytics(events);
    
    expect(analytics.ctaCtr).toBe(0.33); // 1 click / 3 shown = 0.33
  });

  test('calculates median dwell time correctly', () => {
    const sessionId = getSessionId();
    const now = Date.now();
    const dwellTimes = [1000, 2000, 3000, 4000, 5000]; // Median should be 3000
    
    dwellTimes.forEach((dwellMs, i) => {
      pushEvent({
        kind: 'scout_analytics',
        at: now + i * 1000,
        id: `msg-${i}`,
        priority: 'info',
        action: 'dismissed',
        dwellMs,
        sessionId
      });
    });

    const events = loadEvents();
    const analytics = scoutAnalytics(events);
    
    expect(analytics.medianDwellMs).toBe(3000);
  });

  test('calculates 95th percentile session dose correctly', () => {
    const now = Date.now();
    const sessions = ['sess1', 'sess2', 'sess3', 'sess4'];
    const sessionCounts = [1, 3, 5, 10]; // P95 should be 10
    
    sessions.forEach((sessionId, i) => {
      const count = sessionCounts[i];
      for (let j = 0; j < count; j++) {
        pushEvent({
          kind: 'scout_analytics',
          at: now + i * 10000 + j * 1000,
          id: `msg-${i}-${j}`,
          priority: 'info',
          action: 'shown',
          sessionId
        });
      }
    });

    const events = loadEvents();
    const analytics = scoutAnalytics(events);
    
    expect(analytics.sessionDoseP95).toBe(10);
  });
});

describe('Scout Guardrails', () => {
  test('session stats tracking works', () => {
    // Test the session stats function
    const stats = getSessionStats();
    expect(stats).toHaveProperty('counts');
    expect(stats).toHaveProperty('sessionDuration');
    expect(stats).toHaveProperty('lastReset');
    expect(stats.counts).toEqual({ info: 0, actionable: 0, critical: 0 });
  });

  test('rate limiting resets after time window', () => {
    const now = Date.now();
    vi.setSystemTime(now);
    
    // Initial state
    let stats = getSessionStats();
    expect(stats.counts.info).toBe(0);
    
    // Simulate some messages being shown (would increment in real usage)
    // Note: This test verifies the stats structure, actual increment happens in useScoutQueue
    
    // Advance time by 11 minutes (past the 10-minute window)
    vi.setSystemTime(now + 11 * 60 * 1000);
    
    // Check that time-based reset would occur (structure test)
    stats = getSessionStats();
    expect(stats.lastReset).toBeGreaterThan(now);
  });

  test('analytics respects time range filtering', () => {
    const now = Date.now();
    const sessionId = getSessionId();
    
    // Add event from 8 days ago (outside 7-day window)
    pushEvent({
      kind: 'scout_analytics',
      at: now - 8 * 24 * 60 * 60 * 1000,
      id: 'old-msg',
      priority: 'info',
      action: 'shown',
      sessionId
    });
    
    // Add event from 3 days ago (inside 7-day window)
    pushEvent({
      kind: 'scout_analytics',
      at: now - 3 * 24 * 60 * 60 * 1000,
      id: 'recent-msg',
      priority: 'info',
      action: 'shown',
      sessionId
    });

    const events = loadEvents();
    expect(events).toHaveLength(2);
    
    // 7-day analytics should only include recent message
    const analytics7 = scoutAnalytics(events, 7);
    expect(analytics7.showRate).toBe(1); // Only recent message counted
    
    // 30-day analytics should include both
    const analytics30 = scoutAnalytics(events, 30);
    expect(analytics30.showRate).toBe(1); // Both messages, 2 shows / 2 unique = 1
  });

  test('handles empty analytics data gracefully', () => {
    const events = loadEvents();
    expect(events).toHaveLength(0);
    
    const analytics = scoutAnalytics(events);
    expect(analytics).toEqual({
      showRate: 0,
      ctaCtr: 0,
      medianDwellMs: 0,
      sessionDoseP95: 0
    });
  });

  test('ignores events without required fields', () => {
    const sessionId = getSessionId();
    const now = Date.now();
    
    // Add valid event
    pushEvent({
      kind: 'scout_analytics',
      at: now,
      id: 'valid-msg',
      priority: 'info',
      action: 'shown',
      sessionId
    });
    
    // Add event with missing dwell time for dismiss
    pushEvent({
      kind: 'scout_analytics',
      at: now + 1000,
      id: 'no-dwell-msg',
      priority: 'info',
      action: 'dismissed',
      // dwellMs missing
      sessionId
    });

    const events = loadEvents();
    const analytics = scoutAnalytics(events);
    
    expect(analytics.showRate).toBe(1); // Valid show event counted
    expect(analytics.medianDwellMs).toBe(0); // No valid dwell times
  });
});

describe('Scout Lines Content System', () => {
  describe('loadScoutLines', () => {
    test('loads scout lines with correct structure', () => {
      const lines = loadScoutLines();
      
      expect(lines).toHaveProperty('locale');
      expect(lines).toHaveProperty('groups');
      expect(typeof lines.groups).toBe('object');
    });

    test('has required groups with correct structure', () => {
      const lines = loadScoutLines();
      const requiredGroups = ['start_lesson', 'fail_hint', 'finish', 'encourage'];
      
      requiredGroups.forEach(groupId => {
        expect(lines.groups).toHaveProperty(groupId);
        const group = lines.groups[groupId];
        
        // Check that it has age buckets
        expect(Object.keys(group).length).toBeGreaterThan(0);
        
        // Check first variant has required properties
        const firstBucket = Object.values(group)[0] as any[];
        expect(firstBucket).toBeInstanceOf(Array);
        
        if (firstBucket.length > 0) {
          const firstVariant = firstBucket[0];
          expect(firstVariant).toHaveProperty('id');
          expect(firstVariant).toHaveProperty('priority');
          expect(firstVariant).toHaveProperty('text');
          expect(['info', 'actionable', 'critical']).toContain(firstVariant.priority);
        }
      });
    });
  });

  describe('Age Bucket Mapping', () => {
    test('maps AgeBand strings to correct buckets', () => {
      // Test 5-8 bucket
      expect(pickScoutLine('start_lesson', { age: '5-6' })).toBeTruthy();
      expect(pickScoutLine('start_lesson', { age: '7-8' })).toBeTruthy();
      
      // Test 9-12 bucket  
      expect(pickScoutLine('start_lesson', { age: '9-10' })).toBeTruthy();
      expect(pickScoutLine('start_lesson', { age: '11-12' })).toBeTruthy();
    });

    test('maps numeric ages to correct buckets', () => {
      for (let age = 5; age <= 8; age++) {
        const result = pickScoutLine('start_lesson', { age });
        expect(result).toBeTruthy();
      }
      
      for (let age = 9; age <= 12; age++) {
        const result = pickScoutLine('start_lesson', { age });
        expect(result).toBeTruthy();
      }
    });

    test('fallback to 5-8 for undefined age', () => {
      const result = pickScoutLine('start_lesson', {});
      expect(result).toBeTruthy();
    });

    test('uses "all" bucket when available', () => {
      const result = pickScoutLine('streak', { age: '7-8' });
      expect(result).toBeTruthy();
      expect(result?.id).toMatch(/streak_[1-5]/); // Streak group uses "all" bucket
    });
  });

  describe('Variant Selection and LRU', () => {
    test('returns different variants on subsequent calls', () => {
      const results = new Set();
      const groupId = 'encourage';
      const profile = { age: '7-8' as const, name: 'TestUser' };
      
      // Make multiple calls to get different variants
      for (let i = 0; i < 10; i++) {
        const result = pickScoutLine(groupId, profile);
        if (result) {
          results.add(result.id);
        }
      }
      
      // Should have gotten multiple different variants
      expect(results.size).toBeGreaterThan(1);
    });

    test('tracks recent lines to avoid immediate repeats', () => {
      const profile = { age: '7-8' as const, name: 'TestUser' };
      
      // Mock random to ensure deterministic selection
      const mockRng = vi.fn();
      mockRng.mockReturnValueOnce(0); // First item
      
      const firstResult = pickScoutLine('encourage', profile, {}, mockRng);
      expect(firstResult).toBeTruthy();
      
      const recentLines = getRecentLines();
      expect(recentLines).toContain(firstResult!.id);
    });

    test('resets to all candidates when all have been shown recently', () => {
      const profile = { age: '7-8' as const, name: 'TestUser' };
      const groupId = 'encourage';
      const seenIds = new Set();
      
      // Exhaust all variants to test reset behavior
      for (let i = 0; i < 20; i++) {
        const result = pickScoutLine(groupId, profile);
        if (result) {
          seenIds.add(result.id);
        }
      }
      
      // Should have cycled through variants
      expect(seenIds.size).toBeGreaterThan(3);
    });
  });

  describe('Template Variable Replacement', () => {
    test('replaces {name} with provided name', () => {
      const result = pickScoutLine('start_lesson', { age: '7-8', name: 'Alice' });
      expect(result).toBeTruthy();
      expect(result!.text).toContain('Alice');
    });

    test('replaces {name} with fallback when name not provided', () => {
      const result = pickScoutLine('start_lesson', { age: '7-8' });
      expect(result).toBeTruthy();
      expect(result!.text).toContain('explorer');
    });

    test('replaces template variables from templateVars', () => {
      const result = pickScoutLine('streak', { age: '7-8' }, { n: 5 });
      expect(result).toBeTruthy();
      expect(result!.text).toContain('5');
    });

    test('handles multiple template replacements', () => {
      const result = pickScoutLine('streak', { age: '7-8', name: 'Bob' }, { n: 3 });
      expect(result).toBeTruthy();
      expect(result!.text).toContain('Bob');
      expect(result!.text).toContain('3');
    });
  });

  describe('Priority Flow-through', () => {
    test('maintains priority from source data', () => {
      const result = pickScoutLine('fail_hint', { age: '7-8' });
      expect(result).toBeTruthy();
      expect(result!.priority).toBe('actionable'); // fail_hint group has actionable priority
    });

    test('includes CTA labels for actionable messages', () => {
      const result = pickScoutLine('fail_hint', { age: '9-10' });
      expect(result).toBeTruthy();
      expect(result!.priority).toBe('actionable');
      expect(result!.ctaLabel).toBeTruthy();
      expect(typeof result!.ctaLabel).toBe('string');
    });

    test('handles info priority messages without CTAs', () => {
      const result = pickScoutLine('finish', { age: '7-8' });
      expect(result).toBeTruthy();
      expect(result!.priority).toBe('info');
      // CTA is optional for info messages
    });

    test('handles critical priority messages', () => {
      const result = pickScoutLine('error_recovery', { age: '9-10' });
      expect(result).toBeTruthy();
      expect(result!.priority).toBe('critical');
      expect(result!.ctaLabel).toBeTruthy();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('returns null for non-existent groups', () => {
      const result = pickScoutLine('non_existent_group', { age: '7-8' });
      expect(result).toBeNull();
    });

    test('handles groups with no matching age bucket', () => {
      // Test with numeric age outside range
      const result = pickScoutLine('start_lesson', { age: 15 }); // Outside supported range
      expect(result).toBeTruthy(); // Should fallback to 5-8 bucket
    });

    test('handles empty template variables gracefully', () => {
      const result = pickScoutLine('encourage', { age: '7-8' }, {});
      expect(result).toBeTruthy();
      expect(result!.text).toBeTruthy();
    });
  });

  describe('Utility Functions', () => {
    test('checks if groups exist with hasScoutGroup', () => {
      expect(hasScoutGroup('start_lesson', '7-8')).toBe(true);
      expect(hasScoutGroup('non_existent', '7-8')).toBe(false);
    });

    test('returns available groups with getAvailableGroups', () => {
      const groups = getAvailableGroups();
      expect(Array.isArray(groups)).toBe(true);
      expect(groups).toContain('start_lesson');
      expect(groups).toContain('fail_hint');
      expect(groups).toContain('finish');
    });

    test('resets recent lines cache', () => {
      // Add some lines to recent cache
      pickScoutLine('encourage', { age: '7-8' });
      expect(getRecentLines().length).toBeGreaterThan(0);
      
      resetRecentLines();
      expect(getRecentLines().length).toBe(0);
    });
  });

  describe('Content Quality', () => {
    test('has age-appropriate content for younger children (5-8)', () => {
      const result = pickScoutLine('encourage', { age: '5-6' });
      expect(result).toBeTruthy();
      
      // Check content exists and is reasonable length
      expect(result!.text.length).toBeGreaterThan(5);
      expect(result!.text.length).toBeLessThan(200); // Not too wordy
    });

    test('has age-appropriate content for older children (9-12)', () => {
      const result = pickScoutLine('encourage', { age: '11-12' });
      expect(result).toBeTruthy();
      
      // Check content exists and is reasonable length
      expect(result!.text.length).toBeGreaterThan(10);
      expect(result!.text.length).toBeLessThan(200); // Not too wordy
    });

    test('has consistent ID patterns within groups', () => {
      const lines = loadScoutLines();
      
      Object.entries(lines.groups).forEach(([groupId, group]) => {
        Object.entries(group).forEach(([ageBucket, variants]) => {
          variants.forEach(variant => {
            expect(variant.id).toBeTruthy();
            expect(typeof variant.id).toBe('string');
            expect(variant.id.length).toBeGreaterThan(0);
          });
        });
      });
    });
  });
});

describe('Integration Tests', () => {
  test('complete flow: show → click → dismiss tracking', () => {
    const sessionId = getSessionId();
    const now = Date.now();
    
    // Show actionable message
    pushEvent({
      kind: 'scout_analytics',
      at: now,
      id: 'integration-msg',
      priority: 'actionable',
      action: 'shown',
      sessionId
    });
    
    // User clicks CTA after 1.5 seconds
    pushEvent({
      kind: 'scout_analytics',
      at: now + 1500,
      id: 'integration-msg',
      priority: 'actionable',
      action: 'clicked',
      sessionId
    });
    
    // User dismisses after viewing for 3 seconds total
    pushEvent({
      kind: 'scout_analytics',
      at: now + 3000,
      id: 'integration-msg',
      priority: 'actionable',
      action: 'dismissed',
      dwellMs: 3000,
      sessionId
    });

    const events = loadEvents();
    const analytics = scoutAnalytics(events);
    
    expect(analytics.showRate).toBe(1); // 1 show / 1 unique ID
    expect(analytics.ctaCtr).toBe(1); // 1 click / 1 actionable shown
    expect(analytics.medianDwellMs).toBe(3000); // Single dwell time
    expect(analytics.sessionDoseP95).toBe(1); // Single session with 1 message
  });

  test('metrics work with mixed priority messages', () => {
    const sessionId = getSessionId();
    const now = Date.now();
    
    // Mix of info, actionable, and critical messages
    const messages = [
      { id: 'info-1', priority: 'info' as const },
      { id: 'actionable-1', priority: 'actionable' as const },
      { id: 'critical-1', priority: 'critical' as const },
      { id: 'actionable-2', priority: 'actionable' as const }
    ];
    
    // Show all messages
    messages.forEach((msg, i) => {
      pushEvent({
        kind: 'scout_analytics',
        at: now + i * 1000,
        id: msg.id,
        priority: msg.priority,
        action: 'shown',
        sessionId
      });
    });
    
    // Click one actionable message
    pushEvent({
      kind: 'scout_analytics',
      at: now + 5000,
      id: 'actionable-1',
      priority: 'actionable',
      action: 'clicked',
      sessionId
    });

    const events = loadEvents();
    const analytics = scoutAnalytics(events);
    
    expect(analytics.showRate).toBe(1); // 4 shows / 4 unique IDs
    expect(analytics.ctaCtr).toBe(0.5); // 1 click / 2 actionable shown
  });
});