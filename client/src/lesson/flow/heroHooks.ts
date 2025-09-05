import { selectItemsForSkill } from '../../journal/generator';
import { logEvent } from '../../lib/analytics';

/**
 * Types for hero lesson completion results
 */
export interface HeroLessonResult {
  passed: boolean;
  hintsUsed: number;
  miscues: string[];
  accuracy?: number;
  timeSpent?: number; // in seconds
  skillTag?: string;
}

/**
 * Journal enrollment interface
 */
interface JournalEnrollment {
  skillTag: string;
  count: number;
  source: string;
  recentMiscues?: Record<string, number>;
}

/**
 * Internal journal queue storage
 */
const journalQueue: JournalEnrollment[] = [];

/**
 * Tally miscues from array into frequency count
 */
function tallyMiscues(miscues: string[]): Record<string, number> {
  const tally: Record<string, number> = {};
  for (const miscue of miscues) {
    tally[miscue] = (tally[miscue] || 0) + 1;
  }
  return tally;
}

/**
 * Enqueue journal items for a skill
 */
export function enqueueJournal(enrollment: JournalEnrollment): void {
  journalQueue.push(enrollment);
  
  // Log analytics for journal enrollment
  logEvent({
    ts: new Date().toISOString(),
    loop: 1,
    action: 'complete',
    meta: { type: 'journal_enqueued', skill: enrollment.skillTag }
  });
  
  console.log(`📝 Journal enqueued for ${enrollment.skillTag}: ${enrollment.count} items (source: ${enrollment.source})`);
}

/**
 * Get next journal enrollment from queue
 */
export function getNextJournalEnrollment(): JournalEnrollment | null {
  return journalQueue.shift() || null;
}

/**
 * Check if journal queue has pending items
 */
export function hasJournalEnrollments(): boolean {
  return journalQueue.length > 0;
}

/**
 * Main hook called when a hero lesson completes
 */
export function onHeroLessonComplete(result: HeroLessonResult): void {
  const { passed, hintsUsed, miscues, skillTag = 'M.FRAC.NL.3' } = result;
  
  // Log completion analytics
  logEvent({
    ts: new Date().toISOString(),
    loop: 1,
    action: 'complete',
    meta: { type: 'hero_lesson_complete', passed, skill: skillTag }
  });

  console.log(`🎯 Hero lesson completed: ${skillTag}`, {
    passed,
    hintsUsed,
    miscues: miscues.length
  });

  // Determine if journal enrollment is needed
  const needsJournal = !passed || hintsUsed >= 2 || miscues.length >= 3;
  
  if (needsJournal) {
    const miscueTally = tallyMiscues(miscues);
    
    // Enqueue journal practice
    enqueueJournal({
      skillTag,
      count: 4, // Standard post-lesson practice
      source: `lesson:${skillTag}`,
      recentMiscues: miscueTally
    });

    console.log(`📝 Journal enrolled due to: passed=${passed}, hints=${hintsUsed}, miscues=${miscues.length}`);
  } else {
    console.log(`✅ Hero lesson mastered - no additional practice needed`);
  }
}

/**
 * Hook for triggering spaced refresh after journal completion
 */
export function onJournalComplete(skillTag: string, accuracy: number): void {
  // Log journal completion
  logEvent({
    ts: new Date().toISOString(),
    loop: 1,
    action: 'complete',
    meta: { type: 'journal_complete', skill: skillTag, accuracy }
  });

  // Schedule spaced refresh if mastery threshold not met
  const masteryThreshold = 0.85;
  if (accuracy < masteryThreshold) {
    // Import schedule function when needed
    import('../../journal/schedule').then(({ scheduleRefresh }) => {
      scheduleRefresh({
        skillTag,
        inDays: 3,
        minMastery: masteryThreshold
      });
      
      logEvent({
        ts: new Date().toISOString(),
        loop: 1,
        action: 'start',
        meta: { type: 'spaced_refresh_scheduled', skill: skillTag }
      });

      console.log(`⏰ Spaced refresh scheduled for ${skillTag} in 3 days (accuracy: ${accuracy})`);
    }).catch(error => {
      console.warn('Failed to schedule spaced refresh:', error);
    });
  }
}

/**
 * Generate and return journal items for a skill (used by UI components)
 */
export async function generateJournalForSkill(
  skillTag: string, 
  count: number = 4, 
  recentMiscues?: Record<string, number>
): Promise<import('../../schema/journal').JournalItem[]> {
  try {
    const items = await selectItemsForSkill(skillTag, count, recentMiscues);
    
    // Log journal generation
    logEvent({
      ts: new Date().toISOString(),
      loop: 1,
      action: 'start',
      meta: { type: 'journal_generated', skill: skillTag, count: items.length }
    });
    
    return items;
  } catch (error) {
    console.error('Failed to generate journal items:', error);
    return [];
  }
}

/**
 * Check mastery level for spaced refresh decisions
 */
export function checkMasteryLevel(skillTag: string): number {
  // This would typically check stored mastery data
  // For now, return a mock value
  const stored = localStorage.getItem(`mastery:${skillTag}`);
  return stored ? parseFloat(stored) : 0.5;
}

/**
 * Update mastery level after practice
 */
export function updateMasteryLevel(skillTag: string, newLevel: number): void {
  localStorage.setItem(`mastery:${skillTag}`, newLevel.toString());
  
  logEvent({
    ts: new Date().toISOString(),
    loop: 1,
    action: 'complete',
    meta: { type: 'mastery_updated', skill: skillTag, level: newLevel }
  });
  
  console.log(`📈 Mastery updated for ${skillTag}: ${(newLevel * 100).toFixed(1)}%`);
}

/**
 * Clear journal queue (useful for testing)
 */
export function clearJournalQueue(): void {
  journalQueue.length = 0;
  console.log('🗑️ Journal queue cleared');
}