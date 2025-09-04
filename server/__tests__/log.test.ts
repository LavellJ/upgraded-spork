/**
 * Unit tests for structured logging
 */
import { StructuredLogger } from '../log';

// Mock pino
jest.mock('pino', () => {
  const mockLogger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
  
  return jest.fn(() => mockLogger);
});

describe('StructuredLogger', () => {
  let logger: StructuredLogger;
  let mockPino: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Get the mock pino instance
    const pino = require('pino');
    mockPino = pino();
    
    logger = new StructuredLogger();
  });

  describe('basic logging', () => {
    it('should log info messages with context', () => {
      const message = 'Test message';
      const context = { reqId: 'test-123', route: '/api/test' };
      
      logger.info(message, context);
      
      expect(mockPino.info).toHaveBeenCalledWith(context, message);
    });

    it('should log error messages with stack trace', () => {
      const message = 'Test error';
      const error = new Error('Test error details');
      const context = { reqId: 'test-123' };
      
      logger.error(message, error, context);
      
      expect(mockPino.error).toHaveBeenCalledWith(
        expect.objectContaining({
          ...context,
          error: {
            message: error.message,
            stack: error.stack,
            name: error.name,
          },
        }),
        message
      );
    });
  });

  describe('child logger', () => {
    it('should create child logger with inherited context', () => {
      const parentContext = { reqId: 'parent-123' };
      const childContext = { userId: 'user-456' };
      
      const parentLogger = new StructuredLogger(parentContext);
      const childLogger = parentLogger.child(childContext);
      
      childLogger.info('Child message');
      
      expect(mockPino.info).toHaveBeenCalledWith(
        { ...parentContext, ...childContext },
        'Child message'
      );
    });
  });

  describe('request logging', () => {
    it('should log request start with proper event type', () => {
      const method = 'POST';
      const route = '/api/sync/batch';
      const context = { reqId: 'req-123', userAgent: 'test-agent' };
      
      logger.requestStart(method, route, context);
      
      expect(mockPino.info).toHaveBeenCalledWith(
        expect.objectContaining({
          ...context,
          method,
          route,
          event: 'request_start',
        }),
        `${method} ${route} - START`
      );
    });

    it('should log request end with duration and status', () => {
      const method = 'POST';
      const route = '/api/sync/batch';
      const statusCode = 200;
      const duration = 150;
      
      logger.requestEnd(method, route, statusCode, duration);
      
      expect(mockPino.info).toHaveBeenCalledWith(
        expect.objectContaining({
          method,
          route,
          statusCode,
          duration,
          event: 'request_end',
        }),
        `${method} ${route} - ${statusCode} (${duration}ms)`
      );
    });

    it('should log server errors with error level', () => {
      const method = 'POST';
      const route = '/api/sync/batch';
      const statusCode = 500;
      const duration = 50;
      
      logger.requestEnd(method, route, statusCode, duration);
      
      expect(mockPino.error).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode }),
        expect.stringContaining('500')
      );
    });
  });

  describe('specialized logging methods', () => {
    it('should log authentication events', () => {
      const event = 'login';
      const userEmail = 'test@example.com';
      const success = true;
      
      logger.auth(event, userEmail, success);
      
      expect(mockPino.info).toHaveBeenCalledWith(
        expect.objectContaining({
          userEmail,
          auth: { event, success },
          event: 'auth',
        }),
        expect.stringContaining('SUCCESS')
      );
    });

    it('should log sync operations', () => {
      const operation = 'batch_sync';
      const recordCount = 25;
      const duration = 120;
      
      logger.sync(operation, recordCount, duration);
      
      expect(mockPino.info).toHaveBeenCalledWith(
        expect.objectContaining({
          sync: { operation, recordCount, duration },
          event: 'sync',
        }),
        `SYNC: ${operation}`
      );
    });

    it('should log metrics', () => {
      const name = 'api_latency';
      const value = 95;
      const unit = 'ms';
      
      logger.metric(name, value, unit);
      
      expect(mockPino.info).toHaveBeenCalledWith(
        expect.objectContaining({
          metric: { name, value, unit },
          event: 'metric',
        }),
        `METRIC: ${name}`
      );
    });
  });
});