// =============================================================================
// Admin Service Tests
// =============================================================================
// Unit tests for the admin stats service. Mocks Prisma and cache to test
// system stats aggregation, user management, and health checks.
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mocks ─────────────────────────────────────────────────────────────

vi.mock('@/lib/prisma/client', () => ({
  default: {
    user: {
      count: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    project: { count: vi.fn() },
    deployment: { count: vi.fn() },
    aIGeneration: {
      aggregate: vi.fn(),
    },
    subscription: {
      findMany: vi.fn(),
    },
    auditLog: {
      findMany: vi.fn(),
    },
    $queryRaw: vi.fn(),
  },
}));

vi.mock('@/lib/redis/cache', () => ({
  cacheGetOrSet: vi.fn((_key: string, fn: () => Promise<unknown>) => fn()),
  cacheDelete: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// ─── Imports (after mocks) ─────────────────────────────────────────────

import {
  getSystemStats,
  getUsers,
  getSystemHealth,
} from '@/features/admin/services/admin.service';
import prisma from '@/lib/prisma/client';

const mockedPrisma = vi.mocked(prisma, true);

// ─── Tests ─────────────────────────────────────────────────────────────

describe('AdminService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSystemStats', () => {
    it('should return aggregated system stats', async () => {
      mockedPrisma.user.count.mockResolvedValue(150);
      mockedPrisma.project.count.mockResolvedValue(420);
      mockedPrisma.deployment.count.mockResolvedValue(85);
      mockedPrisma.aIGeneration.aggregate.mockResolvedValue({
        _count: { id: 1200 },
        _sum: { tokensUsed: 500000, cost: 12.5 },
        _avg: { tokensUsed: 416 },
      } as any);
      mockedPrisma.subscription.findMany.mockResolvedValue([
        { plan: 'pro' },
        { plan: 'pro' },
        { plan: 'enterprise' },
      ] as any);
      mockedPrisma.auditLog.findMany.mockResolvedValue([
        { userId: 'u1' },
        { userId: 'u2' },
        { userId: 'u3' },
      ] as any);

      const result = await getSystemStats();

      expect(result.totalUsers).toBe(150);
      expect(result.activeUsers).toBe(3);
      expect(result.totalProjects).toBe(420);
      expect(result.totalDeployments).toBe(85);
      expect(result.revenue).toBe(157); // 29 + 29 + 99
      expect(result.aiUsage.totalGenerations).toBe(1200);
      expect(result.aiUsage.totalTokensUsed).toBe(500000);
      expect(result.aiUsage.estimatedCost).toBe(12.5);
    });

    it('should handle zero subscriptions', async () => {
      mockedPrisma.user.count.mockResolvedValue(0);
      mockedPrisma.project.count.mockResolvedValue(0);
      mockedPrisma.deployment.count.mockResolvedValue(0);
      mockedPrisma.aIGeneration.aggregate.mockResolvedValue({
        _count: { id: 0 },
        _sum: { tokensUsed: 0, cost: 0 },
        _avg: { tokensUsed: 0 },
      } as any);
      mockedPrisma.subscription.findMany.mockResolvedValue([]);
      mockedPrisma.auditLog.findMany.mockResolvedValue([]);

      const result = await getSystemStats();

      expect(result.totalUsers).toBe(0);
      expect(result.revenue).toBe(0);
      expect(result.aiUsage.totalGenerations).toBe(0);
    });
  });

  describe('getUsers', () => {
    it('should return paginated users', async () => {
      mockedPrisma.user.findMany.mockResolvedValue([
        {
          id: 'u1',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          plan: 'pro',
          role: 'user',
          createdAt: new Date('2026-01-01'),
          _count: { projects: 5 },
        },
      ] as any);
      mockedPrisma.user.count.mockResolvedValue(1);

      const result = await getUsers({ page: 1, limit: 20 });

      expect(result.users).toHaveLength(1);
      expect(result.users[0].email).toBe('test@example.com');
      expect(result.users[0].name).toBe('Test User');
      expect(result.users[0].plan).toBe('pro');
      expect(result.users[0].projectCount).toBe(5);
      expect(result.totalCount).toBe(1);
    });

    it('should search by email', async () => {
      mockedPrisma.user.findMany.mockResolvedValue([]);
      mockedPrisma.user.count.mockResolvedValue(0);

      await getUsers({ search: 'test' });

      expect(mockedPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ email: expect.objectContaining({ contains: 'test' }) }),
            ]),
          }),
        })
      );
    });

    it('should clamp limit to max 100', async () => {
      mockedPrisma.user.findMany.mockResolvedValue([]);
      mockedPrisma.user.count.mockResolvedValue(0);

      const result = await getUsers({ limit: 500 });

      // Should not throw, just clamp
      expect(result).toBeDefined();
    });
  });

  describe('getSystemHealth', () => {
    it('should return health status for all services', async () => {
      mockedPrisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

      const result = await getSystemHealth();

      expect(result).toHaveProperty('database');
      expect(result).toHaveProperty('redis');
      expect(result).toHaveProperty('aiService');
      expect(result).toHaveProperty('storage');
      expect(result).toHaveProperty('uptime');
      expect(result).toHaveProperty('lastChecked');
      expect(typeof result.uptime).toBe('number');
    });

    it('should detect healthy database', async () => {
      mockedPrisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

      const result = await getSystemHealth();

      expect(result.database).toBe('healthy');
    });

    it('should handle database failure gracefully', async () => {
      mockedPrisma.$queryRaw.mockRejectedValue(new Error('Connection refused'));

      const result = await getSystemHealth();

      expect(result.database).toBe('down');
    });
  });
});
