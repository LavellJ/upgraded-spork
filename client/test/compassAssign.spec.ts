import { describe, it, expect, beforeEach, vi } from 'vitest';
import { recommendNextPin, getLastRecommendationReason } from '../src/learning/policy';
import { 
  AssignedPathV2, 
  savePathsV2, 
  isDueSoon, 
  isOverdue,
  startOfDay
} from '../src/guide/assign';

// Mock localStorage
const mockLocalStorage = {
  data: {} as Record<string, string>,
  getItem: vi.fn((key: string) => mockLocalStorage.data[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    mockLocalStorage.data[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete mockLocalStorage.data[key];
  }),
  clear: vi.fn(() => {
    mockLocalStorage.data = {};
  })
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

// Mock learner model
vi.mock('../src/learning/model', () => ({
  learnerCache: {
    getSkill: vi.fn(() => ({ mastery: 0.5, attempts: 10 })),
    updateSkill: vi.fn()
  }
}));

describe('Compass Assignment Priority', () => {
  const testLearnerId = 'test-learner-compass';
  const testDate = new Date('2025-01-15T10:00:00.000Z').getTime(); // Wednesday
  
  beforeEach(() => {
    mockLocalStorage.clear();
    vi.clearAllMocks();
  });

  describe('recommendNextPin Priority Order', () => {
    it('should prioritize overdue assignments highest', () => {
      // Create assignments with different urgency levels
      const assignments: AssignedPathV2[] = [
        // Normal assignment (should be lowest priority)
        {
          id: 'normal-path',
          name: 'Normal Assignment',
          lessonIds: ['forest-1', 'forest-2'],
          lessons: [
            { lessonId: 'forest-1', status: 'not_started' },
            { lessonId: 'forest-2', status: 'not_started' }
          ],
          createdAt: testDate - (5 * 24 * 60 * 60 * 1000),
          updatedAt: testDate - (5 * 24 * 60 * 60 * 1000),
          dueAt: testDate + (7 * 24 * 60 * 60 * 1000), // due in 1 week
          priority: 'normal'
        },
        // Due soon assignment
        {
          id: 'due-soon-path',
          name: 'Due Soon Assignment',
          lessonIds: ['desert-1', 'desert-2'],
          lessons: [
            { lessonId: 'desert-1', status: 'not_started' },
            { lessonId: 'desert-2', status: 'not_started' }
          ],
          createdAt: testDate - (5 * 24 * 60 * 60 * 1000),
          updatedAt: testDate - (5 * 24 * 60 * 60 * 1000),
          dueAt: testDate + (24 * 60 * 60 * 1000), // due tomorrow
          priority: 'normal'
        },
        // Overdue assignment (should be highest priority)
        {
          id: 'overdue-path',
          name: 'Overdue Assignment',
          lessonIds: ['ocean-1', 'ocean-2'],
          lessons: [
            { lessonId: 'ocean-1', status: 'not_started' },
            { lessonId: 'ocean-2', status: 'not_started' }
          ],
          createdAt: testDate - (10 * 24 * 60 * 60 * 1000),
          updatedAt: testDate - (10 * 24 * 60 * 60 * 1000),
          dueAt: testDate - (2 * 24 * 60 * 60 * 1000), // overdue by 2 days
          priority: 'normal'
        },
        // Next assigned lesson (partially complete)
        {
          id: 'active-path',
          name: 'Active Assignment',
          lessonIds: ['night-1', 'night-2', 'night-3'],
          lessons: [
            { lessonId: 'night-1', status: 'done', completedAt: testDate - (24 * 60 * 60 * 1000) },
            { lessonId: 'night-2', status: 'not_started' }, // This should be next
            { lessonId: 'night-3', status: 'not_started' }
          ],
          createdAt: testDate - (3 * 24 * 60 * 60 * 1000),
          updatedAt: testDate - (24 * 60 * 60 * 1000),
          dueAt: testDate + (5 * 24 * 60 * 60 * 1000), // due in 5 days
          priority: 'normal'
        }
      ];

      savePathsV2(assignments, testLearnerId);

      // Mock completion state - night-1 is completed
      const completedLessons = new Set(['night-1']);

      // Test overdue priority (highest)
      const candidates = ['forest-1', 'forest-2', 'desert-1', 'desert-2', 'ocean-1', 'ocean-2', 'night-1', 'night-2', 'night-3'];
      const mockLearner = {}; // Mock learner state
      const recommendation = recommendNextPin(candidates, mockLearner, 1, undefined, testLearnerId);
      expect(recommendation).toBeDefined();
      expect(recommendation).toBe('ocean-1'); // First lesson from overdue path
      
      const reason = getLastRecommendationReason();
      expect(reason).toContain('Overdue');
      expect(reason).toContain('Overdue Assignment');
    });

    it('should prioritize due soon when no overdue assignments', () => {
      const assignments: AssignedPathV2[] = [
        // Normal assignment
        {
          id: 'normal-path',
          name: 'Normal Assignment',
          lessonIds: ['forest-1'],
          lessons: [{ lessonId: 'forest-1', status: 'not_started' }],
          createdAt: testDate,
          updatedAt: testDate,
          dueAt: testDate + (7 * 24 * 60 * 60 * 1000), // due in 1 week
          priority: 'normal'
        },
        // Due soon assignment (should be prioritized)
        {
          id: 'due-soon-path',
          name: 'Due Soon Assignment',
          lessonIds: ['desert-1'],
          lessons: [{ lessonId: 'desert-1', status: 'not_started' }],
          createdAt: testDate,
          updatedAt: testDate,
          dueAt: testDate + (24 * 60 * 60 * 1000), // due tomorrow
          priority: 'normal'
        }
      ];

      savePathsV2(assignments, testLearnerId);

      const candidates = ['forest-1', 'desert-1'];
      const mockLearner = {};
      const recommendation = recommendNextPin(candidates, mockLearner, 1, undefined, testLearnerId);
      expect(recommendation).toBe('desert-1');
      
      const reason = getLastRecommendationReason();
      expect(reason).toContain('Due soon');
      expect(reason).toContain('Due Soon Assignment');
    });

    it('should prioritize next assigned lesson when no urgent assignments', () => {
      const assignments: AssignedPathV2[] = [
        // Partially completed assignment
        {
          id: 'active-path',
          name: 'Active Assignment',
          lessonIds: ['night-1', 'night-2', 'night-3'],
          lessons: [
            { lessonId: 'night-1', status: 'done' },
            { lessonId: 'night-2', status: 'not_started' }, // This should be next
            { lessonId: 'night-3', status: 'not_started' }
          ],
          createdAt: testDate,
          updatedAt: testDate,
          dueAt: testDate + (7 * 24 * 60 * 60 * 1000), // due in 1 week
          priority: 'normal'
        },
        // Fully incomplete assignment
        {
          id: 'untouched-path',
          name: 'Untouched Assignment',
          lessonIds: ['forest-1', 'forest-2'],
          lessons: [
            { lessonId: 'forest-1', status: 'not_started' },
            { lessonId: 'forest-2', status: 'not_started' }
          ],
          createdAt: testDate,
          updatedAt: testDate,
          dueAt: testDate + (10 * 24 * 60 * 60 * 1000), // due in 10 days
          priority: 'normal'
        }
      ];

      savePathsV2(assignments, testLearnerId);

      const candidates = ['forest-1', 'forest-2', 'night-1', 'night-2', 'night-3'];
      const mockLearner = {};
      const recommendation = recommendNextPin(candidates, mockLearner, 1, undefined, testLearnerId);
      expect(recommendation).toBe('night-2'); // Next in sequence
      
      const reason = getLastRecommendationReason();
      expect(reason).toContain('Next assigned');
      expect(reason).toContain('Active Assignment');
    });

    it('should fall back to normal learner model when no assignments', () => {
      // No assignments saved
      const candidates = ['forest-1', 'desert-1', 'ocean-1'];
      const mockLearner = {};
      const recommendation = recommendNextPin(candidates, mockLearner, 1, undefined, testLearnerId);
      
      // Should still return a recommendation based on learner model
      expect(recommendation).toBeDefined();
      
      const reason = getLastRecommendationReason();
      // Should not contain assignment-specific reasons
      expect(reason).not.toContain('Overdue');
      expect(reason).not.toContain('Due soon');
      expect(reason).not.toContain('Next assigned');
    });

    it('should handle assignment with per-lesson due dates', () => {
      const todayTimestamp = startOfDay(testDate);
      const assignments: AssignedPathV2[] = [
        {
          id: 'per-lesson-due',
          name: 'Per-Lesson Due Assignment',
          lessonIds: ['mixed-1', 'mixed-2', 'mixed-3'],
          lessons: [
            { 
              lessonId: 'mixed-1', 
              status: 'not_started',
              dueAt: todayTimestamp - (24 * 60 * 60 * 1000) // overdue
            },
            { 
              lessonId: 'mixed-2', 
              status: 'not_started',
              dueAt: todayTimestamp + (24 * 60 * 60 * 1000) // due tomorrow
            },
            { 
              lessonId: 'mixed-3', 
              status: 'not_started',
              dueAt: todayTimestamp + (7 * 24 * 60 * 60 * 1000) // due in 1 week
            }
          ],
          createdAt: testDate,
          updatedAt: testDate,
          dueAt: todayTimestamp + (7 * 24 * 60 * 60 * 1000), // Path due in 1 week
          priority: 'normal'
        }
      ];

      savePathsV2(assignments, testLearnerId);

      const candidates = ['mixed-1', 'mixed-2', 'mixed-3'];
      const mockLearner = {};
      const recommendation = recommendNextPin(candidates, mockLearner, 1, undefined, testLearnerId);
      expect(recommendation).toBe('mixed-1'); // Overdue lesson should be prioritized
      
      const reason = getLastRecommendationReason();
      expect(reason).toContain('Overdue');
    });

    it('should handle completed assignments gracefully', () => {
      const assignments: AssignedPathV2[] = [
        {
          id: 'completed-path',
          name: 'Completed Assignment',
          lessonIds: ['done-1', 'done-2'],
          lessons: [
            { lessonId: 'done-1', status: 'done' },
            { lessonId: 'done-2', status: 'done' }
          ],
          createdAt: testDate,
          updatedAt: testDate,
          dueAt: testDate + (24 * 60 * 60 * 1000),
          priority: 'normal'
        }
      ];

      savePathsV2(assignments, testLearnerId);

      const candidates = ['done-1', 'done-2', 'forest-1'];
      const mockLearner = {};
      const recommendation = recommendNextPin(candidates, mockLearner, 1, undefined, testLearnerId);
      
      // Should fall back to learner model since no incomplete assignments
      expect(recommendation).toBeDefined();
      
      const reason = getLastRecommendationReason();
      expect(reason).not.toContain('assigned');
    });

    it('should respect assignment priorities within the same urgency level', () => {
      const assignments: AssignedPathV2[] = [
        {
          id: 'high-priority',
          name: 'High Priority Assignment',
          lessonIds: ['high-1'],
          lessons: [{ lessonId: 'high-1', status: 'not_started' }],
          createdAt: testDate,
          updatedAt: testDate,
          dueAt: testDate + (24 * 60 * 60 * 1000), // due tomorrow
          priority: 'high'
        },
        {
          id: 'normal-priority',
          name: 'Normal Priority Assignment',
          lessonIds: ['normal-1'],
          lessons: [{ lessonId: 'normal-1', status: 'not_started' }],
          createdAt: testDate,
          updatedAt: testDate,
          dueAt: testDate + (24 * 60 * 60 * 1000), // also due tomorrow
          priority: 'normal'
        }
      ];

      savePathsV2(assignments, testLearnerId);

      const candidates = ['high-1', 'normal-1'];
      const mockLearner = {};
      const recommendation = recommendNextPin(candidates, mockLearner, 1, undefined, testLearnerId);
      expect(recommendation).toBe('high-1'); // High priority should win
      
      const reason = getLastRecommendationReason();
      expect(reason).toContain('Due soon');
      expect(reason).toContain('High Priority Assignment');
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing due dates gracefully', () => {
      const assignments: AssignedPathV2[] = [
        {
          id: 'no-due-date',
          name: 'No Due Date Assignment',
          lessonIds: ['flexible-1'],
          lessons: [{ lessonId: 'flexible-1', status: 'not_started' }],
          createdAt: testDate,
          updatedAt: testDate,
          // No dueAt specified
          priority: 'normal'
        }
      ];

      savePathsV2(assignments, testLearnerId);

      const candidates = ['flexible-1'];
      const mockLearner = {};
      const recommendation = recommendNextPin(candidates, mockLearner, 1, undefined, testLearnerId);
      expect(recommendation).toBeDefined();
      
      // Should still recommend the assignment lesson even without due date
      const reason = getLastRecommendationReason();
      expect(reason).toBeDefined();
    });

    it('should handle archived assignments', () => {
      const assignments: AssignedPathV2[] = [
        {
          id: 'archived-path',
          name: 'Archived Assignment',
          lessonIds: ['archived-1'],
          lessons: [{ lessonId: 'archived-1', status: 'not_started' }],
          createdAt: testDate,
          updatedAt: testDate,
          dueAt: testDate - (24 * 60 * 60 * 1000), // overdue
          priority: 'normal',
          archived: true
        }
      ];

      savePathsV2(assignments, testLearnerId);

      const candidates = ['archived-1'];
      const mockLearner = {};
      const recommendation = recommendNextPin(candidates, mockLearner, 1, undefined, testLearnerId);
      
      // Should not recommend from archived assignments
      const reason = getLastRecommendationReason();
      expect(reason).not.toContain('Archived Assignment');
    });
  });
});