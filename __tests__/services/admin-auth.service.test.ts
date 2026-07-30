// =============================================================================
// Admin Auth Service Tests
// =============================================================================
// Tests for requireAdmin and getAdminUser role-checking functions.
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requireAdmin, getAdminUser } from '@/features/admin/services/auth.service';
import { ForbiddenError } from '@/lib/errors';

// ─── Mocks ─────────────────────────────────────────────────────────────

vi.mock('@/lib/prisma/client', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

// ─── Tests ─────────────────────────────────────────────────────────────

describe('AdminAuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('requireAdmin', () => {
    it('should return user when admin', async () => {
      const { default: prisma } = await import('@/lib/prisma/client');
      const mockUser = { id: 'u1', clerkId: 'clerk-1', role: 'admin', email: 'admin@test.com' };
      (prisma.user.findUnique as any).mockResolvedValue(mockUser);

      const result = await requireAdmin('clerk-1');
      expect(result).toEqual(mockUser);
    });

    it('should throw ForbiddenError when user not found', async () => {
      const { default: prisma } = await import('@/lib/prisma/client');
      (prisma.user.findUnique as any).mockResolvedValue(null);

      await expect(requireAdmin('clerk-unknown')).rejects.toThrow(ForbiddenError);
    });

    it('should throw ForbiddenError when user is not admin', async () => {
      const { default: prisma } = await import('@/lib/prisma/client');
      (prisma.user.findUnique as any).mockResolvedValue({
        id: 'u2',
        clerkId: 'clerk-2',
        role: 'user',
        email: 'user@test.com',
      });

      await expect(requireAdmin('clerk-2')).rejects.toThrow(ForbiddenError);
    });

    it('should throw ForbiddenError for member role', async () => {
      const { default: prisma } = await import('@/lib/prisma/client');
      (prisma.user.findUnique as any).mockResolvedValue({
        id: 'u3',
        clerkId: 'clerk-3',
        role: 'member',
        email: 'member@test.com',
      });

      await expect(requireAdmin('clerk-3')).rejects.toThrow(ForbiddenError);
    });

    it('should look up user by clerkId', async () => {
      const { default: prisma } = await import('@/lib/prisma/client');
      (prisma.user.findUnique as any).mockResolvedValue(null);

      await expect(requireAdmin('specific-clerk-id')).rejects.toThrow(ForbiddenError);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { clerkId: 'specific-clerk-id' },
      });
    });
  });

  describe('getAdminUser', () => {
    it('should return user when admin', async () => {
      const { default: prisma } = await import('@/lib/prisma/client');
      const mockUser = { id: 'u1', clerkId: 'clerk-1', role: 'admin' };
      (prisma.user.findUnique as any).mockResolvedValue(mockUser);

      const result = await getAdminUser('clerk-1');
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      const { default: prisma } = await import('@/lib/prisma/client');
      (prisma.user.findUnique as any).mockResolvedValue(null);

      const result = await getAdminUser('clerk-unknown');
      expect(result).toBeNull();
    });

    it('should return null when user is not admin', async () => {
      const { default: prisma } = await import('@/lib/prisma/client');
      (prisma.user.findUnique as any).mockResolvedValue({
        id: 'u2',
        clerkId: 'clerk-2',
        role: 'user',
      });

      const result = await getAdminUser('clerk-2');
      expect(result).toBeNull();
    });

    it('should not throw when user is not admin', async () => {
      const { default: prisma } = await import('@/lib/prisma/client');
      (prisma.user.findUnique as any).mockResolvedValue({
        id: 'u3',
        role: 'user',
      });

      await expect(getAdminUser('clerk-3')).resolves.toBeNull();
    });
  });
});
