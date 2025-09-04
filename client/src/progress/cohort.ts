/**
 * Cohort metrics engine for multi-week trend analysis
 * Provides aggregated metrics across learner cohorts over time
 */

import { loadEvents, type ProgressEvent } from './events';
import { getActiveAssignments, isDueSoon, isOverdue } from '../guide/assign';
import { ns, BASE_KEYS } from '../storage/namespace';
import { getWeekRange, previousWeeks } from './util';

export type CohortSlice = {
  weekStartISO: string;
  learners: number;
  activeLearners: number;        // did any on-task this week
  avgOnTaskMins: number;
  medianOnTaskMins: number;
  return7dPct: number;
  assignments: { donePct: number; dueSoon: number; overdue: number };
  completionsPerLearner: number; // lessons completed / active learners
  streakersPct: number;          // % with streak >= 3
};

// Memoization cache for buildCohortSeries
interface CacheKey {
  learnerIds: string[];
  startWeekISO: string;
  weeks: number;
}

interface CacheEntry {
  key: string;
  result: CohortSlice[];
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 50;

/**
 * Generate a cache key from the parameters
 */
function generateCacheKey(learnerIds: string[], startWeekISO: string, weeks: number): string {
  const sortedIds = [...learnerIds].sort();
  return `${sortedIds.join(',')}|${startWeekISO}|${weeks}`;
}

/**
 * Clean expired entries from cache
 */
function cleanCache(): void {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (now - entry.timestamp > CACHE_TTL) {
      cache.delete(key);
    }
  }
  
