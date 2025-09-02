import { useState, useCallback, useEffect, useRef } from 'react';
import { useProfile } from '../profile/context';
import { logEvent } from '../lib/analytics';

export type ScoutPriority = 'info' | 'actionable' | 'critical';

export interface ScoutQueueMessage {
  id: string;
  text: string;
  priority: ScoutPriority;
  cta?: {
    label: string;
    onClick: () => void;
  };
  timestamp: number;
}

interface ScoutQueueState {
  current: ScoutQueueMessage | null;
  queue: ScoutQueueMessage[];
  pendingCount: number;
  inbox: ScoutQueueMessage[];
}

// Global state to manage queue across components
let globalQueue: ScoutQueueMessage[] = [];
let globalCurrent: ScoutQueueMessage | null = null;
let globalInbox: ScoutQueueMessage[] = []; // Store dismissed actionable messages (last 5)
let subscribers: Array<(state: ScoutQueueState) => void> = [];
let dismissTimer: NodeJS.Timeout | null = null;
let messageHistory: Array<{ id: string; timestamp: number }> = [];

// Session tracking for guardrails
let sessionShownCounts: { info: number; actionable: number; critical: number } = { info: 0, actionable: 0, critical: 0 };
let sessionStartTime: number = Date.now();
let lastRateLimitReset: number = Date.now();
let currentMessageStartTime: number | null = null;

// Constants
const QUEUE_CAP = 3;
const COALESCE_WINDOW_MS = 30 * 1000; // 30 seconds
const DEFAULT_DISMISS_MS = 3000;
const CALM_DISMISS_MS = 4500;

// Guardrail constants (per 10 minutes)
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_INFO_PER_WINDOW = 6;
const MAX_ACTIONABLE_PER_WINDOW = 3;
const MAX_CRITICAL_PER_WINDOW = 2; // Critical messages should be rare
const CALM_MODE_REDUCTION = 0.8; // 20% reduction

function notifySubscribers() {
  const state: ScoutQueueState = {
    current: globalCurrent,
    queue: [...globalQueue],
    pendingCount: globalQueue.length,
    inbox: [...globalInbox]
  };
  
  subscribers.forEach(callback => callback(state));
}

function shouldCoalesce(newMessage: ScoutQueueMessage): boolean {
  const now = Date.now();
  
  // Check if same message ID appeared within coalesce window
  const recentDuplicate = messageHistory.find(
    msg => msg.id === newMessage.id && (now - msg.timestamp) < COALESCE_WINDOW_MS
  );
  
  return !!recentDuplicate;
}

function addToHistory(message: ScoutQueueMessage) {
  messageHistory.push({
    id: message.id,
    timestamp: message.timestamp
  });
  
  // Clean old entries (keep last 50 to prevent memory bloat)
  if (messageHistory.length > 50) {
    messageHistory = messageHistory.slice(-50);
  }
}

// Session tracking and guardrails helpers
function resetSessionCountsIfNeeded() {
  const now = Date.now();
  
  // Reset counters every 10 minutes
  if (now - lastRateLimitReset >= RATE_LIMIT_WINDOW_MS) {
    sessionShownCounts = { info: 0, actionable: 0, critical: 0 };
    lastRateLimitReset = now;
  }
}

function getSessionLimits(calmMode: boolean) {
  const multiplier = calmMode ? CALM_MODE_REDUCTION : 1;
  return {
    info: Math.floor(MAX_INFO_PER_WINDOW * multiplier),
    actionable: Math.floor(MAX_ACTIONABLE_PER_WINDOW * multiplier),
    critical: Math.floor(MAX_CRITICAL_PER_WINDOW * multiplier)
  };
}

function canShowMessage(priority: ScoutPriority, calmMode: boolean): boolean {
  resetSessionCountsIfNeeded();
  const limits = getSessionLimits(calmMode);
  
  switch (priority) {
    case 'info':
      return sessionShownCounts.info < limits.info;
    case 'actionable':
      return sessionShownCounts.actionable < limits.actionable;
    case 'critical':
      return sessionShownCounts.critical < limits.critical;
    default:
      return false;
  }
}

function recordMessageShown(priority: ScoutPriority) {
  resetSessionCountsIfNeeded();
  sessionShownCounts[priority]++;
}

function emitAnalyticsEvent(
  messageId: string,
  priority: ScoutPriority,
  action: 'shown' | 'clicked' | 'dismissed' | 'auto_dismiss',
  dwellMs?: number
) {
  try {
    import('../progress').then(({ pushEvent, getSessionId }) => {
      pushEvent({
        kind: 'scout_analytics',
        at: Date.now(),
        id: messageId,
        priority,
        action,
        dwellMs,
        sessionId: getSessionId()
      });
    });
  } catch (error) {
    console.warn('Failed to emit scout analytics event:', error);
  }
}

