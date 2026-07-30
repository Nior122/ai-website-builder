// =============================================================================
// API Response Utilities
// =============================================================================
// Standardized response builders for all API routes and Server Actions.
// Ensures consistent response format across the entire application.
// =============================================================================

import { NextResponse } from 'next/server';
import { AppError, buildErrorResponse } from '@/lib/errors';
import { randomBytes } from 'crypto';
import { logger } from '@/lib/logger';

// ─────────────────────────────────────────────────────────────────────────────
// REQUEST ID GENERATOR
// ─────────────────────────────────────────────────────────────────────────────

export function generateRequestId(): string {
  return `req_${randomBytes(8).toString('hex')}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// SUCCESS RESPONSES
// ─────────────────────────────────────────────────────────────────────────────

export interface SuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    hasMore?: boolean;
  };
}

/**
 * 200 OK with data
 */
export function ok<T>(data: T, status = 200): NextResponse<SuccessResponse<T>> {
  return NextResponse.json(
    { success: true as const, data },
    { status }
  );
}

/**
 * 200 OK with paginated data
 */
export function okPaginated<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): NextResponse<SuccessResponse<T[]>> {
  return NextResponse.json(
    {
      success: true as const,
      data,
      meta: {
        page,
        limit,
        total,
        hasMore: page * limit < total,
      },
    },
    { status: 200 }
  );
}

/**
 * 201 Created
 */
export function created<T>(data: T): NextResponse<SuccessResponse<T>> {
  return NextResponse.json(
    { success: true as const, data },
    { status: 201 }
  );
}

/**
 * 204 No Content
 */
export function noContent(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

// ─────────────────────────────────────────────────────────────────────────────
// ERROR RESPONSES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build an error response from any error type
 */
export function errorResponse(
  err: Error | AppError,
  requestId?: string
): NextResponse {
  const response = buildErrorResponse(err, requestId);

  if (err instanceof AppError) {
    return NextResponse.json(response, { status: err.statusCode });
  }

  return NextResponse.json(response, { status: 500 });
}

/**
 * 400 Bad Request
 */
export function badRequest(message: string, details?: unknown): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'BAD_REQUEST',
        message,
        details,
        timestamp: new Date().toISOString(),
      },
    },
    { status: 400 }
  );
}

/**
 * 401 Unauthorized
 */
export function unauthorized(message = 'Authentication required'): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message,
        timestamp: new Date().toISOString(),
      },
    },
    { status: 401 }
  );
}

/**
 * 403 Forbidden
 */
export function forbidden(message = 'Access denied'): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'FORBIDDEN',
        message,
        timestamp: new Date().toISOString(),
      },
    },
    { status: 403 }
  );
}

/**
 * 404 Not Found
 */
export function notFound(resource: string): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `${resource} not found`,
        timestamp: new Date().toISOString(),
      },
    },
    { status: 404 }
  );
}

/**
 * 429 Too Many Requests
 */
export function tooManyRequests(retryAfterMs: number): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: `Rate limit exceeded. Try again in ${Math.ceil(retryAfterMs / 1000)}s.`,
        timestamp: new Date().toISOString(),
      },
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(Math.ceil(retryAfterMs / 1000)),
        'X-RateLimit-Retry-After': String(retryAfterMs),
      },
    }
  );
}

/**
 * 500 Internal Server Error
 */
export function internalError(message = 'An unexpected error occurred'): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message,
        timestamp: new Date().toISOString(),
      },
    },
    { status: 500 }
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STREAMING RESPONSES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a streaming response for AI generation
 */
export function streamingResponse(
  stream: ReadableStream,
  requestId: string
): Response {
  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Request-Id': requestId,
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// SERVER ACTION RESPONSES
// ─────────────────────────────────────────────────────────────────────────────

export type ServerActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code: string };

/**
 * Wrap a Server Action with consistent error handling
 */
export async function actionHandler<T>(
  action: () => Promise<T>
): Promise<ServerActionResult<T>> {
  try {
    const data = await action();
    return { success: true, data };
  } catch (error) {
    if (error instanceof AppError) {
      return {
        success: false,
        error: error.message,
        code: error.code,
      };
    }

    logger.error('Server Action error', { error: String(error) });
    return {
      success: false,
      error: 'An unexpected error occurred',
      code: 'INTERNAL_ERROR',
    };
  }
}
