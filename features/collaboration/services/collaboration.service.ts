// =============================================================================
// Collaboration Service
// =============================================================================
// Manages comments, invitations, and member roles for project collaboration.
// Uses the existing Prisma models: Comment, Invitation, Membership, User.
// =============================================================================

import prisma from '@/lib/prisma/client';
import { NotFoundError, ForbiddenError, ConflictError } from '@/lib/errors';
import { logAuditEntry } from '@/features/admin/services/audit.service';
import { cacheDelete, cacheKeys } from '@/lib/redis/cache';
import { logger } from '@/lib/logger';
import type { Comment, Invitation, Membership, User } from '@prisma/client';

// ─── Types ──────────────────────────────────────────────────────────────

export type CommentWithAuthor = Comment & {
  author: Pick<User, 'id' | 'firstName' | 'lastName' | 'avatarUrl' | 'email'>;
  replies: CommentWithAuthor[];
};

export type MemberWithUser = Membership & {
  user: Pick<User, 'id' | 'clerkId' | 'email' | 'firstName' | 'lastName' | 'avatarUrl'>;
};

export type InvitationWithInviter = Invitation & {
  inviter: Pick<User, 'id' | 'firstName' | 'lastName' | 'email'>;
};

// ─── Comments ───────────────────────────────────────────────────────────

/**
 * List comments for a project, optionally filtered by section.
 * Returns top-level comments with nested replies.
 */
export async function listComments(
  projectId: string,
  userId: string,
  sectionId?: string
): Promise<CommentWithAuthor[]> {
  // Verify user has access to the project
  await requireProjectAccess(projectId, userId);

  const where: Record<string, unknown> = {
    projectId,
    parentId: null, // top-level only
  };

  if (sectionId) {
    where.sectionId = sectionId;
  }

  const comments = await prisma.comment.findMany({
    where,
    include: {
      author: {
        select: { id: true, firstName: true, lastName: true, avatarUrl: true, email: true },
      },
      replies: {
        include: {
          author: {
            select: { id: true, firstName: true, lastName: true, avatarUrl: true, email: true },
          },
          replies: true,
        },
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return comments as CommentWithAuthor[];
}

/**
 * Create a new comment on a project (optionally on a specific section).
 */
export async function createComment(params: {
  projectId: string;
  sectionId?: string;
  authorId: string;
  content: string;
  parentId?: string;
}): Promise<CommentWithAuthor> {
  const { projectId, sectionId, authorId, content, parentId } = params;

  await requireProjectAccess(projectId, authorId);

  // If replying to a parent comment, verify it exists in the same project
  if (parentId) {
    const parentComment = await prisma.comment.findUnique({ where: { id: parentId } });
    if (!parentComment || parentComment.projectId !== projectId) {
      throw new NotFoundError('Parent comment', parentId);
    }
  }

  // If sectionId provided, verify the section belongs to a page in the project
  if (sectionId) {
    const section = await prisma.section.findUnique({
      where: { id: sectionId },
      include: { page: { select: { projectId: true } } },
    });
    if (!section || section.page.projectId !== projectId) {
      throw new NotFoundError('Section', sectionId);
    }
  }

  const comment = await prisma.comment.create({
    data: {
      projectId,
      sectionId: sectionId || null,
      authorId,
      content,
      parentId: parentId || null,
    },
    include: {
      author: {
        select: { id: true, firstName: true, lastName: true, avatarUrl: true, email: true },
      },
      replies: true,
    },
  });

  logger.info('Comment created', { commentId: comment.id, projectId, authorId });

  await logAuditEntry({
    userId: authorId,
    action: 'comment.create',
    resource: 'Comment',
    resourceId: comment.id,
    metadata: { projectId, sectionId, parentId },
  } as any);

  return comment as CommentWithAuthor;
}

/**
 * Update a comment's content. Only the author can update.
 */
export async function updateComment(
  commentId: string,
  userId: string,
  content: string
): Promise<CommentWithAuthor> {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    include: {
      author: {
        select: { id: true, firstName: true, lastName: true, avatarUrl: true, email: true },
      },
      replies: true,
    },
  });

  if (!comment) throw new NotFoundError('Comment', commentId);
  if (comment.authorId !== userId) {
    throw new ForbiddenError('Only the comment author can edit this comment');
  }

  const updated = await prisma.comment.update({
    where: { id: commentId },
    data: { content },
    include: {
      author: {
        select: { id: true, firstName: true, lastName: true, avatarUrl: true, email: true },
      },
      replies: true,
    },
  });

  return updated as CommentWithAuthor;
}

/**
 * Delete a comment. Author or project owner can delete.
 */
export async function deleteComment(commentId: string, userId: string): Promise<void> {
  // Resolve Clerk userId → DB User.id
  let dbUserId = userId;
  if (userId.startsWith('user_')) {
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });
    if (!dbUser) throw new ForbiddenError('User not found');
    dbUserId = dbUser.id;
  }

  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) throw new NotFoundError('Comment', commentId);

  // Allow author or project owner to delete
  if (comment.authorId !== dbUserId) {
    const project = await prisma.project.findUnique({ where: { id: comment.projectId } });
    if (!project || project.ownerId !== dbUserId) {
      throw new ForbiddenError('Only the author or project owner can delete this comment');
    }
  }

  await prisma.comment.delete({ where: { id: commentId } });

  logger.info('Comment deleted', { commentId, projectId: comment.projectId, userId });
}

