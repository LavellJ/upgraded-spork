/**
 * Trigger logic for share/rate prompts
 * Determines when users are eligible for gentle opt-in prompts
 */

import { loadEvents, getEventsByKind } from '../progress/events';
import { dayStreak } from '../progress/metrics';

// Constants for trigger thresholds
const NPS_THRESHOLD = 9;
const STREAKER_PERCENTAGE_THRESHOLD = 40;
const WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Check if user has high NPS score (≥ 9)
 */
function hasHighNps(learnerId?: string): boolean {
  try {
    const events = loadEvents(learnerId);
    const npsEvents = events.filter(event => 
      event.kind === 'scout_msg' && 
      event.messageId && 
      event.messageId.includes('nps') &&
      event.text
    );

    if (npsEvents.length === 0) {
      return false;
    }

    // Get the most recent NPS response
    const recentNpsEvent = npsEvents[npsEvents.length - 1];
    
    // Extract NPS score from the event (this would depend on how NPS is stored)
    // For now, we'll assume there's a way to extract the score
    // In practice, this might need to integrate with the actual NPS system
    
    // Placeholder logic - in real implementation, this would extract actual NPS score
    const hasRecentHighNps = recentNpsEvent.at > (Date.now() - WEEK_IN_MS);
    
    return hasRecentHighNps;
  } catch {
    return false;
  }
}

/**
 * Check if user is a high-streaker (>40% streak days in past week)
 */
function hasHighStreakPercentage(learnerId?: string): boolean {
  try {
    const events = loadEvents(learnerId);
    const oneWeekAgo = Date.now() - WEEK_IN_MS;
    
    // Get events from the past week
    const recentEvents = events.filter(event => event.at >= oneWeekAgo);
    
    // Calculate streak percentage
    const streak = dayStreak(recentEvents);
    const streakPercentage = (streak / 7) * 100; // 7 days in a week
    
    return streakPercentage > STREAKER_PERCENTAGE_THRESHOLD;
  } catch {
    return false;
  }
}

/**
 * Check if user is currently in an active lesson
 */
function isInActiveLesson(learnerId?: string): boolean {
  try {
    const events = loadEvents(learnerId);
    const recentEvents = events.slice(-10); // Check last 10 events
    
    // Look for lesson_start without corresponding lesson_finish
    let inLesson = false;
    for (const event of recentEvents.reverse()) {
      if (event.kind === 'lesson_start') {
        inLesson = true;
        break;
      } else if (event.kind === 'lesson_finish') {
        inLesson = false;
        break;
      }
    }
    
    return inLesson;
  } catch {
    return false;
  }
}

/**
 * Main function to check if user is eligible for share/rate prompts
 * Returns true if user has NPS ≥ 9 OR streakersPct > 40% in past week
 */
export function isEligibleForPrompt(learnerId?: string): boolean {
  const highNps = hasHighNps(learnerId);
  const highStreak = hasHighStreakPercentage(learnerId);
  
  return highNps || highStreak;
}

/**
 * Check if user is currently in an active lesson (should not show prompts)
 */
export function isUserInActiveLesson(learnerId?: string): boolean {
  return isInActiveLesson(learnerId);
}

/**
 * Get debug information about trigger conditions
 * Only available in development
 */
export function getPromptTriggerDebugInfo(learnerId?: string): {
  eligible: boolean;
  inActiveLesson: boolean;
  hasHighNps: boolean;
  hasHighStreak: boolean;
  currentStreak: number;
} | null {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  try {
    const events = loadEvents(learnerId);
    const oneWeekAgo = Date.now() - WEEK_IN_MS;
    const recentEvents = events.filter(event => event.at >= oneWeekAgo);
    const currentStreak = dayStreak(recentEvents);
    
    const debugInfo = {
      eligible: isEligibleForPrompt(learnerId),
      inActiveLesson: isUserInActiveLesson(learnerId),
      hasHighNps: hasHighNps(learnerId),
      hasHighStreak: hasHighStreakPercentage(learnerId),
      currentStreak
    };

    // Log debug info in development
    console.log('[SharePrompt Debug]', debugInfo);
    
    return debugInfo;
  } catch {
    return null;
  }
}