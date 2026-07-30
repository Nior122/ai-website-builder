// =============================================================================
// Structured Logger
// =============================================================================
// JSON-structured logger with request context, levels, and pluggable external
// sink for forwarding to error tracking services (Sentry, Datadog, etc.).
//
// In development: pretty-printed console output with emoji level indicators.
// In production: machine-parseable JSON on every line.
//
// Usage:
//   logger.info('Server started', { port: 3000 })
//   logger.error('Generation failed', { userId, projectId }, error)
//
//   // Request-scoped logger (auto-injects requestId + userId):
//   const reqLog = createRequestLogger(requestId, userId)
//   reqLog.info('Generating site', { prompt })
// =============================================================================

const isDev = process.env.NODE_ENV !== 'production';

// ─── Types ─────────────────────────────────────────────────────────────

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  requestId?: string;
  userId?: string;
  method?: string;
  path?: string;
  duration?: number;
  [key: string]: unknown;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  stack?: string;
}

export interface Logger {
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext, error?: Error): void;
  debug(message: string, context?: LogContext): void;
}

// ─── External Sink ─────────────────────────────────────────────────────
// Register a function to forward log entries to external services.
// Called asynchronously — failures are silently ignored to avoid recursive logging.

type SinkFn = (entry: LogEntry) => void;
const sinks: SinkFn[] = [];

export function registerLogSink(fn: SinkFn): void {
  sinks.push(fn);
}

function sendToSinks(entry: LogEntry): void {
  for (const sink of sinks) {
    try {
      sink(entry);
    } catch {
      // Never let sink failures break logging
    }
  }
}

// ─── Formatting ────────────────────────────────────────────────────────

const LEVEL_EMOJI: Record<LogLevel, string> = {
  debug: '🔍',
  info: '📋',
  warn: '⚠️',
  error: '❌',
};

function formatDev(entry: LogEntry): string {
  const emoji = LEVEL_EMOJI[entry.level];
  const ctx = entry.context && Object.keys(entry.context).length > 0
    ? `\n  ${JSON.stringify(entry.context, null, 2)}`
    : '';
  const stack = entry.stack ? `\n  Stack: ${entry.stack}` : '';
  return `${emoji} [${entry.level.toUpperCase()}] ${entry.message}${ctx}${stack}`;
}

function formatProd(entry: LogEntry): string {
  return JSON.stringify({
    level: entry.level,
    message: entry.message,
    timestamp: entry.timestamp,
    ...entry.context,
    ...(entry.stack ? { stack: entry.stack } : {}),
  });
}

function format(entry: LogEntry): string {
  return isDev ? formatDev(entry) : formatProd(entry);
}

// ─── Core Logger ───────────────────────────────────────────────────────

function emit(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    context: context && Object.keys(context).length > 0 ? context : undefined,
    stack: error?.stack,
  };

  const formatted = format(entry);

  switch (level) {
    case 'debug':
      if (isDev) console.debug(formatted);
      break;
    case 'info':
      console.log(formatted);
      break;
    case 'warn':
      console.warn(formatted);
      break;
    case 'error':
      console.error(formatted);
      break;
  }

  sendToSinks(entry);
}

/**
 * Global logger instance. Works with or without request context.
 */
export const logger: Logger = {
  info: (message, context) => emit('info', message, context),
  warn: (message, context) => emit('warn', message, context),
  error: (message, context, error) => emit('error', message, context, error),
  debug: (message, context) => emit('debug', message, context),
};

// ─── Request-Scoped Logger ─────────────────────────────────────────────
// Creates a child logger that automatically includes requestId and userId
// in every log entry, avoiding repetitive context passing.

export function createRequestLogger(
  requestId: string,
  userId?: string
): Logger {
  const baseContext: LogContext = { requestId, ...(userId ? { userId } : {}) };

  return {
    info: (message, context) =>
      emit('info', message, { ...baseContext, ...context }),
    warn: (message, context) =>
      emit('warn', message, { ...baseContext, ...context }),
    error: (message, context, error) =>
      emit('error', message, { ...baseContext, ...context }, error),
    debug: (message, context) =>
      emit('debug', message, { ...baseContext, ...context }),
  };
}
