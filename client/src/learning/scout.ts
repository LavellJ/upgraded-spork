import { useState, useCallback, useEffect } from 'react';
import scoutLines from '../data/scout_lines.json';
import type { AgeBand } from './model';

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
  recentMessages: string[]; // LRU cache for repeat suppression
  moreHelpCount: number; // Track consecutive "more help" requests
}

// Global scout state
let scoutState: ScoutState = {
  wrongAnswerCount: 0,
  currentStreak: 0,
  lastMessageType: null,
  lastMessageTime: 0,
  recentMessages: [],
  moreHelpCount: 0
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

// Map age band to age bucket for message selection
function getAgeBucket(ageBand?: AgeBand): '5-8' | '9-12' {
  if (!ageBand) return '5-8'; // Default to younger bucket
  
  switch (ageBand) {
    case '5-6':
    case '7-8':
      return '5-8';
    case '9-10':
    case '11-12':
      return '9-12';
    default:
      return '5-8';
  }
}

// Get random message from age-appropriate bucket with LRU suppression
function getRandomMessage(messageData: Record<string, string[]>, ageBand?: AgeBand): string {
  const bucket = getAgeBucket(ageBand);
  const messages = messageData[bucket] || messageData['5-8'] || [];
  
  if (messages.length === 0) return "Let's keep exploring!";
  
  // Filter out recently used messages if we have enough alternatives
  const availableMessages = messages.filter(msg => !scoutState.recentMessages.includes(msg));
  const messagesToUse = availableMessages.length > 0 ? availableMessages : messages;
  
  const selectedMessage = messagesToUse[Math.floor(Math.random() * messagesToUse.length)];
  
  // Update LRU cache (keep last 3 messages)
  scoutState.recentMessages.push(selectedMessage);
  if (scoutState.recentMessages.length > 3) {
    scoutState.recentMessages.shift();
  }
  
  return selectedMessage;
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
    ageBand?: AgeBand;
  } = {}
) {
  const { name = "Explorer", streakCount = 0, lessonTitle = "", isCorrect = true, ageBand } = payload;
  
  // Handle different event types
  switch (event) {
    case 'lessonStart':
      if (shouldShowMessage(event)) {
        const message = getRandomMessage(scoutLines.start_lesson, ageBand);
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
        const message = getRandomMessage(scoutLines.fail_hint, ageBand);
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
            const message = getRandomMessage(scoutLines.streak, ageBand);
            const processedMessage = replaceTokens(message, { name, n: scoutState.currentStreak });
            const detailedMessage = `You've completed ${scoutState.currentStreak} lessons in a row! Your learning momentum is building beautifully.`;
            
            enqueueMessage(createMessage('streak', processedMessage, detailedMessage, true));
          } else {
            // Regular finish message
            const message = getRandomMessage(scoutLines.finish, ageBand);
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
        const message = getRandomMessage(scoutLines.encourage, ageBand);
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
  
  const requestMoreHelp = useCallback((ageBand?: AgeBand, learnerName?: string) => {
    scoutState.moreHelpCount++;
    
    if (scoutState.moreHelpCount >= 2) {
      // After second help request, offer journal
      const message = getRandomMessage(scoutLines.hint_2, ageBand);
      const processedMessage = replaceTokens(message, { name: learnerName || 'Explorer' });
      const detailedMessage = "Since you're looking for extra support, how about trying a quick Journal session? It's perfect for targeted practice!";
      
      enqueueMessage(createMessage('encourage', processedMessage, detailedMessage, true));
      scoutState.moreHelpCount = 0; // Reset after offering journal
    } else {
      // First help request, provide encouragement
      const message = getRandomMessage(scoutLines.hint_1, ageBand);
      const processedMessage = replaceTokens(message, { name: learnerName || 'Explorer' });
      const detailedMessage = "Take your time to think through the problem. Break it down into smaller steps if it helps!";
      
      enqueueMessage(createMessage('encourage', processedMessage, detailedMessage));
    }
  }, []);

  return {
    currentMessage,
    hasMessage: messageQueue.length > 0,
    dismissMessage,
    clearAllMessages,
    getScoutStats,
    requestMoreHelp,
    triggerEvent: triggerScoutEvent
  };
}

// Reset scout state (useful for testing/debugging)
export function resetScoutState() {
  scoutState = {
    wrongAnswerCount: 0,
    currentStreak: 0,
    lastMessageType: null,
    lastMessageTime: 0,
    recentMessages: [],
    moreHelpCount: 0
  };
  messageQueue = [];
  notifySubscribers();
}