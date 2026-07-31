// =============================================================================
// GET /api/health — Liveness & Dependency Health Check
// =============================================================================
// Reports DB and Redis connectivity with per-check latency. Returns:
//   - 200 { status: 'ok' }        — all services healthy
//   - 200 { status: 'degraded' }  — at least one dependency failing
//   - 503 { status: 'down' }      — all dependencies failing
// Always sends Cache-Control: no-store so load balancers / CDNs never cache it.
// =============================================================================

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma/client';
import { redis } from '@/lib/redis/client';
import { logger } from '@/lib/logger';

const LOG = { route: 'GET /api/health' } as const;

type CheckResult = {
  status: 'ok' | 'error';
  latencyMs: number;
  error?: string;
};

async function checkDatabase(): Promise<CheckResult> {
  const started = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'ok', latencyMs: Date.now() - started };
  } catch (err) {
    logger.error('Health: database check failed', {
      ...LOG,
      error: err instanceof Error ? err.message : String(err),
    });
    return {
      status: 'error',
      latencyMs: Date.now() - started,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function checkRedis(): Promise<CheckResult> {
  const started = Date.now();
  try {
    const pong = await redis.ping();
    if (pong !== 'PONG') {
      return {
        status: 'error',
        latencyMs: Date.now() - started,
        error: `Unexpected response: ${pong}`,
      };
    }
    return { status: 'ok', latencyMs: Date.now() - started };
  } catch (err) {
    logger.error('Health: redis check failed', {
      ...LOG,
      error: err instanceof Error ? err.message : String(err),
    });
    return {
      status: 'error',
      latencyMs: Date.now() - started,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function GET() {
  const started = Date.now();

  const [database, redisCheck] = await Promise.all([checkDatabase(), checkRedis()]);

  const dbOk = database.status === 'ok';
  const redisOk = redisCheck.status === 'ok';

  // ok      — everything healthy
  // degraded — at least one dependency failing
  // down     — all dependencies failing
  const status = dbOk && redisOk ? 'ok' : dbOk || redisOk ? 'degraded' : 'down';
  const httpStatus = status === 'down' ? 503 : 200;

  const body = {
    status,
    checks: {
      database,
      redis: redisCheck,
    },
    version: process.env.npm_package_version || '0.0.0',
    uptime: Math.max(0, process.uptime()),
    totalDurationMs: Date.now() - started,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(body, {
    status: httpStatus,
    headers: { 'Cache-Control': 'no-store' },
  });
}
