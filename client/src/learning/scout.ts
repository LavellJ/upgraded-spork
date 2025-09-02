// Scout lines loader and selector with age-appropriate variants and LRU tracking
// Supports localization and avoids showing the same messages repeatedly

import scoutLinesData from '../data/scout_lines.json';
import type { ScoutPriority } from '../hooks/useScoutQueue';

export interface ScoutLine {
  id: string;
  priority: ScoutPriority;
  text: string;
  cta?: string;
}

export interface ScoutLinesData {
  locale: string;
  groups: {
    [groupId: string]: {
      [ageBand: string]: ScoutLine[];
    };
  };
}

export interface PickedScoutLine {
  id: string;
  priority: ScoutPriority;
  text: string;
  ctaLabel?: string;
}

// LRU tracking for recent lines to avoid repeats
const RECENT_LINES_CACHE_SIZE = 10;
let recentLines: string[] = [];

// Cache for loaded scout lines data
let loadedScoutLines: ScoutLinesData | null = null;

/**
 * Load Scout lines from JSON with locale fallback
 */
export function loadScoutLines(locale: string = 'en-AU'): ScoutLinesData {
  if (loadedScoutLines) {
    return loadedScoutLines;
  }

  try {
    // For now, we only have en-AU data, so use it as fallback
    loadedScoutLines = scoutLinesData as ScoutLinesData;
    return loadedScoutLines;
  } catch (error) {
    console.warn('Failed to load scout lines, using fallback:', error);
    // Fallback minimal data
    return {
      locale: 'en',
      groups: {
        error_recovery: {
          all: [
            {
              id: 'fallback_error',
              priority: 'critical',
              text: "I'm having trouble loading my messages, but I'm still here to help!",
              cta: 'Continue'
            }
          ]
        }
      }
    };
  }
}

/**
 * Map age (number) or ageBand (string) to appropriate bucket for content selection
 */
function getAgeBucket(age?: number | string): string {
  if (!age) return 'all';
  
  // Handle AgeBand strings
  if (typeof age === 'string') {
    switch (age) {
      case '5-6':
      case '7-8':
        return '5-8';
      case '9-10':
      case '11-12':
        return '9-12';
      default:
        return '5-8';
    }
  }
  
  // Handle numeric age
  if (age >= 5 && age <= 8) return '5-8';
  if (age >= 9 && age <= 12) return '9-12';
  
  // Default to younger content for safety
  return '5-8';
}

/**
 * Add line ID to recent lines cache to avoid repeats
 */
function addToRecentLines(lineId: string): void {
  // Remove if already in cache
  recentLines = recentLines.filter(id => id !== lineId);
  
  // Add to front
  recentLines.unshift(lineId);
  
  // Trim to cache size
  if (recentLines.length > RECENT_LINES_CACHE_SIZE) {
    recentLines = recentLines.slice(0, RECENT_LINES_CACHE_SIZE);
  }
}

/**
 * Check if a line was shown recently (LRU avoidance)
 */
function wasShownRecently(lineId: string): boolean {
  return recentLines.includes(lineId);
}

/**
 * Apply template variables to Scout line text
 */
function applyTemplate(text: string, variables: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (match, key) => {
    const value = variables[key];
    return value !== undefined ? String(value) : match;
  });
}

/**
 * Pick an appropriate Scout line from a group based on profile and context
 */
export function pickScoutLine(
  groupId: string,
  profile: { age?: number | string; name?: string },
  templateVars: Record<string, string | number> = {},
  rng: () => number = Math.random
): PickedScoutLine | null {
  const scoutLines = loadScoutLines();
  const group = scoutLines.groups[groupId];
  
  if (!group) {
    console.warn(`Scout group '${groupId}' not found`);
    return null;
  }
  
  // Determine age bucket
  const ageBucket = getAgeBucket(profile.age);
  
  // Try age-specific bucket first, then fallback to 'all'
  let candidates = group[ageBucket] || group['all'];
  
  if (!candidates || candidates.length === 0) {
    console.warn(`No scout lines found for group '${groupId}' and age bucket '${ageBucket}'`);
    return null;
  }
  
  // Filter out recently shown lines for variety (unless all have been shown recently)
  const freshCandidates = candidates.filter(line => !wasShownRecently(line.id));
  const finalCandidates = freshCandidates.length > 0 ? freshCandidates : candidates;
  
  // Select random candidate
  const selectedIndex = Math.floor(rng() * finalCandidates.length);
  const selected = finalCandidates[selectedIndex];
  
  // Track this selection to avoid immediate repeats
  addToRecentLines(selected.id);
  
  // Apply template variables (name, streak count, etc.)
  const templateContext = {
    name: profile.name || 'explorer',
    ...templateVars
  };
  
  const processedText = applyTemplate(selected.text, templateContext);
  
  return {
    id: selected.id,
    priority: selected.priority,
    text: processedText,
    ctaLabel: selected.cta
  };
}

/**
 * Reset recent lines cache (useful for testing)
 */
export function resetRecentLines(): void {
  recentLines = [];
}

/**
 * Get current recent lines (useful for debugging)
 */
export function getRecentLines(): string[] {
  return [...recentLines];
}

/**
 * Check if a specific group and age bucket combination exists
 */
export function hasScoutGroup(groupId: string, age?: number | string): boolean {
  const scoutLines = loadScoutLines();
  const group = scoutLines.groups[groupId];
  
  if (!group) return false;
  
  const ageBucket = getAgeBucket(age);
  return !!(group[ageBucket] || group['all']);
}

/**
 * Get all available group IDs
 */
export function getAvailableGroups(): string[] {
  const scoutLines = loadScoutLines();
  return Object.keys(scoutLines.groups);
}
