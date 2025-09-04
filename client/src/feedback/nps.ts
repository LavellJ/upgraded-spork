// client/src/feedback/nps.ts
import { loadEvents } from '../progress/events';
import { getOnTaskTicks } from '../analytics/onTask';
import { addFeedback, type Feedback } from './model';

export interface NpsRecord {
  score: number; // 0-10
  note?: string;
  at: number;
  onTaskMinutes: number;
  completionCount: number;
}

const NPS_STORAGE_KEY = 'qi.nps.history.v1';
const NPS_THROTTLE_KEY = 'qi.nps.throttle.v1';

// Thresholds for showing NPS survey
const MIN_ON_TASK_MINUTES = 20;
const MIN_COMPLETED_ACTIVITIES = 3;
const THROTTLE_DAYS = 14;
const SNOOZE_DAYS = 7;

/**
 * Get NPS history for a user
 */
export function getNpsHistory(learnerId?: string): NpsRecord[] {
  try {
    const key = learnerId ? `qi.nps.history.${learnerId}.v1` : NPS_STORAGE_KEY;
    const stored = localStorage.getItem(key);
    if (!stored) return [];
    
    const records = JSON.parse(stored) as NpsRecord[];
    return records.filter(record => 
      record && 
      typeof record.score === 'number' && 
      typeof record.at === 'number' &&
      record.score >= 0 && 
      record.score <= 10
    );
  } catch (error) {
    console.warn('Failed to load NPS history:', error);
    return [];
  }
}

/**
 * Get throttle state for NPS surveys
 */
function getThrottleState(learnerId?: string): { lastAsked?: number; snoozedUntil?: number } {
  try {
    const key = learnerId ? `qi.nps.throttle.${learnerId}.v1` : NPS_THROTTLE_KEY;
    const stored = localStorage.getItem(key);
    if (!stored) return {};
    
    return JSON.parse(stored);
  } catch (error) {
    console.warn('Failed to load NPS throttle state:', error);
    return {};
  }
}

/**
 * Update throttle state for NPS surveys
 */
function updateThrottleState(learnerId: string | undefined, state: { lastAsked?: number; snoozedUntil?: number }): void {
  try {
    const key = learnerId ? `qi.nps.throttle.${learnerId}.v1` : NPS_THROTTLE_KEY;
    localStorage.setItem(key, JSON.stringify(state));
  } catch (error) {
    console.warn('Failed to save NPS throttle state:', error);
  }
}

/**
 * Calculate current engagement metrics
 */
function getCurrentEngagementMetrics(learnerId?: string): { onTaskMinutes: number; completionCount: number } {
  // Calculate total on-task time from ticks
  const ticks = getOnTaskTicks();
  let totalTimeMs = 0;
  let sessionStart: number | null = null;
  let isActive = false;
  
  for (const tick of ticks) {
    switch (tick.kind) {
      case 'start':
        sessionStart = tick.at;
        isActive = true;
        break;
      case 'stop':
        if (sessionStart && isActive) {
          totalTimeMs += tick.at - sessionStart;
        }
        sessionStart = null;
        isActive = false;
        break;
      case 'idle':
        if (sessionStart && isActive) {
          totalTimeMs += tick.at - sessionStart;
        }
        isActive = false;
        break;
      case 'resume':
        sessionStart = tick.at;
        isActive = true;
        break;
    }
  }
  
  // Handle ongoing session
  if (sessionStart && isActive) {
    totalTimeMs += Date.now() - sessionStart;
  }
  
  const onTaskMinutes = Math.round(totalTimeMs / (1000 * 60));
  
  // Get completion count from recent events
  const events = loadEvents(learnerId);
  const completionEvents = events.filter(event => 
    event.kind === 'lesson_finish' && 
    'result' in event && 
    event.result === 'pass'
  );
  
  return {
    onTaskMinutes,
    completionCount: completionEvents.length
  };
}

