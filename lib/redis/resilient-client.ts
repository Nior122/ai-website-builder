// =============================================================================
// Resilient Redis Client — v2
// =============================================================================
import { createClient, type RedisClientType } from 'redis';
import { logger } from '@/lib/logger';
const LOG = { service: 'redis' } as const;
interface State{client:RedisClientType|null;available:boolean;lastError:string|null;reconnectAttempts:number;degraded:boolean;interval:ReturnType<typeof setInterval>|null}
const st:State={client:null,available:false,lastError:null,reconnectAttempts:0,degraded:false,interval:null};
function create(): RedisClientType|null{
  const u=process.env.REDIS_URL||''; if(!u){logger.info('Redis: No REDIS_URL — degraded mode',LOG);st.degraded=true;return null}
  try{const c=createClient({url:u,socket:{reconnectStrategy:(r)=>{st.reconnectAttempts=r;if(r>20){st.degraded=true;return new Error('Max retries')}return Math.min(100*Math.pow(2,r),10000)},connectTimeout:5000},disableOfflineQueue:true});
  c.on('connect',()=>{st.available=true;st.degraded=false});c.on('error',(e)=>{st.lastError=''+e;if(st.available){st.available=false;st.degraded=true}});c.on('end',()=>{st.available=false});
  c.connect().catch(()=>{st.available=false;st.degraded=true});return c as RedisClientType}catch(e){logger.error('Redis: failed to create',{...LOG,error:''+e});st.degraded=true;return null}
}
let init=false;
function ensure():RedisClientType|null{if(!init){init=true;st.client=create();st.interval=setInterval(async()=>{if(st.degraded&&st.client){try{await st.client.ping();if(!st.available){st.available=true;st.degraded=false}}catch{/* */}}},30000)}return st.client}
export function getRedis():RedisClientType|null{return ensure()}
export function isRedisAvailable():boolean{return st.available&&!st.degraded}
export function isDegradedMode():boolean{return st.degraded}
export function getRedisHealth(){return{available:st.available,degraded:st.degraded,lastError:st.lastError,reconnectAttempts:st.reconnectAttempts}}
export async function shutdownRedis(){if(st.interval){clearInterval(st.interval);st.interval=null}if(st.client){try{await st.client.quit()}catch{/* */}st.client=null}st.available=false;st.degraded=true}
export async function safeRedisOp<T>(op:(c:RedisClientType)=>Promise<T>,fb:T):Promise<T>{const c=ensure();if(!c||!st.available)return fb;try{return await op(c)}catch(e){st.lastError=''+e;return fb}}
export async function safeSet(k:string,v:string,ttl?:number){await safeRedisOp(async(c)=>{if(ttl&&ttl>0)await c.setEx(k,ttl,v);else await c.set(k,v)},undefined)}
export async function safeGet(k:string):Promise<string|null>{return safeRedisOp(async(c)=>await c.get(k),null)}
export async function safeDel(k:string){await safeRedisOp(async(c)=>{await c.del(k)},undefined)}
export async function safePing():Promise<boolean>{return safeRedisOp(async(c)=>{await c.ping();return true},false)}