function processQueue() {
  if (globalCurrent || globalQueue.length === 0) {
    return;
  }
  
  // Show next message from queue
  globalCurrent = globalQueue.shift()!;
  currentMessageStartTime = Date.now();
  
  // Record as shown for session tracking
  recordMessageShown(globalCurrent.priority);
  
  notifySubscribers();
  
  // Log to analytics events
  logEvent({
    ts: new Date().toISOString(),
    loop: 1,
    action: 'start', // Using 'start' for scout message events
    meta: {
      eventType: 'scout_msg',
      priority: globalCurrent.priority,
      messageId: globalCurrent.id
    }
  });

  // Emit analytics event for shown
  emitAnalyticsEvent(globalCurrent.id, globalCurrent.priority, 'shown');

  // Also log as ProgressEvent for Timeline
  try {
    import('../progress').then(({ pushEvent }) => {
      pushEvent({
        kind: 'scout_msg',
        at: globalCurrent!.timestamp,
        messageId: globalCurrent!.id,
        priority: globalCurrent!.priority,
        text: globalCurrent!.text,
        cta: globalCurrent!.cta ? { 
          label: globalCurrent!.cta.label 
        } : undefined,
        dismissed: false
      });
    });
  } catch (error) {
    console.warn('Failed to log scout message as progress event:', error);
  }
}

function startDismissTimer(calmMode: boolean) {
  if (dismissTimer) {
    clearTimeout(dismissTimer);
  }
  
  const delay = calmMode ? CALM_DISMISS_MS : DEFAULT_DISMISS_MS;
  
  dismissTimer = setTimeout(() => {
    if (globalCurrent) {
      // Calculate dwell time
      const dwellMs = currentMessageStartTime ? Date.now() - currentMessageStartTime : undefined;
      
      // Emit analytics event for auto dismiss
      emitAnalyticsEvent(globalCurrent.id, globalCurrent.priority, 'auto_dismiss', dwellMs);
      
      // Add actionable messages to inbox when auto-dismissed
      if (globalCurrent.priority === 'actionable') {
        globalInbox.push(globalCurrent);
        
        // Keep only last 5 inbox items
        if (globalInbox.length > 5) {
          globalInbox.shift();
        }
      }
      
      globalCurrent = null;
      currentMessageStartTime = null;
      notifySubscribers();
      processQueue();
    }
  }, delay);
}

function pauseDismissTimer() {
  if (dismissTimer) {
    clearTimeout(dismissTimer);
    dismissTimer = null;
  }
}

function resumeDismissTimer(calmMode: boolean) {
  if (globalCurrent && !dismissTimer) {
    startDismissTimer(calmMode);
  }
}

