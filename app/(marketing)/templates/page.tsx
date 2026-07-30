// =============================================================================
// Public Templates Page
// =============================================================================
// Public (no-auth) browse of built-in templates. Sources TEMPLATE_DATA
// directly in the server component — no fetch, no auth concern. Each card's
// CTA deep-links to sign-up with a ?template= query so the post-sign-up
// flow can preselect the template.
//
// NOTE: the real Template type uses `thumbnail` / `featured` / `usageCount`
// (NOT `thumbnailUrl` / `isPremium`). This page renders against the real
// shape. The dashboard templates page uses the (incorrect) other names.
// =============================================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import { APP_NAME, INDUSTRIES } from '@/lib/constants';
import { TEMPLATE_DATA } from '@/features/templates/data/template-data';

export const metadata: Metadata = {
  title: `Templates — ${APP_NAME}`,
  description: 'Browse starter templates for every industry and kick off your site in seconds.',
};

// Build an industry-label lookup from INDUSTRIES (value → label), fallback to
// a titled version of the raw industry value for industries not in the list.
const INDUSTRY_LABELS: Record<string, string> = Object.fromEntries(
  INDUSTRIES.map((i) => [i.value, i.label]),
);

function humanizeIndustry(value: string): string {
  return INDUSTRY_LABELS[value] ?? value.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function TemplatesPage() {
  // Featured first, then the rest, stable ordering by usage desc.
  const featured = TEMPLATE_DATA.filter((t) => t.featured);
  const others = TEMPLATE_DATA.filter((t) => !t.featured);
  const ordered = [
    ...featured.sort((a, b) => b.usageCount - a.usageCount),
    ...others.sort((a, b) => b.usageCount - a.usageCount),
  ];

  return (
    <div className="mx-auto max-w-6xl px-6 py-20">
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-neutral-900">
          Start from a template
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-neutral-500">
          Industry-tuned starting points. Pick one and the AI generation kicks
          off with your business details already populated.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {ordered.map((template) => (
          <div
            key={template.id}
            className="flex flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white"
          >
            {/* Thumbnail */}
            <div className="aspect-video bg-neutral-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={template.thumbnail}
                alt={template.name}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>

            {/* Body */}
            <div className="flex flex-1 flex-col p-5">
              <div className="mb-2 flex items-center justify-between">
                <span className="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-600">
                  {humanizeIndustry(template.industry)}
                </span>
                {template.featured && (
                  <span className="text-xs font-medium text-neutral-400">
                    ★ Featured
                  </span>
                )}
              </div>

              <h3 className="font-semibold text-neutral-900">{template.name}</h3>
              <p className="mt-1 flex-1 text-sm text-neutral-500">
                {template.description}
              </p>

              {/* Tags */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {template.tags.slice(0, 4).map((tag) => (
                  <span
                    key={tag}
                    className="rounded bg-neutral-50 px-2 py-0.5 text-[10px] text-neutral-400"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-neutral-400">
                  {template.usageCount.toLocaleString()} sites built
                </span>
                <Link
                  href={`/sign-up?template=${template.id}`}
                  className="rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-neutral-800"
                >
                  Use template
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
