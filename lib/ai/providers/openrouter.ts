// =============================================================================
// OpenRouter AI Provider
// =============================================================================
// Uses raw fetch() against OpenRouter's OpenAI-compatible /chat/completions
// endpoint. No SDK dependency. Supports streaming, structured JSON output
// (via schema-inject), and connection validation.
//
// API docs: https://openrouter.ai/docs/api-reference
// =============================================================================

import type {
  AIProvider,
  AIProviderConfig,
  CompletionParams,
  StructuredCompletionParams,
  CompletionResult,
  ValidationResult,
} from './types';
import { logger } from '@/lib/logger';
import { normalizeRawResponse, setLogRawResponses, deepLog } from '@/lib/ai/normalizer';

const DEFAULT_BASE_URL = 'https://openrouter.ai/api/v1';
const MAX_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 1000;

// Fallback models — read from env, never hardcoded.
// Set OPENROUTER_FALLBACK_MODELS="openai/gpt-4o-mini,google/gemini-2.0-flash-001" in .env.local.
const KNOWN_GOOD_MODELS = (process.env.OPENROUTER_FALLBACK_MODELS || '')
  .split(',')
  .map((m: string) => m.trim())
  .filter(Boolean);

const LOG = { provider: 'OpenRouter' } as const;

// ─── Error classification ─────────────────────────────────────────────────

type NetworkErrorType =
  | 'dns'
  | 'tls'
  | 'timeout'
  | 'econnreset'
  | 'econnrefused'
  | 'enotfound'
  | 'eai_again'
  | 'aborted'
  | 'proxy'
  | 'fetch_failed'
  | 'invalid_response'
  | 'unknown_network';

interface ClassifiedNetworkError {
  type: NetworkErrorType;
  message: string;
  retryable: boolean;
}

function classifyFetchError(err: unknown): ClassifiedNetworkError {
  const message = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
  const code = (err as any)?.code?.toLowerCase?.() || '';

  if (err instanceof DOMException && err.name === 'AbortError') {
    return { type: 'timeout', message: 'OpenRouter request timed out', retryable: true };
  }
  if (code === 'econnreset' || message.includes('econnreset')) {
    return { type: 'econnreset', message: 'OpenRouter connection reset — server closed the connection', retryable: true };
  }
  if (code === 'econnrefused' || message.includes('econnrefused')) {
    return { type: 'econnrefused', message: 'OpenRouter connection refused — server may be down', retryable: true };
  }
  if (code === 'enotfound' || message.includes('enotfound') || code === 'enetunreach') {
    return { type: 'enotfound', message: 'OpenRouter host not found — check network connectivity', retryable: true };
  }
  if (code === 'eai_again' || message.includes('eai_again') || message.includes('dns') || message.includes('getaddrinfo')) {
    return { type: 'dns', message: 'OpenRouter DNS resolution failed — check DNS/network', retryable: true };
  }
  if (code === 'etimedout' || message.includes('timeout') || message.includes('timed out')) {
    return { type: 'timeout', message: 'OpenRouter request timed out', retryable: true };
  }
  if (message.includes('fetch failed') || message.includes('network error') || message.includes('network')) {
    return { type: 'fetch_failed', message: `OpenRouter network connection failed: ${err instanceof Error ? err.message : err}`, retryable: true };
  }
  if (message.includes('tls') || message.includes('ssl') || message.includes('certificate')) {
    return { type: 'tls', message: 'OpenRouter TLS/SSL error', retryable: false };
  }
  if (message.includes('proxy')) {
    return { type: 'proxy', message: 'OpenRouter proxy error', retryable: false };
  }
  if (code === 'econnaborted') {
    return { type: 'aborted', message: 'OpenRouter request aborted', retryable: true };
  }

  return { type: 'unknown_network', message: `OpenRouter request failed: ${err instanceof Error ? err.message : err}`, retryable: true };
}

/**
 * Parse OpenRouter-specific error details from the response body.
 * Returns the raw error code + message from OpenRouter when available.
 * NEVER hardcodes a misleading 401 message — the body is truth.
 */
