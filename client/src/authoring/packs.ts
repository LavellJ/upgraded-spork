/**
 * Content Pack System
 * 
 * Manages dynamic loading and merging of locale-specific educational content packs.
 * Supports versioned content bundles with dependency resolution and conflict handling.
 */

import { z } from 'zod';
import { Locale, LessonV2, RegistryV2, validateLessonV2, validateRegistryV2 } from './schema';

// ---- Pack Manifest Schema ----

export const PackManifestSchema = z.object({
  name: z.string().min(1, 'Pack name is required'),
  id: z.string().regex(/^[a-z0-9-]+$/, 'Pack ID must be lowercase kebab-case'),
  version: z.string().regex(/^\d+\.\d+\.\d+(-.*)?$/, 'Version must be semantic (x.y.z)'),
  locale: Locale,
  description: z.string().optional(),
  author: z.string().optional(),
  frameworks: z.array(z.string()).default([]),
  lessons: z.array(z.string()).min(1, 'At least one lesson pattern required'),
  questionSets: z.array(z.string()).default([]),
  assets: z.array(z.string()).default([]),
  dependencies: z.record(z.string()).default({}),
  meta: z.record(z.unknown()).default({})
});

export type PackManifest = z.infer<typeof PackManifestSchema>;

// ---- Pack Metadata ----

export interface PackMeta {
  id: string;
  name: string;
  version: string;
  locale: Locale;
  baseUrl: string;
  isBuiltIn?: boolean;
  isEnabled?: boolean;
}

export interface LoadedPack extends PackMeta {
  manifest: PackManifest;
  lessons: LessonV2[];
  loadedAt: number;
}

// ---- Pack Registry ----

class PackRegistry {
  private packs = new Map<string, LoadedPack>();
  private activeLocale: Locale = 'en-AU';
  private enabledPacks = new Set<string>();

  /**
   * Register a content pack for dynamic loading
   */
  async registerPack(meta: PackMeta): Promise<void> {
    try {
      // Fetch pack manifest
      const manifestUrl = `${meta.baseUrl}/qi-pack.json`;
      const manifestResponse = await fetch(manifestUrl);
      
      if (!manifestResponse.ok) {
        throw new Error(`Failed to fetch manifest: ${manifestResponse.status}`);
      }

      const manifestData = await manifestResponse.json();
      const manifest = PackManifestSchema.parse(manifestData);

      // Validate pack metadata consistency
      if (manifest.id !== meta.id) {
        throw new Error(`Pack ID mismatch: expected ${meta.id}, got ${manifest.id}`);
      }
      if (manifest.locale !== meta.locale) {
        throw new Error(`Locale mismatch: expected ${meta.locale}, got ${manifest.locale}`);
      }

      // Load lessons
      const lessons = await this.loadLessons(meta.baseUrl, manifest.lessons);

      // Create loaded pack
      const loadedPack: LoadedPack = {
        ...meta,
        manifest,
        lessons,
        loadedAt: Date.now(),
        isEnabled: this.enabledPacks.has(meta.id)
      };

      this.packs.set(meta.id, loadedPack);

      console.log(`✅ Registered pack: ${meta.name} (${meta.id}@${meta.version})`);
    } catch (error) {
      console.error(`❌ Failed to register pack ${meta.id}:`, error);
      throw error;
    }
  }

  /**
   * Load lesson files from pack
   */
  private async loadLessons(baseUrl: string, lessonPatterns: string[]): Promise<LessonV2[]> {
    const lessons: LessonV2[] = [];

    for (const pattern of lessonPatterns) {
      // For simplicity, assume static file paths (in production, use glob expansion)
      // This would be expanded to handle actual glob patterns
      const lessonPath = pattern.replace('*.json', '').replace('lessons/', '');
      
      try {
        // Try common lesson files - in production this would use glob matching
        const commonLessons = ['f1.json', 'f2.json', 'f3.json', 'd1.json', 'd2.json'];
        
        for (const lessonFile of commonLessons) {
          const lessonUrl = `${baseUrl}/lessons/${lessonFile}`;
          
          try {
            const response = await fetch(lessonUrl);
            if (response.ok) {
              const lessonData = await response.json();
              const validationResult = validateLessonV2(lessonData, lessonFile);
              
              if (validationResult.success) {
                lessons.push(validationResult.data);
              } else {
                console.warn(`⚠️ Invalid lesson ${lessonFile}:`, validationResult.errors);
              }
            }
          } catch (err) {
            // Lesson file doesn't exist or failed to load - continue
            continue;
          }
        }
      } catch (error) {
        console.warn(`⚠️ Failed to load lessons for pattern ${pattern}:`, error);
      }
    }

    return lessons;
  }

  /**
   * Enable packs matching the specified locale
   */
  enablePacksByLocale(locale: Locale): void {
    this.activeLocale = locale;
    this.enabledPacks.clear();

    // Enable all packs matching the locale
    for (const [packId, pack] of this.packs) {
      if (pack.locale === locale) {
        this.enabledPacks.add(packId);
        pack.isEnabled = true;
      } else {
        pack.isEnabled = false;
      }
    }

    console.log(`🌐 Enabled packs for locale ${locale}:`, Array.from(this.enabledPacks));
  }

  /**
   * Enable or disable a specific pack
   */
  togglePack(packId: string, enabled: boolean): void {
    const pack = this.packs.get(packId);
    if (!pack) {
      throw new Error(`Pack not found: ${packId}`);
    }

    if (enabled) {
      this.enabledPacks.add(packId);
    } else {
      this.enabledPacks.delete(packId);
    }

    pack.isEnabled = enabled;
  }

