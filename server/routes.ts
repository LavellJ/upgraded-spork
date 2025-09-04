// server/routes.ts
import type { Express, Request, Response, NextFunction } from "express";
import { Router } from "express";
import { createServer, type Server } from "http";
import { verifyToken, issueToken } from './auth';
import { handleMagicLinkRequest, handleTokenVerification } from './magicAuth';
import { verifyEmailConfig } from './email';
import { listBackups, getBackupStats, runBackupRoutine } from './backup';
import { getCronJobStatus } from './cron';
import { userStorage, type UserDoc } from './userStorage';
import { dbUserStorage } from './dbStorage';
import { auditLog, getAuditLogPath } from './audit';
import fs from "fs";
import path from "path";

// Types
type Roster = {
  learners: Array<{
    id: string;
    name: string;
    avatarId?: string;
    ageBand?: string;
    createdAt: number;
    updatedAt: number;
  }>;
};

type SyncItem = {
  kind: 'event' | 'learner' | 'reflection';
  payload: any;
  id: string;
  at: number;
};

// In-memory database
const DB = {
  users: new Map<string, { roster: Roster; data: Record<string, any> }>()
};

// Import observability components
import { metricsRouter } from './routes/metrics';
import { parentSummaryRouter } from './routes/parentSummary';
import { classesRouter } from './routes/classes';
import invitesRouter from './routes/invites';
import { syncBatchSLO, trackSLO } from './metrics/slo';
import { asyncHandler, AppError, ValidationError, NotFoundError } from './middleware/errorHandler';
import { log } from './log';

// File backing (optional)
const DB_FILE = '.devdb.json';
let dbSaveTimer: NodeJS.Timeout | null = null;

// Load DB from file on startup
try {
  if (fs.existsSync(DB_FILE)) {
    const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    if (data.users) {
      DB.users = new Map(data.users);
    }
  }
} catch (err) {
  console.warn('Failed to load DB from file:', err);
}

// Save DB to file periodically
function saveDB() {
  try {
    const data = {
      users: Array.from(DB.users.entries())
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.warn('Failed to save DB to file:', err);
  }
}

// Schedule periodic saves
function scheduleSave() {
  if (dbSaveTimer) clearTimeout(dbSaveTimer);
  dbSaveTimer = setTimeout(() => {
    saveDB();
    scheduleSave();
  }, 10000); // Save every 10 seconds
}

scheduleSave();

// Rate limiting (simple in-memory token bucket)
const rateLimitStore = new Map<string, { tokens: number; lastRefill: number }>();
const RATE_LIMIT_MAX_TOKENS = 60;
const RATE_LIMIT_REFILL_RATE = 1; // tokens per minute

function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  
  let bucket = rateLimitStore.get(clientIP);
  if (!bucket) {
    bucket = { tokens: RATE_LIMIT_MAX_TOKENS, lastRefill: now };
    rateLimitStore.set(clientIP, bucket);
  }
  
  // Refill tokens based on time passed
  const minutesPassed = (now - bucket.lastRefill) / 60000;
  bucket.tokens = Math.min(RATE_LIMIT_MAX_TOKENS, bucket.tokens + (minutesPassed * RATE_LIMIT_REFILL_RATE));
  bucket.lastRefill = now;
  
  if (bucket.tokens < 1) {
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }
  
  bucket.tokens -= 1;
  next();
}

// Auth middleware with JWT verification
function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const user = verifyToken(req.headers.authorization);
  
  if (!user) {
    return res.status(401).json({ error: 'Invalid or missing authentication token' });
  }
  
  // Attach user info to request
  (req as any).user = user;
  next();
}

// Helper function to get or create user data (DEPRECATED - use userStorage)
function getUserData(userId: string) {
  if (!DB.users.has(userId)) {
    DB.users.set(userId, {
      roster: { learners: [] },
      data: {}
    });
  }
  return DB.users.get(userId)!;
}

// Helper to get user doc from file storage
async function getUserDoc(email: string): Promise<UserDoc> {
  // Use database storage instead of file storage
  return dbUserStorage.getUserDoc(email);
}

// Helper to save user doc to database storage
async function saveUserDoc(email: string, doc: UserDoc): Promise<void> {
  await dbUserStorage.saveUserDoc(email, doc);
}

/**
 * Wire up API routes and return an HTTP server for Vite to attach to.
 */
