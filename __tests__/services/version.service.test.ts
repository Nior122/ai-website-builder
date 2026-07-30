// =============================================================================
// Version Service Tests
// =============================================================================
// Unit tests for version history operations.
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mocks ─────────────────────────────────────────────────────────────

vi.mock('@/lib/prisma/client', () => ({
  default: {
    version: {
      aggregate: vi.fn(),
      groupBy: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

vi.mock('@/features/projects/services/project.service', () => ({
  getProjectById: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('@/lib/redis/cache', () => ({
  cacheGet: vi.fn(),
  cacheSet: vi.fn(),
  cacheDelete: vi.fn(),
  cacheKeys: {
    project: (id: string) => `project:${id}`,
  },
}));

// ─── Imports ───────────────────────────────────────────────────────────

import {
  getVersionCount,
  getNextVersionNumber,
  listVersions,
} from '@/features/publishing/services/version.service';
import prisma from '@/lib/prisma/client';
import { getProjectById } from '@/features/projects/services/project.service';

// ─── Test Data ─────────────────────────────────────────────────────────

const MOCK_USER_ID = 'user_123';
const MOCK_PROJECT_ID = 'proj_456';

// ─── Tests ─────────────────────────────────────────────────────────────

describe('VersionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getVersionCount', () => {
    it('should return 0 for project with no versions', async () => {
      vi.mocked(prisma.version.aggregate).mockResolvedValue({
        _count: { _all: 0 },
      } as never);

      const result = await getVersionCount(MOCK_PROJECT_ID);

      expect(result).toBe(0);
    });

    it('should return correct count', async () => {
      vi.mocked(prisma.version.aggregate).mockResolvedValue({
        _count: { _all: 5 },
      } as never);

      const result = await getVersionCount(MOCK_PROJECT_ID);

      expect(result).toBe(5);
    });
  });

  describe('getNextVersionNumber', () => {
    it('should return 1 for project with no versions', async () => {
      vi.mocked(prisma.version.groupBy).mockResolvedValue([]);

      const result = await getNextVersionNumber(MOCK_PROJECT_ID);

      expect(result).toBe(1);
    });

    it('should return max version + 1', async () => {
      vi.mocked(prisma.version.groupBy).mockResolvedValue([
        { version: 5 },
      ] as never);

      const result = await getNextVersionNumber(MOCK_PROJECT_ID);

      expect(result).toBe(6);
    });
  });

  describe('listVersions', () => {
    it('should list versions for authorized user', async () => {
      vi.mocked(getProjectById).mockResolvedValue({ id: MOCK_PROJECT_ID } as never);
      vi.mocked(prisma.version.findMany).mockResolvedValue([
        {
          id: 'v_001',
          version: 2,
          label: 'Published v2',
          createdBy: MOCK_USER_ID,
          createdAt: new Date(),
        },
        {
          id: 'v_002',
          version: 1,
          label: 'Published v1',
          createdBy: MOCK_USER_ID,
          createdAt: new Date(),
        },
      ] as never);

      const result = await listVersions(MOCK_PROJECT_ID, MOCK_USER_ID);

      expect(result).toHaveLength(2);
      expect(result[0].version).toBe(2);
    });

    it('should throw ForbiddenError for unauthorized user', async () => {
      vi.mocked(getProjectById).mockRejectedValue(
        new Error('You do not have access to this project')
      );

      await expect(
        listVersions(MOCK_PROJECT_ID, 'other_user')
      ).rejects.toThrow();
    });
  });
});
