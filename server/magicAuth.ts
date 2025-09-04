// Hardened magic link authentication with rate limiting
import type { Request, Response } from 'express';
import { issueToken, verifyToken } from './auth';
import { sendMagicLink } from './email';
import { statements } from './db';

// Rate limiting store for magic link requests
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limit: 5 requests per hour per email
const RATE_LIMIT_REQUESTS = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

/**
 * Check if email is rate limited
 */
function checkRateLimit(email: string): { allowed: boolean; resetIn?: number } {
  const now = Date.now();
  const record = rateLimitStore.get(email);
  
  if (!record || now > record.resetTime) {
    // No record or window expired, create new record
    rateLimitStore.set(email, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS
    });
    return { allowed: true };
  }
  
  if (record.count >= RATE_LIMIT_REQUESTS) {
    // Rate limit exceeded
    return { 
      allowed: false, 
      resetIn: Math.ceil((record.resetTime - now) / 1000) // seconds until reset
    };
  }
  
  // Increment count
  record.count++;
  return { allowed: true };
}

/**
 * Clean up expired rate limit records
 */
function cleanupRateLimit() {
  const now = Date.now();
  for (const [email, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(email);
    }
  }
}

// Clean up every 10 minutes
setInterval(cleanupRateLimit, 10 * 60 * 1000);

/**
 * Hardened magic link issue endpoint
 * POST /api/auth/magic-link { email }
 */
export async function handleMagicLinkRequest(req: Request, res: Response) {
  try {
    const { email } = req.body;
    
    // Validate email format
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    const normalizedEmail = email.toLowerCase().trim();
    
    // Check rate limit
    const rateCheck = checkRateLimit(normalizedEmail);
    if (!rateCheck.allowed) {
      // Always return 200 OK to not leak email existence, but log the attempt
      statements.insertAuditLog.run(Date.now(), normalizedEmail, 'magic_link_rate_limited', JSON.stringify({
        resetIn: rateCheck.resetIn,
        userAgent: req.headers['user-agent'] || '',
        ip: req.ip || req.connection.remoteAddress || ''
      }));
      
      return res.status(200).json({ 
        success: true, 
        message: 'If this email is registered, a sign-in link will be sent shortly.'
      });
    }
    
    // Generate token for this email (regardless of whether user exists)
    const token = issueToken({ email: normalizedEmail, role: 'guide' });
    
    try {
      // Send magic link email
      await sendMagicLink(normalizedEmail, token);
      
      // Always return success to not leak email existence
      res.status(200).json({ 
        success: true, 
        message: 'If this email is registered, a sign-in link will be sent shortly.'
      });
      
    } catch (emailError) {
      console.error('Email send failed:', emailError);
      
      // Still return success to not leak email existence
      res.status(200).json({ 
        success: true, 
        message: 'If this email is registered, a sign-in link will be sent shortly.'
      });
    }
    
  } catch (error) {
    console.error('Magic link request failed:', error);
    
    // Generic error to not leak information
    res.status(500).json({ 
      error: 'Unable to process request. Please try again later.' 
    });
  }
}

/**
 * Token verification endpoint
 * POST /api/auth/verify-token { token }
 */
export async function handleTokenVerification(req: Request, res: Response) {
  try {
    const { token } = req.body;
    
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Token is required' });
    }
    
    // Verify the token using existing auth
    const user = verifyToken(`Bearer ${token}`);
    
    if (!user) {
      statements.insertAuditLog.run(Date.now(), null, 'token_verification_failed', JSON.stringify({
        userAgent: req.headers['user-agent'] || '',
        ip: req.ip || req.connection.remoteAddress || ''
      }));
      
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    
    // Log successful verification
    statements.insertAuditLog.run(Date.now(), user.email, 'token_verified', JSON.stringify({
      role: user.role,
      userAgent: req.headers['user-agent'] || '',
      ip: req.ip || req.connection.remoteAddress || ''
    }));
    
    res.status(200).json({ 
      success: true, 
      user: {
        email: user.email,
        role: user.role
      },
      token // Return the same token for client storage
    });
    
  } catch (error) {
    console.error('Token verification failed:', error);
    res.status(500).json({ error: 'Unable to verify token' });
  }
}