export function useScoutQueue() {
  const { profile } = useProfile();
  const [state, setState] = useState<ScoutQueueState>({
    current: globalCurrent,
    queue: [...globalQueue],
    pendingCount: globalQueue.length,
    inbox: [...globalInbox]
  });
  
  const timerPausedRef = useRef(false);
  
  // Subscribe to global state changes
  useEffect(() => {
    const callback = (newState: ScoutQueueState) => {
      setState(newState);
    };
    
    subscribers.push(callback);
    
    return () => {
      subscribers = subscribers.filter(sub => sub !== callback);
    };
  }, []);
  
  // Auto-dismiss timer management
  useEffect(() => {
    if (globalCurrent && !timerPausedRef.current) {
      startDismissTimer(profile.calmMode);
    }
    
    return () => {
      if (dismissTimer) {
        clearTimeout(dismissTimer);
        dismissTimer = null;
      }
    };
  }, [globalCurrent, profile.calmMode]);
  
  const enqueue = useCallback((message: Omit<ScoutQueueMessage, 'timestamp'>) => {
    const fullMessage: ScoutQueueMessage = {
      ...message,
      timestamp: Date.now()
    };
    
    // Check for coalescing - skip duplicates within window
    if (shouldCoalesce(fullMessage)) {
      return;
    }
    
    // Check guardrails - respect session limits
    if (!canShowMessage(message.priority, profile.calmMode)) {
      // For actionable messages that hit limits, add to inbox only
      if (message.priority === 'actionable') {
        globalInbox.push(fullMessage);
        if (globalInbox.length > 5) {
          globalInbox.shift();
        }
        notifySubscribers();
      }
      // Info messages are ignored when limits hit
      return;
    }
    
    // Add to history for coalescing checks
    addToHistory(fullMessage);
    
    // Critical messages bypass queue and open ScoutSheet
    if (message.priority === 'critical') {
      // For critical messages, we'll trigger ScoutSheet opening
      // This will be handled by the component consuming this hook
      globalCurrent = fullMessage;
      currentMessageStartTime = Date.now();
      recordMessageShown(fullMessage.priority);
      notifySubscribers();
      
      // Log critical message immediately
      logEvent({
        ts: new Date().toISOString(),
        loop: 1,
        action: 'start',
        meta: {
          eventType: 'scout_msg_critical',
          priority: fullMessage.priority,
          messageId: fullMessage.id
        }
      });
      
      // Emit analytics event for critical message shown
      emitAnalyticsEvent(fullMessage.id, fullMessage.priority, 'shown');
      
      return;
    }
    
    // Add to queue if not at capacity
    if (globalQueue.length < QUEUE_CAP) {
      globalQueue.push(fullMessage);
    } else {
      // Replace oldest 'info' message if queue is full
      const oldestInfoIndex = globalQueue.findIndex(msg => msg.priority === 'info');
      if (oldestInfoIndex !== -1) {
        globalQueue.splice(oldestInfoIndex, 1);
        globalQueue.push(fullMessage);
      }
      // If no 'info' messages to replace, ignore the new message
    }
    
    notifySubscribers();
    
    // Process queue if no current message
    if (!globalCurrent) {
      processQueue();
    }
  }, [profile.calmMode]);
  
  const dismiss = useCallback(() => {
    if (globalCurrent) {
      pauseDismissTimer();
      
      // Calculate dwell time
      const dwellMs = currentMessageStartTime ? Date.now() - currentMessageStartTime : undefined;
      
      // Emit analytics event for manual dismiss
      emitAnalyticsEvent(globalCurrent.id, globalCurrent.priority, 'dismissed', dwellMs);
      
      // Add actionable messages to inbox when dismissed
      if (globalCurrent.priority === 'actionable') {
        globalInbox.push(globalCurrent);
        
        // Keep only last 5 inbox items
        if (globalInbox.length > 5) {
          globalInbox.shift();
        }
      }
      
      globalCurrent = null;
      currentMessageStartTime = null;
      notifySubscribers();
      processQueue();
    }
  }, []);
  
  const pauseTimer = useCallback(() => {
    timerPausedRef.current = true;
    pauseDismissTimer();
  }, []);
  
  const resumeTimer = useCallback(() => {
    timerPausedRef.current = false;
    resumeDismissTimer(profile.calmMode);
  }, [profile.calmMode]);
  
  // Flush 'info' messages
  const flushInfoMessages = useCallback(() => {
    globalQueue = globalQueue.filter(msg => msg.priority !== 'info');
    
    // Also dismiss current if it's info
    if (globalCurrent?.priority === 'info') {
      globalCurrent = null;
      pauseDismissTimer();
      processQueue();
    }
    
    notifySubscribers();
  }, []);
  
  // Remove message from inbox
  const removeFromInbox = useCallback((messageId: string) => {
    globalInbox = globalInbox.filter(msg => msg.id !== messageId);
    notifySubscribers();
  }, []);

  // Add CTA click handler
  const onCtaClick = useCallback((messageId: string) => {
    // Find message and emit analytics event
    const message = globalCurrent?.id === messageId ? globalCurrent : 
                   globalInbox.find(msg => msg.id === messageId);
    
    if (message) {
      emitAnalyticsEvent(message.id, message.priority, 'clicked');
    }
  }, []);

  return {
    current: state.current,
    enqueue,
    dismiss,
    pendingCount: state.pendingCount,
    inbox: state.inbox,
    pauseTimer,
    resumeTimer,
    flushInfoMessages,
    removeFromInbox,
    onCtaClick
  };
}

// Export function to reset queue state (useful for testing)
export function resetScoutQueue() {
  globalQueue = [];
  globalCurrent = null;
  globalInbox = [];
  messageHistory = [];
  sessionShownCounts = { info: 0, actionable: 0, critical: 0 };
  sessionStartTime = Date.now();
  lastRateLimitReset = Date.now();
  currentMessageStartTime = null;
  if (dismissTimer) {
    clearTimeout(dismissTimer);
    dismissTimer = null;
  }
  notifySubscribers();
}

// Export function to get current session stats (useful for testing)
export function getSessionStats() {
  resetSessionCountsIfNeeded();
  return {
    counts: { ...sessionShownCounts },
    sessionDuration: Date.now() - sessionStartTime,
    lastReset: lastRateLimitReset
  };
}