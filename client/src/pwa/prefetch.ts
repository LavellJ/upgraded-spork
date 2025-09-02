// Asset prefetching for next lessons with low-memory guard

import { isLowMemory } from '../device/memory';
import { getAsset } from '../lib/assetResolver';

// Settings key for prefetch preference
const PREFETCH_SETTINGS_KEY = 'qi.prefetch.v1';

// Lesson order as defined in QuestIsland.tsx
const LESSON_ORDER = [
  "beach-1", "beach-2", "beach-3", 
  "jungle-1", "jungle-2", "jungle-3", 
  "volcano-1", "volcano-2", "volcano-3", 
  "lagoon-1", "lagoon-2", "lagoon-3"
];

// Biome mapping for lessons
const LESSON_BIOMES: Record<string, string> = {
  "beach-1": "beach", "beach-2": "beach", "beach-3": "beach",
  "jungle-1": "forest", "jungle-2": "forest", "jungle-3": "forest", 
  "volcano-1": "desert", "volcano-2": "desert", "volcano-3": "desert",
  "lagoon-1": "ocean", "lagoon-2": "ocean", "lagoon-3": "ocean"
};

// Legacy biome to standard ID mapping (from Biome.tsx)
const BIOME_ID_MAP: Record<string, string> = {
  'beach': 'ocean',
  'forest': 'forest', 
  'desert': 'desert',
  'ocean': 'night'
};

interface PrefetchSettings {
  enabled: boolean;
  lastUpdated: number;
}

/**
 * Get prefetch settings with defaults
 */
export function getPrefetchSettings(): PrefetchSettings {
  try {
    const stored = localStorage.getItem(PREFETCH_SETTINGS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn('Failed to load prefetch settings:', error);
  }
  
  // Default based on device memory
  return {
    enabled: !isLowMemory(), // Auto-disable on low memory devices
    lastUpdated: Date.now()
  };
}

/**
 * Save prefetch settings
 */
export function savePrefetchSettings(settings: PrefetchSettings): void {
  try {
    const settingsToSave = {
      ...settings,
      lastUpdated: Date.now()
    };
    localStorage.setItem(PREFETCH_SETTINGS_KEY, JSON.stringify(settingsToSave));
  } catch (error) {
    console.warn('Failed to save prefetch settings:', error);
  }
}

/**
 * Get next N lessons based on current progress
 */
export function getNextLessons(lessonProgress: Record<string, any>, count: number = 2): string[] {
  const nextLessons: string[] = [];
  
  for (const lessonId of LESSON_ORDER) {
    if (nextLessons.length >= count) break;
    
    const lesson = lessonProgress[lessonId];
    if (!lesson?.completed && !lesson?.locked) {
      nextLessons.push(lessonId);
    }
  }
  
  return nextLessons;
}

/**
 * Get asset URLs for a lesson
 */
export function getLessonAssets(lessonId: string): string[] {
  const assets: string[] = [];
  
  // Get biome background
  const biome = LESSON_BIOMES[lessonId];
  if (biome) {
    const standardBiomeId = BIOME_ID_MAP[biome] || biome;
    assets.push(getAsset('biome', standardBiomeId));
  }
  
  // Get lesson pin/node assets
  assets.push(getAsset('ui', 'balloon')); // For completed state
  assets.push(getAsset('ui', 'lock'));    // For locked state
  
  // Could add lesson-specific pins if they exist
  // assets.push(getAsset('pin', lessonId));
  
  return assets.filter(Boolean); // Remove any empty/null assets
}

/**
 * Prefetch an image asset
 */
async function prefetchImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if already prefetched
    const existingLink = document.querySelector(`link[rel="prefetch"][href="${url}"]`);
    if (existingLink) {
      resolve();
      return;
    }
    
    // Create prefetch link
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.as = 'image';
    link.href = url;
    
    link.onload = () => resolve();
    link.onerror = () => reject(new Error(`Failed to prefetch: ${url}`));
    
    document.head.appendChild(link);
    
    // Cleanup after timeout
    setTimeout(() => {
      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
      resolve(); // Don't reject on timeout
    }, 30000); // 30 second timeout
  });
}

/**
 * Prefetch JSON/content via fetch (will be cached by SW)
 */
async function prefetchContent(url: string): Promise<void> {
  try {
    const response = await fetch(url, { 
      method: 'GET',
      cache: 'default' // Use browser cache
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    // Don't need to read the response, just fetching triggers caching
  } catch (error) {
    console.debug('Prefetch content failed:', url, error);
    // Don't throw - prefetch failures shouldn't break the app
  }
}

/**
 * Main prefetch function for lesson assets
 */
export async function prefetchLessonAssets(
  lessonProgress: Record<string, any>, 
  options: { maxLessons?: number } = {}
): Promise<void> {
  const settings = getPrefetchSettings();
  
  // Skip if disabled or on low memory device or offline
  if (!settings.enabled || isLowMemory() || !navigator.onLine) {
    console.debug('Prefetch skipped:', { 
      enabled: settings.enabled, 
      lowMemory: isLowMemory(), 
      online: navigator.onLine 
    });
    return;
  }
  
  const { maxLessons = 2 } = options;
  const nextLessons = getNextLessons(lessonProgress, maxLessons);
  
  if (nextLessons.length === 0) {
    console.debug('No lessons to prefetch');
    return;
  }
  
  console.debug('Prefetching assets for lessons:', nextLessons);
  
  const prefetchPromises: Promise<void>[] = [];
  
  for (const lessonId of nextLessons) {
    const assets = getLessonAssets(lessonId);
    
    for (const assetUrl of assets) {
      // Prefetch images via link tags
      if (assetUrl.match(/\.(png|jpg|jpeg|webp)$/i)) {
        prefetchPromises.push(prefetchImage(assetUrl));
      } 
      // Prefetch other content via fetch
      else if (assetUrl.match(/\.(json|js)$/i)) {
        prefetchPromises.push(prefetchContent(assetUrl));
      }
    }
  }
  
  // Execute all prefetches in parallel with timeout
  try {
    await Promise.allSettled(prefetchPromises);
    console.debug('Prefetch completed for', nextLessons.length, 'lessons');
  } catch (error) {
    console.debug('Prefetch error:', error);
  }
}

/**
 * Scheduled prefetch with delay to avoid blocking main thread
 */
export function schedulePrefetch(
  lessonProgress: Record<string, any>, 
  delay: number = 0
): void {
  setTimeout(() => {
    prefetchLessonAssets(lessonProgress).catch(error => {
      console.debug('Scheduled prefetch failed:', error);
    });
  }, delay);
}

/**
 * Clear all prefetch link tags
 */
export function clearPrefetchCache(): void {
  const prefetchLinks = document.querySelectorAll('link[rel="prefetch"]');
  prefetchLinks.forEach(link => {
    if (link.parentNode) {
      link.parentNode.removeChild(link);
    }
  });
  console.debug('Cleared', prefetchLinks.length, 'prefetch links');
}