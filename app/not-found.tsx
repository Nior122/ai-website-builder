// =============================================================================
// Not Found Page (404)
// =============================================================================
// Custom 404 page for unmatched routes. No auth dependency — works anywhere.
// =============================================================================

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="mx-auto max-w-md text-center">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50">
          <span className="text-3xl">🧭</span>
        </div>

        {/* Title */}
        <h1 className="mb-2 text-xl font-semibold text-neutral-900">
          Page not found
        </h1>

        {/* Description */}
        <p className="mb-6 text-sm text-neutral-500">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/"
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
