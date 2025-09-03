/**
 * Tests for A/B Testing Model
 * 
 * Validates assignment persistence, variant selection, and experiment management.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { 
  getVariant, 
  setVariant, 
  getAllAssignments, 
  clearAllAssignments,
  getScoutDwellTimes,
  getScoutDwellVariant,
  SCOUT_DWELL_VARIANTS
} from './model';

// Mock localStorage for testing
const mockLocalStorage = {
  data: {} as Record<string, string>,
  getItem: (key: string) => mockLocalStorage.data[key] || null,
  setItem: (key: string, value: string) => {
    mockLocalStorage.data[key] = value;
  },
  removeItem: (key: string) => {
    delete mockLocalStorage.data[key];
  },
  clear: () => {
    mockLocalStorage.data = {};
  }
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

describe('AB Model', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
  });

  afterEach(() => {
    clearAllAssignments();
  });

  describe('getVariant', () => {
    it('should assign and persist a random variant on first call', () => {
      const variants = ['A', 'B', 'C'];
      const variant = getVariant('test.experiment', variants);
      
      expect(variants).toContain(variant);
      
      // Should return same variant on subsequent calls
      const variant2 = getVariant('test.experiment', variants);
      expect(variant2).toBe(variant);
    });

    it('should return existing assignment if available', () => {
      setVariant('existing.test', 'B');
      
      const variant = getVariant('existing.test', ['A', 'B', 'C']);
      expect(variant).toBe('B');
    });

    it('should reassign if current assignment not in variants list', () => {
      setVariant('outdated.test', 'D'); // Not in current variants
      
      const variant = getVariant('outdated.test', ['A', 'B', 'C']);
      expect(['A', 'B', 'C']).toContain(variant);
      expect(variant).not.toBe('D');
    });

    it('should throw error for empty variants array', () => {
      expect(() => getVariant('test.experiment', [])).toThrow();
    });
  });

  describe('setVariant', () => {
    it('should manually set variant assignment', () => {
      setVariant('manual.test', 'B');
      
      const assignments = getAllAssignments();
      expect(assignments['manual.test']).toBe('B');
    });

    it('should override existing assignment', () => {
      setVariant('override.test', 'A');
      setVariant('override.test', 'C');
      
      const assignments = getAllAssignments();
      expect(assignments['override.test']).toBe('C');
    });
  });

  describe('getAllAssignments', () => {
    it('should return empty object when no assignments exist', () => {
      const assignments = getAllAssignments();
      expect(assignments).toEqual({});
    });

    it('should return all current assignments', () => {
      setVariant('test1', 'A');
      setVariant('test2', 'B');
      
      const assignments = getAllAssignments();
      expect(assignments).toEqual({
        'test1': 'A',
        'test2': 'B'
      });
    });
  });

  describe('clearAllAssignments', () => {
    it('should remove all assignments', () => {
      setVariant('test1', 'A');
      setVariant('test2', 'B');
      
      clearAllAssignments();
      
      const assignments = getAllAssignments();
      expect(assignments).toEqual({});
    });
  });

  describe('Scout Dwell Experiment', () => {
    it('should assign valid scout dwell variant', () => {
      const variant = getScoutDwellVariant();
      expect(SCOUT_DWELL_VARIANTS).toContain(variant);
    });

    it('should return consistent dwell times for variant A', () => {
      setVariant('scout.dwell', 'A');
      
      const times = getScoutDwellTimes();
      expect(times).toEqual({ info: 3000, calm: 4500 });
    });

    it('should return consistent dwell times for variant B', () => {
      setVariant('scout.dwell', 'B');
      
      const times = getScoutDwellTimes();
      expect(times).toEqual({ info: 3500, calm: 5000 });
    });

    it('should return consistent dwell times for variant C', () => {
      setVariant('scout.dwell', 'C');
      
      const times = getScoutDwellTimes();
      expect(times).toEqual({ info: 2500, calm: 4000 });
    });

    it('should fallback to variant A for invalid variant', () => {
      setVariant('scout.dwell', 'INVALID');
      
      const times = getScoutDwellTimes();
      expect(times).toEqual({ info: 3000, calm: 4500 });
    });
  });

  describe('Persistence', () => {
    it('should persist assignments across instances', () => {
      setVariant('persistence.test', 'B');
      
      // Simulate fresh load by creating new AB state
      const variant = getVariant('persistence.test', ['A', 'B', 'C']);
      expect(variant).toBe('B');
    });

    it('should handle corrupted localStorage gracefully', () => {
      mockLocalStorage.setItem('qi.ab.v1', 'invalid json');
      
      const variant = getVariant('corrupted.test', ['A', 'B']);
      expect(['A', 'B']).toContain(variant);
    });

    it('should handle missing version field gracefully', () => {
      mockLocalStorage.setItem('qi.ab.v1', JSON.stringify({ 
        assignments: { 'old.test': 'A' } 
      }));
      
      const variant = getVariant('version.test', ['A', 'B']);
      expect(['A', 'B']).toContain(variant);
    });
  });
});