// Admin audit log viewer with filtering and PII redaction
import { Router } from 'express';
import { z } from 'zod';
import { statements, db } from '../db';
import { verifyToken } from '../auth';

const router = Router();

// Query parameters schema
const auditQuerySchema = z.object({
  q: z.string().optional(), // Search in action/meta
  from: z.string().optional(), // ISO date string
  to: z.string().optional(), // ISO date string
  email: z.string().optional(), // Filter by actor email
  action: z.string().optional(), // Filter by action type
  limit: z.coerce.number().min(1).max(1000).default(100),
  offset: z.coerce.number().min(0).default(0),
  pii: z.coerce.number().min(0).max(1).default(0) // Admin PII redaction toggle
});

interface AuditLogRow {
  id: number;
  at: number; // timestamp
  email: string | null; // actor email
  action: string;
  meta: string | null; // JSON string
}

// PII redaction for learner names in metadata
function redactPII(meta: string | null): string | null {
  if (!meta) return meta;
  
  try {
    const parsed = JSON.parse(meta);
    
    // Redact common PII fields
    if (parsed.learnerName) {
      parsed.learnerName = '[REDACTED]';
    }
    if (parsed.studentName) {
      parsed.studentName = '[REDACTED]';
    }
    if (parsed.fullName) {
      parsed.fullName = '[REDACTED]';
    }
    if (parsed.displayName) {
      parsed.displayName = '[REDACTED]';
    }
    
    // Redact learner names in arrays
    if (parsed.learners && Array.isArray(parsed.learners)) {
      parsed.learners = parsed.learners.map((learner: any) => ({
        ...learner,
        name: learner.name ? '[REDACTED]' : learner.name,
        displayName: learner.displayName ? '[REDACTED]' : learner.displayName
      }));
    }
    
    return JSON.stringify(parsed);
  } catch (error) {
    // If parsing fails, return original
    return meta;
  }
}

