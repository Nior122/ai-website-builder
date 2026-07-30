// =============================================================================
// useAuth Hook
// =============================================================================
// Wraps Clerk's useAuth and useUser hooks with app-specific logic.
// Provides role checking, organization access, and subscription status.
// =============================================================================

'use client';

import { useAuth as useClerkAuth, useUser as useClerkUser } from '@clerk/nextjs';
import { useMemo } from 'react';

export interface AuthUser {
  id: string;
  clerkId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string;
  avatar: string | null;
}

/**
 * App-level auth hook.
 * Combines Clerk's auth primitives with app-specific user data.
 */
export function useAuth() {
  const { userId, isLoaded, isSignedIn, getToken } = useClerkAuth();
  const { user: clerkUser } = useClerkUser();

  const user = useMemo<AuthUser | null>(() => {
    if (!clerkUser) return null;
    return {
      id: clerkUser.id,
      clerkId: clerkUser.id,
      email: clerkUser.emailAddresses[0]?.emailAddress || '',
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      fullName: [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || 'User',
      avatar: clerkUser.imageUrl,
    };
  }, [clerkUser]);

  return {
    user,
    userId,
    isLoaded,
    isSignedIn,
    getToken,
  };
}