  // If cache is still too large, remove oldest entries
  if (cache.size > MAX_CACHE_SIZE) {
    const entries = Array.from(cache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    const toRemove = entries.slice(0, cache.size - MAX_CACHE_SIZE);
    toRemove.forEach(([key]) => cache.delete(key));
  }
}

/**
 * Calculate on-task minutes for a learner in a specific week
 */
function calculateLearnerOnTaskMinutes(learnerId: string, weekStartISO: string): number {
  try {
    const storageKey = ns(learnerId, BASE_KEYS.onTask);
    const stored = localStorage.getItem(storageKey);
    
    if (!stored) {
      return calculateFallbackOnTaskMinutes(learnerId, weekStartISO);
    }

    const ticks = JSON.parse(stored);
    const { start, end } = getWeekRange(weekStartISO);

    // Filter ticks to the target week
    const weekTicks = ticks.filter((tick: any) => 
      tick.at >= start && tick.at < end
    );

    if (weekTicks.length === 0) {
      return 0;
    }

    // Calculate active time from start/stop/idle/resume sequences
    let totalMinutes = 0;
    let sessionStart: number | null = null;
    let isIdle = false;

    for (const tick of weekTicks) {
      switch (tick.kind) {
        case 'start':
          sessionStart = tick.at;
          isIdle = false;
          break;

        case 'stop':
          if (sessionStart && !isIdle) {
            totalMinutes += (tick.at - sessionStart) / (1000 * 60);
          }
          sessionStart = null;
          isIdle = false;
          break;

        case 'idle':
          if (sessionStart && !isIdle) {
            totalMinutes += (tick.at - sessionStart) / (1000 * 60);
          }
          isIdle = true;
          break;

        case 'resume':
          if (isIdle) {
            sessionStart = tick.at;
            isIdle = false;
          }
          break;
      }
    }

    // Handle case where week ended during an active session
    if (sessionStart && !isIdle) {
      totalMinutes += (end - sessionStart) / (1000 * 60);
    }

    return Math.max(0, totalMinutes);
  } catch (error) {
    console.warn('Failed to calculate on-task minutes for learner:', learnerId, error);
    return calculateFallbackOnTaskMinutes(learnerId, weekStartISO);
  }
}

/**
 * Fallback on-task calculation using lesson/journal durations
 */
function calculateFallbackOnTaskMinutes(learnerId: string, weekStartISO: string): number {
  const events = loadEvents(learnerId);
  const { start, end } = getWeekRange(weekStartISO);
  
  const weekEvents = events.filter(event => 
    event.at >= start && event.at < end
  );

  let totalMinutes = 0;
  
  // Estimate from lesson durations
  const lessonFinishEvents = weekEvents.filter(e => e.kind === 'lesson_finish') as Extract<ProgressEvent, { kind: 'lesson_finish' }>[];
  lessonFinishEvents.forEach(event => {
    if (event.durationSec) {
      totalMinutes += event.durationSec / 60;
    } else {
      // Fallback estimate: 8 minutes per lesson
      totalMinutes += 8;
    }
  });

  // Estimate from journal durations
  const journalFinishEvents = weekEvents.filter(e => e.kind === 'journal_finish') as Extract<ProgressEvent, { kind: 'journal_finish' }>[];
  journalFinishEvents.forEach(event => {
    if (event.durationSec) {
      totalMinutes += event.durationSec / 60;
    } else {
      // Fallback estimate: 5 minutes per journal session
      totalMinutes += 5;
    }
  });

  return totalMinutes;
}

/**
 * Calculate learner's streak for a specific week
 */
function calculateLearnerStreak(learnerId: string, weekStartISO: string): number {
  const events = loadEvents(learnerId);
  const { end } = getWeekRange(weekStartISO);
  
  // Get all completion events up to the end of this week
  const completionEvents = events.filter(event => 
    (event.kind === 'lesson_finish' || event.kind === 'journal_finish') && 
    event.at <= end
  );

  if (completionEvents.length === 0) return 0;

  // Get unique calendar days with activity (in local timezone)
  const activeDays = new Set<string>();
  
  completionEvents.forEach(event => {
    const date = new Date(event.at);
    const dayKey = date.toLocaleDateString(); // e.g., "1/1/2025"
    activeDays.add(dayKey);
  });

  // Calculate streak ending at the last day of this week
  const weekEndDate = new Date(end - 1); // Last moment of the week
  let streakDate = weekEndDate.toLocaleDateString();
  let streak = 0;
  
  // Count backwards from the end of the week
  while (activeDays.has(streakDate)) {
    streak++;
    const date = new Date(streakDate);
    date.setDate(date.getDate() - 1);
    streakDate = date.toLocaleDateString();
  }
  
  return streak;
}

/**
 * Calculate assignment metrics for a learner in a specific week
 */
function calculateLearnerAssignments(learnerId: string, weekStartISO: string): {
  completed: number;
  dueSoon: number;
  overdue: number;
  total: number;
} {
  try {
    const assignments = getActiveAssignments(learnerId, { includeArchived: false });
    const events = loadEvents(learnerId);
    const { start, end } = getWeekRange(weekStartISO);
    
    // Find lessons completed this week
    const weekEvents = events.filter(event => 
      event.at >= start && event.at < end
    );
    
    const completionEvents = weekEvents.filter(e => 
      e.kind === 'lesson_finish' && (e as Extract<ProgressEvent, { kind: 'lesson_finish' }>).result === 'pass'
    ) as Extract<ProgressEvent, { kind: 'lesson_finish' }>[];

    let completed = 0;
    let dueSoon = 0;
    let overdue = 0;
    let total = 0;

    // Process each assignment
    assignments.forEach(assignment => {
      assignment.lessons.forEach(lesson => {
        total++;
        
        // Check if this lesson was completed this week
        const wasCompletedThisWeek = completionEvents.some(event => 
          event.lessonId === lesson.lessonId
        );

        if (wasCompletedThisWeek && lesson.status === 'done') {
          completed++;
        }

        // Check assignment status for due soon/overdue (at time of week end)
        if (lesson.dueAt) {
          if (lesson.dueAt < end && isOverdue(lesson.dueAt)) {
            overdue++;
          } else if (isDueSoon(lesson.dueAt)) {
            dueSoon++;
          }
        } else if (assignment.dueAt) {
          // Fallback to assignment due date
          if (assignment.dueAt < end && isOverdue(assignment.dueAt)) {
            overdue++;
          } else if (isDueSoon(assignment.dueAt)) {
            dueSoon++;
          }
        }
      });
    });

    return { completed, dueSoon, overdue, total };
  } catch (error) {
    console.warn('Failed to calculate assignment metrics for learner:', learnerId, error);
    return { completed: 0, dueSoon: 0, overdue: 0, total: 0 };
  }
}

/**
 * Calculate 7-day return rate for a learner from a specific week
 */
function calculateReturn7d(learnerId: string, weekStartISO: string): boolean {
  const events = loadEvents(learnerId);
  const { end } = getWeekRange(weekStartISO);
  
  // Check if learner had any activity in the 7 days following this week
  const sevenDaysAfter = end + (7 * 24 * 60 * 60 * 1000);
  
  const activityInNext7Days = events.some(event => 
    (event.kind === 'lesson_finish' || event.kind === 'journal_finish') &&
    event.at >= end && 
    event.at < sevenDaysAfter
  );

  return activityInNext7Days;
}

/**
 * Calculate lesson completions for a learner in a specific week
 */
function calculateLearnerCompletions(learnerId: string, weekStartISO: string): number {
  const events = loadEvents(learnerId);
  const { start, end } = getWeekRange(weekStartISO);
  
  const completions = events.filter(event => 
    event.kind === 'lesson_finish' && 
    (event as Extract<ProgressEvent, { kind: 'lesson_finish' }>).result === 'pass' &&
    event.at >= start && 
    event.at < end
  );

  return completions.length;
}

/**
 * Calculate median value from array of numbers
 */
function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  } else {
    return sorted[mid];
  }
}

