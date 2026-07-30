// =============================================================================
// About Page
// =============================================================================
// Static company/about page. Mission statement + the three product pillars
// (same trio as the homepage features) + a generic company blurb.
// =============================================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import { APP_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: `About — ${APP_NAME}`,
  description: `Our mission and the product pillars behind ${APP_NAME}.`,
};

const PILLARS = [
  {
    icon: '✨',
    title: 'AI Generation',
    desc: 'Turn a plain-language description into a complete, structured website — pages, sections, copy, and imagery — in seconds.',
  },
  {
    icon: '🎨',
    title: 'Visual Editor',
    desc: 'A drag-and-drop editor that gives you full creative control over every section, theme, and detail without writing code.',
  },
  {
    icon: '🚀',
    title: 'One-Click Deploy',
    desc: 'Ship to Vercel, Netlify, Cloudflare, or export the code with a single click. No build pipelines to manage.',
  },
];

const VALUES = [
  {
    title: 'Accessibility first',
    desc: 'Building a website should not require a computer science degree. We lower the barrier so anyone can launch a professional presence.',
  },
  {
    title: 'You own your content',
    desc: 'Your site, your data, your code. Export and take it with you whenever you want — no lock-in.',
  },
  {
    title: 'Fast by default',
    desc: 'Every generated site ships performant, responsive, and SEO-ready out of the box.',
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-20">
      {/* Mission */}
      <section className="mx-auto max-w-3xl text-center">
        <h1 className="mb-6 text-4xl font-bold tracking-tight text-neutral-900">
          Our mission
        </h1>
        <p className="text-lg text-neutral-600">
          {APP_NAME} exists to make a professional website accessible to every
          business. We believe describing what you do should be enough to launch
          a site — no code, no templates to hand-customize, no agencies required.
          Describe it, refine it visually, and ship it.
        </p>
      </section>

      {/* Pillars */}
      <section className="mt-20">
        <h2 className="mb-10 text-center text-2xl font-bold text-neutral-900">
          What we build on
        </h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {PILLARS.map((p) => (
            <div key={p.title} className="rounded-xl border border-neutral-200 bg-white p-6">
              <div className="mb-3 text-2xl">{p.icon}</div>
              <h3 className="mb-2 font-semibold text-neutral-900">{p.title}</h3>
              <p className="text-sm text-neutral-500">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="mt-20">
        <h2 className="mb-10 text-center text-2xl font-bold text-neutral-900">
          What we value
        </h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {VALUES.map((v) => (
            <div key={v.title} className="rounded-xl border border-neutral-200 bg-neutral-50 p-6">
              <h3 className="mb-2 font-semibold text-neutral-900">{v.title}</h3>
              <p className="text-sm text-neutral-600">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mt-20 text-center">
        <h2 className="mb-4 text-2xl font-bold text-neutral-900">
          Build something with us
        </h2>
        <p className="mb-8 text-neutral-500">
          The fastest way to see what we mean is to try it.
        </p>
        <Link
          href="/sign-up"
          className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-neutral-800"
        >
          Start Building Free
        </Link>
      </section>
    </div>
  );
}
