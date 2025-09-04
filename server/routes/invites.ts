import express from 'express';
import jwt from 'jsonwebtoken';
import { verifyToken } from '../auth';
import { getClassCollaborators, addCollaborator } from '../authz';

// Global type for pending invite acceptances
declare global {
  var pendingInviteAcceptances: Map<string, {
    classId: string;
    email: string;
    role: 'co_teacher';
    acceptedAt: number;
  }> | undefined;
}
import { statements } from '../db';
import { sendInviteEmail } from '../email';
import { JWT_SECRET } from '../config';

const router = express.Router();

// Rate limiting: Track invites per class per day
const inviteRateLimit = new Map<string, { count: number; resetTime: number }>();

// Clean up rate limit data every hour
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of inviteRateLimit.entries()) {
    if (now > data.resetTime) {
      inviteRateLimit.delete(key);
    }
  }
}, 60 * 60 * 1000); // 1 hour

// Middleware to verify authentication
function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const user = verifyToken(req.headers.authorization);
  
  if (!user) {
    return res.status(401).json({ error: 'Invalid or missing authentication token' });
  }
  
  // Attach user info to request
  (req as any).user = user;
  next();
}

// Create invite JWT token (7 days expiry)
function createInviteToken(classId: string, email: string): string {
  const payload = {
    kind: 'invite',
    classId,
    email: email.toLowerCase().trim(),
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
  };
  
  return jwt.sign(payload, JWT_SECRET);
}

// Verify invite JWT token
function verifyInviteToken(token: string): { classId: string; email: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    if (decoded.kind !== 'invite' || !decoded.classId || !decoded.email) {
      return null;
    }
    
    return {
      classId: decoded.classId,
      email: decoded.email
    };
  } catch (error) {
    return null;
  }
}

// Check rate limit for class invites (20/day)
function checkRateLimit(classId: string): boolean {
  const now = Date.now();
  const dayStart = new Date().setHours(0, 0, 0, 0);
  const resetTime = dayStart + (24 * 60 * 60 * 1000); // End of day
  
  const key = `class:${classId}`;
  const current = inviteRateLimit.get(key);
  
  if (!current || now > current.resetTime) {
    // Reset or initialize
    inviteRateLimit.set(key, { count: 1, resetTime });
    return true;
  }
  
  if (current.count >= 20) {
    return false; // Rate limit exceeded
  }
  
  current.count++;
  return true;
}

// Get class name for invite email
function getClassName(classId: string): string {
  try {
    // This is a simplified approach - in a real app you'd query the database
    // Since classes are stored locally per user, we'll use a generic name
    // TODO: Add proper class lookup when classes are moved to database
    return `Class ${classId.substring(0, 8)}`;
  } catch (error) {
    return 'Your Class';
  }
}

/**
 * POST /api/invite/co-teacher
 * Send co-teacher invitation email
 * Body: { classId: string, email: string }
 */
