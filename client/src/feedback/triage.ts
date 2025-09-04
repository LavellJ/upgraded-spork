/**
 * Feedback triage and aggregation system
 * Processes pilot feedback and issue reports for bug-bash prioritization
 */

import type { Feedback } from './model';
import { createHash } from 'crypto';

export type TriageItem = {
  id: string;
  firstSeenAt: number;
  lastSeenAt: number;
  count: number;
  kind: 'bug' | 'idea' | 'confusion' | 'nps';
  severity: 'p0' | 'p1' | 'p2';
  area: 'scout' | 'journal' | 'assignments' | 'reports' | 'classroom' | 'auth' | 'media' | 'other';
  title: string;
  sample?: any;
};

/**
 * Area keyword mapping for automatic categorization
 */
const AREA_KEYWORDS: Record<string, string[]> = {
  scout: ['scout', 'ai', 'helper', 'assistant', 'hint', 'help', 'guidance'],
  journal: ['journal', 'reflection', 'writing', 'entry', 'prompt', 'diary'],
  assignments: ['assignment', 'homework', 'task', 'due', 'submit', 'lesson', 'complete'],
  reports: ['report', 'progress', 'analytics', 'chart', 'data', 'export', 'csv', 'parent'],
  classroom: ['class', 'teacher', 'student', 'roster', 'projector', 'classroom', 'code'],
  auth: ['login', 'logout', 'sign', 'account', 'password', 'authentication', 'session'],
  media: ['video', 'audio', 'image', 'caption', 'subtitle', 'media', 'player', 'sound'],
};

/**
 * Severity keyword mapping for automatic priority assignment
 */
const SEVERITY_KEYWORDS = {
  p0: ['crash', 'cannot', 'broken', 'error', 'failed', 'not working', 'wont work', 'does not work'],
  p1: ['stuck', 'broken', 'slow', 'confusing', 'difficult', 'problem', 'issue', 'trouble'],
};

/**
 * Generate a normalized hash for deduplication
 * Combines feedback kind and cleaned title text
 */
