// =============================================================================
// Marketing Nav
// =============================================================================
// Shared top navigation for all public marketing pages. Server component —
// no client interactivity. For a mobile hamburger menu this would need
// `'use client'`; the layout collapses to stacked links on small screens
// via Tailwind responsive utilities.
// =============================================================================

import Link from 'next/link';

const NAV_LINKS = [
  { href: '/#features', label: 'Features' },
  { href: '/templates', label: 'Templates' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/about', label: 'About' },
  { href: '/blog', label: 'Blog' },
];

export function MarketingNav() {
  return (
    <nav className="sticky top-0 z-40 border-b border-neutral-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900 text-sm font-bold text-white">
            AI
          </div>
          <span className="text-sm font-semibold text-neutral-900">
            Website Builder Studio
          </span>
        </Link>

        {/* Center links */}
        <div className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Auth buttons */}
        <div className="flex items-center gap-3">
          <Link
            href="/sign-in"
            className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900"
          >
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}
