import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  buildClassWeek, 
  getCurrentWeekStart, 
  getWeekDisplayName,
  type ClassWeekData,
  type ClassWeekLearner 
} from '../src/progress/classMetrics';
import type { ProgressEvent } from '../src/progress/events';
import type { LearnerProfile } from '../src/roster/model';

// Mock the dependencies
vi.mock('../src/progress/events', () => ({
  loadEvents: vi.fn()
}));

vi.mock('../src/roster/model', () => ({
  loadRoster: vi.fn()
}));

vi.mock('../src/guide/assign', () => ({
  getActiveAssignments: vi.fn(),
  getLessonAssignment: vi.fn(),
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
import { loadRoster } from '../src/roster/model';
import { getActiveAssignments, isDueSoon, isOverdue } from '../src/guide/assign';

const mockLoadEvents = vi.mocked(loadEvents);
const mockLoadRoster = vi.mocked(loadRoster);
const mockGetActiveAssignments = vi.mocked(getActiveAssignments);
const mockIsDueSoon = vi.mocked(isDueSoon);
const mockIsOverdue = vi.mocked(isOverdue);

describe('Class Metrics Weekly Rollup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Clear localStorage
    global.localStorage.clear();
    
    // Setup default mocks
    mockLoadRoster.mockReturnValue({
      learners: [
        { id: 'learner_1', name: 'Alice Smith', avatarId: 'avatar_1', ageBand: 'primary', createdAt: Date.now(), updatedAt: Date.now() },
        { id: 'learner_2', name: 'Bob Johnson', avatarId: 'avatar_2', ageBand: 'pre-primary', createdAt: Date.now(), updatedAt: Date.now() },
        { id: 'learner_3', name: 'Carol Davis', avatarId: 'avatar_3', ageBand: 'upper-primary', createdAt: Date.now(), updatedAt: Date.now() }
      ],
      activeId: 'learner_1'
    });
    
    mockGetActiveAssignments.mockReturnValue([]);
    mockIsDueSoon.mockReturnValue(false);
    mockIsOverdue.mockReturnValue(false);
  });

  describe('buildClassWeek', () => {
    it('should calculate correct totals for class week', () => {
      const weekStart = '2025-01-13'; // Monday
      const learnerIds = ['learner_1', 'learner_2'];
      
      // Mock events for each learner
      mockLoadEvents.mockImplementation((learnerId: string) => {
        const baseTime = new Date('2025-01-14T10:00:00Z').getTime(); // Tuesday
        
        if (learnerId === 'learner_1') {
          return [
            {
              kind: 'lesson_finish',
              at: baseTime,
              lessonId: 'forest.counting.1',
              biomeId: 'forest',
              result: 'pass',
              durationSec: 480 // 8 minutes
            },
            {
              kind: 'lesson_start',
              at: baseTime - 1000,
              lessonId: 'forest.counting.1',
              biomeId: 'forest'
            },
            {
              kind: 'journal_finish',
              at: baseTime + 3600000, // 1 hour later
              skillId: 'counting',
              durationSec: 300 // 5 minutes
            }
          ] as ProgressEvent[];
        } else if (learnerId === 'learner_2') {
          return [
            {
              kind: 'lesson_finish',
              at: baseTime + 7200000, // 2 hours later
              lessonId: 'desert.shapes.1',
              biomeId: 'desert',
              result: 'pass',
              durationSec: 600 // 10 minutes
            },
            {
              kind: 'lesson_start',
              at: baseTime + 7200000 - 1000,
              lessonId: 'desert.shapes.1',
              biomeId: 'desert'
            }
          ] as ProgressEvent[];
        }
        return [];
      });
      
      const result = buildClassWeek(learnerIds, weekStart);
      
      expect(result.totals.minutes).toBe(23); // 8 + 5 + 10 minutes
      expect(result.totals.sessions).toBe(2); // 2 distinct sessions
      expect(result.perLearner).toHaveLength(2);
      
      // Check individual learner metrics
      const alice = result.perLearner.find(l => l.learnerId === 'learner_1');
      expect(alice?.minutes).toBe(13); // 8 + 5 minutes
      expect(alice?.sessions).toBe(1); // activities within 30 min window
      
      const bob = result.perLearner.find(l => l.learnerId === 'learner_2');
      expect(bob?.minutes).toBe(10);
      expect(bob?.sessions).toBe(1);
    });

    it('should filter events to the correct week range', () => {
      const weekStart = '2025-01-13'; // Monday
      const learnerIds = ['learner_1'];
      
      const weekStartTime = new Date('2025-01-13T00:00:00Z').getTime();
      const weekEndTime = new Date('2025-01-20T00:00:00Z').getTime();
      
      mockLoadEvents.mockReturnValue([
        // Before week (should be excluded)
        {
          kind: 'lesson_finish',
          at: weekStartTime - 86400000, // Sunday before
          lessonId: 'forest.counting.1',
          biomeId: 'forest',
          result: 'pass',
          durationSec: 480
        },
        // During week (should be included)
        {
          kind: 'lesson_finish',
          at: weekStartTime + 3600000, // Monday + 1 hour
          lessonId: 'forest.counting.2',
          biomeId: 'forest',
          result: 'pass',
          durationSec: 360
        },
        // After week (should be excluded)
        {
          kind: 'lesson_finish',
          at: weekEndTime + 3600000, // Monday next week
          lessonId: 'forest.counting.3',
          biomeId: 'forest',
          result: 'pass',
          durationSec: 240
        }
      ] as ProgressEvent[]);
      
      const result = buildClassWeek(learnerIds, weekStart);
      
      expect(result.totals.minutes).toBe(6); // Only the middle event (360 sec = 6 min)
      expect(result.perLearner[0].sessions).toBe(1);
    });

    it('should handle learners with no activity', () => {
      const weekStart = '2025-01-13';
      const learnerIds = ['learner_1', 'learner_2'];
      
      mockLoadEvents.mockImplementation((learnerId: string) => {
        if (learnerId === 'learner_1') {
          return [
            {
              kind: 'lesson_finish',
              at: new Date('2025-01-14T10:00:00Z').getTime(),
              lessonId: 'forest.counting.1',
              biomeId: 'forest',
              result: 'pass',
              durationSec: 480
            }
          ] as ProgressEvent[];
        }
        return []; // No events for learner_2
      });
      
      const result = buildClassWeek(learnerIds, weekStart);
      
      expect(result.perLearner).toHaveLength(2);
      
      const alice = result.perLearner.find(l => l.learnerId === 'learner_1');
      expect(alice?.minutes).toBe(8);
      expect(alice?.sessions).toBe(1);
      
      const bob = result.perLearner.find(l => l.learnerId === 'learner_2');
      expect(bob?.minutes).toBe(0);
      expect(bob?.sessions).toBe(0);
    });

    it('should count distinct sessions correctly', () => {
      const weekStart = '2025-01-13';
      const learnerIds = ['learner_1'];
      
      const baseTime = new Date('2025-01-14T10:00:00Z').getTime();
      
      mockLoadEvents.mockReturnValue([
        // Session 1
        {
          kind: 'lesson_start',
          at: baseTime,
          lessonId: 'forest.counting.1',
          biomeId: 'forest'
        },
        {
          kind: 'lesson_start',
          at: baseTime + 600000, // 10 minutes later (same session)
          lessonId: 'forest.counting.2',
          biomeId: 'forest'
        },
        // Session 2 (after 30+ minute gap)
        {
          kind: 'journal_start',
          at: baseTime + 2400000, // 40 minutes later (new session)
          skillId: 'counting'
        },
        // Session 3 (next day)
        {
          kind: 'lesson_start',
          at: baseTime + 86400000, // Next day (new session)
          lessonId: 'desert.shapes.1',
          biomeId: 'desert'
        }
      ] as ProgressEvent[]);
      
      const result = buildClassWeek(learnerIds, weekStart);
      
      expect(result.perLearner[0].sessions).toBe(3);
    });

    it('should handle assignment metrics correctly', () => {
      const weekStart = '2025-01-13';
      const learnerIds = ['learner_1'];
      
      const baseTime = new Date('2025-01-14T10:00:00Z').getTime();
      
      mockLoadEvents.mockReturnValue([
        {
          kind: 'lesson_finish',
          at: baseTime,
          lessonId: 'forest.counting.1',
          biomeId: 'forest',
          result: 'pass',
          durationSec: 480
        }
      ] as ProgressEvent[]);
      
      mockGetActiveAssignments.mockReturnValue([
        {
          id: 'assignment_1',
          name: 'Week 1 Tasks',
          createdAt: Date.now(),
          dueAt: Date.now() + 86400000, // Due tomorrow
          lessons: [
            {
              lessonId: 'forest.counting.1',
              status: 'done' as const,
              dueAt: Date.now() + 86400000
            },
            {
              lessonId: 'forest.counting.2',
              status: 'todo' as const,
              dueAt: Date.now() + 86400000
            }
          ]
        }
      ]);
      
      mockIsDueSoon.mockImplementation((dueAt: number) => {
        return Date.now() + 172800000 > dueAt; // Due within 2 days
      });
      
      const result = buildClassWeek(learnerIds, weekStart);
      
      expect(result.perLearner[0].assignmentsDone).toBe(1);
      expect(result.perLearner[0].dueSoon).toBe(1); // forest.counting.2 is due soon
      expect(result.totals.assignmentsDone).toBe(1);
      expect(result.totals.dueSoon).toBe(1);
    });

    it('should use fallback names for unknown learners', () => {
      const weekStart = '2025-01-13';
      const learnerIds = ['unknown_learner'];
      
      mockLoadEvents.mockReturnValue([]);
      
      const result = buildClassWeek(learnerIds, weekStart);
      
      expect(result.perLearner).toHaveLength(1);
      expect(result.perLearner[0].name).toBe('Learner known_lea'); // Last 8 chars of ID
    });
  });

  describe('getCurrentWeekStart', () => {
    it('should return Monday of current week', () => {
      // Mock current date as Wednesday Jan 15, 2025
      const mockDate = new Date('2025-01-15T14:30:00Z');
      vi.setSystemTime(mockDate);
      
      const weekStart = getCurrentWeekStart();
      
      expect(weekStart).toBe('2025-01-13'); // Monday of that week
    });

    it('should handle Sunday correctly (previous Monday)', () => {
      // Mock current date as Sunday Jan 19, 2025
      const mockDate = new Date('2025-01-19T14:30:00Z');
      vi.setSystemTime(mockDate);
      
      const weekStart = getCurrentWeekStart();
      
      expect(weekStart).toBe('2025-01-13'); // Monday of that week
    });

    it('should handle Monday correctly (same day)', () => {
      // Mock current date as Monday Jan 13, 2025
      const mockDate = new Date('2025-01-13T14:30:00Z');
      vi.setSystemTime(mockDate);
      
      const weekStart = getCurrentWeekStart();
      
      expect(weekStart).toBe('2025-01-13'); // Same Monday
    });
  });

  describe('getWeekDisplayName', () => {
    it('should format week within same month', () => {
      const weekStart = '2025-01-13'; // Monday Jan 13
      const displayName = getWeekDisplayName(weekStart);
      
      expect(displayName).toBe('Jan 13-19, 2025');
    });

    it('should format week spanning two months', () => {
      const weekStart = '2025-01-27'; // Monday Jan 27
      const displayName = getWeekDisplayName(weekStart);
      
      expect(displayName).toBe('Jan 27 - Feb 2, 2025');
    });

    it('should format week at year boundary', () => {
      const weekStart = '2024-12-30'; // Monday Dec 30
      const displayName = getWeekDisplayName(weekStart);
      
      expect(displayName).toBe('Dec 30 - Jan 5, 2024');
    });
  });

  describe('On-task Time Calculation', () => {
    it('should calculate time from on-task ticks when available', () => {
      const weekStart = '2025-01-13';
      const learnerIds = ['learner_1'];
      
      // Mock localStorage with on-task data
      const weekStartTime = new Date('2025-01-13T00:00:00Z').getTime();
      const onTaskTicks = [
        { kind: 'start', at: weekStartTime + 3600000 }, // Start session
        { kind: 'idle', at: weekStartTime + 4200000 }, // Idle after 10 minutes
        { kind: 'resume', at: weekStartTime + 4500000 }, // Resume after 5 minutes idle
        { kind: 'stop', at: weekStartTime + 5100000 } // Stop after 10 more minutes
      ];
      
      global.localStorage.setItem('learner_1.onTask', JSON.stringify(onTaskTicks));
      
      mockLoadEvents.mockReturnValue([]);
      
      const result = buildClassWeek(learnerIds, weekStart);
      
      // Should be 10 + 10 = 20 minutes (idle time excluded)
      expect(result.perLearner[0].minutes).toBe(20);
    });

    it('should fall back to lesson duration when on-task data unavailable', () => {
      const weekStart = '2025-01-13';
      const learnerIds = ['learner_1'];
      
      // No on-task data in localStorage
      
      const baseTime = new Date('2025-01-14T10:00:00Z').getTime();
      
      mockLoadEvents.mockReturnValue([
        {
          kind: 'lesson_finish',
          at: baseTime,
          lessonId: 'forest.counting.1',
          biomeId: 'forest',
          result: 'pass',
          durationSec: 480 // 8 minutes
        },
        {
          kind: 'journal_finish',
          at: baseTime + 3600000,
          skillId: 'counting',
          durationSec: 300 // 5 minutes
        }
      ] as ProgressEvent[]);
      
      const result = buildClassWeek(learnerIds, weekStart);
      
      expect(result.perLearner[0].minutes).toBe(13); // 8 + 5 minutes
    });

    it('should use fallback estimates when duration data missing', () => {
      const weekStart = '2025-01-13';
      const learnerIds = ['learner_1'];
      
      const baseTime = new Date('2025-01-14T10:00:00Z').getTime();
      
      mockLoadEvents.mockReturnValue([
        {
          kind: 'lesson_finish',
          at: baseTime,
          lessonId: 'forest.counting.1',
          biomeId: 'forest',
          result: 'pass'
          // No durationSec
        },
        {
          kind: 'journal_finish',
          at: baseTime + 3600000,
          skillId: 'counting'
          // No durationSec
        }
      ] as ProgressEvent[]);
      
      const result = buildClassWeek(learnerIds, weekStart);
      
      expect(result.perLearner[0].minutes).toBe(13); // 8 (lesson fallback) + 5 (journal fallback)
    });
  });
});