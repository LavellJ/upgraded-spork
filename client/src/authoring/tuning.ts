/**
 * Content tuning system - allows difficulty nudges and hint variants without full rewrites
 */

import { pushEvent } from '../progress/events';

export function clearTuningStorage(): void {
  try {
    localStorage.removeItem(TUNING_STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear tuning storage:', error);
  }
}

export type TuningNote = {
  id: string; // `${packId}:${lessonId}` or `journal:${skillId}:${noteId}`
  at: number;
  kind: 'lesson' | 'journal';
  change: {
    difficultyDelta?: -2 | -1 | 1 | 2; // Difficulty adjustment
    hintAdds?: string[]; // Additional hints to prepend
    wording?: string; // Wording adjustments for prompts
  };
  rationale?: string;
  author?: string;
};

const TUNING_STORAGE_KEY = 'qi.tuning.v1';

/**
 * Initialize tuning notes for hero and template lessons
 */
export function initializeProductionTuningNotes(): void {
  const now = Date.now();
  
  // Hero lesson M.FRAC.NL.3 tuning notes
  const heroNote: TuningNote = {
    id: 'hero:M.FRAC.NL.3:step2',
    at: now,
    kind: 'lesson',
    change: {
      difficultyDelta: -1,
      hintAdds: ["Count the spaces between marks; 1/2 is halfway."]
    },
    rationale: 'Step2 positioning concept needs clearer spatial hint',
    author: 'Content Team'
  };

  // Template lesson M.FRAC.COMP.3 tuning notes  
  const fracCompNote: TuningNote = {
    id: 'journal:M.FRAC.COMP.3:same_denom',
    at: now + 1,
    kind: 'journal',
    change: {
      difficultyDelta: 1
    },
    rationale: 'Independent practice items with same denominators need increased challenge',
    author: 'Content Team'
  };

  // Template lesson E.READ.MAIN.3 tuning notes
  const readMainNote: TuningNote = {
    id: 'lesson:E.READ.MAIN.3:step1',
    at: now + 2,
    kind: 'lesson', 
    change: {
      difficultyDelta: -1,
      hintAdds: ["Look for the big idea that all details support, not just one detail."]
    },
    rationale: 'Step1 needs clearer distinction between main ideas vs details',
    author: 'Content Team'
  };

  // Save all tuning notes
  const notes = [heroNote, fracCompNote, readMainNote];
  for (const note of notes) {
    saveTuningNote(note);
    applyTuning(note);
  }

  console.log('✅ Initialized production tuning notes:', notes.length);
}

/**
 * Get all tuning notes from localStorage
 */
export function getAllTuningNotes(): TuningNote[] {
  try {
    const stored = localStorage.getItem(TUNING_STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to load tuning notes:', error);
    return [];
  }
}

/**
 * Get tuning notes by ID pattern (supports partial matching)
 */
export function getTuningNotesById(idPattern: string): TuningNote[] {
  return getAllTuningNotes().filter(note => note.id.includes(idPattern));
}

/**
 * Get tuning notes for a specific kind
 */
export function getTuningNotesByKind(kind: 'lesson' | 'journal'): TuningNote[] {
  return getAllTuningNotes().filter(note => note.kind === kind);
}

/**
 * Save a tuning note
 */
export function saveTuningNote(note: TuningNote): void {
  try {
    const existingNotes = getAllTuningNotes();
    const noteIndex = existingNotes.findIndex(n => n.id === note.id);
    
    if (noteIndex >= 0) {
      existingNotes[noteIndex] = note;
    } else {
      existingNotes.push(note);
    }
    
    localStorage.setItem(TUNING_STORAGE_KEY, JSON.stringify(existingNotes));
    console.log(`✅ Saved tuning note: ${note.id}`);
  } catch (error) {
    console.error('Failed to save tuning note:', error);
    throw error;
  }
}

/**
 * Delete a tuning note by ID
 */
export function deleteTuningNote(id: string): void {
  try {
    const existingNotes = getAllTuningNotes();
    const filteredNotes = existingNotes.filter(note => note.id !== id);
    
    localStorage.setItem(TUNING_STORAGE_KEY, JSON.stringify(filteredNotes));
    console.log(`✅ Deleted tuning note: ${id}`);
  } catch (error) {
    console.error('Failed to delete tuning note:', error);
    throw error;
  }
}

/**
 * Apply tuning note to modify content at runtime
 */
export function applyTuning(note: TuningNote): void {
  // Log the tuning application for analytics
  pushEvent({
    kind: 'tuning_applied',
    at: Date.now(),
    id: note.id,
    difficultyDelta: note.change.difficultyDelta,
    hintsAdded: note.change.hintAdds?.length || 0,
    hasWording: !!note.change.wording
  });
  
  console.log(`🎯 Applied tuning: ${note.id}`, note.change);
}

/**
 * Calculate adjusted difficulty level based on tuning notes
 */
export function getAdjustedDifficultyLevel(
  baseLevel: 'easy' | 'core' | 'stretch',
  skillId: string,
  ageBand?: string
): 'easy' | 'core' | 'stretch' {
  const relevantNotes = getTuningNotesById(`journal:${skillId}`)
    .filter(note => note.kind === 'journal' && note.change.difficultyDelta);
  
  if (relevantNotes.length === 0) {
    return baseLevel;
  }
  
  // Apply the most recent tuning note
  const latestNote = relevantNotes.sort((a, b) => b.at - a.at)[0];
  const delta = latestNote.change.difficultyDelta || 0;
  
  // Map levels to numeric values for calculation
  const levelMap = { 'easy': 0, 'core': 1, 'stretch': 2 };
  const reverseLevelMap = ['easy', 'core', 'stretch'] as const;
  
  const baseNumeric = levelMap[baseLevel];
  const adjustedNumeric = Math.max(0, Math.min(2, baseNumeric + delta));
  
  const adjustedLevel = reverseLevelMap[adjustedNumeric];
  
  // Log the adjustment
  if (adjustedLevel !== baseLevel) {
    pushEvent({
      kind: 'difficulty_adjusted',
      at: Date.now(),
      skillId,
      baseLevel,
      adjustedLevel,
      delta,
      tuningNoteId: latestNote.id
    });
  }
  
  return adjustedLevel;
}

/**
 * Get additional hints from tuning notes
 */
export function getAdditionalHints(contentId: string): string[] {
  const relevantNotes = getTuningNotesById(contentId)
    .filter(note => note.change.hintAdds && note.change.hintAdds.length > 0);
  
  const allHints: string[] = [];
  
  for (const note of relevantNotes) {
    if (note.change.hintAdds) {
      allHints.push(...note.change.hintAdds);
    }
  }
  
  return allHints;
}

/**
 * Get wording adjustments from tuning notes
 */
export function getWordingAdjustments(contentId: string): string | null {
  const relevantNotes = getTuningNotesById(contentId)
    .filter(note => note.change.wording);
  
  if (relevantNotes.length === 0) {
    return null;
  }
  
  // Return the most recent wording adjustment
  const latestNote = relevantNotes.sort((a, b) => b.at - a.at)[0];
  return latestNote.change.wording || null;
}

/**
 * Create a new tuning note ID
 */
export function createTuningId(type: 'lesson' | 'journal', contentId: string, noteId?: string): string {
  if (type === 'lesson') {
    return contentId; // packId:lessonId format
  } else {
    const suffix = noteId || Date.now().toString();
    return `journal:${contentId}:${suffix}`;
  }
}

/**
 * Get tuning statistics
 */
export function getTuningStats(): {
  totalNotes: number;
  lessonNotes: number;
  journalNotes: number;
  recentNotes: number; // Last 7 days
} {
  const allNotes = getAllTuningNotes();
  const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  
  return {
    totalNotes: allNotes.length,
    lessonNotes: allNotes.filter(note => note.kind === 'lesson').length,
    journalNotes: allNotes.filter(note => note.kind === 'journal').length,
    recentNotes: allNotes.filter(note => note.at > sevenDaysAgo).length,
  };
}