// =============================================================================
// JSON Repair Engine Tests — v2
// =============================================================================
import { describe, it, expect } from 'vitest';
import { repairAndParse, looksLikeJSON } from '@/lib/ai/json-repair-engine';
describe('JSON Repair Engine', () => {
  it('parses valid JSON', () => { expect(repairAndParse('{"a":1}').success).toBe(true); });
  it('strips markdown fences', () => { const r = repairAndParse('```json\n{"a":1}\n```'); expect(r.success).toBe(true); expect(r.data).toEqual({a:1}); });
  it('removes trailing commas', () => { const r = repairAndParse('{"a":1,"b":2,}'); expect(r.success).toBe(true); expect(r.data).toEqual({a:1,b:2}); });
  it('converts undefined to null', () => { const r = repairAndParse('{"a":undefined}'); expect(r.success).toBe(true); expect(r.data).toEqual({a:null}); });
  it('converts None to null', () => { const r = repairAndParse('{"a":None}'); expect(r.success).toBe(true); expect(r.data).toEqual({a:null}); });
  it('repairs truncated objects', () => { const r = repairAndParse('{"a":1'); expect(r.success).toBe(true); expect(r.data).toEqual({a:1}); });
  it('repairs deeply nested truncation', () => { const r = repairAndParse('{"outer":{"inner":{"a":1}'); expect(r.success).toBe(true); expect(r.data).toEqual({outer:{inner:{a:1}}}); });
  it('extracts JSON from surrounding text', () => { const r = repairAndParse('Here: {"b":{"n":"Acme"}}\nThanks!'); expect(r.success).toBe(true); expect(r.data).toEqual({b:{n:'Acme'}}); });
  it('fixes smart quotes', () => { const r = repairAndParse('{"n":"\u201CTest\u201D"}'); expect(r.success).toBe(true); expect(r.data).toEqual({n:'Test'}); });
  it('fixes single quotes', () => { const r = repairAndParse("{'a':'b'}"); expect(r.success).toBe(true); expect(r.data).toEqual({a:'b'}); });
  it('removes duplicate commas', () => { const r = repairAndParse('{"a":1,, "b":2}'); expect(r.success).toBe(true); expect(r.data).toEqual({a:1,b:2}); });
  it('repairs unquoted property names', () => { const r = repairAndParse('{a:1}'); expect(r.success).toBe(true); expect(r.data).toEqual({a:1}); });
  it('removes comments', () => { const r = repairAndParse('{"a":1//x\n}'); expect(r.success).toBe(true); expect(r.data).toEqual({a:1}); });
  it('fails on empty input', () => { expect(repairAndParse('').success).toBe(false); });
  it('cumulative repairs for complex malformed JSON', () => { const r = repairAndParse('{"n":"\u201CAcme\u201D,"v":[1,2,3,], "o":{"a":1'); expect(r.success).toBe(true); expect(r.repairsApplied).toBeGreaterThan(2); });
  it('looksLikeJSON', () => { expect(looksLikeJSON('{"a":1}')).toBe(true); expect(looksLikeJSON('hello')).toBe(false); });
});
