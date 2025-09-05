// server/routes/dsar.ts - Data Subject Access Request endpoints
import { Router } from 'express';
import { asyncHandler, ValidationError, NotFoundError, AppError } from '../middleware/errorHandler';
import { verifyToken } from '../auth';
import { auditLog } from '../audit';
import { statements, type DsarRequestRow } from '../db';
import { decrypt } from '../crypto';
import { userStorage } from '../userStorage';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';
import archiver from 'archiver';
import { z } from 'zod';

const router = Router();

// Rate limiting: max 3 open requests per user, 1 per hour
const RATE_LIMIT_ACTIVE = 3;
const RATE_LIMIT_HOUR = 60 * 60 * 1000; // 1 hour in ms

// Validation schemas
const createRequestSchema = z.object({
  learnerIds: z.array(z.string()).optional()
});

// Request data export
router.post('/request', asyncHandler(async (req, res) => {
  const token = verifyToken(req);
  if (!token?.email) {
    throw new ValidationError('Authentication required');
  }

  const { learnerIds = [] } = createRequestSchema.parse(req.body);
  
  // Rate limiting checks
  const activeCount = statements.countActiveDsarRequests.get(token.email) as { count: number };
  if (activeCount.count >= RATE_LIMIT_ACTIVE) {
    throw new ValidationError(`Maximum ${RATE_LIMIT_ACTIVE} active export requests allowed`);
  }

  const hourAgo = Date.now() - RATE_LIMIT_HOUR;
  const recentCount = statements.countRecentDsarRequests.get(token.email, hourAgo) as { count: number };
  if (recentCount.count >= 1) {
    throw new ValidationError('Only one export request allowed per hour');
  }

  // Create request record
  const requestId = randomUUID();
  const now = Date.now();
  
  statements.insertDsarRequest.run(
    requestId,
    token.email,
    JSON.stringify(learnerIds),
    'pending',
    now,
    null,
    null,
    null
  );

  // Start export process (inline for DEV)
  try {
    await processExportRequest(requestId, token.email, learnerIds);
  } catch (error) {
    statements.updateDsarRequestStatus.run(
      'error',
      null,
      error instanceof Error ? error.message : 'Export failed',
      null,
      requestId
    );
    auditLog(token.email, 'dsar_export_error', { requestId, error: error instanceof Error ? error.message : 'Unknown error' });
  }

  // Log the request
  auditLog(token.email, 'dsar_export_requested', { 
    requestId, 
    learnerCount: learnerIds.length 
  });

  res.json({ 
    requestId,
    status: 'pending',
    message: 'Export request created successfully'
  });
}));

// Get request status
router.get('/:id/status', asyncHandler(async (req, res) => {
  const token = verifyToken(req);
  if (!token?.email) {
    throw new ValidationError('Authentication required');
  }

  const request = statements.getDsarRequest.get(req.params.id) as DsarRequestRow | undefined;
  if (!request) {
    throw new NotFoundError('Export request not found');
  }

  if (request.requesterEmail !== token.email) {
    throw new ValidationError('Access denied');
  }

  res.json({
    id: request.id,
    status: request.status,
    createdAt: request.createdAt,
    readyAt: request.readyAt,
    error: request.error,
    learnerCount: JSON.parse(request.learnerIds).length
  });
}));

// Download export ZIP
router.get('/:id/download', asyncHandler(async (req, res) => {
  const token = verifyToken(req);
  if (!token?.email) {
    throw new ValidationError('Authentication required');
  }

  const request = statements.getDsarRequest.get(req.params.id) as DsarRequestRow | undefined;
  if (!request) {
    throw new NotFoundError('Export request not found');
  }

  if (request.requesterEmail !== token.email) {
    throw new ValidationError('Access denied');
  }

  if (request.status !== 'ready' || !request.artifactPath) {
    throw new ValidationError('Export not ready for download');
  }

  if (!fs.existsSync(request.artifactPath)) {
    throw new NotFoundError('Export file not found');
  }

  // Log download
  auditLog(token.email, 'dsar_export_downloaded', { requestId: request.id });

  // Stream the ZIP file
  const filename = `dsar-export-${request.id}.zip`;
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  
  const stream = fs.createReadStream(request.artifactPath);
  stream.pipe(res);
}));

// Purge export
router.post('/:id/purge', asyncHandler(async (req, res) => {
  const token = verifyToken(req);
  if (!token?.email) {
    throw new ValidationError('Authentication required');
  }

  const request = statements.getDsarRequest.get(req.params.id) as DsarRequestRow | undefined;
  if (!request) {
    throw new NotFoundError('Export request not found');
  }

  if (request.requesterEmail !== token.email) {
    throw new ValidationError('Access denied');
  }

  // Delete artifact file if it exists
  if (request.artifactPath && fs.existsSync(request.artifactPath)) {
    try {
      fs.unlinkSync(request.artifactPath);
    } catch (error) {
      console.warn('Failed to delete export artifact:', error);
    }
  }

  // Delete export directory if it exists
  const exportDir = path.join('.exports', request.id);
  if (fs.existsSync(exportDir)) {
    try {
      fs.rmSync(exportDir, { recursive: true, force: true });
    } catch (error) {
      console.warn('Failed to delete export directory:', error);
    }
  }

  // Update status to purged
  statements.updateDsarRequestStatus.run(
    'purged',
    null,
    null,
    null,
    request.id
  );

  // Log purge
  auditLog(token.email, 'dsar_export_purged', { requestId: request.id });

  res.json({ 
    message: 'Export purged successfully' 
  });
}));

