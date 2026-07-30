// =============================================================================
// Resilience Tests — v2
// =============================================================================
import { describe, it, expect, beforeAll } from 'vitest';
describe('Redis', () => {
  beforeAll(() => { delete process.env.REDIS_URL; });
  it('degrades gracefully', async () => { const { isRedisAvailable, isDegradedMode } = await import('@/lib/redis/resilient-client'); expect(isRedisAvailable()).toBe(false); expect(isDegradedMode()).toBe(true); });
  it('safeGet returns null', async () => { const { safeGet } = await import('@/lib/redis/resilient-client'); expect(await safeGet('k')).toBeNull(); });
  it('safeSet does not throw', async () => { const { safeSet } = await import('@/lib/redis/resilient-client'); await expect(safeSet('k','v')).resolves.toBeUndefined(); });
});
describe('Prisma', () => {
  it('does not retry non-retryable', async () => { const { withRetry } = await import('@/lib/prisma/resilient-client'); let a=0; const e=new Error('Unique'); (e as any).code='P2002'; await expect(withRetry(async()=>{a++;throw e},{maxRetries:3})).rejects.toThrow(); expect(a).toBe(1); });
  it('retries transient errors', async () => { const { withRetry } = await import('@/lib/prisma/resilient-client'); let a=0; await expect(withRetry(async()=>{a++;if(a<3){const e=new Error('Terminated');(e as any).code='P1017';throw e}return 'ok'},{maxRetries:3})).resolves.toBe('ok'); expect(a).toBe(3); });
  it('exhausts retries', async () => { const { withRetry } = await import('@/lib/prisma/resilient-client'); let a=0; await expect(withRetry(async()=>{a++;const e=new Error('Refused');(e as any).code='P1001';throw e},{maxRetries:2})).rejects.toThrow(); expect(a).toBe(3); });
});
describe('Observability', () => {
  it('logs do not throw', async () => { const { logStageStart, logStageComplete, logStageFailed } = await import('@/lib/ai/observability'); expect(() => { logStageStart('brand'); logStageComplete('brand',{durationMs:1000,validationPassed:true}); logStageFailed('sections','err'); }).not.toThrow(); });
  it('pipeline summary', async () => { const { generatePipelineSummary } = await import('@/lib/ai/observability'); const s=generatePipelineSummary([{stage:'brand',status:'completed',message:'OK',durationMs:1000},{stage:'seo',status:'failed',message:'Err',durationMs:500}] as any); expect(s).toContain('1 completed'); expect(s).toContain('1 failed'); });
});
