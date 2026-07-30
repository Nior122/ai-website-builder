// =============================================================================
// Model Manager Tests — v2
// =============================================================================
import { describe, it, expect, beforeEach } from 'vitest';
import { ModelManager, resetModelManager, getModelManager } from '@/lib/ai/model-manager';
describe('ModelManager', () => {
  beforeEach(() => { resetModelManager(); process.env.AI_PROVIDER='openrouter'; process.env.OPENROUTER_MODEL='openrouter/free'; process.env.OPENROUTER_API_KEY='sk-test'; process.env.OPENROUTER_FALLBACK_MODELS='openai/gpt-4o-mini,google/gemini-2.0-flash-001'; });
  it('initializes from env', () => { expect(new ModelManager().getPrimaryConfig().model).toBe('openrouter/free'); });
  it('reads fallbacks', () => { expect(new ModelManager().getAllConfigs()).toHaveLength(3); });
  it('handles empty fallbacks', () => { process.env.OPENROUTER_FALLBACK_MODELS=''; expect(new ModelManager().getAllConfigs()).toHaveLength(1); });
  it('singleton', () => { expect(getModelManager()).toBe(getModelManager()); });
  it('reset creates new', () => { const m1 = getModelManager(); resetModelManager(); expect(m1).not.toBe(getModelManager()); });
  it('active model info', () => { const m = new ModelManager(); expect(m.getActiveModelInfo().model).toBe('openrouter/free'); });
  it('fallback order', () => { const c = new ModelManager().getAllConfigs(); expect(c[0].model).toBe('openrouter/free'); expect(c[1].model).toBe('openai/gpt-4o-mini'); });
});
