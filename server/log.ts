/**
 * Structured logging with request tracking and performance monitoring
 */
import pino from 'pino';
import { getConfig } from './config';

const config = getConfig();

// Create pino logger with development-friendly formatting
const logger = pino({
  level: config.NODE_ENV === 'development' ? 'debug' : 'info',
  formatters: {
    level: (level) => ({ level }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  ...(config.NODE_ENV === 'development' && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss.l',
        ignore: 'pid,hostname',
      },
    },
  }),
});

export interface LogContext {
  reqId?: string;
  route?: string;
  userEmail?: string;
  userId?: string;
  duration?: number;
  statusCode?: number;
  method?: string;
  feedbackId?: string;
  kind?: string;
  textLength?: number;
  hasEmail?: boolean;
  userAgent?: string;
  classActive?: boolean;
  timestamp?: string;
}

/**
 * Structured logger with consistent field formatting
 */
export class StructuredLogger {
  private baseContext: LogContext;

  constructor(context: LogContext = {}) {
    this.baseContext = context;
  }

  /**
   * Create a child logger with additional context
   */
  child(context: LogContext): StructuredLogger {
    return new StructuredLogger({ ...this.baseContext, ...context });
  }

  /**
   * Log debug message
   */
  debug(msg: string, context: LogContext = {}) {
    logger.debug({ ...this.baseContext, ...context }, msg);
  }

  /**
   * Log info message
   */
  info(msg: string, context: LogContext = {}) {
    logger.info({ ...this.baseContext, ...context }, msg);
  }

  /**
   * Log warning message
   */
  warn(msg: string, context: LogContext = {}) {
    logger.warn({ ...this.baseContext, ...context }, msg);
  }

  /**
   * Log error message with stack trace
   */
  error(msg: string, error?: Error, context: LogContext = {}) {
    const errorContext = error ? {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
    } : {};
    
    logger.error({ ...this.baseContext, ...context, ...errorContext }, msg);
  }

  /**
   * Log request start
   */
  requestStart(method: string, route: string, context: LogContext = {}) {
    this.info(`${method} ${route} - START`, {
      ...context,
      method,
      route,
      event: 'request_start',
    });
  }

  /**
   * Log request completion
   */
  requestEnd(method: string, route: string, statusCode: number, duration: number, context: LogContext = {}) {
    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    
    logger[level]({
      ...this.baseContext,
      ...context,
      method,
      route,
      statusCode,
      duration,
      event: 'request_end',
    }, `${method} ${route} - ${statusCode} (${duration}ms)`);
  }

  /**
   * Log performance metric
   */
  metric(name: string, value: number, unit: string = 'ms', context: LogContext = {}) {
    this.info(`METRIC: ${name}`, {
      ...context,
      metric: {
        name,
        value,
        unit,
      },
      event: 'metric',
    });
  }

  /**
   * Log authentication events
   */
  auth(event: string, userEmail: string, success: boolean, context: LogContext = {}) {
    const level = success ? 'info' : 'warn';
    logger[level]({
      ...this.baseContext,
      ...context,
      userEmail,
      auth: {
        event,
        success,
      },
      event: 'auth',
    }, `AUTH: ${event} - ${success ? 'SUCCESS' : 'FAILED'} - ${userEmail}`);
  }

  /**
   * Log sync operations
   */
  sync(operation: string, recordCount: number, duration: number, context: LogContext = {}) {
    this.info(`SYNC: ${operation}`, {
      ...context,
      sync: {
        operation,
        recordCount,
        duration,
      },
      event: 'sync',
    });
  }
}

// Export default logger instance
export const log = new StructuredLogger();

// Export raw pino logger for advanced use cases
export { logger as rawLogger };