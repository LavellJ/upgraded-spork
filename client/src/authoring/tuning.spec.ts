/**
 * Test coverage for content tuning system
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { 
  saveTuningNote,
  getTuningNotesById,
  getAllTuningNotes,
  deleteTuningNote,
  clearTuningStorage,
  createTuningId,
  getTuningStats,
  getAdjustedDifficultyLevel,
  applyTuning,
  type TuningNote 
} from './tuning';

describe('Content Tuning System', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    clearTuningStorage();
  });

  afterEach(() => {
    clearTuningStorage();
  });

  describe('Tuning Storage', () => {
    it('should save and retrieve tuning notes', () => {
      const note: TuningNote = {
        id: 'test-lesson-123',
        at: Date.now(),
        kind: 'lesson',
        change: { difficultyDelta: 1 },
        rationale: 'Too easy for grade 5 students',
        author: 'Teacher Jane'
      };

      saveTuningNote(note);
      const retrieved = getTuningNotesById('test-lesson-123');
      
      expect(retrieved).toHaveLength(1);
      expect(retrieved[0]).toEqual(note);
    });

    it('should handle multiple notes for same ID', () => {
      const note1: TuningNote = {
        id: 'test-lesson-123',
        at: Date.now() - 1000,
        kind: 'lesson',
        change: { difficultyDelta: 1 },
        author: 'Teacher A'
      };

      const note2: TuningNote = {
        id: 'test-lesson-123', 
        at: Date.now(),
        kind: 'lesson',
        change: { difficultyDelta: -1 },
        author: 'Teacher B'
      };

      saveTuningNote(note1);
      saveTuningNote(note2);

      const notes = getTuningNotesById('test-lesson-123');
      expect(notes).toHaveLength(2);
    });

    it('should delete tuning notes', () => {
      const note: TuningNote = {
        id: 'test-lesson-456',
        at: Date.now(),
        kind: 'lesson',
        change: { difficultyDelta: 2 }
      };

      saveTuningNote(note);
      expect(getTuningNotesById('test-lesson-456')).toHaveLength(1);

      deleteTuningNote('test-lesson-456');
      expect(getTuningNotesById('test-lesson-456')).toHaveLength(0);
    });

    it('should return empty array for unknown IDs', () => {
      const notes = getTuningNotesById('unknown-id');
      expect(notes).toHaveLength(0);
    });
  });

  describe('Tuning ID Generation', () => {
    it('should create lesson tuning IDs', () => {
      const id = createTuningId('lesson', 'math-fractions-101');
      expect(id).toBe('lesson:math-fractions-101');
    });

    it('should create journal tuning IDs with timestamp', () => {
      const id = createTuningId('journal', 'skill-addition');
      expect(id).toMatch(/^journal:skill-addition:\d+$/);
    });
  });

  describe('Tuning Statistics', () => {
    beforeEach(() => {
      // Create test notes
      const notes: TuningNote[] = [
        {
          id: 'lesson:math-1',
          at: Date.now() - 86400000, // 1 day ago
          kind: 'lesson',
          change: { difficultyDelta: 1 },
          author: 'Teacher A'
        },
        {
          id: 'lesson:math-2',
          at: Date.now() - 3600000, // 1 hour ago
          kind: 'lesson',
          change: { difficultyDelta: -1 },
          author: 'Teacher B'
        },
        {
          id: 'journal:science-1:123',
          at: Date.now() - 1800000, // 30 min ago
          kind: 'journal',
          change: { hintAdds: ['Try this approach'] },
          author: 'Teacher C'
        }
      ];

      notes.forEach(note => saveTuningNote(note));
    });

    it('should calculate total notes', () => {
      const stats = getTuningStats();
      expect(stats.totalNotes).toBe(3);
    });

    it('should calculate notes by kind', () => {
      const stats = getTuningStats();
      expect(stats.byKind.lesson).toBe(2);
      expect(stats.byKind.journal).toBe(1);
    });

    it('should calculate recent notes', () => {
      const stats = getTuningStats();
      expect(stats.recentNotes).toBe(2); // Within last hour
    });

    it('should group notes by author', () => {
      const stats = getTuningStats();
      expect(stats.byAuthor['Teacher A']).toBe(1);
      expect(stats.byAuthor['Teacher B']).toBe(1);
      expect(stats.byAuthor['Teacher C']).toBe(1);
    });
  });

  describe('Difficulty Adjustment', () => {
    it('should return base difficulty when no tuning notes exist', () => {
      const result = getAdjustedDifficultyLevel('unknown-skill', 'beginner');
      expect(result).toBe('beginner');
    });

    it('should apply positive difficulty delta', () => {
      const note: TuningNote = {
        id: 'journal:addition:123',
        at: Date.now(),
        kind: 'journal',
        change: { difficultyDelta: 2 }
      };
      saveTuningNote(note);

      const result = getAdjustedDifficultyLevel('addition', 'beginner');
      expect(result).toBe('advanced'); // beginner (0) + 2 = advanced (2)
    });

    it('should apply negative difficulty delta', () => {
      const note: TuningNote = {
        id: 'journal:subtraction:456',
        at: Date.now(),
        kind: 'journal',
        change: { difficultyDelta: -1 }
      };
      saveTuningNote(note);

      const result = getAdjustedDifficultyLevel('subtraction', 'intermediate');
      expect(result).toBe('beginner'); // intermediate (1) - 1 = beginner (0)
    });

    it('should cap difficulty at minimum (beginner)', () => {
      const note: TuningNote = {
        id: 'journal:reading:789',
        at: Date.now(),
        kind: 'journal',
        change: { difficultyDelta: -2 }
      };
      saveTuningNote(note);

      const result = getAdjustedDifficultyLevel('reading', 'beginner');
      expect(result).toBe('beginner'); // Can't go below beginner
    });

    it('should cap difficulty at maximum (advanced)', () => {
      const note: TuningNote = {
        id: 'journal:writing:101',
        at: Date.now(),
        kind: 'journal',
        change: { difficultyDelta: 1 }
      };
      saveTuningNote(note);

      const result = getAdjustedDifficultyLevel('writing', 'advanced');
      expect(result).toBe('advanced'); // Can't go above advanced
    });

    it('should use most recent tuning note when multiple exist', () => {
      const oldNote: TuningNote = {
        id: 'journal:multiplication:old',
        at: Date.now() - 86400000, // 1 day ago
        kind: 'journal',
        change: { difficultyDelta: 1 }
      };

      const newNote: TuningNote = {
        id: 'journal:multiplication:new',
        at: Date.now(), // now
        kind: 'journal', 
        change: { difficultyDelta: -1 }
      };

      saveTuningNote(oldNote);
      saveTuningNote(newNote);

      const result = getAdjustedDifficultyLevel('multiplication', 'intermediate');
      expect(result).toBe('beginner'); // Uses new note (-1)
    });
  });

  describe('Apply Tuning', () => {
    it('should log tuning application', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const note: TuningNote = {
        id: 'test-lesson-apply',
        at: Date.now(),
        kind: 'lesson',
        change: { 
          difficultyDelta: 1,
          hintAdds: ['Helpful hint'],
          wording: 'Clearer instructions'
        }
      };

      applyTuning(note);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Applied tuning'),
        expect.stringContaining('test-lesson-apply'),
        note.change
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Storage Edge Cases', () => {
    it('should handle corrupted localStorage gracefully', () => {
      // Simulate corrupted data
      localStorage.setItem('qi.tuning.v1', 'invalid-json');
      
      const notes = getAllTuningNotes();
      expect(notes).toHaveLength(0);
    });

    it('should handle missing localStorage', () => {
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error('Storage unavailable');
      });

      expect(() => {
        const note: TuningNote = {
          id: 'test-storage-error',
          at: Date.now(),
          kind: 'lesson',
          change: { difficultyDelta: 1 }
        };
        saveTuningNote(note);
      }).not.toThrow();

      localStorage.setItem = originalSetItem;
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle full tuning workflow', () => {
      // 1. Create and save tuning note
      const tuningNote: TuningNote = {
        id: createTuningId('journal', 'fractions'),
        at: Date.now(),
        kind: 'journal',
        change: {
          difficultyDelta: 1,
          hintAdds: ['Remember to find common denominator', 'Draw visual models'],
          wording: 'Compare these fractions by size'
        },
        rationale: 'Students struggling with fraction comparison',
        author: 'Ms. Smith'
      };

      saveTuningNote(tuningNote);

      // 2. Apply tuning
      applyTuning(tuningNote);

      // 3. Check difficulty adjustment
      const adjustedLevel = getAdjustedDifficultyLevel('fractions', 'beginner');
      expect(adjustedLevel).toBe('intermediate');

      // 4. Verify statistics
      const stats = getTuningStats();
      expect(stats.totalNotes).toBe(1);
      expect(stats.byKind.journal).toBe(1);
      expect(stats.byAuthor['Ms. Smith']).toBe(1);

      // 5. Clean up
      deleteTuningNote(tuningNote.id);
      expect(getTuningNotesById('fractions')).toHaveLength(0);
    });
  });
});