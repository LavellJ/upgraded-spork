import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import { storage } from './storage';

// Hash password helper
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

// Verify password helper  
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Generate secure session token
export function generateSessionToken(): string {
  return randomUUID() + '-' + randomUUID();
}

// Session expiry helper (24 hours)
export function getSessionExpiry(): Date {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 1); // 24 hours from now
  return expiry;
}

// Middleware to check parent authentication
export async function requireParentAuth(req: Request & { parentId?: string }, res: Response, next: NextFunction) {
  try {
    const sessionToken = req.headers.authorization?.replace('Bearer ', '');
    
    if (!sessionToken) {
      return res.status(401).json({ error: 'No session token provided' });
    }

    const session = await storage.getParentSession(sessionToken);
    if (!session) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    // Add parent ID to request for use in route handlers
    req.parentId = session.parentId;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

// Get current parent from request
export async function getCurrentParent(req: Request & { parentId?: string }) {
  if (!req.parentId) {
    throw new Error('No authenticated parent');
  }
  
  const parent = await storage.getParent(req.parentId);
  if (!parent) {
    throw new Error('Parent not found');
  }
  
  return parent;
}

// Log parent activity
export async function logParentActivity(
  parentId: string, 
  action: string, 
  studentId?: string, 
  details?: any
) {
  await storage.createParentActivity({
    parentId,
    action,
    studentId: studentId || null,
    details: details || null
  });
}