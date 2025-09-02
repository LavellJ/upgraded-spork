/**
 * Schema validation tests for lesson content
 * Validates all JSON files against their Zod schemas
 */

import { describe, it, expect } from 'vitest';
import { 
  LoopDataSchema,
  RegistryDataSchema,
  PrototypesDataSchema,
  LessonContentSchema,
  QuestionSetSchema,
  validateLessonData,
  validateLessonFiles
} from '../src/schema/lesson';

// Import JSON files for validation
import loop1Data from '../src/data/loop1.json';
import loop2Data from '../src/data/loop2.json';
import registryData from '../src/data/registry.json';
import prototypesData from '../src/data/prototypes.json';
import phonicsLessonData from '../src/content/lessons/phonics-001.json';
import animalsLessonData from '../src/content/lessons/animals-001.json';
import shapesLessonData from '../src/content/lessons/shapes-001.json';
import numbersLessonData from '../src/content/lessons/numbers-001.json';
import oceanLessonData from '../src/content/lessons/ocean-001.json';
import travelLessonData from '../src/content/lessons/travel-001.json';
import phonicsQuizData from '../src/content/question_sets/phonics-001-quizA.json';
import animalsQuizData from '../src/content/question_sets/animals-001-quizA.json';
import shapesQuizData from '../src/content/question_sets/shapes-001-quizA.json';
import numbersQuizData from '../src/content/question_sets/numbers-001-quizA.json';
import oceanQuizData from '../src/content/question_sets/ocean-001-quizA.json';
import travelQuizData from '../src/content/question_sets/travel-001-quizA.json';

