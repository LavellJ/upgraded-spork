/**
 * Schema validation tests for lesson content
 * Validates all JSON files against their Zod schemas
 * Includes both v1 (legacy) and v2 (authoring) schema tests
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

// Schema v2 imports
import {
  LessonId,
  SkillId,
  Locale,
  I18nText,
  LessonV2,
  RegistryV2,
  validateLessonV2,
  validateRegistryV2,
  schemasV2
} from '../src/authoring/schema';

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

// ---- Schema v2 Tests ----

describe('Schema V2 Validation', () => {
  
  describe('ID Validation', () => {
    it('should accept valid lesson IDs', () => {
      const validIds = ['f1', 'forest_1', 'lesson-a', 'skill.basic', 'test_123'];
      
      for (const id of validIds) {
        expect(() => LessonId.parse(id)).not.toThrow();
      }
    });

    it('should reject invalid lesson IDs', () => {
      const invalidIds = ['F1', 'lesson A', 'skill@basic', 'test/123', ''];
      
      for (const id of invalidIds) {
        expect(() => LessonId.parse(id)).toThrow();
      }
    });

    it('should accept valid skill IDs', () => {
      const validIds = ['literacy_basic', 'math-1', 'science.intro', 'hass_geography'];
      
      for (const id of validIds) {
        expect(() => SkillId.parse(id)).not.toThrow();
      }
    });

    it('should reject invalid skill IDs', () => {
      const invalidIds = ['SKILL1', 'skill space', 'skill@domain', ''];
      
      for (const id of invalidIds) {
        expect(() => SkillId.parse(id)).toThrow();
      }
    });
  });

  describe('Locale Support', () => {
    it('should accept valid locales', () => {
      const validLocales = ['en-AU', 'en-US', 'en-GB'];
      
      for (const locale of validLocales) {
        expect(() => Locale.parse(locale)).not.toThrow();
      }
    });

    it('should reject invalid locales', () => {
      const invalidLocales = ['en', 'en-CA', 'fr-FR', 'invalid'];
      
      for (const locale of invalidLocales) {
        expect(() => Locale.parse(locale)).toThrow();
      }
    });
  });

  describe('I18n Text Validation', () => {
    it('should accept valid I18n text with at least one locale', () => {
      const validTexts = [
        { 'en-AU': 'Australian text' },
        { 'en-US': 'American text' },
        { 'en-GB': 'British text' },
        { 'en-AU': 'Australian', 'en-US': 'American' },
        { 'en-AU': 'Text', 'en-US': '', 'en-GB': undefined }
      ];
      
      for (const text of validTexts) {
        expect(() => I18nText.parse(text)).not.toThrow();
      }
    });

    it('should reject I18n text with no valid locales', () => {
      const invalidTexts = [
        {},
        { 'en-AU': '', 'en-US': '', 'en-GB': '' },
        { 'en-AU': undefined, 'en-US': undefined, 'en-GB': undefined },
        { 'fr-FR': 'French text' } // Invalid locale
      ];
      
      for (const text of invalidTexts) {
        expect(() => I18nText.parse(text)).toThrow();
      }
    });
  });

  describe('Lesson V2 Validation', () => {
    const validLesson = {
      version: 2,
      id: 'f1',
      biomeId: 'forest',
      title: { 'en-AU': 'First Sounds' },
      skills: ['literacy_phonics'],
      activities: [
        {
          kind: 'video',
          src: 'https://example.com/video.mp4',
          captions: [{
            src: 'https://example.com/captions.vtt',
            srclang: 'en-AU'
          }]
        }
      ]
    };

    it('should accept valid lesson v2', () => {
      expect(() => LessonV2.parse(validLesson)).not.toThrow();
    });

    it('should reject lesson with wrong version', () => {
      const invalidLesson = { ...validLesson, version: 1 };
      expect(() => LessonV2.parse(invalidLesson)).toThrow();
    });

    it('should reject lesson with invalid ID', () => {
      const invalidLesson = { ...validLesson, id: 'INVALID ID' };
      expect(() => LessonV2.parse(invalidLesson)).toThrow();
    });

    it('should reject lesson without title locales', () => {
      const invalidLesson = { ...validLesson, title: {} };
      expect(() => LessonV2.parse(invalidLesson)).toThrow();
    });

    it('should reject lesson without skills', () => {
      const invalidLesson = { ...validLesson, skills: [] };
      expect(() => LessonV2.parse(invalidLesson)).toThrow();
    });

    it('should reject lesson without activities', () => {
      const invalidLesson = { ...validLesson, activities: [] };
      expect(() => LessonV2.parse(invalidLesson)).toThrow();
    });

    it('should accept lesson with optional fields', () => {
      const lessonWithOptionals = {
        ...validLesson,
        summary: { 'en-AU': 'A lesson about phonics' },
        standards: [{ framework: 'ACARA', code: 'AC9EFLY01' }],
        assets: ['image1.png', 'audio1.mp3'],
        meta: { difficulty: 'beginner', estimatedTime: '10min' }
      };
      
      expect(() => LessonV2.parse(lessonWithOptionals)).not.toThrow();
    });
  });

  describe('Registry V2 Validation', () => {
    const validRegistry = {
      version: 2,
      lessons: [
        {
          version: 2,
          id: 'f1',
          biomeId: 'forest',
          title: { 'en-AU': 'First Sounds' },
          skills: ['literacy_phonics'],
          activities: [
            {
              kind: 'read',
              content: { 'en-AU': 'Learn about phonics' }
            }
          ]
        }
      ],
      skills: [
        {
          id: 'literacy_phonics',
          label: { 'en-AU': 'Phonics Skills' }
        }
      ],
      frameworks: {
        'ACARA': ['AC9EFLY01', 'AC9EFLY02'],
        'NZC': ['NZC-L1-Reading']
      }
    };

    it('should accept valid registry v2', () => {
      expect(() => RegistryV2.parse(validRegistry)).not.toThrow();
    });

    it('should reject registry with wrong version', () => {
      const invalidRegistry = { ...validRegistry, version: 1 };
      expect(() => RegistryV2.parse(invalidRegistry)).toThrow();
    });

    it('should accept registry with minimal structure', () => {
      const minimalRegistry = {
        version: 2,
        lessons: [
          {
            version: 2,
            id: 'test1',
            biomeId: 'forest',
            title: { 'en-AU': 'Test Lesson' },
            skills: ['test_skill'],
            activities: [
              {
                kind: 'quiz',
                questionSetId: 'test_questions'
              }
            ]
          }
        ]
      };
      
      expect(() => RegistryV2.parse(minimalRegistry)).not.toThrow();
    });
  });

  describe('Activity V2 Validation', () => {
    it('should accept valid video activity with a11y fields', () => {
      const videoActivity = {
        kind: 'video',
        src: 'https://example.com/video.mp4',
        captions: [{
          src: 'https://example.com/captions.vtt',
          srclang: 'en-AU',
          label: 'English (Australia)',
          default: true
        }],
        transcript: {
          text: 'Video transcript content'
        },
        audiodescription: 'https://example.com/audio-desc.mp3',
        alt: 'Educational video about phonics',
        ariaLabel: 'Interactive phonics learning video'
      };
      
      expect(() => schemasV2.VideoActivityV2Schema.parse(videoActivity)).not.toThrow();
    });

    it('should accept valid read activity', () => {
      const readActivity = {
        kind: 'read',
        content: { 'en-AU': 'Reading content' },
        title: { 'en-AU': 'Reading Exercise' }
      };
      
      expect(() => schemasV2.ReadActivityV2Schema.parse(readActivity)).not.toThrow();
    });

    it('should accept valid quiz activity', () => {
      const quizActivity = {
        kind: 'quiz',
        questionSetId: 'phonics_quiz_1'
      };
      
      expect(() => schemasV2.QuizActivityV2Schema.parse(quizActivity)).not.toThrow();
    });

    it('should accept valid manipulative activity', () => {
      const manipActivity = {
        kind: 'manip',
        interactionType: 'drag_drop',
        config: { items: 5, difficulty: 'easy' }
      };
      
      expect(() => schemasV2.ManipActivityV2Schema.parse(manipActivity)).not.toThrow();
    });
  });

  describe('V2 Validation Utilities', () => {
    it('should validate lesson with helper function', () => {
      const lesson = {
        version: 2,
        id: 'f1',
        biomeId: 'forest',
        title: { 'en-AU': 'First Sounds' },
        skills: ['literacy_phonics'],
        activities: [
          {
            kind: 'read',
            content: { 'en-AU': 'Content' }
          }
        ]
      };

      const result = validateLessonV2(lesson, 'test.json');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('f1');
      }
    });

    it('should validate registry with helper function', () => {
      const registry = {
        version: 2,
        lessons: []
      };

      const result = validateRegistryV2(registry, 'test-registry.json');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.version).toBe(2);
      }
    });

    it('should return validation errors with helpful messages', () => {
      const invalidLesson = {
        version: 2,
        id: 'INVALID',
        biomeId: 'forest',
        title: {},
        skills: [],
        activities: []
      };

      const result = validateLessonV2(invalidLesson, 'invalid.json');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors.some(e => e.includes('invalid.json'))).toBe(true);
      }
    });
  });
});