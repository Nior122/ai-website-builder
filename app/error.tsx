// =============================================================================
// Root Error Boundary
// =============================================================================
// Catches runtime errors in dashboard and other app routes. Renders a
// user-friendly fallback with retry and navigation options.
// =============================================================================

'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { logger } from '@/lib/logger';

interface AppErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AppError({ error, reset }: AppErrorProps) {
  useEffect(() => {
    logger.error('[App Error]', undefined, error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="mx-auto max-w-md text-center">
        {/* Error Icon */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
          <span className="text-3xl">💥</span>
        </div>

        {/* Title */}
        <h1 className="mb-2 text-xl font-semibold text-neutral-900">
          Something went wrong
        </h1>

        {/* Description */}
        <p className="mb-6 text-sm text-neutral-500">
          An unexpected error occurred. Please try again or return to the
          dashboard.
        </p>

        {/* Error Digest (for support) */}
        {error.digest && (
          <p className="mb-6 rounded-lg bg-neutral-100 px-3 py-2 font-mono text-xs text-neutral-400">
            Error ID: {error.digest}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
          >
            Try Again
          </button>
          <Link
            href="/dashboard"
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
