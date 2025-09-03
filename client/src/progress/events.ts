// Progress event logging for Quest Island
// Tracks lesson completion, journal sessions, and provides analytics foundation

export type ProgressEvent =
  | { kind: 'lesson_start'; at: number; lessonId: string; biomeId: string }
  | { kind: 'lesson_finish'; at: number; lessonId: string; biomeId: string; durationSec?: number; result?: 'pass' | 'retry' }
  | { kind: 'journal_start'; at: number; skillId: string }
  | { kind: 'journal_finish'; at: number; skillId: string; n: number; correct: number; durationSec?: number }
  | { kind: 'scout_msg'; at: number; messageId: string; priority: 'info' | 'actionable' | 'critical'; text: string; cta?: { label: string; clicked?: boolean }; dismissed?: boolean }
  | { kind: 'scout_analytics'; at: number; id: string; priority: 'info' | 'actionable' | 'critical'; action: 'shown' | 'clicked' | 'dismissed' | 'auto_dismiss'; dwellMs?: number; sessionId: string; abVariant?: Record<string, string> }
  | { kind: 'guide_ack'; at: number; noticeId: string; action: 'shown' | 'ack' | 'dismiss'; actor: 'guide' };

const STORAGE_KEY = 'qi.progress.history.v1';
const MAX_EVENTS = 5000;

/**
 * Load all progress events from localStorage, sorted by timestamp ascending
 */
export function loadEvents(): ProgressEvent[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
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
export function pushEvent(event: ProgressEvent): void {
  try {
    const events = loadEvents();
    
    // Add new event
    events.push(event);
    
    // Keep only the most recent MAX_EVENTS
    const trimmedEvents = events.length > MAX_EVENTS 
      ? events.slice(-MAX_EVENTS)
      : events;
    
    // Persist to storage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedEvents));
    
    // Enqueue for sync to backend
    try {
      // Dynamic import to avoid circular dependencies
      import('../sync/queue').then(({ enqueue }) => {
        enqueue({
          kind: 'event',
          payload: event,
          id: `event-${event.at}-${event.kind}`,
          at: event.at
        });
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
export function getEventsRange(days: number = 30): ProgressEvent[] {
  const events = loadEvents();
  
  if (days <= 0) return events;
  
  const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
  
  return events.filter(event => event.at >= cutoffTime);
}

/**
 * Get events for a specific date range
 */
export function getEventsBetween(startTime: number, endTime: number): ProgressEvent[] {
  const events = loadEvents();
  
  return events.filter(event => 
    event.at >= startTime && event.at <= endTime
  );
}

/**
 * Get events of a specific kind
 */
export function getEventsByKind<T extends ProgressEvent['kind']>(
  kind: T
): Extract<ProgressEvent, { kind: T }>[] {
  const events = loadEvents();
  
  return events.filter(event => event.kind === kind) as Extract<ProgressEvent, { kind: T }>[];
}

/**
 * Clear all progress events (useful for testing)
 */
export function clearEvents(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
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
export function getEventCount(): number {
  return loadEvents().length;
}

const SESSION_STORAGE_KEY = 'qi.session.id';

/**
 * Get or create a session ID that persists until browser reload
 * Used for tracking Scout analytics per session
 */
export function getSessionId(): string {
  try {
    let sessionId = sessionStorage.getItem(SESSION_STORAGE_KEY);
    
    if (!sessionId) {
      // Generate new session ID using timestamp + random
      sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId);
    }
    
    return sessionId;
  } catch (error) {
    // Fallback if sessionStorage is not available
    console.warn('Failed to access sessionStorage for session ID:', error);
    return `sess_${Date.now()}_fallback`;
  }
}