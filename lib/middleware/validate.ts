// =============================================================================
// Request Validation Middleware
// =============================================================================
// Higher-order function that validates incoming request body, query params,
// or route params against a Zod schema before passing control to the handler.
//
// Usage:
//   export const POST = withValidation(
//     async (request, { body }) => {
//       // body is validated and typed
//       return ok(body);
//     },
//     { body: createProjectSchema }
//   );
//
//   // Or validate query params:
//   export const GET = withValidation(
//     async (request, { query }) => { ... },
//     { query: listSchema }
//   );
// =============================================================================

import { type NextRequest, NextResponse } from 'next/server';
import { type ZodSchema, ZodError } from 'zod';
import { badRequest } from '@/lib/api-response';
import { logger } from '@/lib/logger';

// ─── Types ───────────────────────────────────────────────────────────────

interface ValidationSchemas {
  /** Schema to validate the parsed JSON body */
  body?: ZodSchema;
  /** Schema to validate URL search params */
  query?: ZodSchema;
  /** Schema to validate route params (e.g., { id: string }) */
  params?: ZodSchema;
}

interface ValidatedContext<B = unknown, Q = unknown, P = Record<string, string>> {
  /** Parsed and validated request body (if body schema provided) */
  body: B;
  /** Parsed and validated query params (if query schema provided) */
  query: Q;
  /** Parsed and validated route params (if params schema provided) */
  params: P;
}

type RouteHandler = (
  request: NextRequest,
  context?: { params: Promise<Record<string, string>> }
) => Promise<NextResponse>;

// ─── Error Formatting ────────────────────────────────────────────────────

function formatZodError(error: ZodError): { message: string; details: Record<string, string[]> } {
  const details: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const path = issue.path.join('.') || 'root';
    if (!details[path]) details[path] = [];
    details[path].push(issue.message);
  }

  return {
    message: `Validation failed: ${error.issues.length} error(s)`,
    details,
  };
}

// ─── Middleware ───────────────────────────────────────────────────────────

/**
 * Wraps an API route handler with Zod validation for body, query, and/or params.
 *
 * Validated data is passed as the second argument to the handler:
 *   async (request, { body, query, params }) => { ... }
 *
 * Returns 400 with structured error details on validation failure.
 */
export function withValidation(
  handler: (request: NextRequest, context: ValidatedContext & { params: Record<string, string> }) => Promise<NextResponse>,
  schemas: ValidationSchemas
) {
  return async (
    request: NextRequest,
    routeContext?: { params: Promise<Record<string, string>> }
  ): Promise<NextResponse> => {
    try {
      const validated: ValidatedContext = {
        body: undefined,
        query: undefined,
        params: {},
      };

      // ── Validate body ──────────────────────────────────────────────────
      if (schemas.body) {
        let rawBody: unknown;
        try {
          rawBody = await request.json();
        } catch {
          return badRequest('Invalid JSON in request body');
        }
        validated.body = schemas.body.parse(rawBody);
      }

      // ── Validate query params ──────────────────────────────────────────
      if (schemas.query) {
        const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
        validated.query = schemas.query.parse(searchParams);
      }

      // ── Validate route params ──────────────────────────────────────────
      if (schemas.params && routeContext?.params) {
        const rawParams = await routeContext.params;
        validated.params = schemas.params.parse(rawParams);
      } else if (routeContext?.params) {
        validated.params = await routeContext.params;
      }

      return handler(request, {
        ...validated,
        params: validated.params as Record<string, string>,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const { message, details } = formatZodError(error);
        logger.warn('Request validation failed', {
          path: request.nextUrl.pathname,
          method: request.method,
          errors: details,
        });
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message,
              details,
            },
          },
          { status: 400 }
        );
      }
      throw error;
    }
  };
}
