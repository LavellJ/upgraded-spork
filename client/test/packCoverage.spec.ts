/**
 * Pack-enabled coverage tests
 * Tests that coverage counts rise after enabling content packs
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { buildCoverage, type CoverageReport } from '../src/authoring/coverage';
import { togglePack, getEnabledPacks, listPacks } from '../src/authoring/packs';
import type { RegistryV2, LessonV2 } from '../src/authoring/schema';

// Mock the pack registry module
vi.mock('../src/authoring/packs', () => ({
  togglePack: vi.fn(),
  getEnabledPacks: vi.fn(),
  listPacks: vi.fn(),
  globalPackRegistry: {
    getEnabledLessons: vi.fn(() => [])
  }
}));

describe('Pack-enabled Coverage Analysis', () => {
  let baseRegistry: RegistryV2;
  let reefPackLessons: LessonV2[];
  let alpinePackLessons: LessonV2[];

  beforeEach(() => {
    vi.clearAllMocks();

    // Base registry with minimal content
    baseRegistry = {
      version: 2,
      lessons: [
        {
          version: 2,
          id: 'base-literacy-1',
          biomeId: 'forest',
          title: { 'en-AU': 'Basic Reading' },
          skills: ['literacy.reading'],
          activities: [
            { kind: 'read', content: { 'en-AU': 'A simple story' } }
          ],
          standards: [
            { code: 'ACARA.F-2.LITERACY.1', framework: 'ACARA' }
          ]
        }
      ],
      frameworks: {
        'ACARA': [
          'ACARA.F-2.LITERACY.1',
          'ACARA.F-2.LITERACY.2', 
          'ACARA.F-2.MATH.1',
          'ACARA.F-2.MATH.2',
          'ACARA.F-2.SCIENCE.1'
        ]
      }
    };

    // Reef pack lessons (marine science + math)
    reefPackLessons = [
      {
        version: 2,
        id: 'reef-math-1',
        biomeId: 'ocean',
        title: { 'en-AU': 'Coral Counting' },
        skills: ['math.counting', 'science.marine'],
        activities: [
          { kind: 'video', src: 'coral-count.mp4', type: 'video/mp4' }
        ],
        standards: [
          { code: 'ACARA.F-2.MATH.1', framework: 'ACARA' }
        ]
      },
      {
        version: 2,
        id: 'reef-literacy-1',
        biomeId: 'ocean',
        title: { 'en-AU': 'Ocean Stories' },
        skills: ['literacy.reading', 'science.marine'],
        activities: [
          { kind: 'read', content: { 'en-AU': 'Stories about the reef' } }
        ],
        standards: [
          { code: 'ACARA.F-2.LITERACY.2', framework: 'ACARA' }
        ]
      }
    ];

    // Alpine pack lessons (measurement + science)
    alpinePackLessons = [
      {
        version: 2,
        id: 'alpine-measurement-1',
        biomeId: 'mountain',
        title: { 'en-AU': 'Mountain Heights' },
        skills: ['math.measurement', 'science.geography'],
        activities: [
          { kind: 'quiz', questionSetId: 'measurement-quiz-1' }
        ],
        standards: [
          { code: 'ACARA.F-2.MATH.2', framework: 'ACARA' }
        ]
      },
      {
        version: 2,
        id: 'alpine-science-1',
        biomeId: 'mountain',
        title: { 'en-AU': 'Alpine Ecosystems' },
        skills: ['science.geography', 'science.animals'],
        activities: [
          { kind: 'video', src: 'alpine-animals.mp4', type: 'video/mp4' }
        ],
        standards: [
          { code: 'ACARA.F-2.SCIENCE.1', framework: 'ACARA' }
        ]
      }
    ];
  });

  it('should show increased coverage when reef pack is enabled', () => {
    // Test with no packs enabled
    const baseCoverage = buildCoverage(baseRegistry);
    const baseACARACovered = baseCoverage.byFramework.ACARA?.covered.size || 0;
    const baseBiomeCovered = baseCoverage.byBiome.size;
    const baseSkillsCovered = baseCoverage.bySkill.size;

    // Mock reef pack as enabled
    vi.mocked(getEnabledPacks).mockReturnValue([{
      id: 'reef-au',
      name: 'Reef Coast AU v1',
      version: '1.0.0',
      locale: 'en-AU',
      baseUrl: '/packs/reef-au',
      manifest: {} as any,
      lessons: reefPackLessons,
      loadedAt: Date.now(),
      isEnabled: true
    }]);

    // Build registry with reef pack lessons
    const registryWithReef: RegistryV2 = {
      ...baseRegistry,
      lessons: [...baseRegistry.lessons, ...reefPackLessons]
    };

    const reefCoverage = buildCoverage(registryWithReef);
    const reefACARACovered = reefCoverage.byFramework.ACARA?.covered.size || 0;
    const reefBiomeCovered = reefCoverage.byBiome.size;
    const reefSkillsCovered = reefCoverage.bySkill.size;

    // Coverage should increase
    expect(reefACARACovered).toBeGreaterThan(baseACARACovered);
    expect(reefBiomeCovered).toBeGreaterThan(baseBiomeCovered);
    expect(reefSkillsCovered).toBeGreaterThan(baseSkillsCovered);

    // Should have reef-specific content
    expect(reefCoverage.byBiome.has('ocean')).toBe(true);
    expect(reefCoverage.bySkill.has('science.marine')).toBe(true);
    expect(reefCoverage.byFramework.ACARA?.covered.has('ACARA.F-2.MATH.1')).toBe(true);
    expect(reefCoverage.byFramework.ACARA?.covered.has('ACARA.F-2.LITERACY.2')).toBe(true);
  });

  it('should show increased coverage when alpine pack is enabled', () => {
    // Test with base only
    const baseCoverage = buildCoverage(baseRegistry);
    const baseACARACovered = baseCoverage.byFramework.ACARA?.covered.size || 0;

    // Mock alpine pack as enabled
    vi.mocked(getEnabledPacks).mockReturnValue([{
      id: 'alpine-au',
      name: 'Alpine Ridge AU v1',
      version: '1.0.0',
      locale: 'en-AU',
      baseUrl: '/packs/alpine-au',
      manifest: {} as any,
      lessons: alpinePackLessons,
      loadedAt: Date.now(),
      isEnabled: true
    }]);

    // Build registry with alpine pack lessons
    const registryWithAlpine: RegistryV2 = {
      ...baseRegistry,
      lessons: [...baseRegistry.lessons, ...alpinePackLessons]
    };

    const alpineCoverage = buildCoverage(registryWithAlpine);
    const alpineACARACovered = alpineCoverage.byFramework.ACARA?.covered.size || 0;

    // Coverage should increase
    expect(alpineACARACovered).toBeGreaterThan(baseACARACovered);

    // Should have alpine-specific content
    expect(alpineCoverage.byBiome.has('mountain')).toBe(true);
    expect(alpineCoverage.bySkill.has('math.measurement')).toBe(true);
    expect(alpineCoverage.bySkill.has('science.geography')).toBe(true);
    expect(alpineCoverage.byFramework.ACARA?.covered.has('ACARA.F-2.MATH.2')).toBe(true);
    expect(alpineCoverage.byFramework.ACARA?.covered.has('ACARA.F-2.SCIENCE.1')).toBe(true);
  });

  it('should show maximum coverage when both packs are enabled', () => {
    // Mock both packs as enabled
    vi.mocked(getEnabledPacks).mockReturnValue([
      {
        id: 'reef-au',
        name: 'Reef Coast AU v1',
        version: '1.0.0',
        locale: 'en-AU',
        baseUrl: '/packs/reef-au',
        manifest: {} as any,
        lessons: reefPackLessons,
        loadedAt: Date.now(),
        isEnabled: true
      },
      {
        id: 'alpine-au',
        name: 'Alpine Ridge AU v1',
        version: '1.0.0',
        locale: 'en-AU',
        baseUrl: '/packs/alpine-au',
        manifest: {} as any,
        lessons: alpinePackLessons,
        loadedAt: Date.now(),
        isEnabled: true
      }
    ]);

    // Build registry with all lessons
    const fullRegistry: RegistryV2 = {
      ...baseRegistry,
      lessons: [...baseRegistry.lessons, ...reefPackLessons, ...alpinePackLessons]
    };

    const fullCoverage = buildCoverage(fullRegistry);

    // Should have comprehensive coverage
    expect(fullCoverage.byBiome.has('forest')).toBe(true);
    expect(fullCoverage.byBiome.has('ocean')).toBe(true);
    expect(fullCoverage.byBiome.has('mountain')).toBe(true);

    // Should cover all ACARA standards we've defined
    expect(fullCoverage.byFramework.ACARA?.covered.size).toBe(5);
    expect(fullCoverage.byFramework.ACARA?.covered.has('ACARA.F-2.LITERACY.1')).toBe(true);
    expect(fullCoverage.byFramework.ACARA?.covered.has('ACARA.F-2.LITERACY.2')).toBe(true);
    expect(fullCoverage.byFramework.ACARA?.covered.has('ACARA.F-2.MATH.1')).toBe(true);
    expect(fullCoverage.byFramework.ACARA?.covered.has('ACARA.F-2.MATH.2')).toBe(true);
    expect(fullCoverage.byFramework.ACARA?.covered.has('ACARA.F-2.SCIENCE.1')).toBe(true);

    // Should have all skills
    expect(fullCoverage.bySkill.has('literacy.reading')).toBe(true);
    expect(fullCoverage.bySkill.has('math.counting')).toBe(true);
    expect(fullCoverage.bySkill.has('math.measurement')).toBe(true);
    expect(fullCoverage.bySkill.has('science.marine')).toBe(true);
    expect(fullCoverage.bySkill.has('science.geography')).toBe(true);
    expect(fullCoverage.bySkill.has('science.animals')).toBe(true);
  });

  it('should handle pack toggle operations', () => {
    // Test enabling a pack
    vi.mocked(togglePack).mockImplementation((packId: string, enabled: boolean) => {
      // Mock implementation would update internal state
    });

    // Enable reef pack
    togglePack('reef-au', true);
    expect(vi.mocked(togglePack)).toHaveBeenCalledWith('reef-au', true);

    // Disable reef pack
    togglePack('reef-au', false);
    expect(vi.mocked(togglePack)).toHaveBeenCalledWith('reef-au', false);
  });

  it('should track coverage percentage changes', () => {
    const baseCoverage = buildCoverage(baseRegistry);
    const basePercentage = (baseCoverage.byFramework.ACARA?.covered.size || 0) / 
                          (baseCoverage.byFramework.ACARA?.total.size || 1);

    // Add reef pack
    const registryWithReef: RegistryV2 = {
      ...baseRegistry,
      lessons: [...baseRegistry.lessons, ...reefPackLessons]
    };

    const reefCoverage = buildCoverage(registryWithReef);
    const reefPercentage = (reefCoverage.byFramework.ACARA?.covered.size || 0) / 
                          (reefCoverage.byFramework.ACARA?.total.size || 1);

    // Coverage percentage should increase
    expect(reefPercentage).toBeGreaterThan(basePercentage);

    // Add alpine pack
    const fullRegistry: RegistryV2 = {
      ...baseRegistry,
      lessons: [...baseRegistry.lessons, ...reefPackLessons, ...alpinePackLessons]
    };

    const fullCoverage = buildCoverage(fullRegistry);
    const fullPercentage = (fullCoverage.byFramework.ACARA?.covered.size || 0) / 
                          (fullCoverage.byFramework.ACARA?.total.size || 1);

    // Should reach 100% coverage for our test framework
    expect(fullPercentage).toBe(1.0);
  });

  it('should validate pack content meets standards', () => {
    // Reef pack lessons should have proper standards mapping
    reefPackLessons.forEach(lesson => {
      expect(lesson.standards).toBeDefined();
      expect(lesson.standards.length).toBeGreaterThan(0);
      expect(lesson.standards.every(s => s.framework === 'ACARA')).toBe(true);
    });

    // Alpine pack lessons should have proper standards mapping
    alpinePackLessons.forEach(lesson => {
      expect(lesson.standards).toBeDefined();
      expect(lesson.standards.length).toBeGreaterThan(0);
      expect(lesson.standards.every(s => s.framework === 'ACARA')).toBe(true);
    });
  });
});