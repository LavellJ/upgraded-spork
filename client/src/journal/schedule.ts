import { logEvent } from '../lib/analytics';

/**
 * Spaced refresh configuration
 */
export interface SpacedRefreshConfig {
  skillTag: string;
  inDays: number;
  minMastery: number;
  priority?: 'low' | 'normal' | 'high';
}

/**
 * Scheduled refresh entry
 */
export interface ScheduledRefresh {
  id: string;
  skillTag: string;
  scheduledDate: Date;
  minMastery: number;
  priority: 'low' | 'normal' | 'high';
  source: string;
  createdAt: Date;
}

/**
 * Storage key for scheduled refreshes
 */
const STORAGE_KEY = 'qi.scheduled_refreshes.v1';

/**
 * Get all scheduled refreshes
 */
export function getScheduledRefreshes(): ScheduledRefresh[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const refreshes = JSON.parse(stored);
    return refreshes.map((r: any) => ({
      ...r,
      scheduledDate: new Date(r.scheduledDate),
      createdAt: new Date(r.createdAt)
    }));
  } catch (error) {
    console.warn('Failed to load scheduled refreshes:', error);
    return [];
  }
}

/**
 * Save scheduled refreshes to storage
 */
function saveScheduledRefreshes(refreshes: ScheduledRefresh[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(refreshes));
  } catch (error) {
    console.error('Failed to save scheduled refreshes:', error);
  }
}

/**
 * Schedule a spaced refresh for a skill
 */
export function scheduleRefresh(config: SpacedRefreshConfig): string {
  const refreshes = getScheduledRefreshes();
  
  // Check if already scheduled for this skill
  const existing = refreshes.find(r => r.skillTag === config.skillTag);
  if (existing) {
    console.log(`⏰ Refresh already scheduled for ${config.skillTag} on ${existing.scheduledDate}`);
    return existing.id;
  }
  
  // Create new scheduled refresh
  const scheduledDate = new Date();
  scheduledDate.setDate(scheduledDate.getDate() + config.inDays);
  
  const refresh: ScheduledRefresh = {
    id: generateRefreshId(),
    skillTag: config.skillTag,
    scheduledDate,
    minMastery: config.minMastery,
    priority: config.priority || 'normal',
    source: 'spaced_refresh',
    createdAt: new Date()
  };
  
  refreshes.push(refresh);
  saveScheduledRefreshes(refreshes);
  
  // Log analytics
  logEvent({
    ts: new Date().toISOString(),
    loop: 1,
    action: 'start',
    meta: { type: 'spaced_refresh_scheduled', skill: config.skillTag }
  });
  
  console.log(`⏰ Spaced refresh scheduled for ${config.skillTag} in ${config.inDays} days`);
  return refresh.id;
}

/**
 * Get refreshes that are due now
 */
export function getDueRefreshes(): ScheduledRefresh[] {
  const refreshes = getScheduledRefreshes();
  const now = new Date();
  
  return refreshes.filter(refresh => refresh.scheduledDate <= now);
}

/**
 * Get refreshes due within the next N days
 */
export function getUpcomingRefreshes(days: number = 7): ScheduledRefresh[] {
  const refreshes = getScheduledRefreshes();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + days);
  
  return refreshes.filter(refresh => 
    refresh.scheduledDate <= cutoff && refresh.scheduledDate > new Date()
  );
}

/**
 * Mark a refresh as completed
 */
export function completeRefresh(refreshId: string, actualMastery: number): void {
  const refreshes = getScheduledRefreshes();
  const index = refreshes.findIndex(r => r.id === refreshId);
  
  if (index === -1) {
    console.warn('Refresh not found:', refreshId);
    return;
  }
  
  const refresh = refreshes[index];
  
  // Log completion
  logEvent({
    ts: new Date().toISOString(),
    loop: 1,
    action: 'complete',
    meta: { type: 'spaced_refresh_completed', skill: refresh.skillTag }
  });
  
  // Remove from schedule
  refreshes.splice(index, 1);
  saveScheduledRefreshes(refreshes);
  
  // Schedule next refresh if mastery not met
  if (actualMastery < refresh.minMastery) {
    const nextDays = Math.min(refresh.minMastery - actualMastery > 0.2 ? 2 : 1, 3); // Adaptive spacing
    scheduleRefresh({
      skillTag: refresh.skillTag,
      inDays: nextDays,
      minMastery: refresh.minMastery,
      priority: 'high' // Higher priority for struggles
    });
    
    console.log(`🔄 Re-scheduled ${refresh.skillTag} in ${nextDays} days (mastery: ${actualMastery})`);
  } else {
    console.log(`✅ Mastery achieved for ${refresh.skillTag} (${actualMastery})`);
  }
}

/**
 * Cancel a scheduled refresh
 */
export function cancelRefresh(refreshId: string): boolean {
  const refreshes = getScheduledRefreshes();
  const index = refreshes.findIndex(r => r.id === refreshId);
  
  if (index === -1) return false;
  
  const refresh = refreshes[index];
  refreshes.splice(index, 1);
  saveScheduledRefreshes(refreshes);
  
  logEvent({
    ts: new Date().toISOString(),
    loop: 1,
    action: 'complete',
    meta: { type: 'spaced_refresh_cancelled', skill: refresh.skillTag }
  });
  
  console.log(`❌ Cancelled refresh for ${refresh.skillTag}`);
  return true;
}

/**
 * Clear all scheduled refreshes (useful for testing)
 */
export function clearAllRefreshes(): void {
  localStorage.removeItem(STORAGE_KEY);
  console.log('🗑️ All scheduled refreshes cleared');
}

/**
 * Get refresh statistics
 */
export function getRefreshStats(): {
  total: number;
  due: number;
  upcoming: number;
  overdue: number;
} {
  const refreshes = getScheduledRefreshes();
  const now = new Date();
  const upcoming = getUpcomingRefreshes();
  
  return {
    total: refreshes.length,
    due: refreshes.filter(r => r.scheduledDate <= now).length,
    upcoming: upcoming.length,
    overdue: refreshes.filter(r => r.scheduledDate < now).length
  };
}

/**
 * Generate unique refresh ID
 */
function generateRefreshId(): string {
  return `refresh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Mock clock for testing (can be set to override Date.now)
 */
let mockTime: number | null = null;

export function setMockTime(time: number | null): void {
  mockTime = time;
}

export function getCurrentTime(): number {
  return mockTime || Date.now();
}

/**
 * Check if it's time to nudge user about due refreshes
 */
export function checkRefreshNudges(): ScheduledRefresh[] {
  const due = getDueRefreshes();
  if (due.length > 0) {
    logEvent({
      ts: new Date().toISOString(),
      loop: 1,
      action: 'start',
      meta: { type: 'spaced_refresh_nudge', count: due.length }
    });
  }
  return due;
}