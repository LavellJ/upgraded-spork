/**
 * Weekly engagement metrics for Guide reporting
 * Aggregates learner activity data for weekly CSV exports
 */

import { loadEvents, type ProgressEvent } from '../progress/events';
import { loadRoster, type LearnerProfile } from '../roster/model';

export interface WeeklyEngagementRow {
  learnerId: string;
  learnerName: string;
  minutes: number;           // Total active minutes in the week
  sessions: number;          // Number of distinct learning sessions
  return7d: boolean;         // Did they return within 7 days of first activity
  assignmentsDone: number;   // Assignments completed this week
  dueSoon: number;           // Assignments due in next 7 days
  overdue: number;           // Assignments past due date
}

/**
 * Build weekly engagement data for all learners
 * @param weekStartISO - ISO date string for Monday of the target week (e.g., "2025-01-13")
 * @returns Array of engagement rows, one per learner
 */
export function buildWeeklyEngagement(weekStartISO: string): WeeklyEngagementRow[] {
  const roster = loadRoster();
  if (!roster) {
    return [];
  }

  const weekStart = new Date(weekStartISO);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  return roster.learners.map(learner => 
    buildLearnerWeeklyEngagement(learner, weekStart, weekEnd)
  );
}

/**
 * Build engagement data for a single learner
 */
function buildLearnerWeeklyEngagement(
  learner: LearnerProfile, 
  weekStart: Date, 
  weekEnd: Date
): WeeklyEngagementRow {
  const learnerId = learner.id;
  const learnerName = learner.name;

  // Get all events for this learner in the week
  const allEvents = loadEvents(learnerId);
  const weekEvents = allEvents.filter(event => {
    const eventDate = new Date(event.at);
    return eventDate >= weekStart && eventDate < weekEnd;
  });

  // Calculate active minutes from on-task data
  const minutes = calculateActiveMinutes(learnerId, weekStart, weekEnd);

  // Calculate session count
  const sessions = calculateSessionCount(weekEvents);

  // Check 7-day return rate
  const return7d = calculateReturn7d(allEvents, weekStart);

  // Calculate assignment metrics
  const assignmentMetrics = calculateAssignmentMetrics(learnerId, weekStart, weekEnd);

  return {
    learnerId,
    learnerName,
    minutes: Math.round(minutes),
    sessions,
    return7d,
    assignmentsDone: assignmentMetrics.done,
    dueSoon: assignmentMetrics.dueSoon,
    overdue: assignmentMetrics.overdue
  };
}

/**
 * Calculate total active minutes for a learner in the given time range
 */
function calculateActiveMinutes(learnerId: string, weekStart: Date, weekEnd: Date): number {
  try {
    // TODO: Implement on-task time calculation when available
    // For now, use fallback estimation
  } catch (error) {
    // Fallback: estimate from lesson/journal events
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
      }
    });

    // Estimate from journal durations
    const journalFinishEvents = weekEvents.filter(e => e.kind === 'journal_finish') as Extract<ProgressEvent, { kind: 'journal_finish' }>[];
    journalFinishEvents.forEach(event => {
      if (event.durationSec) {
        totalMinutes += event.durationSec / 60;
      }
    });

    return totalMinutes;
  }
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
 * Check if learner returned within 7 days of their first activity this week
 */
function calculateReturn7d(allEvents: ProgressEvent[], weekStart: Date): boolean {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  // Find first activity in the week
  const weekEvents = allEvents.filter(event => {
    const eventDate = new Date(event.at);
    return eventDate >= weekStart && eventDate < weekEnd;
  });

  const activityEvents = weekEvents.filter(e => 
    e.kind === 'lesson_start' || e.kind === 'journal_start'
  );

  if (activityEvents.length === 0) return false;

  // Sort by timestamp
  activityEvents.sort((a, b) => a.at - b.at);
  const firstActivity = new Date(activityEvents[0].at);

  // Check for activity in the 7 days after first activity
  const returnWindow = new Date(firstActivity);
  returnWindow.setDate(returnWindow.getDate() + 7);

  const returnEvents = allEvents.filter(event => {
    const eventDate = new Date(event.at);
    return eventDate > firstActivity && eventDate <= returnWindow;
  });

  const returnActivityEvents = returnEvents.filter(e => 
    e.kind === 'lesson_start' || e.kind === 'journal_start'
  );

  return returnActivityEvents.length > 0;
}

/**
 * Calculate assignment-related metrics
 */
function calculateAssignmentMetrics(learnerId: string, weekStart: Date, weekEnd: Date): {
  done: number;
  dueSoon: number;
  overdue: number;
} {
  try {
    // TODO: Implement assignment tracking when available
    // For now, return placeholder data
    return { done: 0, dueSoon: 0, overdue: 0 };
    
    /* When assignments are available:
    const assignments = getAllAssignments(learnerId);
    const now = Date.now();
    const sevenDaysFromNow = now + (7 * 24 * 60 * 60 * 1000);

    let done = 0;
    let dueSoon = 0;
    let overdue = 0;

    assignments.forEach(assignment => {
      if (!assignment.dueAt) return;

      const dueDate = new Date(assignment.dueAt);
      
      // Check if assignment was completed this week
      const events = loadEvents(learnerId);
      const completionEvents = events.filter(event => {
        if (event.kind !== 'lesson_finish') return false;
        const eventDate = new Date(event.at);
        return eventDate >= weekStart && eventDate < weekEnd;
      });

      // Check if any lessons in this assignment were completed this week
      const assignmentCompleted = assignment.lessons.some(lesson => {
        return completionEvents.some(event => 
          (event as Extract<ProgressEvent, { kind: 'lesson_finish' }>).lessonId === lesson.lessonId &&
          event.result === 'pass'
        );
      });

      if (assignmentCompleted) {
        done++;
      }

      // Check if due soon or overdue
      if (dueDate.getTime() < now) {
        overdue++;
      } else if (dueDate.getTime() <= sevenDaysFromNow) {
        dueSoon++;
      }
    });

    return { done, dueSoon, overdue };
    */
  } catch (error) {
    console.warn('Failed to calculate assignment metrics:', error);
    return { done: 0, dueSoon: 0, overdue: 0 };
  }
}

/**
 * Export weekly engagement data as CSV
 */
export function downloadWeeklyEngagementCSV(weekStartISO: string): void {
  const data = buildWeeklyEngagement(weekStartISO);
  
  const headers = [
    'Learner ID',
    'Learner Name', 
    'Minutes',
    'Sessions',
    'Return 7d',
    'Assignments Done',
    'Due Soon',
    'Overdue'
  ];

  const rows = data.map(row => [
    row.learnerId,
    row.learnerName,
    row.minutes.toString(),
    row.sessions.toString(),
    row.return7d ? 'Yes' : 'No',
    row.assignmentsDone.toString(),
    row.dueSoon.toString(),
    row.overdue.toString()
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `weekly_engagement_${weekStartISO}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}