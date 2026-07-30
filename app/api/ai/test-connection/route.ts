// =============================================================================
// POST /api/ai/test-connection
// =============================================================================
// Tests the AI provider connection with the current env configuration or
// optionally with provided overrides. Returns success/failure with details.
//
// This is a lightweight validation endpoint that sends a 1-token prompt
// to verify the API key, base URL, and model are functioning.
// =============================================================================

import { type NextRequest, NextResponse } from 'next/server';
import { createProviderWithConfig, getAIProviderConfig } from '@/lib/ai/providers';
import { logger } from '@/lib/logger';

const LOG = { route: 'POST /api/ai/test-connection' } as const;

export async function POST(request: NextRequest) {
  try {
    // ── Parse optional override body ────────────────────────────────
    let body: Record<string, unknown> = {};
    try {
      body = await request.json();
    } catch {
      // No body — use current env config
    }

    const providerName = (body.provider as string) || process.env.AI_PROVIDER || 'openrouter';
    const apiKey = (body.apiKey as string) || process.env.OPENROUTER_API_KEY || process.env.ANTHROPIC_API_KEY || '';
    const baseURL = (body.baseURL as string) || process.env.AI_BASE_URL || '';
    const model = (body.model as string) || process.env.OPENROUTER_MODEL || process.env.AI_MODEL || 'openrouter/free';
    const temperature = parseFloat((body.temperature as string) || '0.7');
    const maxTokens = parseInt((body.maxTokens as string) || '1', 10);

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'OpenRouter API key is missing. Set OPENROUTER_API_KEY in your environment.',
        provider: providerName,
      }, { status: 400 });
    }

    // ── Create provider and validate ─────────────────────────────────
    const config = { apiKey, baseURL, model, temperature, maxTokens };
    const provider = await createProviderWithConfig(config, providerName);

    logger.info('Testing AI connection: provider=' + providerName + ' model=' + model);

    const result = await provider.validate();

    if (result.valid) {
      logger.info('AI connection test SUCCEEDED: model=' + model);
      return NextResponse.json({
        success: true,
        model: result.model,
        provider: result.provider,
      });
    }

    logger.warn('AI connection test FAILED: ' + result.error);
    return NextResponse.json({
      success: false,
      error: result.error,
      model: result.model,
      provider: result.provider,
    }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error('Test connection handler error: ' + message, LOG);
    return NextResponse.json({
      success: false,
      error: message,
    }, { status: 500 });
  }
}
