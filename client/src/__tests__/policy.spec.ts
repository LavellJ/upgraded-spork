import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  recommendNextPin, 
  getAssignmentPriorityCandidates, 
  getLastRecommendationReason 
} from '../learning/policy';
import type { LearnerState } from '../learning/model';
import * as assignModule from '../guide/assign';

// Mock the assign module
vi.mock('../guide/assign', () => ({
  getActiveAssignments: vi.fn(),
  getNextAssignedLesson: vi.fn(),
  isDueSoon: vi.fn(),
  isOverdue: vi.fn()
}));

describe('Assignment Priority Policy', () => {
  let mockLearner: LearnerState;
  const learnerId = 'test-learner';
  const candidates = ['forest.lesson1', 'desert.lesson2', 'ocean.lesson3'];
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock learner state
    mockLearner = {
      id: learnerId,
      skills: {
        'general.forest': { p: 0.6, seen: 5, correct: 3, streak: 1 },
        'general.desert': { p: 0.8, seen: 10, correct: 8, streak: 2 },
        'general.ocean': { p: 0.4, seen: 2, correct: 1, streak: 0 }
      }
    };
  });

  describe('getAssignmentPriorityCandidates', () => {
    it('categorizes overdue lessons correctly', () => {
      const now = Date.now();
      const overdueTime = now - 24 * 60 * 60 * 1000; // 1 day ago
      
      // Mock assignments with overdue lesson
      vi.mocked(assignModule.getActiveAssignments).mockReturnValue([
        {
          id: 'path1',
          name: 'Math Week 1',
          lessons: [
            { lessonId: 'lesson1', status: 'not_started', dueAt: overdueTime },
            { lessonId: 'lesson2', status: 'not_started' }
          ],
          lessonIds: ['lesson1', 'lesson2'],
          createdAt: now,
          updatedAt: now
        }
      ]);
      
      vi.mocked(assignModule.isOverdue).mockImplementation((dueAt) => 
        dueAt === overdueTime
      );
      vi.mocked(assignModule.isDueSoon).mockReturnValue(false);
      
      const result = getAssignmentPriorityCandidates(learnerId);
      
      expect(result.overdue).toHaveLength(1);
      expect(result.overdue[0]).toMatchObject({
        lessonId: 'lesson1',
        pathName: 'Math Week 1',
        priority: 'overdue'
      });
      expect(result.dueSoon).toHaveLength(0);
      expect(result.assigned).toHaveLength(1); // lesson2 is next not_started
    });
    
    it('categorizes due soon lessons correctly', () => {
      const now = Date.now();
      const dueSoonTime = now + 24 * 60 * 60 * 1000; // 1 day from now
      
      vi.mocked(assignModule.getActiveAssignments).mockReturnValue([
        {
          id: 'path1',
          name: 'Science Week 1',
          lessons: [
            { lessonId: 'lesson1', status: 'not_started', dueAt: dueSoonTime }
          ],
          lessonIds: ['lesson1'],
          createdAt: now,
          updatedAt: now
        }
      ]);
      
      vi.mocked(assignModule.isOverdue).mockReturnValue(false);
      vi.mocked(assignModule.isDueSoon).mockImplementation((dueAt) => 
        dueAt === dueSoonTime
      );
      
      const result = getAssignmentPriorityCandidates(learnerId);
      
      expect(result.dueSoon).toHaveLength(1);
      expect(result.dueSoon[0]).toMatchObject({
        lessonId: 'lesson1',
        pathName: 'Science Week 1',
        priority: 'due_soon'
      });
    });
    
    it('only includes first not_started lesson for assigned category', () => {
      const now = Date.now();
      
      vi.mocked(assignModule.getActiveAssignments).mockReturnValue([
        {
          id: 'path1',
          name: 'English Week 1',
          lessons: [
            { lessonId: 'lesson1', status: 'done' },
            { lessonId: 'lesson2', status: 'not_started' },
            { lessonId: 'lesson3', status: 'not_started' }, // Should not be included
          ],
          lessonIds: ['lesson1', 'lesson2', 'lesson3'],
          createdAt: now,
          updatedAt: now
        }
      ]);
      
      vi.mocked(assignModule.isOverdue).mockReturnValue(false);
      vi.mocked(assignModule.isDueSoon).mockReturnValue(false);
      
      const result = getAssignmentPriorityCandidates(learnerId);
      
      expect(result.assigned).toHaveLength(1);
      expect(result.assigned[0].lessonId).toBe('lesson2');
    });
  });

  describe('recommendNextPin priority rules', () => {
    it('prioritizes overdue lessons over all others', () => {
      const now = Date.now();
      
      // Mock overdue assignment
      vi.mocked(assignModule.getActiveAssignments).mockReturnValue([
        {
          id: 'path1',
          name: 'Critical Assignment',
          lessons: [
            { lessonId: 'lesson1', status: 'not_started', dueAt: now - 1000 }
          ],
          lessonIds: ['lesson1'],
          createdAt: now,
          updatedAt: now
        }
      ]);
      
      vi.mocked(assignModule.isOverdue).mockReturnValue(true);
      vi.mocked(assignModule.isDueSoon).mockReturnValue(false);
      
      const result = recommendNextPin(candidates, mockLearner, 1, undefined, learnerId);
      const reason = getLastRecommendationReason();
      
      expect(result).toBe('forest.lesson1');
      expect(reason).toBe('Overdue in "Critical Assignment"');
    });
    
    it('prioritizes due soon lessons over regular assigned lessons', () => {
      const now = Date.now();
      
      vi.mocked(assignModule.getActiveAssignments).mockReturnValue([
        {
          id: 'path1',
          name: 'Due Soon Assignment',
          lessons: [
            { lessonId: 'lesson2', status: 'not_started', dueAt: now + 1000 }
          ],
          lessonIds: ['lesson2'],
          createdAt: now,
          updatedAt: now
        },
        {
          id: 'path2',
          name: 'Regular Assignment',
          lessons: [
            { lessonId: 'lesson1', status: 'not_started' }
          ],
          lessonIds: ['lesson1'],
          createdAt: now,
          updatedAt: now
        }
      ]);
      
      vi.mocked(assignModule.isOverdue).mockReturnValue(false);
      vi.mocked(assignModule.isDueSoon).mockImplementation((dueAt) => 
        dueAt === now + 1000
      );
      
      const result = recommendNextPin(candidates, mockLearner, 1, undefined, learnerId);
      const reason = getLastRecommendationReason();
      
      expect(result).toBe('desert.lesson2');
      expect(reason).toBe('Due soon in "Due Soon Assignment"');
    });
    
    it('prioritizes assigned lessons over learner model', () => {
      const now = Date.now();
      
      vi.mocked(assignModule.getActiveAssignments).mockReturnValue([
        {
          id: 'path1',
          name: 'Regular Assignment',
          lessons: [
            { lessonId: 'lesson3', status: 'not_started' }
          ],
          lessonIds: ['lesson3'],
          createdAt: now,
          updatedAt: now
        }
      ]);
      
      vi.mocked(assignModule.isOverdue).mockReturnValue(false);
      vi.mocked(assignModule.isDueSoon).mockReturnValue(false);
      
      const result = recommendNextPin(candidates, mockLearner, 1, undefined, learnerId);
      const reason = getLastRecommendationReason();
      
      expect(result).toBe('ocean.lesson3');
      expect(reason).toBe('Next in "Regular Assignment"');
    });
    
    it('falls back to learner model when no assignments match candidates', () => {
      vi.mocked(assignModule.getActiveAssignments).mockReturnValue([
        {
          id: 'path1',
          name: 'Non-matching Assignment',
          lessons: [
            { lessonId: 'lesson99', status: 'not_started' } // Not in candidates
          ],
          lessonIds: ['lesson99'],
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
      ]);
      
      vi.mocked(assignModule.isOverdue).mockReturnValue(false);
      vi.mocked(assignModule.isDueSoon).mockReturnValue(false);
      vi.mocked(assignModule.getNextAssignedLesson).mockReturnValue(null);
      
      const result = recommendNextPin(candidates, mockLearner, 1, undefined, learnerId);
      const reason = getLastRecommendationReason();
      
      expect(result).toBeTruthy(); // Should return some candidate
      expect(reason).toBe('Learner model recommendation');
    });
    
    it('works without learner ID (legacy mode)', () => {
      vi.mocked(assignModule.getNextAssignedLesson).mockReturnValue('lesson2');
      
      const result = recommendNextPin(candidates, mockLearner, 1, undefined);
      const reason = getLastRecommendationReason();
      
      expect(result).toBe('desert.lesson2');
      expect(reason).toBe('Legacy assignment (V1)');
    });
  });

  describe('path order prioritization', () => {
    it('returns earliest overdue lesson in path order', () => {
      const now = Date.now();
      
      vi.mocked(assignModule.getActiveAssignments).mockReturnValue([
        {
          id: 'path1',
          name: 'Multi-lesson Assignment',
          lessons: [
            { lessonId: 'lesson3', status: 'not_started', dueAt: now - 2000 }, // index 0
            { lessonId: 'lesson1', status: 'not_started', dueAt: now - 1000 }, // index 1  
            { lessonId: 'lesson2', status: 'not_started', dueAt: now - 3000 }  // index 2
          ],
          lessonIds: ['lesson3', 'lesson1', 'lesson2'],
          createdAt: now,
          updatedAt: now
        }
      ]);
      
      vi.mocked(assignModule.isOverdue).mockReturnValue(true);
      vi.mocked(assignModule.isDueSoon).mockReturnValue(false);
      
      const result = recommendNextPin(candidates, mockLearner, 1, undefined, learnerId);
      
      // Should return lesson3 (index 0) even though lesson2 is more overdue
      expect(result).toBe('ocean.lesson3');
    });
  });
});