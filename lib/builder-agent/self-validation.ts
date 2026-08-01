// =============================================================================
// Autonomous Website Builder Agent — Self Validation
// =============================================================================
// Before generation completes the agent verifies every requirement: pages,
// sections, content, links, IDs, navigation, footer, buttons, forms, SEO,
// metadata, OpenGraph, theme, spacing/typography/animation consistency,
// responsiveness, and dark-mode compatibility.
// =============================================================================

import { checkTokensContrast } from '@/lib/ai/design-pipeline';
import type { BuilderProject } from '@/lib/builder';
import type { ValidationFinding } from './types';
import { darkModeTokens } from './quality-scorer';

const EXTERNAL_HREF = /^https?:\/\//;
const LEGAL_SLUGS = ['privacy', 'terms', '404', 'coming-soon'];

function push(
  findings: ValidationFinding[],
  rule: string,
  passed: boolean,
  message: string,
  severity: 'error' | 'warning',
  category: ValidationFinding['category']
): void {
  findings.push({ rule, passed, message, severity, category });
}

export function validateWebsite(project: BuilderProject): { findings: ValidationFinding[]; errors: ValidationFinding[]; warnings: ValidationFinding[] } {
  const findings: ValidationFinding[] = [];
  const home = project.pages.find((page) => page.isHome) ?? project.pages[0];
  const allSections = project.pages.flatMap((page) => page.sections);
  const contentSections = allSections.filter((section) => !['divider', 'spacer', 'custom-html'].includes(section.type));
  const pageSlugs = new Set(project.pages.map((page) => page.slug));
  const allIds = [
    ...project.pages.map((page) => page.id),
    ...allSections.map((section) => section.id),
    ...project.media.map((item) => item.id),
  ];

  // 1–3. Pages
  push(findings, 'pages.count', project.pages.length >= 3, `${project.pages.length} page(s) — expected at least 3.`, project.pages.length >= 3 ? 'warning' : 'error', 'pages');
  const missingRequired = ['privacy', 'terms', '404', 'coming-soon'].filter((slug) => !pageSlugs.has(slug));
  push(findings, 'pages.required', missingRequired.length === 0, missingRequired.length === 0 ? 'Required pages present.' : `Missing required pages: ${missingRequired.join(', ')}.`, 'error', 'pages');
  const slugs = project.pages.map((page) => page.slug);
  const duplicateSlugs = slugs.filter((slug, index) => slugs.indexOf(slug) !== index);
  push(findings, 'pages.unique-slugs', duplicateSlugs.length === 0, duplicateSlugs.length === 0 ? 'All slugs unique.' : `Duplicate slugs: ${[...new Set(duplicateSlugs)].join(', ')}.`, 'error', 'pages');

  // 4. IDs
  const duplicateIds = allIds.filter((id, index) => allIds.indexOf(id) !== index);
  push(findings, 'ids.unique', duplicateIds.length === 0, duplicateIds.length === 0 ? 'All IDs unique.' : 'Duplicate IDs detected.', 'error', 'metadata');

  // 5–6. Sections
  push(findings, 'sections.present', (home?.sections.length ?? 0) >= 3, `Home has ${home?.sections.length ?? 0} section(s) — expected at least 3.`, 'error', 'sections');
  const emptySections = contentSections.filter((section) =>
    !Object.values(section.content).some((value) => typeof value === 'string' && value.trim().length > 0)
  );
  push(findings, 'sections.no-empty', emptySections.length === 0, emptySections.length === 0 ? 'No empty sections.' : `${emptySections.length} empty section(s).`, 'error', 'sections');

  // 7. Content quality
  const allCopy = JSON.stringify(project.pages.map((page) => page.sections.map((section) => section.content)));
  push(findings, 'content.no-lorem', !/lorem ipsum|TODO|FIXME/i.test(allCopy), /lorem ipsum|TODO|FIXME/i.test(allCopy) ? 'Placeholder content detected.' : 'No placeholder content.', 'error', 'content');
  const ctaSections = contentSections.filter((section) => section.content.ctaText !== undefined);
  const buttonsWithDestinations = ctaSections.every((section) => typeof section.content.ctaLink === 'string' && section.content.ctaLink.length > 0);
  push(findings, 'content.buttons', buttonsWithDestinations, buttonsWithDestinations ? 'Buttons have destinations.' : 'Some buttons lack destinations.', 'error', 'content');

  // 8–10. Links & navigation
  const brokenNav = project.navigation.links.filter((link) => !link.href.startsWith('/') || (!pageSlugs.has(link.href.slice(1)) && !EXTERNAL_HREF.test(link.href)));
  push(findings, 'links.nav', brokenNav.length === 0, brokenNav.length === 0 ? 'Navigation links resolve.' : `${brokenNav.length} broken navigation link(s).`, 'error', 'links');
  const footerHrefs = project.footer.columns.flatMap((column) => column.links.map((link) => link.href));
  const brokenFooter = footerHrefs.filter((href) => href.startsWith('/') && !pageSlugs.has(href.slice(1)) && !EXTERNAL_HREF.test(href));
  push(findings, 'links.footer', brokenFooter.length === 0, brokenFooter.length === 0 ? 'Footer links resolve.' : `${brokenFooter.length} broken footer link(s).`, 'error', 'links');
  const mainPages = project.pages.filter((page) => !LEGAL_SLUGS.includes(page.slug));
  const navMissing = mainPages.filter((page) => !project.navigation.links.some((link) => link.href === `/${page.slug}`));
  push(findings, 'nav.matches-pages', navMissing.length === 0, navMissing.length === 0 ? 'Navigation matches pages.' : `Navigation missing: ${navMissing.map((page) => page.slug).join(', ')}.`, 'error', 'links');

  // 11. Forms
  const formsOk = project.forms.length >= 1 && project.forms.every((form) => form.fields.length > 0);
  push(findings, 'forms.fields', formsOk, formsOk ? 'Forms have fields.' : 'Forms missing or empty.', 'error', 'forms');

  // 12–14. SEO & metadata
  push(findings, 'seo.site', Boolean(project.seo.metaTitle && project.seo.metaDescription), project.seo.metaTitle && project.seo.metaDescription ? 'Site SEO present.' : 'Site SEO metadata incomplete.', 'error', 'seo');
  const pagesWithoutMeta = project.pages.filter((page) => !page.metaTitle || !page.metaDescription);
  push(findings, 'seo.page-meta', pagesWithoutMeta.length === 0, pagesWithoutMeta.length === 0 ? 'All pages have metadata.' : `${pagesWithoutMeta.length} page(s) missing metadata.`, 'error', 'metadata');
  push(findings, 'seo.opengraph', Boolean(project.seo.ogImage), project.seo.ogImage ? 'OpenGraph image present.' : 'OpenGraph image missing.', 'error', 'seo');

  // 15–21. Theme
  const tokens = project.theme.tokens as Record<string, unknown>;
  const colors = tokens.colors as Record<string, unknown> | undefined;
  push(findings, 'theme.exists', Boolean(colors?.primary && colors?.background && colors?.text), 'Theme tokens present.', 'error', 'theme');
  const spacing = tokens.spacing as Record<string, unknown> | undefined;
  const spacingOk = Boolean(spacing) && Object.values(spacing ?? {}).every((value) => typeof value === 'number' && value % 4 === 0);
  push(findings, 'theme.spacing', spacingOk, spacingOk ? 'Spacing on the 4px scale.' : 'Spacing not on the 4px scale.', 'error', 'theme');
  const fonts = tokens.fontFamily as Record<string, unknown> | undefined;
  push(findings, 'theme.typography', Boolean(fonts?.heading && fonts?.body), fonts?.heading && fonts?.body ? 'Typography tokens present.' : 'Typography tokens missing.', 'error', 'theme');
  const motion = tokens.motion as Record<string, unknown> | undefined;
  const style = tokens.style as Record<string, unknown> | undefined;
  push(findings, 'theme.animations', Boolean(motion?.base && motion?.easing && style?.animation), 'Animation tokens consistent.', 'warning', 'theme');
  const layoutsMissing = contentSections.filter((section) => !section.layout).length;
  push(findings, 'theme.responsive', layoutsMissing === 0, layoutsMissing === 0 ? 'All sections carry a layout.' : `${layoutsMissing} section(s) lack a layout.`, 'warning', 'theme');
  const darkErrors = checkTokensContrast(darkModeTokens(project)).filter((issue) => issue.severity === 'error');
  push(findings, 'theme.dark-mode', darkErrors.length === 0, darkErrors.length === 0 ? 'Dark-mode contrast passes WCAG AA.' : 'Dark-mode contrast issues detected.', 'warning', 'theme');

  // 22. Media
  const mediaOk = project.media.length >= 1 && project.media.every((item) => item.src && item.alt);
  push(findings, 'media.images', mediaOk, mediaOk ? 'Images assigned with src + alt.' : 'Media library empty or incomplete.', 'error', 'media');

  const errors = findings.filter((finding) => finding.severity === 'error' && !finding.passed);
  const warnings = findings.filter((finding) => finding.severity === 'warning' && !finding.passed);
  return { findings, errors, warnings };
}
