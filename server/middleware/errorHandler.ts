/**
 * Global error handling middleware with structured logging and sanitized responses
 */
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { log } from '../log';
import { getConfig } from '../config';

const config = getConfig();

// Error types for consistent handling
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public isOperational = true
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public details?: any) {
    super(400, 'VALIDATION_ERROR', message);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(401, 'AUTH_ERROR', message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(403, 'AUTHORIZATION_ERROR', message);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(404, 'NOT_FOUND', message);
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(429, 'RATE_LIMIT', message);
    this.name = 'RateLimitError';
  }
}

/**
 * Error response interface for consistent client responses
 */
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
    requestId?: string;
  };
}

/**
 * Convert errors to sanitized responses
 */
function formatErrorResponse(error: Error, reqId?: string): { statusCode: number; response: ErrorResponse } {
  let statusCode = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'An unexpected error occurred';
  let details: any = undefined;

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    code = error.code;
    message = error.message;
    if (error instanceof ValidationError) {
      details = error.details;
    }
  } else if (error instanceof ZodError) {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Invalid request data';
    details = error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
    }));
  } else if (error.name === 'SyntaxError' && error.message.includes('JSON')) {
    statusCode = 400;
    code = 'INVALID_JSON';
    message = 'Invalid JSON in request body';
  } else if (error.name === 'MulterError') {
    statusCode = 400;
    code = 'FILE_UPLOAD_ERROR';
    message = 'File upload error';
  }

  return {
    statusCode,
    response: {
      error: {
        code,
        message,
        ...(details && { details }),
        ...(reqId && { requestId: reqId }),
      },
    },
  };
}

/**
 * Global error handling middleware
 */
export function errorHandler(error: Error, req: Request, res: Response, next: NextFunction) {
  // Use request logger if available, otherwise use default logger
  const logger = req.logger || log;

  // Format error response
  const { statusCode, response } = formatErrorResponse(error, req.reqId);

  // Log error with context
  if (statusCode >= 500) {
    // Server errors - log with full stack trace
    logger.error('Unhandled server error', error, {
      statusCode,
      path: req.path,
      method: req.method,
      query: req.query,
      body: config.NODE_ENV === 'development' ? req.body : '[REDACTED]',
    });
  } else if (statusCode >= 400) {
    // Client errors - log as warning
    logger.warn('Client error', error, {
      statusCode,
      path: req.path,
      method: req.method,
    });
  }

  // Send sanitized error response
  res.status(statusCode).json(response);
}

/**
 * Async error wrapper for route handlers
 */
export function asyncHandler<T extends Request, U extends Response>(
  fn: (req: T, res: U, next: NextFunction) => Promise<any>
) {
  return (req: T, res: U, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * 404 handler for unmatched routes
 */
export function notFoundHandler(req: Request, res: Response, next: NextFunction) {
  next(new NotFoundError(`Route ${req.method} ${req.path} not found`));
}