function generateTriageHash(kind: string, title: string): string {
  // Normalize title: lowercase, remove punctuation, trim whitespace
  const normalizedTitle = title.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  const hashInput = `${kind}:${normalizedTitle}`;
  
  // Simple hash function for browser compatibility (crypto.createHash not available)
  let hash = 0;
  for (let i = 0; i < hashInput.length; i++) {
    const char = hashInput.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return `triage-${Math.abs(hash).toString(36)}`;
}

/**
 * Infer area based on keyword matching in text
 */
function inferArea(text: string, url?: string): TriageItem['area'] {
  const searchText = (text + ' ' + (url || '')).toLowerCase();
  
  // Check each area's keywords
  for (const [area, keywords] of Object.entries(AREA_KEYWORDS)) {
    if (keywords.some(keyword => searchText.includes(keyword))) {
      return area as TriageItem['area'];
    }
  }
  
  return 'other';
}

/**
 * Determine severity based on keyword heuristics
 */
function inferSeverity(text: string): TriageItem['severity'] {
  const lowerText = text.toLowerCase();
  
  // Check P0 keywords first (most severe)
  if (SEVERITY_KEYWORDS.p0.some(keyword => lowerText.includes(keyword))) {
    return 'p0';
  }
  
  // Check P1 keywords
  if (SEVERITY_KEYWORDS.p1.some(keyword => lowerText.includes(keyword))) {
    return 'p1';
  }
  
  // Default to P2
  return 'p2';
}

/**
 * Convert feedback kind to triage kind (extends with 'nps')
 */
function normalizeKind(feedbackKind: string): TriageItem['kind'] {
  switch (feedbackKind) {
    case 'bug': return 'bug';
    case 'idea': return 'idea';
    case 'confusion': return 'confusion';
    case 'nps': return 'nps';
    default: return 'bug'; // Default unknown kinds to bug
  }
}

/**
 * Generate a readable title from feedback text
 */
function generateTitle(text: string): string {
  // Take first sentence or first 60 characters, whichever is shorter
  const firstSentence = text.split(/[.!?]/)[0].trim();
  
  if (firstSentence.length > 60) {
    return firstSentence.substring(0, 57) + '...';
  }
  
  return firstSentence || text.substring(0, 60) + '...';
}

/**
 * Build triage items from feedback arrays
 * Deduplicates, counts occurrences, and assigns priorities
 */
export function buildTriage(feed: Feedback[], issues: Feedback[]): TriageItem[] {
  const allFeedback = [...feed, ...issues];
  const triageMap = new Map<string, TriageItem>();
  
  // Process each feedback item
  for (const feedback of allFeedback) {
    const title = generateTitle(feedback.text);
    const kind = normalizeKind(feedback.kind);
    const hash = generateTriageHash(kind, title);
    
    const existingItem = triageMap.get(hash);
    
    if (existingItem) {
      // Update existing item
      existingItem.count += 1;
      existingItem.lastSeenAt = Math.max(existingItem.lastSeenAt, feedback.at);
      existingItem.firstSeenAt = Math.min(existingItem.firstSeenAt, feedback.at);
      
      // Keep sample if this feedback has more context
      if (!existingItem.sample || feedback.text.length > existingItem.sample.text.length) {
        existingItem.sample = feedback;
      }
    } else {
      // Create new triage item
      const area = inferArea(feedback.text, feedback.meta?.url);
      const severity = inferSeverity(feedback.text);
      
      const triageItem: TriageItem = {
        id: hash,
        firstSeenAt: feedback.at,
        lastSeenAt: feedback.at,
        count: 1,
        kind,
        severity,
        area,
        title,
        sample: feedback,
      };
      
      triageMap.set(hash, triageItem);
    }
  }
  
  // Convert to array and sort by severity then count
  const triageItems = Array.from(triageMap.values());
  
  // Sort: P0 first, then P1, then P2, within each priority by count descending
  const severityOrder = { p0: 0, p1: 1, p2: 2 };
  
  triageItems.sort((a, b) => {
    // Primary sort: severity (P0, P1, P2)
    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (severityDiff !== 0) return severityDiff;
    
    // Secondary sort: count (descending)
    return b.count - a.count;
  });
  
  return triageItems;
}

/**
 * Export triage items as CSV
 */
export function exportTriageCSV(items: TriageItem[]): string {
  if (items.length === 0) {
    return 'No triage data to export';
  }
  
  const headers = ['ID', 'Title', 'Kind', 'Severity', 'Area', 'Count', 'First Seen', 'Last Seen', 'Sample Text'];
  const csvRows = [headers.join(',')];
  
  for (const item of items) {
    const row = [
      `"${item.id}"`,
      `"${item.title.replace(/"/g, '""')}"`,
      `"${item.kind}"`,
      `"${item.severity}"`,
      `"${item.area}"`,
      `"${item.count}"`,
      `"${new Date(item.firstSeenAt).toISOString()}"`,
      `"${new Date(item.lastSeenAt).toISOString()}"`,
      `"${(item.sample?.text || '').substring(0, 100).replace(/"/g, '""')}..."`
    ];
    csvRows.push(row.join(','));
  }
  
  return csvRows.join('\n');
}

/**
 * Get triage items for a specific area
 */
export function getTriageByArea(items: TriageItem[], area: TriageItem['area']): TriageItem[] {
  return items.filter(item => item.area === area);
}

/**
 * Get triage items by severity level
 */
export function getTriageBySeverity(items: TriageItem[], severity: TriageItem['severity']): TriageItem[] {
  return items.filter(item => item.severity === severity);
}

/**
 * Get top priority items (P0 and P1)
 */
export function getTopPriorityItems(items: TriageItem[]): TriageItem[] {
  return items.filter(item => item.severity === 'p0' || item.severity === 'p1');
}