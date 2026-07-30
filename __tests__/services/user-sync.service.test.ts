// =============================================================================
// User Sync Service Tests
// =============================================================================
// Tests for Clerk webhook user synchronization: syncUser, deleteUser, ensureUser.
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { syncUser, deleteUser, ensureUser } from '@/features/auth/services/user-sync.service';

// ─── Mocks ─────────────────────────────────────────────────────────────

vi.mock('@/lib/prisma/client', () => ({
  default: {
    user: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

// ─── Tests ─────────────────────────────────────────────────────────────

describe('UserSyncService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('syncUser', () => {
    const clerkUser = {
      id: 'clerk-123',
      emailAddresses: [{ emailAddress: 'test@example.com' }],
      firstName: 'John',
      lastName: 'Doe',
      imageUrl: 'https://example.com/avatar.jpg',
      createdAt: 1700000000000,
    };

    it('should upsert user with correct data', async () => {
      const { default: prisma } = await import('@/lib/prisma/client');
      const mockUser = { id: 'u1', clerkId: 'clerk-123', email: 'test@example.com' };
      (prisma.user.upsert as any).mockResolvedValue(mockUser);

      const result = await syncUser(clerkUser);

      expect(result).toEqual(mockUser);
      expect(prisma.user.upsert).toHaveBeenCalledWith({
        where: { clerkId: 'clerk-123' },
        create: {
          clerkId: 'clerk-123',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          avatarUrl: 'https://example.com/avatar.jpg',
        },
        update: {
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          avatarUrl: 'https://example.com/avatar.jpg',
        },
      });
    });

    it('should return null when no email provided', async () => {
      const { default: prisma } = await import('@/lib/prisma/client');
      const result = await syncUser({
        id: 'clerk-no-email',
        emailAddresses: [],
      });

      expect(result).toBeNull();
      expect(prisma.user.upsert).not.toHaveBeenCalled();
    });

    it('should handle missing optional fields', async () => {
      const { default: prisma } = await import('@/lib/prisma/client');
      (prisma.user.upsert as any).mockResolvedValue({ id: 'u2' });

      const result = await syncUser({
        id: 'clerk-minimal',
        emailAddresses: [{ emailAddress: 'minimal@test.com' }],
      });

      expect(result).toBeDefined();
      expect(prisma.user.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            firstName: null,
            lastName: null,
            avatarUrl: null,
          }),
        })
      );
    });

    it('should throw on database error', async () => {
      const { default: prisma } = await import('@/lib/prisma/client');
      (prisma.user.upsert as any).mockRejectedValue(new Error('DB error'));

      await expect(syncUser(clerkUser)).rejects.toThrow('DB error');
    });
  });

  describe('deleteUser', () => {
    it('should delete user by clerkId', async () => {
      const { default: prisma } = await import('@/lib/prisma/client');
      (prisma.user.findUnique as any).mockResolvedValue({ id: 'u1', clerkId: 'clerk-123' });
      (prisma.user.delete as any).mockResolvedValue(undefined);

      await deleteUser('clerk-123');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { clerkId: 'clerk-123' } });
      expect(prisma.user.delete).toHaveBeenCalledWith({ where: { clerkId: 'clerk-123' } });
    });

    it('should handle non-existent user gracefully', async () => {
      const { default: prisma } = await import('@/lib/prisma/client');
      (prisma.user.findUnique as any).mockResolvedValue(null);

      await deleteUser('clerk-unknown');

      expect(prisma.user.delete).not.toHaveBeenCalled();
    });

    it('should throw on database error during delete', async () => {
      const { default: prisma } = await import('@/lib/prisma/client');
      (prisma.user.findUnique as any).mockResolvedValue({ id: 'u1' });
      (prisma.user.delete as any).mockRejectedValue(new Error('Delete failed'));

      await expect(deleteUser('clerk-123')).rejects.toThrow('Delete failed');
    });
  });

  describe('ensureUser', () => {
    it('should return existing user', async () => {
      const { default: prisma } = await import('@/lib/prisma/client');
      const existing = { id: 'u1', clerkId: 'clerk-123', email: 'existing@test.com' };
      (prisma.user.findUnique as any).mockResolvedValue(existing);

      const result = await ensureUser('clerk-123');

      expect(result).toEqual(existing);
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('should create placeholder user when not found', async () => {
      const { default: prisma } = await import('@/lib/prisma/client');
      (prisma.user.findUnique as any).mockResolvedValue(null);
      const created = { id: 'u2', clerkId: 'clerk-new', email: 'clerk-new@pending-sync.local' };
      (prisma.user.create as any).mockResolvedValue(created);

      const result = await ensureUser('clerk-new');

      expect(result).toEqual(created);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          clerkId: 'clerk-new',
          email: 'clerk-new@pending-sync.local',
          firstName: null,
          lastName: null,
        },
      });
    });

    it('should throw on database error', async () => {
      const { default: prisma } = await import('@/lib/prisma/client');
      (prisma.user.findUnique as any).mockResolvedValue(null);
      (prisma.user.create as any).mockRejectedValue(new Error('Create failed'));

      await expect(ensureUser('clerk-fail')).rejects.toThrow('Create failed');
    });
  });
});
