// server/routes.ts
import type { Express, Request, Response, NextFunction } from "express";
import { Router } from "express";
import { createServer, type Server } from "http";
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

// Auth middleware
function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }
  
  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  
  // In DEV, accept any non-empty token
  if (!token || token.trim() === '') {
    return res.status(401).json({ error: 'Empty token' });
  }
  
  // Store token in request for potential future use
  (req as any).authToken = token;
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

  // Sync endpoints
  api.post('/api/sync/batch', authMiddleware, (req, res) => {
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
  
  // Roster endpoints
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
  
  api.post('/api/roster', authMiddleware, (req, res) => {
    try {
      // Simple approach: accept entire roster object for sync
      const roster = req.body;
      
      if (!roster || !roster.learners || !Array.isArray(roster.learners)) {
        return res.status(400).json({ error: 'Invalid roster format' });
      }
      
      // Derive userId from token (simplified for DEV)
      const userId = `user_${(req as any).authToken.slice(-8)}`;
      
      const userData = getUserData(userId);
      userData.roster = roster;
      
      res.json({ ok: true, roster: userData.roster });
    } catch (err) {
      console.error('Error in POST /api/roster:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.use(api);

  // Create and return the HTTP server that index.ts expects
  const server = createServer(app);
  return server;
}