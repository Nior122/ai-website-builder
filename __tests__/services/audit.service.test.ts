// =============================================================================
// Audit Service Tests
// =============================================================================
// Unit tests for the audit logging service. Mocks Prisma to test
// write and read operations without a real database.
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mocks ─────────────────────────────────────────────────────────────

vi.mock('@/lib/prisma/client', () => ({
  default: {
    auditLog: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
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

// ─── Imports (after mocks) ─────────────────────────────────────────────

import { logAuditEntry, getAuditLogs } from '@/features/admin/services/audit.service';
import prisma from '@/lib/prisma/client';

const mockedPrisma = vi.mocked(prisma, true);

// ─── Tests ─────────────────────────────────────────────────────────────

describe('AuditService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('logAuditEntry', () => {
    it('should write an audit log entry and return true', async () => {
      mockedPrisma.auditLog.create.mockResolvedValueOnce({} as never);

      const result = await logAuditEntry({
        userId: 'user_1',
        action: 'project.create',
        resource: 'project',
        resourceId: 'proj_1',
        newValues: { name: 'My Project' },
      });

      expect(result).toBe(true);
      expect(mockedPrisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          userId: 'user_1',
          action: 'project.create',
          resource: 'project',
          resourceId: 'proj_1',
          oldValues: {},
          newValues: { name: 'My Project' },
          ipAddress: null,
          userAgent: null,
        },
      });
    });

    it('should return false on database error (fire-and-forget)', async () => {
      mockedPrisma.auditLog.create.mockRejectedValueOnce(
        new Error('DB down')
      );

      const result = await logAuditEntry({
        userId: 'user_1',
        action: 'project.create',
        resource: 'project',
        resourceId: 'proj_1',
      });

      expect(result).toBe(false);
    });

    it('should include ipAddress and userAgent when provided', async () => {
      mockedPrisma.auditLog.create.mockResolvedValueOnce({} as never);

      await logAuditEntry({
        userId: 'user_1',
        action: 'deployment.complete',
        resource: 'deployment',
        resourceId: 'deploy_1',
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
      });

      expect(mockedPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ipAddress: '127.0.0.1',
          userAgent: 'Mozilla/5.0',
        }),
      });
    });

    it('should include oldValues when provided', async () => {
      mockedPrisma.auditLog.create.mockResolvedValueOnce({} as never);

      await logAuditEntry({
        userId: 'user_1',
        action: 'project.update',
        resource: 'project',
        resourceId: 'proj_1',
        oldValues: { name: 'Old Name' },
        newValues: { name: 'New Name' },
      });

      expect(mockedPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          oldValues: { name: 'Old Name' },
          newValues: { name: 'New Name' },
        }),
      });
    });
  });

  describe('getAuditLogs', () => {
    const mockLogs = [
      {
        id: 'log_1',
        userId: 'user_1',
        action: 'project.create',
        resource: 'project',
        resourceId: 'proj_1',
        oldValues: {},
        newValues: { name: 'My Project' },
        ipAddress: null,
        userAgent: null,
        createdAt: new Date('2026-01-15'),
      },
    ];

    it('should return paginated audit logs', async () => {
      mockedPrisma.auditLog.findMany.mockResolvedValueOnce(mockLogs);
      mockedPrisma.auditLog.count.mockResolvedValueOnce(1);

      const result = await getAuditLogs({ page: 1, limit: 20 });

      expect(result.logs).toEqual(mockLogs);
      expect(result.totalCount).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.totalPages).toBe(1);
    });

    it('should filter by userId', async () => {
      mockedPrisma.auditLog.findMany.mockResolvedValueOnce([]);
      mockedPrisma.auditLog.count.mockResolvedValueOnce(0);

      await getAuditLogs({ userId: 'user_1' });

      expect(mockedPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: 'user_1' }),
        })
      );
    });

    it('should filter by resource', async () => {
      mockedPrisma.auditLog.findMany.mockResolvedValueOnce([]);
      mockedPrisma.auditLog.count.mockResolvedValueOnce(0);

      await getAuditLogs({ resource: 'project' });

      expect(mockedPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ resource: 'project' }),
        })
      );
    });

    it('should filter by date range', async () => {
      mockedPrisma.auditLog.findMany.mockResolvedValueOnce([]);
      mockedPrisma.auditLog.count.mockResolvedValueOnce(0);

      await getAuditLogs({
        startDate: '2026-01-01',
        endDate: '2026-01-31',
      });

      expect(mockedPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: {
              gte: new Date('2026-01-01'),
              lte: new Date('2026-01-31'),
            },
          }),
        })
      );
    });

    it('should clamp page to minimum 1', async () => {
      mockedPrisma.auditLog.findMany.mockResolvedValueOnce([]);
      mockedPrisma.auditLog.count.mockResolvedValueOnce(0);

      const result = await getAuditLogs({ page: -5, limit: 20 });

      expect(result.page).toBe(1);
    });

    it('should clamp limit to maximum 100', async () => {
      mockedPrisma.auditLog.findMany.mockResolvedValueOnce([]);
      mockedPrisma.auditLog.count.mockResolvedValueOnce(0);

      const result = await getAuditLogs({ page: 1, limit: 500 });

      expect(result.limit).toBe(100);
    });
  });
});
