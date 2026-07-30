// =============================================================================
// Global Error Boundary
// =============================================================================
// Catches errors in the root layout that app/error.tsx cannot handle.
// Must define its own <html> and <body> since the layout may have failed.
// =============================================================================

'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { trackError } from '@/lib/error-tracking';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    trackError(error, { route: 'global-error', method: 'GLOBAL' });
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-white font-sans text-neutral-900 antialiased">
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="mx-auto max-w-md text-center">
            {/* Icon */}
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
              <span className="text-3xl">💥</span>
            </div>

            {/* Title */}
            <h1 className="mb-2 text-xl font-semibold text-neutral-900">
              Something went wrong
            </h1>

            {/* Description */}
            <p className="mb-6 text-sm text-neutral-500">
              A critical error occurred. Please try again or return to the home
              page.
            </p>

            {/* Error Digest */}
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
                href="/"
                className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
              >
                Go Home
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
