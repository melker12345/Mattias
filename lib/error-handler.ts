import { NextResponse } from 'next/server';
import { logger } from './logger';
import type { PaymentError, FortnoxError, StripeError } from './types/payment';

/**
 * Centralized error handling for the payment system
 */

export interface ErrorContext {
  userId?: string;
  courseId?: string;
  companyId?: string;
  paymentId?: string;
  requestPath?: string;
  userAgent?: string;
  ip?: string;
}

export interface ApiErrorResponse {
  error: string;
  code?: string;
  details?: string;
  timestamp: string;
  requestId?: string;
}

/**
 * Handle API errors and return appropriate responses
 */
export function handleApiError(
  error: unknown,
  context: ErrorContext = {},
  requestId?: string
): NextResponse<ApiErrorResponse> {
  const timestamp = new Date().toISOString();

  // Log the error
  logger.error('API Error occurred', context, error instanceof Error ? error : undefined);

  if (error instanceof PaymentError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        timestamp,
        requestId,
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof StripeError) {
    return NextResponse.json(
      {
        error: 'Payment processing error',
        code: error.code,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        timestamp,
        requestId,
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof FortnoxError) {
    return NextResponse.json(
      {
        error: 'Invoice processing error',
        code: error.code,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        timestamp,
        requestId,
      },
      { status: error.statusCode }
    );
  }

  // Handle Prisma errors
  if (error && typeof error === 'object' && 'code' in error) {
    const prismaError = error as any;
    
    switch (prismaError.code) {
      case 'P2002':
        return NextResponse.json(
          {
            error: 'Resource already exists',
            code: 'DUPLICATE_RESOURCE',
            timestamp,
            requestId,
          },
          { status: 409 }
        );
      
      case 'P2025':
        return NextResponse.json(
          {
            error: 'Resource not found',
            code: 'RESOURCE_NOT_FOUND',
            timestamp,
            requestId,
          },
          { status: 404 }
        );
      
      case 'P2003':
        return NextResponse.json(
          {
            error: 'Invalid reference',
            code: 'INVALID_REFERENCE',
            timestamp,
            requestId,
          },
          { status: 400 }
        );
      
      default:
        logger.error('Database error', context, prismaError);
        return NextResponse.json(
          {
            error: 'Database error',
            code: 'DATABASE_ERROR',
            timestamp,
            requestId,
          },
          { status: 500 }
        );
    }
  }

  // Handle validation errors
  if (error instanceof Error && error.name === 'ValidationError') {
    return NextResponse.json(
      {
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: error.message,
        timestamp,
        requestId,
      },
      { status: 400 }
    );
  }

  // Handle authentication/authorization errors
  if (error instanceof Error && error.message.includes('Unauthorized')) {
    return NextResponse.json(
      {
        error: 'Authentication required',
        code: 'UNAUTHORIZED',
        timestamp,
        requestId,
      },
      { status: 401 }
    );
  }

  if (error instanceof Error && error.message.includes('Forbidden')) {
    return NextResponse.json(
      {
        error: 'Access denied',
        code: 'FORBIDDEN',
        timestamp,
        requestId,
      },
      { status: 403 }
    );
  }

  // Generic error handling
  const message = error instanceof Error ? error.message : 'Unknown error occurred';
  
  logger.error('Unhandled error', context, error instanceof Error ? error : new Error(String(error)));

  return NextResponse.json(
    {
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      details: process.env.NODE_ENV === 'development' ? message : undefined,
      timestamp,
      requestId,
    },
    { status: 500 }
  );
}

/**
 * Async error handler wrapper for API routes
 */
export function withErrorHandler<T extends any[], R>(
  handler: (...args: T) => Promise<R>,
  context: ErrorContext = {}
): (...args: T) => Promise<R | NextResponse<ApiErrorResponse>> {
  return async (...args: T): Promise<R | NextResponse<ApiErrorResponse>> => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleApiError(error, context);
    }
  };
}

/**
 * Retry mechanism for external API calls
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000,
  context: ErrorContext = {}
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxRetries) {
        logger.error(`Operation failed after ${maxRetries} attempts`, {
          ...context,
          attempt,
          maxRetries,
        }, lastError);
        break;
      }

      logger.warn(`Operation failed, retrying (${attempt}/${maxRetries})`, {
        ...context,
        attempt,
        nextRetryInMs: delayMs * attempt,
      }, lastError);

      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
    }
  }

  throw lastError!;
}

/**
 * Circuit breaker pattern for external services
 */
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private threshold: number = 5,
    private timeout: number = 60000 // 1 minute
  ) {}

  async execute<T>(
    operation: () => Promise<T>,
    context: ErrorContext = {}
  ): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime < this.timeout) {
        throw new Error('Circuit breaker is OPEN');
      } else {
        this.state = 'HALF_OPEN';
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(context, error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure(context: ErrorContext, error: Error): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
      logger.error('Circuit breaker opened', {
        ...context,
        failures: this.failures,
        threshold: this.threshold,
      }, error);
    }
  }

  getState(): string {
    return this.state;
  }
}

// Export circuit breakers for external services
export const stripeCircuitBreaker = new CircuitBreaker(5, 60000);
export const fortnoxCircuitBreaker = new CircuitBreaker(3, 120000);

/**
 * Health check utilities
 */
export async function checkServiceHealth(): Promise<{
  stripe: boolean;
  fortnox: boolean;
  database: boolean;
}> {
  const results = {
    stripe: false,
    fortnox: false,
    database: false,
  };

  // Check Stripe
  try {
    const { stripe } = await import('./stripe');
    await stripe.balance.retrieve();
    results.stripe = true;
  } catch (error) {
    logger.error('Stripe health check failed', {}, error instanceof Error ? error : undefined);
  }

  // Check Fortnox
  try {
    const { fortnox } = await import('./fortnox');
    results.fortnox = await fortnox.testConnection();
  } catch (error) {
    logger.error('Fortnox health check failed', {}, error instanceof Error ? error : undefined);
  }

  // Check Database
  try {
    const { prisma } = await import('./prisma');
    await prisma.$queryRaw`SELECT 1`;
    results.database = true;
  } catch (error) {
    logger.error('Database health check failed', {}, error instanceof Error ? error : undefined);
  }

  return results;
}

/**
 * Graceful shutdown handler
 */
export async function gracefulShutdown(): Promise<void> {
  logger.info('Starting graceful shutdown');

  try {
    // Close database connections
    const { prisma } = await import('./prisma');
    await prisma.$disconnect();
    logger.info('Database connections closed');
  } catch (error) {
    logger.error('Error closing database connections', {}, error instanceof Error ? error : undefined);
  }

  logger.info('Graceful shutdown completed');
}
