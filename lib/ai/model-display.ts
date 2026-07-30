// =============================================================================
// Model Display Utilities — v2
// =============================================================================
// NEVER hardcode "ChatGPT 4o Mini" — all display names come from model IDs.
// =============================================================================
import { getModelManager } from './model-manager';
export function getProviderDisplayName(modelId: string): string {
  if (!modelId) return 'Unknown'; const p = modelId.split('/')[0]?.toLowerCase()||'';
  const map: Record<string,string> = { openai:'OpenAI', openrouter:'OpenRouter', anthropic:'Anthropic', google:'Google', meta:'Meta', mistral:'Mistral', cohere:'Cohere', deepseek:'DeepSeek', qwen:'Qwen', '01-ai':'01.AI', together:'Together AI', perplexity:'Perplexity', replicate:'Replicate', 'x-ai':'xAI', grok:'xAI', llama:'Meta', claude:'Anthropic', gemini:'Google', gpt:'OpenAI' };
  return map[p] || modelId.split('/')[0] || 'AI Model';
}
export function getShortModelName(modelId: string): string {
  if (!modelId) return 'Unknown'; const parts = modelId.split('/'); return parts.length >= 2 ? parts.slice(1).join('/') : modelId;
}
export function getActiveModelDisplay(): { provider: string; model: string; shortName: string; displayName: string } {
  try { const mm = getModelManager(); const info = mm.getActiveModelInfo(); const pd = getProviderDisplayName(info.model); const sn = getShortModelName(info.model); return { provider: info.provider, model: info.model, shortName: sn, displayName: `${pd} — ${sn}` }; }
  catch { return { provider: 'unknown', model: 'unknown', shortName: 'Unknown', displayName: 'AI Model' }; }
}
export function formatModelInfo(modelId: string|undefined|null): string {
  if (!modelId) return 'AI Model'; return `${getProviderDisplayName(modelId)} — ${getShortModelName(modelId)}`;
}
