import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import { storage } from './storage';
import { JWT_SECRET, TOKEN_TTL_DAYS } from './config';

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

// JWT Authentication
export function issueToken(user: { email: string; role: 'guide' | 'admin' }): string {
  const payload = {
    sub: user.email,
    role: user.role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (TOKEN_TTL_DAYS * 24 * 60 * 60)
  };
  
  return jwt.sign(payload, JWT_SECRET);
}

export function verifyToken(authHeader: string | undefined): { email: string; role: string } | null {
  try {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token || token.trim() === '') {
      return null;
    }
    
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    if (!decoded.sub || !decoded.role) {
      return null;
    }
    
    return {
      email: decoded.sub,
      role: decoded.role
    };
  } catch (error) {
    // Token is invalid, expired, or malformed
    return null;
  }
}