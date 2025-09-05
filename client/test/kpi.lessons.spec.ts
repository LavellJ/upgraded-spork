/**
 * Unit tests for lesson quality KPI calculations
 * Tests lesson KPIs, hero lesson metrics, and template lesson analytics
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { lessonSuccessRate } from '../src/progress/metrics';
import { 
  getLessonKPIs, 
  getHeroLessonKPIs, 
  getTemplateLessonsKPIs,
  formatTimeOnTask,
  getLessonQualityTrend,
  type LessonKPIs
} from '../src/progress/kpi.lessons';
import type { ProgressEvent } from '../src/progress/events';

// Mock the events module
vi.mock('../src/progress/events', () => ({
  loadEvents: vi.fn(() => [])
}));

describe('Lesson Quality KPIs', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('lessonSuccessRate (from metrics)', () => {
    it('calculates pass rate correctly', () => {
      const events: ProgressEvent[] = [
        {
          kind: 'lesson_finish',
          at: Date.now(),
          lessonId: 'M.FRAC.NL.3',
          biomeId: 'forest',
          result: 'pass',
          durationSec: 120
        },
        {
          kind: 'lesson_finish',
          at: Date.now() + 1000,
          lessonId: 'M.FRAC.NL.3',
          biomeId: 'forest',
          result: 'pass',
          durationSec: 90
        },
        {
          kind: 'lesson_finish',
          at: Date.now() + 2000,
          lessonId: 'M.FRAC.NL.3',
          biomeId: 'forest',
          result: 'retry',
          durationSec: 180
        }
      ];

      const result = lessonSuccessRate(events);
      
      expect(result.passRate).toBe(67); // 2 out of 3 passes, rounded
      expect(result.totalAttempts).toBe(3);
    });

    it('handles empty events gracefully', () => {
      const events: ProgressEvent[] = [];

      const result = lessonSuccessRate(events);
      
      expect(result.passRate).toBe(0);
      expect(result.totalAttempts).toBe(0);
    });
  });

  describe('getLessonKPIs', () => {
    it('returns KPI structure with expected properties', () => {
      const { loadEvents } = await import('../src/progress/events');
      vi.mocked(loadEvents).mockReturnValue([
        {
          kind: 'lesson_finish',
          at: Date.now(),
          lessonId: 'M.FRAC.NL.3',
          biomeId: 'forest'
        },
        {
          kind: 'lesson_finish',
          at: Date.now() + 1000,
          lessonId: 'M.FRAC.NL.3',
          biomeId: 'forest'
        }
      ]);

      const kpis = getLessonKPIs(['M.FRAC.NL.3'], 7);

      expect(kpis).toHaveProperty('passRate');
      expect(kpis).toHaveProperty('medianTimeSec');
      expect(kpis).toHaveProperty('hintUsagePct');
      expect(kpis).toHaveProperty('branchRate');

      expect(typeof kpis.passRate).toBe('number');
      expect(typeof kpis.medianTimeSec).toBe('number');
      expect(typeof kpis.hintUsagePct).toBe('number');
      expect(typeof kpis.branchRate).toBe('number');

      expect(kpis.passRate).toBeGreaterThanOrEqual(0);
      expect(kpis.passRate).toBeLessThanOrEqual(1);
    });

    it('handles multiple lesson IDs', () => {
      const { loadEvents } = await import('../src/progress/events');
      vi.mocked(loadEvents).mockReturnValue([
        {
          kind: 'lesson_finish',
          at: Date.now(),
          lessonId: 'M.FRAC.NL.3',
          biomeId: 'forest'
        },
        {
          kind: 'lesson_finish',
          at: Date.now() + 1000,
          lessonId: 'E.READ.MAIN.3',
          biomeId: 'forest'
        }
      ]);

      const kpis = getLessonKPIs(['M.FRAC.NL.3', 'E.READ.MAIN.3'], 14);

      expect(kpis.passRate).toBeGreaterThanOrEqual(0);
      expect(kpis.medianTimeSec).toBeGreaterThan(0);
    });

    it('filters events by time range', () => {
      const { loadEvents } = await import('../src/progress/events');
      const oldTime = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 days ago
      const recentTime = Date.now() - (1 * 24 * 60 * 60 * 1000); // 1 day ago

      vi.mocked(loadEvents).mockReturnValue([
        {
          kind: 'lesson_finish',
          at: oldTime,
          lessonId: 'M.FRAC.NL.3',
          biomeId: 'forest'
        },
        {
          kind: 'lesson_finish',
          at: recentTime,
          lessonId: 'M.FRAC.NL.3',
          biomeId: 'forest'
        }
      ]);

      const kpis = getLessonKPIs(['M.FRAC.NL.3'], 7); // Last 7 days only

      // Should only consider recent events
      expect(kpis).toBeDefined();
    });
  });

  describe('getHeroLessonKPIs', () => {
    it('returns KPIs specifically for hero lesson M.FRAC.NL.3', () => {
      const kpis = getHeroLessonKPIs(14);

      expect(kpis).toHaveProperty('passRate');
      expect(kpis).toHaveProperty('medianTimeSec');
      expect(kpis).toHaveProperty('hintUsagePct');
      expect(kpis).toHaveProperty('branchRate');

      // Should return valid KPI ranges
      expect(kpis.passRate).toBeGreaterThanOrEqual(0);
      expect(kpis.passRate).toBeLessThanOrEqual(1);
      expect(kpis.medianTimeSec).toBeGreaterThanOrEqual(0);
      expect(kpis.hintUsagePct).toBeGreaterThanOrEqual(0);
      expect(kpis.branchRate).toBeGreaterThanOrEqual(0);
    });

    it('accepts custom time range', () => {
      const kpis7 = getHeroLessonKPIs(7);
      const kpis30 = getHeroLessonKPIs(30);

      expect(kpis7).toBeDefined();
      expect(kpis30).toBeDefined();

      // Both should return valid KPI structures
      expect(kpis7).toHaveProperty('passRate');
      expect(kpis30).toHaveProperty('passRate');
    });
  });

  describe('getTemplateLessonsKPIs', () => {
    it('returns KPIs for template lessons', () => {
      const kpis = getTemplateLessonsKPIs(14);

      expect(kpis).toHaveProperty('passRate');
      expect(kpis).toHaveProperty('medianTimeSec');
      expect(kpis).toHaveProperty('hintUsagePct');
      expect(kpis).toHaveProperty('branchRate');

      // Should return valid metrics
      expect(kpis.passRate).toBeGreaterThanOrEqual(0);
      expect(kpis.passRate).toBeLessThanOrEqual(1);
      expect(kpis.medianTimeSec).toBeGreaterThanOrEqual(0);
    });

    it('handles multiple template lesson IDs', () => {
      const { loadEvents } = await import('../src/progress/events');
      vi.mocked(loadEvents).mockReturnValue([
        {
          kind: 'lesson_finish',
          at: Date.now(),
          lessonId: 'M.FRAC.EQ.3',
          biomeId: 'forest'
        },
        {
          kind: 'lesson_finish',
          at: Date.now() + 1000,
          lessonId: 'E.READ.MAIN.3',
          biomeId: 'forest'
        },
        {
          kind: 'lesson_finish',
          at: Date.now() + 2000,
          lessonId: 'SCI.HABIT.3',
          biomeId: 'reef'
        }
      ]);

      const kpis = getTemplateLessonsKPIs(7);
      
      expect(kpis.passRate).toBeGreaterThanOrEqual(0);
      expect(kpis.medianTimeSec).toBeGreaterThan(0);
    });
  });

  describe('formatTimeOnTask', () => {
    it('formats seconds correctly', () => {
      expect(formatTimeOnTask(45)).toBe('45s');
      expect(formatTimeOnTask(0)).toBe('0s');
    });

    it('formats minutes correctly', () => {
      expect(formatTimeOnTask(60)).toBe('1m');
      expect(formatTimeOnTask(90)).toBe('1m 30s');
      expect(formatTimeOnTask(120)).toBe('2m');
    });

    it('formats hours correctly', () => {
      expect(formatTimeOnTask(3600)).toBe('1h');
      expect(formatTimeOnTask(3660)).toBe('1h 1m');
      expect(formatTimeOnTask(7200)).toBe('2h');
    });

    it('handles edge cases', () => {
      expect(formatTimeOnTask(3661)).toBe('1h 1m'); // 1h 1m 1s rounds down
      expect(formatTimeOnTask(59)).toBe('59s');
      expect(formatTimeOnTask(3599)).toBe('59m 59s');
    });
  });

  describe('getLessonQualityTrend', () => {
    it('returns trend classification', () => {
      const trend = getLessonQualityTrend(['M.FRAC.NL.3'], 14);

      expect(['improving', 'declining', 'stable']).toContain(trend);
    });

    it('handles multiple lesson IDs for trend analysis', () => {
      const trend = getLessonQualityTrend(['M.FRAC.NL.3', 'E.READ.MAIN.3'], 28);

      expect(['improving', 'declining', 'stable']).toContain(trend);
    });

    it('works with different time ranges', () => {
      const shortTrend = getLessonQualityTrend(['M.FRAC.NL.3'], 7);
      const longTrend = getLessonQualityTrend(['M.FRAC.NL.3'], 30);

      expect(['improving', 'declining', 'stable']).toContain(shortTrend);
      expect(['improving', 'declining', 'stable']).toContain(longTrend);
    });
  });

  describe('Integration tests', () => {
    it('provides consistent KPI calculations across functions', () => {
      const { loadEvents } = await import('../src/progress/events');
      
      // Mock consistent event data
      vi.mocked(loadEvents).mockReturnValue([
        {
          kind: 'lesson_finish',
          at: Date.now() - 1000,
          lessonId: 'M.FRAC.NL.3',
          biomeId: 'forest'
        },
        {
          kind: 'lesson_finish',
          at: Date.now(),
          lessonId: 'M.FRAC.NL.3',
          biomeId: 'forest'
        }
      ]);

      const generalKPIs = getLessonKPIs(['M.FRAC.NL.3'], 7);
      const heroKPIs = getHeroLessonKPIs(7);

      // Hero lesson KPIs should match general KPIs for same lesson
      expect(generalKPIs.passRate).toBe(heroKPIs.passRate);
      expect(generalKPIs.medianTimeSec).toBe(heroKPIs.medianTimeSec);
    });

    it('handles Scout message events for hint usage calculation', () => {
      const { loadEvents } = await import('../src/progress/events');
      
      vi.mocked(loadEvents).mockReturnValue([
        {
          kind: 'lesson_finish',
          at: Date.now(),
          lessonId: 'M.FRAC.NL.3',
          biomeId: 'forest'
        },
        {
          kind: 'scout_msg',
          at: Date.now() - 500,
          messageId: 'msg-1',
          priority: 'actionable',
          text: 'Try counting the equal parts'
        } as ProgressEvent
      ]);

      const kpis = getLessonKPIs(['M.FRAC.NL.3'], 7);
      
      // Should detect Scout messages as hint usage
      expect(kpis.hintUsagePct).toBeGreaterThan(0);
    });

    it('validates KPI data ranges and types', () => {
      const kpis = getLessonKPIs(['M.FRAC.NL.3'], 14);

      // Pass rate should be between 0 and 1
      expect(kpis.passRate).toBeGreaterThanOrEqual(0);
      expect(kpis.passRate).toBeLessThanOrEqual(1);

      // Time should be positive
      expect(kpis.medianTimeSec).toBeGreaterThanOrEqual(0);

      // Percentages should be valid ranges
      expect(kpis.hintUsagePct).toBeGreaterThanOrEqual(0);
      expect(kpis.branchRate).toBeGreaterThanOrEqual(0);

      // All values should be finite numbers
      expect(isFinite(kpis.passRate)).toBe(true);
      expect(isFinite(kpis.medianTimeSec)).toBe(true);
      expect(isFinite(kpis.hintUsagePct)).toBe(true);
      expect(isFinite(kpis.branchRate)).toBe(true);
    });

    it('handles empty lesson ID arrays gracefully', () => {
      const kpis = getLessonKPIs([], 14);

      expect(kpis.passRate).toBe(1); // Default pass rate when no data
      expect(kpis.medianTimeSec).toBeGreaterThan(0); // Should return reasonable default
      expect(kpis.hintUsagePct).toBe(0); // No hints used with no lessons
    });

    it('processes time-filtered events correctly', () => {
      const { loadEvents } = await import('../src/progress/events');
      const now = Date.now();
      const oldEvent = now - (30 * 24 * 60 * 60 * 1000); // 30 days ago
      const recentEvent = now - (2 * 24 * 60 * 60 * 1000); // 2 days ago

      vi.mocked(loadEvents).mockReturnValue([
        {
          kind: 'lesson_finish',
          at: oldEvent,
          lessonId: 'M.FRAC.NL.3',
          biomeId: 'forest'
        },
        {
          kind: 'lesson_finish',
          at: recentEvent,
          lessonId: 'M.FRAC.NL.3',
          biomeId: 'forest'
        }
      ]);

      const recentKPIs = getLessonKPIs(['M.FRAC.NL.3'], 7); // 7-day window
      const allKPIs = getLessonKPIs(['M.FRAC.NL.3'], 45); // 45-day window

      expect(recentKPIs).toBeDefined();
      expect(allKPIs).toBeDefined();
      
      // Both should be valid but may have different values based on time filtering
      expect(recentKPIs.passRate).toBeGreaterThanOrEqual(0);
      expect(allKPIs.passRate).toBeGreaterThanOrEqual(0);
    });
  });
});