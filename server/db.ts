import Database from 'better-sqlite3';
import { join } from 'path';
import { mkdirSync } from 'fs';

const DATA_DIR = '.data';
const DB_PATH = join(DATA_DIR, 'qi.db');

// Ensure data directory exists
try {
  mkdirSync(DATA_DIR, { recursive: true });
} catch (error) {
  // Directory already exists, ignore
}

// Open SQLite database
export const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent access
db.pragma('journal_mode = WAL');

// Initialize database schema
db.exec(`
  -- Users table
  CREATE TABLE IF NOT EXISTS users (
    email TEXT PRIMARY KEY,
    role TEXT NOT NULL DEFAULT 'guide',
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL
  );

  -- User document buckets for encrypted storage
  CREATE TABLE IF NOT EXISTS user_docs (
    email TEXT NOT NULL,
    learnerId TEXT NOT NULL,
    bucket TEXT NOT NULL,             -- 'roster' | 'events' | 'model' | 'journal' | 'assignments' | 'reflections'
    version INTEGER NOT NULL,
    ciphertext BLOB NOT NULL,         -- encrypted JSON (same format we used in file store)
    updatedAt INTEGER NOT NULL,
    PRIMARY KEY (email, learnerId, bucket),
    FOREIGN KEY (email) REFERENCES users(email)
  );

  -- Audit log for tracking operations
  CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    at INTEGER NOT NULL,
    email TEXT,
    action TEXT NOT NULL,
    meta TEXT
  );

  -- Class collaborators table for per-class co-teachers
  CREATE TABLE IF NOT EXISTS class_collaborators (
    classId TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'co_teacher', -- 'owner' | 'co_teacher' | 'viewer'
    addedAt INTEGER NOT NULL,
    PRIMARY KEY (classId, email),
    FOREIGN KEY (email) REFERENCES users(email)
  );

  -- Referrals table for teacher referral links with short codes and click tracking
  CREATE TABLE IF NOT EXISTS referrals (
    code TEXT PRIMARY KEY,            -- short base36 (e.g., 6 chars)
    ownerEmail TEXT NOT NULL,
    createdAt INTEGER NOT NULL,
    clicks INTEGER NOT NULL DEFAULT 0,
    lastClickAt INTEGER,
    FOREIGN KEY (ownerEmail) REFERENCES users(email)
  );

  -- DSAR (Data Subject Access Request) table for export requests
  CREATE TABLE IF NOT EXISTS dsar_requests (
    id TEXT PRIMARY KEY,              -- uuid
    requesterEmail TEXT NOT NULL,
    learnerIds TEXT NOT NULL,         -- JSON array string
    status TEXT NOT NULL,             -- 'pending'|'ready'|'error'|'purged'
    createdAt INTEGER NOT NULL,
    readyAt INTEGER,
    error TEXT,
    artifactPath TEXT,                -- server fs path when ready
    FOREIGN KEY (requesterEmail) REFERENCES users(email)
  );

  -- Erasure requests for data deletion with grace period
  CREATE TABLE IF NOT EXISTS erasure_requests (
    id TEXT PRIMARY KEY,              -- uuid
    email TEXT NOT NULL,
    scope TEXT NOT NULL,              -- 'learner'|'account'
    learnerId TEXT,                   -- when scope='learner'
    status TEXT NOT NULL,             -- 'pending'|'scheduled'|'done'|'canceled'
    requestedAt INTEGER NOT NULL,
    dueAt INTEGER NOT NULL,           -- when to execute deletion
    FOREIGN KEY (email) REFERENCES users(email)
  );

  -- Retention policies for per-tenant data retention settings
  CREATE TABLE IF NOT EXISTS retention_policies (
    email TEXT PRIMARY KEY,           -- user email
    eventsDays INTEGER NOT NULL DEFAULT 90,    -- keep detailed events for N days
    auditDays INTEGER NOT NULL DEFAULT 365,    -- keep audit logs for N days
    updatedAt INTEGER NOT NULL,       -- when policy was last updated
    FOREIGN KEY (email) REFERENCES users(email)
  );

  -- Indexes for better query performance
  CREATE INDEX IF NOT EXISTS idx_user_docs_email ON user_docs(email);
  CREATE INDEX IF NOT EXISTS idx_user_docs_learner ON user_docs(email, learnerId);
  CREATE INDEX IF NOT EXISTS idx_audit_log_email ON audit_log(email);
  CREATE INDEX IF NOT EXISTS idx_audit_log_at ON audit_log(at);
  CREATE INDEX IF NOT EXISTS idx_class_collaborators_email ON class_collaborators(email);
  CREATE INDEX IF NOT EXISTS idx_class_collaborators_class ON class_collaborators(classId);
  CREATE INDEX IF NOT EXISTS idx_referrals_owner ON referrals(ownerEmail);
  CREATE INDEX IF NOT EXISTS idx_referrals_created ON referrals(createdAt);
  CREATE INDEX IF NOT EXISTS idx_dsar_requests_email ON dsar_requests(requesterEmail);
  CREATE INDEX IF NOT EXISTS idx_dsar_requests_status ON dsar_requests(status);
  CREATE INDEX IF NOT EXISTS idx_dsar_requests_created ON dsar_requests(createdAt);
  CREATE INDEX IF NOT EXISTS idx_erasure_requests_email ON erasure_requests(email);
  CREATE INDEX IF NOT EXISTS idx_erasure_requests_status ON erasure_requests(status);
  CREATE INDEX IF NOT EXISTS idx_erasure_requests_due ON erasure_requests(dueAt);
  CREATE INDEX IF NOT EXISTS idx_retention_policies_email ON retention_policies(email);
`);

