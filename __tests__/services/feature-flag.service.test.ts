// =============================================================================
// Feature Flag Service Tests
// =============================================================================
// Unit tests for the feature flag CRUD + evaluation logic. Mocks Prisma
// and cache to test flag operations and the isEnabled evaluation.
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mocks ─────────────────────────────────────────────────────────────

vi.mock('@/lib/prisma/client', () => ({
  default: {
    featureFlag: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
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
  getAllFlags,
  getFlagByKey,
  createFlag,
  updateFlag,
  deleteFlag,
  isEnabled,
} from '@/features/admin/services/feature-flag.service';
import prisma from '@/lib/prisma/client';

const mockedPrisma = vi.mocked(prisma, true);

// ─── Helpers ───────────────────────────────────────────────────────────

function makeFlag(overrides: Record<string, unknown> = {}) {
  return {
    id: 'flag_1',
    key: 'test-flag',
    name: 'Test Flag',
    description: 'A test flag',
    enabled: true,
    rollout: 100,
    conditions: {},
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}

// ─── Tests ─────────────────────────────────────────────────────────────

describe('FeatureFlagService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllFlags', () => {
    it('should return all flags ordered by creation date', async () => {
      const flags = [makeFlag({ id: 'flag_1' }), makeFlag({ id: 'flag_2' })];
      mockedPrisma.featureFlag.findMany.mockResolvedValue(flags as never);

      const result = await getAllFlags();

      expect(result).toHaveLength(2);
      expect(mockedPrisma.featureFlag.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('getFlagByKey', () => {
    it('should return a flag by key', async () => {
      const flag = makeFlag();
      mockedPrisma.featureFlag.findUnique.mockResolvedValue(flag as never);

      const result = await getFlagByKey('test-flag');

      expect(result).toEqual(flag);
    });

    it('should return null for unknown key', async () => {
      mockedPrisma.featureFlag.findUnique.mockResolvedValue(null);

      const result = await getFlagByKey('unknown');

      expect(result).toBeNull();
    });
  });

  describe('createFlag', () => {
    it('should create a flag with valid data', async () => {
      const flag = makeFlag();
      mockedPrisma.featureFlag.create.mockResolvedValue(flag as never);

      const result = await createFlag({
        key: 'test-flag',
        name: 'Test Flag',
        description: 'A test flag',
      });

      expect(result.key).toBe('test-flag');
      expect(mockedPrisma.featureFlag.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          key: 'test-flag',
          name: 'Test Flag',
          enabled: false,
          rollout: 0,
        }),
      });
    });

    it('should reject invalid key format', async () => {
      await expect(
        createFlag({ key: 'Invalid Key!', name: 'Test' })
      ).rejects.toThrow();
    });

    it('should reject empty name', async () => {
      await expect(
        createFlag({ key: 'valid-key', name: '' })
      ).rejects.toThrow();
    });
  });

  describe('updateFlag', () => {
    it('should update flag fields', async () => {
      const updated = makeFlag({ enabled: true, rollout: 50 });
      mockedPrisma.featureFlag.update.mockResolvedValue(updated as never);

      const result = await updateFlag('test-flag', {
        enabled: true,
        rollout: 50,
      });

      expect(result.enabled).toBe(true);
      expect(result.rollout).toBe(50);
    });
  });

  describe('deleteFlag', () => {
    it('should delete a flag and return true', async () => {
      mockedPrisma.featureFlag.delete.mockResolvedValue({} as never);

      const result = await deleteFlag('test-flag');

      expect(result).toBe(true);
    });

    it('should return false if flag not found', async () => {
      mockedPrisma.featureFlag.delete.mockRejectedValue(
        new Error('Record to delete does not exist')
      );

      const result = await deleteFlag('unknown');

      expect(result).toBe(false);
    });
  });

  describe('isEnabled', () => {
    it('should return false when flag not found', async () => {
      mockedPrisma.featureFlag.findUnique.mockResolvedValue(null);

      const result = await isEnabled('nonexistent');

      expect(result).toBe(false);
    });

    it('should return false when flag is disabled', async () => {
      mockedPrisma.featureFlag.findUnique.mockResolvedValue(
        makeFlag({ enabled: false }) as never
      );

      const result = await isEnabled('test-flag');

      expect(result).toBe(false);
    });

    it('should return true when flag enabled + rollout 100', async () => {
      mockedPrisma.featureFlag.findUnique.mockResolvedValue(
        makeFlag({ enabled: true, rollout: 100 }) as never
      );

      const result = await isEnabled('test-flag', { userId: 'user_1' });

      expect(result).toBe(true);
    });

    it('should return false when rollout is 0', async () => {
      mockedPrisma.featureFlag.findUnique.mockResolvedValue(
        makeFlag({ enabled: true, rollout: 0 }) as never
      );

      const result = await isEnabled('test-flag', { userId: 'user_1' });

      expect(result).toBe(false);
    });

    it('should respect rollout percentage for specific users', async () => {
      mockedPrisma.featureFlag.findUnique.mockResolvedValue(
        makeFlag({ enabled: true, rollout: 50 }) as never
      );

      // Run multiple users through — roughly 50% should be enabled
      let enabledCount = 0;
      for (let i = 0; i < 100; i++) {
        const result = await isEnabled('test-flag', { userId: `user_${i}` });
        if (result) enabledCount++;
      }

      // With deterministic hashing, this should be roughly 50%
      // Allow a wide margin for hash distribution
      expect(enabledCount).toBeGreaterThan(0);
      expect(enabledCount).toBeLessThan(100);
    });

    it('should evaluate allowedPlans condition', async () => {
      mockedPrisma.featureFlag.findUnique.mockResolvedValue(
        makeFlag({
          enabled: true,
          rollout: 100,
          conditions: { allowedPlans: ['pro', 'enterprise'] },
        }) as never
      );

      const proResult = await isEnabled('test-flag', {
        userId: 'user_1',
        plan: 'pro',
      });
      const freeResult = await isEnabled('test-flag', {
        userId: 'user_2',
        plan: 'free',
      });

      expect(proResult).toBe(true);
      expect(freeResult).toBe(false);
    });

    it('should return true when no conditions restrict access', async () => {
      mockedPrisma.featureFlag.findUnique.mockResolvedValue(
        makeFlag({ enabled: true, rollout: 100, conditions: {} }) as never
      );

      const result = await isEnabled('test-flag', { userId: 'user_1' });

      expect(result).toBe(true);
    });
  });
});