// GET /api/admin/audit - Get audit logs with filtering and pagination  
router.get('', async (req, res) => {
  try {
    // Admin/guide auth required
    const token = verifyToken(req.headers.authorization);
    if (!token?.email) {
      return res.status(400).json({ error: 'Authentication required' });
    }
    
    // Only admins or guides can access audit logs
    if (token.role !== 'admin' && token.role !== 'guide') {
      return res.status(403).json({ error: 'Admin or guide role required' });
    }
  
  const query = auditQuerySchema.parse(req.query);
  
  // Build dynamic SQL query
  let sql = 'SELECT id, at, email, action, meta FROM audit_log WHERE 1=1';
  const params: any[] = [];
  
  // Date range filter
  if (query.from) {
    const fromTimestamp = new Date(query.from).getTime();
    if (!isNaN(fromTimestamp)) {
      sql += ' AND at >= ?';
      params.push(fromTimestamp);
    }
  }
  
  if (query.to) {
    const toTimestamp = new Date(query.to).getTime();
    if (!isNaN(toTimestamp)) {
      sql += ' AND at <= ?';
      params.push(toTimestamp);
    }
  }
  
  // Email filter
  if (query.email) {
    sql += ' AND email LIKE ?';
    params.push(`%${query.email}%`);
  }
  
  // Action filter
  if (query.action) {
    sql += ' AND action = ?';
    params.push(query.action);
  }
  
  // Search filter (in action or meta)
  if (query.q) {
    sql += ' AND (action LIKE ? OR meta LIKE ?)';
    params.push(`%${query.q}%`, `%${query.q}%`);
  }
  
  // Add ordering and pagination
  sql += ' ORDER BY at DESC LIMIT ? OFFSET ?';
  params.push(query.limit, query.offset);
  
  // Execute query
  const stmt = db.prepare(sql);
  const rows = stmt.all(...params) as AuditLogRow[];
  
  // Count total for pagination
  let countSql = sql.replace('SELECT id, at, email, action, meta FROM audit_log', 'SELECT COUNT(*) as count FROM audit_log');
  countSql = countSql.replace(/ ORDER BY at DESC LIMIT \? OFFSET \?$/, '');
  const countParams = params.slice(0, -2); // Remove limit/offset params
  
  const countStmt = db.prepare(countSql);
  const { count } = countStmt.get(...countParams) as { count: number };
  
  // Process rows for response
  const entries = rows.map(row => ({
    id: row.id,
    timestamp: new Date(row.at).toISOString(),
    email: row.email,
    action: row.action,
    meta: query.pii === 1 ? row.meta : redactPII(row.meta),
    hasPII: query.pii === 0 && (row.meta?.includes('learnerName') || row.meta?.includes('studentName') || row.meta?.includes('fullName'))
  }));
  
  res.json({
    entries,
    pagination: {
      total: count,
      limit: query.limit,
      offset: query.offset,
      hasMore: query.offset + query.limit < count
    },
    filters: {
      q: query.q,
      from: query.from,
      to: query.to,
      email: query.email,
      action: query.action,
      piiRedacted: query.pii === 0
    }
  });
  } catch (error) {
    console.error('Error in GET /api/admin/audit:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/audit/actions - Get unique action types for filter dropdown
router.get('/actions', async (req, res) => {
  try {
    // Admin/guide auth required
    const token = verifyToken(req.headers.authorization);
    if (!token?.email) {
      return res.status(400).json({ error: 'Authentication required' });
    }
    
    if (token.role !== 'admin' && token.role !== 'guide') {
      return res.status(403).json({ error: 'Admin or guide role required' });
    }
    
    const stmt = db.prepare('SELECT DISTINCT action FROM audit_log ORDER BY action');
    const rows = stmt.all() as { action: string }[];
    
    res.json({
      actions: rows.map(row => row.action)
    });
  } catch (error) {
    console.error('Error in GET /api/admin/audit/actions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/audit/csv - Export current filter as CSV
router.get('/csv', async (req, res) => {
  try {
    // Admin/guide auth required
    const token = verifyToken(req.headers.authorization);
    if (!token?.email) {
      return res.status(400).json({ error: 'Authentication required' });
    }
    
    if (token.role !== 'admin' && token.role !== 'guide') {
      return res.status(403).json({ error: 'Admin or guide role required' });
    }
  
  const query = auditQuerySchema.parse(req.query);
  
  // Build the same query as the main endpoint but without pagination
  let sql = 'SELECT id, at, email, action, meta FROM audit_log WHERE 1=1';
  const params: any[] = [];
  
  // Apply same filters
  if (query.from) {
    const fromTimestamp = new Date(query.from).getTime();
    if (!isNaN(fromTimestamp)) {
      sql += ' AND at >= ?';
      params.push(fromTimestamp);
    }
  }
  
  if (query.to) {
    const toTimestamp = new Date(query.to).getTime();
    if (!isNaN(toTimestamp)) {
      sql += ' AND at <= ?';
      params.push(toTimestamp);
    }
  }
  
  if (query.email) {
    sql += ' AND email LIKE ?';
    params.push(`%${query.email}%`);
  }
  
  if (query.action) {
    sql += ' AND action = ?';
    params.push(query.action);
  }
  
  if (query.q) {
    sql += ' AND (action LIKE ? OR meta LIKE ?)';
    params.push(`%${query.q}%`, `%${query.q}%`);
  }
  
  sql += ' ORDER BY at DESC';
  
  const stmt = db.prepare(sql);
  const rows = stmt.all(...params) as AuditLogRow[];
  
  // Generate CSV
  const csvHeader = 'timestamp,email,action,meta\n';
  const csvRows = rows.map(row => {
    const timestamp = new Date(row.at).toISOString();
    const email = row.email || '';
    const action = row.action;
    const meta = query.pii === 1 ? (row.meta || '') : (redactPII(row.meta) || '');
    
    // Escape CSV fields
    return [timestamp, email, action, meta]
      .map(field => `"${field.replace(/"/g, '""')}"`)
      .join(',');
  }).join('\n');
  
  const csv = csvHeader + csvRows;
  
  // Set CSV headers
  const filename = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  
  res.send(csv);
  } catch (error) {
    console.error('Error in GET /api/admin/audit/csv:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;