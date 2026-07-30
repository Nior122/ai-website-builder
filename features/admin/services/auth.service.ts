// =============================================================================
// Admin Auth Service
// =============================================================================
// Reusable admin role checks for API routes. Looks up the user by Clerk ID
// and verifies they have the 'admin' role. Used by all admin API routes.
// =============================================================================

import prisma from '@/lib/prisma/client';
import { ForbiddenError } from '@/lib/errors';

/**
 * Verify the authenticated user has admin role. Throws ForbiddenError if not.
 * Returns the User record on success.
 */
export async function requireAdmin(clerkId: string) {
  const user = await prisma.user.findUnique({ where: { clerkId } });

  if (!user) {
    throw new ForbiddenError('User not found');
  }

  if (user.role !== 'admin') {
    throw new ForbiddenError('Admin access required');
  }

  return user;
}

/**
 * Check if a user is an admin without throwing.
 * Returns the User record if admin, null otherwise.
 */
export async function getAdminUser(clerkId: string) {
  const user = await prisma.user.findUnique({ where: { clerkId } });

  if (!user || user.role !== 'admin') {
    return null;
  }

  return user;
}
