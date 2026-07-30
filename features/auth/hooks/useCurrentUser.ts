// =============================================================================
// useCurrentUser Hook
// =============================================================================
// Fetches the full user profile from our database (not just Clerk data).
// Includes plan, role, and subscription info.
// =============================================================================

'use client';

import useSWR from 'swr';

interface CurrentUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string;
  avatar: string | null;
  plan: string;
  role: string;
  createdAt: string;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

/**
 * Get the current user's full profile from our API.
 */
export function useCurrentUser() {
  const { data, error, isLoading, mutate } = useSWR<{ data: CurrentUser }>(
    '/api/auth/me',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000, // 30 seconds
    }
  );

  return {
    user: data?.data ?? null,
    isLoading,
    isError: !!error,
    refresh: () => mutate(),
  };
}
