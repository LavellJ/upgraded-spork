/**
 * Helper function to open Journal for a specific skill
 * Integrates with the main App component's journal system
 */

// Global reference to the journal opener function (set by App component)
let globalOpenJournal: ((skillId: string, itemCount?: number) => void) | null = null;

/**
 * Sets the global journal opener function
 * Called by App component during initialization
 */
export function setJournalOpener(opener: (skillId: string, itemCount?: number) => void) {
  globalOpenJournal = opener;
}

/**
 * Opens Journal for a specific skill with specified number of items
 * @param skillId - The skill to practice (e.g., "literacy.phonics")
 * @param n - Number of practice items (default: 4)
 */
export function openJournalForSkill(skillId: string, n: number = 4) {
  if (globalOpenJournal) {
    globalOpenJournal(skillId, n);
  } else {
    console.warn('Journal opener not available - App component may not be initialized');
  }
}

/**
 * Infers the primary skill for the current lesson based on standards mapping
 * @param lessonId - The current lesson ID
 * @param biome - The current biome/subject area
 * @returns The primary skill ID for the lesson
 */
export function inferPrimarySkillForCurrentLesson(lessonId?: string, biome?: string): string {
  // Standards mapping - maps lesson patterns to skill IDs
  const LESSON_TO_SKILL_MAP: Record<string, string> = {
    // Literacy skills
    'f1': 'literacy.phonics',
    'f2': 'literacy.blending', 
    'f3': 'literacy.sight_words',
    'f4': 'literacy.sentence_completion',
    'f5': 'literacy.rhyming',
    
    // Math skills  
    'd1': 'math.addition',
    'd2': 'math.number_bonds',
    'd3': 'math.counting',
    'd4': 'math.subtraction',
    'd5': 'math.patterns',
    
    // Science skills
    'o1': 'science.animals',
    'o2': 'science.habitats', 
    'o3': 'science.weather',
    'o4': 'science.plants',
    'o5': 'science.materials',
    
    // HASS skills
    'n1': 'hass.community',
    'n2': 'hass.geography',
    'n3': 'hass.history', 
    'n4': 'hass.culture',
    'n5': 'hass.civics'
  };
  
  // Try direct lesson ID mapping first
  if (lessonId && LESSON_TO_SKILL_MAP[lessonId]) {
    return LESSON_TO_SKILL_MAP[lessonId];
  }
  
  // Fallback to biome-based skill mapping
  const BIOME_TO_DEFAULT_SKILL: Record<string, string> = {
    'forest': 'literacy.phonics',
    'desert': 'math.addition', 
    'ocean': 'science.animals',
    'night': 'hass.community'
  };
  
  if (biome && BIOME_TO_DEFAULT_SKILL[biome]) {
    return BIOME_TO_DEFAULT_SKILL[biome];
  }
  
  // Ultimate fallback
  return 'literacy.phonics';
}