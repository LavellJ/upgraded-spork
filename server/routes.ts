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

  // TODO: add real API routes later (e.g., /api/progress)

  app.use(api);

  // Create and return the HTTP server that index.ts expects
  const server = createServer(app);
  return server;
}