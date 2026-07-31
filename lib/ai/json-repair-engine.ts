// =============================================================================
// JSON Repair Engine — v2
// =============================================================================
import { logger } from '@/lib/logger';
const LOG = { service: 'json-repair-engine' } as const;
export interface RepairResult { success: boolean; json?: string; data?: unknown; repairsApplied: number; repairsList: string[]; error?: string; rawPreview: string; }
interface RepairStrategy { name: string; apply: (text: string) => string | null; }
const STRATEGIES: RepairStrategy[] = [
  { name: 'strip-bom-and-zero-width', apply: (text) => { const c = text.replace(/^\uFEFF/,'').replace(/[\u200B-\u200D\uFEFF]/g,'').replace(/[\u00A0]/g,' ').replace(/[\u2028\u2029]/g,'\n').trim(); return c !== text ? c : null; } },
  { name: 'remove-markdown-fences', apply: (text) => { const c = text.replace(/```(?:json|js|javascript|ts|typescript)?\s*\n?([\s\S]*?)```/g,'$1').trim(); return c !== text ? c : null; } },
  { name: 'extract-json-object', apply: (text) => { const trimmed = text.trim(); if (trimmed[0]==='{'||trimmed[0]==='[') return null; const fb = text.indexOf('{'), lb = text.lastIndexOf('}'); if (fb!==-1 && lb!==-1 && lb>fb) { const e = text.slice(fb,lb+1); return e !== text ? e : null; } const fbr = text.indexOf('['), lbr = text.lastIndexOf(']'); if (fbr!==-1 && lbr!==-1 && lbr>fbr) { const e = text.slice(fbr,lbr+1); return e !== text ? e : null; } return null; } },
  { name: 'smart-quotes-to-straight', apply: (text) => { const c = text.replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g,'"').replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g,"'"); return c !== text ? c : null; } },
  { name: 'single-quotes-to-double', apply: (text) => { let c = text.replace(/([{,]\s*)'([^']*?)'(?=\s*:)/g,'$1"$2"'); c = c.replace(/(:\s*)'([^']*?)'(?=\s*[,}\]])/g,'$1"$2"'); return c !== text ? c : null; } },
  { name: 'remove-trailing-commas', apply: (text) => { const c = text.replace(/,\s*}/g,'}').replace(/,\s*]/g,']'); return c !== text ? c : null; } },
  { name: 'remove-duplicate-commas', apply: (text) => { const c = text.replace(/,(\s*,)+/g,','); return c !== text ? c : null; } },
  { name: 'add-missing-commas-objects', apply: (text) => { const c = text.replace(/}\s*{/g,'},{').replace(/}\s*\[/g,'},[').replace(/]\s*{/g,'],{'); return c !== text ? c : null; } },
  { name: 'add-missing-commas-arrays', apply: (text) => { const c = text.replace(/]\s*\[/g,'],[').replace(/}\s*\[/g,'},[').replace(/]\s*{/g,'],{'); return c !== text ? c : null; } },
  { name: 'add-missing-opening-brace', apply: (text) => { const t = text.trim(); if (t.length>0 && t[0]!=='{' && t[0]!=='[' && (t[0]==='"'||t[0]==="'")) return '{'+t; return null; } },
  { name: 'fix-hex-escapes', apply: (text) => { const c = text.replace(/\\x([0-9a-fA-F]{2})/g,'\\u00$1'); return c !== text ? c : null; } },
  { name: 'remove-control-chars', apply: (text) => { const c = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g,''); return c !== text ? c : null; } },
  { name: 'unescape-newlines', apply: (text) => { const c = text.replace(/\\\\n/g,'\\n'); return c !== text ? c : null; } },
  { name: 'convert-undefined-null-strings', apply: (text) => { const c = text.replace(/:\s*undefined(?=\s*[,}\]])/g,': null').replace(/:\s*None(?=\s*[,}\]])/g,': null').replace(/:\s*"undefined"(?=\s*[,}\]])/g,': null'); return c !== text ? c : null; } },
  { name: 'balance-braces', apply: (text) => { let ob=0,osq=0,inS=false,esc=false; for(let i=0;i<text.length;i++){const ch=text[i];if(esc){esc=false;continue}if(ch==='\\'&&inS){esc=true;continue}if(ch==='"'&&!esc){inS=!inS;continue}if(inS)continue;if(ch==='{')ob++;else if(ch==='}')ob=Math.max(0,ob-1);else if(ch==='[')osq++;else if(ch===']')osq=Math.max(0,osq-1)} let r=text;while(ob>0){r+='}';ob--}while(osq>0){r+=']';osq--} return r!==text?r:null; } },
  { name: 'strip-trailing-content', apply: (text) => { for(let l=text.length;l>0;l--){try{JSON.parse(text.slice(0,l));const v=text.slice(0,l);if(v!==text&&v.trim().length>0)return v;return null}catch{continue}}return null; } },
  { name: 'remove-comments', apply: (text) => { const c = text.replace(/\/\/[^\n]*/g,'').replace(/\/\*[\s\S]*?\*\//g,''); return c !== text ? c : null; } },
  { name: 'fix-unquoted-property-names', apply: (text) => { const c = text.replace(/(?<=[{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)(?=\s*:)/g,'"$1"'); return c !== text ? c : null; } },
  { name: 'backtick-to-double-quote', apply: (text) => { const c = text.replace(/:\s*`([^`]*)`/g,': "$1"'); return c !== text ? c : null; } },
];
export function repairAndParse(rawText: string): RepairResult {
  const repairsList: string[] = []; let text = rawText?.trim() ?? '';
  if (!text) return { success: false, error: 'Empty input', rawPreview: '', repairsApplied: 0, repairsList: [] };
  const rawPreview = text.length > 500 ? text.slice(0,500)+'...' : text;
  try { const data = JSON.parse(text); return { success: true, json: text, data, repairsApplied: 0, repairsList: [], rawPreview }; } catch { /* fall through */ }
  for (const strategy of STRATEGIES) {
    try { const repaired = strategy.apply(text); if (repaired !== null) { try { const data = JSON.parse(repaired); repairsList.push(strategy.name); return { success: true, json: repaired, data, repairsApplied: repairsList.length, repairsList, rawPreview }; } catch { text = repaired; repairsList.push(strategy.name); } } } catch { continue; }
  }
  try { const data = JSON.parse(text); return { success: true, json: text, data, repairsApplied: repairsList.length, repairsList, rawPreview }; } catch { /* fall through */ }
  try { const found = findAnyJSON(text); if (found !== null) { const data = JSON.parse(found); repairsList.push('find-any-json'); return { success: true, json: found, data, repairsApplied: repairsList.length, repairsList, rawPreview }; } } catch { /* */ }
  return { success: false, error: `JSON repair failed after ${repairsList.length} strategies: ${getLastParseError(text)}`, rawPreview, repairsApplied: repairsList.length, repairsList };
}
export function looksLikeJSON(text: string): boolean { const t = text.trim(); if (t.length===0) return false; const f=t[0],l=t[t.length-1]; return (f==='{'&&l==='}')||(f==='['&&l===']'); }
function findAnyJSON(text: string): string | null { for(let i=0;i<text.length;i++){if(text[i]==='{'||text[i]==='['){for(let j=text.length;j>i;j--){try{JSON.parse(text.slice(i,j));return text.slice(i,j)}catch{continue}}}}return null; }
function getLastParseError(text: string): string { try{JSON.parse(text);return 'Unknown'}catch(err){const msg=err instanceof Error?err.message:String(err);const m=msg.match(/position\s+(\d+)/i);if(m){const p=parseInt(m[1],10);const ctx=text.slice(Math.max(0,p-20),Math.min(text.length,p+20));return `At position ${p}: "...${ctx}..."`}return msg} }
