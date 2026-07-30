// =============================================================================
// AI Generation Observability — v2
// =============================================================================
import { logger } from '@/lib/logger';
export type GenerationStage = 'brand'|'theme'|'pages'|'sections'|'seo'|'images'|'refinement'|'merge'|'save';
export type StageStatus = 'started'|'retrying'|'completed'|'failed'|'skipped';
export interface StageLog { stage: GenerationStage; status: StageStatus; message: string; durationMs?: number; attempt?: number; model?: string; provider?: string; tokensUsed?: {input:number;output:number}; repairsApplied?: number; validationPassed?: boolean; defaultsInjected?: number; error?: string; }
const BC = { service: 'ai-generation' };
export function logStageStart(s: GenerationStage, m?: Record<string,unknown>) { logger.info(`[${s.toUpperCase()}] ▶ Stage ${s}: Started`, {...BC, generationStage: s, stageStatus: 'started', ...m}); }
export function logStageRetry(s: GenerationStage, a: number, r: string, m?: Record<string,unknown>) { logger.warn(`[${s.toUpperCase()}] 🔄 Stage ${s}: Retry #${a} — ${r}`, {...BC, generationStage: s, stageStatus: 'retrying', attempt: a, retryReason: r, ...m}); }
export function logStageComplete(s: GenerationStage, d: {durationMs:number;model?:string;provider?:string;tokensUsed?:{input:number;output:number};repairsApplied?:number;validationPassed?:boolean;defaultsInjected?:number}) {
  const parts = [`[${s.toUpperCase()}] ✅ Stage ${s}: Completed`]; if(d.model) parts.push(`model=${d.model}`); if(d.tokensUsed) parts.push(`tokens=${d.tokensUsed.input}→${d.tokensUsed.output}`); if(d.repairsApplied!==undefined) parts.push(`repairs=${d.repairsApplied}`); parts.push(`validation=${d.validationPassed?'PASS':'WARN'}`);
  logger.info(parts.join(' | '), {...BC, generationStage: s, stageStatus: 'completed', durationMs: d.durationMs}); }
export function logStageFailed(s: GenerationStage, e: string, d?: {durationMs?:number;model?:string;attempt?:number;retriesExhausted?:boolean}) { logger.error(`[${s.toUpperCase()}] ❌ Stage ${s}: FAILED — ${e}`, {...BC, generationStage: s, stageStatus: 'failed', durationMs: d?.durationMs, stageError: e}); }
export function logStageSkipped(s: GenerationStage, r: string) { logger.info(`[${s.toUpperCase()}] ⏭ Stage ${s}: Skipped — ${r}`, {...BC, generationStage: s, stageStatus: 'skipped', skipReason: r}); }
export function generatePipelineSummary(logs: StageLog[]): string {
  const c = logs.filter(l=>l.status==='completed').length, f = logs.filter(l=>l.status==='failed').length, s = logs.filter(l=>l.status==='skipped').length;
  const td = logs.filter(l=>l.durationMs!==undefined).reduce((a,l)=>a+(l.durationMs||0),0), mu = [...new Set(logs.filter(l=>l.model).map(l=>l.model))];
  return [`═══ Generation Pipeline Summary ═══`,`Stages: ${c} completed, ${f} failed, ${s} skipped`,`Total: ${td}ms`,`Models: ${mu.join(', ')||'N/A'}`,...logs.map(l=>`  ${l.status==='completed'?'✅':l.status==='failed'?'❌':l.status==='skipped'?'⏭':'🔄'} ${l.stage}: ${l.message}${l.durationMs?` (${l.durationMs}ms)`:''}`),`═══ End ═══`].join('\n');
}
