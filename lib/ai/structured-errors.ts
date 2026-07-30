// =============================================================================
// Structured Error Classes — v2
// =============================================================================
import { logger } from '@/lib/logger';
export interface AIErrorContext { stage?: string; provider?: string; model?: string; elapsedMs?: number; retryCount?: number; requestId?: string; projectId?: string; userId?: string; recoveryAttempted?: boolean; [key: string]: unknown; }
export class AIBaseError extends Error {
  public readonly stage: string; public readonly provider?: string; public readonly model?: string;
  public readonly elapsedMs?: number; public readonly retryCount: number; public readonly requestId?: string;
  public readonly projectId?: string; public readonly userId?: string; public readonly recoveryAttempted: boolean; public readonly timestamp: string;
  constructor(message: string, context: AIErrorContext = {}) {
    super(message); this.name = 'AIBaseError'; this.stage = context.stage||'unknown'; this.provider = context.provider; this.model = context.model;
    this.elapsedMs = context.elapsedMs; this.retryCount = context.retryCount??0; this.requestId = context.requestId; this.projectId = context.projectId;
    this.userId = context.userId; this.recoveryAttempted = context.recoveryAttempted??false; this.timestamp = new Date().toISOString();
    Error.captureStackTrace?.(this, this.constructor);
    logger.error(`[${this.stage}] ${this.name}: ${message}`, { errorType: this.name, stage: this.stage, provider: this.provider, model: this.model, elapsedMs: this.elapsedMs, retryCount: this.retryCount, requestId: this.requestId, projectId: this.projectId, userId: this.userId, recoveryAttempted: this.recoveryAttempted });
  }
  toJSON() { return { name: this.name, message: this.message, stage: this.stage, provider: this.provider, model: this.model, elapsedMs: this.elapsedMs, retryCount: this.retryCount, requestId: this.requestId, projectId: this.projectId, userId: this.userId, recoveryAttempted: this.recoveryAttempted, timestamp: this.timestamp }; }
}
export class AIParseError extends AIBaseError { constructor(d: string, c: AIErrorContext={}) { super(`Failed to parse AI response: ${d}`, {...c,stage:c.stage||'parse'}); this.name='AIParseError'; } }
export class JSONRepairError extends AIBaseError { public rawPreview: string; public repairsAttempted: string[]; constructor(d: string, r: string, ra: string[], c: AIErrorContext={}) { super(`JSON repair failed: ${d}`, {...c,stage:c.stage||'repair'}); this.name='JSONRepairError'; this.rawPreview=r; this.repairsAttempted=ra; } }
export class ModelTimeoutError extends AIBaseError { constructor(t: number, c: AIErrorContext={}) { super(`Model timed out after ${t}ms`, {...c,stage:c.stage||'generation',elapsedMs:t}); this.name='ModelTimeoutError'; } }
export class ModelUnavailableError extends AIBaseError { constructor(m: string, r: string, c: AIErrorContext={}) { super(`Model "${m}" unavailable: ${r}`, {...c,stage:c.stage||'generation',model:m}); this.name='ModelUnavailableError'; } }
export class ModelRateLimitedError extends AIBaseError { public retryAfterMs: number; constructor(r: number, c: AIErrorContext={}) { super(`Rate limited. Retry after ${r}ms`, {...c,stage:c.stage||'generation'}); this.name='ModelRateLimitedError'; this.retryAfterMs=r; } }
export class ModelContextLengthError extends AIBaseError { public usedTokens: number; public maxTokens: number; constructor(u: number, m: number, c: AIErrorContext={}) { super(`Context length exceeded: ${u}/${m} tokens`, {...c,stage:c.stage||'generation'}); this.name='ModelContextLengthError'; this.usedTokens=u; this.maxTokens=m; } }
export class AllModelsFailedError extends AIBaseError { public failedModels: Array<{model:string;error:string}>; constructor(f: Array<{model:string;error:string}>, c: AIErrorContext={}) { super(`All ${f.length} model(s) failed: ${f.map(x=>x.model).join(', ')}`, {...c,stage:c.stage||'generation'}); this.name='AllModelsFailedError'; this.failedModels=f; } }
export class ValidationError extends AIBaseError { public issues: Array<{path:string;message:string;code:string}>; constructor(i: Array<{path:string;message:string;code:string}>, c: AIErrorContext={}) { super(`Validation failed with ${i.length} issue(s): ${i[0]?.message}`, {...c,stage:c.stage||'validation'}); this.name='ValidationError'; this.issues=i; } }
export class GenerationStageError extends AIBaseError { public stageName: string; public cause?: string; constructor(s: string, c: string, ctx: AIErrorContext={}) { super(`Stage "${s}" failed: ${c}`, {...ctx,stage:s}); this.name='GenerationStageError'; this.stageName=s; this.cause=c; } }
export class DatabaseReconnectError extends AIBaseError { public retryAttempt: number; public maxRetries: number; constructor(r: number, m: number, o: string, c: AIErrorContext={}) { super(`Database reconnection failed after ${r}/${m} attempts: ${o}`, {...c,stage:c.stage||'database'}); this.name='DatabaseReconnectError'; this.retryAttempt=r; this.maxRetries=m; } }
export class RedisUnavailableError extends AIBaseError { constructor(op: string, c: AIErrorContext={}) { super(`Redis unavailable during "${op}" — degraded mode`, {...c,stage:c.stage||'cache',recoveryAttempted:true}); this.name='RedisUnavailableError'; } }
