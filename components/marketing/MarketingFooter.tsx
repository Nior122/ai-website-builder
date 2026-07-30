// =============================================================================
// Marketing Footer
// =============================================================================
// Shared footer for all public marketing pages. Server component.
// Renders a link grid (Product / Company / Legal) plus the copyright line.
// =============================================================================

import Link from 'next/link';

const FOOTER_SECTIONS = [
  {
    title: 'Product',
    links: [
      { href: '/#features', label: 'Features' },
      { href: '/templates', label: 'Templates' },
      { href: '/pricing', label: 'Pricing' },
      { href: '/sign-up', label: 'Get Started' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/about', label: 'About' },
      { href: '/blog', label: 'Blog' },
      { href: '/sign-in', label: 'Sign In' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { href: '/terms', label: 'Terms' },
      { href: '/privacy', label: 'Privacy' },
    ],
  },
];

export function MarketingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-neutral-200 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand blurb */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900 text-sm font-bold text-white">
                AI
              </div>
              <span className="text-sm font-semibold text-neutral-900">
                Website Builder Studio
              </span>
            </div>
            <p className="mt-3 text-xs text-neutral-500">
              Build a professional website with just a description. AI-generated,
              customizable, and deployable in seconds.
            </p>
          </div>

          {/* Link grids */}
          {FOOTER_SECTIONS.map((section) => (
            <div key={section.title}>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-900">
                {section.title}
              </h4>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-neutral-500 transition-colors hover:text-neutral-900"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Copyright */}
        <div className="mt-10 border-t border-neutral-200 pt-6 text-center text-xs text-neutral-400">
          © {year} AI Website Builder Studio. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
