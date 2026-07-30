// =============================================================================
// Model Manager — v2
// =============================================================================
import { logger } from '@/lib/logger';
import { createProviderWithConfig, getAIProviderConfig } from './providers';
import type { AIProvider, AIProviderConfig } from './providers/types';
import { AllModelsFailedError, type AIErrorContext } from './structured-errors';
const LOG = { service: 'model-manager' } as const;
export interface ModelConfig { provider: string; model: string; baseURL?: string; apiKey?: string; maxTokens: number; temperature: number; timeoutMs: number; }
export interface ModelCallResult<T> { success: boolean; data?: T; model: string; provider: string; latencyMs: number; tokensUsed?: { input: number; output: number }; error?: string; }
export interface ModelHealth { model: string; provider: string; healthy: boolean; lastChecked: number; lastError?: string; consecutiveFailures: number; totalCalls: number; totalFailures: number; avgLatencyMs: number; }
export interface CompletionCallParams { messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>; system?: string; schema?: Record<string, unknown>; maxTokens?: number; temperature?: number; stage?: string; }
export class ModelManager {
  private primaryConfig: ModelConfig; private fallbackConfigs: ModelConfig[]; private healthCache: Map<string, ModelHealth> = new Map();
  private availabilityCache: Map<string, { available: boolean; expiresAt: number }> = new Map();
  private readonly healthCacheTTLMs = 5 * 60 * 1000; private readonly availabilityCacheTTLMs = 2 * 60 * 1000;
  constructor() {
    const envConfig = getAIProviderConfig(); const provider = process.env.AI_PROVIDER || 'openrouter';
    this.primaryConfig = { provider, model: envConfig.model, baseURL: envConfig.baseURL, apiKey: envConfig.apiKey, maxTokens: envConfig.maxTokens, temperature: envConfig.temperature, timeoutMs: parseInt(process.env.AI_TIMEOUT_MS || '120000', 10) };
    const fallbackModels = (process.env.OPENROUTER_FALLBACK_MODELS || '').split(',').map(m => m.trim()).filter(Boolean);
    this.fallbackConfigs = fallbackModels.map(m => ({ ...this.primaryConfig, model: m, timeoutMs: parseInt(process.env.AI_FALLBACK_TIMEOUT_MS || '180000', 10) }));
    logger.info(`ModelManager initialized: primary=${this.primaryConfig.model} (${provider}) with ${this.fallbackConfigs.length} fallback(s)`, LOG);
  }
  getPrimaryConfig(): ModelConfig { return { ...this.primaryConfig }; }
  getAllConfigs(): ModelConfig[] { return [this.primaryConfig, ...this.fallbackConfigs]; }
  getActiveModelInfo(): { provider: string; model: string } { return { provider: this.primaryConfig.provider, model: this.primaryConfig.model }; }
  async isModelAvailable(config: ModelConfig): Promise<boolean> {
    const ck = `${config.provider}:${config.model}`; const cached = this.availabilityCache.get(ck);
    if (cached && cached.expiresAt > Date.now()) return cached.available;
    const health = this.healthCache.get(ck);
    if (health && health.consecutiveFailures >= 3 && Date.now() - health.lastChecked < this.healthCacheTTLMs) { this.availabilityCache.set(ck, { available: false, expiresAt: Date.now() + this.availabilityCacheTTLMs }); return false; }
    try { const p = await this.createProvider(config); const v = await p.validate(); this.availabilityCache.set(ck, { available: v.valid, expiresAt: Date.now() + this.availabilityCacheTTLMs }); return v.valid; } catch { return false; }
  }
  async executeWithFallback<T>(params: CompletionCallParams, context: AIErrorContext = {}): Promise<ModelCallResult<T>> {
    const failed: Array<{ model: string; error: string }> = []; const allConfigs = this.getAllConfigs(); const st = Date.now();
    const pr = await this.tryModel<T>(this.primaryConfig, params, context); if (pr.success) return pr;
    failed.push({ model: this.primaryConfig.model, error: pr.error || 'Unknown' });
    for (const fb of this.fallbackConfigs) { if (!await this.isModelAvailable(fb)) { failed.push({ model: fb.model, error: 'Unavailable' }); continue; } const fr = await this.tryModel<T>(fb, params, { ...context, retryCount: (context.retryCount ?? 0) + 1 }); if (fr.success) return fr; failed.push({ model: fb.model, error: fr.error || 'Unknown' }); }
    throw new AllModelsFailedError(failed, { ...context, elapsedMs: Date.now() - st });
  }
  private async tryModel<T>(config: ModelConfig, params: CompletionCallParams, context: AIErrorContext): Promise<ModelCallResult<T>> {
    const st = Date.now(); const ck = `${config.provider}:${config.model}`; let lastError: Error | null = null; const maxR = parseInt(process.env.AI_RETRY_COUNT || '2', 10);
    for (let att = 0; att <= maxR; att++) {
      try { const p = await this.createProvider(config); let r: T; if (params.schema) { r = await p.createStructuredCompletion<T>({ messages: params.messages, system: params.system, schema: params.schema as Record<string, unknown>, maxTokens: params.maxTokens || config.maxTokens }); } else { const cr = await p.createCompletion({ messages: params.messages, system: params.system, maxTokens: params.maxTokens || config.maxTokens, temperature: params.temperature ?? config.temperature }); r = cr.content as unknown as T; }
        return { success: true, data: r, model: config.model, provider: config.provider, latencyMs: Date.now() - st };
      } catch (err) { lastError = err instanceof Error ? err : new Error(String(err)); if (att < maxR) await sleep(Math.min(1000 * Math.pow(2, att), 10000)); }
    }
    return { success: false, model: config.model, provider: config.provider, latencyMs: Date.now() - st, error: lastError?.message || 'Max retries exceeded' };
  }
  private async createProvider(config: ModelConfig): Promise<AIProvider> { return createProviderWithConfig({ apiKey: config.apiKey || this.primaryConfig.apiKey || '', baseURL: config.baseURL || this.primaryConfig.baseURL || '', model: config.model, temperature: config.temperature ?? this.primaryConfig.temperature, maxTokens: config.maxTokens ?? this.primaryConfig.maxTokens }, config.provider); }
}
let _mm: ModelManager | null = null; export function getModelManager(): ModelManager { if (!_mm) _mm = new ModelManager(); return _mm; } export function resetModelManager(): void { _mm = null; }
function sleep(ms: number): Promise<void> { return new Promise(r => setTimeout(r, ms)); }
