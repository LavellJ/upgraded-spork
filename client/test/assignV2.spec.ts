import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  AssignedPath,
  AssignedPathV2,
  AssignedLesson,
  AssignedLessonStatus,
  migrateFromV1,
  loadPathsV2,
  savePathsV2,
  upsertPathV2,
  deletePathV2,
  getPathProgress,
  isDueSoon,
  isOverdue,
  startOfDay,
  formatDue,
  getActiveAssignments,
  getLessonAssignment
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

describe('Assignment V2 System', () => {
  const testLearnerId = 'test-learner-123';
  
  beforeEach(() => {
    mockLocalStorage.clear();
    vi.clearAllMocks();
  });

  describe('V1 to V2 Migration', () => {
    it('should migrate v1 paths to v2 format', () => {
      // Setup v1 data
      const v1Paths: AssignedPath[] = [
        {
          id: 'path-1',
          name: 'Math Basics',
          lessonIds: ['lesson-1', 'lesson-2'],
          createdAt: 1234567890000,
          expiresAt: 1234567890000 + (7 * 24 * 60 * 60 * 1000)
        }
      ];
      
      // Save v1 data
      mockLocalStorage.setItem(`qi:${testLearnerId}:assigned.paths`, JSON.stringify(v1Paths));
      
      // Run migration
      migrateFromV1(testLearnerId);
      
      // Check v2 data was created
      const v2Paths = loadPathsV2(testLearnerId);
      expect(v2Paths).toHaveLength(1);
      
      const migratedPath = v2Paths[0];
      expect(migratedPath.id).toBe('path-1');
      expect(migratedPath.name).toBe('Math Basics');
      expect(migratedPath.lessonIds).toEqual(['lesson-1', 'lesson-2']);
      expect(migratedPath.lessons).toHaveLength(2);
      expect(migratedPath.lessons[0]).toEqual({
        lessonId: 'lesson-1',
        status: 'not_started'
      });
      expect(migratedPath.priority).toBe('normal');
      
      // Check v1 data was removed
      expect(mockLocalStorage.getItem(`qi:${testLearnerId}:assigned.paths`)).toBeNull();
    });

    it('should not migrate if v2 data already exists', () => {
      // Setup both v1 and v2 data
      const v1Paths: AssignedPath[] = [{ id: 'v1-path', name: 'V1 Path', lessonIds: ['lesson-1'], createdAt: Date.now() }];
      const v2Paths: AssignedPathV2[] = [{
        id: 'v2-path',
        name: 'V2 Path',
        lessonIds: ['lesson-2'],
        lessons: [{ lessonId: 'lesson-2', status: 'not_started' }],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        priority: 'high'
      }];
      
      mockLocalStorage.setItem(`qi:${testLearnerId}:assigned.paths`, JSON.stringify(v1Paths));
      mockLocalStorage.setItem(`qi:${testLearnerId}:assigned.paths.v2`, JSON.stringify(v2Paths));
      
      // Run migration
      migrateFromV1(testLearnerId);
      
      // V2 should be unchanged, V1 should remain
      const loadedV2 = loadPathsV2(testLearnerId);
      expect(loadedV2).toHaveLength(1);
      expect(loadedV2[0].id).toBe('v2-path');
      expect(mockLocalStorage.getItem(`qi:${testLearnerId}:assigned.paths`)).not.toBeNull();
    });
  });

  describe('Date Utilities', () => {
    const testDate = new Date('2025-01-15T10:00:00.000Z').getTime(); // Wednesday

    describe('isDueSoon', () => {
      it('should return true for today', () => {
        const today = startOfDay(testDate);
        expect(isDueSoon(today, testDate)).toBe(true);
      });

      it('should return true for tomorrow', () => {
        const tomorrow = startOfDay(testDate) + (24 * 60 * 60 * 1000);
        expect(isDueSoon(tomorrow, testDate)).toBe(true);
      });

      it('should return true for day after tomorrow', () => {
        const dayAfter = startOfDay(testDate) + (2 * 24 * 60 * 60 * 1000);
        expect(isDueSoon(dayAfter, testDate)).toBe(true);
      });

      it('should return false for 3 days out', () => {
        const threeDays = startOfDay(testDate) + (3 * 24 * 60 * 60 * 1000);
        expect(isDueSoon(threeDays, testDate)).toBe(false);
      });

      it('should return false for past dates', () => {
        const yesterday = startOfDay(testDate) - (24 * 60 * 60 * 1000);
        expect(isDueSoon(yesterday, testDate)).toBe(false);
      });

      it('should return false for undefined dueAt', () => {
        expect(isDueSoon(undefined, testDate)).toBe(false);
      });
    });

    describe('isOverdue', () => {
      it('should return false for today', () => {
        const today = startOfDay(testDate);
        expect(isOverdue(today, testDate)).toBe(false);
      });

      it('should return false for future dates', () => {
        const tomorrow = startOfDay(testDate) + (24 * 60 * 60 * 1000);
        expect(isOverdue(tomorrow, testDate)).toBe(false);
      });

      it('should return true for yesterday', () => {
        const yesterday = startOfDay(testDate) - (24 * 60 * 60 * 1000);
        expect(isOverdue(yesterday, testDate)).toBe(true);
      });

      it('should return true for past dates', () => {
        const pastDate = startOfDay(testDate) - (7 * 24 * 60 * 60 * 1000);
        expect(isOverdue(pastDate, testDate)).toBe(true);
      });

      it('should return false for undefined dueAt', () => {
        expect(isOverdue(undefined, testDate)).toBe(false);
      });
    });

    describe('formatDue', () => {
      it('should format today', () => {
        const today = startOfDay(testDate);
        expect(formatDue(today, testDate)).toBe('today');
      });

      it('should format tomorrow', () => {
        const tomorrow = startOfDay(testDate) + (24 * 60 * 60 * 1000);
        expect(formatDue(tomorrow, testDate)).toBe('tomorrow');
      });

      it('should format yesterday', () => {
        const yesterday = startOfDay(testDate) - (24 * 60 * 60 * 1000);
        expect(formatDue(yesterday, testDate)).toBe('yesterday');
      });

      it('should format future days', () => {
        const threeDays = startOfDay(testDate) + (3 * 24 * 60 * 60 * 1000);
        expect(formatDue(threeDays, testDate)).toBe('in 3 days');
      });

      it('should format past days', () => {
        const threeDaysAgo = startOfDay(testDate) - (3 * 24 * 60 * 60 * 1000);
        expect(formatDue(threeDaysAgo, testDate)).toBe('3 days ago');
      });

      it('should format distant dates with short format', () => {
        const distantFuture = startOfDay(testDate) + (30 * 24 * 60 * 60 * 1000);
        const formatted = formatDue(distantFuture, testDate);
        expect(formatted).toMatch(/^[A-Za-z]{3} \d{1,2}$/); // e.g., "Feb 14"
      });

      it('should return empty string for undefined dueAt', () => {
        expect(formatDue(undefined, testDate)).toBe('');
      });
    });
  });

  describe('Path Progress', () => {
    it('should calculate progress correctly', () => {
      const path: AssignedPathV2 = {
        id: 'test-path',
        name: 'Test Path',
        lessonIds: ['lesson-1', 'lesson-2', 'lesson-3'],
        lessons: [
          { lessonId: 'lesson-1', status: 'done' },
          { lessonId: 'lesson-2', status: 'in_progress' },
          { lessonId: 'lesson-3', status: 'not_started' }
        ],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        priority: 'normal'
      };

      const progress = getPathProgress(path);
      expect(progress.total).toBe(3);
      expect(progress.done).toBe(1);
      expect(progress.pct).toBe(33);
    });

    it('should handle empty path', () => {
      const path: AssignedPathV2 = {
        id: 'empty-path',
        name: 'Empty Path',
        lessonIds: [],
        lessons: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        priority: 'normal'
      };

      const progress = getPathProgress(path);
      expect(progress.total).toBe(0);
      expect(progress.done).toBe(0);
      expect(progress.pct).toBe(0);
    });

    it('should handle all completed path', () => {
      const path: AssignedPathV2 = {
        id: 'complete-path',
        name: 'Complete Path',
        lessonIds: ['lesson-1', 'lesson-2'],
        lessons: [
          { lessonId: 'lesson-1', status: 'done' },
          { lessonId: 'lesson-2', status: 'done' }
        ],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        priority: 'normal'
      };

      const progress = getPathProgress(path);
      expect(progress.total).toBe(2);
      expect(progress.done).toBe(2);
      expect(progress.pct).toBe(100);
    });
  });

  describe('Policy Override Order', () => {
    let mockPaths: AssignedPathV2[];
    const testDate = new Date('2025-01-15T10:00:00.000Z').getTime();

    beforeEach(() => {
      // Create mock paths with different priority scenarios
      mockPaths = [
        // Overdue path
        {
          id: 'overdue-path',
          name: 'Overdue Assignment',
          lessonIds: ['overdue-lesson'],
          lessons: [{ lessonId: 'overdue-lesson', status: 'not_started' }],
          createdAt: testDate - (10 * 24 * 60 * 60 * 1000),
          updatedAt: testDate - (10 * 24 * 60 * 60 * 1000),
          dueAt: testDate - (2 * 24 * 60 * 60 * 1000), // 2 days ago
          priority: 'normal'
        },
        // Due soon path
        {
          id: 'due-soon-path',
          name: 'Due Soon Assignment',
          lessonIds: ['due-soon-lesson'],
          lessons: [{ lessonId: 'due-soon-lesson', status: 'not_started' }],
          createdAt: testDate - (5 * 24 * 60 * 60 * 1000),
          updatedAt: testDate - (5 * 24 * 60 * 60 * 1000),
          dueAt: testDate + (24 * 60 * 60 * 1000), // tomorrow
          priority: 'normal'
        },
        // Active assignment (next in order)
        {
          id: 'active-path',
          name: 'Active Assignment',
          lessonIds: ['active-lesson-1', 'active-lesson-2'],
          lessons: [
            { lessonId: 'active-lesson-1', status: 'done' },
            { lessonId: 'active-lesson-2', status: 'not_started' }
          ],
          createdAt: testDate - (3 * 24 * 60 * 60 * 1000),
          updatedAt: testDate - (3 * 24 * 60 * 60 * 1000),
          dueAt: testDate + (7 * 24 * 60 * 60 * 1000), // 1 week out
          priority: 'normal'
        }
      ];

      // Save mock paths
      savePathsV2(mockPaths, testLearnerId);
    });

    it('should prioritize overdue assignments highest', () => {
      const assignments = getActiveAssignments(testLearnerId);
      const overdueAssignment = assignments.find(p => isOverdue(p.dueAt, testDate));
      expect(overdueAssignment).toBeDefined();
      expect(overdueAssignment?.id).toBe('overdue-path');
    });

    it('should prioritize due soon over normal assignments', () => {
      const assignments = getActiveAssignments(testLearnerId);
      const dueSoonAssignment = assignments.find(p => isDueSoon(p.dueAt, testDate));
      expect(dueSoonAssignment).toBeDefined();
      expect(dueSoonAssignment?.id).toBe('due-soon-path');
    });

    it('should find lesson assignments correctly', () => {
      const assignments = getActiveAssignments(testLearnerId);
      
      // Test overdue lesson
      const overdueLesson = getLessonAssignment(assignments, 'overdue-lesson');
      expect(overdueLesson).toBeDefined();
      expect(overdueLesson?.pathId).toBe('overdue-path');
      expect(overdueLesson?.status).toBe('not_started');
      expect(isOverdue(overdueLesson?.dueAt, testDate)).toBe(true);

      // Test due soon lesson
      const dueSoonLesson = getLessonAssignment(assignments, 'due-soon-lesson');
      expect(dueSoonLesson).toBeDefined();
      expect(dueSoonLesson?.pathId).toBe('due-soon-path');
      expect(isDueSoon(dueSoonLesson?.dueAt, testDate)).toBe(true);

      // Test active lesson (next in sequence)
      const activeLesson = getLessonAssignment(assignments, 'active-lesson-2');
      expect(activeLesson).toBeDefined();
      expect(activeLesson?.pathId).toBe('active-path');
      expect(activeLesson?.status).toBe('not_started');
    });
  });

  describe('CRUD Operations', () => {
    it('should save and load paths correctly', () => {
      const testPath: AssignedPathV2 = {
        id: 'test-path',
        name: 'Test Path',
        lessonIds: ['lesson-1', 'lesson-2'],
        lessons: [
          { lessonId: 'lesson-1', status: 'not_started' },
          { lessonId: 'lesson-2', status: 'not_started' }
        ],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        priority: 'high'
      };

      upsertPathV2(testPath, testLearnerId);
      const loadedPaths = loadPathsV2(testLearnerId);
      
      expect(loadedPaths).toHaveLength(1);
      expect(loadedPaths[0]).toEqual(expect.objectContaining({
        id: 'test-path',
        name: 'Test Path',
        priority: 'high'
      }));
    });

    it('should update existing paths', () => {
      const originalPath: AssignedPathV2 = {
        id: 'update-test',
        name: 'Original Name',
        lessonIds: ['lesson-1'],
        lessons: [{ lessonId: 'lesson-1', status: 'not_started' }],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        priority: 'normal'
      };

      upsertPathV2(originalPath, testLearnerId);

      const updatedPath = { ...originalPath, name: 'Updated Name', priority: 'high' as const };
      upsertPathV2(updatedPath, testLearnerId);

      const loadedPaths = loadPathsV2(testLearnerId);
      expect(loadedPaths).toHaveLength(1);
      expect(loadedPaths[0].name).toBe('Updated Name');
      expect(loadedPaths[0].priority).toBe('high');
    });

    it('should delete paths correctly', () => {
      const testPath: AssignedPathV2 = {
        id: 'delete-me',
        name: 'To Be Deleted',
        lessonIds: ['lesson-1'],
        lessons: [{ lessonId: 'lesson-1', status: 'not_started' }],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        priority: 'normal'
      };

      upsertPathV2(testPath, testLearnerId);
      expect(loadPathsV2(testLearnerId)).toHaveLength(1);

      deletePathV2('delete-me', testLearnerId);
      expect(loadPathsV2(testLearnerId)).toHaveLength(0);
    });

    it('should filter expired paths', () => {
      const now = Date.now();
      const expiredPath: AssignedPathV2 = {
        id: 'expired-path',
        name: 'Expired Path',
        lessonIds: ['lesson-1'],
        lessons: [{ lessonId: 'lesson-1', status: 'not_started' }],
        createdAt: now - (10 * 24 * 60 * 60 * 1000),
        updatedAt: now - (10 * 24 * 60 * 60 * 1000),
        expiresAt: now - (24 * 60 * 60 * 1000), // expired yesterday
        priority: 'normal'
      };

      const activePath: AssignedPathV2 = {
        id: 'active-path',
        name: 'Active Path',
        lessonIds: ['lesson-2'],
        lessons: [{ lessonId: 'lesson-2', status: 'not_started' }],
        createdAt: now,
        updatedAt: now,
        expiresAt: now + (7 * 24 * 60 * 60 * 1000), // expires in a week
        priority: 'normal'
      };

      savePathsV2([expiredPath, activePath], testLearnerId);
      const loadedPaths = loadPathsV2(testLearnerId);
      
      expect(loadedPaths).toHaveLength(1);
      expect(loadedPaths[0].id).toBe('active-path');
    });
  });
});