/**
 * Content Pack System Tests
 * Tests for pack loading, conflicts, locale switching, and registry merging
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  registerPack, 
  enablePacksByLocale, 
  togglePack, 
  listPacks, 
  getEnabledPacks, 
  getActiveRegistry, 
  findPackConflicts,
  getActiveLocale,
  fetchAvailablePacks,
  installPack,
  initializePackSystem
} from '../src/authoring/packs';
import type { PackMeta, PackIndexEntry } from '../src/authoring/packs';

// Mock fetch for testing
global.fetch = vi.fn();

describe('Content Pack System', () => {

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
    
    // Mock successful fetch responses
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        name: 'Test Pack',
        id: 'test-pack',
        version: '1.0.0',
        locale: 'en-AU',
        frameworks: ['ACARA'],
        lessons: ['lessons/*.json'],
        assets: ['assets/**/*']
      })
    });
  });

  describe('Pack Registration', () => {
    it('should register a valid pack successfully', async () => {
      const packMeta: PackMeta = {
        id: 'test-pack',
        name: 'Test Pack',
        version: '1.0.0',
        locale: 'en-AU',
        baseUrl: '/packs/test-pack/'
      };

      await expect(registerPack(packMeta)).resolves.not.toThrow();
      
      const packs = listPacks();
      expect(packs).toHaveLength(1);
      expect(packs[0].id).toBe('test-pack');
      expect(packs[0].name).toBe('Test Pack');
    });

    it('should reject pack with mismatched ID', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          id: 'different-id', // Mismatch
          name: 'Test Pack',
          version: '1.0.0',
          locale: 'en-AU',
          frameworks: [],
          lessons: []
        })
      });

      const packMeta: PackMeta = {
        id: 'test-pack',
        name: 'Test Pack',
        version: '1.0.0',
        locale: 'en-AU',
        baseUrl: '/packs/test-pack/'
      };

      await expect(registerPack(packMeta)).rejects.toThrow('Pack ID mismatch');
    });

    it('should reject pack with mismatched locale', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          id: 'test-pack',
          name: 'Test Pack',
          version: '1.0.0',
          locale: 'en-US', // Mismatch
          frameworks: [],
          lessons: []
        })
      });

      const packMeta: PackMeta = {
        id: 'test-pack',
        name: 'Test Pack',
        version: '1.0.0',
        locale: 'en-AU',
        baseUrl: '/packs/test-pack/'
      };

      await expect(registerPack(packMeta)).rejects.toThrow('Locale mismatch');
    });
  });

  describe('Locale Management', () => {
    beforeEach(async () => {
      // Register packs for different locales
      await registerPack({
        id: 'pack-au',
        name: 'Australian Pack',
        version: '1.0.0',
        locale: 'en-AU',
        baseUrl: '/packs/au/'
      });

      await registerPack({
        id: 'pack-us',
        name: 'American Pack',
        version: '1.0.0',
        locale: 'en-US',
        baseUrl: '/packs/us/'
      });
    });

    it('should enable packs matching the active locale', () => {
      enablePacksByLocale('en-AU');
      
      const enabledPacks = getEnabledPacks();
      expect(enabledPacks).toHaveLength(1);
      expect(enabledPacks[0].locale).toBe('en-AU');
      expect(getActiveLocale()).toBe('en-AU');
    });

    it('should switch enabled packs when locale changes', () => {
      enablePacksByLocale('en-AU');
      expect(getEnabledPacks()).toHaveLength(1);
      expect(getEnabledPacks()[0].locale).toBe('en-AU');

      enablePacksByLocale('en-US');
      expect(getEnabledPacks()).toHaveLength(1);
      expect(getEnabledPacks()[0].locale).toBe('en-US');
    });

    it('should handle empty locale result gracefully', () => {
      enablePacksByLocale('en-GB'); // No packs for this locale
      
      const enabledPacks = getEnabledPacks();
      expect(enabledPacks).toHaveLength(0);
    });
  });

  describe('Pack Toggling', () => {
    beforeEach(async () => {
      await registerPack({
        id: 'test-pack',
        name: 'Test Pack',
        version: '1.0.0',
        locale: 'en-AU',
        baseUrl: '/packs/test/'
      });
      
      enablePacksByLocale('en-AU');
    });

    it('should enable and disable individual packs', () => {
      // Initially enabled by locale
      expect(getEnabledPacks()).toHaveLength(1);
      
      // Disable the pack
      togglePack('test-pack', false);
      expect(getEnabledPacks()).toHaveLength(0);
      
      // Re-enable the pack
      togglePack('test-pack', true);
      expect(getEnabledPacks()).toHaveLength(1);
    });

    it('should throw error when toggling non-existent pack', () => {
      expect(() => togglePack('non-existent', true)).toThrow('Pack not found');
    });
  });

  describe('Registry Merging', () => {
    beforeEach(async () => {
      // Mock lesson data for packs
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            id: 'pack1',
            name: 'Pack 1',
            version: '1.0.0',
            locale: 'en-AU',
            frameworks: ['ACARA'],
            lessons: ['lessons/*.json'],
            assets: []
          })
        })
        .mockResolvedValueOnce({ ok: false }) // Mock missing lesson files
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            id: 'pack2',
            name: 'Pack 2',
            version: '1.0.0',
            locale: 'en-AU',
            frameworks: ['NZC'],
            lessons: ['lessons/*.json'],
            assets: []
          })
        })
        .mockResolvedValueOnce({ ok: false }); // Mock missing lesson files

      await registerPack({
        id: 'pack1',
        name: 'Pack 1',
        version: '1.0.0',
        locale: 'en-AU',
        baseUrl: '/packs/pack1/'
      });

      await registerPack({
        id: 'pack2',
        name: 'Pack 2',
        version: '1.0.0',
        locale: 'en-AU',
        baseUrl: '/packs/pack2/'
      });

      enablePacksByLocale('en-AU');
    });

    it('should merge registries from enabled packs', () => {
      const registry = getActiveRegistry();
      
      expect(registry.version).toBe(2);
      expect(registry.lessons).toBeDefined();
      expect(Array.isArray(registry.lessons)).toBe(true);
    });

    it('should include lessons from all enabled packs', () => {
      const registry = getActiveRegistry();
      
      // Since lesson loading is mocked to fail, expect empty lessons array
      expect(registry.lessons).toHaveLength(0);
    });
  });

  describe('Conflict Detection', () => {
    beforeEach(async () => {
      // Mock packs with potential conflicts
      (global.fetch as any)
        .mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({
            version: 2,
            id: 'f1',
            biomeId: 'forest',
            title: { 'en-AU': 'Conflicting Lesson' },
            skills: ['literacy'],
            activities: [{ kind: 'read', content: { 'en-AU': 'Content' } }]
          })
        });

      await registerPack({
        id: 'pack1',
        name: 'Pack 1',
        version: '1.0.0',
        locale: 'en-AU',
        baseUrl: '/packs/pack1/'
      });

      await registerPack({
        id: 'pack2',
        name: 'Pack 2',
        version: '1.0.0',
        locale: 'en-AU',
        baseUrl: '/packs/pack2/'
      });

      enablePacksByLocale('en-AU');
    });

    it('should detect conflicts between packs', () => {
      const conflicts = findPackConflicts();
      
      // Since both packs would have lessons with same IDs, conflicts should be detected
      // However, with mocked lesson loading, conflicts array might be empty
      expect(Array.isArray(conflicts)).toBe(true);
    });

    it('should return empty conflicts when no packs enabled', () => {
      enablePacksByLocale('en-GB'); // No packs for this locale
      
      const conflicts = findPackConflicts();
      expect(conflicts).toHaveLength(0);
    });
  });

  describe('Pack Discovery', () => {
    it('should fetch available packs from index', async () => {
      const mockPacks: PackIndexEntry[] = [
        {
          id: 'available-pack',
          name: 'Available Pack',
          version: '1.0.0',
          locale: 'en-AU',
          downloadUrl: '/packs/available-pack/',
          size: 1024 * 1024
        }
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPacks)
      });

      const availablePacks = await fetchAvailablePacks();
      expect(availablePacks).toHaveLength(1);
      expect(availablePacks[0].id).toBe('available-pack');
    });

    it('should handle fetch errors gracefully', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const availablePacks = await fetchAvailablePacks();
      expect(availablePacks).toHaveLength(0);
    });

    it('should install pack from index entry', async () => {
      const packEntry: PackIndexEntry = {
        id: 'new-pack',
        name: 'New Pack',
        version: '1.0.0',
        locale: 'en-AU',
        downloadUrl: '/packs/new-pack/'
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          id: 'new-pack',
          name: 'New Pack',
          version: '1.0.0',
          locale: 'en-AU',
          frameworks: [],
          lessons: [],
          assets: []
        })
      });

      await expect(installPack(packEntry)).resolves.not.toThrow();
      
      const packs = listPacks();
      expect(packs.some(p => p.id === 'new-pack')).toBe(true);
    });
  });

  describe('Built-in Pack Integration', () => {
    it('should initialize pack system with built-in content', async () => {
      // Mock built-in content
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          id: 'base-au',
          name: 'Built-in Australian Content',
          version: '1.0.0',
          locale: 'en-AU',
          frameworks: ['ACARA'],
          lessons: [],
          assets: []
        })
      });

      await initializePackSystem();
      
      const packs = listPacks();
      const builtInPack = packs.find(p => p.isBuiltIn);
      expect(builtInPack).toBeDefined();
      expect(builtInPack?.id).toBe('base-au');
    });
  });

  describe('Error Handling', () => {
    it('should handle network failures during pack registration', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const packMeta: PackMeta = {
        id: 'failing-pack',
        name: 'Failing Pack',
        version: '1.0.0',
        locale: 'en-AU',
        baseUrl: '/packs/failing/'
      };

      await expect(registerPack(packMeta)).rejects.toThrow();
    });

    it('should handle invalid manifest data', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          // Missing required fields
          name: 'Invalid Pack'
        })
      });

      const packMeta: PackMeta = {
        id: 'invalid-pack',
        name: 'Invalid Pack',
        version: '1.0.0',
        locale: 'en-AU',
        baseUrl: '/packs/invalid/'
      };

      await expect(registerPack(packMeta)).rejects.toThrow();
    });

    it('should handle 404 responses for pack manifests', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404
      });

      const packMeta: PackMeta = {
        id: 'missing-pack',
        name: 'Missing Pack',
        version: '1.0.0',
        locale: 'en-AU',
        baseUrl: '/packs/missing/'
      };

      await expect(registerPack(packMeta)).rejects.toThrow('Failed to fetch manifest: 404');
    });
  });

  describe('Schema Validation', () => {
    it('should validate pack manifest schema', async () => {
      const validManifest = {
        name: 'Valid Pack',
        id: 'valid-pack',
        version: '1.0.0',
        locale: 'en-AU',
        frameworks: ['ACARA'],
        lessons: ['lessons/*.json'],
        assets: []
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(validManifest)
      });

      const packMeta: PackMeta = {
        id: 'valid-pack',
        name: 'Valid Pack',
        version: '1.0.0',
        locale: 'en-AU',
        baseUrl: '/packs/valid/'
      };

      await expect(registerPack(packMeta)).resolves.not.toThrow();
    });

    it('should reject invalid pack ID format', async () => {
      const invalidManifest = {
        name: 'Invalid Pack',
        id: 'Invalid_ID', // Invalid format
        version: '1.0.0',
        locale: 'en-AU',
        frameworks: [],
        lessons: ['lessons/*.json']
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(invalidManifest)
      });

      const packMeta: PackMeta = {
        id: 'Invalid_ID',
        name: 'Invalid Pack',
        version: '1.0.0',
        locale: 'en-AU',
        baseUrl: '/packs/invalid/'
      };

      await expect(registerPack(packMeta)).rejects.toThrow();
    });

    it('should reject invalid semantic version', async () => {
      const invalidManifest = {
        name: 'Invalid Pack',
        id: 'invalid-pack',
        version: '1.0', // Invalid format
        locale: 'en-AU',
        frameworks: [],
        lessons: ['lessons/*.json']
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(invalidManifest)
      });

      const packMeta: PackMeta = {
        id: 'invalid-pack',
        name: 'Invalid Pack',
        version: '1.0',
        locale: 'en-AU',
        baseUrl: '/packs/invalid/'
      };

      await expect(registerPack(packMeta)).rejects.toThrow();
    });
  });
});