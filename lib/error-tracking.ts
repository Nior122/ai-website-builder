// =============================================================================
// Error Tracking & Aggregation
// =============================================================================
// Lightweight in-memory error tracker with periodic flush to external sinks.
// Captures errors with request context (userId, route, method) and provides
// retrieval APIs for admin dashboards and monitoring.
//
// Usage:
//   trackError(error, { userId, requestId, route: '/api/ai/generate' })
//   const recent = getRecentErrors(20)
//   const stats = getErrorStats(60_000) // last 60s
//
// External sink:
//   registerErrorSink((batch) => sendToSentry(batch))
// =============================================================================

import { logger } from '@/lib/logger';

// ─── Types ─────────────────────────────────────────────────────────────

export interface ErrorContext {
  userId?: string;
  requestId?: string;
  route?: string;
  method?: string;
  statusCode?: number;
  userAgent?: string;
  [key: string]: unknown;
}

export interface TrackedError {
  id: string;
  name: string;
  message: string;
  code?: string;
  statusCode?: number;
  stack?: string;
  context: ErrorContext;
  timestamp: string;
}

export interface ErrorStats {
  total: number;
  byCode: Record<string, number>;
  byRoute: Record<string, number>;
  byName: Record<string, number>;
}

type ErrorSinkFn = (errors: TrackedError[]) => void | Promise<void>;

// ─── Config ────────────────────────────────────────────────────────────

const MAX_BUFFER_SIZE = 500;
const FLUSH_INTERVAL_MS = 30_000;
const FLUSH_THRESHOLD = 50;

// ─── State ─────────────────────────────────────────────────────────────

let buffer: TrackedError[] = [];
const sinks: ErrorSinkFn[] = [];
let flushTimer: ReturnType<typeof setInterval> | null = null;
let idCounter = 0;

// ─── Public API ────────────────────────────────────────────────────────

/**
 * Register an external sink to receive batches of tracked errors.
 * Sinks are called asynchronously; failures are logged but never thrown.
 */
export function registerErrorSink(fn: ErrorSinkFn): void {
  sinks.push(fn);
}

/**
 * Track an error with optional request context.
 * Appends to the in-memory buffer and flushes when threshold is reached.
 */
export function trackError(
  error: Error & { statusCode?: number; code?: string },
  context: ErrorContext = {}
): TrackedError {
  const tracked: TrackedError = {
    id: `err_${Date.now()}_${++idCounter}`,
    name: error.name || 'Error',
    message: error.message,
    code: error.code,
    statusCode: error.statusCode,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
  };

  buffer.push(tracked);

  // Trim to max size (drop oldest)
  if (buffer.length > MAX_BUFFER_SIZE) {
    buffer = buffer.slice(-MAX_BUFFER_SIZE);
  }

  // Flush if threshold reached
  if (buffer.length >= FLUSH_THRESHOLD) {
    flush();
  }

  return tracked;
}

/**
 * Retrieve the most recent tracked errors.
 */
export function getRecentErrors(limit = 50): TrackedError[] {
  return buffer.slice(-limit).reverse();
}

/**
 * Get aggregated error statistics for a time window.
 */
export function getErrorStats(timeWindowMs?: number): ErrorStats {
  const cutoff = timeWindowMs
    ? new Date(Date.now() - timeWindowMs).toISOString()
    : undefined;

  const errors = cutoff
    ? buffer.filter((e) => e.timestamp >= cutoff)
    : buffer;

  const byCode: Record<string, number> = {};
  const byRoute: Record<string, number> = {};
  const byName: Record<string, number> = {};

  for (const err of errors) {
    const code = err.code || 'UNKNOWN';
    const route = err.context.route || 'unknown';
    const name = err.name;

    byCode[code] = (byCode[code] || 0) + 1;
    byRoute[route] = (byRoute[route] || 0) + 1;
    byName[name] = (byName[name] || 0) + 1;
  }

  return { total: errors.length, byCode, byRoute, byName };
}

/**
 * Clear the buffer and flush remaining errors to sinks.
 * Intended for graceful shutdown.
 */
export async function flush(): Promise<void> {
  if (buffer.length === 0) return;

  const batch = [...buffer];
  buffer = [];

  for (const sink of sinks) {
    try {
      await sink(batch);
    } catch (err) {
      logger.error('Error sink failed', { sinkCount: sinks.length }, err as Error);
    }
  }
}

/**
 * Get the current buffer size (useful for monitoring/debugging).
 */
export function getBufferSize(): number {
  return buffer.length;
}

// ─── Auto-Flush Timer ──────────────────────────────────────────────────

/**
 * Start the periodic flush timer. Called automatically on first trackError.
 * Safe to call multiple times — only one timer runs.
 */
export function startFlushTimer(): void {
  if (flushTimer) return;
  flushTimer = setInterval(() => {
    flush();
  }, FLUSH_INTERVAL_MS);
}

// Start timer on module load (only in Node.js, not in edge runtime)
if (typeof setInterval !== 'undefined') {
  startFlushTimer();
}
