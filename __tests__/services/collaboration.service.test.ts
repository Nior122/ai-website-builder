// =============================================================================
// Collaboration Service Tests
// =============================================================================
// Unit tests for comments, invitations, and member management.
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mocks ─────────────────────────────────────────────────────────────

vi.mock('@/lib/prisma/client', () => ({
  default: {
    comment: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    invitation: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    membership: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    project: {
      findUnique: vi.fn(),
    },
    section: {
      findUnique: vi.fn(),
    },
    user: {
      // Idempotent Clerk→DB resolution: a user_* clerkId maps back to itself.
      findUnique: vi.fn(async ({ where: { clerkId } }: { where: { clerkId: string } }) => ({
        id: clerkId,
      })),
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

vi.mock('@/features/admin/services/audit.service', () => ({
  logAuditEntry: vi.fn(),
}));

vi.mock('@/lib/redis/cache', () => ({
  cacheDelete: vi.fn(),
  cacheKeys: {
    project: (id: string) => `project:${id}`,
  },
}));

// ─── Imports ───────────────────────────────────────────────────────────

import {
  listComments,
  createComment,
  updateComment,
  deleteComment,
  resolveComment,
  listInvitations,
  createInvitation,
  revokeInvitation,
  listMembers,
  updateMemberRole,
  removeMember,
} from '@/features/collaboration/services/collaboration.service';
import prisma from '@/lib/prisma/client';
import { NotFoundError, ForbiddenError, ConflictError } from '@/lib/errors';

// ─── Test Data ─────────────────────────────────────────────────────────

const MOCK_USER_ID = 'user_123';
const MOCK_PROJECT_ID = 'proj_456';
const MOCK_ORG_ID = 'org_789';

const mockProject = {
  id: MOCK_PROJECT_ID,
  ownerId: MOCK_USER_ID,
  name: 'Test Project',
};

const mockAuthor = {
  id: MOCK_USER_ID,
  firstName: 'Test',
  lastName: 'User',
  avatarUrl: null,
  email: 'test@example.com',
};

const mockComment = {
  id: 'comment_001',
  projectId: MOCK_PROJECT_ID,
  sectionId: null,
  authorId: MOCK_USER_ID,
  content: 'Test comment',
  parentId: null,
  resolvedAt: null,
  createdAt: new Date(),
  author: mockAuthor,
  replies: [],
};

// ─── Tests ─────────────────────────────────────────────────────────────

describe('CollaborationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── Comments ───────────────────────────────────────────────────────

  describe('listComments', () => {
    it('should list comments for authorized user', async () => {
      vi.mocked(prisma.project.findUnique).mockResolvedValue(mockProject as never);
      vi.mocked(prisma.comment.findMany).mockResolvedValue([mockComment] as never);

      const result = await listComments(MOCK_PROJECT_ID, MOCK_USER_ID);

      expect(result).toHaveLength(1);
      expect(result[0].content).toBe('Test comment');
    });

    it('should throw ForbiddenError for unauthorized user', async () => {
      vi.mocked(prisma.project.findUnique).mockResolvedValue({
        ...mockProject,
        ownerId: 'other_user',
      } as never);

      await expect(
        listComments(MOCK_PROJECT_ID, MOCK_USER_ID)
      ).rejects.toThrow(ForbiddenError);
    });

    it('should filter by sectionId', async () => {
      vi.mocked(prisma.project.findUnique).mockResolvedValue(mockProject as never);
      vi.mocked(prisma.comment.findMany).mockResolvedValue([] as never);

      await listComments(MOCK_PROJECT_ID, MOCK_USER_ID, 'section_123');

      expect(prisma.comment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ sectionId: 'section_123' }),
        })
      );
    });
  });

  describe('createComment', () => {
    it('should create a comment successfully', async () => {
      vi.mocked(prisma.project.findUnique).mockResolvedValue(mockProject as never);
      vi.mocked(prisma.comment.create).mockResolvedValue(mockComment as never);

      const result = await createComment({
        projectId: MOCK_PROJECT_ID,
        authorId: MOCK_USER_ID,
        content: 'New comment',
      });

      expect(result.content).toBe('Test comment');
      expect(prisma.comment.create).toHaveBeenCalledOnce();
    });

    it('should throw NotFoundError for non-existent parent comment', async () => {
      vi.mocked(prisma.project.findUnique).mockResolvedValue(mockProject as never);
      vi.mocked(prisma.comment.findUnique).mockResolvedValue(null);

      await expect(
        createComment({
          projectId: MOCK_PROJECT_ID,
          authorId: MOCK_USER_ID,
          content: 'Reply',
          parentId: 'nonexistent',
        })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('updateComment', () => {
    it('should update comment content', async () => {
      vi.mocked(prisma.comment.findUnique).mockResolvedValue(mockComment as never);
      vi.mocked(prisma.comment.update).mockResolvedValue({
        ...mockComment,
        content: 'Updated',
      } as never);

      const result = await updateComment('comment_001', MOCK_USER_ID, 'Updated');

      expect(result.content).toBe('Updated');
    });

    it('should throw ForbiddenError for non-author', async () => {
      vi.mocked(prisma.comment.findUnique).mockResolvedValue(mockComment as never);

      await expect(
        updateComment('comment_001', 'other_user', 'Hacked')
      ).rejects.toThrow(ForbiddenError);
    });

    it('should throw NotFoundError for non-existent comment', async () => {
      vi.mocked(prisma.comment.findUnique).mockResolvedValue(null);

      await expect(
        updateComment('nonexistent', MOCK_USER_ID, 'Content')
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteComment', () => {
    it('should delete comment as author', async () => {
      vi.mocked(prisma.comment.findUnique).mockResolvedValue(mockComment as never);
      vi.mocked(prisma.comment.delete).mockResolvedValue(mockComment as never);

      await deleteComment('comment_001', MOCK_USER_ID);

      expect(prisma.comment.delete).toHaveBeenCalledOnce();
    });

    it('should delete comment as project owner', async () => {
      const otherUserComment = { ...mockComment, authorId: 'other_user' };
      vi.mocked(prisma.comment.findUnique).mockResolvedValue(otherUserComment as never);
      vi.mocked(prisma.project.findUnique).mockResolvedValue(mockProject as never);
      vi.mocked(prisma.comment.delete).mockResolvedValue(otherUserComment as never);

      await deleteComment('comment_001', MOCK_USER_ID);

      expect(prisma.comment.delete).toHaveBeenCalledOnce();
    });

    it('should throw ForbiddenError for non-author non-owner', async () => {
      const otherUserComment = { ...mockComment, authorId: 'other_user' };
      vi.mocked(prisma.comment.findUnique).mockResolvedValue(otherUserComment as never);
      vi.mocked(prisma.project.findUnique).mockResolvedValue({
        ...mockProject,
        ownerId: 'another_user',
      } as never);

      await expect(
        deleteComment('comment_001', 'unauthorized_user')
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('resolveComment', () => {
    it('should resolve a comment', async () => {
      vi.mocked(prisma.comment.findUnique).mockResolvedValue(mockComment as never);
      vi.mocked(prisma.project.findUnique).mockResolvedValue(mockProject as never);
      vi.mocked(prisma.comment.update).mockResolvedValue({
        ...mockComment,
        resolvedAt: new Date(),
      } as never);

      const result = await resolveComment('comment_001', MOCK_USER_ID, true);

      expect(result.resolvedAt).toBeTruthy();
    });

    it('should unresolve a comment', async () => {
      const resolvedComment = { ...mockComment, resolvedAt: new Date() };
      vi.mocked(prisma.comment.findUnique).mockResolvedValue(resolvedComment as never);
      vi.mocked(prisma.project.findUnique).mockResolvedValue(mockProject as never);
      vi.mocked(prisma.comment.update).mockResolvedValue({
        ...resolvedComment,
        resolvedAt: null,
      } as never);

      const result = await resolveComment('comment_001', MOCK_USER_ID, false);

      expect(result.resolvedAt).toBeNull();
    });
  });

  // ─── Invitations ────────────────────────────────────────────────────

  describe('createInvitation', () => {
    it('should create invitation as admin', async () => {
      vi.mocked(prisma.membership.findUnique).mockResolvedValue({
        id: 'mem_001',
        userId: MOCK_USER_ID,
        organizationId: MOCK_ORG_ID,
        role: 'admin',
      } as never);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.invitation.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.invitation.create).mockResolvedValue({
        id: 'inv_001',
        email: 'new@example.com',
        organizationId: MOCK_ORG_ID,
        role: 'member',
        invitedBy: MOCK_USER_ID,
        token: 'inv_token',
        status: 'pending',
        expiresAt: new Date(),
        createdAt: new Date(),
      } as never);

      const result = await createInvitation({
        organizationId: MOCK_ORG_ID,
        email: 'new@example.com',
        role: 'member',
        invitedBy: MOCK_USER_ID,
      });

      expect(result.email).toBe('new@example.com');
    });

    it('should throw ForbiddenError for non-admin', async () => {
      vi.mocked(prisma.membership.findUnique).mockResolvedValue({
        id: 'mem_001',
        userId: MOCK_USER_ID,
        organizationId: MOCK_ORG_ID,
        role: 'viewer',
      } as never);

      await expect(
        createInvitation({
          organizationId: MOCK_ORG_ID,
          email: 'new@example.com',
          role: 'member',
          invitedBy: MOCK_USER_ID,
        })
      ).rejects.toThrow(ForbiddenError);
    });

    it('should throw ConflictError for duplicate email', async () => {
      vi.mocked(prisma.membership.findUnique).mockResolvedValue({
        id: 'mem_001',
        userId: MOCK_USER_ID,
        organizationId: MOCK_ORG_ID,
        role: 'owner',
      } as never);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'existing_user',
        email: 'existing@example.com',
      } as never);
      vi.mocked(prisma.membership.findUnique).mockResolvedValueOnce({
        id: 'mem_001',
        userId: MOCK_USER_ID,
        organizationId: MOCK_ORG_ID,
        role: 'owner',
      } as never).mockResolvedValueOnce({
        id: 'mem_002',
        userId: 'existing_user',
        organizationId: MOCK_ORG_ID,
        role: 'member',
      } as never);

      await expect(
        createInvitation({
          organizationId: MOCK_ORG_ID,
          email: 'existing@example.com',
          role: 'member',
          invitedBy: MOCK_USER_ID,
        })
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('revokeInvitation', () => {
    it('should revoke invitation as admin', async () => {
      vi.mocked(prisma.invitation.findUnique).mockResolvedValue({
        id: 'inv_001',
        organizationId: MOCK_ORG_ID,
      } as never);
      vi.mocked(prisma.membership.findUnique).mockResolvedValue({
        id: 'mem_001',
        userId: MOCK_USER_ID,
        organizationId: MOCK_ORG_ID,
        role: 'admin',
      } as never);
      vi.mocked(prisma.invitation.delete).mockResolvedValue({} as never);

      await revokeInvitation('inv_001', MOCK_USER_ID);

      expect(prisma.invitation.delete).toHaveBeenCalledOnce();
    });

    it('should throw ForbiddenError for non-admin', async () => {
      vi.mocked(prisma.invitation.findUnique).mockResolvedValue({
        id: 'inv_001',
        organizationId: MOCK_ORG_ID,
      } as never);
      vi.mocked(prisma.membership.findUnique).mockResolvedValue({
        id: 'mem_001',
        userId: MOCK_USER_ID,
        organizationId: MOCK_ORG_ID,
        role: 'viewer',
      } as never);

      await expect(
        revokeInvitation('inv_001', MOCK_USER_ID)
      ).rejects.toThrow(ForbiddenError);
    });
  });

  // ─── Members ────────────────────────────────────────────────────────

  describe('listMembers', () => {
    it('should list members for authorized user', async () => {
      vi.mocked(prisma.membership.findUnique).mockResolvedValue({
        id: 'mem_001',
        userId: MOCK_USER_ID,
        organizationId: MOCK_ORG_ID,
        role: 'member',
      } as never);
      vi.mocked(prisma.membership.findMany).mockResolvedValue([
        {
          id: 'mem_001',
          userId: MOCK_USER_ID,
          organizationId: MOCK_ORG_ID,
          role: 'member',
          joinedAt: new Date(),
          user: mockAuthor,
        },
      ] as never);

      const result = await listMembers(MOCK_ORG_ID, MOCK_USER_ID);

      expect(result).toHaveLength(1);
    });

    it('should throw ForbiddenError for non-member', async () => {
      vi.mocked(prisma.membership.findUnique).mockResolvedValue(null);

      await expect(
        listMembers(MOCK_ORG_ID, 'non_member')
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('updateMemberRole', () => {
    it('should update member role as owner', async () => {
      vi.mocked(prisma.membership.findUnique).mockResolvedValueOnce({
        id: 'mem_owner',
        userId: MOCK_USER_ID,
        organizationId: MOCK_ORG_ID,
        role: 'owner',
      } as never).mockResolvedValueOnce({
        id: 'mem_target',
        userId: 'target_user',
        organizationId: MOCK_ORG_ID,
        role: 'member',
      } as never);
      vi.mocked(prisma.membership.update).mockResolvedValue({
        id: 'mem_target',
        userId: 'target_user',
        organizationId: MOCK_ORG_ID,
        role: 'admin',
      } as never);

      const result = await updateMemberRole(
        MOCK_ORG_ID,
        'target_user',
        'admin',
        MOCK_USER_ID
      );

      expect(result.role).toBe('admin');
    });

    it('should throw ForbiddenError for non-owner', async () => {
      vi.mocked(prisma.membership.findUnique).mockResolvedValue({
        id: 'mem_001',
        userId: MOCK_USER_ID,
        organizationId: MOCK_ORG_ID,
        role: 'admin',
      } as never);

      await expect(
        updateMemberRole(MOCK_ORG_ID, 'target_user', 'admin', MOCK_USER_ID)
      ).rejects.toThrow(ForbiddenError);
    });

    it('should throw ForbiddenError when trying to change own role', async () => {
      vi.mocked(prisma.membership.findUnique).mockResolvedValue({
        id: 'mem_001',
        userId: MOCK_USER_ID,
        organizationId: MOCK_ORG_ID,
        role: 'owner',
      } as never);

      await expect(
        updateMemberRole(MOCK_ORG_ID, MOCK_USER_ID, 'admin', MOCK_USER_ID)
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('removeMember', () => {
    it('should remove member as owner', async () => {
      vi.mocked(prisma.membership.findUnique).mockResolvedValueOnce({
        id: 'mem_owner',
        userId: MOCK_USER_ID,
        organizationId: MOCK_ORG_ID,
        role: 'owner',
      } as never).mockResolvedValueOnce({
        id: 'mem_target',
        userId: 'target_user',
        organizationId: MOCK_ORG_ID,
        role: 'member',
      } as never);
      vi.mocked(prisma.membership.delete).mockResolvedValue({} as never);

      await removeMember(MOCK_ORG_ID, 'target_user', MOCK_USER_ID);

      expect(prisma.membership.delete).toHaveBeenCalledOnce();
    });

    it('should throw ForbiddenError when admin tries to remove owner', async () => {
      vi.mocked(prisma.membership.findUnique).mockResolvedValueOnce({
        id: 'mem_admin',
        userId: MOCK_USER_ID,
        organizationId: MOCK_ORG_ID,
        role: 'admin',
      } as never).mockResolvedValueOnce({
        id: 'mem_owner',
        userId: 'owner_user',
        organizationId: MOCK_ORG_ID,
        role: 'owner',
      } as never);

      await expect(
        removeMember(MOCK_ORG_ID, 'owner_user', MOCK_USER_ID)
      ).rejects.toThrow(ForbiddenError);
    });

    it('should throw ForbiddenError for viewer', async () => {
      vi.mocked(prisma.membership.findUnique).mockResolvedValue({
        id: 'mem_viewer',
        userId: MOCK_USER_ID,
        organizationId: MOCK_ORG_ID,
        role: 'viewer',
      } as never);

      await expect(
        removeMember(MOCK_ORG_ID, 'target_user', MOCK_USER_ID)
      ).rejects.toThrow(ForbiddenError);
    });
  });
});
