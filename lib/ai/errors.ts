// =============================================================================
// AI Provider Error Classification
// =============================================================================
// Interprets provider errors (OpenRouter, Anthropic, etc.) into structured
// types with human-readable messages and retry guidance.
// =============================================================================

import { logger } from '@/lib/logger';

export type ProviderErrorType =
  | 'invalid_key'
  | 'model_not_found'
  | 'rate_limit'
  | 'context_length'
  | 'timeout'
  | 'invalid_json'
  | 'network_error'
  | 'unknown';

export interface ProviderError {
  type: ProviderErrorType;
  message: string;
  statusCode?: number;
  provider?: string;
  model?: string;
  /** Whether retrying with a different model would help. */
  retryable: boolean;
}

/**
 * Parse an OpenRouter API error response body for structured details.
 */
function parseErrorBody(body: string): { code?: string; message?: string } {
  try {
    const json = JSON.parse(body);
    return {
      code: json.error?.code,
      message: json.error?.message,
    };
  } catch {
    return {};
  }
}

/**
 * Classify a provider error from a caught exception or HTTP response details.
 */
export function classifyProviderError(
  error: unknown,
  provider?: string,
  model?: string
): ProviderError {
  const message = error instanceof Error ? error.message : String(error);
  const statusCode = (error as any).__statusCode || (error as any).status;
  const code = (error as any).__type || (error as any).code;

  // Context length exceeded
  if (
    message.toLowerCase().includes('context_length') ||
    message.toLowerCase().includes('context length') ||
    message.toLowerCase().includes('max tokens') ||
    message.toLowerCase().includes('token limit') ||
    code === 'context_length_exceeded'
  ) {
    return {
      type: 'context_length',
      message: 'Context length exceeded — the input is too long for this model.',
      statusCode: statusCode || 400,
      provider,
      model,
      retryable: false, // Reducing input length would be needed
    };
  }

  // Invalid API key (Task 8, 9)
  // ONLY classify as invalid_key on a TRUE HTTP 401 or explicit __type tag.
  // We removed the overbroad substring matches ('api key', 'unauthorized',
  // 'authentication') that caused non-401 OpenRouter errors — such as "no
  // active credentials for this model" or "you have API key credits but the
  // model requires a subscription" — to be misclassified as invalid_key,
  // which killed the fallback pipeline and surfaced a misleading message.
  // The real error message is already attached via `message` and will be
  // surfaced to the user through the 'unknown' fallback.
  if (statusCode === 401 || code === 'invalid_key') {
    return {
      type: 'invalid_key',
      message: message || 'Invalid API key. Check your provider credentials.',
      statusCode: 401,
      provider,
      model,
      retryable: false,
    };
  }

  // Model not found
  if (
    (statusCode === 404) ||
    message.toLowerCase().includes('model not found') ||
    message.toLowerCase().includes('no active credentials') ||
    code === 'model_not_found'
  ) {
    return {
      type: 'model_not_found',
      message: `Model "${model || 'unknown'}" not found or no active credentials for this model.`,
      statusCode: 404,
      provider,
      model,
      retryable: true, // A different model might work
    };
  }

  // Rate limit
  if (
    (statusCode === 429) ||
    message.toLowerCase().includes('rate limit') ||
    message.toLowerCase().includes('too many requests') ||
    code === 'rate_limit'
  ) {
    return {
      type: 'rate_limit',
      message: 'Rate limit exceeded. Wait before retrying.',
      statusCode: 429,
      provider,
      model,
      retryable: true,
    };
  }

  // Timeout
  if (
    (statusCode === 504) ||
    statusCode === 408 ||
    message.toLowerCase().includes('timeout') ||
    message.toLowerCase().includes('timed out') ||
    message.toLowerCase().includes('abort') ||
    code === 'timeout'
  ) {
    return {
      type: 'timeout',
      message: 'The AI provider timed out. The model may be overloaded.',
      statusCode: statusCode || 504,
      provider,
      model,
      retryable: true,
    };
  }

  // Network error
  if (
    message.toLowerCase().includes('fetch') ||
    message.toLowerCase().includes('network') ||
    message.toLowerCase().includes('econnrefused') ||
    message.toLowerCase().includes('enotfound') ||
    message.toLowerCase().includes('econnreset') ||
    message.toLowerCase().includes('socket')
  ) {
    return {
      type: 'network_error',
      message: `Network error connecting to ${provider || 'AI provider'}. Check your connection.`,
      statusCode: 0,
      provider,
      model,
      retryable: true,
    };
  }

  // Server error (5xx)
  if (statusCode && statusCode >= 500 && statusCode < 600) {
    return {
      type: 'unknown',
      message: `${provider || 'AI provider'} returned a server error (HTTP ${statusCode}).`,
      statusCode,
      provider,
      model,
      retryable: true,
    };
  }

  // Invalid JSON / parse error
  if (
    message.toLowerCase().includes('invalid json') ||
    message.toLowerCase().includes('parse') ||
    message.toLowerCase().includes('unexpected token') ||
    message.toLowerCase().includes('expected array') ||
    message.toLowerCase().includes('validation failed')
  ) {
    return {
      type: 'invalid_json',
      message: message || 'The AI returned an invalid response.',
      statusCode: statusCode || 500,
      provider,
      model,
      retryable: true,
    };
  }

  // Generic/unknown
  return {
    type: 'unknown',
    message: message || 'An unknown error occurred during AI generation.',
    statusCode,
    provider,
    model,
    retryable: true,
  };
}

/**
 * Format a provider error into a user-facing message.
 */
export function formatProviderError(error: ProviderError): string {
  return error.message;
}
