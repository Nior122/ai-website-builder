// =============================================================================
// Logger
// =============================================================================
// Structured logging for server-side code. Outputs JSON in production
// for log aggregation, and formatted console output in development.
// =============================================================================

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  data?: Record<string, unknown>;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const MIN_LEVEL = LOG_LEVELS[process.env.NODE_ENV === 'production' ? 'info' : 'debug'];

function log(level: LogLevel, message: string, data?: Record<string, unknown>) {
  if (LOG_LEVELS[level] < MIN_LEVEL) return;

  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(data && { data }),
  };

  if (process.env.NODE_ENV === 'production') {
    console.log(JSON.stringify(entry));
  } else {
    const prefix = { debug: '🔍', info: '✓', warn: '⚠', error: '❌' }[level];
    console[level === 'error' ? 'error' : 'log'](`${prefix} ${message}`, data || '');
  }
}

export const logger = {
  debug: (message: string, data?: Record<string, unknown>) => log('debug', message, data),
  info: (message: string, data?: Record<string, unknown>) => log('info', message, data),
  warn: (message: string, data?: Record<string, unknown>) => log('warn', message, data),
  error: (message: string, data?: Record<string, unknown>) => log('error', message, data),
};
