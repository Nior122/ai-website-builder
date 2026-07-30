// =============================================================================
// Export Service
// =============================================================================
// Generates exportable code from the JSON-first project structure.
// Supports Next.js, React, HTML, and Tailwind formats.
// =============================================================================

import type { Project, Page, Section } from '@prisma/client';
import type { ExportFormat } from '@/types';
import type { ExportFile } from '../types';
import { ExportFormatError } from '@/lib/errors';

type ProjectWithPages = Project & {
  pages: (Page & { sections: Section[] })[];
};

/**
 * Generate export files for a project.
 */
export async function generateExport(
  project: ProjectWithPages,
  format: ExportFormat
): Promise<ExportFile[]> {
  switch (format) {
    case 'nextjs':
      return generateNextJs(project);
    case 'react':
      return generateReact(project);
    case 'html':
      return generateHTML(project);
    case 'tailwind':
      return generateTailwind(project);
    case 'markdown':
      return generateMarkdown(project);
    case 'json':
      return generateJSON(project);
    default:
      throw new ExportFormatError(`Unsupported format: ${format}`);
  }
}

// ─── Next.js Generator ─────────────────────────────────────────────────

async function generateNextJs(project: ProjectWithPages): Promise<ExportFile[]> {
  const files: ExportFile[] = [];

  // package.json
  files.push({
    path: 'package.json',
    content: JSON.stringify(
      {
        name: project.slug,
        version: '1.0.0',
        private: true,
        scripts: { dev: 'next dev', build: 'next build', start: 'next start' },
        dependencies: { next: '^15.0.0', react: '^19.0.0', 'react-dom': '^19.0.0' },
      },
      null,
      2
    ),
    size: 0,
    type: 'json',
  });

  // Each page becomes a route
  for (const page of project.pages) {
    const componentName = toPascalCase(page.slug);
    const sections = page.sections
      .map((s) => renderSectionToJSX(s))
      .join('\n');

    files.push({
      path: `app/${page.isHome ? 'page' : `${page.slug}/page`}.tsx`,
      content: `import { Metadata } from 'next';\n\nexport const metadata: Metadata = {\n  title: '${page.metaTitle || page.title}',\n  description: '${page.metaDescription || ''}',\n};\n\nexport default function ${componentName}Page() {\n  return (\n    <main>\n${sections}\n    </main>\n  );\n}\n`,
      size: 0,
      type: 'js',
    });
  }

  // Global styles
  files.push({
    path: 'app/globals.css',
    content: generateCSSVariables(project),
    size: 0,
    type: 'css',
  });

  return files;
}

// ─── React Generator ───────────────────────────────────────────────────

async function generateReact(project: ProjectWithPages): Promise<ExportFile[]> {
  const files: ExportFile[] = [];

  files.push({
    path: 'src/App.tsx',
    content: `import React from 'react';\n${project.pages.map((p) => `import ${toPascalCase(p.slug)} from './pages/${toPascalCase(p.slug)}';`).join('\n')}\n\nexport default function App() {\n  return (\n    <div>\n${project.pages.map((p) => `      <${toPascalCase(p.slug)} />`).join('\n')}\n    </div>\n  );\n}\n`,
    size: 0,
    type: 'js',
  });

  for (const page of project.pages) {
    const sections = page.sections.map((s) => renderSectionToJSX(s)).join('\n');
    files.push({
      path: `src/pages/${toPascalCase(page.slug)}.tsx`,
      content: `import React from 'react';\n\nexport default function ${toPascalCase(page.slug)}() {\n  return (\n    <div>\n${sections}\n    </div>\n  );\n}\n`,
      size: 0,
      type: 'js',
    });
  }

  return files;
}

// ─── HTML Generator ────────────────────────────────────────────────────

async function generateHTML(project: ProjectWithPages): Promise<ExportFile[]> {
  const files: ExportFile[] = [];

  for (const page of project.pages) {
    const sections = page.sections.map((s) => renderSectionToHTML(s)).join('\n');
    files.push({
      path: page.isHome ? 'index.html' : `${page.slug}.html`,
      content: `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>${page.metaTitle || page.title}</title>\n  <meta name="description" content="${page.metaDescription || ''}">\n</head>\n<body>\n${sections}\n</body>\n</html>`,
      size: 0,
      type: 'html',
    });
  }

  return files;
}

// ─── Tailwind Generator ────────────────────────────────────────────────

async function generateTailwind(project: ProjectWithPages): Promise<ExportFile[]> {
  const files = await generateHTML(project);
  return files.map((f) => ({
    ...f,
    content: f.content.replace(
      '</head>',
      '  <script src="https://cdn.tailwindcss.com"></script>\n</head>'
    ),
  }));
}

// ─── Markdown Generator ────────────────────────────────────────────────

async function generateMarkdown(project: ProjectWithPages): Promise<ExportFile[]> {
  const files: ExportFile[] = [];

  for (const page of project.pages) {
    const content = page.sections
      .map((s) => {
        const data = s.content as Record<string, unknown>;
        const heading = data.headline || data.title || data.heading || '';
        const subheading = data.subheadline || data.description || '';
        const body = data.body || data.text || '';
        return [`## ${heading}`, subheading ? `> ${subheading}` : '', body].filter(Boolean).join('\n\n');
      })
      .join('\n\n---\n\n');

    files.push({
      path: `${page.slug}.md`,
      content: `# ${page.title}\n\n${content}`,
      size: 0,
      type: 'other',
    });
  }

  return files;
}

