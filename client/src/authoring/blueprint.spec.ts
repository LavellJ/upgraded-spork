/**
 * Tests for the Lesson Blueprint system
 * Validates template generation, schema compliance, and edge cases
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { makeLessonFromBlueprint, type LessonBlueprintInput } from './LessonBlueprint';
import { validateLessonV2 } from './schema';

describe('Lesson Blueprint System', () => {
  let baseBlueprintInput: LessonBlueprintInput;

  beforeEach(() => {
    baseBlueprintInput = {
      id: 'test_lesson_1',
      title: 'Test Lesson',
      stdTag: 'TEST.STANDARD.1',
      biome: 'reef',
      teach: 'Watch this video to learn the concept',
      steps: [
        { instruction: 'Step 1', question: 'Practice question 1', answer: 'Answer 1', hints: ['Hint 1'] },
        { instruction: 'Step 2', question: 'Practice question 2', answer: 'Answer 2', hints: ['Hint 2'] },
        { instruction: 'Step 3', question: 'Practice question 3', answer: 'Answer 3', hints: ['Hint 3'] }
      ],
      bank: [
        { question: 'Question 1', options: ['Option A', 'Option B', 'Option C'], answer: 'Option A' },
        { question: 'Question 2', options: ['Option A', 'Option B', 'Option C'], answer: 'Option B' }
      ],
      exit: { question: 'Exit question', options: ['Yes', 'No'], answer: 'Yes' },
      whyThis: 'This skill is important because...',
      nextStep: 'Next, you can practice more of this skill'
    };
  });

  describe('Basic Blueprint Creation', () => {
    it('should create a valid lesson from minimal blueprint', () => {
      const lesson = makeLessonFromBlueprint(baseBlueprintInput);
      
      expect(lesson.id).toBe('test_lesson_1');
      expect(lesson.version).toBe('2.0');
      expect(lesson.biomeId).toBe('reef');
      expect(lesson.title['en-AU']).toBe('Test Lesson');
      expect(lesson.skills).toContain('TEST.STANDARD.1');
    });

    it('should generate correct schema structure', () => {
      const lesson = makeLessonFromBlueprint(baseBlueprintInput);
      const validation = validateLessonV2(lesson);
      
      expect(validation.success).toBe(true);
      if (!validation.success) {
        console.error('Validation errors:', validation.errors);
      }
    });

    it('should include all activity blocks', () => {
      const lesson = makeLessonFromBlueprint(baseBlueprintInput);
      
      expect(lesson.activities).toHaveLength(4);
      expect(lesson.activities[0].kind).toBe('video'); // TeachBlock
      expect(lesson.activities[1].kind).toBe('guided'); // GuidedPractice
      expect(lesson.activities[2].kind).toBe('independent'); // IndependentPractice
      expect(lesson.activities[3].kind).toBe('exit'); // ExitTicket
    });
  });

  describe('Biome-specific Generation', () => {
    it('should handle reef biome correctly', () => {
      const blueprintInput = { ...baseBlueprintInput, biome: 'reef' as const };
      const lesson = makeLessonFromBlueprint(blueprintInput);
      
      expect(lesson.biomeId).toBe('reef');
      expect(lesson.assets).toContain('/images/biomes/reef/coral-garden.jpg');
    });

    it('should handle alpine biome correctly', () => {
      const blueprintInput = { ...baseBlueprintInput, biome: 'alpine' as const };
      const lesson = makeLessonFromBlueprint(blueprintInput);
      
      expect(lesson.biomeId).toBe('alpine');
      expect(lesson.assets).toContain('/images/biomes/alpine/mountain-peak.jpg');
    });

    it('should handle forest biome correctly', () => {
      const blueprintInput = { ...baseBlueprintInput, biome: 'forest' as const };
      const lesson = makeLessonFromBlueprint(blueprintInput);
      
      expect(lesson.biomeId).toBe('forest');
      expect(lesson.assets).toContain('/images/biomes/forest/woodland-path.jpg');
    });

    it('should handle desert biome correctly', () => {
      const blueprintInput = { ...baseBlueprintInput, biome: 'desert' as const };
      const lesson = makeLessonFromBlueprint(blueprintInput);
      
      expect(lesson.biomeId).toBe('desert');
      expect(lesson.assets).toContain('/images/biomes/desert/sand-dunes.jpg');
    });
  });

  describe('Math Standards Integration', () => {
    it('should create valid fraction equivalence lesson', () => {
      const mathBlueprint = {
        ...baseBlueprintInput,
        id: 'math_frac_equiv_3',
        title: 'Fraction Equivalence',
        stdTag: 'M.FRAC.EQ.3',
        biome: 'alpine' as const,
        teach: 'Learn about equivalent fractions using visual models',
        whyThis: 'Understanding equivalent fractions helps with fraction operations',
        nextStep: 'Next, learn to compare fractions'
      };
      
      const lesson = makeLessonFromBlueprint(mathBlueprint);
      const validation = validateLessonV2(lesson);
      
      expect(validation.success).toBe(true);
      expect(lesson.skills).toContain('M.FRAC.EQ.3');
      expect(lesson.biomeId).toBe('alpine');
    });

    it('should create valid multiplication lesson', () => {
      const mathBlueprint = {
        ...baseBlueprintInput,
        id: 'math_num_mul_3',
        title: 'Multiplication Mastery',
        stdTag: 'M.NUM.MUL.3',
        biome: 'forest' as const
      };
      
      const lesson = makeLessonFromBlueprint(mathBlueprint);
      expect(lesson.skills).toContain('M.NUM.MUL.3');
      expect(lesson.biomeId).toBe('forest');
    });
  });

  describe('English Standards Integration', () => {
    it('should create valid reading main ideas lesson', () => {
      const englishBlueprint = {
        ...baseBlueprintInput,
        id: 'eng_read_main_3',
        title: 'Finding Main Ideas',
        stdTag: 'E.READ.MAIN.3',
        biome: 'desert' as const,
        teach: 'Learn to identify the main idea in passages',
        whyThis: 'Finding main ideas helps with reading comprehension',
        nextStep: 'Practice identifying supporting details'
      };
      
      const lesson = makeLessonFromBlueprint(englishBlueprint);
      const validation = validateLessonV2(lesson);
      
      expect(validation.success).toBe(true);
      expect(lesson.skills).toContain('E.READ.MAIN.3');
      expect(lesson.biomeId).toBe('desert');
    });

    it('should create valid reading details lesson', () => {
      const englishBlueprint = {
        ...baseBlueprintInput,
        id: 'eng_read_detail_3',
        title: 'Reading for Details',
        stdTag: 'E.READ.DETAIL.3',
        biome: 'desert' as const
      };
      
      const lesson = makeLessonFromBlueprint(englishBlueprint);
      expect(lesson.skills).toContain('E.READ.DETAIL.3');
    });
  });

  describe('Science Standards Integration', () => {
    it('should create valid habitats lesson', () => {
      const scienceBlueprint = {
        ...baseBlueprintInput,
        id: 'sci_habitat_3',
        title: 'Animal Habitats',
        stdTag: 'SCI.HABIT.3',
        biome: 'reef' as const,
        teach: 'Explore different animal habitats and adaptations',
        whyThis: 'Understanding habitats helps us protect ecosystems',
        nextStep: 'Learn about food chains in different habitats'
      };
      
      const lesson = makeLessonFromBlueprint(scienceBlueprint);
      const validation = validateLessonV2(lesson);
      
      expect(validation.success).toBe(true);
      expect(lesson.skills).toContain('SCI.HABIT.3');
      expect(lesson.biomeId).toBe('reef');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle minimal input gracefully', () => {
      const minimalInput: LessonBlueprintInput = {
        id: 'min_test',
        title: 'Minimal Test',
        stdTag: 'MIN.TEST.1',
        biome: 'reef'
      };
      
      const lesson = makeLessonFromBlueprint(minimalInput);
      expect(lesson.id).toBe('min_test');
      expect(lesson.activities).toHaveLength(4); // Should still create all activity blocks
    });

    it('should handle empty arrays gracefully', () => {
      const blueprintWithEmptyArrays = {
        ...baseBlueprintInput,
        steps: [],
        bank: []
      };
      
      const lesson = makeLessonFromBlueprint(blueprintWithEmptyArrays);
      const validation = validateLessonV2(lesson);
      
      expect(validation.success).toBe(true);
      expect(lesson.activities[1].kind).toBe('guided'); // Should still create guided practice
      expect(lesson.activities[2].kind).toBe('independent'); // Should still create independent practice
    });

    it('should handle special characters in IDs', () => {
      const specialCharInput = {
        ...baseBlueprintInput,
        id: 'test-lesson_2024.v1',
        title: 'Test: Special "Characters" & More!',
        stdTag: 'SPECIAL.CHAR-TEST.1'
      };
      
      const lesson = makeLessonFromBlueprint(specialCharInput);
      expect(lesson.id).toBe('test-lesson_2024.v1');
      expect(lesson.skills).toContain('SPECIAL.CHAR-TEST.1');
    });
  });

  describe('Internationalization Support', () => {
    it('should create I18nText objects for all text fields', () => {
      const lesson = makeLessonFromBlueprint(baseBlueprintInput);
      
      expect(lesson.title).toHaveProperty('en-AU');
      expect(lesson.summary).toHaveProperty('en-AU');
      expect(typeof lesson.title).toBe('object');
      expect(typeof lesson.summary).toBe('object');
    });

    it('should handle special characters in text content', () => {
      const unicodeInput = {
        ...baseBlueprintInput,
        title: 'Frações Equivalentes 分数',
        whyThis: 'Understanding fractions helps with maths! 🔢',
        nextStep: 'Next: Practice with decimals 📊'
      };
      
      const lesson = makeLessonFromBlueprint(unicodeInput);
      expect(lesson.title['en-AU']).toContain('分数');
      expect(lesson.summary['en-AU']).toContain('🔢');
    });
  });

  describe('Asset Management', () => {
    it('should include appropriate biome assets', () => {
      const lesson = makeLessonFromBlueprint(baseBlueprintInput);
      expect(lesson.assets).toContain('/images/biomes/reef/coral-garden.jpg');
      expect(lesson.assets).toContain('/audio/biomes/reef/ocean-waves.mp3');
    });

    it('should not include duplicate assets', () => {
      const lesson = makeLessonFromBlueprint(baseBlueprintInput);
      const uniqueAssets = new Set(lesson.assets);
      expect(lesson.assets).toHaveLength(uniqueAssets.size);
    });
  });
});