/**
 * Determine if we should ask for NPS feedback
 * Rules:
 * - After 20+ on-task minutes OR 3+ completed activities
 * - Not asked in last 14 days
 * - Not snoozed
 */
export function shouldAskNps(learnerId?: string): boolean {
  const { onTaskMinutes, completionCount } = getCurrentEngagementMetrics(learnerId);
  
  // Check engagement thresholds
  const hasMinEngagement = onTaskMinutes >= MIN_ON_TASK_MINUTES || completionCount >= MIN_COMPLETED_ACTIVITIES;
  if (!hasMinEngagement) {
    return false;
  }
  
  // Check throttling
  const throttleState = getThrottleState(learnerId);
  const now = Date.now();
  
  // Check if snoozed (user closed without answering)
  if (throttleState.snoozedUntil && now < throttleState.snoozedUntil) {
    return false;
  }
  
  // Check if asked recently
  if (throttleState.lastAsked) {
    const daysSinceLastAsked = (now - throttleState.lastAsked) / (1000 * 60 * 60 * 24);
    if (daysSinceLastAsked < THROTTLE_DAYS) {
      return false;
    }
  }
  
  return true;
}

/**
 * Record NPS feedback
 */
export function recordNps(score: number, learnerId?: string, note?: string): void {
  if (score < 0 || score > 10) {
    throw new Error('NPS score must be between 0 and 10');
  }
  
  const { onTaskMinutes, completionCount } = getCurrentEngagementMetrics(learnerId);
  
  const npsRecord: NpsRecord = {
    score,
    note,
    at: Date.now(),
    onTaskMinutes,
    completionCount
  };
  
  // Save to NPS history
  try {
    const history = getNpsHistory(learnerId);
    history.push(npsRecord);
    
    const key = learnerId ? `qi.nps.history.${learnerId}.v1` : NPS_STORAGE_KEY;
    localStorage.setItem(key, JSON.stringify(history));
  } catch (error) {
    console.warn('Failed to save NPS record:', error);
  }
  
  // Update throttle state (mark as asked)
  updateThrottleState(learnerId, { lastAsked: Date.now() });
  
  // Add to general feedback store for cloud sync
  if (learnerId) {
    const feedback: Omit<Feedback, 'id' | 'at'> = {
      kind: 'nps',
      text: `NPS Score: ${score}${note ? ` - ${note}` : ''}`,
      meta: {
        npsScore: score,
        onTaskMinutes,
        completionCount,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      }
    };
    
    addFeedback(learnerId, feedback);
  }
  
  console.log('✅ NPS feedback recorded:', { score, onTaskMinutes, completionCount });
}

/**
 * Mark NPS survey as snoozed (user closed without answering)
 */
export function snoozeNps(learnerId?: string): void {
  const snoozeUntil = Date.now() + (SNOOZE_DAYS * 24 * 60 * 60 * 1000);
  updateThrottleState(learnerId, { snoozedUntil: snoozeUntil });
  
  console.log('💤 NPS survey snoozed for', SNOOZE_DAYS, 'days');
}

/**
 * Get NPS analytics for insights
 */
export function getNpsAnalytics(learnerId?: string): { 
  averageScore: number; 
  totalResponses: number; 
  recentScores: number[];
  promoters: number;
  detractors: number;
} {
  const history = getNpsHistory(learnerId);
  
  if (history.length === 0) {
    return {
      averageScore: 0,
      totalResponses: 0,
      recentScores: [],
      promoters: 0,
      detractors: 0
    };
  }
  
  const scores = history.map(record => record.score);
  const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  
  // Get recent scores for sparkline (last 10)
  const recentScores = scores.slice(-10);
  
  // Calculate promoters (9-10) and detractors (0-6)
  const promoters = scores.filter(score => score >= 9).length;
  const detractors = scores.filter(score => score <= 6).length;
  
  return {
    averageScore: Math.round(averageScore * 10) / 10,
    totalResponses: history.length,
    recentScores,
    promoters,
    detractors
  };
}