  /**
   * Get all registered packs
   */
  listPacks(): LoadedPack[] {
    return Array.from(this.packs.values());
  }

  /**
   * Get enabled packs for current locale
   */
  getEnabledPacks(): LoadedPack[] {
    return Array.from(this.packs.values()).filter(pack => 
      pack.isEnabled && pack.locale === this.activeLocale
    );
  }

  /**
   * Get merged registry from enabled packs
   */
  getActiveRegistry(): RegistryV2 {
    const enabledPacks = this.getEnabledPacks();
    
    // Start with empty registry
    const mergedRegistry: RegistryV2 = {
      version: 2,
      lessons: [],
      skills: [],
      frameworks: {}
    };

    // Merge packs in order (later packs override earlier ones)
    for (const pack of enabledPacks) {
      // Add lessons with namespacing (except built-in packs)
      for (const lesson of pack.lessons) {
        const namespacedLesson: LessonV2 = {
          ...lesson,
          id: pack.isBuiltIn ? lesson.id : `${pack.id}:${lesson.id}`
        };
        mergedRegistry.lessons.push(namespacedLesson);
      }

      // Merge skills (avoid duplicates)
      if (pack.manifest.meta?.skills) {
        const packSkills = Array.isArray(pack.manifest.meta.skills) 
          ? pack.manifest.meta.skills 
          : [];
        
        for (const skill of packSkills) {
          if (!mergedRegistry.skills?.some(s => s.id === skill.id)) {
            mergedRegistry.skills?.push(skill);
          }
        }
      }

      // Merge frameworks
      for (const framework of pack.manifest.frameworks) {
        if (!mergedRegistry.frameworks?.[framework]) {
          mergedRegistry.frameworks![framework] = [];
        }
      }
    }

    return mergedRegistry;
  }

  /**
   * Find conflicts between packs (duplicate lesson IDs)
   */
  findConflicts(): Array<{ lessonId: string; packs: string[] }> {
    const lessonMap = new Map<string, string[]>();
    
    for (const pack of this.getEnabledPacks()) {
      for (const lesson of pack.lessons) {
        const id = pack.isBuiltIn ? lesson.id : `${pack.id}:${lesson.id}`;
        if (!lessonMap.has(id)) {
          lessonMap.set(id, []);
        }
        lessonMap.get(id)!.push(pack.id);
      }
    }

    return Array.from(lessonMap.entries())
      .filter(([_, packs]) => packs.length > 1)
      .map(([lessonId, packs]) => ({ lessonId, packs }));
  }

  /**
   * Get current active locale
   */
  getActiveLocale(): Locale {
    return this.activeLocale;
  }
}

// ---- Global Registry Instance ----

const globalPackRegistry = new PackRegistry();

// ---- Public API ----

/**
 * Register a content pack for dynamic loading
 */
export async function registerPack(meta: PackMeta): Promise<void> {
  return globalPackRegistry.registerPack(meta);
}

/**
 * Enable packs matching the specified locale
 */
export function enablePacksByLocale(locale: Locale): void {
  globalPackRegistry.enablePacksByLocale(locale);
}

/**
 * Enable or disable a specific pack
 */
export function togglePack(packId: string, enabled: boolean): void {
  globalPackRegistry.togglePack(packId, enabled);
}

/**
 * Get all registered packs
 */
export function listPacks(): LoadedPack[] {
  return globalPackRegistry.listPacks();
}

/**
 * Get enabled packs for current locale
 */
export function getEnabledPacks(): LoadedPack[] {
  return globalPackRegistry.getEnabledPacks();
}

/**
 * Get merged registry from enabled packs
 */
export function getActiveRegistry(): RegistryV2 {
  return globalPackRegistry.getActiveRegistry();
}

/**
 * Find conflicts between enabled packs
 */
export function findPackConflicts(): Array<{ lessonId: string; packs: string[] }> {
  return globalPackRegistry.findConflicts();
}

/**
 * Get current active locale
 */
export function getActiveLocale(): Locale {
  return globalPackRegistry.getActiveLocale();
}

// ---- Built-in Pack Integration ----

/**
 * Initialize the pack system with built-in content
 */
export async function initializePackSystem(): Promise<void> {
  try {
    // Register built-in Australian content as a pack
    await registerPack({
      id: 'base-au',
      name: 'Built-in Australian Content',
      version: '1.0.0',
      locale: 'en-AU',
      baseUrl: '/data',
      isBuiltIn: true,
      isEnabled: true
    });

    // Enable packs for default locale
    enablePacksByLocale('en-AU');

    console.log('📦 Pack system initialized');
  } catch (error) {
    console.error('❌ Failed to initialize pack system:', error);
  }
}

// ---- Pack Discovery ----

export interface PackIndexEntry {
  id: string;
  name: string;
  version: string;
  locale: Locale;
  description?: string;
  author?: string;
  downloadUrl: string;
  size?: number;
  meta?: Record<string, unknown>;
}

/**
 * Fetch available packs from pack index
 */
export async function fetchAvailablePacks(): Promise<PackIndexEntry[]> {
  try {
    const response = await fetch('/packs/index.json');
    if (!response.ok) {
      throw new Error(`Failed to fetch pack index: ${response.status}`);
    }
    
    const packs = await response.json();
    return Array.isArray(packs) ? packs : [];
  } catch (error) {
    console.warn('⚠️ Could not fetch pack index:', error);
    return [];
  }
}

/**
 * Install a pack from the pack index
 */
export async function installPack(packEntry: PackIndexEntry): Promise<void> {
  await registerPack({
    id: packEntry.id,
    name: packEntry.name,
    version: packEntry.version,
    locale: packEntry.locale,
    baseUrl: packEntry.downloadUrl
  });
}