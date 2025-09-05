/**
 * Retention Policy Management Routes
 * 
 * API endpoints for managing per-tenant retention policies and running compaction
 */

import { Router } from 'express';
import { z } from 'zod';
import { verifyToken } from '../auth';
import { readPolicy, writePolicy, runPolicy, validateRetentionPolicy, getDefaultRetention } from '../retention';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Schema for updating retention policy
const updateRetentionSchema = z.object({
  eventsDays: z.number().int().min(7).max(365),
  auditDays: z.number().int().min(30).max(2555)
});

/**
 * GET /api/retention/policy - Get current retention policy for authenticated user
 */
router.get('/policy', asyncHandler(async (req, res) => {
  const token = verifyToken(req.headers.authorization);
  if (!token?.email) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const policy = readPolicy(token.email);
  const defaults = getDefaultRetention();
  
  res.json({
    policy,
    defaults,
    isCustom: policy.updatedAt > 0
  });
}));

/**
 * PUT /api/retention/policy - Update retention policy for authenticated user
 */
router.put('/policy', asyncHandler(async (req, res) => {
  const token = verifyToken(req.headers.authorization);
  if (!token?.email) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const body = updateRetentionSchema.parse(req.body);
  
  // Validate policy values
  const validationErrors = validateRetentionPolicy(body.eventsDays, body.auditDays);
  if (validationErrors.length > 0) {
    return res.status(400).json({ 
      error: 'Invalid retention policy',
      details: validationErrors 
    });
  }

  // Save policy
  writePolicy(token.email, body.eventsDays, body.auditDays);
  
  // Return updated policy
  const updatedPolicy = readPolicy(token.email);
  res.json({ policy: updatedPolicy });
}));

/**
 * POST /api/admin/retention/run - Run retention policy manually (admin/dev only)
 */
router.post('/admin/run', asyncHandler(async (req, res) => {
  const token = verifyToken(req.headers.authorization);
  if (!token?.email || (token.role !== 'admin' && token.role !== 'guide')) {
    return res.status(403).json({ error: 'Admin or guide role required' });
  }

  // Optional email parameter to run policy for specific user
  const targetEmail = req.query.email as string | undefined;
  const email = targetEmail || token.email;
  
  // Verify admin can run policy for other users
  if (targetEmail && token.role !== 'admin' && targetEmail !== token.email) {
    return res.status(403).json({ error: 'Admin role required to run policy for other users' });
  }

  try {
    const result = await runPolicy(email);
    
    res.json({
      success: true,
      result,
      runAt: new Date().toISOString(),
      policy: readPolicy(email)
    });
  } catch (error) {
    console.error('Retention policy execution failed:', error);
    res.status(500).json({ 
      error: 'Policy execution failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

/**
 * GET /api/admin/retention/status - Get retention status for user (admin/dev only)
 */
router.get('/admin/status', asyncHandler(async (req, res) => {
  const token = verifyToken(req.headers.authorization);
  if (!token?.email || (token.role !== 'admin' && token.role !== 'guide')) {
    return res.status(403).json({ error: 'Admin or guide role required' });
  }

  const targetEmail = req.query.email as string | undefined;
  const email = targetEmail || token.email;
  
  if (targetEmail && token.role !== 'admin' && targetEmail !== token.email) {
    return res.status(403).json({ error: 'Admin role required to check other users' });
  }

  const policy = readPolicy(email);
  const defaults = getDefaultRetention();
  
  // Calculate cutoff dates
  const now = Date.now();
  const eventsCutoff = now - (policy.eventsDays * 24 * 60 * 60 * 1000);
  const auditCutoff = now - (policy.auditDays * 24 * 60 * 60 * 1000);
  
  res.json({
    email,
    policy,
    defaults,
    cutoffs: {
      events: new Date(eventsCutoff).toISOString(),
      audit: new Date(auditCutoff).toISOString()
    },
    isCustom: policy.updatedAt > 0,
    lastUpdated: policy.updatedAt > 0 ? new Date(policy.updatedAt).toISOString() : null
  });
}));

export default router;