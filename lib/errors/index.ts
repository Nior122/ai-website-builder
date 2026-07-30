// =============================================================================
// Error Handling System
// =============================================================================
// Hierarchical error classes with structured error codes.
// Every error carries a machine-readable code, HTTP status, and optional metadata.
// =============================================================================

import type { z } from 'zod';
import { logger } from '@/lib/logger';

// ─────────────────────────────────────────────────────────────────────────────
// BASE APPLICATION ERROR
// ─────────────────────────────────────────────────────────────────────────────

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly metadata?: Record<string, unknown>;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    code: string,
    statusCode: number,
    metadata?: Record<string, unknown>,
    isOperational = true
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.metadata = metadata;
    this.isOperational = isOperational;

    // Maintain proper stack trace in V8 environments
    Error.captureStackTrace?.(this, this.constructor);
  }

  toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        details: this.metadata,
      },
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTHENTICATION & AUTHORIZATION ERRORS
// ─────────────────────────────────────────────────────────────────────────────

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 'AUTHENTICATION_ERROR', 401);
    this.name = 'AuthenticationError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'You do not have permission to perform this action') {
    super(message, 'FORBIDDEN', 403);
    this.name = 'ForbiddenError';
  }
}

export class SessionExpiredError extends AppError {
  constructor() {
    super('Your session has expired. Please sign in again.', 'SESSION_EXPIRED', 401);
    this.name = 'SessionExpiredError';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION ERRORS
// ─────────────────────────────────────────────────────────────────────────────

export class ValidationError extends AppError {
  constructor(message: string, errors?: unknown) {
    super(message, 'VALIDATION_ERROR', 400, { errors });
    this.name = 'ValidationError';
  }

  static fromZodError(error: z.ZodError) {
    const formatted = error.format();
    return new ValidationError('Validation failed', formatted);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// NOT FOUND ERRORS
// ─────────────────────────────────────────────────────────────────────────────

export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(message, 'NOT_FOUND', 404, { resource, identifier });
    this.name = 'NotFoundError';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CONFLICT ERRORS
// ─────────────────────────────────────────────────────────────────────────────

export class ConflictError extends AppError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(message, 'CONFLICT', 409, metadata);
    this.name = 'ConflictError';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// AI GENERATION ERRORS
// ─────────────────────────────────────────────────────────────────────────────

export class AIGenerationError extends AppError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(message, 'AI_GENERATION_ERROR', 500, metadata);
    this.name = 'AIGenerationError';
  }
}

export class AITokenLimitError extends AIGenerationError {
  constructor(used = 0, limit = 0) {
    const message = used && limit
      ? `AI token limit exceeded: ${used.toLocaleString()} / ${limit.toLocaleString()} tokens used`
      : 'AI token limit exceeded';
    super(message, {
      used,
      limit,
      remaining: Math.max(0, limit - used),
    });
    this.name = 'AITokenLimitError';
  }
}

export class AITimeoutError extends AIGenerationError {
  constructor(timeoutMs = 0) {
    const message = timeoutMs
      ? `AI generation timed out after ${timeoutMs / 1000}s`
      : 'AI generation timed out';
    super(message, { timeoutMs });
    this.name = 'AITimeoutError';
  }
}

export class AIResponseParseError extends AIGenerationError {
  constructor(detail: string, metadata?: Record<string, unknown>) {
    super(`Failed to parse AI response: ${detail}`, { detail, ...metadata });
    this.name = 'AIResponseParseError';
  }
}

export class AIContentPolicyError extends AIGenerationError {
  constructor(reason: string) {
    super(`Content policy violation: ${reason}`, { reason });
    this.name = 'AIContentPolicyError';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT ERRORS
// ─────────────────────────────────────────────────────────────────────────────

export class ExportError extends AppError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(message, 'EXPORT_ERROR', 500, metadata);
    this.name = 'ExportError';
  }
}

export class ExportFormatError extends ExportError {
  constructor(format: string) {
    super(`Unsupported export format: ${format}`, { format });
    this.name = 'ExportFormatError';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DEPLOYMENT ERRORS
// ─────────────────────────────────────────────────────────────────────────────

export class DeploymentError extends AppError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(message, 'DEPLOYMENT_ERROR', 500, metadata);
    this.name = 'DeploymentError';
  }
}

export class DeploymentConfigError extends DeploymentError {
  constructor(platform: string, detail: string) {
    super(`Deployment configuration error for ${platform}: ${detail}`, { platform, detail });
    this.name = 'DeploymentConfigError';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// RATE LIMITING ERRORS
// ─────────────────────────────────────────────────────────────────────────────

export class RateLimitError extends AppError {
  public readonly retryAfterMs: number;

  constructor(retryAfterMsOrLimit: number, windowMs?: number) {
    // Support both (limit, windowMs) and single-arg (retryAfterMs) patterns
    const retryAfterMs = windowMs !== undefined ? windowMs : retryAfterMsOrLimit;
    const limit = windowMs !== undefined ? retryAfterMsOrLimit : 0;
    super(
      limit > 0
        ? `Rate limit exceeded. ${limit} requests per ${windowMs! / 1000}s allowed.`
        : 'Rate limit exceeded. Please try again later.',
      'RATE_LIMIT_EXCEEDED',
      429,
      { limit, windowMs: retryAfterMs, retryAfterMs }
    );
    this.name = 'RateLimitError';
    this.retryAfterMs = retryAfterMs;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SUBSCRIPTION ERRORS
// ─────────────────────────────────────────────────────────────────────────────

export class SubscriptionError extends AppError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(message, 'SUBSCRIPTION_ERROR', 403, metadata);
    this.name = 'SubscriptionError';
  }
}

export class PlanLimitExceededError extends SubscriptionError {
  constructor(resource: string, current: number, limit: number) {
    const isUnlimited = limit === -1;
    const message = isUnlimited
      ? `Unlimited ${resource} reached an unexpected state`
      : `${resource} limit exceeded: ${current} / ${limit} used. Please upgrade your plan.`;
    super(message, { resource, current, limit, isUnlimited });
    this.name = 'PlanLimitExceededError';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// STORAGE ERRORS
// ─────────────────────────────────────────────────────────────────────────────

export class StorageError extends AppError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(message, 'STORAGE_ERROR', 500, metadata);
    this.name = 'StorageError';
  }
}

export class FileNotFoundError extends StorageError {
  constructor(path: string) {
    super(`File not found: ${path}`, { path });
    this.name = 'FileNotFoundError';
  }
}

export class FileTooLargeError extends StorageError {
  constructor(size: number, max: number) {
    super(`File size ${(size / 1024 / 1024).toFixed(1)}MB exceeds maximum ${(max / 1024 / 1024).toFixed(1)}MB`, {
      size,
      max,
    });
    this.name = 'FileTooLargeError';
  }
}

export class InvalidFileTypeError extends StorageError {
  constructor(type: string, allowed: string[]) {
    super(`File type '${type}' is not allowed. Allowed: ${allowed.join(', ')}`, { type, allowed });
    this.name = 'InvalidFileTypeError';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DATABASE ERRORS
// ─────────────────────────────────────────────────────────────────────────────

export class DatabaseError extends AppError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(message, 'DATABASE_ERROR', 500, metadata, false); // not operational
    this.name = 'DatabaseError';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ERROR RESPONSE BUILDER
// ─────────────────────────────────────────────────────────────────────────────

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
    requestId?: string;
    timestamp: string;
  };
}

export function buildErrorResponse(
  error: Error | AppError,
  requestId?: string
): ErrorResponse {
  if (error instanceof AppError) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.metadata,
        requestId,
        timestamp: new Date().toISOString(),
      },
    };
  }

  // Unknown errors — don't leak internals
  logger.error('Unhandled error', { error: String(error) });
  return {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred. Please try again.',
      requestId,
      timestamp: new Date().toISOString(),
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// ERROR CLASSIFICATION
// ─────────────────────────────────────────────────────────────────────────────

export function isOperationalError(error: Error): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}

export function isRetryableError(error: Error): boolean {
  if (error instanceof AppError) {
    return error.statusCode === 429 || error.statusCode === 503;
  }
  return false;
}
