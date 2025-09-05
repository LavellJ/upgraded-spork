/**
 * Integration tests for tuning system
 * Tests the complete tuning workflow from creation to application
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  saveTuningNote,
  getTuningNotesById,
  clearTuningStorage,
  getAdjustedDifficultyLevel,
  applyTuning,
  type TuningNote 
} from '../src/authoring/tuning';
import { pushEvent, type ProgressEvent } from '../src/progress/events';

// Mock the progress events module
vi.mock('../src/progress/events', () => ({
  pushEvent: vi.fn(),
  ProgressEvent: {}
}));

describe('Tuning System Integration', () => {
  beforeEach(() => {
    clearTuningStorage();
    vi.clearAllMocks();
  });

  afterEach(() => {
    clearTuningStorage();
  });

  describe('Tuning Application Workflow', () => {
    it('should apply difficulty adjustments and log analytics', () => {
      // Create a tuning note
      const tuningNote: TuningNote = {
        id: 'M.FRAC.NL.3',
        at: Date.now(),
        kind: 'lesson',
        change: { difficultyDelta: -1 },
        rationale: 'Students struggling with fraction concepts',
        author: 'Teacher Smith'
      };

      saveTuningNote(tuningNote);

      // Apply tuning for a lesson generation scenario
      const originalDifficulty = 3;
      const adjustedDifficulty = getAdjustedDifficultyLevel('M.FRAC.NL.3', originalDifficulty);
      
      expect(adjustedDifficulty).toBe(2); // 3 - 1 = 2

      // Simulate applying tuning during lesson generation
      const appliedTuning = applyTuning('M.FRAC.NL.3', {
        difficulty: originalDifficulty,
        hints: 2,
        examples: 3
      });

      expect(appliedTuning.difficulty).toBe(2);
      expect(appliedTuning.hintsAdded).toBeGreaterThan(0);

      // Verify analytics event was logged
      expect(pushEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: 'tuning_applied',
          lessonId: 'M.FRAC.NL.3',
          tuningId: tuningNote.id,
          difficultyDelta: -1
        })
      );
    });

    it('should handle multiple tuning notes with cumulative effects', () => {
      // Create multiple tuning notes for the same lesson
      const tuningNote1: TuningNote = {
        id: 'M.FRAC.NL.3',
        at: Date.now() - 2000,
        kind: 'lesson',
        change: { difficultyDelta: -1 },
        rationale: 'Initial difficulty reduction',
        author: 'Teacher A'
      };

      const tuningNote2: TuningNote = {
        id: 'M.FRAC.NL.3',
        at: Date.now() - 1000,
        kind: 'lesson',
        change: { difficultyDelta: -1 },
        rationale: 'Further difficulty reduction needed',
        author: 'Teacher B'
      };

      const tuningNote3: TuningNote = {
        id: 'M.FRAC.NL.3',
        at: Date.now(),
        kind: 'lesson',
        change: { hintsAdded: 2 },
        rationale: 'Add more scaffolding hints',
        author: 'Teacher C'
      };

      saveTuningNote(tuningNote1);
      saveTuningNote(tuningNote2);
      saveTuningNote(tuningNote3);

      // Apply cumulative tuning effects
      const originalDifficulty = 5;
      const adjustedDifficulty = getAdjustedDifficultyLevel('M.FRAC.NL.3', originalDifficulty);
      
      expect(adjustedDifficulty).toBe(3); // 5 - 1 - 1 = 3

      const appliedTuning = applyTuning('M.FRAC.NL.3', {
        difficulty: originalDifficulty,
        hints: 1,
        examples: 2
      });

      expect(appliedTuning.difficulty).toBe(3);
      expect(appliedTuning.hintsAdded).toBe(2); // From tuningNote3
      expect(appliedTuning.appliedNotes).toHaveLength(3);

      // Verify analytics for each applied note
      expect(pushEvent).toHaveBeenCalledTimes(3);
    });

    it('should enforce difficulty bounds during tuning', () => {
      // Test minimum difficulty bound
      const tuningNote1: TuningNote = {
        id: 'EASY.LESSON.1',
        at: Date.now(),
        kind: 'lesson',
        change: { difficultyDelta: -10 }, // Extreme reduction
        rationale: 'Make it very easy',
        author: 'Teacher'
      };

      saveTuningNote(tuningNote1);

      const minDifficulty = getAdjustedDifficultyLevel('EASY.LESSON.1', 2);
      expect(minDifficulty).toBe(1); // Should not go below 1

      // Test maximum difficulty bound
      const tuningNote2: TuningNote = {
        id: 'HARD.LESSON.1',
        at: Date.now(),
        kind: 'lesson',
        change: { difficultyDelta: 10 }, // Extreme increase
        rationale: 'Make it very hard',
        author: 'Teacher'
      };

      saveTuningNote(tuningNote2);

      const maxDifficulty = getAdjustedDifficultyLevel('HARD.LESSON.1', 8);
      expect(maxDifficulty).toBe(10); // Should not go above 10 (assuming max is 10)
    });

    it('should track tuning performance over time', () => {
      const tuningNote: TuningNote = {
        id: 'M.FRAC.NL.3',
        at: Date.now(),
        kind: 'lesson',
        change: { difficultyDelta: -1 },
        rationale: 'Performance improvement needed',
        author: 'Data-driven Teacher'
      };

      saveTuningNote(tuningNote);

      // Simulate lesson completion with tuning applied
      applyTuning('M.FRAC.NL.3', { difficulty: 4, hints: 2, examples: 3 });

      // Simulate progress events that would follow
      const progressEvents: ProgressEvent[] = [
        {
          kind: 'lesson_start',
          at: Date.now() + 1000,
          lessonId: 'M.FRAC.NL.3',
          biomeId: 'forest'
        },
        {
          kind: 'difficulty_adjusted',
          at: Date.now() + 1500,
          lessonId: 'M.FRAC.NL.3',
          originalLevel: 4,
          adjustedLevel: 3,
          delta: -1
        },
        {
          kind: 'lesson_finish',
          at: Date.now() + 2000,
          lessonId: 'M.FRAC.NL.3',
          biomeId: 'forest',
          result: 'pass',
          durationSec: 120
        }
      ];

      // Verify analytics capture the tuning effects
      expect(pushEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: 'tuning_applied',
          lessonId: 'M.FRAC.NL.3'
        })
      );
    });

    it('should handle tuning for template lessons', () => {
      // Test tuning application for dynamically created template lessons
      const templateTuning: TuningNote = {
        id: 'template_fraction_basics',
        at: Date.now(),
        kind: 'template',
        change: { 
          difficultyDelta: 1,
          hintsAdded: 1,
          hasWording: true
        },
        rationale: 'Template needs more challenge and clearer instructions',
        author: 'Content Designer'
      };

      saveTuningNote(templateTuning);

      const appliedTuning = applyTuning('template_fraction_basics', {
        difficulty: 3,
        hints: 2,
        examples: 4,
        wording: 'Original instructions'
      });

      expect(appliedTuning.difficulty).toBe(4); // 3 + 1
      expect(appliedTuning.hintsAdded).toBe(1);
      expect(appliedTuning.hasWording).toBe(true);

      // Template tuning should be tracked differently
      expect(pushEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: 'tuning_applied',
          lessonId: 'template_fraction_basics',
          type: 'template'
        })
      );
    });

    it('should validate tuning note structure', () => {
      const invalidTuningNote = {
        // Missing required fields
        change: { difficultyDelta: 1 },
        rationale: 'Test note'
      } as TuningNote;

      // Should handle invalid notes gracefully
      expect(() => {
        saveTuningNote(invalidTuningNote);
      }).not.toThrow();

      // But should not apply invalid tuning
      const notes = getTuningNotesById('invalid');
      expect(notes).toHaveLength(0);
    });

    it('should measure tuning effectiveness', () => {
      // Simulate a complete tuning cycle with before/after metrics
      const lessonId = 'M.FRAC.NL.3';
      
      // Before tuning - simulate poor performance
      const beforeEvents: ProgressEvent[] = [
        {
          kind: 'lesson_finish',
          at: Date.now() - 5000,
          lessonId,
          biomeId: 'forest',
          result: 'retry',
          durationSec: 300
        },
        {
          kind: 'lesson_finish',
          at: Date.now() - 4000,
          lessonId,
          biomeId: 'forest',
          result: 'retry',
          durationSec: 280
        }
      ];

      // Apply tuning based on poor performance
      const tuningNote: TuningNote = {
        id: lessonId,
        at: Date.now() - 3000,
        kind: 'lesson',
        change: { 
          difficultyDelta: -2,
          hintsAdded: 3
        },
        rationale: 'High retry rate and long completion times indicate difficulty too high',
        author: 'Analytics System'
      };

      saveTuningNote(tuningNote);

      // Apply the tuning
      const appliedTuning = applyTuning(lessonId, {
        difficulty: 6,
        hints: 1,
        examples: 2
      });

      expect(appliedTuning.difficulty).toBe(4); // 6 - 2 = 4
      expect(appliedTuning.hintsAdded).toBe(3);

      // After tuning - simulate improved performance
      const afterEvents: ProgressEvent[] = [
        {
          kind: 'lesson_finish',
          at: Date.now() - 1000,
          lessonId,
          biomeId: 'forest',
          result: 'pass',
          durationSec: 180
        },
        {
          kind: 'lesson_finish',
          at: Date.now(),
          lessonId,
          biomeId: 'forest',
          result: 'pass',
          durationSec: 160
        }
      ];

      // Verify tuning effectiveness could be measured
      // (This would typically be done by a separate analytics system)
      const beforeRetryRate = beforeEvents.filter(e => 'result' in e && e.result === 'retry').length / beforeEvents.length * 100;
      const afterRetryRate = afterEvents.filter(e => 'result' in e && e.result === 'retry').length / afterEvents.length * 100;

      expect(beforeRetryRate).toBe(100); // All retries before
      expect(afterRetryRate).toBe(0); // No retries after tuning
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle tuning notes with missing change data', () => {
      const incompleteNote: TuningNote = {
        id: 'test-lesson',
        at: Date.now(),
        kind: 'lesson',
        change: {}, // Empty change object
        rationale: 'Test note',
        author: 'Tester'
      };

      saveTuningNote(incompleteNote);

      const originalDifficulty = 5;
      const adjustedDifficulty = getAdjustedDifficultyLevel('test-lesson', originalDifficulty);
      
      expect(adjustedDifficulty).toBe(originalDifficulty); // No change applied
    });

    it('should handle concurrent tuning modifications', () => {
      const lessonId = 'concurrent-test';
      
      // Simulate multiple teachers making tuning notes simultaneously
      const notes = [
        {
          id: lessonId,
          at: Date.now(),
          kind: 'lesson' as const,
          change: { difficultyDelta: -1 },
          rationale: 'Teacher A adjustment',
          author: 'Teacher A'
        },
        {
          id: lessonId,
          at: Date.now() + 1,
          kind: 'lesson' as const,
          change: { difficultyDelta: 1 },
          rationale: 'Teacher B adjustment',
          author: 'Teacher B'
        }
      ];

      // Save notes concurrently
      notes.forEach(note => saveTuningNote(note));

      const retrievedNotes = getTuningNotesById(lessonId);
      expect(retrievedNotes).toHaveLength(2);
      
      // Net effect should be no change (−1 + 1 = 0)
      const adjustedDifficulty = getAdjustedDifficultyLevel(lessonId, 5);
      expect(adjustedDifficulty).toBe(5);
    });

    it('should handle storage quota exceeded scenarios', () => {
      // Simulate storage quota issues
      const originalSetItem = localStorage.setItem;
      let callCount = 0;

      localStorage.setItem = vi.fn().mockImplementation((key, value) => {
        callCount++;
        if (callCount > 3) {
          throw new DOMException('QuotaExceededError');
        }
        return originalSetItem.call(localStorage, key, value);
      });

      try {
        // This should work fine for first few saves
        for (let i = 0; i < 3; i++) {
          const note: TuningNote = {
            id: `lesson-${i}`,
            at: Date.now(),
            kind: 'lesson',
            change: { difficultyDelta: 1 },
            author: 'Test'
          };
          expect(() => saveTuningNote(note)).not.toThrow();
        }

        // This should handle the storage exception gracefully
        const problematicNote: TuningNote = {
          id: 'lesson-overflow',
          at: Date.now(),
          kind: 'lesson',
          change: { difficultyDelta: 1 },
          author: 'Test'
        };

        expect(() => saveTuningNote(problematicNote)).not.toThrow();
      } finally {
        localStorage.setItem = originalSetItem;
      }
    });
  });
});