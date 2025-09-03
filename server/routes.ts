// server/routes.ts
import type { Express, Request, Response, NextFunction } from "express";
import { Router } from "express";
import { createServer, type Server } from "http";
import { verifyToken, issueToken } from './auth';
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

// Helper function to get or create user data
function getUserData(userId: string) {
  if (!DB.users.has(userId)) {
    DB.users.set(userId, {
      roster: { learners: [] },
      data: {}
    });
  }
  return DB.users.get(userId)!;
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
  api.post('/api/sync/batch', rateLimitMiddleware, authMiddleware, (req, res) => {
    try {
      const { userId, learnerId, items } = req.body;
      
      if (!userId || !learnerId || !Array.isArray(items)) {
        return res.status(400).json({ error: 'Missing required fields: userId, learnerId, items' });
      }
      
      const userData = getUserData(userId);
      
      // Ensure learner data exists
      if (!userData.data[learnerId]) {
        userData.data[learnerId] = {};
      }
      
      let accepted = 0;
      
      // Process each item with idempotency
      for (const item of items) {
        if (!item.id) continue;
        
        // Check if we've already seen this item
        if (!userData.data[learnerId][item.id]) {
          userData.data[learnerId][item.id] = item;
          accepted++;
        }
        // If already exists, ignore (idempotent)
      }
      
      res.json({ ok: true, accepted });
    } catch (err) {
      console.error('Error in /api/sync/batch:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  // Roster endpoints (protected)
  api.get('/api/roster', authMiddleware, (req, res) => {
    try {
      const userId = req.query.userId as string;
      
      if (!userId) {
        return res.status(400).json({ error: 'Missing userId parameter' });
      }
      
      const userData = getUserData(userId);
      res.json(userData.roster);
    } catch (err) {
      console.error('Error in GET /api/roster:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  api.post('/api/roster', rateLimitMiddleware, authMiddleware, (req, res) => {
    try {
      // Simple approach: accept entire roster object for sync
      const roster = req.body;
      
      if (!roster || !roster.learners || !Array.isArray(roster.learners)) {
        return res.status(400).json({ error: 'Invalid roster format' });
      }
      
      // Derive userId from authenticated user email
      const userId = `user_${(req as any).user.email.replace('@', '_').replace('.', '_')}`;
      
      const userData = getUserData(userId);
      userData.roster = roster;
      
      res.json({ ok: true, roster: userData.roster });
    } catch (err) {
      console.error('Error in POST /api/roster:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Snapshot endpoint for development import (DEV only)
  api.get('/api/snapshot', authMiddleware, (req, res) => {
    try {
      const userId = req.query.userId as string;
      
      if (!userId) {
        return res.status(400).json({ error: 'Missing userId parameter' });
      }
      
      const userData = getUserData(userId);
      
      // Convert server data format to V2 backup format
      const snapshotData = {
        roster: userData.roster,
        data: {} as Record<string, any>,
        telemetryBuffer: [] // Not tracked on server for privacy
      };
      
      // Convert learner data from server format to V2 format
      for (const [learnerId, rawData] of Object.entries(userData.data)) {
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

  app.use(api);

  // Create and return the HTTP server that index.ts expects
  const server = createServer(app);
  return server;
}