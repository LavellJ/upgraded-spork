// server/routes.ts
import type { Express } from "express";
import { Router } from "express";
import { createServer, type Server } from "http";

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

  // TODO: add real API routes later (e.g., /api/progress)

  app.use(api);

  // Create and return the HTTP server that index.ts expects
  const server = createServer(app);
  return server;
}