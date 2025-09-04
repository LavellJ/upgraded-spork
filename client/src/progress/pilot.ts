/**
 * Pilot KPI metrics and analytics
 * Provides weekly overview statistics for pilot programs
 */

import { loadRoster } from '../roster/model';
import { getActiveClass, loadClasses } from '../roster/classes';
import { loadEvents } from '../progress/events';
import { getActiveAssignments } from '../guide/assign';
import { getNpsAnalytics } from '../feedback/nps';
import { ns, BASE_KEYS } from '../storage/namespace';

export interface PilotKPIs {
  learners: number;
  avgOnTaskMins: number;
  return7dPct: number;          // % of actives who returned within 7 days
  assignCompletionPct: number;  // % assigned lessons completed
  npsAvg?: number;
  npsCount?: number;
}

/**
 * Build pilot KPIs for a given week
 */
export function buildPilotKPIs(weekStartISO: string): PilotKPIs {
  const weekStart = new Date(weekStartISO);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  
  // Get all learners across all classes (for pilot scope)
  const roster = loadRoster();
  const allLearners = roster?.learners || [];
  
  if (allLearners.length === 0) {
    return {
      learners: 0,
      avgOnTaskMins: 0,
      return7dPct: 0,
      assignCompletionPct: 0,
      npsAvg: 0,
      npsCount: 0
    };
  }

  // Calculate active minutes for all learners
  let totalActiveMinutes = 0;
  let activeLearnerCount = 0;
  let returnedLearnerCount = 0;
  let totalAssigned = 0;
  let totalCompleted = 0;

  const learnerIds = allLearners.map(learner => learner.id);

  // Collect metrics for each learner
  learnerIds.forEach(learnerId => {
    // Calculate active minutes for the week
    const weekMinutes = calculateActiveMinutes(learnerId, weekStart, weekEnd);
    
    if (weekMinutes > 0) {
      activeLearnerCount++;
      totalActiveMinutes += weekMinutes;
      
      // Check if this learner returned within 7 days after the week
      const returnWindow = new Date(weekEnd);
      returnWindow.setDate(returnWindow.getDate() + 7);
      
      const returnMinutes = calculateActiveMinutes(learnerId, weekEnd, returnWindow);
      if (returnMinutes > 0) {
        returnedLearnerCount++;
      }
    }

    // Calculate assignment metrics
    try {
      const assignments = getActiveAssignments(learnerId, { includeArchived: false });
      const events = loadEvents(learnerId);
      
      // Find lessons completed this week
      const weekEvents = events.filter(event => {
        const eventDate = new Date(event.at);
        return eventDate >= weekStart && eventDate < weekEnd;
      });
      
      const completionEvents = weekEvents.filter(e => 
        e.kind === 'lesson_finish' && (e as any).result === 'pass'
      );

      // Count assigned vs completed
      assignments.forEach(assignment => {
        assignment.lessons.forEach(lesson => {
          totalAssigned++;
          
          // Check if completed this week
          const wasCompletedThisWeek = completionEvents.some(event => 
            (event as any).lessonId === lesson.lessonId
          );
          
          if (wasCompletedThisWeek && lesson.status === 'done') {
            totalCompleted++;
          }
        });
      });
    } catch (error) {
      console.warn('Failed to calculate assignment metrics for learner:', learnerId, error);
    }
  });

  // Calculate percentages
  const return7dPct = activeLearnerCount > 0 
    ? Math.round((returnedLearnerCount / activeLearnerCount) * 100) 
    : 0;
  
  const assignCompletionPct = totalAssigned > 0 
    ? Math.round((totalCompleted / totalAssigned) * 100) 
    : 0;
  
  const avgOnTaskMins = activeLearnerCount > 0 
    ? Math.round(totalActiveMinutes / activeLearnerCount) 
    : 0;

  // Get NPS analytics across all learners
  let npsAvg: number | undefined;
  let npsCount: number | undefined;
  
  try {
    // Aggregate NPS across all learners
    let totalNpsScore = 0;
    let totalNpsResponses = 0;
    
    learnerIds.forEach(learnerId => {
      const npsData = getNpsAnalytics(learnerId);
      if (npsData.totalResponses > 0) {
        totalNpsScore += npsData.averageScore * npsData.totalResponses;
        totalNpsResponses += npsData.totalResponses;
      }
    });
    
    if (totalNpsResponses > 0) {
      npsAvg = Math.round((totalNpsScore / totalNpsResponses) * 10) / 10;
      npsCount = totalNpsResponses;
    }
  } catch (error) {
    console.warn('Failed to calculate NPS metrics:', error);
  }

  return {
    learners: allLearners.length,
    avgOnTaskMins,
    return7dPct,
    assignCompletionPct,
    npsAvg,
    npsCount
  };
}

/**
 * Calculate active minutes for a learner within a date range
 * Based on classMetrics.ts calculateActiveMinutes
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
 * Fallback calculation using lesson/journal events
 */
function fallbackCalculateActiveMinutes(learnerId: string, weekStart: Date, weekEnd: Date): number {
  try {
    const events = loadEvents(learnerId);
    const weekEvents = events.filter(event => {
      const eventDate = new Date(event.at);
      return eventDate >= weekStart && eventDate < weekEnd;
    });

    // Estimate based on lesson completions (rough approximation)
    const lessonCompletions = weekEvents.filter(e => e.kind === 'lesson_finish');
    const journalFinish = weekEvents.filter(e => e.kind === 'journal_finish');
    
    // Rough estimates: 15 mins per lesson, 5 mins per journal entry
    return (lessonCompletions.length * 15) + (journalFinish.length * 5);
  } catch (error) {
    console.warn('Fallback calculation failed:', error);
    return 0;
  }
}

/**
 * Get KPI comparison with previous week
 */
export function getPilotKPIsWithDelta(weekStartISO: string): {
  current: PilotKPIs;
  previous: PilotKPIs;
  deltas: {
    learners: number;
    avgOnTaskMins: number;
    return7dPct: number;
    assignCompletionPct: number;
    npsAvg?: number;
  };
} {
  const current = buildPilotKPIs(weekStartISO);
  
  // Calculate previous week
  const prevWeekStart = new Date(weekStartISO);
  prevWeekStart.setDate(prevWeekStart.getDate() - 7);
  const previous = buildPilotKPIs(prevWeekStart.toISOString().split('T')[0]);
  
  // Calculate deltas
  const deltas = {
    learners: current.learners - previous.learners,
    avgOnTaskMins: current.avgOnTaskMins - previous.avgOnTaskMins,
    return7dPct: current.return7dPct - previous.return7dPct,
    assignCompletionPct: current.assignCompletionPct - previous.assignCompletionPct,
    npsAvg: (current.npsAvg && previous.npsAvg) ? 
      Math.round((current.npsAvg - previous.npsAvg) * 10) / 10 : undefined
  };
  
  return {
    current,
    previous,
    deltas
  };
}