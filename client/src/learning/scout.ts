import { useState, useCallback, useEffect } from 'react';
import scoutLines from '../data/scout_lines.json';

// Scout event types
export type ScoutEvent = 
  | 'lessonStart'
  | 'answerWrong' 
  | 'lessonFinish'
  | 'streak'
  | 'encourage'
  | 'fail_hint';

// Scout message state
export interface ScoutMessage {
  id: string;
  type: ScoutEvent;
  message: string;
  detailedMessage?: string;
  showJournalCTA?: boolean;
  timestamp: number;
}

// Scout state tracking
interface ScoutState {
  wrongAnswerCount: number;
  currentStreak: number;
  lastMessageType: ScoutEvent | null;
  lastMessageTime: number;
}

// Global scout state
let scoutState: ScoutState = {
  wrongAnswerCount: 0,
  currentStreak: 0,
  lastMessageType: null,
  lastMessageTime: 0
};

// Message queue
let messageQueue: ScoutMessage[] = [];

// Subscribers for state updates
let subscribers: Array<() => void> = [];

// Token replacement function
function replaceTokens(message: string, tokens: Record<string, string | number> = {}): string {
  return message.replace(/\{(\w+)\}/g, (match, token) => {
    if (tokens[token] !== undefined) {
      return String(tokens[token]);
    }
    return match; // Return original if token not found
  });
}

// Get random message from array
function getRandomMessage(messages: string[]): string {
  return messages[Math.floor(Math.random() * messages.length)];
}

// Anti-spam: Check if we should show a message
function shouldShowMessage(eventType: ScoutEvent): boolean {
  const now = Date.now();
  const cooldownPeriod = 3000; // 3 seconds between similar messages
  
  if (scoutState.lastMessageType === eventType && 
      now - scoutState.lastMessageTime < cooldownPeriod) {
    return false;
  }
  
  return true;
}

// Create a scout message
function createMessage(
  type: ScoutEvent, 
  message: string, 
  detailedMessage?: string,
  showJournalCTA?: boolean
): ScoutMessage {
  return {
    id: `scout-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    message,
    detailedMessage,
    showJournalCTA,
    timestamp: Date.now()
  };
}

// Add message to queue and notify subscribers
function enqueueMessage(message: ScoutMessage) {
  messageQueue.push(message);
  scoutState.lastMessageType = message.type;
  scoutState.lastMessageTime = message.timestamp;
  notifySubscribers();
}

// Notify all subscribers
function notifySubscribers() {
  subscribers.forEach(callback => callback());
}

// Main trigger function
export function triggerScoutEvent(
  event: ScoutEvent, 
  payload: { 
    name?: string; 
    streakCount?: number; 
    lessonTitle?: string;
    isCorrect?: boolean;
  } = {}
) {
  const { name = "Explorer", streakCount = 0, lessonTitle = "", isCorrect = true } = payload;
  
  // Handle different event types
  switch (event) {
    case 'lessonStart':
      if (shouldShowMessage(event)) {
        const message = getRandomMessage(scoutLines.start_lesson);
        const processedMessage = replaceTokens(message, { name });
        const detailedMessage = lessonTitle ? 
          `We're about to tackle "${lessonTitle}". I'll be here to help if you need any guidance!` : 
          "I'll be here to help if you need any guidance along the way!";
        
        enqueueMessage(createMessage(event, processedMessage, detailedMessage));
      }
      break;
      
    case 'answerWrong':
      scoutState.wrongAnswerCount++;
      
      // Trigger hint after 2 wrong answers
      if (scoutState.wrongAnswerCount >= 2 && shouldShowMessage('fail_hint')) {
        const message = getRandomMessage(scoutLines.fail_hint);
        const processedMessage = replaceTokens(message, { name });
        const detailedMessage = "Remember, every mistake is a step toward understanding. Want to try approaching it differently?";
        
        enqueueMessage(createMessage('fail_hint', processedMessage, detailedMessage, true));
        scoutState.wrongAnswerCount = 0; // Reset after showing hint
      }
      break;
      
    case 'lessonFinish':
      if (shouldShowMessage(event)) {
        scoutState.wrongAnswerCount = 0; // Reset wrong count on completion
        
        if (isCorrect) {
          scoutState.currentStreak++;
          
          // Check for streak message first (takes priority)
          if (scoutState.currentStreak >= 3 && shouldShowMessage('streak')) {
            const message = getRandomMessage(scoutLines.streak);
            const processedMessage = replaceTokens(message, { name, n: scoutState.currentStreak });
            const detailedMessage = `You've completed ${scoutState.currentStreak} lessons in a row! Your learning momentum is building beautifully.`;
            
            enqueueMessage(createMessage('streak', processedMessage, detailedMessage, true));
          } else {
            // Regular finish message
            const message = getRandomMessage(scoutLines.finish);
            const processedMessage = replaceTokens(message, { name });
            const detailedMessage = "Great work! Each lesson completed makes you a stronger learner.";
            
            enqueueMessage(createMessage(event, processedMessage, detailedMessage));
          }
        } else {
          scoutState.currentStreak = 0; // Reset streak on failure
        }
      }
      break;
      
    case 'encourage':
      if (shouldShowMessage(event)) {
        const message = getRandomMessage(scoutLines.encourage);
        const processedMessage = replaceTokens(message, { name });
        
        enqueueMessage(createMessage(event, processedMessage));
      }
      break;
  }
}

// Hook for components to use Scout system
export function useScout() {
  const [, forceUpdate] = useState({});
  
  const refresh = useCallback(() => {
    forceUpdate({});
  }, []);
  
  useEffect(() => {
    subscribers.push(refresh);
    return () => {
      subscribers = subscribers.filter(sub => sub !== refresh);
    };
  }, [refresh]);
  
  const currentMessage = messageQueue.length > 0 ? messageQueue[0] : null;
  
  const dismissMessage = useCallback(() => {
    if (messageQueue.length > 0) {
      messageQueue.shift();
      notifySubscribers();
    }
  }, []);
  
  const clearAllMessages = useCallback(() => {
    messageQueue = [];
    notifySubscribers();
  }, []);
  
  const getScoutStats = useCallback(() => ({
    wrongAnswerCount: scoutState.wrongAnswerCount,
    currentStreak: scoutState.currentStreak,
    messageQueueLength: messageQueue.length
  }), []);
  
  return {
    currentMessage,
    hasMessage: messageQueue.length > 0,
    dismissMessage,
    clearAllMessages,
    getScoutStats,
    triggerEvent: triggerScoutEvent
  };
}

// Reset scout state (useful for testing/debugging)
export function resetScoutState() {
  scoutState = {
    wrongAnswerCount: 0,
    currentStreak: 0,
    lastMessageType: null,
    lastMessageTime: 0
  };
  messageQueue = [];
  notifySubscribers();
}