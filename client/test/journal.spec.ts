/**
 * Tests for journal generator and session management
 * Validates item generation, schema validation, and session flow
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  getGenerator, 
  getLevelFromMastery, 
  inferSkillIdFromLesson,
  type JournalGenerator 
} from '../src/journal/generator';
import { 
  journalItem, 
  journalSession, 
  journalHistoryEntry,
  type JournalItem 
} from '../src/schema/journal';

describe('Journal Generator', () => {
  let generator: JournalGenerator;

  beforeEach(() => {
    generator = getGenerator();
  });

  describe('getGenerator', () => {
    it('should return a valid generator instance', () => {
      expect(generator).toBeDefined();
      expect(typeof generator.generate).toBe('function');
      expect(typeof generator.getAvailableSkills).toBe('function');
    });

    it('should return singleton instance', () => {
      const generator1 = getGenerator();
      const generator2 = getGenerator();
      expect(generator1).toBe(generator2);
    });
  });

  describe('generator.getAvailableSkills', () => {
    it('should return array of skill IDs', () => {
      const skills = generator.getAvailableSkills();
      expect(Array.isArray(skills)).toBe(true);
      expect(skills.length).toBeGreaterThan(0);
    });

    it('should include expected skill categories', () => {
      const skills = generator.getAvailableSkills();
      
      // Should include literacy, math, and science skills
      const hasLiteracy = skills.some(s => s.includes('literacy'));
      const hasMath = skills.some(s => s.includes('math'));
      const hasScience = skills.some(s => s.includes('science'));
      
      expect(hasLiteracy).toBe(true);
      expect(hasMath).toBe(true);
      expect(hasScience).toBe(true);
    });
  });

  describe('generator.generate', () => {
    it('should generate requested number of items', async () => {
      const skillId = 'literacy.phonics';
      const level = 'easy';
      const count = 3;
      
      const items = await generator.generate(skillId, level, count);
      
      expect(items).toHaveLength(count);
    });

    it('should generate items with valid structure', async () => {
      const items = await generator.generate('literacy.phonics', 'easy', 2);
      
      items.forEach(item => {
        expect(item.id).toBeDefined();
        expect(item.skillId).toBe('literacy.phonics');
        expect(item.prompt).toBeDefined();
        expect(['short', 'mcq']).toContain(item.kind);
        
        if (item.kind === 'mcq') {
          expect(Array.isArray(item.options)).toBe(true);
          expect(item.options!.length).toBeGreaterThanOrEqual(2);
        }
        
        expect(item.answer).toBeDefined();
      });
    });

    it('should handle different skill levels', async () => {
      const skillId = 'math.addition';
      
      const easyItems = await generator.generate(skillId, 'easy', 1);
      const coreItems = await generator.generate(skillId, 'core', 1);
      const stretchItems = await generator.generate(skillId, 'stretch', 1);
      
      expect(easyItems).toHaveLength(1);
      expect(coreItems).toHaveLength(1);
      expect(stretchItems).toHaveLength(1);
      
      // All should be for the same skill
      expect(easyItems[0].skillId).toBe(skillId);
      expect(coreItems[0].skillId).toBe(skillId);
      expect(stretchItems[0].skillId).toBe(skillId);
    });

    it('should handle unknown skills gracefully', async () => {
      const items = await generator.generate('unknown.skill', 'easy', 2);
      
      expect(items).toHaveLength(2);
      items.forEach(item => {
        expect(item.skillId).toBe('unknown.skill');
        expect(item.prompt).toBeDefined();
      });
    });

    it('should generate unique item IDs', async () => {
      const items = await generator.generate('literacy.phonics', 'core', 5);
      
      const ids = items.map(item => item.id);
      const uniqueIds = new Set(ids);
      
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should repeat items when requesting more than available', async () => {
      // Request more items than likely available in banks
      const items = await generator.generate('literacy.phonics', 'easy', 10);
      
      expect(items).toHaveLength(10);
      // All should be valid items for the skill
      items.forEach(item => {
        expect(item.skillId).toBe('literacy.phonics');
        expect(item.prompt).toBeDefined();
      });
    });
  });

  describe('schema validation', () => {
    it('should validate journal item schema', async () => {
      const items = await generator.generate('math.addition', 'core', 1);
      const item = items[0];
      
      const result = journalItem.safeParse(item);
      expect(result.success).toBe(true);
    });

    it('should validate journal session schema', () => {
      const session = {
        id: 'test-session-123',
        skillId: 'literacy.phonics',
        targetLevel: 'core' as const,
        items: [],
        startedAt: Date.now()
      };
      
      const result = journalSession.safeParse(session);
      expect(result.success).toBe(true);
    });

    it('should validate journal history entry schema', () => {
      const entry = {
        date: new Date().toISOString(),
        skillId: 'math.addition',
        itemCount: 4,
        correctCount: 3,
        duration: 120000,
        masteryBefore: 0.6,
        masteryAfter: 0.7
      };
      
      const result = journalHistoryEntry.safeParse(entry);
      expect(result.success).toBe(true);
    });

    it('should reject invalid journal items', () => {
      const invalidItem = {
        id: '',  // Invalid: empty ID
        skillId: 'test.skill',
        prompt: 'Test prompt',
        kind: 'invalid-kind', // Invalid: not 'short' or 'mcq'
        answer: 'test'
      };
      
      const result = journalItem.safeParse(invalidItem);
      expect(result.success).toBe(false);
    });
  });

  describe('utility functions', () => {
    describe('getLevelFromMastery', () => {
      it('should return easy for low mastery', () => {
        expect(getLevelFromMastery(0.2)).toBe('easy');
        expect(getLevelFromMastery(0.39)).toBe('easy');
      });

      it('should return core for medium mastery', () => {
        expect(getLevelFromMastery(0.4)).toBe('core');
        expect(getLevelFromMastery(0.6)).toBe('core');
        expect(getLevelFromMastery(0.74)).toBe('core');
      });

      it('should return stretch for high mastery', () => {
        expect(getLevelFromMastery(0.75)).toBe('stretch');
        expect(getLevelFromMastery(0.9)).toBe('stretch');
        expect(getLevelFromMastery(1.0)).toBe('stretch');
      });

      it('should handle edge cases', () => {
        expect(getLevelFromMastery(0)).toBe('easy');
        expect(getLevelFromMastery(0.4)).toBe('core');
        expect(getLevelFromMastery(0.75)).toBe('stretch');
      });
    });

    describe('inferSkillIdFromLesson', () => {
      it('should map forest lessons to literacy skills', () => {
        expect(inferSkillIdFromLesson('f1', 'forest')).toContain('literacy');
        expect(inferSkillIdFromLesson('f3', 'forest')).toContain('literacy');
      });

      it('should map desert lessons to math skills', () => {
        expect(inferSkillIdFromLesson('d1', 'desert')).toContain('math');
        expect(inferSkillIdFromLesson('d2', 'desert')).toContain('math');
      });

      it('should map ocean lessons to science skills', () => {
        expect(inferSkillIdFromLesson('o1', 'ocean')).toContain('science');
        expect(inferSkillIdFromLesson('o2', 'ocean')).toContain('science');
      });

      it('should handle unknown lessons', () => {
        const result = inferSkillIdFromLesson('unknown', 'unknown');
        expect(result).toBeDefined();
        expect(typeof result).toBe('string');
      });

      it('should be consistent for same inputs', () => {
        const result1 = inferSkillIdFromLesson('f1', 'forest');
        const result2 = inferSkillIdFromLesson('f1', 'forest');
        expect(result1).toBe(result2);
      });
    });
  });

  describe('integration scenarios', () => {
    it('should support full journal session workflow', async () => {
      // Generate items for a session
      const skillId = 'literacy.phonics';
      const level = getLevelFromMastery(0.3); // Should be 'easy'
      const items = await generator.generate(skillId, level, 4);
      
      // Create session
      const session = {
        id: 'test-session',
        skillId,
        targetLevel: level,
        items,
        startedAt: Date.now()
      };
      
      // Validate session
      const sessionResult = journalSession.safeParse(session);
      expect(sessionResult.success).toBe(true);
      
      // Simulate completing session
      const responses = items.map((item, index) => ({
        itemId: item.id,
        userAnswer: index % 2 === 0 ? item.answer! : 'wrong answer',
        isCorrect: index % 2 === 0,
        timeSpent: 5000 + Math.random() * 10000
      }));
      
      const correctCount = responses.filter(r => r.isCorrect).length;
      
      // Create history entry
      const historyEntry = {
        date: new Date().toISOString(),
        skillId,
        itemCount: items.length,
        correctCount,
        duration: responses.reduce((sum, r) => sum + r.timeSpent, 0),
        masteryBefore: 0.3,
        masteryAfter: 0.35
      };
      
      const historyResult = journalHistoryEntry.safeParse(historyEntry);
      expect(historyResult.success).toBe(true);
    });
  });
});