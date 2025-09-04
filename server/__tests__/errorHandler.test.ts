/**
 * Unit tests for error handling middleware
 */
import { Request, Response, NextFunction } from 'express';
import { errorHandler, AppError, ValidationError, NotFoundError, asyncHandler } from '../middleware/errorHandler';

describe('Error Handler Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let mockLogger: any;

  beforeEach(() => {
    mockLogger = {
      error: jest.fn(),
      warn: jest.fn(),
    };

    mockReq = {
      reqId: 'test-request-123',
      path: '/api/test',
      method: 'POST',
      query: {},
      body: { test: 'data' },
      logger: mockLogger,
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  describe('errorHandler', () => {
    it('should handle AppError correctly', () => {
      const error = new AppError(400, 'CUSTOM_ERROR', 'Custom error message');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'CUSTOM_ERROR',
          message: 'Custom error message',
          requestId: 'test-request-123',
        },
      });
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it('should handle ValidationError with details', () => {
      const details = [{ field: 'email', message: 'Invalid email format' }];
      const error = new ValidationError('Validation failed', details);

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details,
          requestId: 'test-request-123',
        },
      });
    });

    it('should handle unknown errors as internal server error', () => {
      const error = new Error('Unknown error');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
          requestId: 'test-request-123',
        },
      });
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Unhandled server error',
        error,
        expect.any(Object)
      );
    });

    it('should handle JSON syntax errors', () => {
      const error = new SyntaxError('Unexpected token } in JSON at position 15');
      error.name = 'SyntaxError';

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'INVALID_JSON',
          message: 'Invalid JSON in request body',
          requestId: 'test-request-123',
        },
      });
    });

    it('should use fallback logger when request logger is not available', () => {
      delete mockReq.logger;
      const error = new AppError(400, 'TEST_ERROR', 'Test message');

      // Should not throw when logger is missing
      expect(() => {
        errorHandler(error, mockReq as Request, mockRes as Response, mockNext);
      }).not.toThrow();

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('asyncHandler', () => {
    it('should handle successful async operations', async () => {
      const handler = asyncHandler(async (req, res) => {
        res.json({ success: true });
      });

      await handler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({ success: true });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should catch and forward async errors', async () => {
      const error = new Error('Async error');
      const handler = asyncHandler(async () => {
        throw error;
      });

      await handler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should handle rejected promises', async () => {
      const error = new ValidationError('Validation failed');
      const handler = asyncHandler(async () => {
        return Promise.reject(error);
      });

      await handler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('Custom Error Classes', () => {
    it('should create AppError with correct properties', () => {
      const error = new AppError(404, 'NOT_FOUND', 'Resource not found');

      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
      expect(error.message).toBe('Resource not found');
      expect(error.isOperational).toBe(true);
      expect(error.name).toBe('AppError');
    });

    it('should create ValidationError with details', () => {
      const details = { field: 'email' };
      const error = new ValidationError('Invalid data', details);

      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.details).toBe(details);
    });

    it('should create NotFoundError with default message', () => {
      const error = new NotFoundError();

      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
      expect(error.message).toBe('Resource not found');
    });
  });
});