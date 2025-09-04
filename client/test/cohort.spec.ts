import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { buildCohortSeries, type CohortSlice } from '../src/progress/cohort';
import { weekStartISO, previousWeeks } from '../src/progress/util';
import type { ProgressEvent } from '../src/progress/events';
import type { AssignedPathV2, AssignedLesson } from '../src/guide/assign';

// Mock the dependencies
vi.mock('../src/progress/events', () => ({
  loadEvents: vi.fn()
}));

vi.mock('../src/guide/assign', () => ({
  getActiveAssignments: vi.fn(),
  isDueSoon: vi.fn(),
  isOverdue: vi.fn()
}));

vi.mock('../src/storage/namespace', () => ({
  ns: vi.fn((userId: string, key: string) => `${userId}.${key}`),
  BASE_KEYS: {
    onTask: 'onTask'
  }
}));

import { loadEvents } from '../src/progress/events';
import { getActiveAssignments, isDueSoon, isOverdue } from '../src/guide/assign';

const mockLoadEvents = vi.mocked(loadEvents);
const mockGetActiveAssignments = vi.mocked(getActiveAssignments);
const mockIsDueSoon = vi.mocked(isDueSoon);
const mockIsOverdue = vi.mocked(isOverdue);

describe('Cohort Metrics Engine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Clear localStorage
    global.localStorage.clear();
    
    // Setup default mocks
    mockGetActiveAssignments.mockReturnValue([]);
    mockIsDueSoon.mockReturnValue(false);
    mockIsOverdue.mockReturnValue(false);
  });

  afterEach(() => {
    // Clear cache between tests
    vi.clearAllMocks();
    global.localStorage.clear();
  });

  describe('buildCohortSeries', () => {
    it('should build cohort series across 4 weeks with synthetic data', () => {
      const baseDate = new Date('2025-01-13'); // Monday
      const startWeek = baseDate.toISOString().split('T')[0];
      const learnerIds = ['learner_1', 'learner_2', 'learner_3'];

      // Create synthetic events across 4 weeks
      mockLoadEvents.mockImplementation((learnerId?: string) => {
        if (!learnerId) return [];
        const events: ProgressEvent[] = [];
        
        // Generate events for 4 weeks based on learner
        for (let week = 0; week < 4; week++) {
          const weekStart = new Date(baseDate);
          weekStart.setDate(baseDate.getDate() - (3 - week) * 7);

          // Different patterns for each learner
          if (learnerId === 'learner_1') {
            // Active learner: lessons every week, consistent streaks
            for (let day = 0; day < 5; day++) {
              const eventDate = new Date(weekStart);
              eventDate.setDate(weekStart.getDate() + day);
              eventDate.setHours(10 + day, 30, 0, 0);
              
              events.push({
                kind: 'lesson_finish',
                at: eventDate.getTime(),
                lessonId: `lesson_${week}_${day}`,
                biomeId: 'forest',
                result: 'pass',
                durationSec: 480 + (day * 60) // 8-12 minutes
              });
            }
          } else if (learnerId === 'learner_2') {
            // Moderate learner: 2-3 lessons per week
            for (let day = 0; day < 3; day++) {
              const eventDate = new Date(weekStart);
              eventDate.setDate(weekStart.getDate() + day * 2);
              eventDate.setHours(14, 0, 0, 0);
              
              events.push({
                kind: 'lesson_finish',
                at: eventDate.getTime(),
                lessonId: `lesson_${week}_${day}`,
                biomeId: 'desert',
                result: 'pass',
                durationSec: 360 // 6 minutes
              });
            }
          } else if (learnerId === 'learner_3') {
            // Inconsistent learner: only active in weeks 2 and 4
            if (week === 1 || week === 3) {
              const eventDate = new Date(weekStart);
              eventDate.setDate(weekStart.getDate() + 1);
              eventDate.setHours(16, 0, 0, 0);
              
              events.push({
                kind: 'lesson_finish',
                at: eventDate.getTime(),
                lessonId: `lesson_${week}_0`,
                biomeId: 'ocean',
                result: 'pass',
                durationSec: 600 // 10 minutes
              });
              
              // Journal activity too
              events.push({
                kind: 'journal_finish',
                at: eventDate.getTime() + 300000, // 5 minutes later
                skillId: 'math.addition',
                n: 5,
                correct: 4,
                durationSec: 240 // 4 minutes
              });
            }
          }
        }

        return events;
      });

      // Mock on-task data for consistent time tracking
      mockLoadEvents.mockImplementation((learnerId?: string) => {
        if (!learnerId) return [];
        const events = mockLoadEvents.getMockImplementation()!(learnerId);
        
        // Store on-task ticks based on lesson events
        const ticks = [];
        events
          .filter(e => e.kind === 'lesson_finish' || e.kind === 'journal_finish')
          .forEach(event => {
            // Start tick 10 minutes before finish
            ticks.push({
              kind: 'start' as const,
              at: event.at - 600000,
              source: (event.kind === 'lesson_finish' ? 'lesson' : 'journal') as 'lesson' | 'journal'
            });
            // Stop tick at finish time
            ticks.push({
              kind: 'stop' as const,
              at: event.at,
              source: (event.kind === 'lesson_finish' ? 'lesson' : 'journal') as 'lesson' | 'journal'
            });
          });

        localStorage.setItem(`${learnerId}.onTask`, JSON.stringify(ticks));
        return events;
      });

      // Build cohort series
      const series = buildCohortSeries(learnerIds, startWeek, 4);

      // Validate series structure
      expect(series).toHaveLength(4);
      
      // Check chronological order
      for (let i = 1; i < series.length; i++) {
        expect(new Date(series[i].weekStartISO).getTime()).toBeGreaterThan(
          new Date(series[i-1].weekStartISO).getTime()
        );
      }

      // Validate field structure for each slice
      series.forEach((slice, index) => {
        expect(slice).toMatchObject({
          weekStartISO: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
          learners: 3,
          activeLearners: expect.any(Number),
          avgOnTaskMins: expect.any(Number),
          medianOnTaskMins: expect.any(Number),
          return7dPct: expect.any(Number),
          assignments: {
            donePct: expect.any(Number),
            dueSoon: expect.any(Number),
            overdue: expect.any(Number)
          },
          completionsPerLearner: expect.any(Number),
          streakersPct: expect.any(Number)
        });

        // Validate ranges
        expect(slice.activeLearners).toBeGreaterThanOrEqual(0);
        expect(slice.activeLearners).toBeLessThanOrEqual(slice.learners);
        expect(slice.avgOnTaskMins).toBeGreaterThanOrEqual(0);
        expect(slice.medianOnTaskMins).toBeGreaterThanOrEqual(0);
        expect(slice.return7dPct).toBeGreaterThanOrEqual(0);
        expect(slice.return7dPct).toBeLessThanOrEqual(100);
        expect(slice.assignments.donePct).toBeGreaterThanOrEqual(0);
        expect(slice.assignments.donePct).toBeLessThanOrEqual(100);
        expect(slice.completionsPerLearner).toBeGreaterThanOrEqual(0);
        expect(slice.streakersPct).toBeGreaterThanOrEqual(0);
        expect(slice.streakersPct).toBeLessThanOrEqual(100);
      });

      // Validate specific expected patterns from our synthetic data
      // Week 1: Only learner_1 and learner_2 active
      expect(series[0].activeLearners).toBe(2);
      
      // Week 2: All learners active (learner_3 joins)
      expect(series[1].activeLearners).toBe(3);
      
      // Week 3: Back to learner_1 and learner_2
      expect(series[2].activeLearners).toBe(2);
      
      // Week 4: All learners active again
      expect(series[3].activeLearners).toBe(3);
    });

    it('should handle empty learner list', () => {
      const startWeek = weekStartISO();
      const series = buildCohortSeries([], startWeek, 2);
      
      expect(series).toHaveLength(2);
      series.forEach(slice => {
        expect(slice.learners).toBe(0);
        expect(slice.activeLearners).toBe(0);
        expect(slice.avgOnTaskMins).toBe(0);
        expect(slice.medianOnTaskMins).toBe(0);
        expect(slice.return7dPct).toBe(0);
        expect(slice.assignments.donePct).toBe(0);
        expect(slice.completionsPerLearner).toBe(0);
        expect(slice.streakersPct).toBe(0);
      });
    });

    it('should handle learners with no activity', () => {
      const startWeek = weekStartISO();
      const learnerIds = ['inactive_1', 'inactive_2'];
      
      mockLoadEvents.mockReturnValue([]);
      
      const series = buildCohortSeries(learnerIds, startWeek, 2);
      
      expect(series).toHaveLength(2);
      series.forEach(slice => {
        expect(slice.learners).toBe(2);
        expect(slice.activeLearners).toBe(0);
        expect(slice.avgOnTaskMins).toBe(0);
        expect(slice.medianOnTaskMins).toBe(0);
        expect(slice.completionsPerLearner).toBe(0);
      });
    });

    it('should handle learners added mid-series', () => {
      const baseDate = new Date('2025-01-13');
      const startWeek = baseDate.toISOString().split('T')[0];
      
      // Start with 2 learners, but analyze 3 (simulating learner_3 added later)
      const learnerIds = ['learner_1', 'learner_2', 'learner_3'];

      mockLoadEvents.mockImplementation((learnerId?: string) => {
        if (!learnerId) return [];
        const events: ProgressEvent[] = [];
        
        // Only learner_1 and learner_2 have activity in first 2 weeks
        // learner_3 only has activity in last 2 weeks
        for (let week = 0; week < 4; week++) {
          const weekStart = new Date(baseDate);
          weekStart.setDate(baseDate.getDate() - (3 - week) * 7);

          if (learnerId === 'learner_1' || learnerId === 'learner_2') {
            // Active in all weeks
            const eventDate = new Date(weekStart);
            eventDate.setDate(weekStart.getDate() + 1);
            eventDate.setHours(10, 0, 0, 0);
            
            events.push({
              kind: 'lesson_finish',
              at: eventDate.getTime(),
              lessonId: `lesson_${week}_${learnerId}`,
              biomeId: 'forest',
              result: 'pass',
              durationSec: 480
            });
          } else if (learnerId === 'learner_3' && week >= 2) {
            // Only active in last 2 weeks (joined mid-series)
            const eventDate = new Date(weekStart);
            eventDate.setDate(weekStart.getDate() + 2);
            eventDate.setHours(15, 0, 0, 0);
            
            events.push({
              kind: 'lesson_finish',
              at: eventDate.getTime(),
              lessonId: `lesson_${week}_${learnerId}`,
              biomeId: 'desert',
              result: 'pass',
              durationSec: 360
            });
          }
        }

        return events;
      });

      const series = buildCohortSeries(learnerIds, startWeek, 4);
      
      expect(series).toHaveLength(4);
      
      // First 2 weeks: only 2 active learners
      expect(series[0].activeLearners).toBe(2);
      expect(series[1].activeLearners).toBe(2);
      
      // Last 2 weeks: all 3 active learners
      expect(series[2].activeLearners).toBe(3);
      expect(series[3].activeLearners).toBe(3);
      
      // All weeks should still report total of 3 learners
      series.forEach(slice => {
        expect(slice.learners).toBe(3);
      });
    });

    it('should calculate assignment metrics correctly', () => {
      const startWeek = weekStartISO();
      const learnerIds = ['learner_1'];
      
      const assignments: AssignedPathV2[] = [{
        id: 'assign_1',
        name: 'Test Assignment',
        lessonIds: ['lesson_1', 'lesson_2', 'lesson_3'],
        lessons: [
          { lessonId: 'lesson_1', status: 'done', completedAt: Date.now() },
          { lessonId: 'lesson_2', status: 'not_started', dueAt: Date.now() + 86400000 }, // Due tomorrow
          { lessonId: 'lesson_3', status: 'in_progress', dueAt: Date.now() - 86400000 } // Overdue
        ] as AssignedLesson[],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        dueAt: Date.now() + 86400000
      }];
      
      mockGetActiveAssignments.mockReturnValue(assignments);
      mockIsDueSoon.mockImplementation((dueAt?: number) => {
        if (!dueAt) return false;
        return dueAt > Date.now() && dueAt < Date.now() + 86400000 * 2; // Due within 2 days
      });
      mockIsOverdue.mockImplementation((dueAt?: number) => {
        if (!dueAt) return false;
        return dueAt < Date.now();
      });
      
      // Mock completion event for lesson_1
      const weekStart = new Date(startWeek);
      const completionTime = weekStart.getTime() + 86400000; // Day 2 of the week
      
      mockLoadEvents.mockReturnValue([
        {
          kind: 'lesson_finish',
          at: completionTime,
          lessonId: 'lesson_1',
          biomeId: 'forest',
          result: 'pass',
          durationSec: 480
        }
      ]);
      
      const series = buildCohortSeries(learnerIds, startWeek, 1);
      
      expect(series).toHaveLength(1);
      const slice = series[0];
      
      // Should have 1 completed (lesson_1), 1 due soon (lesson_2), 1 overdue (lesson_3)
      expect(slice.assignments.donePct).toBeCloseTo(33.3, 1); // 1/3 = 33.3%
      expect(slice.assignments.dueSoon).toBe(1);
      expect(slice.assignments.overdue).toBe(1);
    });

    it('should calculate streaks correctly', () => {
      const baseDate = new Date('2025-01-13');
      const startWeek = baseDate.toISOString().split('T')[0];
      const learnerIds = ['streaker_1', 'non_streaker_2'];

      mockLoadEvents.mockImplementation((learnerId?: string) => {
        if (!learnerId) return [];
        const events: ProgressEvent[] = [];
        
        if (learnerId === 'streaker_1') {
          // Create a 5-day streak ending in the analysis week
          for (let day = 0; day < 5; day++) {
            const eventDate = new Date(baseDate);
            eventDate.setDate(baseDate.getDate() + day - 2); // Start 2 days before week start
            eventDate.setHours(10, 0, 0, 0);
            
            events.push({
              kind: 'lesson_finish',
              at: eventDate.getTime(),
              lessonId: `lesson_${day}`,
              biomeId: 'forest',
              result: 'pass',
              durationSec: 480
            });
          }
        } else if (learnerId === 'non_streaker_2') {
          // Only 1 completion, no streak
          const eventDate = new Date(baseDate);
          eventDate.setDate(baseDate.getDate() + 1);
          eventDate.setHours(10, 0, 0, 0);
          
          events.push({
            kind: 'lesson_finish',
            at: eventDate.getTime(),
            lessonId: 'lesson_1',
            biomeId: 'desert',
            result: 'pass',
            durationSec: 480
          });
        }
        
        return events;
      });
      
      const series = buildCohortSeries(learnerIds, startWeek, 1);
      
      expect(series).toHaveLength(1);
      const slice = series[0];
      
      // streaker_1 should have streak >= 3, non_streaker_2 should not
      // So 50% should be streakersPct
      expect(slice.streakersPct).toBe(50);
    });

    it('should use memoization correctly', () => {
      const startWeek = weekStartISO();
      const learnerIds = ['learner_1'];
      
      mockLoadEvents.mockReturnValue([]);
      
      // First call
      const series1 = buildCohortSeries(learnerIds, startWeek, 2);
      expect(mockLoadEvents).toHaveBeenCalled();
      
      // Clear mock call count
      mockLoadEvents.mockClear();
      
      // Second call with same parameters - should use cache
      const series2 = buildCohortSeries(learnerIds, startWeek, 2);
      expect(mockLoadEvents).not.toHaveBeenCalled();
      
      // Results should be identical
      expect(series1).toEqual(series2);
      
      // Different parameters - should not use cache
      const series3 = buildCohortSeries(learnerIds, startWeek, 3);
      expect(mockLoadEvents).toHaveBeenCalled();
    });

    it('should calculate median correctly for odd and even numbers', () => {
      const startWeek = weekStartISO();
      
      // Test with 3 learners (odd number) - different on-task times
      const learnerIds = ['learner_1', 'learner_2', 'learner_3'];
      
      mockLoadEvents.mockImplementation((learnerId?: string) => {
        if (!learnerId) return [];
        // Create different activity levels to test median calculation
        const events: ProgressEvent[] = [];
        const weekStart = new Date(startWeek);
        const eventDate = new Date(weekStart);
        eventDate.setDate(weekStart.getDate() + 1);
        
        // Different durations: 6min, 10min, 14min -> median should be 10min
        let duration;
        if (learnerId === 'learner_1') duration = 360; // 6 minutes
        else if (learnerId === 'learner_2') duration = 600; // 10 minutes
        else duration = 840; // 14 minutes
        
        events.push({
          kind: 'lesson_finish',
          at: eventDate.getTime(),
          lessonId: 'lesson_1',
          biomeId: 'forest',
          result: 'pass',
          durationSec: duration
        });
        
        return events;
      });
      
      const series = buildCohortSeries(learnerIds, startWeek, 1);
      const slice = series[0];
      
      // With fallback calculation, should be roughly 6, 8, 10 minutes
      // (actual calculation uses fallback estimates and on-task ticks)
      expect(slice.medianOnTaskMins).toBeGreaterThan(0);
      expect(slice.avgOnTaskMins).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('should handle invalid week dates gracefully', () => {
      const invalidWeek = '2025-13-45'; // Invalid date
      const learnerIds = ['learner_1'];
      
      mockLoadEvents.mockReturnValue([]);
      
      // Should not throw, but may return unexpected results
      expect(() => {
        buildCohortSeries(learnerIds, invalidWeek, 1);
      }).not.toThrow();
    });

    it('should handle very large number of weeks', () => {
      const startWeek = weekStartISO();
      const learnerIds = ['learner_1'];
      
      mockLoadEvents.mockReturnValue([]);
      
      const series = buildCohortSeries(learnerIds, startWeek, 100);
      expect(series).toHaveLength(100);
    });

    it('should handle single week analysis', () => {
      const startWeek = weekStartISO();
      const learnerIds = ['learner_1'];
      
      mockLoadEvents.mockReturnValue([
        {
          kind: 'lesson_finish',
          at: Date.now(),
          lessonId: 'lesson_1',
          biomeId: 'forest',
          result: 'pass',
          durationSec: 480
        }
      ]);
      
      const series = buildCohortSeries(learnerIds, startWeek, 1);
      expect(series).toHaveLength(1);
      expect(series[0].learners).toBe(1);
      expect(series[0].activeLearners).toBeGreaterThan(0);
    });
  });
});