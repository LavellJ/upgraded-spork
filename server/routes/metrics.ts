/**
 * Metrics and observability endpoints
 */
import { Router } from 'express';
import { sloRegistry } from '../metrics/slo';
import { getConfig, getDerivedConfig } from '../config';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const config = getConfig();
const derived = getDerivedConfig(config);

/**
 * Admin metrics endpoint - only available in development
 */
router.get('/admin/metrics', asyncHandler(async (req, res) => {
  // Only available in development or for admin users
  if (!derived.IS_DEVELOPMENT) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Endpoint not found' } });
  }

  const metrics = sloRegistry.getAllMetrics();
  
  // Add system information
  const systemMetrics = {
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    platform: process.platform,
    nodeVersion: process.version,
    timestamp: new Date().toISOString(),
  };

  res.json({
    ok: true,
    system: systemMetrics,
    slo: metrics,
    config: {
      environment: config.NODE_ENV,
      features: {
        email: !!(config.SMTP_HOST && config.SMTP_USER && config.SMTP_PASS),
        openai: !!config.OPENAI_API_KEY,
        elevenlabs: !!config.ELEVENLABS_API_KEY,
        encryption: config.ENCRYPTION_ENABLED,
      },
    },
  });
}));

/**
 * Health check endpoint
 */
router.get('/health', asyncHandler(async (req, res) => {
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();
  
  const health = {
    status: 'healthy',
    uptime: Math.floor(uptime),
    memory: {
      used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
    },
    timestamp: new Date().toISOString(),
  };

  res.json(health);
}));

export { router as metricsRouter };