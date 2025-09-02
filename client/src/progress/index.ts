// Progress tracking barrel export
// Unified interface for progress events and metrics

export type { ProgressEvent } from './events';
export type { CompletionMetrics, JournalRecap, Lesson, ScoutSummary, ScoutAnalytics } from './metrics';

export {
  loadEvents,
  pushEvent,
  getEventsRange,
  getEventsBetween,
  getEventsByKind,
  clearEvents,
  getEventCount,
  getSessionId
} from './events';

export {
  overallCompletion,
  biomeCompletion,
  dayStreak,
  lastJournalRecap,
  getCompletionEvents,
  lessonSuccessRate,
  averageSessionDuration,
  scoutSummary,
  scoutAnalytics
} from './metrics';