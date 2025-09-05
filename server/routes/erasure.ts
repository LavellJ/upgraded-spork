// server/routes/erasure.ts - Data erasure/suppression endpoints with grace period
import { Router } from 'express';
import { asyncHandler, ValidationError, NotFoundError } from '../middleware/errorHandler';
import { verifyToken } from '../auth';
import { auditLog } from '../audit';
import { statements, type ErasureRequestRow } from '../db';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import crypto from 'crypto';

const router = Router();

// Grace period: 7 days in milliseconds
const GRACE_PERIOD_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Validation schemas
const createErasureRequestSchema = z.object({
  scope: z.enum(['learner', 'account']),
  learnerId: z.string().optional()
});

// Create erasure request
router.post('/request', asyncHandler(async (req, res) => {
  const token = verifyToken(req);
  if (!token?.email) {
    throw new ValidationError('Authentication required');
  }

  const { scope, learnerId } = createErasureRequestSchema.parse(req.body);
  
  // Validate learner ID for learner scope
  if (scope === 'learner' && !learnerId) {
    throw new ValidationError('learnerId is required when scope is learner');
  }

  // Create request record
  const requestId = randomUUID();
  const now = Date.now();
  const dueAt = now + GRACE_PERIOD_MS;
  
  statements.insertErasureRequest.run(
    requestId,
    token.email,
    scope,
    scope === 'learner' ? learnerId : null,
    'scheduled',
    now,
    dueAt
  );

  // Log the request
  auditLog(token.email, 'erasure_requested', { 
    requestId, 
    scope, 
    learnerId: scope === 'learner' ? learnerId : undefined,
    dueAt 
  });

  res.json({ 
    requestId,
    scope,
    learnerId: scope === 'learner' ? learnerId : undefined,
    status: 'scheduled',
    requestedAt: now,
    dueAt,
    graceDays: 7,
    message: 'Erasure request scheduled successfully. You have 7 days to cancel if needed.'
  });
}));

// Cancel erasure request (within grace period)
router.post('/:id/cancel', asyncHandler(async (req, res) => {
  const token = verifyToken(req);
  if (!token?.email) {
    throw new ValidationError('Authentication required');
  }

  const request = statements.getErasureRequest.get(req.params.id) as ErasureRequestRow | undefined;
  if (!request) {
    throw new NotFoundError('Erasure request not found');
  }

  if (request.email !== token.email) {
    throw new ValidationError('Access denied');
  }

  if (request.status !== 'scheduled') {
    throw new ValidationError(`Cannot cancel request with status: ${request.status}`);
  }

  // Check if still within grace period
  if (Date.now() > request.dueAt) {
    throw new ValidationError('Grace period has expired, cannot cancel');
  }

  // Cancel the request
  statements.updateErasureRequestStatus.run('canceled', request.id);

  // Log cancellation
  auditLog(token.email, 'erasure_canceled', { requestId: request.id });

  res.json({ 
    message: 'Erasure request canceled successfully',
    requestId: request.id
  });
}));

// Execute erasure request (admin/cron only)
router.post('/:id/run', asyncHandler(async (req, res) => {
  const token = verifyToken(req);
  if (!token?.email) {
    throw new ValidationError('Authentication required');
  }

  // For now, allow any authenticated user to run erasure requests
  // In production, this would be restricted to admin users or run by cron
  
  const request = statements.getErasureRequest.get(req.params.id) as ErasureRequestRow | undefined;
  if (!request) {
    throw new NotFoundError('Erasure request not found');
  }

  if (request.status !== 'scheduled') {
    throw new ValidationError(`Cannot run request with status: ${request.status}`);
  }

  // Check if due time has passed
  if (Date.now() < request.dueAt) {
    throw new ValidationError('Grace period has not expired yet');
  }

  try {
    await executeErasure(request);
    
    res.json({ 
      message: 'Erasure executed successfully',
      requestId: request.id
    });
  } catch (error) {
    throw new ValidationError(`Failed to execute erasure: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}));

// List user's erasure requests
router.get('/', asyncHandler(async (req, res) => {
  const token = verifyToken(req);
  if (!token?.email) {
    throw new ValidationError('Authentication required');
  }

  const requests = statements.getErasureRequestsByUser.all(token.email) as ErasureRequestRow[];
  
  const formattedRequests = requests.map(request => ({
    id: request.id,
    scope: request.scope,
    learnerId: request.learnerId,
    status: request.status,
    requestedAt: request.requestedAt,
    dueAt: request.dueAt,
    graceDaysRemaining: request.status === 'scheduled' 
      ? Math.max(0, Math.ceil((request.dueAt - Date.now()) / (24 * 60 * 60 * 1000)))
      : 0
  }));

  res.json({ requests: formattedRequests });
}));

// Get specific erasure request status
router.get('/:id/status', asyncHandler(async (req, res) => {
  const token = verifyToken(req);
  if (!token?.email) {
    throw new ValidationError('Authentication required');
  }

  const request = statements.getErasureRequest.get(req.params.id) as ErasureRequestRow | undefined;
  if (!request) {
    throw new NotFoundError('Erasure request not found');
  }

  if (request.email !== token.email) {
    throw new ValidationError('Access denied');
  }

  res.json({
    id: request.id,
    scope: request.scope,
    learnerId: request.learnerId,
    status: request.status,
    requestedAt: request.requestedAt,
    dueAt: request.dueAt,
    graceDaysRemaining: request.status === 'scheduled' 
      ? Math.max(0, Math.ceil((request.dueAt - Date.now()) / (24 * 60 * 60 * 1000)))
      : 0
  });
}));

// Execute erasure logic
async function executeErasure(request: ErasureRequestRow): Promise<void> {
  try {
    if (request.scope === 'learner' && request.learnerId) {
      // Delete all user_docs for specific learner
      statements.deleteUserDocsByLearner.run(request.email, request.learnerId);
      
      // Mask learner ID in audit logs (replace with hash for privacy)
      const maskedId = crypto.createHash('sha256').update(request.learnerId).digest('hex').substring(0, 8);
      statements.maskAuditLogLearner.run(maskedId, request.email, request.learnerId);
      
      auditLog(request.email, 'erasure_done', { 
        requestId: request.id, 
        scope: 'learner', 
        maskedLearnerId: maskedId 
      });
    } else if (request.scope === 'account') {
      // Delete all user_docs for entire account
      statements.deleteUserDocsByEmail.run(request.email);
      
      auditLog(request.email, 'erasure_done', { 
        requestId: request.id, 
        scope: 'account'
      });
    }
    
    // Mark request as completed
    statements.updateErasureRequestStatus.run('done', request.id);
    
  } catch (error) {
    console.error('Erasure execution failed:', error);
    throw error;
  }
}

// Process due erasures (called by cron)
export async function processDueErasures(): Promise<{ processed: number; errors: string[] }> {
  const now = Date.now();
  const dueRequests = statements.getDueErasureRequests.all(now) as ErasureRequestRow[];
  
  let processed = 0;
  const errors: string[] = [];
  
  for (const request of dueRequests) {
    try {
      await executeErasure(request);
      processed++;
    } catch (error) {
      const errorMsg = `Failed to process erasure ${request.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      errors.push(errorMsg);
      console.error(errorMsg);
    }
  }
  
  return { processed, errors };
}

export default router;