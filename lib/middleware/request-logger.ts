// =============================================================================
// Request Logger Middleware (HOF)
// =============================================================================
// Higher-order function that wraps API route handlers with structured
// request/response logging and error tracking.
//
// Usage:
//   export const GET = withRequestLogging(handler)
//   export const POST = withRequestLogging(handler)
//
// Features:
//   - Generates unique X-Request-Id per request
//   - Logs method, path, status, duration with user context
//   - Warns on slow requests (>1000ms)
//   - Tracks 5xx errors via error tracking system
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { auth } from '@clerk/nextjs/server';
import { createRequestLogger, logger } from '@/lib/logger';
import { trackError } from '@/lib/error-tracking';

const SLOW_REQUEST_THRESHOLD_MS = 1000;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RouteHandler = (req: any, context?: any) => Promise<NextResponse>;

/**
 * Wrap an API route handler with structured request logging.
 */
export function withRequestLogging(handler: RouteHandler) {
  return async (
    req: any,
    context?: any
  ): Promise<NextResponse> => {
    const requestId = `req_${randomBytes(8).toString('hex')}`;
    const startTime = Date.now();
    const method = req.method;
    const path = new URL(req.url).pathname;

    // Try to get userId for logging context
    let userId: string | undefined;
    try {
      const authResult = await auth();
      userId = authResult.userId || undefined;
    } catch {
      // Auth may fail for public routes — that's fine
    }

    // Create request-scoped logger
    const reqLog = createRequestLogger(requestId, userId);

    reqLog.info(`${method} ${path}`, { method, path });

    try {
      const response = await handler(req, context);
      const duration = Date.now() - startTime;
      const status = response.status;

      // Clone response to add X-Request-Id header.
      // For streaming responses (SSE), we can't read the body, so clone directly.
      const isStreaming = response.headers.get('content-type')?.includes('text/event-stream');
      const loggedResponse = isStreaming
        ? new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
          })
        : NextResponse.json(
            await response.clone().json().catch(() => null),
            {
              status: response.status,
              statusText: response.statusText,
              headers: response.headers,
            }
          );

      loggedResponse.headers.set('X-Request-Id', requestId);

      // Log the response
      if (duration > SLOW_REQUEST_THRESHOLD_MS) {
        reqLog.warn(`${method} ${path} ${status} (${duration}ms) SLOW`, {
          method,
          path,
          status,
          duration,
        });
      } else {
        reqLog.info(`${method} ${path} ${status} (${duration}ms)`, {
          method,
          path,
          status,
          duration,
        });
      }

      // Track server errors
      if (status >= 500) {
        trackError(
          new Error(`${method} ${path} returned ${status}`),
          { userId, requestId, route: path, method, statusCode: status }
        );
      }

      return loggedResponse as NextResponse;
    } catch (err) {
      const duration = Date.now() - startTime;

      reqLog.error(`${method} ${path} threw after ${duration}ms`, {
        method,
        path,
        duration,
      }, err as Error);

      // Track unhandled errors
      trackError(err as Error, {
        userId,
        requestId,
        route: path,
        method,
      });

      // Re-throw so the framework's error handling can take over
      throw err;
    }
  };
}
