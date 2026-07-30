// =============================================================================
// Error Tracking Tests
// =============================================================================
// Unit tests for the error tracking system: tracking, retrieval, stats,
// and sink integration.
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock logger to avoid console noise
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
  createRequestLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  })),
}));

import {
  trackError,
  getRecentErrors,
  getErrorStats,
  registerErrorSink,
  flush,
  getBufferSize,
} from '@/lib/error-tracking';

beforeEach(async () => {
  // Flush buffer before each test
  await flush();
});

describe('trackError', () => {
  it('tracks an error with default context', () => {
    const error = new Error('Something failed');
    const tracked = trackError(error);

    expect(tracked.id).toMatch(/^err_/);
    expect(tracked.name).toBe('Error');
    expect(tracked.message).toBe('Something failed');
    expect(tracked.stack).toBeDefined();
    expect(tracked.timestamp).toBeDefined();
    expect(tracked.context).toEqual({});
  });

  it('tracks an error with custom context', () => {
    const error = new Error('Auth failed');
    const tracked = trackError(error, {
      userId: 'user_123',
      requestId: 'req_abc',
      route: '/api/ai/generate',
      method: 'POST',
    });

    expect(tracked.context.userId).toBe('user_123');
    expect(tracked.context.requestId).toBe('req_abc');
    expect(tracked.context.route).toBe('/api/ai/generate');
    expect(tracked.context.method).toBe('POST');
  });

  it('increments buffer size', () => {
    expect(getBufferSize()).toBe(0);
    trackError(new Error('one'));
    expect(getBufferSize()).toBe(1);
    trackError(new Error('two'));
    expect(getBufferSize()).toBe(2);
  });

  it('handles AppError-like errors with code and statusCode', () => {
    const error = Object.assign(new Error('Rate limited'), {
      code: 'RATE_LIMIT_EXCEEDED',
      statusCode: 429,
    });
    const tracked = trackError(error);

    expect(tracked.code).toBe('RATE_LIMIT_EXCEEDED');
    expect(tracked.statusCode).toBe(429);
  });
});

describe('getRecentErrors', () => {
  it('returns errors in reverse chronological order', () => {
    trackError(new Error('first'));
    trackError(new Error('second'));
    trackError(new Error('third'));

    const recent = getRecentErrors(2);
    expect(recent).toHaveLength(2);
    expect(recent[0].message).toBe('third');
    expect(recent[1].message).toBe('second');
  });

  it('returns empty array when no errors tracked', () => {
    expect(getRecentErrors()).toEqual([]);
  });

  it('limits results to the requested count', () => {
    for (let i = 0; i < 10; i++) {
      trackError(new Error(`error ${i}`));
    }
    expect(getRecentErrors(5)).toHaveLength(5);
  });
});

describe('getErrorStats', () => {
  it('returns empty stats when no errors', () => {
    const stats = getErrorStats();
    expect(stats.total).toBe(0);
    expect(stats.byCode).toEqual({});
    expect(stats.byRoute).toEqual({});
    expect(stats.byName).toEqual({});
  });

  it('aggregates errors by code, route, and name', () => {
    trackError(Object.assign(new Error('err1'), { code: 'AUTH_ERROR' }), {
      route: '/api/projects',
    });
    trackError(Object.assign(new Error('err2'), { code: 'AUTH_ERROR' }), {
      route: '/api/projects',
    });
    trackError(Object.assign(new Error('err3'), { code: 'DB_ERROR' }), {
      route: '/api/deploy',
    });

    const stats = getErrorStats();
    expect(stats.total).toBe(3);
    expect(stats.byCode['AUTH_ERROR']).toBe(2);
    expect(stats.byCode['DB_ERROR']).toBe(1);
    expect(stats.byRoute['/api/projects']).toBe(2);
    expect(stats.byRoute['/api/deploy']).toBe(1);
  });

  it('filters by time window', () => {
    trackError(new Error('recent'));

    // 1ms window — should only include very recent
    const stats = getErrorStats(1);
    // The error was just tracked, so it should be included
    expect(stats.total).toBe(1);
  });
});

describe('registerErrorSink', () => {
  it('calls sink with batch on flush', async () => {
    const sink = vi.fn();
    registerErrorSink(sink);

    trackError(new Error('test1'));
    trackError(new Error('test2'));

    await flush();

    expect(sink).toHaveBeenCalledOnce();
    const batch = sink.mock.calls[0][0];
    expect(batch).toHaveLength(2);
    expect(batch[0].message).toBe('test1');
    expect(batch[1].message).toBe('test2');
  });

  it('clears buffer after flush', async () => {
    registerErrorSink(vi.fn());
    trackError(new Error('gone'));
    expect(getBufferSize()).toBe(1);

    await flush();
    expect(getBufferSize()).toBe(0);
  });

  it('does not throw when sink fails', async () => {
    registerErrorSink(() => {
      throw new Error('Sink broken');
    });
    trackError(new Error('test'));

    await expect(flush()).resolves.not.toThrow();
  });
});