router.post('/co-teacher', requireAuth, async (req, res) => {
  try {
    const userEmail = (req as any).user.email;
    const { classId, email: inviteeEmail } = req.body;
    
    if (!classId || typeof classId !== 'string') {
      return res.status(400).json({ error: 'Class ID is required' });
    }

    if (!inviteeEmail || typeof inviteeEmail !== 'string') {
      return res.status(400).json({ error: 'Invitee email is required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const normalizedEmail = inviteeEmail.toLowerCase().trim();
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check if user is owner of the class
    const collaboratorsResult = getClassCollaborators(userEmail, classId);
    if (!collaboratorsResult.success) {
      return res.status(403).json({ error: 'Only class owners can send invitations' });
    }

    // Check if invitee is already a collaborator
    const existingCollaborator = collaboratorsResult.collaborators?.find(
      c => c.email.toLowerCase() === normalizedEmail
    );
    if (existingCollaborator) {
      return res.status(400).json({ error: 'User is already a collaborator on this class' });
    }

    // Check rate limit
    if (!checkRateLimit(classId)) {
      return res.status(429).json({ 
        error: 'Rate limit exceeded. Maximum 20 invitations per class per day.' 
      });
    }

    // Create invite token
    const token = createInviteToken(classId, normalizedEmail);
    const className = getClassName(classId);

    // Send invite email
    await sendInviteEmail(normalizedEmail, userEmail, className, token);

    // Audit log invite sent
    statements.insertAuditLog.run(
      Date.now(),
      userEmail,
      'invite_sent',
      JSON.stringify({
        classId,
        inviteeEmail: normalizedEmail,
        className,
        ip: req.ip
      })
    );

    res.json({ 
      success: true, 
      message: 'Invitation sent successfully',
      invitedEmail: normalizedEmail
    });

  } catch (error) {
    console.error('Error in POST /api/invite/co-teacher:', error);
    
    // Audit log error
    statements.insertAuditLog.run(
      Date.now(),
      (req as any).user?.email || 'unknown',
      'invite_error',
      JSON.stringify({
        error: error.message,
        classId: req.body.classId,
        ip: req.ip
      })
    );

    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/invite/accept?token=...
 * Accept co-teacher invitation via magic link
 */
router.get('/accept', async (req, res) => {
  try {
    const { token } = req.query;
    
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Invalid or missing invitation token' });
    }

    // Verify invite token
    const inviteData = verifyInviteToken(token);
    if (!inviteData) {
      return res.status(400).json({ error: 'Invalid or expired invitation token' });
    }

    const { classId, email } = inviteData;

    // Check if user is already a collaborator
    // Note: We can't easily check ownership without knowing who the current owner is
    // This is a limitation of the current localStorage-based class system
    // TODO: Improve this when classes are moved to database

    // Add collaborator with co_teacher role
    try {
      // For the invite system to work properly, we need to add the collaborator
      // Since this is a localStorage-based class system, we'll create a special
      // "invite acceptance" record that can be processed by the frontend
      
      // Store the accepted invite for frontend processing
      const inviteAcceptance = {
        classId,
        email,
        role: 'co_teacher' as const,
        acceptedAt: Date.now()
      };
      
      // Store in a simple in-memory map for the session
      // TODO: Move to proper database when class storage is centralized
      if (!global.pendingInviteAcceptances) {
        global.pendingInviteAcceptances = new Map();
      }
      global.pendingInviteAcceptances.set(`${classId}:${email}`, inviteAcceptance);
      
      // Clean up old acceptances (older than 1 hour)
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      for (const [key, acceptance] of global.pendingInviteAcceptances.entries()) {
        if (acceptance.acceptedAt < oneHourAgo) {
          global.pendingInviteAcceptances.delete(key);
        }
      }
      
      // Audit log successful invite acceptance
      statements.insertAuditLog.run(
        Date.now(),
        email,
        'invite_accepted',
        JSON.stringify({
          classId,
          ip: req.ip
        })
      );

      // Redirect to app with success indicator including class and email
      const redirectUrl = `${req.protocol}://${req.get('host')}/#/guide?acceptedInvite=1&classId=${encodeURIComponent(classId)}&email=${encodeURIComponent(email)}`;
      res.redirect(302, redirectUrl);

    } catch (addError) {
      console.error('Error processing invite acceptance:', addError);
      
      // Audit log error
      statements.insertAuditLog.run(
        Date.now(),
        email,
        'invite_accept_error',
        JSON.stringify({
          error: addError.message,
          classId,
          ip: req.ip
        })
      );

      // Redirect to app with error indicator
      const redirectUrl = `${req.protocol}://${req.get('host')}/#/guide?inviteError=1`;
      res.redirect(302, redirectUrl);
    }

  } catch (error) {
    console.error('Error in GET /api/invite/accept:', error);
    
    // Audit log error
    statements.insertAuditLog.run(
      Date.now(),
      'unknown',
      'invite_accept_error',
      JSON.stringify({
        error: error.message,
        token: req.query.token,
        ip: req.ip
      })
    );

    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/invite/pending
 * Get pending invite acceptances for the current user's classes
 */
router.get('/pending', requireAuth, async (req, res) => {
  try {
    const userEmail = (req as any).user.email;
    
    if (!global.pendingInviteAcceptances) {
      return res.json({ pending: [] });
    }
    
    const pending = [];
    for (const [key, acceptance] of global.pendingInviteAcceptances.entries()) {
      // Check if this user owns the class
      const collaboratorsResult = getClassCollaborators(userEmail, acceptance.classId);
      if (collaboratorsResult.success) {
        pending.push({
          key,
          classId: acceptance.classId,
          email: acceptance.email,
          role: acceptance.role,
          acceptedAt: acceptance.acceptedAt
        });
      }
    }
    
    res.json({ pending });
  } catch (error) {
    console.error('Error in GET /api/invite/pending:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/invite/process-pending
 * Process a pending invite acceptance
 */
router.post('/process-pending', requireAuth, async (req, res) => {
  try {
    const userEmail = (req as any).user.email;
    const { key } = req.body;
    
    if (!key || typeof key !== 'string') {
      return res.status(400).json({ error: 'Key is required' });
    }
    
    if (!global.pendingInviteAcceptances || !global.pendingInviteAcceptances.has(key)) {
      return res.status(404).json({ error: 'Pending acceptance not found' });
    }
    
    const acceptance = global.pendingInviteAcceptances.get(key)!;
    
    // Verify user owns the class
    const collaboratorsResult = getClassCollaborators(userEmail, acceptance.classId);
    if (!collaboratorsResult.success) {
      return res.status(403).json({ error: 'Not authorized to process this invite' });
    }
    
    // Add the collaborator
    const addResult = addCollaborator(userEmail, acceptance.classId, acceptance.email, acceptance.role);
    
    if (addResult.success) {
      // Remove from pending
      global.pendingInviteAcceptances.delete(key);
      
      // Audit log
      statements.insertAuditLog.run(
        Date.now(),
        userEmail,
        'invite_processed',
        JSON.stringify({
          classId: acceptance.classId,
          newCollaboratorEmail: acceptance.email,
          role: acceptance.role,
          ip: req.ip
        })
      );
      
      res.json({ success: true, collaborator: { email: acceptance.email, role: acceptance.role } });
    } else {
      res.status(400).json({ error: addResult.error });
    }
    
  } catch (error) {
    console.error('Error in POST /api/invite/process-pending:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;