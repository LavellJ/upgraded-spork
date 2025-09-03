/**
 * A/B Testing Model
 * 
 * Manages experiment assignments and persistence for LearnOz.
 * Ensures consistent variant assignment across sessions.
 */

export interface AB {
  version: 1;
  assignments: Record<string, string>;
}

const STORAGE_KEY = 'qi.ab.v1';

/**
 * Get current A/B test assignments from localStorage
 */
function getABState(): AB {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.version === 1 && typeof parsed.assignments === 'object') {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to parse A/B state:', e);
  }
  
  // Return default state
  return {
    version: 1,
    assignments: {}
  };
}

/**
 * Save A/B test assignments to localStorage
 */
function saveABState(state: AB): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save A/B state:', e);
  }
}

/**
 * Get assigned variant for an experiment key.
 * If not assigned, randomly assigns from available variants and persists.
 */
export function getVariant(key: string, variants: string[]): string {
  if (variants.length === 0) {
    throw new Error(`No variants provided for experiment key: ${key}`);
  }

  const state = getABState();
  
  // Return existing assignment if available
  if (state.assignments[key] && variants.includes(state.assignments[key])) {
    return state.assignments[key];
  }
  
  // Assign random variant and persist
  const randomIndex = Math.floor(Math.random() * variants.length);
  const assignedVariant = variants[randomIndex];
  
  const newState: AB = {
    ...state,
    assignments: {
      ...state.assignments,
      [key]: assignedVariant
    }
  };
  
  saveABState(newState);
  return assignedVariant;
}

/**
 * Manually set variant for an experiment key (for dev/testing purposes)
 */
export function setVariant(key: string, value: string): void {
  const state = getABState();
  
  const newState: AB = {
    ...state,
    assignments: {
      ...state.assignments,
      [key]: value
    }
  };
  
  saveABState(newState);
}

/**
 * Get all current assignments
 */
export function getAllAssignments(): Record<string, string> {
  return getABState().assignments;
}

/**
 * Clear all assignments (for testing/dev purposes)
 */
export function clearAllAssignments(): void {
  saveABState({
    version: 1,
    assignments: {}
  });
}

/**
 * Scout dwell time experiment variants
 */
export const SCOUT_DWELL_VARIANTS = ['A', 'B', 'C'] as const;
export type ScoutDwellVariant = typeof SCOUT_DWELL_VARIANTS[number];

/**
 * Get scout dwell times based on assigned variant
 */
export function getScoutDwellTimes(): { info: number; calm: number } {
  const variant = getVariant('scout.dwell', [...SCOUT_DWELL_VARIANTS]) as ScoutDwellVariant;
  
  switch (variant) {
    case 'A':
      return { info: 3000, calm: 4500 };
    case 'B':
      return { info: 3500, calm: 5000 };
    case 'C':
      return { info: 2500, calm: 4000 };
    default:
      // Fallback to variant A
      return { info: 3000, calm: 4500 };
  }
}

/**
 * Get current scout dwell variant assignment
 */
export function getScoutDwellVariant(): ScoutDwellVariant {
  return getVariant('scout.dwell', [...SCOUT_DWELL_VARIANTS]) as ScoutDwellVariant;
}