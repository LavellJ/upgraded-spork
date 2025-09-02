// Progress tracking barrel export
// Unified interface for progress events and metrics

export type { ProgressEvent } from './events';
export type { CompletionMetrics, JournalRecap, Lesson } from './metrics';

export {
  loadEvents,
  pushEvent,
  getEventsRange,
  getEventsBetween,
  getEventsByKind,
  clearEvents,
  getEventCount
} from './events';

export {
  overallCompletion,
  biomeCompletion,
  dayStreak,
  lastJournalRecap,
  getCompletionEvents,
  lessonSuccessRate,
  averageSessionDuration
} from './metrics';