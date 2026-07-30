// =============================================================================
// Editor Error Boundary
// =============================================================================
// Catches runtime errors in the editor and renders a user-friendly fallback.
// The editor is the most critical user-facing page — a white-screen crash
// here is especially damaging. This boundary catches rendering errors,
// state management failures, and API errors within the editor tree.
// =============================================================================

'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { logger } from '@/lib/logger';

interface EditorErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function EditorError({ error, reset }: EditorErrorProps) {
  useEffect(() => {
    logger.error('[Editor Error]', undefined, error);
  }, [error]);

  return (
    <div className="flex h-screen items-center justify-center bg-neutral-50">
      <div className="mx-auto max-w-md text-center">
        {/* Error Icon */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
          <span className="text-3xl">⚠️</span>
        </div>

        {/* Title */}
        <h1 className="mb-2 text-xl font-semibold text-neutral-900">
          Something went wrong
        </h1>

        {/* Description */}
        <p className="mb-6 text-sm text-neutral-500">
          The editor encountered an unexpected error. Your recent changes may not
          have been saved. You can try again or return to the dashboard.
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
            href="/dashboard/projects"
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
