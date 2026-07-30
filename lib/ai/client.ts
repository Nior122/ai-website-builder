// =============================================================================
// AI Provider Client
// =============================================================================
// Central AI client that delegates to the configured provider (OpenRouter by
// default). All AI generation flows through this module.
//
// Consumers (generation.ts, refine/route.ts, blog/refinement.service.ts)
// import from this file — no import changes needed.
// =============================================================================

import type { AIProvider } from './providers';
import { getAIProvider, getAIProviderConfig } from './providers';

// Re-export for backward compatibility
export { getAIProvider } from './providers';

/**
 * Create a chat completion with streaming.
 * Returns a ReadableStream of SSE bytes from the configured provider.
 */
export async function createStreamCompletion(params: {
  messages: { role: string; content: string }[];
  system?: string;
  maxTokens?: number;
  temperature?: number;
}): Promise<ReadableStream<Uint8Array>> {
  const provider = await getAIProvider();
  const config = getAIProviderConfig();

  return provider.createStreamCompletion({
    messages: params.messages.map(m => ({ role: m.role as 'user' | 'assistant' | 'system', content: m.content })),
    system: params.system,
    maxTokens: params.maxTokens || config.maxTokens,
    temperature: params.temperature ?? config.temperature,
  });
}

/**
 * Create a structured JSON completion.
 * Returns parsed output matching the schema.
 */
export async function createStructuredCompletion<T>(params: {
  messages: { role: string; content: string }[];
  system?: string;
  schema: Record<string, unknown>;
  maxTokens?: number;
}): Promise<T> {
  const provider = await getAIProvider();
  const config = getAIProviderConfig();

  return provider.createStructuredCompletion<T>({
    messages: params.messages.map(m => ({ role: m.role as 'user' | 'assistant' | 'system', content: m.content })),
    system: params.system,
    schema: params.schema,
    maxTokens: params.maxTokens || config.maxTokens,
    temperature: config.temperature,
  });
}

/**
 * Estimate token cost using approximate pricing.
 * Provider-specific pricing can be added later.
 */
export function estimateTokenCost(inputTokens: number, outputTokens: number): number {
  const inputCostPerToken = 3 / 1_000_000;
  const outputCostPerToken = 15 / 1_000_000;
  return inputTokens * inputCostPerToken + outputTokens * outputCostPerToken;
}
