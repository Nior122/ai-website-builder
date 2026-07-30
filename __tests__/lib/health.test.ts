// =============================================================================
// Health Check Endpoint Tests
// =============================================================================
// Unit tests for the GET /api/health route handler.
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ─── Mocks ─────────────────────────────────────────────────────────────

const mockQueryRaw = vi.fn();
const mockPing = vi.fn();

vi.mock('@/lib/prisma/client', () => ({
  default: {
    $queryRaw: (...args: unknown[]) => mockQueryRaw(...args),
  },
}));

vi.mock('@/lib/redis/client', () => ({
  redis: {
    ping: (...args: unknown[]) => mockPing(...args),
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// ─── Import after mocks ────────────────────────────────────────────────

import { GET } from '@/app/api/health/route';

// ─── Helpers ───────────────────────────────────────────────────────────

function makeRequest(): NextRequest {
  return new NextRequest(new Request('http://localhost/api/health'));
}

// ─── Tests ─────────────────────────────────────────────────────────────

describe('GET /api/health', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 200 with status ok when all services are healthy', async () => {
    mockQueryRaw.mockResolvedValue([{ '?column?': 1 }]);
    mockPing.mockResolvedValue('PONG');

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe('ok');
    expect(body.checks.database.status).toBe('ok');
    expect(body.checks.redis.status).toBe('ok');
    expect(body.version).toBeDefined();
    expect(body.uptime).toBeGreaterThanOrEqual(0);
    expect(body.timestamp).toBeDefined();
  });

  it('returns 200 with status degraded when database fails', async () => {
    mockQueryRaw.mockRejectedValue(new Error('Connection refused'));
    mockPing.mockResolvedValue('PONG');

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe('degraded');
    expect(body.checks.database.status).toBe('error');
    expect(body.checks.database.error).toContain('Connection refused');
    expect(body.checks.redis.status).toBe('ok');
  });

  it('returns 503 with status down when all services fail', async () => {
    mockQueryRaw.mockRejectedValue(new Error('DB down'));
    mockPing.mockRejectedValue(new Error('Redis down'));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.status).toBe('down');
    expect(body.checks.database.status).toBe('error');
    expect(body.checks.redis.status).toBe('error');
  });

  it('returns 200 degraded when Redis returns unexpected response', async () => {
    mockQueryRaw.mockResolvedValue([{ '?column?': 1 }]);
    mockPing.mockResolvedValue('NOT_PONG');

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe('degraded');
    expect(body.checks.redis.error).toContain('Unexpected response: NOT_PONG');
  });

  it('includes cache-control header to prevent caching', async () => {
    mockQueryRaw.mockResolvedValue([{ '?column?': 1 }]);
    mockPing.mockResolvedValue('PONG');

    const response = await GET();

    expect(response.headers.get('cache-control')).toContain('no-store');
  });

  it('reports latency for each check', async () => {
    mockQueryRaw.mockResolvedValue([{ '?column?': 1 }]);
    mockPing.mockResolvedValue('PONG');

    const response = await GET();
    const body = await response.json();

    expect(body.checks.database.latencyMs).toBeGreaterThanOrEqual(0);
    expect(body.checks.redis.latencyMs).toBeGreaterThanOrEqual(0);
  });
});
