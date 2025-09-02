import { describe, it, expect } from 'vitest';
import { overallCompletion, biomeCompletion, dayStreak } from '../src/progress/metrics';
import type { ProgressEvent } from '../src/progress/events';
import type { Lesson } from '../src/lessons/types';

describe('metrics calculations', () => {
  describe('overallCompletion', () => {
    it('calculates completion percentage correctly', () => {
      const lessons: Lesson[] = [
        { id: 'forest.counting.1', biomeId: 'forest', title: 'Counting 1', description: '', framework: { acara: '', nzc: '', generic: '' } },
        { id: 'forest.counting.2', biomeId: 'forest', title: 'Counting 2', description: '', framework: { acara: '', nzc: '', generic: '' } },
        { id: 'desert.shapes.1', biomeId: 'desert', title: 'Shapes 1', description: '', framework: { acara: '', nzc: '', generic: '' } }
      ];

      const events: ProgressEvent[] = [
        {
          kind: 'lesson_finish',
          at: Date.now(),
          lessonId: 'forest.counting.1',
          biomeId: 'forest',
          result: 'pass',
          durationSec: 120
        },
        {
          kind: 'lesson_finish', 
          at: Date.now(),
          lessonId: 'forest.counting.2',
          biomeId: 'forest',
          result: 'pass',
          durationSec: 90
        },
        {
          kind: 'lesson_finish',
          at: Date.now(), 
          lessonId: 'desert.shapes.1',
          biomeId: 'desert',
          result: 'retry',
          durationSec: 60
        }
      ];

      const completion = overallCompletion(lessons, events);
      
      // Should count all lessons with finish events
      expect(completion.completed).toBe(3);
      expect(completion.total).toBe(3);
      expect(completion.pct).toBe(100);
    });

    it('handles empty events array', () => {
      const lessons: Lesson[] = [
        { id: 'forest.counting.1', biomeId: 'forest', title: 'Counting 1', description: '', framework: { acara: '', nzc: '', generic: '' } }
      ];
      
      const completion = overallCompletion(lessons, []);
      
      expect(completion.completed).toBe(0);
      expect(completion.total).toBe(1);
      expect(completion.pct).toBe(0);
    });

    it('handles empty lessons array', () => {
      const events: ProgressEvent[] = [
        {
          kind: 'lesson_finish',
          at: Date.now(),
          lessonId: 'forest.counting.1',
          biomeId: 'forest',
          result: 'pass',
          durationSec: 120
        }
      ];

      const completion = overallCompletion([], events);
      
      expect(completion.completed).toBe(0);
      expect(completion.total).toBe(0);
      expect(completion.pct).toBe(0);
    });

    it('ignores non-lesson events', () => {
      const lessons: Lesson[] = [
        { id: 'forest.counting.1', biomeId: 'forest', title: 'Counting 1', description: '', framework: { acara: '', nzc: '', generic: '' } }
      ];

      const events: ProgressEvent[] = [
        {
          kind: 'journal_finish',
          at: Date.now(),
          skillId: 'math.addition',
          n: 3,
          correct: 2,
          durationSec: 180
        },
        {
          kind: 'lesson_finish',
          at: Date.now(),
          lessonId: 'forest.counting.1',
          biomeId: 'forest',
          result: 'pass', 
          durationSec: 120
        }
      ];

      const completion = overallCompletion(lessons, events);
      
      expect(completion.completed).toBe(1);
      expect(completion.total).toBe(1);
      expect(completion.pct).toBe(100);
    });
  });

  describe('biomeCompletion', () => {
    it('calculates completion by biome correctly', () => {
      const lessons: Lesson[] = [
        { id: 'forest.counting.1', biomeId: 'forest', title: 'Counting 1', description: '', framework: { acara: '', nzc: '', generic: '' } },
        { id: 'forest.counting.2', biomeId: 'forest', title: 'Counting 2', description: '', framework: { acara: '', nzc: '', generic: '' } },
        { id: 'desert.shapes.1', biomeId: 'desert', title: 'Shapes 1', description: '', framework: { acara: '', nzc: '', generic: '' } },
        { id: 'ocean.patterns.1', biomeId: 'ocean', title: 'Patterns 1', description: '', framework: { acara: '', nzc: '', generic: '' } }
      ];

      const events: ProgressEvent[] = [
        {
          kind: 'lesson_finish',
          at: Date.now(),
          lessonId: 'forest.counting.1',
          biomeId: 'forest',
          result: 'pass',
          durationSec: 120
        },
        {
          kind: 'lesson_finish',
          at: Date.now(), 
          lessonId: 'forest.counting.2',
          biomeId: 'forest',
          result: 'pass',
          durationSec: 90
        },
        {
          kind: 'lesson_finish',
          at: Date.now(),
          lessonId: 'desert.shapes.1',
          biomeId: 'desert',
          result: 'pass',
          durationSec: 60
        }
      ];

      const forestCompletion = biomeCompletion('forest', lessons, events);
      const desertCompletion = biomeCompletion('desert', lessons, events);
      const oceanCompletion = biomeCompletion('ocean', lessons, events);
      
      expect(forestCompletion.completed).toBe(2);
      expect(forestCompletion.total).toBe(2);
      expect(forestCompletion.pct).toBe(100);
      
      expect(desertCompletion.completed).toBe(1);
      expect(desertCompletion.total).toBe(1);
      expect(desertCompletion.pct).toBe(100);
      
      expect(oceanCompletion.completed).toBe(0);
      expect(oceanCompletion.total).toBe(1);
      expect(oceanCompletion.pct).toBe(0);
    });

    it('handles biome with no lessons', () => {
      const lessons: Lesson[] = [
        { id: 'forest.counting.1', biomeId: 'forest', title: 'Counting 1', description: '', framework: { acara: '', nzc: '', generic: '' } }
      ];

      const events: ProgressEvent[] = [
        {
          kind: 'lesson_finish',
          at: Date.now(),
          lessonId: 'forest.counting.1',
          biomeId: 'forest',
          result: 'pass',
          durationSec: 120
        }
      ];

      const nightCompletion = biomeCompletion('night', lessons, events);
      
      expect(nightCompletion.completed).toBe(0);
      expect(nightCompletion.total).toBe(0);
      expect(nightCompletion.pct).toBe(0);
    });
  });

  describe('dayStreak', () => {
    const DAY_MS = 24 * 60 * 60 * 1000;
    
    it('calculates consecutive day streak correctly', () => {
      const now = Date.now();
      const events: ProgressEvent[] = [
        // Today
        {
          kind: 'lesson_finish',
          at: now,
          lessonId: 'forest.counting.1',
          biomeId: 'forest',
          result: 'pass',
          durationSec: 120
        },
        // Yesterday  
        {
          kind: 'lesson_finish',
          at: now - DAY_MS,
          lessonId: 'forest.counting.2',
          biomeId: 'forest',
          result: 'pass',
          durationSec: 90
        },
        // Day before yesterday
        {
          kind: 'lesson_finish', 
          at: now - (2 * DAY_MS),
          lessonId: 'desert.shapes.1',
          biomeId: 'desert',
          result: 'pass',
          durationSec: 60
        }
      ];

      const streak = dayStreak(events);
      expect(streak).toBe(3);
    });

    it('handles gaps in activity correctly', () => {
      const now = Date.now();
      const events: ProgressEvent[] = [
        // Today
        {
          kind: 'lesson_finish',
          at: now,
          lessonId: 'forest.counting.1',
          biomeId: 'forest',
          result: 'pass',
          durationSec: 120
        },
        // Yesterday
        {
          kind: 'lesson_finish',
          at: now - DAY_MS,
          lessonId: 'forest.counting.2',
          biomeId: 'forest',
          result: 'pass',
          durationSec: 90
        },
        // 3 days ago (gap of 1 day)
        {
          kind: 'lesson_finish',
          at: now - (3 * DAY_MS),
          lessonId: 'desert.shapes.1',
          biomeId: 'desert',
          result: 'pass',
          durationSec: 60
        }
      ];

      const streak = dayStreak(events);
      // Should stop at the gap, so streak is 2 (today and yesterday)
      expect(streak).toBe(2);
    });

    it('returns 0 for empty events', () => {
      const streak = dayStreak([]);
      expect(streak).toBe(0);
    });

    it('handles single day activity', () => {
      const events: ProgressEvent[] = [
        {
          kind: 'lesson_finish',
          at: Date.now(),
          lessonId: 'forest.counting.1',
          biomeId: 'forest',
          result: 'pass',
          durationSec: 120
        }
      ];

      const streak = dayStreak(events);
      expect(streak).toBe(1);
    });

    it('counts multiple lessons on same day as one day', () => {
      const now = Date.now();
      const events: ProgressEvent[] = [
        // Today - multiple lessons
        {
          kind: 'lesson_finish',
          at: now,
          lessonId: 'forest.counting.1',
          biomeId: 'forest',
          result: 'pass',
          durationSec: 120
        },
        {
          kind: 'lesson_finish',
          at: now - 1000 * 60 * 30, // 30 minutes ago
          lessonId: 'forest.counting.2',
          biomeId: 'forest',
          result: 'pass',
          durationSec: 90
        },
        // Yesterday
        {
          kind: 'lesson_finish',
          at: now - DAY_MS,
          lessonId: 'desert.shapes.1',
          biomeId: 'desert',
          result: 'pass',
          durationSec: 60
        }
      ];

      const streak = dayStreak(events);
      expect(streak).toBe(2); // Today and yesterday
    });

    it('includes journal sessions in streak calculation', () => {
      const now = Date.now();
      const events: ProgressEvent[] = [
        // Today - journal session
        {
          kind: 'journal_finish',
          at: now,
          skillId: 'math.addition',
          n: 3,
          correct: 2,
          durationSec: 180
        },
        // Yesterday - lesson
        {
          kind: 'lesson_finish',
          at: now - DAY_MS,
          lessonId: 'forest.counting.1',
          biomeId: 'forest',
          result: 'pass',
          durationSec: 120
        }
      ];

      const streak = dayStreak(events);
      expect(streak).toBe(2);
    });
  });
});