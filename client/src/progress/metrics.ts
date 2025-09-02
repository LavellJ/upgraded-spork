// Progress metrics and analytics for Quest Island
// Provides completion tracking, streak calculation, and recap functionality

import type { ProgressEvent } from './events';

export interface CompletionMetrics {
  completed: number;
  total: number;
  pct: number;
}

export interface JournalRecap {
  skillId: string;
  n: number;
  correct: number;
  when: number;
}

export interface Lesson {
  id: string;
  biomeId: string;
}

/**
 * Calculate overall completion across all lessons
 */
export function overallCompletion(lessons: Lesson[], events: ProgressEvent[]): CompletionMetrics {
  const total = lessons.length;
  
  if (total === 0) {
    return { completed: 0, total: 0, pct: 0 };
  }
  
  // Get unique lesson IDs that have at least one 'lesson_finish' event
  const finishedLessonIds = new Set(
    events
      .filter(event => event.kind === 'lesson_finish')
      .map(event => 'lessonId' in event ? event.lessonId : '')
      .filter(Boolean)
  );
  
  const completed = lessons.filter(lesson => 
    finishedLessonIds.has(lesson.id)
  ).length;
  
  const pct = Math.round((completed / total) * 100);
  
  return { completed, total, pct };
}

/**
 * Calculate completion for a specific biome
 */
export function biomeCompletion(biomeId: string, lessons: Lesson[], events: ProgressEvent[]): CompletionMetrics {
  // Filter lessons for this biome
  const biomeLessons = lessons.filter(lesson => lesson.biomeId === biomeId);
  
  return overallCompletion(biomeLessons, events);
}

/**
 * Calculate current day streak
 * Counts consecutive calendar days (local timezone) with at least one lesson_finish or journal_finish
 * Ends today if there's activity today, otherwise ends yesterday
 */
export function dayStreak(events: ProgressEvent[]): number {
  if (events.length === 0) return 0;
  
  // Get all completion events (lesson_finish or journal_finish)
  const completionEvents = events.filter(event => 
    event.kind === 'lesson_finish' || event.kind === 'journal_finish'
  );
  
  if (completionEvents.length === 0) return 0;
  
  // Get unique calendar days with activity (in local timezone)
  const activeDays = new Set<string>();
  
  completionEvents.forEach(event => {
    const date = new Date(event.at);
    const dayKey = date.toLocaleDateString(); // e.g., "1/1/2025"
    activeDays.add(dayKey);
  });
  
  const sortedDays = Array.from(activeDays).sort((a, b) => {
    return new Date(a).getTime() - new Date(b).getTime();
  });
  
  if (sortedDays.length === 0) return 0;
  
  // Check if today has activity
  const today = new Date().toLocaleDateString();
  const hasActivityToday = activeDays.has(today);
  
  // Start counting from today if there's activity, otherwise from yesterday
  let streakDate = hasActivityToday ? today : getYesterday();
  let streak = 0;
  
  // Count backwards from the streak start date
  while (activeDays.has(streakDate)) {
    streak++;
    streakDate = getPreviousDay(streakDate);
  }
  
  return streak;
}

/**
 * Get the most recent journal session recap
 */
export function lastJournalRecap(events: ProgressEvent[]): JournalRecap | null {
  const journalFinishEvents = events
    .filter(event => event.kind === 'journal_finish')
    .filter(event => 'skillId' in event && 'n' in event && 'correct' in event)
    .sort((a, b) => b.at - a.at); // Most recent first
  
  if (journalFinishEvents.length === 0) return null;
  
  const mostRecent = journalFinishEvents[0];
  
  if ('skillId' in mostRecent && 'n' in mostRecent && 'correct' in mostRecent) {
    return {
      skillId: mostRecent.skillId,
      n: mostRecent.n,
      correct: mostRecent.correct,
      when: mostRecent.at
    };
  }
  
  return null;
}

/**
 * Get completion events for a specific time period
 */
export function getCompletionEvents(events: ProgressEvent[], days: number = 7): ProgressEvent[] {
  const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
  
  return events.filter(event => 
    event.at >= cutoffTime && 
    (event.kind === 'lesson_finish' || event.kind === 'journal_finish')
  );
}

/**
 * Calculate lesson completion rate (pass vs retry)
 */
export function lessonSuccessRate(events: ProgressEvent[]): { passRate: number; totalAttempts: number } {
  const lessonFinishEvents = events.filter(event => 
    event.kind === 'lesson_finish' && 'result' in event
  );
  
  if (lessonFinishEvents.length === 0) {
    return { passRate: 0, totalAttempts: 0 };
  }
  
  const passes = lessonFinishEvents.filter(event => 
    'result' in event && event.result === 'pass'
  ).length;
  
  const passRate = Math.round((passes / lessonFinishEvents.length) * 100);
  
  return { passRate, totalAttempts: lessonFinishEvents.length };
}

/**
 * Get average session duration for lessons
 */
export function averageSessionDuration(events: ProgressEvent[]): number {
  const lessonFinishEvents = events.filter(event => 
    event.kind === 'lesson_finish' && 'durationSec' in event && event.durationSec
  );
  
  if (lessonFinishEvents.length === 0) return 0;
  
  const totalDuration = lessonFinishEvents.reduce((sum, event) => {
    return sum + ('durationSec' in event && event.durationSec ? event.durationSec : 0);
  }, 0);
  
  return Math.round(totalDuration / lessonFinishEvents.length);
}

// Helper functions for date manipulation
function getYesterday(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toLocaleDateString();
}

function getPreviousDay(dateString: string): string {
  const date = new Date(dateString);
  date.setDate(date.getDate() - 1);
  return date.toLocaleDateString();
}

/**
 * Scout intervention summary for the given time period
 */
export interface ScoutSummary {
  totalShown: number;
  actionableShown: number;
  clickedCTAs: number;
  dismissals: number;
  topMessages: Array<{ messageId: string; count: number; priority: string }>;
}

export function scoutSummary(events: ProgressEvent[], days: number = 7): ScoutSummary {
  const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
  
  const scoutEvents = events.filter(event => 
    event.kind === 'scout_msg' && event.at >= cutoff
  );
  
  if (scoutEvents.length === 0) {
    return {
      totalShown: 0,
      actionableShown: 0,
      clickedCTAs: 0,
      dismissals: 0,
      topMessages: []
    };
  }
  
  let actionableShown = 0;
  let clickedCTAs = 0;
  let dismissals = 0;
  const messageCounts = new Map<string, { count: number; priority: string }>();
  
  scoutEvents.forEach(event => {
    if ('priority' in event && 'messageId' in event) {
      // Count actionable messages
      if (event.priority === 'actionable') {
        actionableShown++;
      }
      
      // Count CTA clicks
      if (event.cta?.clicked) {
        clickedCTAs++;
      }
      
      // Count dismissals
      if (event.dismissed) {
        dismissals++;
      }
      
      // Track message frequency for top messages
      const existing = messageCounts.get(event.messageId);
      if (existing) {
        existing.count++;
      } else {
        messageCounts.set(event.messageId, { count: 1, priority: event.priority });
      }
    }
  });
  
  // Get top 3 messages by show count
  const topMessages = Array.from(messageCounts.entries())
    .map(([messageId, data]) => ({
      messageId,
      count: data.count,
      priority: data.priority
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
  
  return {
    totalShown: scoutEvents.length,
    actionableShown,
    clickedCTAs,
    dismissals,
    topMessages
  };
}