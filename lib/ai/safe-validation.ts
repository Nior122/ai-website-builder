// =============================================================================
// Safe Validation Layer — v2
// =============================================================================
import { z, type ZodType, type ZodError } from 'zod';
import { logger } from '@/lib/logger';
import { getDefaultValue, type DefaultValuePath } from './defaults';
const LOG = { service: 'safe-validation' } as const;

export interface SafeValidationResult<T> { success: boolean; data?: T; error?: string; repairsApplied: number; repairedPaths: string[]; defaultsApplied: number; defaultPaths: string[]; originalIssues?: Array<{ path: string; message: string; code: string }>; }

export function safeValidate<T>(schema: ZodType<T>, data: unknown, options: { defaultBasePath?: string; maxRepairAttempts?: number; verbose?: boolean } = {}): SafeValidationResult<T> {
  const maxAttempts = options.maxRepairAttempts ?? 3;
  const verbose = options.verbose ?? false;
  const result1 = schema.safeParse(data);
  if (result1.success) return { success: true, data: result1.data, repairsApplied: 0, repairedPaths: [], defaultsApplied: 0, defaultPaths: [] };
  const issues = extractIssues(result1.error);
  if (verbose) logger.warn(`Safe validation: Initial parse failed with ${issues.length} issues`, { ...LOG, issues: issues.slice(0,5) });
  const repairedData = attemptRepair(data, issues, options.defaultBasePath);
  const result2 = schema.safeParse(repairedData);
  if (result2.success) { const a = countDifferences(data, repairedData); if (verbose) logger.info(`Safe validation: Repair succeeded — ${a} fields fixed`, LOG); return { success: true, data: result2.data, repairsApplied: a, repairedPaths: getChangedPaths(data, repairedData), defaultsApplied: 0, defaultPaths: [] }; }
  const issues2 = extractIssues(result2.error);
  const defaultedData = injectDefaults(repairedData, issues2, options.defaultBasePath);
  const result3 = schema.safeParse(defaultedData);
  if (result3.success) { const a = countDifferences(data, repairedData); const b = countDifferences(repairedData, defaultedData); return { success: true, data: result3.data, repairsApplied: a, repairedPaths: getChangedPaths(data, repairedData), defaultsApplied: b, defaultPaths: getChangedPaths(repairedData, defaultedData) }; }
  const finalIssues = extractIssues(result3.error);
  return { success: false, error: `Validation failed after ${maxAttempts} attempts: ${finalIssues[0]?.message || 'Unknown'}`, repairsApplied: countDifferences(data, repairedData), repairedPaths: getChangedPaths(data, repairedData), defaultsApplied: countDifferences(repairedData, defaultedData), defaultPaths: getChangedPaths(repairedData, defaultedData), originalIssues: finalIssues };
}