/**
 * Resolve or unresolve a comment thread.
 */
export async function resolveComment(
  commentId: string,
  userId: string,
  resolved: boolean
): Promise<Comment> {
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) throw new NotFoundError('Comment', commentId);

  await requireProjectAccess(comment.projectId, userId);

  return prisma.comment.update({
    where: { id: commentId },
    data: { resolvedAt: resolved ? new Date() : null },
  });
}

// ─── Invitations ────────────────────────────────────────────────────────

/**
 * List pending invitations for an organization.
 */
export async function listInvitations(
  organizationId: string,
  userId: string
): Promise<InvitationWithInviter[]> {
  // Verify user is a member of the organization
  await requireOrganizationMembership(organizationId, userId);

  return prisma.invitation.findMany({
    where: {
      organizationId,
      status: 'pending',
    },
    include: {
      inviter: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  }) as Promise<InvitationWithInviter[]>;
}

/**
 * Create an invitation to join an organization.
 */
export async function createInvitation(params: {
  organizationId: string;
  email: string;
  role: string;
  invitedBy: string;
}): Promise<InvitationWithInviter> {
  const { organizationId, email, role, invitedBy } = params;

  // Verify inviter is an admin or owner
  const membership = await prisma.membership.findUnique({
    where: {
      userId_organizationId: { userId: invitedBy, organizationId },
    },
  });

  if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
    throw new ForbiddenError('Only owners and admins can send invitations');
  }

  // Check if the user is already a member
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    const existingMembership = await prisma.membership.findUnique({
      where: {
        userId_organizationId: { userId: existingUser.id, organizationId },
      },
    });
    if (existingMembership) {
      throw new ConflictError('User is already a member of this organization');
    }
  }

  // Check for existing pending invitation
  const existingInvitation = await prisma.invitation.findFirst({
    where: {
      email,
      organizationId,
      status: 'pending',
    },
  });

  if (existingInvitation) {
    throw new ConflictError('An invitation is already pending for this email');
  }

  // Generate a unique token
  const token = `inv_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

  const invitation = await prisma.invitation.create({
    data: {
      email,
      organizationId,
      role,
      invitedBy,
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
    include: {
      inviter: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    },
  });

  logger.info('Invitation created', {
    invitationId: invitation.id,
    email,
    organizationId,
    invitedBy,
  });

  await logAuditEntry({
    userId: invitedBy,
    action: 'invitation.create',
    resource: 'Invitation',
    resourceId: invitation.id,
    metadata: { email, organizationId, role },
  } as any);

  return invitation as InvitationWithInviter;
}

/**
 * Accept an invitation and add the user to the organization.
 */
export async function acceptInvitation(
  token: string,
  userId: string
): Promise<Membership> {
  const invitation = await prisma.invitation.findUnique({ where: { token } });

  if (!invitation) throw new NotFoundError('Invitation', token);
  if (invitation.status !== 'pending') {
    throw new ForbiddenError('This invitation has already been used or expired');
  }
  if (invitation.expiresAt < new Date()) {
    // Mark as expired
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: 'expired' },
    });
    throw new ForbiddenError('This invitation has expired');
  }

  // Get user by clerkId to verify email matches
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('User', userId);

  if (user.email !== invitation.email) {
    throw new ForbiddenError('This invitation was sent to a different email address');
  }

  // Create membership
  const membership = await prisma.membership.create({
    data: {
      userId,
      organizationId: invitation.organizationId,
      role: invitation.role,
    },
  });

  // Mark invitation as accepted
  await prisma.invitation.update({
    where: { id: invitation.id },
    data: { status: 'accepted' },
  });

  logger.info('Invitation accepted', {
    invitationId: invitation.id,
    userId,
    organizationId: invitation.organizationId,
  });

  return membership;
}

/**
 * Cancel/revoke an invitation.
 */
export async function revokeInvitation(
  invitationId: string,
  userId: string
): Promise<void> {
  const invitation = await prisma.invitation.findUnique({ where: { id: invitationId } });
  if (!invitation) throw new NotFoundError('Invitation', invitationId);

  // Verify user is admin/owner
  const membership = await prisma.membership.findUnique({
    where: {
      userId_organizationId: { userId, organizationId: invitation.organizationId },
    },
  });

  if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
    throw new ForbiddenError('Only owners and admins can revoke invitations');
  }

  await prisma.invitation.delete({ where: { id: invitationId } });

  logger.info('Invitation revoked', { invitationId, userId });
}

// ─── Members ────────────────────────────────────────────────────────────

/**
 * List members of an organization.
 */
export async function listMembers(
  organizationId: string,
  userId: string
): Promise<MemberWithUser[]> {
  await requireOrganizationMembership(organizationId, userId);

  return prisma.membership.findMany({
    where: { organizationId },
    include: {
      user: {
        select: { id: true, clerkId: true, email: true, firstName: true, lastName: true, avatarUrl: true },
      },
    },
    orderBy: { joinedAt: 'asc' },
  }) as Promise<MemberWithUser[]>;
}

/**
 * Update a member's role. Only owner can do this.
 */
export async function updateMemberRole(
  organizationId: string,
  targetUserId: string,
  newRole: string,
  requestingUserId: string
): Promise<Membership> {
  // Verify requester is owner
  const requesterMembership = await prisma.membership.findUnique({
    where: {
      userId_organizationId: { userId: requestingUserId, organizationId },
    },
  });

  if (!requesterMembership || requesterMembership.role !== 'owner') {
    throw new ForbiddenError('Only the organization owner can change member roles');
  }

  // Can't change your own role
  if (targetUserId === requestingUserId) {
    throw new ForbiddenError('Cannot change your own role');
  }

  const membership = await prisma.membership.findUnique({
    where: {
      userId_organizationId: { userId: targetUserId, organizationId },
    },
  });

  if (!membership) throw new NotFoundError('Member', targetUserId);

  return prisma.membership.update({
    where: { id: membership.id },
    data: { role: newRole },
  });
}

/**
 * Remove a member from an organization. Owner or admin can remove members.
 */
export async function removeMember(
  organizationId: string,
  targetUserId: string,
  requestingUserId: string
): Promise<void> {
  const requesterMembership = await prisma.membership.findUnique({
    where: {
      userId_organizationId: { userId: requestingUserId, organizationId },
    },
  });

  if (!requesterMembership) throw new NotFoundError('Membership', requestingUserId);

  // Owner can remove anyone; admin can remove members (not other admins/owners)
  if (requesterMembership.role !== 'owner' && requesterMembership.role !== 'admin') {
    throw new ForbiddenError('Insufficient permissions to remove members');
  }

  const targetMembership = await prisma.membership.findUnique({
    where: {
      userId_organizationId: { userId: targetUserId, organizationId },
    },
  });

  if (!targetMembership) throw new NotFoundError('Member', targetUserId);

  // Admins can't remove other admins or owners
  if (
    requesterMembership.role === 'admin' &&
    (targetMembership.role === 'admin' || targetMembership.role === 'owner')
  ) {
    throw new ForbiddenError('Admins cannot remove other admins or owners');
  }

  // Can't remove the owner
  if (targetMembership.role === 'owner') {
    throw new ForbiddenError('Cannot remove the organization owner');
  }

  await prisma.membership.delete({ where: { id: targetMembership.id } });

  logger.info('Member removed', {
    organizationId,
    targetUserId,
    requestingUserId,
  });
}

// ─── Helpers ────────────────────────────────────────────────────────────

/**
 * Verify that a user has access to a project (is owner via Membership).
 * Throws ForbiddenError if not.
 */
async function requireProjectAccess(projectId: string, userId: string): Promise<void> {
  // Resolve Clerk userId → DB User.id
  let dbUserId = userId;
  if (userId.startsWith('user_')) {
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });
    if (!dbUser) throw new ForbiddenError('User not found');
    dbUserId = dbUser.id;
  }

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new NotFoundError('Project', projectId);

  if (project.ownerId !== dbUserId) {
    throw new ForbiddenError('You do not have access to this project');
  }
}

/**
 * Verify that a user is a member of an organization.
 */
async function requireOrganizationMembership(organizationId: string, userId: string): Promise<void> {
  const membership = await prisma.membership.findUnique({
    where: {
      userId_organizationId: { userId, organizationId },
    },
  });

  if (!membership) {
    throw new ForbiddenError('You are not a member of this organization');
  }
}
