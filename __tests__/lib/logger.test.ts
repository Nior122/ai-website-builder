// =============================================================================
// Logger Tests
// =============================================================================
// Unit tests for the structured logger: output formatting, request-scoped
// loggers, and external sink integration.
// =============================================================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─── Spy on console methods ────────────────────────────────────────────

const consoleSpy = {
  log: vi.spyOn(console, 'log').mockImplementation(() => {}),
  warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
  error: vi.spyOn(console, 'error').mockImplementation(() => {}),
  debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
};

beforeEach(() => {
  consoleSpy.log.mockClear();
  consoleSpy.warn.mockClear();
  consoleSpy.error.mockClear();
  consoleSpy.debug.mockClear();
});

afterEach(() => {
  vi.clearAllMocks();
});

// ─── Import after spy setup ────────────────────────────────────────────

import { logger, createRequestLogger, registerLogSink } from '@/lib/logger';

// ─── Tests ─────────────────────────────────────────────────────────────

describe('Logger', () => {
  it('logs info messages to console.log', () => {
    logger.info('Server started');
    expect(consoleSpy.log).toHaveBeenCalledOnce();
    const output = consoleSpy.log.mock.calls[0][0] as string;
    expect(output).toContain('Server started');
  });

  it('logs warn messages to console.warn', () => {
    logger.warn('Something is off');
    expect(consoleSpy.warn).toHaveBeenCalledOnce();
    const output = consoleSpy.warn.mock.calls[0][0] as string;
    expect(output).toContain('Something is off');
  });

  it('logs error messages to console.error', () => {
    logger.error('Something broke');
    expect(consoleSpy.error).toHaveBeenCalledOnce();
    const output = consoleSpy.error.mock.calls[0][0] as string;
    expect(output).toContain('Something broke');
  });

  it('includes context in log output', () => {
    logger.info('Request processed', { requestId: 'req_123', userId: 'user_456' });
    expect(consoleSpy.log).toHaveBeenCalledOnce();
    const output = consoleSpy.log.mock.calls[0][0] as string;
    expect(output).toContain('req_123');
    expect(output).toContain('user_456');
  });

  it('includes error stack when error is passed', () => {
    const error = new Error('test error');
    logger.error('Failed', {}, error);
    expect(consoleSpy.error).toHaveBeenCalledOnce();
    const output = consoleSpy.error.mock.calls[0][0] as string;
    expect(output).toContain('test error');
  });
});

describe('createRequestLogger', () => {
  it('creates a logger that includes requestId in all entries', () => {
    const reqLog = createRequestLogger('req_abc', 'user_xyz');
    reqLog.info('Processing');
    expect(consoleSpy.log).toHaveBeenCalledOnce();
    const output = consoleSpy.log.mock.calls[0][0] as string;
    expect(output).toContain('req_abc');
    expect(output).toContain('user_xyz');
  });

  it('merges additional context with base context', () => {
    const reqLog = createRequestLogger('req_abc');
    reqLog.info('Done', { method: 'GET', path: '/api/test' });
    const output = consoleSpy.log.mock.calls[0][0] as string;
    expect(output).toContain('req_abc');
    expect(output).toContain('GET');
    expect(output).toContain('/api/test');
  });

  it('can work without userId', () => {
    const reqLog = createRequestLogger('req_no_user');
    reqLog.warn('Warning');
    const output = consoleSpy.warn.mock.calls[0][0] as string;
    expect(output).toContain('req_no_user');
  });
});

describe('registerLogSink', () => {
  it('calls registered sink with log entries', () => {
    const sink = vi.fn();
    registerLogSink(sink);
    logger.info('Sink test');
    expect(sink).toHaveBeenCalledOnce();
    const entry = sink.mock.calls[0][0];
    expect(entry.level).toBe('info');
    expect(entry.message).toBe('Sink test');
    expect(entry.timestamp).toBeDefined();
  });

  it('does not throw when sink throws', () => {
    const badSink = vi.fn(() => {
      throw new Error('Sink error');
    });
    registerLogSink(badSink);
    expect(() => logger.info('Test')).not.toThrow();
  });
});
