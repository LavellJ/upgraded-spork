/**
 * Coverage analysis tests
 * Tests the coverage reporting functionality with synthetic registry data
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { buildCoverage, missingStandards, getFrameworkCodes, type CoverageReport } from '../src/authoring/coverage';
import type { RegistryV2, LessonV2 } from '../src/authoring/schema';

describe('Coverage Analysis', () => {
  let syntheticRegistry: RegistryV2;

  beforeEach(() => {
    // Create synthetic registry with gaps for testing
    syntheticRegistry = {
      version: 2,
      lessons: [
        {
          version: 2,
          id: 'forest-1',
          biomeId: 'forest',
          title: { 'en-AU': 'Phonics Basics' },
          skills: ['reading.phonics', 'reading.sounds'],
          activities: [
            { kind: 'video', title: { 'en-AU': 'Letter Sounds' }, src: 'sounds.mp4' }
          ],
          standards: [
            { code: 'ACARA.F-2.PHONICS.1', framework: 'ACARA' },
            { code: 'NZC.L1.READING.1', framework: 'NZC' }
          ]
        },
        {
          version: 2,
          id: 'forest-2',
          biomeId: 'forest',
          title: { 'en-AU': 'Word Recognition' },
          skills: ['reading.recognition', 'reading.phonics'], // phonics appears again
          activities: [
            { kind: 'quiz', title: { 'en-AU': 'Word Quiz' }, questions: [] }
          ],
          standards: [
            { code: 'ACARA.F-2.PHONICS.2', framework: 'ACARA' }
          ]
        },
        {
          version: 2,
          id: 'desert-1',
          biomeId: 'desert',
          title: { 'en-AU': 'Counting to 10' },
          skills: ['math.counting'],
          activities: [
            { kind: 'manip', title: { 'en-AU': 'Count Objects' }, src: 'counting.html' }
          ],
          standards: [
            { code: 'ACARA.F-2.NUMBER.1', framework: 'ACARA' },
            { code: 'NZC.L1.NUMBER.1', framework: 'NZC' }
          ]
        },
        {
          version: 2,
          id: 'ocean-1',
          biomeId: 'ocean',
          title: { 'en-AU': 'Water Cycle' },
          skills: ['science.cycles'],
          activities: [
            { kind: 'video', title: { 'en-AU': 'Water Cycle Video' }, src: 'water.mp4' }
          ],
          standards: [
            { code: 'ACARA.F-2.SCIENCE.1', framework: 'ACARA' }
          ]
        },
        // Note: No 'night' biome lessons - this creates a gap
        {
          version: 2,
          id: 'forest-gap',
          biomeId: 'forest',
          title: { 'en-AU': 'Lesson with lone skill' },
          skills: ['reading.lone'], // This skill only appears once - coverage gap
          activities: [
            { kind: 'read', title: { 'en-AU': 'Read Story' }, src: 'story.html' }
          ]
        }
      ],
      skills: [
        { id: 'reading.phonics', label: { 'en-AU': 'Phonics' } },
        { id: 'reading.sounds', label: { 'en-AU': 'Letter Sounds' } },
        { id: 'reading.recognition', label: { 'en-AU': 'Word Recognition' } },
        { id: 'reading.lone', label: { 'en-AU': 'Lone Skill' } },
        { id: 'math.counting', label: { 'en-AU': 'Counting' } },
        { id: 'science.cycles', label: { 'en-AU': 'Cycles' } }
      ],
      frameworks: {
        'ACARA': [
          'ACARA.F-2.PHONICS.1',
          'ACARA.F-2.PHONICS.2',
          'ACARA.F-2.PHONICS.3', // Missing - not covered by any lesson
          'ACARA.F-2.NUMBER.1',
          'ACARA.F-2.NUMBER.2',   // Missing - not covered by any lesson
          'ACARA.F-2.SCIENCE.1',
          'ACARA.F-2.HASS.1'      // Missing - not covered by any lesson
        ],
        'NZC': [
          'NZC.L1.READING.1',
          'NZC.L1.READING.2',     // Missing - not covered by any lesson
          'NZC.L1.NUMBER.1',
          'NZC.L1.SCIENCE.1',     // Missing - not covered by any lesson
          'NZC.L1.HASS.1'         // Missing - not covered by any lesson
        ]
      }
    };
  });

  describe('buildCoverage', () => {
    it('should correctly count lessons by biome', () => {
      const coverage = buildCoverage(syntheticRegistry);
      
      expect(coverage.byBiome.forest.lessons).toBe(3); // forest-1, forest-2, forest-gap
      expect(coverage.byBiome.desert.lessons).toBe(1); // desert-1
      expect(coverage.byBiome.ocean.lessons).toBe(1);  // ocean-1
      expect(coverage.byBiome.night).toBeUndefined();  // No night lessons
    });

    it('should correctly track skills by biome', () => {
      const coverage = buildCoverage(syntheticRegistry);
      
      expect(coverage.byBiome.forest.skills.size).toBe(3); // phonics, sounds, recognition, lone
      expect(coverage.byBiome.forest.skills.has('reading.phonics')).toBe(true);
      expect(coverage.byBiome.forest.skills.has('reading.sounds')).toBe(true);
      expect(coverage.byBiome.forest.skills.has('reading.recognition')).toBe(true);
      expect(coverage.byBiome.forest.skills.has('reading.lone')).toBe(true);
      
      expect(coverage.byBiome.desert.skills.size).toBe(1); // counting
      expect(coverage.byBiome.desert.skills.has('math.counting')).toBe(true);
      
      expect(coverage.byBiome.ocean.skills.size).toBe(1); // cycles
      expect(coverage.byBiome.ocean.skills.has('science.cycles')).toBe(true);
    });

    it('should correctly count lessons by skill', () => {
      const coverage = buildCoverage(syntheticRegistry);
      
      expect(coverage.bySkill['reading.phonics'].lessons).toBe(2); // forest-1, forest-2
      expect(coverage.bySkill['reading.sounds'].lessons).toBe(1);  // forest-1
      expect(coverage.bySkill['reading.recognition'].lessons).toBe(1); // forest-2
      expect(coverage.bySkill['reading.lone'].lessons).toBe(1);    // forest-gap
      expect(coverage.bySkill['math.counting'].lessons).toBe(1);   // desert-1
      expect(coverage.bySkill['science.cycles'].lessons).toBe(1);  // ocean-1
    });

    it('should track framework coverage correctly', () => {
      const coverage = buildCoverage(syntheticRegistry);
      
      // ACARA framework
      expect(coverage.byFramework.ACARA.codes.size).toBe(7); // All ACARA codes
      expect(coverage.byFramework.ACARA.covered.size).toBe(4); // Only covered ones
      expect(coverage.byFramework.ACARA.covered.has('ACARA.F-2.PHONICS.1')).toBe(true);
      expect(coverage.byFramework.ACARA.covered.has('ACARA.F-2.PHONICS.2')).toBe(true);
      expect(coverage.byFramework.ACARA.covered.has('ACARA.F-2.NUMBER.1')).toBe(true);
      expect(coverage.byFramework.ACARA.covered.has('ACARA.F-2.SCIENCE.1')).toBe(true);
      expect(coverage.byFramework.ACARA.covered.has('ACARA.F-2.PHONICS.3')).toBe(false); // Missing
      
      // NZC framework
      expect(coverage.byFramework.NZC.codes.size).toBe(5); // All NZC codes
      expect(coverage.byFramework.NZC.covered.size).toBe(2); // Only covered ones
      expect(coverage.byFramework.NZC.covered.has('NZC.L1.READING.1')).toBe(true);
      expect(coverage.byFramework.NZC.covered.has('NZC.L1.NUMBER.1')).toBe(true);
      expect(coverage.byFramework.NZC.covered.has('NZC.L1.READING.2')).toBe(false); // Missing
    });

    it('should handle empty registry', () => {
      const emptyRegistry: RegistryV2 = {
        version: 2,
        lessons: [],
        skills: [],
        frameworks: {}
      };
      
      const coverage = buildCoverage(emptyRegistry);
      
      expect(Object.keys(coverage.byBiome)).toHaveLength(0);
      expect(Object.keys(coverage.bySkill)).toHaveLength(0);
      expect(Object.keys(coverage.byFramework)).toHaveLength(0);
    });
  });

  describe('missingStandards', () => {
    it('should identify missing ACARA standards', () => {
      const acaraCodes = syntheticRegistry.frameworks!.ACARA;
      const missing = missingStandards('ACARA', acaraCodes);
      
      expect(missing).toEqual([
        'ACARA.F-2.HASS.1',
        'ACARA.F-2.NUMBER.2',
        'ACARA.F-2.PHONICS.3'
      ]);
    });

    it('should identify missing NZC standards', () => {
      const nzcCodes = syntheticRegistry.frameworks!.NZC;
      const missing = missingStandards('NZC', nzcCodes);
      
      expect(missing).toEqual([
        'NZC.L1.HASS.1',
        'NZC.L1.READING.2',
        'NZC.L1.SCIENCE.1'
      ]);
    });

    it('should return all codes for unknown framework', () => {
      const testCodes = ['TEST.1', 'TEST.2', 'TEST.3'];
      const missing = missingStandards('UNKNOWN', testCodes);
      
      expect(missing).toEqual(testCodes);
    });

    it('should return empty array if all standards are covered', () => {
      // Create a registry where all standards are covered
      const fullCoverage: RegistryV2 = {
        ...syntheticRegistry,
        lessons: [
          ...syntheticRegistry.lessons,
          {
            version: 2,
            id: 'coverage-complete',
            biomeId: 'night',
            title: { 'en-AU': 'Complete Coverage' },
            skills: ['complete.skill'],
            activities: [{ kind: 'video', title: { 'en-AU': 'Complete' }, src: 'test.mp4' }],
            standards: [
              { code: 'ACARA.F-2.PHONICS.3', framework: 'ACARA' },
              { code: 'ACARA.F-2.NUMBER.2', framework: 'ACARA' },
              { code: 'ACARA.F-2.HASS.1', framework: 'ACARA' },
              { code: 'NZC.L1.READING.2', framework: 'NZC' },
              { code: 'NZC.L1.SCIENCE.1', framework: 'NZC' },
              { code: 'NZC.L1.HASS.1', framework: 'NZC' }
            ]
          }
        ]
      };

      // Override buildCoverage to use our full coverage registry
      const coverage = buildCoverage(fullCoverage);
      
      // Check that all ACARA standards are now covered
      const acaraCodes = fullCoverage.frameworks!.ACARA;
      const missing = missingStandards('ACARA', acaraCodes);
      
      expect(missing).toEqual([]);
    });
  });

  describe('coverage gaps analysis', () => {
    it('should identify biome gaps', () => {
      const coverage = buildCoverage(syntheticRegistry);
      
      // Night biome has no lessons
      expect(coverage.byBiome.night).toBeUndefined();
      
      // Forest has most lessons
      expect(coverage.byBiome.forest.lessons).toBeGreaterThan(coverage.byBiome.desert.lessons);
      expect(coverage.byBiome.forest.lessons).toBeGreaterThan(coverage.byBiome.ocean.lessons);
    });

    it('should identify skill coverage gaps', () => {
      const coverage = buildCoverage(syntheticRegistry);
      
      // reading.lone skill appears only once - potential gap
      expect(coverage.bySkill['reading.lone'].lessons).toBe(1);
      
      // reading.phonics appears multiple times - good coverage
      expect(coverage.bySkill['reading.phonics'].lessons).toBe(2);
    });

    it('should calculate framework coverage percentages', () => {
      const coverage = buildCoverage(syntheticRegistry);
      
      // ACARA: 4 covered out of 7 total = ~57%
      const acaraPercentage = (coverage.byFramework.ACARA.covered.size / coverage.byFramework.ACARA.codes.size) * 100;
      expect(Math.round(acaraPercentage)).toBe(57);
      
      // NZC: 2 covered out of 5 total = 40%
      const nzcPercentage = (coverage.byFramework.NZC.covered.size / coverage.byFramework.NZC.codes.size) * 100;
      expect(nzcPercentage).toBe(40);
    });
  });

  describe('standards tracking', () => {
    it('should handle different standard formats', () => {
      const mixedStandardsRegistry: RegistryV2 = {
        version: 2,
        lessons: [
          {
            version: 2,
            id: 'mixed-standards',
            biomeId: 'test',
            title: { 'en-AU': 'Mixed Standards' },
            skills: ['test.skill'],
            activities: [{ kind: 'video', title: { 'en-AU': 'Test' }, src: 'test.mp4' }],
            standards: [
              { code: 'STRING.STANDARD.1', framework: 'TEST' },  // Object format
              { code: 'OBJECT.STANDARD.1', framework: 'TEST' }, // Object format
              { code: 'OBJECT.STANDARD.2', framework: 'TEST' }
            ]
          }
        ],
        frameworks: {
          'TEST': ['STRING.STANDARD.1', 'OBJECT.STANDARD.1', 'OBJECT.STANDARD.2']
        }
      };

      const coverage = buildCoverage(mixedStandardsRegistry);
      
      expect(coverage.byFramework.TEST.covered.size).toBe(3);
      expect(coverage.byFramework.TEST.covered.has('STRING.STANDARD.1')).toBe(true);
      expect(coverage.byFramework.TEST.covered.has('OBJECT.STANDARD.1')).toBe(true);
      expect(coverage.byFramework.TEST.covered.has('OBJECT.STANDARD.2')).toBe(true);
    });
  });
});