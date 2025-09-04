// Progress event logging for Quest Island
// Tracks lesson completion, journal sessions, and provides analytics foundation

export type ProgressEvent =
  | { kind: 'lesson_start'; at: number; lessonId: string; biomeId: string }
  | { kind: 'lesson_finish'; at: number; lessonId: string; biomeId: string; durationSec?: number; result?: 'pass' | 'retry' }
  | { kind: 'journal_start'; at: number; skillId: string; source?: 'scout' | 'guide' | 'manual' }
  | { kind: 'journal_finish'; at: number; skillId: string; n: number; correct: number; durationSec?: number; source?: 'scout' | 'guide' | 'manual' }
  | { kind: 'scout_msg'; at: number; messageId: string; priority: 'info' | 'actionable' | 'critical'; text: string; cta?: { label: string; clicked?: boolean }; dismissed?: boolean }
  | { kind: 'scout_analytics'; at: number; id: string; priority: 'info' | 'actionable' | 'critical'; action: 'shown' | 'clicked' | 'dismissed' | 'auto_dismiss' | 'routed_inbox'; dwellMs?: number; sessionId: string; abVariant?: Record<string, string> }
  | { kind: 'guide_ack'; at: number; noticeId: string; action: 'shown' | 'ack' | 'dismiss'; actor: 'guide' }
  | { kind: 'funnel'; at: number; step: 'onboard' | 'first_lesson_start' | 'first_lesson_finish' | 'first_journal' | 'assignment_received' | 'three_completions' };

import { ns, BASE_KEYS } from '../storage/namespace';

const MAX_EVENTS = 5000;

/**
 * Load all progress events from localStorage, sorted by timestamp ascending
 */
export function loadEvents(learnerId?: string): ProgressEvent[] {
  try {
    const storageKey = learnerId ? ns(learnerId, BASE_KEYS.progressHistory) : 'qi.progress.history.v1'; // fallback for legacy
    const stored = localStorage.getItem(storageKey);
    if (!stored) return [];
    
    const events = JSON.parse(stored) as ProgressEvent[];
    
    // Validate events have required fields
    const validEvents = events.filter(event => 
      event && 
      typeof event.kind === 'string' && 
      typeof event.at === 'number' &&
      event.at > 0
    );
    
    // Sort by timestamp ascending
    return validEvents.sort((a, b) => a.at - b.at);
  } catch (error) {
    console.warn('Failed to load progress events:', error);
    return [];
  }
}

/**
 * Add a new progress event and persist to localStorage
 * Maintains max events limit by removing oldest events
 * Also enqueues event for sync when online
 */
export function pushEvent(event: ProgressEvent, learnerId?: string): void {
  try {
    const events = loadEvents(learnerId);
    
    // Add new event
    events.push(event);
    
    // Keep only the most recent MAX_EVENTS
    const trimmedEvents = events.length > MAX_EVENTS 
      ? events.slice(-MAX_EVENTS)
      : events;
    
    // Persist to storage
    const storageKey = learnerId ? ns(learnerId, BASE_KEYS.progressHistory) : 'qi.progress.history.v1'; // fallback for legacy
    localStorage.setItem(storageKey, JSON.stringify(trimmedEvents));
    
    // Enqueue for sync to backend
    try {
      // Dynamic import to avoid circular dependencies
      import('../sync/queue').then(({ enqueue }) => {
        enqueue({
          kind: 'event',
          payload: event,
          id: `event-${event.at}-${event.kind}`,
          at: event.at
        }, learnerId);
      });
    } catch (syncError) {
      console.warn('Failed to enqueue event for sync:', syncError);
    }
    
    // Log in development for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('[Progress]', event.kind, {
        lessonId: 'lessonId' in event ? event.lessonId : undefined,
        skillId: 'skillId' in event ? event.skillId : undefined,
        biome: 'biomeId' in event ? event.biomeId : undefined,
        duration: 'durationSec' in event ? event.durationSec : undefined,
        result: 'result' in event ? event.result : undefined
      });
    }
  } catch (error) {
    console.error('Failed to save progress event:', error);
  }
}

/**
 * Get events from the last N days (default: 30 days)
 * Returns events sorted by timestamp ascending
 */
export function getEventsRange(days: number = 30, learnerId?: string): ProgressEvent[] {
  const events = loadEvents(learnerId);
  
  if (days <= 0) return events;
  
  const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
  
  return events.filter(event => event.at >= cutoffTime);
}

/**
 * Get events for a specific date range
 */
export function getEventsBetween(startTime: number, endTime: number, learnerId?: string): ProgressEvent[] {
  const events = loadEvents(learnerId);
  
  return events.filter(event => 
    event.at >= startTime && event.at <= endTime
  );
}

/**
 * Get events of a specific kind
 */
export function getEventsByKind<T extends ProgressEvent['kind']>(
  kind: T,
  learnerId?: string
): Extract<ProgressEvent, { kind: T }>[] {
  const events = loadEvents(learnerId);
  
  return events.filter(event => event.kind === kind) as Extract<ProgressEvent, { kind: T }>[];
}

/**
 * Clear all progress events (useful for testing)
 */
export function clearEvents(learnerId?: string): void {
  try {
    const storageKey = learnerId ? ns(learnerId, BASE_KEYS.progressHistory) : 'qi.progress.history.v1'; // fallback for legacy
    localStorage.removeItem(storageKey);
    if (process.env.NODE_ENV === 'development') {
      console.log('[Progress] Events cleared');
    }
  } catch (error) {
    console.error('Failed to clear progress events:', error);
  }
}

/**
 * Get total event count
 */
export function getEventCount(learnerId?: string): number {
  return loadEvents(learnerId).length;
}


/**
 * Check if a funnel step has already been reached
 */
function hasFunnelStep(step: string, learnerId?: string): boolean {
  const events = loadEvents(learnerId);
  return events.some(event => 
    event.kind === 'funnel' && 'step' in event && event.step === step
  );
}

/**
 * Track funnel milestone if not already reached
 */
export function trackFunnelStep(step: 'onboard' | 'first_lesson_start' | 'first_lesson_finish' | 'first_journal' | 'assignment_received' | 'three_completions', learnerId?: string): void {
  // Only track if step hasn't been reached before
  if (!hasFunnelStep(step, learnerId)) {
    pushEvent({
      kind: 'funnel',
      at: Date.now(),
      step
    }, learnerId);
  }
}

/**
 * Check lesson completion count and trigger three_completions if needed
 */
export function checkThreeCompletions(learnerId?: string): void {
  const events = loadEvents(learnerId);
  const completions = events.filter(event => event.kind === 'lesson_finish').length;
  
  if (completions >= 3) {
    trackFunnelStep('three_completions', learnerId);
  }
}