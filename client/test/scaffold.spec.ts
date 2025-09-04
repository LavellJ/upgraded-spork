/**
 * Tests for authoring scaffold CLI functions
 * Validates ID format, locale fields, schema compliance, and file generation
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import { generateLesson, generateJournal } from '../../scripts/scaffold.mts';
import { validateLessonV2 } from '../src/authoring/schema';

// Test constants
const TEST_PACK_ID = 'test-pack';
const TEST_SLUG = 'test-lesson';
const TEST_SKILL_ID = 'test.skill';

describe('Scaffold CLI Functions', () => {
  // Cleanup test files after each test
  afterEach(async () => {
    try {
      await fs.rm(`public/packs/${TEST_PACK_ID}`, { recursive: true, force: true });
      await fs.rm(`client/src/journal/banks/${TEST_SKILL_ID}.json`, { force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('generateLesson', () => {
    it('should generate valid lesson with correct ID format', async () => {
      const args = {
        packId: TEST_PACK_ID,
        slug: TEST_SLUG,
        skills: ['number.fractions', 'measurement.area'],
        biome: 'coast',
        title: 'Halves on the Reef'
      };

      const lessonPath = await generateLesson(args);
      
      // Verify file was created
      expect(lessonPath).toBe(`public/packs/${TEST_PACK_ID}/lessons/${TEST_SLUG}-v1.json`);
      
      // Read and parse the generated lesson
      const lessonContent = await fs.readFile(lessonPath, 'utf-8');
      const lesson = JSON.parse(lessonContent);
      
      // Test ID format compliance
      expect(lesson.id).toBe(`${TEST_SLUG}-v1`);
      expect(lesson.id).toMatch(/^[a-z0-9_.-]+$/);
      
      // Test schema compliance
      const validation = validateLessonV2(lesson);
      expect(validation.success).toBe(true);
      
      if (validation.success) {
        // Test locale fields present
        expect(lesson.title['en-AU']).toBe('Halves on the Reef');
        expect(lesson.summary['en-AU']).toContain('TODO');
        
        // Test skills array non-empty
        expect(lesson.skills).toHaveLength(2);
        expect(lesson.skills).toContain('number.fractions');
        expect(lesson.skills).toContain('measurement.area');
        
        // Test biome mapping
        expect(lesson.biomeId).toBe('ocean'); // coast maps to ocean
        
        // Test accessibility defaults
        const activities = lesson.activities;
        expect(activities).toHaveLength(3);
        
        // Check read activity a11y fields
        const readActivity = activities.find(a => a.kind === 'read');
        expect(readActivity?.alt).toBeDefined();
        expect(readActivity?.ariaLabel).toBeDefined();
        
        // Check video activity captions array
        const videoActivity = activities.find(a => a.kind === 'video');
        expect(videoActivity?.captions).toHaveLength(1);
        expect(videoActivity?.captions[0].src).toBe(`assets/captions/${TEST_SLUG}-v1-en-AU.vtt`);
        expect(videoActivity?.captions[0].srclang).toBe('en-AU');
        expect(videoActivity?.captions[0].default).toBe(true);
        expect(videoActivity?.transcript).toBeDefined();
        
        // Check quiz activity a11y fields
        const quizActivity = activities.find(a => a.kind === 'quiz');
        expect(quizActivity?.alt).toBeDefined();
        expect(quizActivity?.ariaLabel).toBeDefined();
      }
    });

    it('should create caption file stub', async () => {
      const args = {
        packId: TEST_PACK_ID,
        slug: TEST_SLUG,
        skills: ['test.skill'],
        biome: 'forest',
        title: 'Test Lesson'
      };

      await generateLesson(args);
      
      // Verify caption file was created
      const captionPath = `public/packs/${TEST_PACK_ID}/assets/captions/${TEST_SLUG}-v1-en-AU.vtt`;
      const captionContent = await fs.readFile(captionPath, 'utf-8');
      
      expect(captionContent).toContain('WEBVTT');
      expect(captionContent).toContain('TODO');
      expect(captionContent).toContain('00:00:00.000 --> 00:00:04.000');
    });

    it('should validate pack ID format', async () => {
      const args = {
        packId: 'Invalid Pack ID!',
        slug: TEST_SLUG,
        skills: ['test.skill'],
        biome: 'coast',
        title: 'Test Lesson'
      };

      await expect(generateLesson(args)).rejects.toThrow(
        'Pack ID must contain only lowercase letters, numbers, underscores, dots, and hyphens'
      );
    });

    it('should validate slug format', async () => {
      const args = {
        packId: TEST_PACK_ID,
        slug: 'Invalid Slug!',
        skills: ['test.skill'],
        biome: 'coast',
        title: 'Test Lesson'
      };

      await expect(generateLesson(args)).rejects.toThrow(
        'Slug must contain only lowercase letters, numbers, underscores, dots, and hyphens'
      );
    });

    it('should map biome variations correctly', async () => {
      const testCases = [
        { input: 'coast', expected: 'ocean' },
        { input: 'reef', expected: 'ocean' },
        { input: 'mountain', expected: 'desert' },
        { input: 'alpine', expected: 'desert' },
        { input: 'forest', expected: 'forest' },
        { input: 'unknown', expected: 'unknown' }
      ];

      for (const testCase of testCases) {
        const args = {
          packId: `${TEST_PACK_ID}-${testCase.input}`,
          slug: `${TEST_SLUG}-${testCase.input}`,
          skills: ['test.skill'],
          biome: testCase.input,
          title: 'Test Lesson'
        };

        await generateLesson(args);
        
        const lessonPath = `public/packs/${args.packId}/lessons/${args.slug}-v1.json`;
        const lessonContent = await fs.readFile(lessonPath, 'utf-8');
        const lesson = JSON.parse(lessonContent);
        
        expect(lesson.biomeId).toBe(testCase.expected);
      }
    });
  });

  describe('generateJournal', () => {
    it('should generate valid journal bank with age buckets', async () => {
      const args = {
        skillId: TEST_SKILL_ID,
        age: '7-8',
        n: 6
      };

      const journalPath = await generateJournal(args);
      
      // Verify file was created
      expect(journalPath).toBe(`client/src/journal/banks/${TEST_SKILL_ID}.json`);
      
      // Read and parse the generated journal bank
      const journalContent = await fs.readFile(journalPath, 'utf-8');
      const journalBank = JSON.parse(journalContent);
      
      // Test structure
      expect(journalBank[TEST_SKILL_ID]).toBeDefined();
      expect(journalBank[TEST_SKILL_ID].easy).toBeDefined();
      expect(journalBank[TEST_SKILL_ID].core).toBeDefined();
      expect(journalBank[TEST_SKILL_ID].stretch).toBeDefined();
      
      // Test total item count
      const totalItems = 
        journalBank[TEST_SKILL_ID].easy.length +
        journalBank[TEST_SKILL_ID].core.length +
        journalBank[TEST_SKILL_ID].stretch.length;
      expect(totalItems).toBe(6);
      
      // Test item structure and ID format
      const firstItem = journalBank[TEST_SKILL_ID].easy[0];
      expect(firstItem.id).toMatch(/^[a-z0-9_.-]+$/);
      expect(firstItem.id).toBe(`${TEST_SKILL_ID}-easy-1`);
      expect(firstItem.skillId).toBe(TEST_SKILL_ID);
      expect(firstItem.prompt).toContain('TODO');
      expect(firstItem.prompt).toContain('ages 7-8');
      expect(['mcq', 'short']).toContain(firstItem.kind);
      expect(firstItem.answer).toContain('TODO');
      expect(firstItem.explanation).toContain('TODO');
      
      // Test MCQ items have options
      const mcqItems = Object.values(journalBank[TEST_SKILL_ID])
        .flat()
        .filter((item: any) => item.kind === 'mcq');
      
      for (const mcqItem of mcqItems) {
        const typedItem = mcqItem as any;
        expect(typedItem.options).toHaveLength(4);
        expect(typedItem.options[0]).toContain('TODO');
      }
    });

    it('should validate skill ID format', async () => {
      const args = {
        skillId: 'Invalid Skill ID!',
        age: '7-8',
        n: 6
      };

      await expect(generateJournal(args)).rejects.toThrow(
        'Skill ID must contain only lowercase letters, numbers, underscores, dots, and hyphens'
      );
    });

    it('should validate age format', async () => {
      const args = {
        skillId: TEST_SKILL_ID,
        age: 'invalid-age',
        n: 6
      };

      await expect(generateJournal(args)).rejects.toThrow(
        'Age must be in format "7-8" or similar'
      );
    });

    it('should distribute items across difficulty levels', async () => {
      const args = {
        skillId: TEST_SKILL_ID,
        age: '9-10',
        n: 10
      };

      await generateJournal(args);
      
      const journalPath = `client/src/journal/banks/${TEST_SKILL_ID}.json`;
      const journalContent = await fs.readFile(journalPath, 'utf-8');
      const journalBank = JSON.parse(journalContent);
      
      // Test distribution (ceil, ceil, floor for n=10)
      expect(journalBank[TEST_SKILL_ID].easy.length).toBe(4); // ceil(10/3)
      expect(journalBank[TEST_SKILL_ID].core.length).toBe(4); // ceil(10/3)
      expect(journalBank[TEST_SKILL_ID].stretch.length).toBe(2); // floor(10/3)
    });

    it('should handle existing file gracefully', async () => {
      const args = {
        skillId: TEST_SKILL_ID,
        age: '7-8',
        n: 6
      };

      // Create file first time
      await generateJournal(args);
      
      // Try to create again - should not overwrite
      const journalPath = await generateJournal(args);
      expect(journalPath).toBe(`client/src/journal/banks/${TEST_SKILL_ID}.json`);
      
      // File should still exist
      const exists = await fs.access(journalPath).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });
  });

  describe('Schema Compliance', () => {
    it('should generate lessons that pass LessonV2 validation', async () => {
      const args = {
        packId: TEST_PACK_ID,
        slug: TEST_SLUG,
        skills: ['number.counting', 'science.observation'],
        biome: 'reef',
        title: 'Ocean Counting'
      };

      const lessonPath = await generateLesson(args);
      const lessonContent = await fs.readFile(lessonPath, 'utf-8');
      const lesson = JSON.parse(lessonContent);
      
      const validation = validateLessonV2(lesson, lessonPath);
      
      if (!validation.success) {
        console.error('Validation errors:', validation.errors);
      }
      
      expect(validation.success).toBe(true);
    });

    it('should generate locale-compliant content', async () => {
      const args = {
        packId: TEST_PACK_ID,
        slug: TEST_SLUG,
        skills: ['test.skill'],
        biome: 'forest',
        title: 'Test Locale'
      };

      const lessonPath = await generateLesson(args);
      const lessonContent = await fs.readFile(lessonPath, 'utf-8');
      const lesson = JSON.parse(lessonContent);
      
      // All I18nText fields should have en-AU
      expect(lesson.title['en-AU']).toBeDefined();
      expect(lesson.summary['en-AU']).toBeDefined();
      
      // Activities with title should have locale
      lesson.activities.forEach(activity => {
        if (activity.title) {
          expect(activity.title['en-AU']).toBeDefined();
        }
        if (activity.content) {
          expect(activity.content['en-AU']).toBeDefined();
        }
      });
    });
  });
});