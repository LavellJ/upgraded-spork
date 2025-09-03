// server/routes.ts
import type { Express, Request, Response, NextFunction } from "express";
import { Router } from "express";
import { createServer, type Server } from "http";
import { verifyToken, issueToken } from './auth';
import { userStorage, type UserDoc } from './userStorage';
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
  return userStorage.getUserDoc(email);
}

// Helper to save user doc to file storage
async function saveUserDoc(email: string, doc: UserDoc): Promise<void> {
  await userStorage.saveUserDoc(email, doc);
}

/**
 * Wire up API routes and return an HTTP server for Vite to attach to.
 */
export async function registerRoutes(app: Express): Promise<Server> {
  const api = Router();

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

  // Development token issuing (DEV only)
  if (process.env.NODE_ENV === 'development') {
    api.get('/api/dev/issue', (req, res) => {
      const email = req.query.email as string;
      const role = (req.query.role as 'guide' | 'admin') || 'guide';
      
      if (!email) {
        return res.status(400).json({ error: 'email parameter required' });
      }
      
      const token = issueToken({ email, role });
      res.json({ token, expires_in_days: 30 });
    });
  }
  
  // Sync endpoints (protected + rate limited)
  api.post('/api/sync/batch', rateLimitMiddleware, authMiddleware, async (req, res) => {
    try {
      const { userId, learnerId, items } = req.body;
      
      if (!userId || !learnerId || !Array.isArray(items)) {
        return res.status(400).json({ error: 'Missing required fields: userId, learnerId, items' });
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
      
      res.json({ ok: true, accepted });
    } catch (err) {
      console.error('Error in /api/sync/batch:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
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
        return res.json({
          users,
          stats,
          usage: 'GET /api/admin/dump?email=user@example.com to dump specific user data'
        });
      }
      
      // Get and return user document
      const userDoc = await getUserDoc(email);
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
      const result = await userStorage.runRetentionCompaction();
      
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

  app.use(api);

  console.log('🗄️  File-backed user storage initialized');
  console.log('📁  Data directory: .data/');
  
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧  Admin dump endpoint: GET /api/admin/dump');
  }

  // Create and return the HTTP server that index.ts expects
  const server = createServer(app);
  return server;
}