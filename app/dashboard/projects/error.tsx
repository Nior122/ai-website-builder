// =============================================================================
// Projects Error Boundary
// =============================================================================
// Catches runtime errors in the projects list page.
// =============================================================================

'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { logger } from '@/lib/logger';

interface ProjectsErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ProjectsError({ error, reset }: ProjectsErrorProps) {
  useEffect(() => {
    logger.error('[Projects Error]', undefined, error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
          <span className="text-3xl">📁</span>
        </div>
        <h1 className="mb-2 text-xl font-semibold text-neutral-900">
          Couldn&apos;t load your projects
        </h1>
        <p className="mb-6 text-sm text-neutral-500">
          Something went wrong while loading your projects. Please try again.
        </p>
        {error.digest && (
          <p className="mb-6 rounded-lg bg-neutral-100 px-3 py-2 font-mono text-xs text-neutral-400">
            Error ID: {error.digest}
          </p>
        )}
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
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