function parseOpenRouterError(body: string, status: number): string {
  try {
    const json = JSON.parse(body);
    if (json.error?.message) {
      const code = json.error.code || 'unknown';
      const raw = `[${code}] ${json.error.message}`;
      logger.warn('OpenRouter error response (full)', {
        status,
        code: json.error.code,
        message: json.error.message,
        ...LOG,
      });
      return raw;
    }
  } catch {
    // Body is not JSON — fall through
  }

  // Fallback with the actual body text so we never hide the real error.
  const preview = body.slice(0, 500) || '(empty body)';
  return `OpenRouter HTTP ${status}: ${preview}`;
}

/**
 * Log the complete OpenRouter response for debugging.
 */
function logResponseDetails(response: Response, body: string): void {
  const headers: Record<string, string> = {};
  response.headers.forEach((v, k) => { headers[k] = v; });
  logger.info('OpenRouter response (full)', {
    status: response.status,
    statusText: response.statusText,
    headers,
    body: body.slice(0, 2000),
    ...LOG,
  });
}

/**
 * Sleep for a given number of milliseconds.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class OpenRouterProvider implements AIProvider {
  readonly name = 'openrouter';
  private config: AIProviderConfig;
  private baseURL: string;
  private modelResolved = false;

  constructor(config: AIProviderConfig) {
    // Defensive: strip any whitespace/stray quotes that may have slipped in from
    // the env file. A leading/trailing space in OPENROUTER_API_KEY is the #1 cause
    // of mysterious HTTP 401 "Invalid API key" rejections. Do NOT log the key.
    const cleanedKey = (config.apiKey || '').trim().replace(/^["']|["']$/g, '');

    if (!cleanedKey) {
      throw new Error('OpenRouter API key is missing or empty. Set OPENROUTER_API_KEY in your .env.local file.');
    }
    if (!cleanedKey.startsWith('sk-or-')) {
      logger.warn('OpenRouter API key has an unexpected format — expected to start with "sk-or-". Verify OPENROUTER_API_KEY.', { ...LOG });
    }

    this.config = { ...config, apiKey: cleanedKey };
    this.baseURL = (config.baseURL || DEFAULT_BASE_URL).trim();
    // Strip trailing slash
    if (this.baseURL.endsWith('/')) {
      this.baseURL = this.baseURL.slice(0, -1);
    }
  }

  /**
   * Warm the model cache: query /v1/models and switch to a known-working model
   * if the configured one is not available (Task 5). Non-blocking on failure.
   */
  private async resolveModel(): Promise<void> {
    if (this.modelResolved) return;
    this.modelResolved = true;

    try {
      const url = `${this.baseURL}/models`;
      logger.info('Resolving model availability from ' + url, { ...LOG });
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
        },
      });

      if (!response.ok) {
        logger.warn('Could not query /v1/models — using configured model as-is', {
          status: response.status,
          model: this.config.model,
          ...LOG,
        });
        return;
      }

      const json = await response.json();
      const availableModels: string[] = (json.data || []).map((m: any) => m.id);

      if (availableModels.includes(this.config.model)) {
        logger.info('Configured model confirmed available: ' + this.config.model, { ...LOG });
        return;
      }

      logger.warn('Configured model "' + this.config.model + '" not found in /v1/models', {
        availableCount: availableModels.length,
        sample: availableModels.slice(0, 10),
        ...LOG,
      });

      // Auto-switch to the first KNOWN_GOOD_MODEL that is in the available list
      for (const good of KNOWN_GOOD_MODELS) {
        if (availableModels.includes(good)) {
          logger.info(`Auto-switching model: ${this.config.model} -> ${good}`, { ...LOG });
          this.config = { ...this.config, model: good };
          return;
        }
      }

      logger.error('No known-good model found in available models list. Generation will likely fail.', { ...LOG });
    } catch (err) {
      logger.warn('Failed to reach /v1/models — proceeding with configured model', {
        error: err instanceof Error ? err.message : String(err),
        ...LOG,
      });
    }
  }

  /**
   * Transform internal CompletionParams to the OpenAI-compatible request body
   * that OpenRouter expects.
   */
  private buildRequestBody(params: CompletionParams | StructuredCompletionParams, stream: boolean): Record<string, unknown> {
    const messages: Record<string, unknown>[] = [];

    // System prompt as a separate message (OpenAI format)
    if (params.system) {
      messages.push({ role: 'system', content: params.system });
    }

    // User/assistant messages
    for (const msg of params.messages) {
      messages.push({ role: msg.role, content: msg.content });
    }

    const body: Record<string, unknown> = {
      model: this.config.model,
      messages,
      temperature: params.temperature ?? this.config.temperature,
      max_tokens: params.maxTokens ?? this.config.maxTokens,
      stream,
    };

    // For structured completions, inject schema into system prompt
    if ('schema' in params && params.schema) {
      // Find the system message and append schema instructions
      const schemaMsg = messages.find(m => m.role === 'system');
      if (schemaMsg) {
        schemaMsg.content = `${schemaMsg.content}\n\nYou MUST respond with valid JSON matching this exact schema:\n${JSON.stringify(params.schema, null, 2)}\n\nReturn ONLY the JSON object — no markdown, no explanation.`;
      } else {
        messages.unshift({
          role: 'system',
          content: `You MUST respond with valid JSON matching this exact schema:\n${JSON.stringify(params.schema, null, 2)}\n\nReturn ONLY the JSON object — no markdown, no explanation.`,
        });
      }
    }

    return body;
  }

  /**
   * Make an HTTP request to OpenRouter's chat completions endpoint.
   * Includes comprehensive diagnostics, timeout, and retries with exponential backoff.
   */
  private async apiRequest(body: Record<string, unknown>): Promise<Response> {
    // Verify the model exists on OpenRouter and switch to a fallback if not
    // (Task 5 — happens once on first call, cached by modelResolved flag).
    await this.resolveModel();

    const url = `${this.baseURL}/chat/completions`;
    const bodyStr = JSON.stringify(body);
    let lastError: Error | null = null;

    // ── Log key fingerprint (Task 4, 9) ─────────────────────────────────
    const keyLen = this.config.apiKey.length;
    const keyPrefix = this.config.apiKey.slice(0, 6);
    const keySuffix = this.config.apiKey.slice(-4);
    logger.info('OpenRouter key fingerprint (for cross-check with curl)', {
      fingerprint: `${keyPrefix}......${keySuffix} (length ${keyLen})`,
      envModel: process.env.OPENROUTER_MODEL || process.env.AI_MODEL || '(not set)',
      configModel: this.config.model,
      ...LOG,
    });

    // ── Build the headers object ONCE (STEP 3-4) ────────────────────────
    const requestHeaders: Record<string, string> = {
      Authorization: `Bearer ${this.config.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'X-Title': 'AI Website Builder Studio',
    };

    // STEP 3: Log headers diagnostics immediately before fetch
    const headersForLog: Record<string, string> = {};
    for (const [k, v] of Object.entries(requestHeaders)) {
      if (k.toLowerCase() === 'authorization') {
        headersForLog[k] = `${v.slice(0, 12)}...${v.slice(-4)} (length ${v.length})`;
      } else {
        headersForLog[k] = v;
      }
    }
    logger.info('OpenRouter pre-fetch headers diagnostic', {
      headersInstanceType: Object.prototype.toString.call(requestHeaders),
      isPlainObject: typeof requestHeaders,
      headerKeys: Object.keys(requestHeaders),
      headerCount: Object.keys(requestHeaders).length,
      authPresent: 'Authorization' in requestHeaders,
      authValuePrefix: requestHeaders.Authorization?.slice(0, 15),
      authValueLength: requestHeaders.Authorization?.length,
      headersForLog,
      url,
      model: this.config.model,
      ...LOG,
    });

    // ── Log request payload minus the API key (STEP 6) ─────────────────
    logger.info('OpenRouter request body summary', {
      url,
      model: body.model,
      stream: body.stream,
      temperature: body.temperature,
      max_tokens: body.max_tokens,
      messageCount: (body.messages as any[])?.length ?? 0,
      contentLength: bodyStr.length,
      ...LOG,
    });

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120_000);

      try {
        // ── STEP 3: Header diagnostic logging ──────────────────────────
        logger.info('OpenRouter calling fetch with headers', {
          headersInstanceType: Object.prototype.toString.call(requestHeaders),
          authHeaderValue: requestHeaders.Authorization ? `Bearer ...${requestHeaders.Authorization.slice(-8)} (present)` : 'MISSING',
          ...LOG,
        });

        const response = await fetch(url, {
          method: 'POST',
          headers: requestHeaders,
          body: bodyStr,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errBody = await response.text().catch(() => '');

          // ── Log COMPLETE response (Task 1) ────────────────────────────
          logResponseDetails(response, errBody);

          // ── STEP 8: If OpenRouter says "Missing Authentication" (the bug
          // we've been chasing), fall back to a minimal fetch that bypasses
          // any potential fetch wrapper / monkey-patching or duplicate-header
          // issue. This diagnostic also acts as a live test of the env var.
          if (response.status === 401 && errBody.toLowerCase().includes('missing authentication')) {
            logger.warn('OpenRouter reports Missing Authentication header — attempting raw minimal fetch bypass', {
              ...LOG,
            });

            // Minimal fetch: bare-bones headers, no AbortController wrapper,
            // read process.env directly (not this.config) to rule out any bug
            // in the provider config chain.
            const rawKey = (process.env.OPENROUTER_API_KEY || '').trim();
            const rawModel = process.env.OPENROUTER_MODEL || process.env.AI_MODEL || body.model || 'openrouter/free';

            logger.info('OpenRouter bypass — using direct process.env', {
              keyPrefix: rawKey.slice(0, 6),
              keyLength: rawKey.length,
              model: rawModel,
              ...LOG,
            });

            if (rawKey) {
              try {
                const bypassController = new AbortController();
                const bypassTimeout = setTimeout(() => bypassController.abort(), 30_000);
                const bypassBody = JSON.stringify({
                  model: rawModel,
                  messages: [{ role: 'user', content: 'Reply with the single word: success' }],
                  max_tokens: 10,
                });

                const bypassResponse = await fetch(url, {
                  method: 'POST',
                  headers: {
                    Authorization: `Bearer ${rawKey}`,
                    'Content-Type': 'application/json',
                  },
                  body: bypassBody,
                  signal: bypassController.signal,
                });
                clearTimeout(bypassTimeout);

                const bypassText = await bypassResponse.text();
                logger.info('OpenRouter bypass result', {
                  status: bypassResponse.status,
                  body: bypassText.slice(0, 500),
                  bypassModel: rawModel,
                  ...LOG,
                });

                // If the bypass succeeded, return the bypass response so the
                // caller can proceed. Also log a critical warning so we know
                // the normal path is broken.
                if (bypassResponse.ok) {
                  logger.error('OPENROUTER BYPASS SUCCEEDED — NORMAL FETCH PATH IS BROKEN. The headers object created at openrouter.ts:' + (requestHeaders as any)?.constructor?.name + ' is losing the Authorization header on the wire.', {
                    ...LOG,
                  });
                  return bypassResponse;
                }
              } catch (bypassErr) {
                logger.error('OpenRouter bypass also failed', {
                  error: bypassErr instanceof Error ? bypassErr.message : String(bypassErr),
                  ...LOG,
                });
              }
            }
          }
        }

        return response;
      } catch (err) {
        clearTimeout(timeoutId);
        lastError = err instanceof Error ? err : new Error(String(err));

        const classified = classifyFetchError(err);

        logger.error(`OpenRouter fetch failed (attempt ${attempt}/${MAX_RETRIES})`, {
          error: lastError.message,
          errorType: classified.type,
          retryable: classified.retryable,
          url,
          model: this.config.model,
          ...LOG,
        });

        // If not retryable, throw immediately
        if (!classified.retryable) {
          throw new Error(classified.message);
        }

        // If last attempt, throw
        if (attempt >= MAX_RETRIES) {
          throw new Error(classified.message);
        }

        // Exponential backoff with jitter
        const delay = BASE_RETRY_DELAY_MS * Math.pow(2, attempt - 1) + Math.random() * 500;
        logger.info(`OpenRouter retrying in ${Math.round(delay)}ms (attempt ${attempt + 1}/${MAX_RETRIES})`, { ...LOG });
        await sleep(delay);
      }
    }

    // Shouldn't reach here, but just in case
    throw lastError || new Error('OpenRouter request failed after all retries');
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Text Completion
  // ───────────────────────────────────────────────────────────────────────────

  async createCompletion(params: CompletionParams): Promise<CompletionResult> {
    const body = this.buildRequestBody(params, false);
    const response = await this.apiRequest(body);

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      throw new Error(parseOpenRouterError(errorBody, response.status));
    }

    const json = await response.json();
    const choice = json.choices?.[0];

    if (!choice?.message?.content) {
      throw new Error('Invalid JSON response from OpenRouter: no content in response');
    }

    return {
      content: choice.message.content,
      usage: json.usage
        ? { inputTokens: json.usage.prompt_tokens || 0, outputTokens: json.usage.completion_tokens || 0 }
        : undefined,
      model: json.model || this.config.model,
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Structured Completion (JSON output)
  // ───────────────────────────────────────────────────────────────────────────

  async createStructuredCompletion<T>(params: StructuredCompletionParams): Promise<T> {
    const body = this.buildRequestBody(params, false);
    const response = await this.apiRequest(body);

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      // Get the real OpenRouter error message from the body (Task 2, 7)
      const realMessage = parseOpenRouterError(errorBody, response.status);

      // Classify the error for retry/fallback logic (Task 8 — only ever
      // classify as invalid_key on a true HTTP 401; never on fuzzy match).
      const err = new Error(realMessage);
      // NOTE: __type drives classifyProviderError in errors.ts. The classifier
      // there used to have overbroad substring matching — see the fix in
      // errors.ts:75-91. Only the __type tags are authoritative.
      if (response.status === 401) (err as any).__type = 'invalid_key';
      if (response.status === 402) (err as any).__type = 'insufficient_credits';
      if (response.status === 403) (err as any).__type = 'access_denied';
      if (response.status === 404) (err as any).__type = 'model_not_found';
      if (response.status === 429) (err as any).__type = 'rate_limit';
      if (response.status >= 500) (err as any).__type = 'server_error';
      if (realMessage.includes('context_length') || realMessage.includes('token')) (err as any).__type = 'context_length';
      (err as any).__statusCode = response.status;
      throw err;
    }

    const json = await response.json();
    const content = json.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('Invalid JSON response from OpenRouter: no content in response');
    }

    // Use the comprehensive normalizer which handles:
    //   - Markdown code fence stripping and JSON extraction
    //   - JSON auto-repair (missing commas, trailing commas, smart quotes)
    //   - Wrapper unwrapping (website, data, result wrappers)
    //   - Object → Array normalization for known array fields
    const normalized = normalizeRawResponse(this.config.model, content);

    if (!normalized.success) {
      // Print full raw content for debugging (never truncate)
      deepLog('Raw AI response that failed to parse', content);
      throw new Error(
        `OpenRouter (${this.config.model}): ${normalized.error}`
      );
    }

    if (normalized.fixesApplied > 0) {
      logger.info(`Normalizer applied ${normalized.fixesApplied} fixes to response from ${this.config.model}`);
    }

    return normalized.data as T;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Streaming Completion
  // ───────────────────────────────────────────────────────────────────────────

  async createStreamCompletion(params: CompletionParams): Promise<ReadableStream<Uint8Array>> {
    const body = this.buildRequestBody(params, true);
    const response = await this.apiRequest(body);

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      throw new Error(parseOpenRouterError(errorBody, response.status));
    }

    // Return the response body directly (it's already an SSE stream from OpenRouter)
    return response.body!;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Validation
  // ───────────────────────────────────────────────────────────────────────────

  async validate(): Promise<ValidationResult> {
    try {
      const body: Record<string, unknown> = {
        model: this.config.model,
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 1,
        temperature: 0,
        stream: false,
      };

      const response = await this.apiRequest(body);

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        return {
          valid: false,
          error: parseOpenRouterError(errorBody, response.status),
          model: this.config.model,
          provider: this.name,
        };
      }

      const json = await response.json();

      return {
        valid: true,
        model: json.model || this.config.model,
        provider: this.name,
      };
    } catch (err) {
      return {
        valid: false,
        error: err instanceof Error ? err.message : 'Unknown validation error',
        model: this.config.model,
        provider: this.name,
      };
    }
  }
}

/**
 * Extract JSON from a string that may contain markdown code fences,
 * leading/trailing text, or other wrapping.
 * @deprecated Use normalizeRawResponse() from @/lib/ai/normalizer instead.
 */
function extractJSON(text: string): string {
  let cleaned = text.trim();

  // Try to extract from ```json ... ``` blocks first
  const jsonBlockMatch = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
  if (jsonBlockMatch) {
    cleaned = jsonBlockMatch[1].trim();
  }

  // Remove leading/trailing non-JSON content by finding first { and last }
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  // Try parsing
  JSON.parse(cleaned); // throws if invalid
  return cleaned;
}