// Prepared statements for common operations
export const statements = {
  // Users
  insertUser: db.prepare(`
    INSERT OR REPLACE INTO users (email, role, createdAt, updatedAt)
    VALUES (?, ?, ?, ?)
  `),
  
  getUser: db.prepare(`
    SELECT * FROM users WHERE email = ?
  `),
  
  getAllUsers: db.prepare(`
    SELECT email, role FROM users ORDER BY email
  `),

  // User documents
  upsertUserDoc: db.prepare(`
    INSERT OR REPLACE INTO user_docs (email, learnerId, bucket, version, ciphertext, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?)
  `),
  
  getUserDoc: db.prepare(`
    SELECT * FROM user_docs WHERE email = ? AND learnerId = ? AND bucket = ?
  `),
  
  listLearners: db.prepare(`
    SELECT DISTINCT learnerId FROM user_docs WHERE email = ?
  `),
  
  getUserBuckets: db.prepare(`
    SELECT bucket, version, updatedAt FROM user_docs WHERE email = ? AND learnerId = ?
  `),

  // Audit log
  insertAuditLog: db.prepare(`
    INSERT INTO audit_log (at, email, action, meta)
    VALUES (?, ?, ?, ?)
  `),
  
  getAuditLog: db.prepare(`
    SELECT * FROM audit_log WHERE email = ? ORDER BY at DESC LIMIT ?
  `),

  // Class collaborators
  insertCollaborator: db.prepare(`
    INSERT INTO class_collaborators (classId, email, role, addedAt)
    VALUES (?, ?, ?, ?)
  `),
  
  getClassCollaborators: db.prepare(`
    SELECT * FROM class_collaborators WHERE classId = ?
  `),
  
  getCollaboratorByEmailAndClass: db.prepare(`
    SELECT * FROM class_collaborators WHERE classId = ? AND email = ?
  `),
  
  deleteCollaborator: db.prepare(`
    DELETE FROM class_collaborators WHERE classId = ? AND email = ?
  `),
  
  getClassesByCollaborator: db.prepare(`
    SELECT classId, role FROM class_collaborators WHERE email = ?
  `),

  // Referrals
  insertReferral: db.prepare(`
    INSERT INTO referrals (code, ownerEmail, createdAt, clicks, lastClickAt)
    VALUES (?, ?, ?, ?, ?)
  `),
  
  getReferral: db.prepare(`
    SELECT * FROM referrals WHERE code = ?
  `),
  
  getReferralsByOwner: db.prepare(`
    SELECT * FROM referrals WHERE ownerEmail = ? ORDER BY createdAt DESC
  `),
  
  updateReferralClicks: db.prepare(`
    UPDATE referrals SET clicks = clicks + 1, lastClickAt = ? WHERE code = ?
  `),
  
  deleteReferral: db.prepare(`
    DELETE FROM referrals WHERE code = ? AND ownerEmail = ?
  `),

  // DSAR requests
  insertDsarRequest: db.prepare(`
    INSERT INTO dsar_requests (id, requesterEmail, learnerIds, status, createdAt, readyAt, error, artifactPath)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `),
  
  getDsarRequest: db.prepare(`
    SELECT * FROM dsar_requests WHERE id = ?
  `),
  
  getDsarRequestsByUser: db.prepare(`
    SELECT * FROM dsar_requests WHERE requesterEmail = ? ORDER BY createdAt DESC
  `),
  
  updateDsarRequestStatus: db.prepare(`
    UPDATE dsar_requests SET status = ?, readyAt = ?, error = ?, artifactPath = ? WHERE id = ?
  `),
  
  deleteDsarRequest: db.prepare(`
    DELETE FROM dsar_requests WHERE id = ?
  `),
  
  countActiveDsarRequests: db.prepare(`
    SELECT COUNT(*) as count FROM dsar_requests WHERE requesterEmail = ? AND status IN ('pending', 'ready')
  `),
  
  countRecentDsarRequests: db.prepare(`
    SELECT COUNT(*) as count FROM dsar_requests WHERE requesterEmail = ? AND createdAt > ?
  `),

  // Erasure requests
  insertErasureRequest: db.prepare(`
    INSERT INTO erasure_requests (id, email, scope, learnerId, status, requestedAt, dueAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `),
  
  getErasureRequest: db.prepare(`
    SELECT * FROM erasure_requests WHERE id = ?
  `),
  
  getErasureRequestsByUser: db.prepare(`
    SELECT * FROM erasure_requests WHERE email = ? ORDER BY requestedAt DESC
  `),
  
  updateErasureRequestStatus: db.prepare(`
    UPDATE erasure_requests SET status = ? WHERE id = ?
  `),
  
  getDueErasureRequests: db.prepare(`
    SELECT * FROM erasure_requests WHERE status = 'scheduled' AND dueAt <= ?
  `),

  deleteUserDocsByLearner: db.prepare(`
    DELETE FROM user_docs WHERE email = ? AND learnerId = ?
  `),

  deleteUserDocsByEmail: db.prepare(`
    DELETE FROM user_docs WHERE email = ?
  `),

  maskAuditLogLearner: db.prepare(`
    UPDATE audit_log SET meta = json_replace(COALESCE(meta, '{}'), '$.learnerId', ?)
    WHERE email = ? AND json_extract(meta, '$.learnerId') = ?
  `),

  // Retention policies
  upsertRetentionPolicy: db.prepare(`
    INSERT OR REPLACE INTO retention_policies (email, eventsDays, auditDays, updatedAt)
    VALUES (?, ?, ?, ?)
  `),

  getRetentionPolicy: db.prepare(`
    SELECT * FROM retention_policies WHERE email = ?
  `),

  deleteRetentionPolicy: db.prepare(`
    DELETE FROM retention_policies WHERE email = ?
  `)
};

