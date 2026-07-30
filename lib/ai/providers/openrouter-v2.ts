// =============================================================================
// OpenRouter Provider — v2
// =============================================================================
import type { AIProvider, AIProviderConfig, CompletionParams, StructuredCompletionParams, CompletionResult, ValidationResult } from './types';
import { logger } from '@/lib/logger';
import { repairAndParse } from '@/lib/ai/json-repair-engine';
const LOG = { provider: 'OpenRouter' } as const;
const BASE_URL = 'https://openrouter.ai/api/v1';
const MAX_RETRIES = 2;
export class OpenRouterProviderV2 implements AIProvider {
  readonly name = 'openrouter'; private config: AIProviderConfig; private baseURL: string;
  constructor(config: AIProviderConfig) {
    const k = (config.apiKey||'').trim().replace(/^["']|["']$/g,'');
    if (!k) throw new Error('OpenRouter API key is missing. Set OPENROUTER_API_KEY in .env.local.');
    this.config = { ...config, apiKey: k }; this.baseURL = (config.baseURL||BASE_URL).replace(/\/+$/,'');
  }
  async createCompletion(p: CompletionParams): Promise<CompletionResult> { return this.retry(async () => { const body = this.body(p); const st=Date.now(); const res=await fetch(`${this.baseURL}/chat/completions`,{method:'POST',headers:this.headers(),body:JSON.stringify(body),signal:AbortSignal.timeout(120000)}); const el=Date.now()-st; const txt=await res.text(); if(!res.ok) throw new Error(`OpenRouter ${res.status}`); const j=JSON.parse(txt); const c=j.choices?.[0]?.message?.content||''; logger.info('OpenRouter completion',{...LOG,model:j.model||this.config.model,elapsedMs:el}); return {content:c,usage:j.usage?{inputTokens:j.usage.prompt_tokens||0,outputTokens:j.usage.completion_tokens||0}:undefined,model:j.model||this.config.model}; }); }
  async createStructuredCompletion<T>(p: StructuredCompletionParams): Promise<T> { return this.retry(async () => { const body = this.body(p); const st=Date.now(); const res=await fetch(`${this.baseURL}/chat/completions`,{method:'POST',headers:this.headers(),body:JSON.stringify(body),signal:AbortSignal.timeout(180000)}); const el=Date.now()-st; const txt=await res.text(); if(!res.ok) throw new Error(`OpenRouter ${res.status}`); const j=JSON.parse(txt); const c=j.choices?.[0]?.message?.content||''; const pr=repairAndParse(c); if(!pr.success) throw new Error(`Invalid JSON from ${this.config.model}: ${pr.error}`); if(pr.repairsApplied>0) logger.info(`OpenRouter: Repaired JSON (${pr.repairsApplied} fixes)`,LOG); return pr.data as T; }); }
  async createStreamCompletion(p: CompletionParams): Promise<ReadableStream<Uint8Array>> { const res=await fetch(`${this.baseURL}/chat/completions`,{method:'POST',headers:this.headers(),body:JSON.stringify(this.body({...p,stream:true}))}); if(!res.ok) throw new Error(`OpenRouter stream error ${res.status}`); return res.body!; }
  async validate(): Promise<ValidationResult> { try{const r=await fetch(`${this.baseURL}/auth/key`,{headers:{Authorization:`Bearer ${this.config.apiKey}`}});return r.ok?{valid:true,model:this.config.model,provider:this.name}:{valid:false,error:`HTTP ${r.status}`,model:this.config.model,provider:this.name}}catch(e){return{valid:false,error:''+(e||''),model:this.config.model,provider:this.name}} }
  private headers() { return {'Content-Type':'application/json',Authorization:`Bearer ${this.config.apiKey}`,'HTTP-Referer':process.env.APP_URL||'https://ai-website-builder.app','X-Title':'AI Website Builder'}; }
  private body(p: any) { return {model:this.config.model,messages:[...(p.system?[{role:'system',content:p.system}]:[]),...p.messages.map((m:any)=>({role:m.role,content:m.content}))],max_tokens:p.maxTokens||this.config.maxTokens,temperature:p.temperature??this.config.temperature,stream:p.stream||false}; }
  private async retry<T>(op:()=>Promise<T>):Promise<T>{ let last:Error|null=null; for(let i=0;i<=MAX_RETRIES;i++){ try{return await op()}catch(e){last=e instanceof Error?e:new Error(''+e);if(i<MAX_RETRIES) await new Promise(r=>setTimeout(r,1000*Math.pow(2,i)))}} throw last||new Error('Retry failed'); }
}
