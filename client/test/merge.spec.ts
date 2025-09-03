/**
 * Comprehensive tests for merge policies
 * Tests conflict-safe merge rules for multi-device sync
 */

import { describe, it, expect } from 'vitest';
import {
  mergeData,
  mergeEvents,
  mergeLearnerModel,
  mergeJournalHistory,
  mergeReflections,
  mergeAssignments,
  mergeSyncPayloads
} from '../src/sync/merge';
import type { ProgressEvent } from '../src/progress/events';
import type { LearnerState } from '../src/learning/model';
import type { JournalHistoryEntry } from '../src/schema/journal';
import type { Reflection } from '../src/reflections/model';
import type { AssignedPath } from '../src/guide/assign';

describe('Merge Policies', () => {
  describe('mergeEvents', () => {
    it('should merge events using set union by unique key', () => {
      const local: ProgressEvent[] = [
        { kind: 'lesson_start', at: 1000, lessonId: 'lesson1', biomeId: 'biome1' },
        { kind: 'journal_finish', at: 2000, skillId: 'skill1', n: 5, correct: 4 }
      ];

      const remote: ProgressEvent[] = [
        { kind: 'lesson_finish', at: 1500, lessonId: 'lesson1', biomeId: 'biome1', result: 'pass' },
        { kind: 'journal_finish', at: 2000, skillId: 'skill1', n: 5, correct: 4 } // Duplicate
      ];

      const merged = mergeEvents(local, remote);

      expect(merged).toHaveLength(3); // 2 unique + 1 from remote (duplicate ignored)
      expect(merged).toEqual([
        { kind: 'lesson_start', at: 1000, lessonId: 'lesson1', biomeId: 'biome1' },
        { kind: 'lesson_finish', at: 1500, lessonId: 'lesson1', biomeId: 'biome1', result: 'pass' },
        { kind: 'journal_finish', at: 2000, skillId: 'skill1', n: 5, correct: 4 }
      ]);
    });

    it('should handle scout events with different ID fields', () => {
      const local: ProgressEvent[] = [
        { kind: 'scout_msg', at: 1000, messageId: 'msg1', priority: 'info', text: 'Test message' }
      ];

      const remote: ProgressEvent[] = [
        { kind: 'scout_analytics', at: 1100, id: 'analytics1', priority: 'info', action: 'shown', sessionId: 'session1' }
      ];

      const merged = mergeEvents(local, remote);

      expect(merged).toHaveLength(2);
      expect(merged.find(e => e.kind === 'scout_msg')).toBeDefined();
      expect(merged.find(e => e.kind === 'scout_analytics')).toBeDefined();
    });

    it('should sort events by timestamp', () => {
      const local: ProgressEvent[] = [
        { kind: 'lesson_start', at: 3000, lessonId: 'lesson3', biomeId: 'biome1' }
      ];

      const remote: ProgressEvent[] = [
        { kind: 'lesson_start', at: 1000, lessonId: 'lesson1', biomeId: 'biome1' },
        { kind: 'lesson_start', at: 2000, lessonId: 'lesson2', biomeId: 'biome1' }
      ];

      const merged = mergeEvents(local, remote);

      expect(merged).toHaveLength(3);
      expect(merged[0].at).toBe(1000);
      expect(merged[1].at).toBe(2000);
      expect(merged[2].at).toBe(3000);
    });
  });

  describe('mergeLearnerModel', () => {
    it('should merge skills using lastAt for probability and sum for counters', () => {
      const local: LearnerState = {
        version: 1,
        skills: {
          'skill1': { p: 0.7, seen: 10, correct: 7, streak: 3, lastAt: 2000 },
          'skill2': { p: 0.5, seen: 5, correct: 2, streak: 0, lastAt: 1000 }
        }
      };

      const remote: LearnerState = {
        version: 1,
        skills: {
          'skill1': { p: 0.6, seen: 8, correct: 5, streak: 2, lastAt: 1500 }, // Older lastAt
          'skill3': { p: 0.8, seen: 12, correct: 10, streak: 5, lastAt: 2500 }
        }
      };

      const merged = mergeLearnerModel(local, remote);

      expect(merged.skills['skill1']).toEqual({
        p: 0.7, // Local wins (newer lastAt: 2000 > 1500)
        seen: 18, // Sum: 10 + 8
        correct: 12, // Sum: 7 + 5
        streak: 3, // Max: max(3, 2)
        lastAt: 2000 // Max: max(2000, 1500)
      });

      expect(merged.skills['skill2']).toEqual(local.skills['skill2']);
      expect(merged.skills['skill3']).toEqual(remote.skills['skill3']);
    });

    it('should handle empty or undefined states', () => {
      const local: LearnerState = {
        version: 1,
        skills: { 'skill1': { p: 0.5, seen: 1, correct: 1, streak: 1, lastAt: 1000 } }
      };

      const merged1 = mergeLearnerModel(local, undefined);
      expect(merged1).toEqual(local);

      const merged2 = mergeLearnerModel(undefined, local);
      expect(merged2).toEqual(local);

      const merged3 = mergeLearnerModel(undefined, undefined);
      expect(merged3).toEqual({ version: 1, skills: {} });
    });

    it('should handle skills without lastAt', () => {
      const local: LearnerState = {
        version: 1,
        skills: {
          'skill1': { p: 0.7, seen: 10, correct: 7, streak: 3 } // No lastAt
        }
      };

      const remote: LearnerState = {
        version: 1,
        skills: {
          'skill1': { p: 0.6, seen: 8, correct: 5, streak: 2, lastAt: 1500 }
        }
      };

      const merged = mergeLearnerModel(local, remote);

      expect(merged.skills['skill1'].p).toBe(0.6); // Remote wins (has lastAt)
      expect(merged.skills['skill1'].lastAt).toBe(1500);
    });
  });

  describe('mergeJournalHistory', () => {
    it('should merge by session ID and keep entry with more responses', () => {
      const local: JournalHistoryEntry[] = [
        {
          date: '2024-01-01',
          skillId: 'skill1',
          itemCount: 5,
          correctCount: 4,
          duration: 300,
          masteryBefore: 0.5,
          masteryAfter: 0.7,
          sessionId: 'session1',
          targetLevel: 'core',
          items: [],
          responses: [
            { itemId: 'item1', userAnswer: 'A', isCorrect: true, timeSpent: 30 },
            { itemId: 'item2', userAnswer: 'B', isCorrect: true, timeSpent: 25 }
          ]
        }
      ];

      const remote: JournalHistoryEntry[] = [
        {
          date: '2024-01-01',
          skillId: 'skill1',
          itemCount: 5,
          correctCount: 4,
          duration: 300,
          masteryBefore: 0.5,
          masteryAfter: 0.7,
          sessionId: 'session1', // Same session ID
          targetLevel: 'core',
          items: [],
          responses: [
            { itemId: 'item1', userAnswer: 'A', isCorrect: true, timeSpent: 30 },
            { itemId: 'item2', userAnswer: 'B', isCorrect: true, timeSpent: 25 },
            { itemId: 'item3', userAnswer: 'C', isCorrect: false, timeSpent: 40 }
          ] // More responses
        },
        {
          date: '2024-01-02',
          skillId: 'skill2',
          itemCount: 3,
          correctCount: 2,
          duration: 180,
          masteryBefore: 0.3,
          masteryAfter: 0.5,
          sessionId: 'session2',
          targetLevel: 'easy',
          items: [],
          responses: []
        }
      ];

      const merged = mergeJournalHistory(local, remote);

      expect(merged).toHaveLength(2);
      
      // Should keep remote entry for session1 (has more responses)
      const session1Entry = merged.find(e => e.sessionId === 'session1');
      expect(session1Entry?.responses).toHaveLength(3);
      
      const session2Entry = merged.find(e => e.sessionId === 'session2');
      expect(session2Entry?.skillId).toBe('skill2');
    });

    it('should sort by date descending', () => {
      const local: JournalHistoryEntry[] = [
        {
          date: '2024-01-03',
          skillId: 'skill3',
          itemCount: 1,
          correctCount: 1,
          duration: 60,
          masteryBefore: 0.5,
          masteryAfter: 0.6,
          sessionId: 'session3',
          targetLevel: 'core',
          items: [],
          responses: []
        }
      ];

      const remote: JournalHistoryEntry[] = [
        {
          date: '2024-01-01',
          skillId: 'skill1',
          itemCount: 1,
          correctCount: 1,
          duration: 60,
          masteryBefore: 0.5,
          masteryAfter: 0.6,
          sessionId: 'session1',
          targetLevel: 'core',
          items: [],
          responses: []
        }
      ];

      const merged = mergeJournalHistory(local, remote);

      expect(merged[0].date).toBe('2024-01-03'); // Most recent first
      expect(merged[1].date).toBe('2024-01-01');
    });
  });

  describe('mergeReflections', () => {
    it('should merge using compound key and prevent exact duplicates', () => {
      const local: Reflection[] = [
        { at: 1000, refType: 'lesson', refId: 'lesson1', note: 'Local reflection' },
        { at: 2000, refType: 'journal', refId: 'skill1', note: 'Journal note' }
      ];

      const remote: Reflection[] = [
        { at: 1000, refType: 'lesson', refId: 'lesson1', note: 'Same reflection' }, // Exact duplicate key
        { at: 1500, refType: 'lesson', refId: 'lesson2', note: 'Different lesson' },
        { at: 2500, refType: 'journal', refId: 'skill2', note: 'New skill reflection' }
      ];

      const merged = mergeReflections(local, remote);

      expect(merged).toHaveLength(4); // No exact duplicates
      
      // Should keep first reflection for lesson1 at timestamp 1000
      const lesson1Reflection = merged.find(r => 
        r.refType === 'lesson' && r.refId === 'lesson1' && r.at === 1000
      );
      expect(lesson1Reflection?.note).toBe('Local reflection'); // Local was first
    });

    it('should sort by timestamp descending', () => {
      const local: Reflection[] = [
        { at: 1000, refType: 'lesson', refId: 'lesson1', note: 'Old' }
      ];

      const remote: Reflection[] = [
        { at: 3000, refType: 'lesson', refId: 'lesson2', note: 'New' },
        { at: 2000, refType: 'lesson', refId: 'lesson3', note: 'Medium' }
      ];

      const merged = mergeReflections(local, remote);

      expect(merged[0].at).toBe(3000);
      expect(merged[1].at).toBe(2000);
      expect(merged[2].at).toBe(1000);
    });
  });

  describe('mergeAssignments', () => {
    it('should merge lesson completion by taking union of lessonIds', () => {
      const local: AssignedPath[] = [
        {
          id: 'path1',
          name: 'Math Basics',
          lessonIds: ['lesson1', 'lesson2'],
          createdAt: 1000,
          expiresAt: 5000
        }
      ];

      const remote: AssignedPath[] = [
        {
          id: 'path1', // Same assignment
          name: 'Math Basics',
          lessonIds: ['lesson2', 'lesson3', 'lesson4'], // Partial overlap
          createdAt: 1200, // Newer
          expiresAt: 6000 // Later expiry
        },
        {
          id: 'path2',
          name: 'Reading Skills',
          lessonIds: ['reading1'],
          createdAt: 2000
        }
      ];

      const merged = mergeAssignments(local, remote);

      expect(merged).toHaveLength(2);

      const path1 = merged.find(p => p.id === 'path1');
      expect(path1?.lessonIds).toEqual(['lesson1', 'lesson2', 'lesson3', 'lesson4']);
      expect(path1?.createdAt).toBe(1200); // Newer createdAt
      expect(path1?.expiresAt).toBe(6000); // Later expiry

      const path2 = merged.find(p => p.id === 'path2');
      expect(path2?.lessonIds).toEqual(['reading1']);
    });

    it('should handle assignments with no expiry dates', () => {
      const local: AssignedPath[] = [
        {
          id: 'path1',
          name: 'Math',
          lessonIds: ['lesson1'],
          createdAt: 1000
          // No expiresAt
        }
      ];

      const remote: AssignedPath[] = [
        {
          id: 'path1',
          name: 'Math',
          lessonIds: ['lesson2'],
          createdAt: 2000,
          expiresAt: 5000
        }
      ];

      const merged = mergeAssignments(local, remote);

      const path1 = merged.find(p => p.id === 'path1');
      expect(path1?.expiresAt).toBe(5000); // Takes the one that exists
      expect(path1?.lessonIds).toEqual(['lesson1', 'lesson2']);
    });

    it('should sort by creation date descending', () => {
      const local: AssignedPath[] = [
        {
          id: 'path1',
          name: 'Old Path',
          lessonIds: ['lesson1'],
          createdAt: 1000
        }
      ];

      const remote: AssignedPath[] = [
        {
          id: 'path2',
          name: 'New Path',
          lessonIds: ['lesson2'],
          createdAt: 3000
        }
      ];

      const merged = mergeAssignments(local, remote);

      expect(merged[0].createdAt).toBe(3000); // Most recent first
      expect(merged[1].createdAt).toBe(1000);
    });
  });

  describe('mergeSyncPayloads', () => {
    it('should convert sync payloads and merge by kind', () => {
      const localEvents = [
        { kind: 'lesson_start', at: 1000, lessonId: 'lesson1', biomeId: 'biome1' }
      ];

      const remoteEvents = [
        { kind: 'lesson_finish', at: 1500, lessonId: 'lesson1', biomeId: 'biome1', result: 'pass' }
      ];

      const merged = mergeSyncPayloads(localEvents, remoteEvents, 'event');

      expect(merged).toHaveLength(2);
      expect(merged.find(e => e.kind === 'lesson_start')).toBeDefined();
      expect(merged.find(e => e.kind === 'lesson_finish')).toBeDefined();
    });

    it('should handle learner model merge (single object)', () => {
      const localLearner = [
        { version: 1, skills: { skill1: { p: 0.7, seen: 10, correct: 7, streak: 3, lastAt: 2000 } } }
      ];

      const remoteLearner = [
        { version: 1, skills: { skill1: { p: 0.6, seen: 8, correct: 5, streak: 2, lastAt: 1500 } } }
      ];

      const merged = mergeSyncPayloads(localLearner, remoteLearner, 'learner');

      expect(merged).toHaveLength(1);
      expect(merged[0].skills.skill1.p).toBe(0.7); // Local wins (newer lastAt)
      expect(merged[0].skills.skill1.seen).toBe(18); // Sum
    });

    it('should handle unknown kinds gracefully', () => {
      const merged = mergeSyncPayloads(['test'], ['test2'], 'unknown');
      expect(merged).toEqual([]);
    });
  });

  describe('mergeData - Integration', () => {
    it('should merge all data types in a single call', () => {
      const local = {
        events: [
          { kind: 'lesson_start', at: 1000, lessonId: 'lesson1', biomeId: 'biome1' }
        ] as ProgressEvent[],
        learnerModel: {
          version: 1,
          skills: { skill1: { p: 0.7, seen: 10, correct: 7, streak: 3, lastAt: 2000 } }
        } as LearnerState,
        reflections: [
          { at: 1000, refType: 'lesson', refId: 'lesson1', note: 'Great lesson' }
        ] as Reflection[]
      };

      const remote = {
        events: [
          { kind: 'lesson_finish', at: 1500, lessonId: 'lesson1', biomeId: 'biome1', result: 'pass' }
        ] as ProgressEvent[],
        learnerModel: {
          version: 1,
          skills: { skill1: { p: 0.6, seen: 8, correct: 5, streak: 2, lastAt: 1500 } }
        } as LearnerState,
        reflections: [
          { at: 2000, refType: 'lesson', refId: 'lesson2', note: 'Another reflection' }
        ] as Reflection[]
      };

      const merged = mergeData(local, remote);

      expect(merged.events).toHaveLength(2);
      expect(merged.learnerModel?.skills.skill1.p).toBe(0.7); // Local wins
      expect(merged.learnerModel?.skills.skill1.seen).toBe(18); // Sum
      expect(merged.reflections).toHaveLength(2);
    });

    it('should handle partial data sets', () => {
      const local = {
        events: [
          { kind: 'lesson_start', at: 1000, lessonId: 'lesson1', biomeId: 'biome1' }
        ] as ProgressEvent[]
      };

      const remote = {
        learnerModel: {
          version: 1,
          skills: { skill1: { p: 0.6, seen: 8, correct: 5, streak: 2, lastAt: 1500 } }
        } as LearnerState
      };

      const merged = mergeData(local, remote);

      expect(merged.events).toHaveLength(1);
      expect(merged.learnerModel?.skills.skill1.p).toBe(0.6);
      expect(merged.reflections).toBeUndefined();
    });
  });
});