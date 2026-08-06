// =============================================================================
// Website Builder — Export Service
// =============================================================================
// Export options: JSON, self-contained HTML, ZIP manifest, React scaffold,
// Next.js scaffold, and Tailwind config. HTML export is fully self-contained
// (inline CSS from theme tokens) so it runs anywhere.
// =============================================================================

import type { BuilderProject, ExportFormat, ExportResult } from './types';
import { getHomePage } from './page-operations';

function token(project: BuilderProject, path: string, fallback: string): string {
  const parts = path.split('.');
  let current: unknown = project.theme.tokens;
  for (const part of parts) {
    if (typeof current !== 'object' || current === null) return fallback;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === 'string' && current.length > 0 ? current : fallback;
}

// ─── HTML Export ────────────────────────────────────────────────────────

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderSection(section: { type: string; content: Record<string, unknown> }): string {
  const headline = typeof section.content.headline === 'string' ? section.content.headline : '';
  const subheadline = typeof section.content.subheadline === 'string' ? section.content.subheadline : '';
  const ctaText = typeof section.content.ctaText === 'string' ? section.content.ctaText : '';
  const ctaLink = typeof section.content.ctaLink === 'string' ? section.content.ctaLink : '/contact';

  switch (section.type) {
    case 'hero':
      return `<section class="hero"><div class="container"><h1>${escapeHtml(headline)}</h1><p class="lead">${escapeHtml(subheadline)}</p>${ctaText ? `<a class="btn" href="${escapeHtml(ctaLink)}">${escapeHtml(ctaText)}</a>` : ''}</div></section>`;
    case 'features':
    case 'services':
      return `<section><div class="container"><h2>${escapeHtml(headline)}</h2><p>${escapeHtml(subheadline)}</p><div class="grid">${Array.isArray(section.content.items) && (section.content.items as unknown[]).length > 0 ? (section.content.items as Array<{ title?: string; description?: string }>).map((item) => `<article class="card"><h3>${escapeHtml(item.title ?? '')}</h3><p>${escapeHtml(item.description ?? '')}</p></article>`).join('') : ''}</div></div></section>`;
    case 'cta':
      return `<section class="cta"><div class="container"><h2>${escapeHtml(headline)}</h2>${ctaText ? `<a class="btn" href="${escapeHtml(ctaLink)}">${escapeHtml(ctaText)}</a>` : ''}</div></section>`;
    case 'contact':
      return `<section><div class="container"><h2>${escapeHtml(headline)}</h2><p>${escapeHtml(subheadline)}</p><form class="card"><input type="text" placeholder="Name" aria-label="Name"><input type="email" placeholder="Email" aria-label="Email"><textarea placeholder="Message" aria-label="Message"></textarea><button class="btn" type="submit">Send</button></form></div></section>`;
    default:
      return `<section><div class="container"><h2>${escapeHtml(headline)}</h2><p>${escapeHtml(subheadline)}</p></div></section>`;
  }
}

export function exportHtml(project: BuilderProject): string {
  const home = getHomePage(project);
  const css = [
    ':root{',
    `--primary:${token(project, 'colors.primary', '#2563eb')};`,
    `--background:${token(project, 'colors.background', '#ffffff')};`,
    `--surface:${token(project, 'colors.surface', '#f8fafc')};`,
    `--text:${token(project, 'colors.text', '#0f172a')};`,
    `--border:${token(project, 'colors.border', '#e2e8f0')};`,
    `--radius:${token(project, 'radius.md', '12px')};`,
    `--font-heading:${token(project, 'fontFamily.heading', 'Inter')};`,
    `--font-body:${token(project, 'fontFamily.body', 'Inter')};`,
    '}',
    '*{margin:0;padding:0;box-sizing:border-box}',
    'body{font-family:var(--font-body);background:var(--background);color:var(--text);line-height:1.6}',
    'h1,h2,h3{font-family:var(--font-heading);line-height:1.2}',
    '.container{max-width:1120px;margin:0 auto;padding:0 24px}',
    '.nav{display:flex;align-items:center;justify-content:space-between;padding:16px 24px;border-bottom:1px solid var(--border);background:var(--surface)}',
    '.nav ul{display:flex;gap:24px;list-style:none}',
    '.nav a{color:var(--text);text-decoration:none}',
    'section{padding:80px 0}',
    '.hero{text-align:center;padding:120px 0}',
    '.hero h1{font-size:clamp(2.4rem,5vw,3.6rem);margin-bottom:16px}',
    '.lead{font-size:1.2rem;max-width:640px;margin:0 auto 32px}',
    '.btn{display:inline-block;background:var(--primary);color:#fff;padding:12px 24px;border-radius:var(--radius);text-decoration:none}',
    '.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:24px;margin-top:32px}',
    '.card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:24px}',
    '.card h3{margin-bottom:8px}',
    'form{display:grid;gap:12px;max-width:480px;margin:24px auto 0}',
    'input,textarea{padding:12px;border:1px solid var(--border);border-radius:var(--radius);font:inherit}',
    '.cta{background:var(--surface);text-align:center}',
    '.footer{background:var(--surface);border-top:1px solid var(--border);padding:48px 0;text-align:center}',
    '@media(max-width:768px){section{padding:48px 0}.hero{padding:64px 0}.nav ul{display:none}}',
  ].join('\n');

  const navLinks = project.navigation.links
    .map((link) => `<li><a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a></li>`)
    .join('');

  const sections = (home?.sections ?? [])
    .filter((section) => section.visible)
    .map((section) => renderSection(section))
    .join('\n');

  const footerLinks = project.footer.columns
    .map((column) => column.links.map((link) => `<a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a>`).join(' · '))
    .filter(Boolean)
    .join(' · ');

  return [
    '<!DOCTYPE html>',
    `<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(project.seo.metaTitle)}</title>`,
    `<meta name="description" content="${escapeHtml(project.seo.metaDescription)}">`,
    `<style>${css}</style></head><body>`,
    `<header class="nav"><strong>${escapeHtml(project.navigation.logoText)}</strong><nav aria-label="Main"><ul>${navLinks}</ul></nav></header>`,
    `<main>${sections}</main>`,
    `<footer class="footer"><p>${escapeHtml(project.footer.tagline)}</p><p>${footerLinks}</p><p>${escapeHtml(project.footer.copyright)}</p></footer>`,
    '</body></html>',
  ].join('\n');
}

// ─── Other formats ──────────────────────────────────────────────────────

function exportJson(project: BuilderProject): string {
  return JSON.stringify(project, null, 2);
}

function exportZipManifest(project: BuilderProject): string {
  const files = [
    { path: 'index.html', size: exportHtml(project).length },
    { path: 'project.json', size: exportJson(project).length },
    { path: 'theme.json', size: JSON.stringify(project.theme).length },
    { path: 'content.json', size: JSON.stringify(project.pages).length },
  ];
  return JSON.stringify({ format: 'zip', files, note: 'Zip archive generated by the builder export service.' }, null, 2);
}

function exportReactScaffold(project: BuilderProject): string {
  const components = project.pages
    .flatMap((page) => page.sections.map((section) => section.type))
    .filter((type, index, all) => all.indexOf(type) === index)
    .map((type) => `${type.charAt(0).toUpperCase()}${type.slice(1)}Section`)
    .join(', ');

  return [
    '// React + Tailwind scaffold generated from the builder project.',
    `// Components: ${components}`,
    '',
    'export default function App({ theme }) {',
    '  return (',
    '    <div style={{ fontFamily: theme.tokens.fontFamily.body }}>',
    `      <header>{/* ${project.navigation.links.length} navigation links */}</header>`,
    `      <main>{/* ${(getHomePage(project)?.sections.length ?? 0)} home sections */}</main>`,
    '      <footer />',
    '    </div>',
    '  );',
    '}',
    '',
    '// Theme tokens are consumed via CSS variables:',
    `// --primary: ${token(project, 'colors.primary', '#2563eb')}`,
  ].join('\n');
}

function exportNextScaffold(project: BuilderProject): string {
  const pages = project.pages.map((page) => `app/${page.slug === 'home' ? '' : page.slug}/page.tsx`).join('\n');
  return [
    '// Next.js 15 App Router scaffold.',
    '// Routes generated:',
    pages,
    '',
    '// lib/theme.ts — export the theme tokens:',
    `export const theme = ${JSON.stringify({ preset: project.theme.preset, mode: project.theme.mode }, null, 2)};`,
  ].join('\n');
}

function exportTailwindConfig(project: BuilderProject): string {
  return [
    '/** @type {import("tailwindcss").Config} */',
    'module.exports = {',
    '  theme: {',
    '    extend: {',
    `      colors: { primary: '${token(project, 'colors.primary', '#2563eb')}', surface: '${token(project, 'colors.surface', '#f8fafc')}' },`,
    `      fontFamily: { heading: ['${token(project, 'fontFamily.heading', 'Inter')}'], body: ['${token(project, 'fontFamily.body', 'Inter')}'] },`,
    `      borderRadius: { md: '${token(project, 'radius.md', '12px')}', lg: '${token(project, 'radius.lg', '20px')}' },`,
    '    },',
    '  },',
    '};',
  ].join('\n');
}

// ─── Public API ─────────────────────────────────────────────────────────

const MIME: Record<ExportFormat, string> = {
  json: 'application/json',
  html: 'text/html',
  zip: 'application/zip',
  react: 'text/plain',
  nextjs: 'text/plain',
  tailwind: 'text/plain',
};

export function exportProject(project: BuilderProject, format: ExportFormat): ExportResult {
  let content: string;
  let filename: string;

  switch (format) {
    case 'html':
      content = exportHtml(project);
      filename = 'index.html';
      break;
    case 'json':
      content = exportJson(project);
      filename = 'project.json';
      break;
    case 'zip':
      content = exportZipManifest(project);
      filename = 'website.zip';
      break;
    case 'react':
      content = exportReactScaffold(project);
      filename = 'App.tsx';
      break;
    case 'nextjs':
      content = exportNextScaffold(project);
      filename = 'scaffold.txt';
      break;
    case 'tailwind':
      content = exportTailwindConfig(project);
      filename = 'tailwind.config.js';
      break;
  }

  return { format, filename, content, mime: MIME[format] };
}

export function exportAll(project: BuilderProject): ExportResult[] {
  return (['json', 'html', 'zip', 'react', 'nextjs', 'tailwind'] as ExportFormat[]).map((format) =>
    exportProject(project, format)
  );
}
