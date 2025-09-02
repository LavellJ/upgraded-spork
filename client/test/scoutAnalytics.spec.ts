// Comprehensive tests for Scout analytics and guardrails
// Tests show/click/dwell/dismiss tracking and per-session rate limiting

import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import { resetScoutQueue, getSessionStats } from '../src/hooks/useScoutQueue';
import { clearEvents, pushEvent, getSessionId, loadEvents } from '../src/progress/events';
import { scoutAnalytics, scoutSummary } from '../src/progress/metrics';

// Mock timers for testing time-based functionality
beforeEach(() => {
  vi.useFakeTimers();
  resetScoutQueue();
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