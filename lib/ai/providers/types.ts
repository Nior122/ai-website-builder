// =============================================================================
// AI Provider Types & Interfaces
// =============================================================================
// Defines the contract all AI providers must implement. Each provider
// (OpenRouter, Anthropic, OpenAI, Groq, etc.) implements the AIProvider
// interface. The factory in index.ts resolves the correct provider from
// environment configuration.
// =============================================================================

/** Runtime configuration for any AI provider. */
export interface AIProviderConfig {
  apiKey: string;
  baseURL: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

/** A single message in a chat completion. OpenAI-compatible format. */
export interface CompletionMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/** Parameters for a text completion request. */
export interface CompletionParams {
  messages: CompletionMessage[];
  system?: string;
  maxTokens?: number;
  temperature?: number;
}

/** Parameters for a structured JSON completion. */
export interface StructuredCompletionParams extends CompletionParams {
  schema: Record<string, unknown>;
}

/** Result of a text completion. */
export interface CompletionResult {
  content: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
  model?: string;
}

/** Result of validating a provider config (API key + model). */
export interface ValidationResult {
  valid: boolean;
  error?: string;
  model?: string;
  provider?: string;
}

/**
 * Every AI provider must implement this interface.
 * Methods use OpenAI-compatible message format. Providers translate
 * to their native format internally.
 */
export interface AIProvider {
  /** Human-readable provider name (e.g. "openrouter", "anthropic"). */
  readonly name: string;

  /** Text completion. */
  createCompletion(params: CompletionParams): Promise<CompletionResult>;

  /** Structured JSON completion — returns parsed object matching schema. */
  createStructuredCompletion<T>(params: StructuredCompletionParams): Promise<T>;

  /** Streaming completion — returns raw SSE ReadableStream. */
  createStreamCompletion(params: CompletionParams): Promise<ReadableStream<Uint8Array>>;

  /** Validate API key + model by making a minimal request. */
  validate(): Promise<ValidationResult>;
}
