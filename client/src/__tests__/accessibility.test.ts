import { describe, it, expect } from 'vitest';
import { getBiomeAriaLabel, getPinAriaLabel } from '../data/meta';

describe('Accessibility helpers', () => {
  describe('getBiomeAriaLabel', () => {
    it('should generate proper aria-label for biomes', () => {
      const label = getBiomeAriaLabel('forest', 'Forest');
      expect(label).toContain('Forest');
      expect(label).toContain('biome');
      expect(typeof label).toBe('string');
      expect(label.length).toBeGreaterThan(0);
    });

    it('should handle different biome types', () => {
      const forestLabel = getBiomeAriaLabel('forest', 'Forest');
      const desertLabel = getBiomeAriaLabel('desert', 'Desert');
      const oceanLabel = getBiomeAriaLabel('ocean', 'Ocean');
      const nightLabel = getBiomeAriaLabel('night', 'Night');

      expect(forestLabel).toMatch(/forest/i);
      expect(desertLabel).toMatch(/desert/i);
      expect(oceanLabel).toMatch(/ocean/i);
      expect(nightLabel).toMatch(/night/i);
    });
  });

  describe('getPinAriaLabel', () => {
    it('should generate proper aria-label for lesson pins', () => {
      const label = getPinAriaLabel({ title: 'Letter Recognition' });
      expect(label).toContain('Letter Recognition');
      expect(typeof label).toBe('string');
      expect(label.length).toBeGreaterThan(0);
    });

    it('should handle different lesson titles', () => {
      const lesson1 = getPinAriaLabel({ title: 'Counting to 10' });
      const lesson2 = getPinAriaLabel({ title: 'Ocean Animals' });
      const lesson3 = getPinAriaLabel({ title: 'Community Helpers' });

      expect(lesson1).toContain('Counting to 10');
      expect(lesson2).toContain('Ocean Animals');
      expect(lesson3).toContain('Community Helpers');
    });
  });
});