function attemptRepair(data: unknown, issues: Array<{ path: string; message: string; code: string }>, defaultBasePath?: string): unknown {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) return data ?? {};
  const result = JSON.parse(JSON.stringify(data)) as Record<string, unknown>; let changed = false;
  for (const issue of issues) {
    const pathParts = issue.path.split('.').filter(Boolean);
    if (issue.code === 'invalid_type') {
      if (issue.message.toLowerCase().includes('expected array') && issue.message.toLowerCase().includes('received null')) { setNested(result, pathParts, []); changed = true; }
      else if (issue.message.toLowerCase().includes('expected object') && issue.message.toLowerCase().includes('received null')) { setNested(result, pathParts, {}); changed = true; }
      else if (issue.message.toLowerCase().includes('expected string') && (issue.message.toLowerCase().includes('received null') || issue.message.toLowerCase().includes('received undefined'))) { setNested(result, pathParts, ''); changed = true; }
      else if (issue.message.toLowerCase().includes('expected number') && (issue.message.toLowerCase().includes('received null') || issue.message.toLowerCase().includes('received undefined'))) { setNested(result, pathParts, 0); changed = true; }
      else if (issue.message.toLowerCase().includes('expected boolean') && (issue.message.toLowerCase().includes('received null') || issue.message.toLowerCase().includes('received undefined'))) { setNested(result, pathParts, false); changed = true; }
    }
    if (issue.code === 'invalid_enum_value') { const match = issue.message.match(/Expected\s+'([^']+)'/); if (match) { setNested(result, pathParts, match[1]); changed = true; } }
  }
  return changed ? result : data;
}
function injectDefaults(data: unknown, issues: Array<{ path: string; message: string; code: string }>, defaultBasePath?: string): unknown {
  if (typeof data !== 'object' || data === null) return data ?? {};
  const result = JSON.parse(JSON.stringify(data)) as Record<string, unknown>; let changed = false;
  for (const issue of issues) { const dv = getDefaultValue(issue.path as DefaultValuePath); if (dv !== undefined) { setNested(result, issue.path.split('.').filter(Boolean), dv); changed = true; } }
  const arrayDefaults = [{p:'pages',k:'pages'},{p:'sections',k:'sections'},{p:'images',k:'images'},{p:'features',k:'features'},{p:'testimonials',k:'testimonials'},{p:'items',k:'items'},{p:'members',k:'members'},{p:'plans',k:'plans'},{p:'links',k:'links'},{p:'values',k:'values'},{p:'keywords',k:'keywords'},{p:'animations',k:'animations'}];
  for (const {p,k} of arrayDefaults) { const pp = p.split('.'); const c = getNested(result, pp.slice(0,-1)); if (c && typeof c === 'object' && !Array.isArray(c)) { if (!(k in c) || (c as any)[k] === null || (c as any)[k] === undefined) { (c as Record<string, unknown>)[k] = []; changed = true; } } }
  return changed ? result : data;
}
function extractIssues(error: ZodError) { return error.issues.map(i => ({ path: i.path.join('.'), message: i.message, code: i.code })); }
function getNested(obj: Record<string, unknown>, path: string[]): unknown { let c: unknown = obj; for (const k of path) { if (c && typeof c === 'object' && k in (c as Record<string, unknown>)) c = (c as Record<string, unknown>)[k]; else return undefined; } return c; }
function setNested(obj: Record<string, unknown>, path: string[], value: unknown): void { let c: Record<string, unknown> = obj; for (let i = 0; i < path.length - 1; i++) { const k = path[i]; if (!(k in c) || c[k] === null || typeof c[k] !== 'object') c[k] = {}; c = c[k] as Record<string, unknown>; } if (path.length > 0) c[path[path.length-1]] = value; }
function countDifferences(original: unknown, modified: unknown): number { if (original === modified) return 0; try { return JSON.stringify(original) === JSON.stringify(modified) ? 0 : 1; } catch { return 1; } }
function getChangedPaths(original: unknown, modified: unknown): string[] { if (original === modified) return []; try { const paths: string[] = []; walkDiff(original, modified, '', paths); return paths; } catch { return ['<unknown>']; } }
function walkDiff(orig: unknown, mod: unknown, path: string, paths: string[]): void { if (orig === mod) return; if (typeof orig !== typeof mod) { paths.push(path || '<root>'); return; } if (typeof orig !== 'object' || orig === null || mod === null) { paths.push(path || '<root>'); return; } if (Array.isArray(orig) && Array.isArray(mod)) { if (orig.length !== mod.length) paths.push(path || '<root>'); return; } const o = orig as Record<string, unknown>; const m = mod as Record<string, unknown>; const keys = new Set([...Object.keys(o), ...Object.keys(m)]); for (const k of keys) { const np = path ? `${path}.${k}` : k; if (!(k in o) || !(k in m)) paths.push(np); else walkDiff(o[k], m[k], np, paths); } }
export function withDefaults<T>(schema: ZodType<T>, defaultBasePath?: string): { parse: (data: unknown) => T; safeParse: (data: unknown) => SafeValidationResult<T> } {
  return { parse: (data: unknown): T => { const r = safeValidate(schema, data, { defaultBasePath }); if (!r.success) throw new Error(r.error || 'Validation failed'); return r.data as T; }, safeParse: (data: unknown) => safeValidate(schema, data, { defaultBasePath }) };
}