export type BucketType = 'roster' | 'events' | 'model' | 'journal' | 'assignments' | 'reflections';

export interface UserDocRow {
  email: string;
  learnerId: string;
  bucket: BucketType;
  version: number;
  ciphertext: Buffer;
  updatedAt: number;
}

export interface UserRow {
  email: string;
  role: string;
  createdAt: number;
  updatedAt: number;
}

export interface CollaboratorRow {
  classId: string;
  email: string;
  role: 'owner' | 'co_teacher' | 'viewer';
  addedAt: number;
}

export interface ReferralRow {
  code: string;
  ownerEmail: string;
  createdAt: number;
  clicks: number;
  lastClickAt: number | null;
}

export interface DsarRequestRow {
  id: string;
  requesterEmail: string;
  learnerIds: string; // JSON array string
  status: 'pending' | 'ready' | 'error' | 'purged';
  createdAt: number;
  readyAt: number | null;
  error: string | null;
  artifactPath: string | null;
}

export interface ErasureRequestRow {
  id: string;
  email: string;
  scope: 'learner' | 'account';
  learnerId: string | null;
  status: 'pending' | 'scheduled' | 'done' | 'canceled';
  requestedAt: number;
  dueAt: number;
}

export interface RetentionPolicyRow {
  email: string;
  eventsDays: number;
  auditDays: number;
  updatedAt: number;
}

// Close database on process exit
process.on('exit', () => db.close());
process.on('SIGINT', () => {
  db.close();
  process.exit(0);
});