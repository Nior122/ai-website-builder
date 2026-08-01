// =============================================================================
// Website Builder — Quality Checks
// =============================================================================
// The 12-point pre-launch checklist: pages, navigation, footer, CTAs,
// responsiveness, SEO, accessibility, performance, images, placeholders,
// links, empty sections. Detected issues are auto-repaired deterministically.
// =============================================================================

import type { BuilderPage, BuilderProject, QualityIssue, QualityReport } from './types';
import { addSection } from './section-operations';
import { ensureRequiredPages } from './page-operations';

const EXTERNAL_HREF = /^https?:\/\//;

function collectAllCopy(project: BuilderProject): string {
  return project.pages
    .flatMap((page) => page.sections)
    .map((section) => JSON.stringify(section.content))
    .join(' ');
}

function hasHomeCta(home: BuilderPage | undefined): boolean {
  if (!home) return false;
  return home.sections.some(
    (section) => section.type === 'cta' || typeof section.content.ctaText === 'string'
  );
}

/**
 * Run the full quality checklist. Returns a report plus a repaired project.
 */
export function runQualityChecks(project: BuilderProject): { project: BuilderProject; report: QualityReport } {
  let current = ensureRequiredPages(project);
  const issues: QualityIssue[] = [];
  const repaired: string[] = [];
  const home = current.pages.find((page) => page.isHome) ?? current.pages[0];

  // 1. Pages exist
  if (current.pages.length < 3) {
    issues.push({ rule: 'qa.pages', severity: 'error', message: 'Fewer than 3 pages — add core pages.' });
  } else {
    // 2. Navigation works
    const pageSlugs = new Set(current.pages.map((page) => page.slug));
    const broken = current.navigation.links.filter(
      (link) => !link.href.startsWith('/') || (!pageSlugs.has(link.href.slice(1)) && !EXTERNAL_HREF.test(link.href))
    );
    if (broken.length > 0) {
      issues.push({ rule: 'qa.navigation', severity: 'error', message: `${broken.length} navigation link(s) point to missing pages.`, fix: 'Point them at existing pages.' });
      const fixedSlugs = new Set(broken.map((link) => link.href.slice(1)));
      current = {
        ...current,
        navigation: {
          ...current.navigation,
          links: current.navigation.links.map((link) =>
            fixedSlugs.has(link.href.slice(1)) ? { ...link, href: `/${home?.slug ?? 'home'}` } : link
          ),
        },
      };
      repaired.push(`navigation: ${broken.length} broken link(s) redirected to home`);
    }
  }

  // 3. Footer works
  if (current.footer.columns.length === 0) {
    issues.push({ rule: 'qa.footer', severity: 'error', message: 'Footer has no columns.' });
    current = { ...current, footer: { ...current.footer, columns: [{ title: 'Explore', links: [] }] } };
    repaired.push('footer: added default column');
  }

  // 4. Buttons / CTAs work
  if (!hasHomeCta(home)) {
    issues.push({ rule: 'qa.cta', severity: 'error', message: 'Home page has no call-to-action.' });
    current = {
      ...current,
      pages: current.pages.map((page) =>
        page.id === home?.id ? addSection(page, 'cta') : page
      ),
    };
    repaired.push('home: appended CTA section');
  }

  // 5. Responsive design (all sections carry a layout)
  const noLayout = current.pages
    .flatMap((page) => page.sections)
    .filter((section) => !section.layout || section.layout === 'default' && section.type !== 'divider' && section.type !== 'spacer');
  if (noLayout.length > 0) {
    issues.push({ rule: 'qa.responsive', severity: 'warning', message: `${noLayout.length} section(s) lack a responsive layout token.` });
  }

  // 6. SEO complete
  if (!current.seo.metaTitle || !current.seo.metaDescription) {
    issues.push({ rule: 'qa.seo', severity: 'error', message: 'Site SEO metadata incomplete.' });
    current = {
      ...current,
      seo: {
        ...current.seo,
        metaTitle: current.seo.metaTitle || `${current.name} — ${current.industry} ${current.businessType}`,
        metaDescription: current.seo.metaDescription || current.description.slice(0, 160),
      },
    };
    repaired.push('seo: filled missing title/description');
  }

  // 7. Accessibility (alt text)
  const missingAlt = current.pages
    .flatMap((page) => page.sections)
    .flatMap((section) => section.images)
    .filter((image) => !image.alt || image.alt.trim().length === 0);
  if (missingAlt.length > 0) {
    issues.push({ rule: 'qa.accessibility', severity: 'warning', message: `${missingAlt.length} image(s) missing alt text.` });
    current = {
      ...current,
      pages: current.pages.map((page) => ({
        ...page,
        sections: page.sections.map((section) => ({
          ...section,
          images: section.images.map((image) =>
            !image.alt || image.alt.trim().length === 0 ? { ...image, alt: 'Generated image' } : image
          ),
        })),
      })),
    };
    repaired.push(`accessibility: added alt text to ${missingAlt.length} image(s)`);
  }

  // 8. Performance (image dimensions)
  const noDimensions = current.pages
    .flatMap((page) => page.sections)
    .flatMap((section) => section.images)
    .filter((image) => image.width === undefined || image.height === undefined);
  if (noDimensions.length > 0) {
    issues.push({ rule: 'qa.performance', severity: 'warning', message: `${noDimensions.length} image(s) missing dimensions (CLS risk).` });
    current = {
      ...current,
      pages: current.pages.map((page) => ({
        ...page,
        sections: page.sections.map((section) => ({
          ...section,
          images: section.images.map((image) =>
            image.width === undefined || image.height === undefined
              ? { ...image, width: 800, height: 600 }
              : image
          ),
        })),
      })),
    };
    repaired.push(`performance: defaulted dimensions on ${noDimensions.length} image(s)`);
  }

  // 9. No missing images
  const missingSrc = current.pages
    .flatMap((page) => page.sections)
    .flatMap((section) => section.images)
    .filter((image) => !image.src);
  if (missingSrc.length > 0) {
    issues.push({ rule: 'qa.images', severity: 'error', message: `${missingSrc.length} image(s) have no source.` });
  }

  // 10. No placeholder content
  const allCopy = collectAllCopy(current);
  if (/lorem ipsum|TODO|FIXME/i.test(allCopy)) {
    issues.push({ rule: 'qa.placeholders', severity: 'error', message: 'Placeholder content detected.' });
  }

  // 11. No broken links (footer too)
  const footerHrefs = current.footer.columns.flatMap((column) => column.links.map((link) => link.href));
  const pageSlugs = new Set(current.pages.map((page) => page.slug));
  const brokenFooter = footerHrefs.filter((href) => href.startsWith('/') && !pageSlugs.has(href.slice(1)) && !EXTERNAL_HREF.test(href));
  if (brokenFooter.length > 0) {
    issues.push({ rule: 'qa.links', severity: 'warning', message: `${brokenFooter.length} footer link(s) point to missing pages.` });
  }

  // 12. No empty sections
  const emptySections = current.pages.flatMap((page) =>
    page.sections
      .filter((section) => Object.keys(section.content).length === 0 && section.type !== 'divider' && section.type !== 'spacer')
      .map((section) => ({ pageId: page.id, sectionId: section.id }))
  );
  if (emptySections.length > 0) {
    issues.push({ rule: 'qa.empty-sections', severity: 'error', message: `${emptySections.length} empty section(s) removed.` });
    const emptyIds = new Set(emptySections.map((entry) => entry.sectionId));
    current = {
      ...current,
      pages: current.pages.map((page) => ({
        ...page,
        sections: page.sections
          .filter((section) => !emptyIds.has(section.id))
          .map((section, index) => ({ ...section, order: index })),
      })),
    };
    repaired.push(`sections: removed ${emptySections.length} empty section(s)`);
  }

  const errors = issues.filter((issue) => issue.severity === 'error');
  return {
    project: current,
    report: {
      passed: errors.length === 0,
      issues,
      repaired,
    },
  };
}
