// =============================================================================
// Resilient Prisma Client — v2
// =============================================================================
import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';
const LOG = { service: 'prisma' } as const;
const RC = { maxRetries: parseInt(process.env.PRISMA_MAX_RETRIES||'3',10), baseDelay: parseInt(process.env.PRISMA_RETRY_BASE_DELAY||'100',10), maxDelay: parseInt(process.env.PRISMA_RETRY_MAX_DELAY||'5000',10) };
const g = globalThis as unknown as { prisma: PrismaClient | undefined };
export const prisma = g.prisma ?? new PrismaClient({log:process.env.NODE_ENV==='development'?['error','warn']:['error']});
if(process.env.NODE_ENV!=='production') g.prisma = prisma;
function isRetryable(e:unknown):boolean{if(!(e instanceof Error))return false;const m=e.message.toLowerCase();if(m.includes('connection')||m.includes('timeout')||m.includes('econnreset')||m.includes('econnrefused')||m.includes('enotfound')||m.includes('socket')||m.includes('pool')||m.includes('connection terminated'))return true;const c=(e as any).code;return !!c&&['P1001','P1002','P1008','P1017'].includes(c)}
function delay(a:number):number{return Math.min(RC.baseDelay*Math.pow(2,a)+Math.random()*100,RC.maxDelay)}
export async function withRetry<T>(op:()=>Promise<T>,o?:{maxRetries?:number;onRetry?:(a:number,e:Error)=>void}):Promise<T>{const max=o?.maxRetries||RC.maxRetries;let last:Error|null=null;for(let a=0;a<=max;a++){try{return await op()}catch(e){last=e instanceof Error?e:new Error(''+e);if(!isRetryable(last)||a>=max)throw last;const d=delay(a);logger.warn(`Prisma retry ${a+1}/${max} after ${Math.round(d)}ms: ${last.message}`,LOG);if(o?.onRetry)o.onRetry(a+1,last);await sleep(d)}}throw last||new Error('Unexpected')}
export async function testConnection():Promise<{connected:boolean;latencyMs:number;error?:string}>{const st=Date.now();try{await prisma.$queryRaw`SELECT 1`;return{connected:true,latencyMs:Date.now()-st}}catch(e){return{connected:false,latencyMs:Date.now()-st,error:''+(e||'')}}}
export async function disconnectPrisma():Promise<void>{try{await prisma.$disconnect();logger.info('Prisma: Disconnected',LOG)}catch(e){logger.error('Prisma: Disconnect error',{...LOG,error:''+e})}}
function sleep(ms:number):Promise<void>{return new Promise(r=>setTimeout(r,ms))}
