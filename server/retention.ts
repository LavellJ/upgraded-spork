/**
 * Retention Policy Management and Data Compaction
 * 
 * Provides per-tenant retention settings for events and audit data,
 * with automated compaction and pruning capabilities.
 */

import { statements, db, type RetentionPolicyRow } from './db';
import { logAuditEvent } from './audit';

// Default retention periods (days)
const DEFAULT_RETENTION = {
  eventsDays: 90,   // Keep detailed events for 90 days
  auditDays: 365    // Keep audit logs for 365 days  
};

export interface RetentionPolicy {
  email: string;
  eventsDays: number;
  auditDays: number;
  updatedAt: number;
}

export interface CompactionResult {
  processed: number;
  compacted: number;
  bytesFreed: number;
  errors: string[];
}

/**
 * Read retention policy for a user, merging defaults with custom settings
 */
export function readPolicy(email: string): RetentionPolicy {
  try {
    const row = statements.getRetentionPolicy.get(email) as RetentionPolicyRow | undefined;
    
    if (row) {
      return {
        email: row.email,
        eventsDays: row.eventsDays,
        auditDays: row.auditDays,
        updatedAt: row.updatedAt
      };
    }
    
    // Return defaults if no custom policy exists
    return {
      email,
      eventsDays: DEFAULT_RETENTION.eventsDays,
      auditDays: DEFAULT_RETENTION.auditDays,
      updatedAt: 0
    };
  } catch (error) {
    console.error('Error reading retention policy:', error);
    // Fallback to defaults on error
    return {
      email,
      eventsDays: DEFAULT_RETENTION.eventsDays,
      auditDays: DEFAULT_RETENTION.auditDays,
      updatedAt: 0
    };
  }
}

/**
 * Update retention policy for a user
 */
export function writePolicy(email: string, eventsDays: number, auditDays: number): void {
  try {
    const now = Date.now();
    statements.upsertRetentionPolicy.run(email, eventsDays, auditDays, now);
    
    // Log the policy change
    logAuditEvent({
      action: 'retention_policy_updated',
      actor: email,
      details: {
        eventsDays,
        auditDays,
        previousEventsDays: DEFAULT_RETENTION.eventsDays,
        previousAuditDays: DEFAULT_RETENTION.auditDays
      }
    });
  } catch (error) {
    console.error('Error writing retention policy:', error);
    throw new Error('Failed to update retention policy');
  }
}

/**
 * Run retention policy for a user - compact old events and prune audit logs
 */
export async function runPolicy(email: string): Promise<CompactionResult> {
  const policy = readPolicy(email);
  const result: CompactionResult = {
    processed: 0,
    compacted: 0,
    bytesFreed: 0,
    errors: []
  };

  try {
    // 1. Compact old events data to daily summaries (simulated for now)
    const eventsResult = await compactEventsData(email, policy.eventsDays);
    result.processed += eventsResult.processed;
    result.compacted += eventsResult.compacted;
    result.bytesFreed += eventsResult.bytesFreed;
    result.errors.push(...eventsResult.errors);

    // 2. Prune old audit logs
    const auditResult = await pruneAuditLogs(email, policy.auditDays);
    result.processed += auditResult.processed;
    result.bytesFreed += auditResult.bytesFreed;
    result.errors.push(...auditResult.errors);

    // Log the compaction run
    logAuditEvent({
      action: 'retention_compaction',
      actor: email,
      details: {
        processed: result.processed,
        compacted: result.compacted,
        bytesFreed: result.bytesFreed,
        errorCount: result.errors.length
      }
    });

    return result;
  } catch (error) {
    console.error('Error running retention policy:', error);
    result.errors.push(`Policy execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return result;
  }
}

/**
 * Compact events data older than specified days to daily summaries
 * Note: Simplified implementation - actual compaction would require full storage integration
 */
async function compactEventsData(email: string, retentionDays: number): Promise<CompactionResult> {
  const result: CompactionResult = { processed: 0, compacted: 0, bytesFreed: 0, errors: [] };
  
  try {
    // For now, return a simulated compaction result
    // In production, this would:
    // 1. Load user event data from storage
    // 2. Separate old vs recent events by cutoff date  
    // 3. Compact old events to daily summaries
    // 4. Save updated data back to storage
    
    result.processed = 1;
    result.compacted = 0;
    result.bytesFreed = 0;
    
    console.log(`Compaction simulation for ${email}: ${retentionDays} days retention`);
    
  } catch (error) {
    result.errors.push(`Failed to compact events data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}

/**
 * Prune audit logs older than specified days
 */
async function pruneAuditLogs(email: string, retentionDays: number): Promise<Pick<CompactionResult, 'processed' | 'bytesFreed' | 'errors'>> {
  const result = { processed: 0, bytesFreed: 0, errors: [] };
  const cutoffTime = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);

  try {
    // Count audit logs to be deleted  
    const countStmt = db.prepare(`
      SELECT COUNT(*) as count FROM audit_log 
      WHERE email = ? AND at < ?
    `);
    const { count } = countStmt.get(email, cutoffTime) as { count: number };

    if (count === 0) return result;

    // Delete old audit logs
    const deleteStmt = db.prepare(`
      DELETE FROM audit_log 
      WHERE email = ? AND at < ?
    `);
    
    const deleteResult = deleteStmt.run(email, cutoffTime);
    
    result.processed = deleteResult.changes || 0;
    // Estimate bytes freed (rough calculation)
    result.bytesFreed = result.processed * 200; // ~200 bytes per audit entry
    
  } catch (error) {
    result.errors.push(`Failed to prune audit logs: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}

/**
 * Convert individual events to daily summaries to save space
 */
function compactToDailySummaries(events: any[]): any[] {
  const dailySummaries = new Map();

  for (const event of events) {
    const date = new Date(event.timestamp).toISOString().split('T')[0]; // YYYY-MM-DD
    
    if (!dailySummaries.has(date)) {
      dailySummaries.set(date, {
        date,
        totalEvents: 0,
        eventTypes: new Map(),
        totalDuration: 0,
        totalScore: 0,
        scoredEvents: 0
      });
    }

    const summary = dailySummaries.get(date);
    summary.totalEvents++;

    // Count event types
    const eventType = event.type || 'unknown';
    summary.eventTypes.set(eventType, (summary.eventTypes.get(eventType) || 0) + 1);

    // Aggregate duration and scores
    if (event.duration) {
      summary.totalDuration += event.duration;
    }
    if (event.score !== undefined) {
      summary.totalScore += event.score;
      summary.scoredEvents++;
    }
  }

  // Convert to serializable format
  return Array.from(dailySummaries.values()).map(summary => ({
    date: summary.date,
    totalEvents: summary.totalEvents,
    eventTypes: Object.fromEntries(summary.eventTypes),
    totalDuration: summary.totalDuration,
    averageScore: summary.scoredEvents > 0 ? summary.totalScore / summary.scoredEvents : null
  }));
}

/**
 * Get default retention settings
 */
export function getDefaultRetention() {
  return { ...DEFAULT_RETENTION };
}

/**
 * Validate retention policy values
 */
export function validateRetentionPolicy(eventsDays: number, auditDays: number): string[] {
  const errors: string[] = [];
  
  if (!Number.isInteger(eventsDays) || eventsDays < 7 || eventsDays > 365) {
    errors.push('Events retention must be between 7 and 365 days');
  }
  
  if (!Number.isInteger(auditDays) || auditDays < 30 || auditDays > 2555) { // ~7 years max
    errors.push('Audit retention must be between 30 and 2555 days');
  }
  
  return errors;
}