# LearnOz Observability System

## Overview

LearnOz now includes a comprehensive observability system with structured logging, request tracking, error handling, and SLO metrics. This system provides real-time insights into application performance and health.

## Key Features

### ✅ Structured Logging
- **Pino-based logger** with JSON output for production, pretty formatting for development
- **Request IDs** (UUID v4) for tracing requests across the system
- **Contextual logging** with user, route, and operation metadata
- **Specialized log methods** for auth, sync, metrics, and error events
- **Performance logging** with request timing and duration tracking

### ✅ Request Tracking
- **Automatic request ID generation** for every HTTP request
- **Request timing middleware** measuring end-to-end latency
- **User context injection** for authenticated requests
- **Request/response logging** with sanitized sensitive data

### ✅ Error Handling
- **Global error handler** with structured error responses
- **Custom error classes** (AppError, ValidationError, NotFoundError, etc.)
- **Sanitized error responses** to prevent information leakage
- **Request ID inclusion** in error responses for debugging
- **Async error wrapper** for clean promise handling

### ✅ SLO Metrics
- **Rolling window metrics** for tracking SLOs (Service Level Objectives)
- **95th percentile latency tracking** for critical endpoints
- **Sync batch endpoint monitoring** with performance thresholds
- **Admin metrics dashboard** for real-time performance monitoring

### ✅ Client-Side Error Display
- **CloudSyncErrorDisplay component** for user-friendly error messages
- **Error categorization** with retry/action-required classification
- **Auto-dismissal** for transient errors (rate limits)
- **Technical details** expansion for debugging

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   HTTP Request  │    │  Request Tracking│    │  Route Handler  │
│                 │ -> │  - Request ID    │ -> │  - Business     │
│                 │    │  - Start Time    │    │    Logic        │
└─────────────────┘    │  - User Context  │    └─────────────────┘
                       └──────────────────┘             │
                                │                       │
                                v                       v
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Error Handler  │    │ Structured Logger│    │   SLO Tracker   │
│  - Sanitize     │ <- │  - JSON Format   │ <- │  - Percentiles  │
│  - Request ID   │    │  - Context Rich  │    │  - Windows      │
│  - Stack Trace  │    │  - Performance   │    │  - Metrics      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Usage Examples

### Server-Side Logging

```typescript
import { log } from './log';

// Basic logging with context
const logger = log.child({ userId: 'user123', feature: 'sync' });
logger.info('Starting sync operation', { batchSize: 25 });

// Request-scoped logging (automatic via middleware)
req.logger.sync('batch_sync', recordCount, duration, { learnerId });

// Error logging with structured data
req.logger.error('Database connection failed', error, { 
  query: 'SELECT * FROM users',
  retryAttempt: 3 
});
```

### Client-Side Error Display

```typescript
import { CloudSyncErrorDisplay, useSyncErrors } from '@/components/CloudSyncErrorDisplay';

function SyncDashboard() {
  const { errors, addError, retryError, dismissError } = useSyncErrors();

  const handleSyncError = (error: any) => {
    addError({
      code: error.code || 'INTERNAL_ERROR',
      message: error.message,
      details: error.details,
      requestId: error.requestId,
    });
  };

  return (
    <div>
      <CloudSyncErrorDisplay
        errors={errors}
        onRetry={retryError}
        onDismiss={dismissError}
      />
    </div>
  );
}
```

### SLO Monitoring

```typescript
import { trackSLO } from './metrics/slo';

// Add SLO tracking to critical endpoints
router.post('/api/sync/batch', 
  trackSLO('sync_batch_latency'),
  rateLimitMiddleware,
  authMiddleware,
  asyncHandler(syncBatchHandler)
);
```

## Monitoring Endpoints

### Health Check
```
GET /health
```
Returns basic system health and uptime.

### Admin Metrics (Development Only)
```
GET /admin/metrics
```
Returns comprehensive metrics including:
- System information (uptime, memory, Node.js version)
- SLO metrics with percentiles
- Feature configuration status

## Log Format

All logs follow a structured JSON format:

```json
{
  "level": "info",
  "time": "2025-09-04T05:05:07.161Z",
  "msg": "SYNC: batch_sync",
  "reqId": "66cc9c09-c683-483f-be8e-119b0e608572",
  "route": "/api/sync/batch",
  "method": "POST",
  "userId": "user123",
  "learnerId": "learner456",
  "totalItems": 1,
  "sync": {
    "operation": "batch_sync",
    "recordCount": 1,
    "duration": 101.70847
  },
  "event": "sync"
}
```

## Performance Monitoring

The system automatically tracks:
- **Request latency** (95th percentile)
- **Error rates** by status code
- **Sync operation performance**
- **Authentication timing**
- **Question generation latency**

## Security Features

- **Sanitized error responses** in production
- **Request ID correlation** without exposing sensitive data
- **Admin endpoint protection** (development only)
- **User context isolation** in multi-tenant scenarios

## Development vs Production

### Development
- Pretty-printed logs with colors
- Admin metrics endpoint enabled
- Detailed error stack traces
- Request body logging

### Production
- JSON structured logs
- Admin endpoints disabled
- Sanitized error messages
- Minimal performance overhead

## Testing

Unit tests are provided for:
- Structured logging functionality
- Error handling middleware
- SLO metrics calculation
- Request tracking accuracy

Run tests with:
```bash
npm test
```

## Benefits

1. **Improved Debugging**: Request IDs and structured logs make issue tracking straightforward
2. **Performance Insights**: SLO metrics help identify performance bottlenecks
3. **User Experience**: Client-side error display provides clear, actionable feedback
4. **Operational Visibility**: Real-time metrics enable proactive monitoring
5. **Security**: Sanitized error responses prevent information leakage
6. **Scalability**: Low-overhead logging suitable for high-traffic environments

The observability system provides a solid foundation for monitoring LearnOz in production while maintaining excellent developer experience during development.