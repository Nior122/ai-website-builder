// =============================================================================
// AI Provider Factory
// =============================================================================
// Resolves and caches the correct AI provider from environment configuration.
// The singleton mirrors the old globalForAnthropic pattern, ensuring a single
// provider instance per process.
// =============================================================================

import type { AIProvider, AIProviderConfig } from './types';

export type { AIProvider, AIProviderConfig } from './types';
export type {
  CompletionParams,
  StructuredCompletionParams,
  CompletionMessage,
  CompletionResult,
  ValidationResult,
} from './types';

/**
 * Read provider configuration from environment variables.
 * Resolution order:
 *   1. AI_PROVIDER env var → which provider class to use ('openrouter' | 'anthropic')
 *   2. OPENROUTER_API_KEY → preferred; falls back to ANTHROPIC_API_KEY for backwards compat
 *   3. Model: OPENROUTER_MODEL → AI_MODEL → fallback per provider
 *
 * IMPORTANT: NO hardcoded model IDs in source code. Every AI request reads
 * from the environment configuration. Users change the model by editing
 * .env.local and restarting — zero code changes needed.
 *
 * Supported env vars:
 *   AI_PROVIDER          openrouter | anthropic
 *   OPENROUTER_API_KEY   sk-or-v1-...
 *   OPENROUTER_MODEL     openrouter/free | openai/gpt-4o-mini | ...
 *   OPENROUTER_FALLBACK_MODELS  comma-separated list for retry on failure
 */
export function getAIProviderConfig(): AIProviderConfig {
  const provider = process.env.AI_PROVIDER || 'openrouter';

  // API key resolution: try OpenRouter first, then fall back to Anthropic key
  const apiKey =
    process.env.OPENROUTER_API_KEY ||
    process.env.ANTHROPIC_API_KEY ||
    process.env.OPENAI_API_KEY ||
    '';

  // Base URL resolution
  const baseURL =
    process.env.AI_BASE_URL ||
    (provider === 'openrouter' ? 'https://openrouter.ai/api/v1' : '') ||
    process.env.ANTHROPIC_BASE_URL ||
    '';

  // Model resolution: OPENROUTER_MODEL → AI_MODEL → provider-specific default.
  // NEVER hardcode model IDs in source files.
  let model: string;
  if (provider === 'openrouter') {
    model = process.env.OPENROUTER_MODEL || process.env.AI_MODEL || 'openrouter/free';
  } else {
    model = process.env.AI_MODEL || 'claude-sonnet-4-20250514';
  }

  const temperature = parseFloat(process.env.AI_TEMPERATURE || '0.7');
  const maxTokens = parseInt(process.env.AI_MAX_TOKENS || '8192', 10);

  return { apiKey, baseURL, model, temperature, maxTokens };
}

// ─── Singleton ──────────────────────────────────────────────────────────────

let _provider: AIProvider | null = null;

/**
 * Get the configured AI provider (singleton).
 * Lazily resolves on first call — no provider is instantiated until needed.
 */
export async function getAIProvider(): Promise<AIProvider> {
  if (_provider) return _provider;

  const config = getAIProviderConfig();
  const providerName = process.env.AI_PROVIDER || 'openrouter';

  _provider = await createProviderWithConfig(config, providerName);
  return _provider;
}

/**
 * Create a new provider with the given config, bypassing the singleton cache.
 * Useful for test-connection or fallback scenarios.
 */
export async function createProviderWithConfig(
  config: AIProviderConfig,
  providerName?: string
): Promise<AIProvider> {
  const name = providerName || process.env.AI_PROVIDER || 'openrouter';

  if (name === 'anthropic') {
    const { AnthropicProvider } = await import('./anthropic');
    return new AnthropicProvider(config);
  }

  // Default: OpenRouter
  const { OpenRouterProvider } = await import('./openrouter');
  return new OpenRouterProvider(config);
}

/**
 * Reset the provider singleton (for testing or config changes).
 */
export function resetProvider(): void {
  _provider = null;
}
