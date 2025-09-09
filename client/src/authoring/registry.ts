/**
 * Registry Integration with Pack System
 * 
 * Provides backward-compatible registry access while integrating
 * with the new content pack system for dynamic content loading.
 */

import { RegistryV2, LessonV2 } from './schema';
import { getActiveRegistry, initializePackSystem } from './packs';

// Legacy registry cache for backward compatibility
let legacyRegistryCache: any = null;
let isPackSystemInitialized = false;

/**
 * Initialize the registry system
 * This sets up the pack system and built-in content
 */
export async function initializeRegistry(): Promise<void> {
  if (!isPackSystemInitialized) {
    await initializePackSystem();
    isPackSystemInitialized = true;
  }
}

/**
 * Get the active registry (v2 format)
 * This is the primary method for accessing lesson content
 */
export function getRegistry(): RegistryV2 {
  if (!isPackSystemInitialized) {
    console.warn('Registry not initialized, returning empty registry');
    return { version: 2, lessons: [] };
  }
  
  return getActiveRegistry();
}

/**
 * Get lessons from the active registry
 */
export function getLessons(): LessonV2[] {
  const registry = getRegistry();
  return registry.lessons || [];
}

/**
 * Get a lesson by ID from the active registry
 */
export function getLessonById(id: string): LessonV2 | undefined {
  const lessons = getLessons();
  return lessons.find(lesson => lesson.id === id);
}

/**
 * Get lessons for a specific biome
 */
export function getLessonsByBiome(biomeId: string): LessonV2[] {
  const lessons = getLessons();
  return lessons.filter(lesson => lesson.biomeId === biomeId);
}

/**
 * Get skills from the active registry
 */
export function getSkills(): Array<{ id: string; label: Record<string, string> }> {
  const registry = getRegistry();
  return registry.skills || [];
}

/**
 * Get frameworks from the active registry
 */
export function getFrameworks(): Record<string, string[]> {
  const registry = getRegistry();
  return registry.frameworks || {};
}

// ---- Legacy Compatibility Layer ----

/**
 * Load legacy registry.json for backward compatibility
 * This is used when the pack system is not available
 */
async function loadLegacyRegistry(): Promise<any> {
  if (legacyRegistryCache) {
    return legacyRegistryCache;
  }

  try {
    const response = await fetch('/data/registry.json');
    if (!response.ok) {
      throw new Error(`Failed to load registry: ${response.status}`);
    }
    
    legacyRegistryCache = await response.json();
    return legacyRegistryCache;
  } catch (error) {
    console.error('Failed to load legacy registry:', error);
    return null;
  }
}

/**
 * Get legacy lesson data (v1 format)
 * Used for backward compatibility with existing code
 */
export async function getLegacyLessons(): Promise<any[]> {
  // Try pack system first
  if (isPackSystemInitialized) {
    const registry = getActiveRegistry();
    // Convert v2 lessons to legacy format if needed
    return registry.lessons.map(lesson => ({
      ...lesson,
      // Add any legacy fields that might be expected
    }));
  }

  // Fallback to legacy registry
  const legacy = await loadLegacyRegistry();
  return legacy?.lessons || [];
}

/**
 * Get legacy loop data for biome navigation
 * Used for backward compatibility with existing biome components
 */
export async function getLegacyLoopData(): Promise<Record<string, any[]>> {
  // Try pack system first
  if (isPackSystemInitialized) {
    const lessons = getLessons();
    const loopData: Record<string, any[]> = {};
    
    // Group lessons by biome for legacy format
    lessons.forEach(lesson => {
      if (!loopData[lesson.biomeId]) {
        loopData[lesson.biomeId] = [];
      }
      
      loopData[lesson.biomeId].push({
        id: lesson.id,
        title: lesson.title['en-AU'] || lesson.title['en-US'] || lesson.title['en-GB'] || 'Untitled',
        // Add other legacy fields as needed
      });
    });
    
    return loopData;
  }

  // Fallback to legacy loop files
  try {
    const [loop1Response, loop2Response] = await Promise.all([
      fetch('/data/loop1.json'),
      fetch('/data/loop2.json')
    ]);
    
    const loop1 = loop1Response.ok ? await loop1Response.json() : {};
    const loop2 = loop2Response.ok ? await loop2Response.json() : {};
    
    return { ...loop1, ...loop2 };
  } catch (error) {
    console.error('Failed to load legacy loop data:', error);
    return {};
  }
}

/**
 * Check if a lesson exists in the active registry
 */
export function hasLesson(id: string): boolean {
  return getLessonById(id) !== undefined;
}

/**
 * Get lesson count for a biome
 */
export function getLessonCount(biomeId?: string): number {
  if (biomeId) {
    return getLessonsByBiome(biomeId).length;
  }
  return getLessons().length;
}

/**
 * Search lessons by text content
 */
export function searchLessons(query: string): LessonV2[] {
  const lessons = getLessons();
  const lowercaseQuery = query.toLowerCase();
  
  return lessons.filter(lesson => {
    // Search in title (all locales)
    const titleMatch = Object.values(lesson.title).some(title => 
      title?.toLowerCase().includes(lowercaseQuery)
    );
    
    // Search in summary (all locales)
    const summaryMatch = lesson.summary ? 
      Object.values(lesson.summary).some(summary => 
        summary?.toLowerCase().includes(lowercaseQuery)
      ) : false;
    
    // Search in lesson ID
    const idMatch = lesson.id.toLowerCase().includes(lowercaseQuery);
    
    // Search in skills
    const skillsMatch = lesson.skills.some(skill => 
      skill.toLowerCase().includes(lowercaseQuery)
    );
    
    return titleMatch || summaryMatch || idMatch || skillsMatch;
  });
}

// ---- Initialization ----

// Auto-initialize when module loads
// Temporarily disabled to fix console errors - the app has built-in content in App.tsx
// if (typeof window !== 'undefined') {
//   initializeRegistry().catch(error => {
//     console.error('Failed to initialize registry:', error);
//   });
// }