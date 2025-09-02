import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { encodeToLink, decodeFromQuery } from '../src/guide/assign';
import type { AssignedPath } from '../src/guide/assign';

describe('assignment encoding/decoding', () => {
  // Mock localStorage for testing
  const localStorageMock = (() => {
    let store: { [key: string]: string } = {};
    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => { store[key] = value; },
      removeItem: (key: string) => { delete store[key]; },
      clear: () => { store = {}; }
    };
  })();

  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true
    });
    localStorageMock.clear();
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  describe('encodeToLink and decodeFromQuery roundtrip', () => {
    it('correctly encodes and decodes assignment data', () => {
      const originalAssignment: AssignedPath = {
        id: 'test-assignment-123',
        name: 'Math Fundamentals',
        lessonIds: ['forest.counting.1', 'forest.counting.2', 'forest.addition.1'],
        createdAt: 1672531200000, // 2023-01-01
        expiresAt: 1672617600000 // 2023-01-02
      };

      // Encode to link
      const link = encodeToLink(originalAssignment);
      expect(link).toContain('?assign=');
      
      // Extract the assign parameter
      const url = new URL(link);
      const assignParam = url.searchParams.get('assign');
      expect(assignParam).toBeTruthy();

      // Decode from URL search params
      const decodedAssignment = decodeFromQuery(url.search);
      
      // Verify all fields match
      expect(decodedAssignment).toEqual(originalAssignment);
    });

    it('handles assignments with special characters', () => {
      const assignment: AssignedPath = {
        id: 'special-chars-test',
        name: 'Math & Science: "Advanced" Topics',
        lessonIds: ['desert.shapes.1'],
        createdAt: 1672531200000
      };

      const link = encodeToLink(assignment);
      const url = new URL(link);
      const decoded = decodeFromQuery(url.search);
      
      expect(decoded).toEqual(assignment);
    });

    it('handles empty lesson IDs array', () => {
      const assignment: AssignedPath = {
        id: 'empty-lessons',
        name: 'No Lessons Yet',
        lessonIds: [],
        createdAt: 1672531200000
      };

      const link = encodeToLink(assignment);
      const url = new URL(link);
      const decoded = decodeFromQuery(url.search);
      
      expect(decoded).toEqual(assignment);
    });

    it('handles unicode characters in assignment data', () => {
      const assignment: AssignedPath = {
        id: 'unicode-test',
        name: '数学基础 - Math Fundamentals',
        lessonIds: ['night.astronomy.1'],
        createdAt: 1672531200000
      };

      const link = encodeToLink(assignment);
      const url = new URL(link);
      const decoded = decodeFromQuery(url.search);
      
      expect(decoded).toEqual(assignment);
    });

    it('produces URL-safe encoded strings', () => {
      const assignment: AssignedPath = {
        id: 'url-safety-test',
        name: 'URL Safety Test with Many Special Characters!@#$%^&*()',
        lessonIds: ['forest.test.1'],
        createdAt: 1672531200000
      };

      const link = encodeToLink(assignment);
      const url = new URL(link);
      const assignParam = url.searchParams.get('assign');
      
      // Encoded string should not contain problematic URL characters
      expect(assignParam).not.toContain('+');
      expect(assignParam).not.toContain('/');
      expect(assignParam).not.toContain('=');
      
      // Should still decode correctly
      const decoded = decodeFromQuery(url.search);
      expect(decoded).toEqual(assignment);
    });
  });

  describe('decodeFromQuery error handling', () => {
    it('returns null for invalid base64', () => {
      const result = decodeFromQuery('?assign=invalid-base64!@#');
      expect(result).toBeNull();
    });

    it('returns null for valid base64 but invalid JSON', () => {
      // Valid base64 that decodes to invalid JSON
      const invalidJson = btoa('{ invalid json }');
      const result = decodeFromQuery(`?assign=${invalidJson}`);
      expect(result).toBeNull();
    });

    it('returns null for empty string', () => {
      const result = decodeFromQuery('');
      expect(result).toBeNull();
    });

    it('returns null for search without assign parameter', () => {
      const result = decodeFromQuery('?other=value');
      expect(result).toBeNull();
    });

    it('returns null for expired assignments', () => {
      const expiredAssignment: AssignedPath = {
        id: 'expired-test',
        name: 'Expired Assignment',
        lessonIds: ['forest.test.1'],
        createdAt: 1672531200000,
        expiresAt: 1672531200001 // Expired immediately
      };

      const link = encodeToLink(expiredAssignment);
      const url = new URL(link);
      
      // Decode should return null for expired assignment
      const decoded = decodeFromQuery(url.search);
      expect(decoded).toBeNull();
    });
  });

  describe('assignment structure validation', () => {
    it('validates required fields in decoded assignments', () => {
      // Create a malformed assignment (missing required fields)
      const malformed = {
        id: 'test',
        // missing name and lessonIds
        createdAt: Date.now()
      };

      const encoded = btoa(JSON.stringify(malformed));
      const result = decodeFromQuery(`?assign=${encoded}`);
      
      expect(result).toBeNull();
    });

    it('validates lessonIds is an array', () => {
      const malformed = {
        id: 'test',
        name: 'Test',
        lessonIds: 'not-an-array', // Should be array
        createdAt: Date.now()
      };

      const encoded = btoa(JSON.stringify(malformed));
      const result = decodeFromQuery(`?assign=${encoded}`);
      
      expect(result).toBeNull();
    });
  });

  describe('integration test - full assignment workflow', () => {
    it('completes full workflow: create, encode, share, decode', () => {
      // 1. Create assignment
      const assignment: AssignedPath = {
        id: 'integration-test',
        name: 'Integration Test Assignment',
        lessonIds: ['forest.counting.1', 'forest.counting.2'],
        createdAt: 1672531200000
      };

      // 2. Encode to shareable link
      const shareLink = encodeToLink(assignment);
      expect(shareLink).toContain('?assign=');

      // 3. Extract and decode the assignment (as if receiving the link)
      const url = new URL(shareLink);
      const receivedAssignment = decodeFromQuery(url.search);
      expect(receivedAssignment).toEqual(assignment);
    });

    it('handles assignments without expiry dates', () => {
      const assignment: AssignedPath = {
        id: 'no-expiry-test',
        name: 'Assignment Without Expiry',
        lessonIds: ['forest.counting.1'],
        createdAt: 1672531200000
        // No expiresAt field
      };

      const link = encodeToLink(assignment);
      const url = new URL(link);
      const decoded = decodeFromQuery(url.search);
      
      expect(decoded).toEqual(assignment);
    });
  });
});