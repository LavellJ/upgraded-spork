import { getActiveAssignments, isDueSoon, isOverdue, type AssignedPathV2 } from '../guide/assign';
import { useScoutQueue } from '../hooks/useScoutQueue';

interface AssignmentNudgeResult {
  nudged: boolean;
  reason?: string;
}

/**
 * Check for assignment nudges and enqueue appropriate Scout messages
 * Respects throttling: max 1 assignment nudge per 10 minutes
 */
export function checkAssignmentNudges(
  learnerId?: string,
  enqueue?: ReturnType<typeof useScoutQueue>['enqueue'],
  focusPin?: (lessonId: string) => void
): AssignmentNudgeResult {
  if (!learnerId || !enqueue) {
    return { nudged: false, reason: 'missing_params' };
  }

  // Check if assignment nudges are disabled via feature flag
  const nudgesEnabled = localStorage.getItem('qi.features.assignmentNudges') !== 'false';
  if (!nudgesEnabled) {
    return { nudged: false, reason: 'nudges_disabled' };
  }

  const now = Date.now();
  
  // Check throttling (this will be handled by the useScoutQueue hook's throttling mechanism)
  const assignments = getActiveAssignments(learnerId);
  if (assignments.length === 0) {
    return { nudged: false, reason: 'no_assignments' };
  }

  // Find the most urgent assignment lesson
  let urgentLesson: { lessonId: string; pathName: string; dueAt?: number; status: 'overdue' | 'due_soon' } | null = null;

  for (const path of assignments) {
    for (const lesson of path.lessons) {
      // Skip completed lessons
      if (lesson.status === 'done') continue;

      const effectiveDueAt = lesson.dueAt || path.dueAt;
      if (!effectiveDueAt) continue;

      if (isOverdue(effectiveDueAt, now)) {
        urgentLesson = {
          lessonId: lesson.lessonId,
          pathName: path.name,
          dueAt: effectiveDueAt,
          status: 'overdue'
        };
        break; // Overdue takes highest priority
      } else if (isDueSoon(effectiveDueAt, now) && !urgentLesson) {
        urgentLesson = {
          lessonId: lesson.lessonId,
          pathName: path.name,
          dueAt: effectiveDueAt,
          status: 'due_soon'
        };
      }
    }
    
    if (urgentLesson?.status === 'overdue') break; // Stop if we found overdue
  }

  if (!urgentLesson) {
    return { nudged: false, reason: 'no_urgent_assignments' };
  }

  // Prepare nudge message
  const isOverdueLesson = urgentLesson.status === 'overdue';
  const messageText = isOverdueLesson
    ? "An assignment is overdue—shall we tackle it?"
    : "Want to work on your assignment?";

  // Enqueue the nudge
  const result = enqueue({
    id: 'assign_nudge',
    priority: 'actionable',
    text: messageText,
    cta: {
      label: 'Go to it',
      onClick: () => {
        if (focusPin) {
          focusPin(urgentLesson.lessonId);
        }
      }
    }
  }, {
    lessonId: urgentLesson.lessonId // Context for guardrails
  });

  if (result.shown) {
    return { 
      nudged: true, 
      reason: `${urgentLesson.status}_assignment_nudge_shown`
    };
  } else {
    return { 
      nudged: false, 
      reason: `throttled_${result.reason || 'unknown'}`
    };
  }
}

/**
 * Get assignment nudge analytics for insights
 */
export function getAssignmentNudgeAnalytics(timeframeDays: number = 7): {
  shown: number;
  clicked: number;
} {
  // This would integrate with the existing analytics system
  // For now, return placeholder data
  return {
    shown: 0,
    clicked: 0
  };
}