import scoutLines from '../data/scout_lines.json';
import type { AgeBand } from './model';
import type { ScoutPriority, ScoutQueueMessage } from '../hooks/useScoutQueue';

// Legacy Scout event types
export type ScoutEvent = 
  | 'lessonStart'
  | 'answerWrong' 
  | 'lessonFinish'
  | 'streak'
  | 'encourage'
  | 'fail_hint';

// Global scout state tracking
interface ScoutState {
  wrongAnswerCount: number;
  currentStreak: number;
  lastMessageType: ScoutEvent | null;
  lastMessageTime: number;
  recentMessages: string[]; // LRU cache for repeat suppression
  moreHelpCount: number; // Track consecutive "more help" requests
  scoutJournalSessions: number[]; // Timestamps of scout-triggered journal sessions
  isInCooldown: boolean;
}

// Global scout state
let scoutState: ScoutState = {
  wrongAnswerCount: 0,
  currentStreak: 0,
  lastMessageType: null,
  lastMessageTime: 0,
  recentMessages: [],
  moreHelpCount: 0,
  scoutJournalSessions: [],
  isInCooldown: false
};

// Global queue instance reference (will be set by useScoutQueue hook)
let globalEnqueue: ((message: Omit<ScoutQueueMessage, 'timestamp'>) => void) | null = null;
let globalFlushInfoMessages: (() => void) | null = null;

// Global journal opener function (will be set by App component)
let globalOpenJournalFromScout: ((skillId: string) => void) | null = null;
let globalCurrentSkillId: string | null = null;

// Set queue functions (called by components using the hook)
export function setScoutQueueFunctions(
  enqueue: (message: Omit<ScoutQueueMessage, 'timestamp'>) => void,
  flushInfoMessages: () => void
) {
  globalEnqueue = enqueue;
  globalFlushInfoMessages = flushInfoMessages;
}

// Set journal opener function (called by App component)
export function setJournalOpener(openJournal: (skillId: string) => void) {
  globalOpenJournalFromScout = openJournal;
}

// Set current skill ID (called by journal sessions)
export function setCurrentSkillId(skillId: string | null) {
  globalCurrentSkillId = skillId;
}

// Track scout-triggered journal sessions for dosage safeguards
export function trackScoutJournalSession() {
  const now = Date.now();
  
  // Add current session timestamp
  scoutState.scoutJournalSessions.push(now);
  
  // Remove sessions older than 10 minutes
  const tenMinutesAgo = now - (10 * 60 * 1000);
  scoutState.scoutJournalSessions = scoutState.scoutJournalSessions.filter(
    timestamp => timestamp > tenMinutesAgo
  );
  
  // Check if we've hit the dosage limit (2 sessions in 10 minutes)
  if (scoutState.scoutJournalSessions.length >= 2) {
    scoutState.isInCooldown = true;
    
    // Auto-exit cooldown after 10 minutes
    setTimeout(() => {
      scoutState.isInCooldown = false;
    }, 10 * 60 * 1000);
  }
}

// Check if Scout is in cooldown period
export function isScoutInCooldown(): boolean {
  return scoutState.isInCooldown;
}

