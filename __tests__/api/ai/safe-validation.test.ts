// =============================================================================
// Safe Validation Tests — v2
// =============================================================================
import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { safeValidate, withDefaults } from '@/lib/ai/safe-validation';
const ts = z.object({ name: z.string(), age: z.number(), tags: z.array(z.string()).default([]), meta: z.object({ d: z.string().optional().default(''), c: z.number().optional().default(0) }).optional().default({}) });
describe('Safe Validation', () => {
  it('passes valid data', () => { const r = safeValidate(ts, { name: 'A', age: 30, tags: ['x'] }); expect(r.success).toBe(true); expect(r.repairsApplied).toBe(0); });
  it('repairs null → []', () => { const r = safeValidate(z.object({ items: z.array(z.string()).default([]) }), { items: null }); expect(r.success).toBe(true); expect(r.data?.items).toEqual([]); });
  it('repairs null → {}', () => { const r = safeValidate(z.object({ c: z.object({k:z.string().optional()}).default({}) }), { c: null }); expect(r.success).toBe(true); expect(r.data?.c).toEqual({}); });
  it('injects defaults', () => { const r = safeValidate(ts, { name: 'A', age: 30 }); expect(r.success).toBe(true); expect(r.data?.tags).toEqual([]); });
  it('repairs null string', () => { const r = safeValidate(z.object({ t: z.string().default('') }), { t: null }); expect(r.success).toBe(true); expect(r.data?.t).toBe(''); });
  it('repairs null number', () => { const r = safeValidate(z.object({ c: z.number().default(0) }), { c: null }); expect(r.success).toBe(true); expect(r.data?.c).toBe(0); });
  it('recovers from multiple issues', () => { const schema = z.object({ t: z.string().default(''), c: z.number().default(0), items: z.array(z.string()).default([]), cfg: z.object({ e: z.boolean().default(false) }).default({}) }); const r = safeValidate(schema, { t: null, c: null, items: null, cfg: null }); expect(r.success).toBe(true); expect(r.data?.t).toBe(''); expect(r.data?.c).toBe(0); expect(r.data?.items).toEqual([]); expect(r.data?.cfg).toEqual({ e: false }); });
  it('withDefaults wraps safely', () => { const w = withDefaults(ts); const r = w.safeParse({ name: 'B', age: null }); expect(r.success).toBe(true); expect(r.data?.age).toBe(0); });
  it('fails on non-recoverable', () => { const w = withDefaults(z.object({ req: z.string() })); expect(() => w.parse({})).toThrow(); });
});
