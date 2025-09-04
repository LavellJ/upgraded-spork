/**
 * Request tracking middleware with request IDs and timing
 */
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { StructuredLogger } from '../log';

// Extend Express Request type to include tracking fields
declare global {
  namespace Express {
    interface Request {
      reqId: string;
      logger: StructuredLogger;
      startTime: [number, number];
    }
  }
}

/**
 * Middleware to add request ID, logger, and timing to each request
 */
export function requestTrackingMiddleware(req: Request, res: Response, next: NextFunction) {
  // Generate unique request ID
  req.reqId = uuidv4();
  
  // Record start time with high precision
  req.startTime = process.hrtime();
  
  // Create request-scoped logger
  req.logger = new StructuredLogger({
    reqId: req.reqId,
    route: req.path,
    method: req.method,
  });

  // Set response header for debugging
  res.set('X-Request-ID', req.reqId);

  // Log request start
  req.logger.requestStart(req.method, req.path, {
    userAgent: req.get('User-Agent'),
    ip: req.ip,
  });

  // Monkey patch res.end to log completion
  const originalEnd = res.end;
  res.end = function(this: Response, ...args: any[]) {
    // Calculate duration
    const [seconds, nanoseconds] = process.hrtime(req.startTime);
    const duration = Math.round(seconds * 1000 + nanoseconds / 1000000);

    // Log request completion
    req.logger.requestEnd(req.method, req.path, res.statusCode, duration, {
      contentLength: res.get('Content-Length'),
    });

    // Call original end
    originalEnd.apply(this, args);
  };

  next();
}

/**
 * Middleware to extract user context and add to logger
 */
export function userContextMiddleware(req: Request, res: Response, next: NextFunction) {
  // Check for authenticated user (adjust based on your auth implementation)
  const user = (req as any).user;
  if (user) {
    req.logger = req.logger.child({
      userEmail: user.email || user.claims?.email,
      userId: user.id || user.claims?.sub,
    });
  }

  next();
}