// Get cooldown info for debug display
export function getScoutCooldownInfo() {
  const now = Date.now();
  const tenMinutesAgo = now - (10 * 60 * 1000);
  const recentSessions = scoutState.scoutJournalSessions.filter(
    timestamp => timestamp > tenMinutesAgo
  );
  
  return {
    isInCooldown: scoutState.isInCooldown,
    recentSessionCount: recentSessions.length,
    nextCooldownReset: scoutState.isInCooldown ? 
      Math.max(...scoutState.scoutJournalSessions) + (10 * 60 * 1000) : null
  };
}

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
function getRandomMessage(messageData: any, ageBand?: AgeBand): string {
  const bucket = getAgeBucket(ageBand);
  const messageObjects = messageData[bucket] || messageData['all'] || messageData['5-8'] || [];
  
  if (messageObjects.length === 0) return "Let's keep exploring!";
  
  // Extract text from message objects and filter by LRU
  const messageTexts = messageObjects.map((msg: any) => msg.text);
  const availableMessages = messageTexts.filter((msg: string) => !scoutState.recentMessages.includes(msg));
  const messagesToUse = availableMessages.length > 0 ? availableMessages : messageTexts;
  
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

// Map Scout event types to priorities
function getEventPriority(eventType: ScoutEvent): ScoutPriority {
  switch (eventType) {
    case 'fail_hint':
      return 'actionable';
    case 'streak':
      return 'actionable';
    case 'encourage':
      return 'actionable';
    default:
      return 'info';
  }
}

// Enqueue a Scout message using the new queue system
function enqueueScoutMessage(
  eventType: ScoutEvent,
  message: string,
  detailedMessage?: string,
  showJournalCTA?: boolean
) {
  if (!globalEnqueue) {
    console.warn('Scout queue not initialized');
    return;
  }

  const priority = getEventPriority(eventType);
  const queueMessage: Omit<ScoutQueueMessage, 'timestamp'> = {
    id: `scout-${eventType}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    text: message,
    priority,
    cta: showJournalCTA ? {
      label: 'Try Journal',
      onClick: () => {
        if (globalOpenJournalFromScout && globalCurrentSkillId) {
          // Track this scout-triggered journal session for dosage safeguards
          trackScoutJournalSession();
          globalOpenJournalFromScout(globalCurrentSkillId);
        } else {
          console.warn('Journal opener or skillId not available');
        }
      }
    } : undefined
  };

  globalEnqueue(queueMessage);
  
  // Update legacy state tracking
  scoutState.lastMessageType = eventType;
  scoutState.lastMessageTime = Date.now();
}

// Main trigger function (updated to use queue)
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
        const message = getRandomMessage(scoutLines.groups.start_lesson, ageBand);
        const processedMessage = replaceTokens(message, { name });
        
        enqueueScoutMessage(event, processedMessage);
      }
      break;
      
    case 'answerWrong':
      scoutState.wrongAnswerCount++;
      
      // Trigger hint after 2 wrong answers, but check dosage safeguards
      if (scoutState.wrongAnswerCount >= 2 && shouldShowMessage('fail_hint')) {
        if (scoutState.isInCooldown) {
          // In cooldown - downgrade to info message suggesting a break
          const cooldownMessage = "Perhaps it's time for a quick break? Taking breaks helps us learn better!";
          const processedMessage = replaceTokens(cooldownMessage, { name });
          
          enqueueScoutMessage('encourage', processedMessage);
        } else {
          // Normal fail_hint message with journal CTA
          const message = getRandomMessage(scoutLines.groups.fail_hint, ageBand);
          const processedMessage = replaceTokens(message, { name });
          
          enqueueScoutMessage('fail_hint', processedMessage, undefined, true);
        }
        scoutState.wrongAnswerCount = 0; // Reset after showing hint
      }
      break;
      
    case 'lessonFinish':
      // Flush info messages on lesson completion
      if (globalFlushInfoMessages) {
        globalFlushInfoMessages();
      }
      
      if (shouldShowMessage(event)) {
        scoutState.wrongAnswerCount = 0; // Reset wrong count on completion
        
        if (isCorrect) {
          scoutState.currentStreak++;
          
          // Check for streak message first (takes priority)
          if (scoutState.currentStreak >= 3 && shouldShowMessage('streak')) {
            const message = getRandomMessage(scoutLines.groups.streak, ageBand);
            const processedMessage = replaceTokens(message, { name, n: scoutState.currentStreak });
            
            enqueueScoutMessage('streak', processedMessage, undefined, true);
          } else {
            // Regular finish message
            const message = getRandomMessage(scoutLines.groups.finish, ageBand);
            const processedMessage = replaceTokens(message, { name });
            
            enqueueScoutMessage(event, processedMessage);
          }
        } else {
          scoutState.currentStreak = 0; // Reset streak on failure
        }
      }
      break;
      
    case 'encourage':
      if (shouldShowMessage(event)) {
        const message = getRandomMessage(scoutLines.groups.encourage, ageBand);
        const processedMessage = replaceTokens(message, { name });
        
        enqueueScoutMessage(event, processedMessage);
      }
      break;
  }
}

// Get scout stats
export function getScoutStats() {
  return {
    wrongAnswerCount: scoutState.wrongAnswerCount,
    currentStreak: scoutState.currentStreak,
    lastMessageType: scoutState.lastMessageType,
    lastMessageTime: scoutState.lastMessageTime,
    recentMessages: [...scoutState.recentMessages],
    moreHelpCount: scoutState.moreHelpCount,
    scoutJournalSessions: [...scoutState.scoutJournalSessions],
    isInCooldown: scoutState.isInCooldown
  };
}

// Request more help function
export function requestMoreHelp(ageBand?: AgeBand, learnerName?: string) {
  scoutState.moreHelpCount++;
  
  if (scoutState.moreHelpCount >= 2) {
    // After second help request, offer journal
    const message = getRandomMessage(scoutLines.groups.journal_encourage, ageBand);
    const processedMessage = replaceTokens(message, { name: learnerName || 'Explorer' });
    
    enqueueScoutMessage('encourage', processedMessage, undefined, true);
    scoutState.moreHelpCount = 0; // Reset after offering journal
  } else {
    // First help request, provide encouragement
    const message = getRandomMessage(scoutLines.groups.encourage, ageBand);
    const processedMessage = replaceTokens(message, { name: learnerName || 'Explorer' });
    
    enqueueScoutMessage('encourage', processedMessage);
  }
}

// Reset scout state (useful for testing/debugging)
export function resetScoutState() {
  scoutState = {
    wrongAnswerCount: 0,
    currentStreak: 0,
    lastMessageType: null,
    lastMessageTime: 0,
    recentMessages: [],
    moreHelpCount: 0,
    scoutJournalSessions: [],
    isInCooldown: false
  };
}

