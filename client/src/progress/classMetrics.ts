/**
 * Class-level weekly metrics for dashboard reporting
 * Aggregates learner activity data for class-wide analysis
 */

import { loadEvents, type ProgressEvent } from '../progress/events';
import { loadRoster, type LearnerProfile } from '../roster/model';
import { getActiveAssignments, getLessonAssignment, isDueSoon, isOverdue } from '../guide/assign';
import { ns, BASE_KEYS } from '../storage/namespace';

export interface ClassWeekTotals {
  minutes: number;
  sessions: number; 
  dueSoon: number;
  overdue: number;
  assignmentsDone: number;
}

export interface ClassWeekLearner {
  learnerId: string;
  name: string;
  minutes: number;
  sessions: number;
  assignmentsDone: number;
  dueSoon: number;
  overdue: number;
}

export interface ClassWeekData {
  totals: ClassWeekTotals;
  perLearner: ClassWeekLearner[];
}

/**
 * Build class-wide weekly metrics for specified learners
 * @param learnerIds - Array of learner IDs to include in the report
 * @param weekStartISO - ISO date string for Monday of the target week (e.g., "2025-01-13")
 * @returns Aggregated class metrics with totals and per-learner breakdown
 */
export function buildClassWeek(learnerIds: string[], weekStartISO: string): ClassWeekData {
  const weekStart = new Date(weekStartISO);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  // Get learner profiles for names
  const roster = loadRoster();
  const learnerProfiles = new Map<string, LearnerProfile>();
  
  if (roster?.learners) {
    roster.learners.forEach(learner => {
      learnerProfiles.set(learner.id, learner);
    });
  }

  // Build metrics for each learner
  const perLearner: ClassWeekLearner[] = learnerIds.map(learnerId => {
    const profile = learnerProfiles.get(learnerId);
    const learnerName = profile?.name || `Learner ${learnerId.slice(-8)}`;

    // Get all events for this learner in the week
    const allEvents = loadEvents(learnerId);
    const weekEvents = allEvents.filter(event => {
      const eventDate = new Date(event.at);
      return eventDate >= weekStart && eventDate < weekEnd;
    });

    // Calculate active minutes using on-task data
    const minutes = calculateActiveMinutes(learnerId, weekStart, weekEnd);

    // Calculate session count
    const sessions = calculateSessionCount(weekEvents);

    // Calculate assignment metrics
    const assignmentMetrics = calculateAssignmentMetrics(learnerId, weekStart, weekEnd);

    return {
      learnerId,
      name: learnerName,
      minutes: Math.round(minutes),
      sessions,
      assignmentsDone: assignmentMetrics.done,
      dueSoon: assignmentMetrics.dueSoon,
      overdue: assignmentMetrics.overdue
    };
  });

  // Calculate totals
  const totals: ClassWeekTotals = {
    minutes: perLearner.reduce((sum, learner) => sum + learner.minutes, 0),
    sessions: perLearner.reduce((sum, learner) => sum + learner.sessions, 0),
    dueSoon: perLearner.reduce((sum, learner) => sum + learner.dueSoon, 0),
    overdue: perLearner.reduce((sum, learner) => sum + learner.overdue, 0),
    assignmentsDone: perLearner.reduce((sum, learner) => sum + learner.assignmentsDone, 0)
  };

  return {
    totals,
    perLearner
  };
}

/**
 * Calculate total active minutes for a learner using on-task data
 */
function calculateActiveMinutes(learnerId: string, weekStart: Date, weekEnd: Date): number {
  try {
    // Load on-task ticks for this learner
    const storageKey = ns(learnerId, BASE_KEYS.onTask);
    const stored = localStorage.getItem(storageKey);
    
    if (!stored) {
      return fallbackCalculateActiveMinutes(learnerId, weekStart, weekEnd);
    }

    const ticks = JSON.parse(stored);
    const weekStartMs = weekStart.getTime();
    const weekEndMs = weekEnd.getTime();

    // Filter ticks to the target week
    const weekTicks = ticks.filter((tick: any) => 
      tick.at >= weekStartMs && tick.at < weekEndMs
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
      totalMinutes += (weekEndMs - sessionStart) / (1000 * 60);
    }

    return Math.max(0, totalMinutes);
  } catch (error) {
    console.warn('Failed to calculate on-task minutes for learner:', learnerId, error);
    return fallbackCalculateActiveMinutes(learnerId, weekStart, weekEnd);
  }
}

