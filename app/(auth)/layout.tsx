// =============================================================================
// Auth Layout
// =============================================================================
// Minimal layout for sign-in/sign-up pages with centered card design.
// =============================================================================

import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-900">
              <span className="text-lg font-bold text-white">A</span>
            </div>
            <span className="text-xl font-bold text-neutral-900">
              AI Website Builder
            </span>
          </Link>
        </div>

        {/* Auth card */}
        {children}

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-neutral-500">
          By continuing, you agree to our{' '}
          <Link href="/terms" className="underline hover:text-neutral-700">
            Terms
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="underline hover:text-neutral-700">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}