// ─── JSON Generator ────────────────────────────────────────────────────

async function generateJSON(project: ProjectWithPages): Promise<ExportFile[]> {
  return [
    {
      path: 'project.json',
      content: JSON.stringify(project, null, 2),
      size: 0,
      type: 'json',
    },
  ];
}

// ─── Helpers ────────────────────────────────────────────────────────────

type Content = Record<string, unknown>;

function str(v: unknown): string {
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  return '';
}

function esc(v: unknown): string {
  return str(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function classAttr(...classes: (string | undefined | false)[]): string {
  const c = classes.filter(Boolean).join(' ');
  return c ? ` class="${c}"` : '';
}

function styleAttr(s: Record<string, string | undefined>): string {
  const pairs = Object.entries(s).filter(([, v]) => v != null);
  return pairs.length ? ` style="${pairs.map(([k, v]) => `${k}:${v}`).join(';')}"` : '';
}

/** Render a single primitive value (string or number) inside a <span> wrapper. */
function wrap(v: unknown, tag = 'span', cls = ''): string {
  const t = esc(v);
  return t ? `<${tag}${classAttr(cls)}>${t}</${tag}>` : '';
}

// ─── Section Renderers ───────────────────────────────────────────────────
// Each renderer receives the section content object and returns an HTML string
// using Tailwind utility classes. The `generateTailwind` wrapper injects the
// CDN script so the classes work on any static host.
// The JSX variant mirrors the same structure for Next.js code export.
// ─────────────────────────────────────────────────────────────────────────

function renderSectionToJSX(section: Section): string {
  const data = section.content as Content;
  const type = section.type;

  switch (type) {
    case 'hero':
      return renderHeroJSX(data);
    case 'features':
    case 'features-grid':
      return renderFeaturesJSX(data);
    case 'testimonials':
      return renderTestimonialsJSX(data);
    case 'pricing':
      return renderPricingJSX(data);
    case 'faq':
      return renderFAQJSX(data);
    case 'contact':
      return renderContactJSX(data);
    case 'cta':
      return renderCTAJSX(data);
    case 'stats':
      return renderStatsJSX(data);
    case 'team':
      return renderTeamJSX(data);
    case 'newsletter':
      return renderNewsletterJSX(data);
    case 'about':
      return renderAboutJSX(data);
    case 'footer':
      return renderFooterJSX(data);
    case 'header':
    case 'nav':
      return renderHeaderNavJSX(data);
    default:
      return renderGenericJSX(section);
  }
}

function renderSectionToHTML(section: Section): string {
  const data = section.content as Content;
  const type = section.type;

  const layoutCls = section.layout ? ` section--${section.layout}` : '';

  switch (type) {
    case 'hero':
      return wrapSection('hero', renderHeroHTML(data), layoutCls);
    case 'features':
    case 'features-grid':
      return wrapSection('features', renderFeaturesHTML(data), layoutCls);
    case 'testimonials':
      return wrapSection('testimonials', renderTestimonialsHTML(data), layoutCls);
    case 'pricing':
      return wrapSection('pricing', renderPricingHTML(data), layoutCls);
    case 'faq':
      return wrapSection('faq', renderFAQHTML(data), layoutCls);
    case 'contact':
      return wrapSection('contact', renderContactHTML(data), layoutCls);
    case 'cta':
      return wrapSection('cta', renderCTAHTML(data), layoutCls);
    case 'stats':
      return wrapSection('stats', renderStatsHTML(data), layoutCls);
    case 'team':
      return wrapSection('team', renderTeamHTML(data), layoutCls);
    case 'newsletter':
      return wrapSection('newsletter', renderNewsletterHTML(data), layoutCls);
    case 'about':
      return wrapSection('about', renderAboutHTML(data), layoutCls);
    case 'footer':
      return wrapSection('footer', renderFooterHTML(data), layoutCls);
    case 'header':
    case 'nav':
      return wrapSection('header', renderHeaderNavHTML(data), layoutCls);
    default:
      return wrapSection(type, renderGenericHTML(data), layoutCls);
  }
}

// ─── Helpers for building section wrappers ────────────────────────────

function wrapSection(type: string, inner: string, extra = ''): string {
  return `    <section${classAttr(`section section--${type}${extra} py-16 px-4`)}>\n      <div class="max-w-6xl mx-auto">\n${inner}      </div>\n    </section>`;
}

function bgCls(data: Content): string {
  return data.darkBackground ? ' bg-gray-900 text-white' : ' bg-white text-gray-900';
}

// ─── CTA / Button helpers ──────────────────────────────────────────────

/** Safely extract a property from data.cta which may be a string or Record. */
function ctaProp(data: Content, key: 'text' | 'url' | 'href'): string | undefined {
  const cta = data.cta;
  if (!cta || typeof cta !== 'object') return undefined;
  const rec = cta as Record<string, unknown>;
  return typeof rec[key] === 'string' ? (rec[key] as string) : undefined;
}

function renderCTAButton(data: Content, cls = ''): string {
  const text = esc(data.ctaText ?? ctaProp(data, 'text') ?? data.buttonText ?? '');
  const url = esc(data.ctaUrl ?? ctaProp(data, 'url') ?? ctaProp(data, 'href') ?? '#');
  return text ? `<a href="${url}"${classAttr(`inline-block px-6 py-3 rounded-lg font-semibold transition ${cls || 'bg-indigo-600 text-white hover:bg-indigo-700'}`)}>${text}</a>` : '';
}

function renderCTAButtonJSX(data: Content): string {
  const text = esc(data.ctaText ?? ctaProp(data, 'text') ?? data.buttonText ?? '');
  const href = esc(data.ctaUrl ?? ctaProp(data, 'url') ?? ctaProp(data, 'href') ?? '#');
  return text ? `          <a href="${href}" className="inline-block px-6 py-3 rounded-lg font-semibold transition ${data.ctaCls || 'bg-indigo-600 text-white hover:bg-indigo-700'}">${text}</a>` : '';
}

// ─── Hero ─────────────────────────────────────────────────────────────

function renderHeroHTML(data: Content): string {
  const headline = esc(data.headline ?? data.title ?? 'Hero');
  const sub = esc(data.subheadline ?? data.description ?? data.subtitle ?? '');
  const body = esc(data.body ?? '');
  const cta = renderCTAButton(data);
  const img = data.image ? `<img src="${esc(data.image)}" alt="${esc(data.imageAlt ?? '')}" class="mt-8 mx-auto max-w-full rounded-xl" />` : '';
  return `        <div class="text-center py-12 md:py-20">
          <h1 class="text-4xl md:text-5xl font-bold tracking-tight mb-4">${headline}</h1>
          ${sub ? `<p class="text-xl text-gray-600 mb-6 max-w-2xl mx-auto">${sub}</p>` : ''}
          ${body ? `<p class="text-gray-500 mb-8 max-w-xl mx-auto">${body}</p>` : ''}
          ${cta ? `<div class="flex justify-center gap-4">${cta}</div>` : ''}
          ${img}
        </div>`;
}

function renderHeroJSX(data: Content): string {
  const headline = esc(data.headline ?? data.title ?? 'Hero');
  const sub = esc(data.subheadline ?? data.description ?? data.subtitle ?? '');
  const body = esc(data.body ?? '');
  const cta = renderCTAButtonJSX(data);
  const img = data.image ? `        <img src="${esc(data.image)}" alt="${esc(data.imageAlt ?? '')}" className="mt-8 mx-auto max-w-full rounded-xl" />` : '';
  return `      <section className="py-16 md:py-24 px-4 bg-gradient-to-b from-indigo-50 to-white">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">${headline}</h1>
          ${sub ? `<p className="text-xl text-gray-600 mb-6 max-w-2xl mx-auto">${sub}</p>` : ''}
          ${body ? `<p className="text-gray-500 mb-8 max-w-xl mx-auto">${body}</p>` : ''}
          ${cta ? `<div className="flex justify-center gap-4">${cta}</div>` : ''}
          ${img}
        </div>
      </section>`;
}

// ─── Features ─────────────────────────────────────────────────────────

function renderFeaturesHTML(data: Content): string {
  const headline = esc(data.headline ?? data.title ?? 'Features');
  const sub = esc(data.subheadline ?? data.description ?? '');
  const cards = (data.cards ?? data.features ?? []) as Content[];
  const cols = data.columns ?? '3';
  const gridCls = `grid grid-cols-1 md:grid-cols-${Math.min(3, Math.max(1, Number(cols) || 3))} gap-8`;
  const items = cards.map((c: Content) => {
    const icon = str(c.icon);
    return `<div${classAttr('p-6 rounded-xl border border-gray-200 hover:shadow-md transition')}>
      ${icon ? `<div class="text-3xl mb-3">${esc(icon)}</div>` : ''}
      <h3 class="text-lg font-semibold mb-2">${esc(c.title ?? c.heading ?? '')}</h3>
      <p class="text-gray-600 text-sm">${esc(c.description ?? c.body ?? '')}</p>
    </div>`;
  }).join('\n          ');
  return `        <h2 class="text-3xl font-bold text-center mb-2">${headline}</h2>
        ${sub ? `<p class="text-gray-600 text-center mb-10 max-w-2xl mx-auto">${sub}</p>` : ''}
        <div${classAttr(gridCls)}>
          ${items}
        </div>`;
}

function renderFeaturesJSX(data: Content): string {
  const headline = esc(data.headline ?? data.title ?? 'Features');
  const sub = esc(data.subheadline ?? data.description ?? '');
  const cards = (data.cards ?? data.features ?? []) as Content[];
  const items = cards.map((c: Content) => {
    const icon = str(c.icon);
    return `          <div className="p-6 rounded-xl border border-gray-200 hover:shadow-md transition">
            ${icon ? `<div className="text-3xl mb-3">${icon}</div>` : ''}
            <h3 className="text-lg font-semibold mb-2">${esc(c.title ?? c.heading ?? '')}</h3>
            <p className="text-gray-600 text-sm">${esc(c.description ?? c.body ?? '')}</p>
          </div>`;
  }).join('\n');
  return `      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-2">${headline}</h2>
          ${sub ? `<p className="text-gray-600 text-center mb-10 max-w-2xl mx-auto">${sub}</p>` : ''}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            ${items}
          </div>
        </div>
      </section>`;
}

// ─── Testimonials ─────────────────────────────────────────────────────

function renderTestimonialsHTML(data: Content): string {
  const headline = esc(data.headline ?? data.title ?? 'Testimonials');
  const items = (data.testimonials ?? data.cards ?? []) as Content[];
  const cards = items.map((t: Content) =>
    `<div${classAttr('p-6 rounded-xl border border-gray-200 bg-gray-50')}>
      <p class="text-gray-700 italic mb-4">${esc(t.quote ?? t.content ?? t.text ?? '')}</p>
      <div class="flex items-center gap-3">
        ${t.avatar ? `<img src="${esc(t.avatar)}" alt="${esc(t.name ?? '')}" class="w-10 h-10 rounded-full" />` : ''}
        <div>
          <p class="font-semibold text-sm">${esc(t.name ?? t.author ?? '')}</p>
          ${t.role ? `<p class="text-gray-500 text-xs">${esc(t.role)}</p>` : ''}
        </div>
      </div>
    </div>`
  ).join('\n          ');
  return `        <h2 class="text-3xl font-bold text-center mb-10">${headline}</h2>
        <div${classAttr('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6')}>
          ${cards}
        </div>`;
}

function renderTestimonialsJSX(data: Content): string {
  const headline = esc(data.headline ?? data.title ?? 'Testimonials');
  const items = (data.testimonials ?? data.cards ?? []) as Content[];
  const cards = items.map((t: Content) =>
    `          <div className="p-6 rounded-xl border border-gray-200 bg-gray-50">
              <p className="text-gray-700 italic mb-4">${esc(t.quote ?? t.content ?? t.text ?? '')}</p>
              <div className="flex items-center gap-3">
                ${t.avatar ? `<img src="${esc(t.avatar)}" alt="${esc(t.name ?? '')}" className="w-10 h-10 rounded-full" />` : ''}
                <div>
                  <p className="font-semibold text-sm">${esc(t.name ?? t.author ?? '')}</p>
                  ${t.role ? `<p className="text-gray-500 text-xs">${esc(t.role)}</p>` : ''}
                </div>
              </div>
            </div>`
  ).join('\n');
  return `      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-10">${headline}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            ${cards}
          </div>
        </div>
      </section>`;
}

// ─── Pricing ──────────────────────────────────────────────────────────

function renderPricingHTML(data: Content): string {
  const headline = esc(data.headline ?? data.title ?? 'Pricing');
  const plans = (data.plans ?? data.tiers ?? []) as Content[];
  const cards = plans.map((p: Content) =>
    `<div${classAttr(`p-6 rounded-xl border ${p.featured ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-gray-200'} ${bgCls(data)}`)}>
      <h3 class="text-xl font-bold mb-2">${esc(p.name ?? p.title ?? '')}</h3>
      ${p.price ? `<p class="text-3xl font-bold mb-1">${esc(p.price)}</p>` : ''}
      ${p.interval ? `<p class="text-sm text-gray-500 mb-4">${esc(p.interval)}</p>` : ''}
      <p class="text-sm text-gray-600 mb-6">${esc(p.description ?? '')}</p>
      ${p.features && Array.isArray(p.features) ? `<ul class="space-y-2 mb-6">\n${(p.features as string[]).map((f: string) => `          <li class="flex items-start gap-2 text-sm"><span class="text-green-500 mt-0.5">\\u2713</span>${esc(f)}</li>`).join('\n')}\n        </ul>` : ''}
      ${renderCTAButton(p, 'w-full text-center')}
    </div>`
  ).join('\n          ');
  return `        <h2 class="text-3xl font-bold text-center mb-2">${headline}</h2>
        ${data.subheadline ? `<p class="text-gray-600 text-center mb-10 max-w-2xl mx-auto">${esc(data.subheadline)}</p>` : ''}
        <div${classAttr('grid grid-cols-1 md:grid-cols-3 gap-8')}>
          ${cards}
        </div>`;
}

function renderPricingJSX(data: Content): string {
  const headline = esc(data.headline ?? data.title ?? 'Pricing');
  const plans = (data.plans ?? data.tiers ?? []) as Content[];
  const cards = plans.map((p: Content) =>
    `          <div className={\`p-6 rounded-xl border \${${p.featured} ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-gray-200'} \${${data.darkBackground} ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}\`}>
              <h3 className="text-xl font-bold mb-2">${esc(p.name ?? p.title ?? '')}</h3>
              ${p.price ? `<p className="text-3xl font-bold mb-1">${esc(p.price)}</p>` : ''}
              ${p.interval ? `<p className="text-sm text-gray-500 mb-4">${esc(p.interval)}</p>` : ''}
              <p className="text-sm text-gray-600 mb-6">${esc(p.description ?? '')}</p>
              ${p.features && Array.isArray(p.features) ? `<ul className="space-y-2 mb-6">\n${(p.features as string[]).map((f: string) => `                <li className="flex items-start gap-2 text-sm"><span className="text-green-500 mt-0.5">\\u2713</span>${esc(f)}</li>`).join('\n')}\n              </ul>` : ''}
              ${renderCTAButtonJSX({ ...p, ctaCls: 'w-full text-center' })}
            </div>`
  ).join('\n');
  return `      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-2">${headline}</h2>
          ${data.subheadline ? `<p className="text-gray-600 text-center mb-10 max-w-2xl mx-auto">${esc(data.subheadline)}</p>` : ''}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            ${cards}
          </div>
        </div>
      </section>`;
}

// ─── FAQ ──────────────────────────────────────────────────────────────

function renderFAQHTML(data: Content): string {
  const headline = esc(data.headline ?? data.title ?? 'FAQ');
  const items = (data.questions ?? data.faqs ?? data.items ?? []) as Content[];
  const list = items.map((q: Content, i: number) =>
    `<details${classAttr('border-b border-gray-200 py-4')}${i === 0 ? ' open' : ''}>
      <summary class="font-medium cursor-pointer">${esc(q.question ?? q.q ?? q.title ?? '')}</summary>
      <p class="mt-2 text-gray-600 text-sm">${esc(q.answer ?? q.a ?? q.content ?? q.description ?? '')}</p>
    </details>`
  ).join('\n          ');
  return `        <h2 class="text-3xl font-bold text-center mb-2">${headline}</h2>
        ${data.subheadline ? `<p class="text-gray-600 text-center mb-8">${esc(data.subheadline)}</p>` : ''}
        <div${classAttr('max-w-3xl mx-auto')}>
          ${list}
        </div>`;
}

function renderFAQJSX(data: Content): string {
  const headline = esc(data.headline ?? data.title ?? 'FAQ');
  const items = (data.questions ?? data.faqs ?? data.items ?? []) as Content[];
  const list = items.map((q: Content) =>
    `          <div className="border-b border-gray-200 py-4">
              <details>
                <summary className="font-medium cursor-pointer">${esc(q.question ?? q.q ?? q.title ?? '')}</summary>
                <p className="mt-2 text-gray-600 text-sm">${esc(q.answer ?? q.a ?? q.content ?? q.description ?? '')}</p>
              </details>
            </div>`
  ).join('\n');
  return `      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-2">${headline}</h2>
          ${data.subheadline ? `<p className="text-gray-600 text-center mb-8">${esc(data.subheadline)}</p>` : ''}
          <div className="max-w-3xl mx-auto">
            ${list}
          </div>
        </div>
      </section>`;
}

// ─── Contact ──────────────────────────────────────────────────────────

function renderContactHTML(data: Content): string {
  const headline = esc(data.headline ?? data.title ?? 'Contact');
  const email = esc(data.email ?? '');
  const phone = esc(data.phone ?? '');
  const address = esc(data.address ?? '');
  const fields = (data.fields ?? data.formFields ?? []) as Content[];
  const inputs = fields.map((f: Content) =>
    f.type === 'textarea'
      ? `          <textarea placeholder="${esc(f.placeholder ?? '')}"${classAttr('w-full border border-gray-300 rounded-lg px-4 py-2 text-sm')} rows="4"></textarea>`
      : `          <input type="${esc(f.type ?? 'text')}" placeholder="${esc(f.placeholder ?? f.label ?? '')}"${classAttr('w-full border border-gray-300 rounded-lg px-4 py-2 text-sm')} />`
  ).join('\n');
  return `        <div class="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <h2 class="text-3xl font-bold mb-4">${headline}</h2>
            ${data.subheadline ? `<p class="text-gray-600 mb-6">${esc(data.subheadline)}</p>` : ''}
            ${email ? `<p class="text-sm mb-1"><strong>Email:</strong> ${email}</p>` : ''}
            ${phone ? `<p class="text-sm mb-1"><strong>Phone:</strong> ${phone}</p>` : ''}
            ${address ? `<p class="text-sm"><strong>Address:</strong> ${address}</p>` : ''}
          </div>
          <div class="space-y-4">
            ${inputs}
            <button${classAttr('bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 text-sm')}>${esc(data.submitLabel ?? data.buttonText ?? 'Send Message')}</button>
          </div>
        </div>`;
}

function renderContactJSX(data: Content): string {
  const headline = esc(data.headline ?? data.title ?? 'Contact');
  const email = esc(data.email ?? '');
  const phone = esc(data.phone ?? '');
  const address = esc(data.address ?? '');
  const fields = (data.fields ?? data.formFields ?? []) as Content[];
  const inputs = fields.map((f: Content) =>
    f.type === 'textarea'
      ? `            <textarea placeholder="${esc(f.placeholder ?? '')}" className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm" rows={4}></textarea>`
      : `            <input type="${esc(f.type ?? 'text')}" placeholder="${esc(f.placeholder ?? f.label ?? '')}" className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm" />`
  ).join('\n');
  return `      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold mb-4">${headline}</h2>
              ${data.subheadline ? `<p className="text-gray-600 mb-6">${esc(data.subheadline)}</p>` : ''}
              ${email ? `<p className="text-sm mb-1"><strong>Email:</strong> ${email}</p>` : ''}
              ${phone ? `<p className="text-sm mb-1"><strong>Phone:</strong> ${phone}</p>` : ''}
              ${address ? `<p className="text-sm"><strong>Address:</strong> ${address}</p>` : ''}
            </div>
            <div className="space-y-4">
              ${inputs}
              <button className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 text-sm">${esc(data.submitLabel ?? data.buttonText ?? 'Send Message')}</button>
            </div>
          </div>
        </div>
      </section>`;
}

// ─── CTA ──────────────────────────────────────────────────────────────

function renderCTAHTML(data: Content): string {
  const headline = esc(data.headline ?? data.title ?? 'Ready to Start?');
  const body = esc(data.description ?? data.body ?? '');
  const cta = renderCTAButton(data);
  return `        <div class="text-center py-12 ${data.darkBackground ? 'bg-indigo-700 text-white' : 'bg-indigo-50'} rounded-2xl px-8">
          <h2 class="text-3xl font-bold mb-3">${headline}</h2>
          ${body ? `<p class="text-lg mb-6 max-w-xl mx-auto${data.darkBackground ? ' text-indigo-100' : ' text-gray-600'}">${body}</p>` : ''}
          ${cta ? `<div class="flex justify-center">${cta}</div>` : ''}
        </div>`;
}

function renderCTAJSX(data: Content): string {
  const headline = esc(data.headline ?? data.title ?? 'Ready to Start?');
  const body = esc(data.description ?? data.body ?? '');
  const cta = renderCTAButtonJSX(data);
  return `      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className={\`text-center py-12 \${${data.darkBackground} ? 'bg-indigo-700 text-white' : 'bg-indigo-50'} rounded-2xl px-8\`}>
            <h2 className="text-3xl font-bold mb-3">${headline}</h2>
            ${body ? `<p className={\`text-lg mb-6 max-w-xl mx-auto \${${data.darkBackground} ? 'text-indigo-100' : 'text-gray-600'}\`}>${body}</p>` : ''}
            ${cta ? `<div className="flex justify-center">${cta}</div>` : ''}
          </div>
        </div>
      </section>`;
}

// ─── Stats ────────────────────────────────────────────────────────────

function renderStatsHTML(data: Content): string {
  const items = (data.stats ?? data.statistics ?? data.cards ?? []) as Content[];
  const stats = items.map((s: Content) =>
    `<div class="text-center">
      <p class="text-4xl font-bold text-indigo-600">${esc(s.value ?? s.stat ?? s.number ?? '')}</p>
      <p class="text-sm text-gray-600 mt-1">${esc(s.label ?? s.name ?? s.title ?? '')}</p>
    </div>`
  ).join('\n          ');
  return `        <div${classAttr('grid grid-cols-2 md:grid-cols-4 gap-8')}>
          ${stats}
        </div>`;
}

function renderStatsJSX(data: Content): string {
  const items = (data.stats ?? data.statistics ?? data.cards ?? []) as Content[];
  const stats = items.map((s: Content) =>
    `          <div className="text-center">
              <p className="text-4xl font-bold text-indigo-600">${esc(s.value ?? s.stat ?? s.number ?? '')}</p>
              <p className="text-sm text-gray-600 mt-1">${esc(s.label ?? s.name ?? s.title ?? '')}</p>
            </div>`
  ).join('\n');
  return `      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            ${stats}
          </div>
        </div>
      </section>`;
}

// ─── Team ─────────────────────────────────────────────────────────────

function renderTeamHTML(data: Content): string {
  const headline = esc(data.headline ?? data.title ?? 'Our Team');
  const members = (data.members ?? data.team ?? data.cards ?? []) as Content[];
  const cards = members.map((m: Content) =>
    `<div class="text-center">
      ${m.avatar ?? m.image ? `<img src="${esc(m.avatar ?? m.image ?? '')}" alt="${esc(m.name ?? '')}" class="w-24 h-24 rounded-full mx-auto mb-3 object-cover" />` : ''}
      <h3 class="font-semibold">${esc(m.name ?? '')}</h3>
      ${m.role ? `<p class="text-sm text-gray-500">${esc(m.role)}</p>` : ''}
    </div>`
  ).join('\n          ');
  return `        <h2 class="text-3xl font-bold text-center mb-2">${headline}</h2>
        ${data.subheadline ? `<p class="text-gray-600 text-center mb-10">${esc(data.subheadline)}</p>` : ''}
        <div${classAttr('grid grid-cols-2 md:grid-cols-4 gap-8')}>
          ${cards}
        </div>`;
}

function renderTeamJSX(data: Content): string {
  const headline = esc(data.headline ?? data.title ?? 'Our Team');
  const members = (data.members ?? data.team ?? data.cards ?? []) as Content[];
  const cards = members.map((m: Content) =>
    `          <div className="text-center">
              ${m.avatar ?? m.image ? `<img src="${esc(m.avatar ?? m.image ?? '')}" alt="${esc(m.name ?? '')}" className="w-24 h-24 rounded-full mx-auto mb-3 object-cover" />` : ''}
              <h3 className="font-semibold">${esc(m.name ?? '')}</h3>
              ${m.role ? `<p className="text-sm text-gray-500">${esc(m.role)}</p>` : ''}
            </div>`
  ).join('\n');
  return `      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-2">${headline}</h2>
          ${data.subheadline ? `<p className="text-gray-600 text-center mb-10">${esc(data.subheadline)}</p>` : ''}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            ${cards}
          </div>
        </div>
      </section>`;
}

// ─── Newsletter ───────────────────────────────────────────────────────

function renderNewsletterHTML(data: Content): string {
  const headline = esc(data.headline ?? data.title ?? 'Stay Updated');
  return `        <div class="text-center py-12 bg-gray-100 rounded-2xl px-8">
          <h2 class="text-3xl font-bold mb-3">${headline}</h2>
          <p class="text-gray-600 mb-6 max-w-md mx-auto">${esc(data.description ?? data.body ?? 'Subscribe to our newsletter')}</p>
          <div class="flex max-w-md mx-auto gap-2">
            <input type="email" placeholder="${esc(data.placeholder ?? 'your@email.com')}" class="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm" />
            <button class="bg-indigo-600 text-white px-5 py-2 rounded-lg font-semibold text-sm hover:bg-indigo-700">${esc(data.buttonText ?? data.submitLabel ?? 'Subscribe')}</button>
          </div>
        </div>`;
}

function renderNewsletterJSX(data: Content): string {
  const headline = esc(data.headline ?? data.title ?? 'Stay Updated');
  return `      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12 bg-gray-100 rounded-2xl px-8">
            <h2 className="text-3xl font-bold mb-3">${headline}</h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">${esc(data.description ?? data.body ?? 'Subscribe to our newsletter')}</p>
            <div className="flex max-w-md mx-auto gap-2">
              <input type="email" placeholder="${esc(data.placeholder ?? 'your@email.com')}" className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm" />
              <button className="bg-indigo-600 text-white px-5 py-2 rounded-lg font-semibold text-sm hover:bg-indigo-700">${esc(data.buttonText ?? data.submitLabel ?? 'Subscribe')}</button>
            </div>
          </div>
        </div>
      </section>`;
}

// ─── About ────────────────────────────────────────────────────────────

function renderAboutHTML(data: Content): string {
  const headline = esc(data.headline ?? data.title ?? 'About');
  const img = data.image ? `<img src="${esc(data.image)}" alt="${esc(data.imageAlt ?? headline)}" class="rounded-xl w-full" />` : '';
  const layout = data.imagePosition === 'left' ? 'md:flex-row-reverse' : '';
  return `        <div class="flex flex-col ${layout} md:flex-row items-center gap-12">
          ${img ? `<div class="md:w-1/2">${img}</div>` : ''}
          <div class="${img ? 'md:w-1/2' : ''}">
            <h2 class="text-3xl font-bold mb-4">${headline}</h2>
            <p class="text-gray-600 leading-relaxed">${esc(data.body ?? data.description ?? data.content ?? '')}</p>
            ${renderCTAButton(data)}
          </div>
        </div>`;
}

function renderAboutJSX(data: Content): string {
  const headline = esc(data.headline ?? data.title ?? 'About');
  const img = data.image ? `<img src="${esc(data.image)}" alt="${esc(data.imageAlt ?? headline)}" className="rounded-xl w-full" />` : '';
  return `      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className={\`flex flex-col md:flex-row items-center gap-12 \${data.imagePosition === 'left' ? 'md:flex-row-reverse' : ''}\`}>
            ${img ? `<div className="md:w-1/2">${img}</div>` : ''}
            <div className={${img ? "'md:w-1/2'" : "''"}}>
              <h2 className="text-3xl font-bold mb-4">${headline}</h2>
              <p className="text-gray-600 leading-relaxed">${esc(data.body ?? data.description ?? data.content ?? '')}</p>
              ${renderCTAButtonJSX(data)}
            </div>
          </div>
        </div>
      </section>`;
}

// ─── Footer ───────────────────────────────────────────────────────────

function renderFooterHTML(data: Content): string {
  const links = (data.links ?? []) as Content[];
  const linkItems = links.map((l: Content) =>
    `<a href="${esc(l.url ?? l.href ?? '#')}" class="text-sm text-gray-500 hover:text-gray-700 transition">${esc(l.text ?? l.label ?? l.title ?? '')}</a>`
  ).join('\n            ');
  return `        <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div class="col-span-2 md:col-span-1">
            <p class="font-bold text-lg mb-2">${esc(data.brand ?? data.title ?? data.companyName ?? '')}</p>
            <p class="text-sm text-gray-500">${esc(data.description ?? '')}</p>
          </div>
          ${data.columns && Array.isArray(data.columns) ? (data.columns as Content[]).map((col: Content) =>
            `<div>
              <p class="font-semibold text-sm mb-3">${esc(col.title ?? col.heading ?? '')}</p>
              <div class="flex flex-col gap-2">
                ${(Array.isArray(col.links) ? col.links as Content[] : []).map((l: Content) => `<a href="${esc(l.url ?? l.href ?? '#')}" class="text-sm text-gray-500 hover:text-gray-700 transition">${esc(l.text ?? l.label ?? '')}</a>`).join('\n                ')}
              </div>
            </div>`
          ).join('\n          ') : linkItems.length ? `<div class="flex flex-col gap-2">${linkItems}</div>` : ''}
        </div>
        <div class="mt-10 pt-6 border-t border-gray-200 text-center text-sm text-gray-400">
          &copy; ${new Date().getFullYear()} ${esc(data.brand ?? data.companyName ?? 'AI Website Builder')}. All rights reserved.
        </div>`;
}

function renderFooterJSX(data: Content): string {
  const links = (data.links ?? []) as Content[];
  const linkItems = links.map((l: Content) =>
    `<a href="${esc(l.url ?? l.href ?? '#')}" className="text-sm text-gray-500 hover:text-gray-700 transition">${esc(l.text ?? l.label ?? l.title ?? '')}</a>`
  ).join('\n              ');
  return `      <footer className="py-12 px-4 bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <p className="font-bold text-lg mb-2">${esc(data.brand ?? data.title ?? data.companyName ?? '')}</p>
              <p className="text-sm text-gray-400">${esc(data.description ?? '')}</p>
            </div>
            ${data.columns && Array.isArray(data.columns) ? (data.columns as Content[]).map((col: Content) =>
              `<div>
                <p className="font-semibold text-sm mb-3 text-gray-300">${esc(col.title ?? col.heading ?? '')}</p>
                <div className="flex flex-col gap-2">
                  ${(Array.isArray(col.links) ? col.links as Content[] : []).map((l: Content) => `<a href="${esc(l.url ?? l.href ?? '#')}" className="text-sm text-gray-400 hover:text-white transition">${esc(l.text ?? l.label ?? '')}</a>`).join('\n                  ')}
                </div>
              </div>`
            ).join('\n            ') : linkItems.length ? `<div className="flex flex-col gap-2">${linkItems}</div>` : ''}
          </div>
          <div className="mt-10 pt-6 border-t border-gray-800 text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} ${esc(data.brand ?? data.companyName ?? 'AI Website Builder')}. All rights reserved.
          </div>
        </div>
      </footer>`;
}

// ─── Header / Nav ─────────────────────────────────────────────────────

function renderHeaderNavHTML(data: Content): string {
  const brand = esc(data.brand ?? data.companyName ?? data.title ?? 'Brand');
  const items = (data.navItems ?? data.links ?? []) as Content[];
  const nav = items.map((l: Content) => `<a href="${esc(l.url ?? l.href ?? '#')}" class="text-sm text-gray-700 hover:text-indigo-600 transition">${esc(l.text ?? l.label ?? l.title ?? '')}</a>`).join('\n            ');
  return `        <nav class="flex items-center justify-between py-4">
          <span class="font-bold text-lg">${brand}</span>
          <div class="hidden md:flex items-center gap-6">
            ${nav}
          </div>
          ${data.ctaText ? `<a href="${esc(data.ctaUrl ?? '#')}" class="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700">${esc(data.ctaText)}</a>` : ''}
        </nav>`;
}

function renderHeaderNavJSX(data: Content): string {
  const brand = esc(data.brand ?? data.companyName ?? data.title ?? 'Brand');
  const items = (data.navItems ?? data.links ?? []) as Content[];
  const nav = items.map((l: Content) => `<a href="${esc(l.url ?? l.href ?? '#')}" className="text-sm text-gray-700 hover:text-indigo-600 transition">${esc(l.text ?? l.label ?? l.title ?? '')}</a>`).join('\n              ');
  return `      <header className="py-4 px-4 border-b border-gray-200">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <span className="font-bold text-lg">${brand}</span>
          <div className="hidden md:flex items-center gap-6">
            ${nav}
          </div>
          ${data.ctaText ? `<a href="${esc(data.ctaUrl ?? '#')}" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700">${esc(data.ctaText)}</a>` : ''}
        </div>
      </header>`;
}

// ─── Generic fallback ─────────────────────────────────────────────────

function renderGenericHTML(data: Content): string {
  const headline = esc(data.headline ?? data.title ?? data.heading ?? '');
  const body = esc(data.body ?? data.description ?? data.content ?? '');
  return `        ${headline ? `<h2 class="text-2xl font-bold mb-4">${headline}</h2>` : ''}
        ${body ? `<p class="text-gray-600">${body}</p>` : ''}`;
}

function renderGenericJSX(section: Section): string {
  const data = section.content as Content;
  const headline = esc(data.headline ?? data.title ?? data.heading ?? '');
  const body = esc(data.body ?? data.description ?? data.content ?? '');
  return `      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          ${headline ? `<h2 className="text-2xl font-bold mb-4">${headline}</h2>` : ''}
          ${body ? `<p className="text-gray-600">${body}</p>` : ''}
        </div>
      </section>`;
}

function generateCSSVariables(project: ProjectWithPages): string {
  const styles = (project.globalStyles || {}) as Record<string, string>;
  const vars = Object.entries(styles)
    .map(([key, value]) => `  --${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value};`)
    .join('\n');
  return `:root {\n${vars || '  /* Theme variables */'}\n}\n`;
}

function toPascalCase(str: string): string {
  return str
    .split(/[-_\s]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}
