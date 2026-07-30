// =============================================================================
// User Sync Service
// =============================================================================
// Syncs Clerk user data to our Prisma database. Called by Clerk webhooks
// on user creation, update, and deletion events.
// =============================================================================

import prisma from '@/lib/prisma/client';
import { logger } from '@/lib/logger';

/**
 * Sync a Clerk user to the database. Creates or updates the record.
 */
export async function syncUser(clerkUser: {
  id: string;
  emailAddresses: Array<{ emailAddress: string }>;
  firstName?: string | null;
  lastName?: string | null;
  imageUrl?: string;
  createdAt?: number;
}) {
  const primaryEmail = clerkUser.emailAddresses[0]?.emailAddress;
  if (!primaryEmail) {
    logger.warn('No email found for Clerk user', { clerkId: clerkUser.id });
    return null;
  }

  const userData = {
    clerkId: clerkUser.id,
    email: primaryEmail,
    firstName: clerkUser.firstName || null,
    lastName: clerkUser.lastName || null,
    avatarUrl: clerkUser.imageUrl || null,
  };

  try {
    const user = await prisma.user.upsert({
      where: { clerkId: clerkUser.id },
      create: userData,
      update: {
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        avatarUrl: userData.avatarUrl,
      },
    });

    logger.info('User synced', { userId: user.id, clerkId: clerkUser.id });
    return user;
  } catch (error) {
    logger.error('Failed to sync user', { clerkId: clerkUser.id, error });
    throw error;
  }
}

/**
 * Handle user deletion from Clerk.
 */
export async function deleteUser(clerkId: string) {
  try {
    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) {
      logger.warn('User not found for deletion', { clerkId });
      return;
    }

    // Cascade delete — Prisma handles related records via onDelete: Cascade
    await prisma.user.delete({ where: { clerkId } });
    logger.info('User deleted', { userId: user.id, clerkId });
  } catch (error) {
    logger.error('Failed to delete user', { clerkId, error });
    throw error;
  }
}

/**
 * Ensure the user exists in the database. Creates a minimal record if needed.
 * Used during auth when the webhook may not have fired yet.
 */
export async function ensureUser(clerkId: string) {
  const existing = await prisma.user.findUnique({ where: { clerkId } });
  if (existing) return existing;

  // User not yet synced — create a placeholder that will be updated by webhook
  return prisma.user.create({
    data: {
      clerkId,
      email: `${clerkId}@pending-sync.local`,
      firstName: null,
      lastName: null,
    },
  });
}