// List user's export requests
router.get('/', asyncHandler(async (req, res) => {
  const token = verifyToken(req);
  if (!token?.email) {
    throw new ValidationError('Authentication required');
  }

  const requests = statements.getDsarRequestsByUser.all(token.email) as DsarRequestRow[];
  
  const formattedRequests = requests.map(request => ({
    id: request.id,
    status: request.status,
    createdAt: request.createdAt,
    readyAt: request.readyAt,
    error: request.error,
    learnerCount: JSON.parse(request.learnerIds).length
  }));

  res.json({ requests: formattedRequests });
}));

// Export processing function
async function processExportRequest(requestId: string, requesterEmail: string, learnerIds: string[]) {
  try {
    // Create export directory
    const exportDir = path.join('.exports', requestId);
    const learnersDir = path.join(exportDir, 'learners');
    
    // Ensure directories exist
    fs.mkdirSync(exportDir, { recursive: true });
    fs.mkdirSync(learnersDir, { recursive: true });

    // Get user data
    const userDoc = await userStorage.getUser(requesterEmail);
    
    // Get all learners if none specified
    const targetLearnerIds = learnerIds.length > 0 
      ? learnerIds 
      : statements.listLearners.all(requesterEmail).map((row: any) => row.learnerId);

    // Create meta.json
    const meta = {
      exportId: requestId,
      requesterEmail,
      createdAt: Date.now(),
      learnerIds: targetLearnerIds,
      exportType: 'dsar',
      version: '1.0'
    };
    fs.writeFileSync(path.join(exportDir, 'meta.json'), JSON.stringify(meta, null, 2));

    // Create account.json (user profile data)
    const account = {
      email: requesterEmail,
      profile: userDoc?.profile || {},
      createdAt: userDoc?.createdAt || Date.now(),
      updatedAt: userDoc?.updatedAt || Date.now()
    };
    fs.writeFileSync(path.join(exportDir, 'account.json'), JSON.stringify(account, null, 2));

    // Export learner data
    for (const learnerId of targetLearnerIds) {
      const learnerDir = path.join(learnersDir, learnerId);
      fs.mkdirSync(learnerDir, { recursive: true });

      // Get all buckets for this learner
      const buckets = statements.getUserBuckets.all(requesterEmail, learnerId) as Array<{
        bucket: string;
        version: number;
        updatedAt: number;
      }>;

      for (const bucketInfo of buckets) {
        try {
          const docRow = statements.getUserDoc.get(requesterEmail, learnerId, bucketInfo.bucket);
          if (docRow) {
            // Decrypt the data
            const decryptedData = JSON.parse(decrypt(docRow.ciphertext));
            
            // Write to appropriate file
            const filename = `${bucketInfo.bucket}.json`;
            const exportData = {
              learnerId,
              bucket: bucketInfo.bucket,
              version: bucketInfo.version,
              updatedAt: bucketInfo.updatedAt,
              data: decryptedData
            };
            
            fs.writeFileSync(
              path.join(learnerDir, filename), 
              JSON.stringify(exportData, null, 2)
            );
          }
        } catch (error) {
          console.warn(`Failed to export ${bucketInfo.bucket} for learner ${learnerId}:`, error);
        }
      }
    }

    // Create audit.json (last 180 days, redact other users' emails)
    const sixMonthsAgo = Date.now() - (180 * 24 * 60 * 60 * 1000);
    const auditEntries = statements.getAuditLog.all(requesterEmail, 1000) as Array<{
      at: number;
      email: string;
      action: string;
      meta: string;
    }>;
    
    const filteredAuditEntries = auditEntries
      .filter(entry => entry.at >= sixMonthsAgo)
      .map(entry => ({
        at: entry.at,
        action: entry.action,
        meta: entry.meta ? JSON.parse(entry.meta) : null
      }));

    const audit = {
      exportId: requestId,
      dateRange: { from: sixMonthsAgo, to: Date.now() },
      entries: filteredAuditEntries
    };
    fs.writeFileSync(path.join(exportDir, 'audit.json'), JSON.stringify(audit, null, 2));

    // Create ZIP file
    const zipPath = path.join('.exports', `dsar-${requestId}.zip`);
    await createZipArchive(exportDir, zipPath);

    // Update request status
    statements.updateDsarRequestStatus.run(
      'ready',
      Date.now(),
      null,
      zipPath,
      requestId
    );

    // Log completion
    auditLog(requesterEmail, 'dsar_export_ready', { requestId });

    // Clean up temporary directory
    fs.rmSync(exportDir, { recursive: true, force: true });

  } catch (error) {
    console.error('Export processing failed:', error);
    throw error;
  }
}

// Create ZIP archive
function createZipArchive(sourceDir: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => resolve());
    archive.on('error', (err) => reject(err));

    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}

export default router;