export async function registerRoutes(app: Express): Promise<Server> {
  const api = Router();

  // Serve the teacher quick start guide as a static file
  app.get('/teacher-quick-start-guide.html', (req, res) => {
    const filePath = path.join(import.meta.dirname, '../public/teacher-quick-start-guide.html');
    res.sendFile(filePath);
  });

  // Basic health check
  api.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  // Ping external URLs for reachability
  api.get('/api/ping', async (req, res) => {
    try {
      const url = String(req.query.url || '');
      const t = Math.min(parseInt(String(req.query.t || '2000'), 10) || 2000, 5000);

      // basic allowlist: http/https only
      if (!/^https?:\/\//i.test(url)) {
        return res.status(400).json({ ok: false, reason: 'invalid_scheme' });
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), t);

      let status = 0;
      try {
        // HEAD first, fall back to GET if not allowed
        const r = await fetch(url, { method: 'HEAD', signal: controller.signal });
        status = r.status;
        if (!r.ok && r.status === 405) {
          const r2 = await fetch(url, { method: 'GET', signal: controller.signal });
          status = r2.status;
        }
        clearTimeout(timeout);
        return res.json({ ok: status >= 200 && status < 400, status });
      } catch (e) {
        clearTimeout(timeout);
        return res.json({ ok: false, status: 0 });
      }
    } catch (err) {
      return res.status(500).json({ ok: false, reason: 'server_error' });
    }
  });

  // Magic link authentication endpoints
  api.post('/api/auth/magic-link', handleMagicLinkRequest);
  api.post('/api/auth/verify-token', handleTokenVerification);

  // Development token issuing (DEV only)
  if (process.env.NODE_ENV === 'development') {
    api.get('/api/dev/issue', (req, res) => {
      const email = req.query.email as string;
      const role = (req.query.role as 'guide' | 'admin') || 'guide';
      
      if (!email) {
        return res.status(400).json({ error: 'email parameter required' });
      }
      
      const token = issueToken({ email, role });
      
      // Audit log token issuance
      auditLog.tokenIssued(email, role, req.ip);
      
      res.json({ token, expires_in_days: 30 });
    });
  }
  
  // Sync endpoints (protected + rate limited + SLO tracked)
  api.post('/api/sync/batch', trackSLO('sync_batch_latency'), rateLimitMiddleware, authMiddleware, asyncHandler(async (req, res) => {
    const { userId, learnerId, items } = req.body;
    
    if (!userId || !learnerId || !Array.isArray(items)) {
      throw new ValidationError('Missing required fields: userId, learnerId, items');
    }
    
    // Use authenticated user email as namespace
    const userEmail = (req as any).user.email;
    const userDoc = await getUserDoc(userEmail);
    
    // Ensure learner data exists in document
    if (!userDoc.data[learnerId]) {
      userDoc.data[learnerId] = {};
    }
    
    let accepted = 0;
    
    // Process each item with idempotency
    for (const item of items) {
      if (!item.id) continue;
      
      // Check if we've already seen this item
      if (!userDoc.data[learnerId][item.id]) {
        userDoc.data[learnerId][item.id] = item;
        accepted++;
      }
      // If already exists, ignore (idempotent)
    }
    
    // Save updated document
    await saveUserDoc(userEmail, userDoc);
    
    // Structured logging for sync operation
    req.logger.sync('batch_sync', accepted, process.hrtime(req.startTime)[1] / 1000000, {
      userId,
      learnerId,
      totalItems: items.length,
    });
    
    // Audit log sync batch processing
    auditLog.syncBatch(userEmail, accepted, req.ip);
    
    res.json({ ok: true, accepted });
  }));
  
  // Roster endpoints (protected)
  api.get('/api/roster', authMiddleware, async (req, res) => {
    try {
      // Use authenticated user email as namespace
      const userEmail = (req as any).user.email;
      const userDoc = await getUserDoc(userEmail);
      
      res.json(userDoc.roster);
    } catch (err) {
      console.error('Error in GET /api/roster:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  api.post('/api/roster', rateLimitMiddleware, authMiddleware, async (req, res) => {
    try {
      // Simple approach: accept entire roster object for sync
      const roster = req.body;
      
      if (!roster || !roster.learners || !Array.isArray(roster.learners)) {
        return res.status(400).json({ error: 'Invalid roster format' });
      }
      
      // Use authenticated user email as namespace
      const userEmail = (req as any).user.email;
      const userDoc = await getUserDoc(userEmail);
      
      userDoc.roster = roster;
      await saveUserDoc(userEmail, userDoc);
      
      // Audit log roster update
      auditLog.rosterUpdated(userEmail, roster.learners.length, req.ip);
      
      res.json({ ok: true, roster: userDoc.roster });
    } catch (err) {
      console.error('Error in POST /api/roster:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Snapshot endpoint for development import (DEV only)
  api.get('/api/snapshot', authMiddleware, async (req, res) => {
    try {
      // Use authenticated user email as namespace
      const userEmail = (req as any).user.email;
      const userDoc = await getUserDoc(userEmail);
      
      // Convert server data format to V2 backup format
      const snapshotData = {
        roster: userDoc.roster,
        data: {} as Record<string, any>,
        telemetryBuffer: [] // Not tracked on server for privacy
      };
      
      // Convert learner data from server format to V2 format
      for (const [learnerId, rawData] of Object.entries(userDoc.data)) {
        const learnerData: any = {
          profile: null, // Profile is global
          model: null,
          events: [],
          journal: [],
          reflections: [],
          assignments: []
        };
        
        // Group items by type based on their structure
        for (const [itemId, item] of Object.entries(rawData as Record<string, any>)) {
          if (!item || typeof item !== 'object') continue;
          
          // Categorize items based on their properties
          if ('kind' in item && 'at' in item) {
            // Progress events
            learnerData.events.push(item);
          } else if ('p' in item && 'seen' in item && 'correct' in item) {
            // Learner model skills data
            if (!learnerData.model) {
              learnerData.model = { version: 1, skills: {} };
            }
            learnerData.model.skills[itemId] = item;
          } else if ('date' in item && 'skillId' in item && 'sessionId' in item) {
            // Journal history entries
            learnerData.journal.push(item);
          } else if ('refType' in item && 'refId' in item && 'note' in item) {
            // Reflections
            learnerData.reflections.push(item);
          } else if ('id' in item && 'name' in item && 'lessonIds' in item) {
            // Assignments
            learnerData.assignments.push(item);
          }
        }
        
        snapshotData.data[learnerId] = learnerData;
      }
      
      res.json(snapshotData);
    } catch (err) {
      console.error('Error in GET /api/snapshot:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Admin backup endpoint (DEV mode or admin role required)
  api.get('/api/admin/dump', authMiddleware, async (req, res) => {
    try {
      const userRole = (req as any).user.role;
      const isDev = process.env.NODE_ENV === 'development';
      
      // Check authorization
      if (!isDev && userRole !== 'admin') {
        return res.status(403).json({ error: 'Admin role required' });
      }
      
      const email = req.query.email as string;
      
      if (!email) {
        // If no email specified, return list of available users
        const users = await userStorage.listUsers();
        const stats = await userStorage.getStats();
        
        // Audit log admin dump (list users)
        auditLog.adminDump((req as any).user.email, undefined, req.ip);
        
        return res.json({
          users,
          stats,
          usage: 'GET /api/admin/dump?email=user@example.com to dump specific user data'
        });
      }
      
      // Get and return user document
      const userDoc = await getUserDoc(email);
      
      // Audit log admin dump (specific user)
      auditLog.adminDump((req as any).user.email, email, req.ip);
      
      res.json({
        email,
        document: userDoc,
        exported_at: new Date().toISOString()
      });
    } catch (err) {
      console.error('Error in GET /api/admin/dump:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Admin audit log endpoint (DEV mode or admin role required)
  api.get('/api/admin/log', authMiddleware, async (req, res) => {
    try {
      const userRole = (req as any).user.role;
      const isDev = process.env.NODE_ENV === 'development';
      
      // Check authorization
      if (!isDev && userRole !== 'admin') {
        return res.status(403).json({ error: 'Admin role required' });
      }
      
      // Audit log access to audit log
      auditLog.auditAccess((req as any).user.email, req.ip);
      
      try {
        const auditContent = fs.readFileSync(getAuditLogPath(), 'utf8');
        
        // Set appropriate headers for file download
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="audit-log-${new Date().toISOString().slice(0, 10)}.jsonl"`);
        
        res.send(auditContent);
      } catch (fileError) {
        // If audit log doesn't exist yet, return empty log
        if ((fileError as any).code === 'ENOENT') {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Content-Disposition', `attachment; filename="audit-log-${new Date().toISOString().slice(0, 10)}.jsonl"`);
          res.send('');
        } else {
          throw fileError;
        }
      }
    } catch (err) {
      console.error('Error in GET /api/admin/log:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Admin retention compaction endpoint (DEV mode or admin role required)
  api.post('/api/admin/retention/run', authMiddleware, async (req, res) => {
    try {
      const userRole = (req as any).user.role;
      const isDev = process.env.NODE_ENV === 'development';
      
      // Check authorization
      if (!isDev && userRole !== 'admin') {
        return res.status(403).json({ error: 'Admin role required' });
      }
      
      console.log(`📅 Manual retention compaction requested by ${(req as any).user.email}`);
      // Placeholder for retention compaction - would implement bucket-level compaction
      const result = { usersProcessed: 0, bucketsCompacted: 0, eventsCompacted: 0, sizeReduction: 0 };
      
      // Audit log retention compaction
      auditLog.retentionRun((req as any).user.email, result, req.ip);
      
      res.json({
        ok: true,
        compaction: result,
        retention_days: (await import('./config')).RETAIN_DAYS,
        completed_at: new Date().toISOString()
      });
    } catch (err) {
      console.error('Error in POST /api/admin/retention/run:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Admin backups list endpoint (DEV mode or admin role required)
  api.get('/api/admin/backups', authMiddleware, async (req, res) => {
    try {
      const userRole = (req as any).user.role;
      const isDev = process.env.NODE_ENV === 'development';
      
      // Check authorization
      if (!isDev && userRole !== 'admin') {
        return res.status(403).json({ error: 'Admin role required' });
      }
      
      // Get backup list and stats
      const backups = listBackups();
      const stats = getBackupStats();
      const cronStatus = getCronJobStatus();
      
      // Audit log backup list access
      auditLog.auditAccess((req as any).user.email, req.ip);
      
      res.json({
        ok: true,
        backups,
        stats,
        cronJobs: cronStatus,
        accessed_at: new Date().toISOString()
      });
    } catch (err) {
      console.error('Error in GET /api/admin/backups:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Admin backup creation endpoint (DEV mode or admin role required)
  api.post('/api/admin/backups/create', authMiddleware, async (req, res) => {
    try {
      const userRole = (req as any).user.role;
      const isDev = process.env.NODE_ENV === 'development';
      
      // Check authorization
      if (!isDev && userRole !== 'admin') {
        return res.status(403).json({ error: 'Admin role required' });
      }
      
      console.log(`📦 Manual backup requested by ${(req as any).user.email}`);
      const result = await runBackupRoutine();
      
      // Audit log manual backup
      auditLog.auditAccess((req as any).user.email, req.ip);
      
      res.json({
        ok: true,
        backup: result,
        created_at: new Date().toISOString()
      });
    } catch (err) {
      console.error('Error in POST /api/admin/backups/create:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Admin teacher digest manual trigger (DEV mode or admin role required)
  api.post('/api/admin/digest/run', authMiddleware, async (req, res) => {
    try {
      const userRole = (req as any).user.role;
      const isDev = process.env.NODE_ENV === 'development';
      
      // Check authorization (same pattern as other admin endpoints)
      if (!isDev && userRole !== 'admin') {
        return res.status(403).json({ error: 'Admin role required' });
      }
      
      const { weekStartISO } = req.body;
      
      console.log(`📧 Manual teacher digest trigger by ${(req as any).user.email}`);
      
      // Import the function here to avoid circular dependencies
      const { sendTeacherDigestToAll } = await import('./analytics/teacherDigest');
      
      // Run the digest in background
      setImmediate(() => {
        sendTeacherDigestToAll(weekStartISO);
      });
      
      // Audit log
      auditLog.adminAction((req as any).user.email, 'teacher_digest_manual_trigger', req.ip);
      
      res.json({ 
        success: true, 
        message: 'Teacher digest job started in background',
        weekStartISO: weekStartISO || 'auto'
      });
    } catch (err) {
      console.error('Error in POST /api/admin/digest/run:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Admin feedback endpoint for cloud submission (DEV mode or admin role required)
  api.post('/api/admin/feedback', async (req, res) => {
    try {
      const isDev = process.env.NODE_ENV === 'development';
      
      // Only allow in development mode for now
      if (!isDev) {
        return res.status(403).json({ error: 'Feedback endpoint only available in development' });
      }
      
      const feedback = req.body;
      
      // Basic validation
      if (!feedback || !feedback.id || !feedback.kind || !feedback.text) {
        return res.status(400).json({ error: 'Invalid feedback format' });
      }
      
      // Log feedback to console and audit log for admin review
      log.info('📝 Feedback received', {
        feedbackId: feedback.id,
        kind: feedback.kind,
        textLength: feedback.text.length,
        hasEmail: !!feedback.email,
        userAgent: feedback.meta?.userAgent?.substring(0, 50),
        classActive: feedback.meta?.classActive,
        timestamp: feedback.at
      });
      
      // Audit log feedback submission
      auditLog.auditAccess(feedback.email || 'anonymous', req.ip);
      
      res.json({
        ok: true,
        received_at: new Date().toISOString(),
        feedback_id: feedback.id
      });
    } catch (err) {
      console.error('Error in POST /api/admin/feedback:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.use(api);
  
  // Mount metrics routes
  app.use(metricsRouter);
  
  // Mount parent summary routes
  app.use(parentSummaryRouter);
  
  // Mount classes routes
  app.use('/api/classes', classesRouter);
  
  // Mount invites routes
  app.use('/api/invite', invitesRouter);

  console.log('🗄️  File-backed user storage initialized');
  console.log('📁  Data directory: .data/');
  
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧  Admin dump endpoint: GET /api/admin/dump');
  }

  // Initialize email service
  verifyEmailConfig().then(success => {
    if (success) {
      console.log('✅ Email service ready');
    } else {
      console.log('⚠️  Email service not configured - magic links will use preview mode');
    }
  });

  // Create and return the HTTP server that index.ts expects
  const server = createServer(app);
  return server;
}