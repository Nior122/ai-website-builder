// =============================================================================
// AuthGuard Component
// =============================================================================
// Client-side route protection. Renders children only if the user is
// authenticated, otherwise shows a loading state or redirects.
// =============================================================================

'use client';

import { useAuth } from '../hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requiredRole?: string;
}

export function AuthGuard({
  children,
  fallback,
  requiredRole,
}: AuthGuardProps) {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in');
    }
  }, [isLoaded, isSignedIn, router]);

  // Loading state
  if (!isLoaded) {
    return (
      fallback || (
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-300 border-t-neutral-900" />
        </div>
      )
    );
  }

  // Not signed in — will redirect via useEffect
  if (!isSignedIn) {
    return fallback || null;
  }

  return <>{children}</>;
}
