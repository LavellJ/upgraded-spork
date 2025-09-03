/**
 * On-task minutes tracking with idle detection and sessionization
 * Tracks active engagement time only, excluding idle periods
 */

import { ns, BASE_KEYS } from '../storage/namespace';
import { getActiveLearnerIdFallback } from '../roster/model';

export type OnTaskTick = {
  at: number;
  kind: 'start' | 'stop' | 'idle' | 'resume';
  source: 'lesson' | 'journal';
};

const STORAGE_KEY = BASE_KEYS.onTask;
const MAX_ENTRIES = 5000;
const IDLE_TIMEOUT_MS = 60 * 1000; // 60 seconds

// Global state
let idleTimer: number | null = null;
let isTracking = false;
let currentSource: 'lesson' | 'journal' | null = null;
let lastActivity = Date.now();

/**
 * Get the storage key for the current learner
 */
function getStorageKey(): string {
  const learnerId = getActiveLearnerIdFallback();
  return learnerId ? ns(learnerId, STORAGE_KEY) : STORAGE_KEY;
}

/**
 * Load on-task ticks from storage
 */
function loadTicks(): OnTaskTick[] {
  try {
    const stored = localStorage.getItem(getStorageKey());
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.warn('Failed to load on-task ticks:', error);
    return [];
  }
}

/**
 * Save on-task ticks to storage (capped at MAX_ENTRIES)
 */
function saveTicks(ticks: OnTaskTick[]): void {
  try {
    // Keep only the most recent entries
    const trimmed = ticks.slice(-MAX_ENTRIES);
    localStorage.setItem(getStorageKey(), JSON.stringify(trimmed));
  } catch (error) {
    console.warn('Failed to save on-task ticks:', error);
  }
}

/**
 * Push a new tick event
 */
function pushTick(tick: OnTaskTick): void {
  const ticks = loadTicks();
  ticks.push(tick);
  saveTicks(ticks);
}

/**
 * Setup idle detection listeners
 */
function setupIdleDetection(): void {
  const events = ['mousemove', 'keydown', 'touchstart'];
  
  function onActivity() {
    lastActivity = Date.now();
    
    // If we were idle and now have activity, resume
    if (isTracking && currentSource) {
      const lastTick = loadTicks().slice(-1)[0];
      if (lastTick && lastTick.kind === 'idle') {
        pushTick({
          at: Date.now(),
          kind: 'resume',
          source: currentSource
        });
      }
    }
    
    // Reset idle timer
    if (idleTimer) {
      clearTimeout(idleTimer);
    }
    
    if (isTracking) {
      idleTimer = window.setTimeout(() => {
        if (isTracking && currentSource && Date.now() - lastActivity >= IDLE_TIMEOUT_MS) {
          pushTick({
            at: Date.now(),
            kind: 'idle',
            source: currentSource
          });
        }
      }, IDLE_TIMEOUT_MS);
    }
  }
  
  // Add activity listeners
  events.forEach(event => {
    document.addEventListener(event, onActivity, { passive: true });
  });
  
  // Handle window visibility changes
  function onVisibilityChange() {
    if (document.hidden) {
      // Window is hidden - treat as idle
      if (isTracking && currentSource) {
        pushTick({
          at: Date.now(),
          kind: 'idle',
          source: currentSource
        });
      }
    } else {
      // Window is visible - resume if we were tracking
      if (isTracking && currentSource) {
        const lastTick = loadTicks().slice(-1)[0];
        if (lastTick && lastTick.kind === 'idle') {
          pushTick({
            at: Date.now(),
            kind: 'resume',
            source: currentSource
          });
        }
      }
    }
    
    // Update last activity time
    lastActivity = Date.now();
  }
  
  document.addEventListener('visibilitychange', onVisibilityChange);
}

// Initialize idle detection on module load
setupIdleDetection();

/**
 * Start tracking on-task time for a given source
 */
export function startOnTask(source: 'lesson' | 'journal'): void {
  // Stop any existing tracking first
  if (isTracking) {
    stopOnTask();
  }
  
  isTracking = true;
  currentSource = source;
  lastActivity = Date.now();
  
  pushTick({
    at: Date.now(),
    kind: 'start',
    source
  });
  
  // Start idle timer
  if (idleTimer) {
    clearTimeout(idleTimer);
  }
  
  idleTimer = window.setTimeout(() => {
    if (isTracking && currentSource && Date.now() - lastActivity >= IDLE_TIMEOUT_MS) {
      pushTick({
        at: Date.now(),
        kind: 'idle',
        source: currentSource
      });
    }
  }, IDLE_TIMEOUT_MS);
}

/**
 * Stop tracking on-task time
 */
export function stopOnTask(): void {
  if (!isTracking || !currentSource) {
    return;
  }
  
  pushTick({
    at: Date.now(),
    kind: 'stop',
    source: currentSource
  });
  
  isTracking = false;
  currentSource = null;
  
  if (idleTimer) {
    clearTimeout(idleTimer);
    idleTimer = null;
  }
}

/**
 * Calculate daily active minutes from on-task events
 * Excludes idle periods and only counts active engagement time
 */
export function getDailyMinutes(events: OnTaskTick[], dayTs: number = Date.now()): number {
  const dayStart = new Date(dayTs);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);
  
  // Filter events for the specified day
  const dayEvents = events.filter(event => 
    event.at >= dayStart.getTime() && event.at < dayEnd.getTime()
  );
  
  if (dayEvents.length === 0) {
    return 0;
  }
  
  let totalMinutes = 0;
  let sessionStart: number | null = null;
  let isActive = false;
  
  for (const event of dayEvents) {
    switch (event.kind) {
      case 'start':
        sessionStart = event.at;
        isActive = true;
        break;
        
      case 'stop':
        if (sessionStart && isActive) {
          totalMinutes += (event.at - sessionStart) / (1000 * 60);
        }
        sessionStart = null;
        isActive = false;
        break;
        
      case 'idle':
        if (sessionStart && isActive) {
          // Add time from session start to idle
          totalMinutes += (event.at - sessionStart) / (1000 * 60);
        }
        isActive = false;
        break;
        
      case 'resume':
        sessionStart = event.at;
        isActive = true;
        break;
    }
  }
  
  // Handle ongoing session at end of day
  if (sessionStart && isActive) {
    const endTime = Math.min(Date.now(), dayEnd.getTime());
    totalMinutes += (endTime - sessionStart) / (1000 * 60);
  }
  
  return Math.max(0, totalMinutes);
}

/**
 * Get all on-task ticks for the current learner
 */
export function getOnTaskTicks(): OnTaskTick[] {
  return loadTicks();
}

/**
 * Clear all on-task data (for testing/debugging)
 */
export function clearOnTaskData(): void {
  localStorage.removeItem(getStorageKey());
}