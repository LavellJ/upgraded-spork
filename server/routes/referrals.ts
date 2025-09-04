import express from 'express';
import { verifyToken } from '../auth';
import { statements } from '../db';
import { APP_BASE_URL } from '../config';

const router = express.Router();

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

// Generate a short base36 code (6 characters)
function generateShortCode(): string {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Check if a code already exists
function codeExists(code: string): boolean {
  try {
    const referral = statements.getReferral.get(code);
    return !!referral;
  } catch (error) {
    return false;
  }
}

// Generate a unique short code
function generateUniqueCode(): string {
  let code: string;
  let attempts = 0;
  
  do {
    if (attempts > 100) {
      throw new Error('Unable to generate unique referral code');
    }
    code = generateShortCode();
    attempts++;
  } while (codeExists(code));
  
  return code;
}

/**
 * POST /api/referrals/create
 * Create a new teacher referral link
 */
router.post('/create', requireAuth, async (req, res) => {
  try {
    const userEmail = (req as any).user.email;
    const now = Date.now();
    
    // Generate unique short code
    const code = generateUniqueCode();
    
    // Insert referral into database
    statements.insertReferral.run(code, userEmail, now, 0, null);
    
    // Build the referral URL
    const baseUrl = APP_BASE_URL || `${req.protocol}://${req.get('host')}`;
    const referralUrl = `${baseUrl}/r/${code}`;
    
    // Audit log referral creation
    statements.insertAuditLog.run(
      now,
      userEmail,
      'referral_created',
      JSON.stringify({
        code,
        referralUrl,
        ip: req.ip
      })
    );
    
    res.json({
      success: true,
      code,
      url: referralUrl
    });
    
  } catch (error) {
    console.error('Error in POST /api/referrals/create:', error);
    
    // Audit log error
    const userEmail = (req as any).user?.email || 'unknown';
    statements.insertAuditLog.run(
      Date.now(),
      userEmail,
      'referral_create_error',
      JSON.stringify({
        error: error.message,
        ip: req.ip
      })
    );
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/referrals/stats
 * Get aggregated referral statistics for the authenticated user
 */
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const userEmail = (req as any).user.email;
    const now = Date.now();
    const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
    
    // Get all referrals for this user
    const referrals = statements.getReferralsByOwner.all(userEmail);
    
    // Calculate total clicks
    const totalClicks = referrals.reduce((sum: number, ref: any) => sum + (ref.clicks || 0), 0);
    
    // Calculate clicks in last 7 days
    const clicks7d = referrals.reduce((sum: number, ref: any) => {
      if (ref.lastClickAt && ref.lastClickAt >= sevenDaysAgo) {
        return sum + (ref.clicks || 0);
      }
      return sum;
    }, 0);
    
    // Get recent clicks (simplified - in real implementation, would need click history table)
    const lastClicks = referrals
      .filter((ref: any) => ref.lastClickAt)
      .map((ref: any) => ({ at: ref.lastClickAt }))
      .sort((a: any, b: any) => b.at - a.at)
      .slice(0, 10);
    
    res.json({
      success: true,
      stats: {
        totalClicks,
        clicks7d,
        lastClicks
      }
    });
    
  } catch (error) {
    console.error('Error in GET /api/referrals/stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/referrals
 * Get referrals for the current user
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const userEmail = (req as any).user.email;
    
    // Get all referrals for this user
    const referrals = statements.getReferralsByOwner.all(userEmail);
    
    // Build referral URLs
    const baseUrl = APP_BASE_URL || `${req.protocol}://${req.get('host')}`;
    const referralsWithUrls = referrals.map((referral: any) => ({
      ...referral,
      url: `${baseUrl}/r/${referral.code}`
    }));
    
    res.json({
      success: true,
      referrals: referralsWithUrls
    });
    
  } catch (error) {
    console.error('Error in GET /api/referrals:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/referrals/:code
 * Delete a referral code
 */
router.delete('/:code', requireAuth, async (req, res) => {
  try {
    const userEmail = (req as any).user.email;
    const { code } = req.params;
    
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Code is required' });
    }
    
    // Delete the referral (only if owned by current user)
    const result = statements.deleteReferral.run(code, userEmail);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Referral not found or not owned by user' });
    }
    
    // Audit log referral deletion
    statements.insertAuditLog.run(
      Date.now(),
      userEmail,
      'referral_deleted',
      JSON.stringify({
        code,
        ip: req.ip
      })
    );
    
    res.json({ success: true });
    
  } catch (error) {
    console.error('Error in DELETE /api/referrals/:code:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;