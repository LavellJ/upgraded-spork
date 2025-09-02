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

// Constants
const QUEUE_CAP = 3;
const COALESCE_WINDOW_MS = 30 * 1000; // 30 seconds
const DEFAULT_DISMISS_MS = 3000;
const CALM_DISMISS_MS = 4500;

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

function processQueue() {
  if (globalCurrent || globalQueue.length === 0) {
    return;
  }
  
  // Show next message from queue
  globalCurrent = globalQueue.shift()!;
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

  // Also log as ProgressEvent for Timeline
  try {
    import('../progress').then(({ pushEvent }) => {
      pushEvent({
        kind: 'scout_msg',
        at: globalCurrent.timestamp,
        messageId: globalCurrent.id,
        priority: globalCurrent.priority,
        text: globalCurrent.text,
        cta: globalCurrent.cta ? { 
          label: globalCurrent.cta.label 
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
      // Add actionable messages to inbox when auto-dismissed
      if (globalCurrent.priority === 'actionable') {
        globalInbox.push(globalCurrent);
        
        // Keep only last 5 inbox items
        if (globalInbox.length > 5) {
          globalInbox.shift();
        }
      }
      
      globalCurrent = null;
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
    
    // Add to history for coalescing checks
    addToHistory(fullMessage);
    
    // Critical messages bypass queue and open ScoutSheet
    if (message.priority === 'critical') {
      // For critical messages, we'll trigger ScoutSheet opening
      // This will be handled by the component consuming this hook
      globalCurrent = fullMessage;
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
  }, []);
  
  const dismiss = useCallback(() => {
    if (globalCurrent) {
      pauseDismissTimer();
      
      // Add actionable messages to inbox when dismissed
      if (globalCurrent.priority === 'actionable') {
        globalInbox.push(globalCurrent);
        
        // Keep only last 5 inbox items
        if (globalInbox.length > 5) {
          globalInbox.shift();
        }
      }
      
      globalCurrent = null;
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

  return {
    current: state.current,
    enqueue,
    dismiss,
    pendingCount: state.pendingCount,
    inbox: state.inbox,
    pauseTimer,
    resumeTimer,
    flushInfoMessages,
    removeFromInbox
  };
}

// Export function to reset queue state (useful for testing)
export function resetScoutQueue() {
  globalQueue = [];
  globalCurrent = null;
  globalInbox = [];
  messageHistory = [];
  if (dismissTimer) {
    clearTimeout(dismissTimer);
    dismissTimer = null;
  }
  notifySubscribers();
}