describe('Lesson Schema Validation', () => {
  describe('Loop Data', () => {
    it('should validate loop1.json structure', () => {
      const result = validateLessonData(LoopDataSchema, loop1Data, 'loop1.json');
      
      if (!result.success) {
        console.error('Loop1 validation errors:', result.errors);
      }
      
      expect(result.success).toBe(true);
      
      if (result.success) {
        // Verify structure exists for all biomes
        expect(result.data.forest).toBeDefined();
        expect(result.data.desert).toBeDefined();
        expect(result.data.ocean).toBeDefined();
        expect(result.data.night).toBeDefined();
        
        // Verify each biome has lessons with id and title
        expect(result.data.forest.length).toBeGreaterThan(0);
        expect(result.data.forest[0]).toHaveProperty('id');
        expect(result.data.forest[0]).toHaveProperty('title');
      }
    });

    it('should validate loop2.json structure', () => {
      const result = validateLessonData(LoopDataSchema, loop2Data, 'loop2.json');
      
      if (!result.success) {
        console.error('Loop2 validation errors:', result.errors);
      }
      
      expect(result.success).toBe(true);
      
      if (result.success) {
        // Verify all biomes exist
        expect(result.data.forest).toBeDefined();
        expect(result.data.desert).toBeDefined();
        expect(result.data.ocean).toBeDefined();
        expect(result.data.night).toBeDefined();
      }
    });
  });

  describe('Registry Data', () => {
    it('should validate registry.json structure', () => {
      const result = validateLessonData(RegistryDataSchema, registryData, 'registry.json');
      
      if (!result.success) {
        console.error('Registry validation errors:', result.errors);
      }
      
      expect(result.success).toBe(true);
      
      if (result.success) {
        // Verify loop structure exists
        expect(result.data['1']).toBeDefined();
        
        // Verify biome structure
        const loop1 = result.data['1'];
        expect(loop1.forest).toBeDefined();
        expect(loop1.desert).toBeDefined();
        expect(loop1.ocean).toBeDefined();
        expect(loop1.night).toBeDefined();
        
        // Verify entry structure (check first forest entry)
        const firstForestKey = Object.keys(loop1.forest)[0];
        if (firstForestKey) {
          const entry = loop1.forest[firstForestKey];
          expect(entry.url).toMatch(/^https?:\/\//);
          expect(entry.standards.Generic).toBeDefined();
          expect(entry.est).toMatch(/^\d+–\d+\s+min$/);
        }
      }
    });
  });

  describe('Prototypes Data', () => {
    it('should validate prototypes.json structure', () => {
      const result = validateLessonData(PrototypesDataSchema, prototypesData, 'prototypes.json');
      
      if (!result.success) {
        console.error('Prototypes validation errors:', result.errors);
      }
      
      expect(result.success).toBe(true);
      
      if (result.success) {
        // Verify biome structure
        expect(result.data.forest).toBeDefined();
        expect(result.data.desert).toBeDefined();
        expect(result.data.ocean).toBeDefined();
        expect(result.data.night).toBeDefined();
        
        // Verify question structure (check first forest question)
        const firstForestKey = Object.keys(result.data.forest)[0];
        if (firstForestKey) {
          const question = result.data.forest[firstForestKey];
          expect(question.q).toBeDefined();
          expect(question.options).toBeInstanceOf(Array);
          expect(question.options.length).toBeGreaterThanOrEqual(2);
          expect(question.correct).toBeGreaterThanOrEqual(0);
          expect(question.correct).toBeLessThan(question.options.length);
          expect(question.explain).toBeDefined();
        }
      }
    });
  });

  describe('Lesson Content', () => {
    const lessonFiles = [
      { data: phonicsLessonData, name: 'phonics-001.json' },
      { data: animalsLessonData, name: 'animals-001.json' },
      { data: shapesLessonData, name: 'shapes-001.json' },
      { data: numbersLessonData, name: 'numbers-001.json' },
      { data: oceanLessonData, name: 'ocean-001.json' },
      { data: travelLessonData, name: 'travel-001.json' }
    ];

    lessonFiles.forEach(({ data, name }) => {
      it(`should validate ${name} structure`, () => {
        const result = validateLessonData(LessonContentSchema, data, name);
        
        if (!result.success) {
          console.error(`${name} validation errors:`, result.errors);
        }
        
        expect(result.success).toBe(true);
        
        if (result.success) {
          expect(result.data.id).toBeDefined();
          expect(result.data.title).toBeDefined();
          expect(result.data.ageBand).toMatch(/^\d+-\d+$/);
          expect(result.data.steps).toBeInstanceOf(Array);
          expect(result.data.steps.length).toBeGreaterThan(0);
          
          // Verify each step has valid type
          result.data.steps.forEach((step, index) => {
            expect(['read', 'activity', 'quiz']).toContain(step.type);
            
            if (step.type === 'read') {
              expect(step.text).toBeDefined();
            } else if (step.type === 'activity') {
              expect(step.prompt).toBeDefined();
            } else if (step.type === 'quiz') {
              expect(step.questionSetId).toBeDefined();
            }
          });
        }
      });
    });
  });

  describe('Question Sets', () => {
    const questionFiles = [
      { data: phonicsQuizData, name: 'phonics-001-quizA.json' },
      { data: animalsQuizData, name: 'animals-001-quizA.json' },
      { data: shapesQuizData, name: 'shapes-001-quizA.json' },
      { data: numbersQuizData, name: 'numbers-001-quizA.json' },
      { data: oceanQuizData, name: 'ocean-001-quizA.json' },
      { data: travelQuizData, name: 'travel-001-quizA.json' }
    ];

    questionFiles.forEach(({ data, name }) => {
      it(`should validate ${name} structure`, () => {
        const result = validateLessonData(QuestionSetSchema, data, name);
        
        if (!result.success) {
          console.error(`${name} validation errors:`, result.errors);
        }
        
        expect(result.success).toBe(true);
        
        if (result.success) {
          expect(result.data.id).toBeDefined();
          expect(result.data.timeLimitSec).toBeGreaterThan(0);
          expect(result.data.questions).toBeInstanceOf(Array);
          expect(result.data.questions.length).toBeGreaterThan(0);
          
          // Verify each question structure
          result.data.questions.forEach((question, index) => {
            expect(question.id).toBeDefined();
            expect(['mc', 'open']).toContain(question.type);
            expect(question.q).toBeDefined();
            
            if (question.type === 'mc') {
              expect(question.choices).toBeInstanceOf(Array);
              expect(question.choices.length).toBeGreaterThanOrEqual(2);
              expect(question.answer).toBeGreaterThanOrEqual(0);
              expect(question.answer).toBeLessThan(question.choices.length);
            }
            // Open questions don't need choices or answer validation
          });
        }
      });
    });
  });

  describe('Batch Validation', () => {
    it('should validate all files in batch', () => {
      const allValidations = [
        { schema: LoopDataSchema, data: loop1Data, fileName: 'loop1.json' },
        { schema: LoopDataSchema, data: loop2Data, fileName: 'loop2.json' },
        { schema: RegistryDataSchema, data: registryData, fileName: 'registry.json' },
        { schema: PrototypesDataSchema, data: prototypesData, fileName: 'prototypes.json' },
        { schema: LessonContentSchema, data: phonicsLessonData, fileName: 'phonics-001.json' },
        { schema: QuestionSetSchema, data: phonicsQuizData, fileName: 'phonics-001-quizA.json' }
      ];
      
      const result = validateLessonFiles(allValidations);
      
      if (!result.valid) {
        console.error('Batch validation errors:', result.errors);
      }
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Schema Error Handling', () => {
    it('should properly handle invalid loop data', () => {
      const invalidData = {
        forest: [{ id: '', title: 'Invalid - empty ID' }],
        desert: [],
        ocean: [],
        night: []
      };
      
      const result = validateLessonData(LoopDataSchema, invalidData, 'invalid.json');
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors[0]).toContain('Lesson ID is required');
      }
    });

    it('should handle malformed JSON gracefully', () => {
      const result = validateLessonData(LoopDataSchema, null, 'null.json');
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.length).toBeGreaterThan(0);
      }
    });
  });
});