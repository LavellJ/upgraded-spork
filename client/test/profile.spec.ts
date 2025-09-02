import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadProfile, saveProfile } from '../src/profile/model';
import type { Profile } from '../src/profile/model';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

// Replace the global localStorage with our mock
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('Profile Model', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  describe('loadProfile', () => {
    it('returns default profile on first run when localStorage is empty', () => {
      // Mock localStorage.getItem to return null (first run)
      localStorageMock.getItem.mockReturnValue(null);

      const result = loadProfile();

      expect(result).toEqual({
        version: 1,
        calmMode: true,
        createdAt: expect.any(Number),
        updatedAt: expect.any(Number)
      });
      expect(localStorageMock.getItem).toHaveBeenCalledWith('qi.profile.v1');
    });

    it('returns default profile when localStorage contains invalid JSON', () => {
      // Mock localStorage.getItem to return invalid JSON
      localStorageMock.getItem.mockReturnValue('invalid-json{');

      const result = loadProfile();

      expect(result).toEqual({
        version: 1,
        calmMode: true,
        createdAt: expect.any(Number),
        updatedAt: expect.any(Number)
      });
      expect(localStorageMock.getItem).toHaveBeenCalledWith('qi.profile.v1');
    });

    it('returns saved profile when localStorage contains valid profile data', () => {
      const savedProfile: Profile = {
        version: 1,
        name: 'Alex',
        ageBand: '7-8',
        avatarId: 'hero_forest',
        calmMode: false,
        reducedMotion: false,
        createdAt: 1640995200000,
        updatedAt: 1640995200000
      };

      // Mock localStorage.getItem to return valid profile JSON
      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedProfile));

      const result = loadProfile();

      expect(result).toEqual({
        ...savedProfile,
        version: 1 // Ensure version is always 1
      });
      expect(localStorageMock.getItem).toHaveBeenCalledWith('qi.profile.v1');
    });

    it('loads saved profile with partial data correctly', () => {
      const partialProfile = {
        name: 'Sam',
        ageBand: '9-10',
        calmMode: false,
        createdAt: 1640995200000,
        updatedAt: 1640995300000
      };

      // Mock localStorage.getItem to return partial profile
      localStorageMock.getItem.mockReturnValue(JSON.stringify(partialProfile));

      const result = loadProfile();

      expect(result).toEqual({
        ...partialProfile,
        version: 1
      });
      expect(localStorageMock.getItem).toHaveBeenCalledWith('qi.profile.v1');
    });
  });

  describe('saveProfile', () => {
    it('persists profile edits to localStorage', () => {
      const profileToSave: Profile = {
        version: 1,
        name: 'Jordan',
        ageBand: '5-6',
        avatarId: 'hero_ocean',
        calmMode: true,
        reducedMotion: true,
        createdAt: 1640995200000,
        updatedAt: 1640995200000
      };

      // Mock Date.now() to return a specific timestamp
      const mockTimestamp = 1640995300000;
      vi.spyOn(Date, 'now').mockReturnValue(mockTimestamp);

      saveProfile(profileToSave);

      const expectedProfile = {
        ...profileToSave,
        version: 1,
        updatedAt: mockTimestamp
      };

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'qi.profile.v1',
        JSON.stringify(expectedProfile)
      );
    });

    it('updates updatedAt timestamp when saving', () => {
      const profileToSave: Profile = {
        version: 1,
        name: 'Casey',
        ageBand: '11-12',
        avatarId: 'hero_night',
        calmMode: false,
        reducedMotion: false,
        createdAt: 1640995200000,
        updatedAt: 1640995200000 // Old timestamp
      };

      // Mock Date.now() to return a specific timestamp
      const mockTimestamp = 1640995400000;
      vi.spyOn(Date, 'now').mockReturnValue(mockTimestamp);

      saveProfile(profileToSave);

      const expectedProfile = {
        ...profileToSave,
        version: 1,
        updatedAt: mockTimestamp
      };

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'qi.profile.v1',
        JSON.stringify(expectedProfile)
      );
    });

    it('handles localStorage setItem errors gracefully', () => {
      const profileToSave: Profile = {
        version: 1,
        name: 'Riley',
        ageBand: '7-8',
        avatarId: 'hero_desert',
        calmMode: false,
        reducedMotion: false,
        createdAt: 1640995200000,
        updatedAt: 1640995200000
      };

      // Mock localStorage.setItem to throw an error
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      // Should not throw an error - errors are caught internally
      expect(() => saveProfile(profileToSave)).not.toThrow();
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });
  });
});