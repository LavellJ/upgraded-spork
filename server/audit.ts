// Audit trail system for sensitive actions

import { appendFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// Data directory for audit logs
const DATA_DIR = '.data';
const AUDIT_LOG_PATH = join(DATA_DIR, 'audit.log');

// Ensure data directory exists
if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

// Audit event interface
export interface AuditEvent {
  timestamp: string;
  action: string;
  actor: string;
  details?: Record<string, any>;
  ip?: string;
  userAgent?: string;
}

// Log an audit event (append-only JSONL format)
export function logAuditEvent(event: Omit<AuditEvent, 'timestamp'>): void {
  try {
    const auditEntry: AuditEvent = {
      timestamp: new Date().toISOString(),
      ...event
    };
    
    const jsonLine = JSON.stringify(auditEntry) + '\n';
    appendFileSync(AUDIT_LOG_PATH, jsonLine, 'utf8');
    
    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('📝 AUDIT:', auditEntry.action, 'by', auditEntry.actor);
    }
  } catch (error) {
    console.error('❌ Failed to write audit log:', error);
  }
}

// Get audit log file path
export function getAuditLogPath(): string {
  return AUDIT_LOG_PATH;
}

// Audit logging helper for common patterns
export const auditLog = {
  // Token issuance (login)
  tokenIssued: (email: string, role: string, ip?: string) => {
    logAuditEvent({
      action: 'token_issued',
      actor: email,
      details: { role },
      ip
    });
  },

  // Roster mutations
  rosterUpdated: (email: string, learnerCount: number, ip?: string) => {
    logAuditEvent({
      action: 'roster_updated',
      actor: email,
      details: { learner_count: learnerCount },
      ip
    });
  },

  // Retention compaction runs
  retentionRun: (email: string, result: any, ip?: string) => {
    logAuditEvent({
      action: 'retention_compaction',
      actor: email,
      details: { 
        files_processed: result.processed,
        files_removed: result.removed,
        bytes_freed: result.bytesFreed
      },
      ip
    });
  },

  // Admin data dumps
  adminDump: (email: string, targetEmail?: string, ip?: string) => {
    logAuditEvent({
      action: 'admin_dump',
      actor: email,
      details: { target_user: targetEmail || 'list_users' },
      ip
    });
  },

  // Audit log access
  auditAccess: (email: string, ip?: string) => {
    logAuditEvent({
      action: 'audit_log_access',
      actor: email,
      details: {},
      ip
    });
  },

  // Sync batch processing
  syncBatch: (email: string, itemCount: number, ip?: string) => {
    logAuditEvent({
      action: 'sync_batch_processed',
      actor: email,
      details: { item_count: itemCount },
      ip
    });
  }
};