/**
 * Build cohort metrics series across multiple weeks
 * @param learnerIds - Array of learner IDs to include in cohort analysis
 * @param startWeekISO - ISO date string for Monday of the first week to analyze
 * @param weeks - Number of weeks to analyze
 * @returns Array of CohortSlice objects, one per week in chronological order
 */
export function buildCohortSeries(
  learnerIds: string[],
  startWeekISO: string,
  weeks: number
): CohortSlice[] {
  // Check cache first
  const cacheKey = generateCacheKey(learnerIds, startWeekISO, weeks);
  const cached = cache.get(cacheKey);
  
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    return cached.result;
  }

  // Clean cache periodically
  cleanCache();

  // Generate week list (including start week and previous weeks)
  const allWeeks = [...previousWeeks(startWeekISO, weeks - 1), startWeekISO];
  
  const result: CohortSlice[] = allWeeks.map(weekISO => {
    // Per-learner metrics for this week
    const learnerMetrics = learnerIds.map(learnerId => {
      const onTaskMins = calculateLearnerOnTaskMinutes(learnerId, weekISO);
      const streak = calculateLearnerStreak(learnerId, weekISO);
      const assignments = calculateLearnerAssignments(learnerId, weekISO);
      const return7d = calculateReturn7d(learnerId, weekISO);
      const completions = calculateLearnerCompletions(learnerId, weekISO);
      
      return {
        learnerId,
        onTaskMins,
        streak,
        assignments,
        return7d,
        completions,
        isActive: onTaskMins > 0
      };
    });

    // Aggregate metrics
    const activeLearners = learnerMetrics.filter(m => m.isActive).length;
    const onTaskMinutes = learnerMetrics.map(m => m.onTaskMins).filter(mins => mins > 0);
    
    const avgOnTaskMins = onTaskMinutes.length > 0 
      ? onTaskMinutes.reduce((sum, mins) => sum + mins, 0) / onTaskMinutes.length
      : 0;
    
    const medianOnTaskMins = calculateMedian(onTaskMinutes);
    
    const return7dCount = learnerMetrics.filter(m => m.return7d).length;
    const return7dPct = learnerIds.length > 0 ? (return7dCount / learnerIds.length) * 100 : 0;
    
    // Assignment aggregation
    const totalAssignments = learnerMetrics.reduce((sum, m) => sum + m.assignments.total, 0);
    const totalCompleted = learnerMetrics.reduce((sum, m) => sum + m.assignments.completed, 0);
    const totalDueSoon = learnerMetrics.reduce((sum, m) => sum + m.assignments.dueSoon, 0);
    const totalOverdue = learnerMetrics.reduce((sum, m) => sum + m.assignments.overdue, 0);
    
    const donePct = totalAssignments > 0 ? (totalCompleted / totalAssignments) * 100 : 0;
    
    // Completion rate per active learner
    const totalCompletions = learnerMetrics.reduce((sum, m) => sum + m.completions, 0);
    const completionsPerLearner = activeLearners > 0 ? totalCompletions / activeLearners : 0;
    
    // Streakers percentage (streak >= 3)
    const streakersCount = learnerMetrics.filter(m => m.streak >= 3).length;
    const streakersPct = learnerIds.length > 0 ? (streakersCount / learnerIds.length) * 100 : 0;
    
    return {
      weekStartISO: weekISO,
      learners: learnerIds.length,
      activeLearners,
      avgOnTaskMins: Math.round(avgOnTaskMins * 10) / 10, // Round to 1 decimal
      medianOnTaskMins: Math.round(medianOnTaskMins * 10) / 10,
      return7dPct: Math.round(return7dPct * 10) / 10,
      assignments: {
        donePct: Math.round(donePct * 10) / 10,
        dueSoon: totalDueSoon,
        overdue: totalOverdue
      },
      completionsPerLearner: Math.round(completionsPerLearner * 10) / 10,
      streakersPct: Math.round(streakersPct * 10) / 10
    };
  });

  // Cache the result
  cache.set(cacheKey, {
    key: cacheKey,
    result,
    timestamp: Date.now()
  });

  return result;
}