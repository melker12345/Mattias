/**
 * Centralized logging utility for the payment system
 */

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

interface LogContext {
  userId?: string;
  courseId?: string;
  companyId?: string;
  paymentId?: string;
  fortnoxInvoiceId?: string;
  requestId?: string;
  userAgent?: string;
  ip?: string;
  [key: string]: any;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isTest = process.env.NODE_ENV === 'test';

  private formatLog(level: LogLevel, message: string, context?: LogContext, error?: Error): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
    };

    if (context) {
      entry.context = context;
    }

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: this.isDevelopment ? error.stack : undefined,
        code: (error as any).code || undefined,
      };
    }

    return entry;
  }

  private writeLog(entry: LogEntry): void {
    // In test environment, suppress logs unless explicitly enabled
    if (this.isTest && !process.env.ENABLE_TEST_LOGS) {
      return;
    }

    const logString = this.isDevelopment 
      ? JSON.stringify(entry, null, 2)
      : JSON.stringify(entry);

    switch (entry.level) {
      case LogLevel.ERROR:
        console.error(logString);
        break;
      case LogLevel.WARN:
        console.warn(logString);
        break;
      case LogLevel.INFO:
        console.info(logString);
        break;
      case LogLevel.DEBUG:
        if (this.isDevelopment) {
          console.debug(logString);
        }
        break;
    }

    // In production, you might want to send logs to external service
    // this.sendToExternalLogger(entry);
  }

  error(message: string, context?: LogContext, error?: Error): void {
    const entry = this.formatLog(LogLevel.ERROR, message, context, error);
    this.writeLog(entry);
  }

  warn(message: string, context?: LogContext): void {
    const entry = this.formatLog(LogLevel.WARN, message, context);
    this.writeLog(entry);
  }

  info(message: string, context?: LogContext): void {
    const entry = this.formatLog(LogLevel.INFO, message, context);
    this.writeLog(entry);
  }

  debug(message: string, context?: LogContext): void {
    const entry = this.formatLog(LogLevel.DEBUG, message, context);
    this.writeLog(entry);
  }

  // Payment-specific logging methods
  paymentStarted(context: LogContext): void {
    this.info('Payment process started', context);
  }

  paymentSucceeded(context: LogContext): void {
    this.info('Payment completed successfully', context);
  }

  paymentFailed(context: LogContext, error?: Error): void {
    this.error('Payment failed', context, error);
  }

  fortnoxSyncStarted(context: LogContext): void {
    this.info('Fortnox synchronization started', context);
  }

  fortnoxSyncCompleted(context: LogContext): void {
    this.info('Fortnox synchronization completed', context);
  }

  fortnoxSyncFailed(context: LogContext, error?: Error): void {
    this.error('Fortnox synchronization failed', context, error);
  }

  webhookReceived(eventType: string, context: LogContext): void {
    this.info(`Webhook received: ${eventType}`, context);
  }

  webhookProcessed(eventType: string, context: LogContext): void {
    this.info(`Webhook processed successfully: ${eventType}`, context);
  }

  webhookFailed(eventType: string, context: LogContext, error?: Error): void {
    this.error(`Webhook processing failed: ${eventType}`, context, error);
  }

  enrollmentCreated(context: LogContext): void {
    this.info('Course enrollment created', context);
  }

  enrollmentUpdated(context: LogContext): void {
    this.info('Course enrollment updated', context);
  }

  accessGranted(context: LogContext): void {
    this.info('Course access granted', context);
  }

  accessDenied(context: LogContext, reason: string): void {
    this.warn(`Course access denied: ${reason}`, context);
  }

  // Security logging
  suspiciousActivity(message: string, context: LogContext): void {
    this.warn(`SECURITY: ${message}`, context);
  }

  authenticationFailed(context: LogContext): void {
    this.warn('Authentication failed', context);
  }

  unauthorizedAccess(context: LogContext): void {
    this.warn('Unauthorized access attempt', context);
  }
}

// Export singleton instance
export const logger = new Logger();

// Utility functions for common logging patterns
export function withRequestContext(req: Request): LogContext {
  return {
    requestId: req.headers.get('x-request-id') || undefined,
    userAgent: req.headers.get('user-agent') || undefined,
    ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
  };
}

export function withUserContext(userId: string, email?: string): LogContext {
  return {
    userId,
    userEmail: email,
  };
}

export function withPaymentContext(
  paymentId: string, 
  amount: number, 
  currency: string
): LogContext {
  return {
    paymentId,
    paymentAmount: amount,
    paymentCurrency: currency,
  };
}

export function withCourseContext(courseId: string, courseName?: string): LogContext {
  return {
    courseId,
    courseName,
  };
}

export function withCompanyContext(companyId: string, companyName?: string): LogContext {
  return {
    companyId,
    companyName,
  };
}