/**
 * Fallback calculation using lesson/journal completion events
 */
function fallbackCalculateActiveMinutes(learnerId: string, weekStart: Date, weekEnd: Date): number {
  const events = loadEvents(learnerId);
  const weekEvents = events.filter(event => {
    const eventDate = new Date(event.at);
    return eventDate >= weekStart && eventDate < weekEnd;
  });

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
 * Calculate number of distinct learning sessions
 * A session is defined as continuous activity with gaps < 30 minutes
 */
function calculateSessionCount(weekEvents: ProgressEvent[]): number {
  const activityEvents = weekEvents.filter(e => 
    e.kind === 'lesson_start' || e.kind === 'journal_start'
  );

  if (activityEvents.length === 0) return 0;

  // Sort by timestamp
  activityEvents.sort((a, b) => a.at - b.at);

  let sessions = 1;
  const SESSION_GAP_MS = 30 * 60 * 1000; // 30 minutes

  for (let i = 1; i < activityEvents.length; i++) {
    const gap = activityEvents[i].at - activityEvents[i - 1].at;
    if (gap > SESSION_GAP_MS) {
      sessions++;
    }
  }

  return sessions;
}

/**
 * Calculate assignment-related metrics for a learner in the given week
 */
function calculateAssignmentMetrics(learnerId: string, weekStart: Date, weekEnd: Date): {
  done: number;
  dueSoon: number;
  overdue: number;
} {
  try {
    const assignments = getActiveAssignments(learnerId, { includeArchived: false });
    const now = Date.now();
    const events = loadEvents(learnerId);
    
    // Find lessons completed this week
    const weekEvents = events.filter(event => {
      const eventDate = new Date(event.at);
      return eventDate >= weekStart && eventDate < weekEnd;
    });
    
    const completionEvents = weekEvents.filter(e => 
      e.kind === 'lesson_finish' && (e as Extract<ProgressEvent, { kind: 'lesson_finish' }>).result === 'pass'
    ) as Extract<ProgressEvent, { kind: 'lesson_finish' }>[];

    let done = 0;
    let dueSoon = 0;
    let overdue = 0;

    // Process each assignment
    assignments.forEach(assignment => {
      assignment.lessons.forEach(lesson => {
        // Check if this lesson was completed this week
        const wasCompletedThisWeek = completionEvents.some(event => 
          event.lessonId === lesson.lessonId
        );

        if (wasCompletedThisWeek && lesson.status === 'done') {
          done++;
        }

        // Check assignment status for due soon/overdue
        if (lesson.dueAt) {
          if (isOverdue(lesson.dueAt)) {
            overdue++;
          } else if (isDueSoon(lesson.dueAt)) {
            dueSoon++;
          }
        } else if (assignment.dueAt) {
          // Fallback to assignment due date
          if (isOverdue(assignment.dueAt)) {
            overdue++;
          } else if (isDueSoon(assignment.dueAt)) {
            dueSoon++;
          }
        }
      });
    });

    return { done, dueSoon, overdue };
  } catch (error) {
    console.warn('Failed to calculate assignment metrics for learner:', learnerId, error);
    return { done: 0, dueSoon: 0, overdue: 0 };
  }
}

/**
 * Get current week start (Monday) as ISO string
 */
export function getCurrentWeekStart(): string {
  const now = new Date();
  const monday = new Date(now);
  
  // Get Monday of current week
  const dayOfWeek = now.getDay();
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Sunday = 0, Monday = 1
  monday.setDate(now.getDate() + daysToMonday);
  
  // Set to start of day
  monday.setHours(0, 0, 0, 0);
  
  return monday.toISOString().split('T')[0];
}

/**
 * Get week display name (e.g., "Jan 13-19, 2025")
 */
export function getWeekDisplayName(weekStartISO: string): string {
  const weekStart = new Date(weekStartISO);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const startMonth = weekStart.toLocaleDateString('en-US', { month: 'short' });
  const startDay = weekStart.getDate();
  const endMonth = weekEnd.toLocaleDateString('en-US', { month: 'short' });
  const endDay = weekEnd.getDate();
  const year = weekStart.getFullYear();

  if (startMonth === endMonth) {
    return `${startMonth} ${startDay}-${endDay}, ${year}`;
  } else {
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
  }
}