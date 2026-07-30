// =============================================================================
// Accessibility Audit Service
// =============================================================================
// Static WCAG-oriented analysis of a project's JSON-first structure. Works
// entirely off the in-memory Project + Pages + Sections model — no DOM, no
// headless browser — so it runs synchronously and is trivially testable.
//
// What it checks (mapped to WCAG 2.1 success criteria):
//   - Images       (1.1.1 Non-text Content): every image field needs alt text
//   - Headings     (1.3.1 / 2.4.6): each page should have exactly one H1; no
//                  skipped levels; headings must be non-empty
//   - Links        (2.4.4): link text must be descriptive (no bare "click here")
//   - Forms        (1.3.1 / 3.3.2 / 4.1.2): inputs need labels, every form needs
//                  a submit control and a name/url field for contact forms
//   - Color        (1.4.3): background/text contrast ratio ≥ 4.5:1 (AA)
//   - Structure    (1.3.1): first section should be a landmark (hero/header/nav)
//
// The result mirrors SEOAuditResult so the dashboard can reuse the same
// issue/suggestion card components for both audits.
// =============================================================================

import type { Project, Page, Section } from '@prisma/client';
import type {
  AccessibilityAuditResult,
  A11yIssue,
  A11ySuggestion,
  Category,
} from '../types';

type ProjectWithPages = Project & {
  pages: (Page & { sections: Section[] })[];
};

// ─── Color Contrast (WCAG 1.4.3) ────────────────────────────────────────

/** Parse #RGB / #RRGGBB (and #RRGGBBAA) to {r,g,b} or null */
function parseHex(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})([0-9a-f]{2})?$/i.exec(hex.trim());
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) {
    h = h
      .split('')
      .map((c) => c + c)
      .join('');
  }
  const num = parseInt(h, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function relativeLuminance({ r, g, b }: { r: number; g: number; b: number }): number {
  const toLinear = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/** WCAG contrast ratio between two hex colors. Returns 1..21, or null if unparseable. */
export function contrastRatio(fg: string, bg: string): number | null {
  const f = parseHex(fg);
  const b = parseHex(bg);
  if (!f || !b) return null;
  const l1 = relativeLuminance(f);
  const l2 = relativeLuminance(b);
  const [light, dark] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (light + 0.05) / (dark + 0.05);
}

// ─── Content Helpers ─────────────────────────────────────────────────────

type SectionContent = Record<string, unknown>;

function asString(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() ? v : undefined;
}

/** Recursively collect every image-like object found in section content. */
function collectImages(content: SectionContent): Array<{
  url?: string;
  alt?: string;
  field: string;
}> {
  const out: Array<{ url?: string; alt?: string; field: string }> = [];

  const visit = (node: unknown, field: string): void => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      node.forEach((item, i) => visit(item, `${field}[${i}]`));
      return;
    }
    const rec = node as Record<string, unknown>;
    const alt = asString(rec.alt) ?? asString(rec.altText);
    const hasImageField = /image|logo|avatar|photo|picture/i.test(field);
    // src is image-specific; imageUrl is image-specific; bare "url" only counts when the field
    // path also looks image-related (avoids false positives on CTA/link objects that have a url).
    const url =
      asString(rec.src) ??
      asString(rec.imageUrl) ??
      (hasImageField ? asString(rec.url) : undefined);
    if (url || alt || hasImageField) {
      out.push({ url, alt, field });
    }
    for (const [k, v] of Object.entries(rec)) {
      if (typeof v === 'object' && v !== null) visit(v, k);
    }
  };

  visit(content, 'content');
  return out;
}

/** Pull form fields out of a contact/newsletter section. */
function collectFormFields(content: SectionContent): Array<{
  label?: string;
  name?: string;
  type?: string;
  placeholder?: string;
}> {
  const raw = (content.fields ?? content.inputs ?? content.formFields) as unknown;
  if (!Array.isArray(raw)) return [];
  return raw.map((f) => {
    const r = (f ?? {}) as Record<string, unknown>;
    return {
      label: asString(r.label),
      name: asString(r.name) ?? asString(r.id),
      type: asString(r.type),
      placeholder: asString(r.placeholder),
    };
  });
}

const VAGUE_LINK_TEXT = /^(click here|here|read more|learn more|more|this link|link|go)$/i;

// ─── Main Audit ──────────────────────────────────────────────────────────

export function auditAccessibility(
  project: ProjectWithPages
): AccessibilityAuditResult {
  const issues: A11yIssue[] = [];
  const suggestions: A11ySuggestion[] = [];
  const categoryCount: Record<Category, number> = {
    images: 0,
    headings: 0,
    forms: 0,
    color: 0,
    links: 0,
    structure: 0,
    contrast: 0,
  };

  // ── Project-level: theme color contrast ──────────────────────────────
  auditThemeContrast(project, issues, categoryCount);

  // ── Per-page checks ──────────────────────────────────────────────────
  for (const page of project.pages) {
    let h1Count = 0;
    const headings: string[] = [];

    const firstSection = page.sections[0];
    if (firstSection && !isLandmarkType(firstSection.type)) {
      issues.push({
        severity: 'warning',
        category: 'structure',
        criterion: '1.3.1',
        level: 'A',
        message: `Page "${page.title}" does not start with a landmark section (hero, header, or nav)`,
        location: { pageSlug: page.slug },
        fix: 'Reorder sections so a hero/header/nav is first',
      });
      categoryCount.structure++;
    }

    for (const section of page.sections) {
      const content = (section.content ?? {}) as SectionContent;
      const loc = { pageSlug: page.slug, sectionId: section.id, sectionType: section.type };

      // ── Images: alt text (1.1.1) ──
      for (const img of collectImages(content)) {
        if (!img.url) continue; // broken/empty image objects are a content issue, not a11y
        if (img.alt === undefined) {
          issues.push({
            severity: 'error',
            category: 'images',
            criterion: '1.1.1',
            level: 'A',
            message: `Image in "${section.type}" section is missing alt text`,
            location: loc,
            field: img.field,
            fix: img.field === 'logo' || img.field === 'avatar' ? 'Mark as decorative (alt="") or provide alt text describing the logo' : 'Add alt text describing the image',
          });
          categoryCount.images++;
        } else if (
          img.alt.length > 125 &&
          !/^(decorative|logo|avatar)/i.test(img.field)
        ) {
          issues.push({
            severity: 'warning',
            category: 'images',
            criterion: '1.1.1',
            level: 'A',
            message: `Alt text in "${section.type}" section is very long (${img.alt.length} chars) — keep under 125`,
            location: loc,
            field: img.field,
            fix: 'Shorten the alt text to a concise description',
          });
          categoryCount.images++;
        }
      }

      // ── Headings (1.3.1, 2.4.6, 2.4.10) ──
      const headline =
        asString(content.headline) ??
        asString(content.heading) ??
        asString(content.title);
      if (section.type === 'hero' || section.type === 'header') {
        if (headline) h1Count++;
      }
      if (headline) headings.push(headline);
      const subheads = asString(content.subheadline) ?? asString(content.subtitle);
      if (subheads) headings.push(subheads);
      if (content.cards && Array.isArray(content.cards)) {
        for (const card of content.cards as Record<string, unknown>[]) {
          const ct = asString(card.title) ?? asString(card.heading);
          if (ct) headings.push(ct);
        }
      }

      // ── Links (2.4.4) ──
      auditLinks(content, section, loc, issues, categoryCount);

      // ── Forms (1.3.1, 3.3.2, 4.1.2) ──
      if (section.type === 'contact' || section.type === 'newsletter') {
        auditForm(content, section, loc, issues, categoryCount);
      }
    }

    // ── Page heading structure (one H1, no empty) ──
    if (h1Count === 0) {
      issues.push({
        severity: 'warning',
        category: 'headings',
        criterion: '2.4.6',
        level: 'AA',
        message: `Page "${page.title}" has no H1 (main heading)`,
        location: { pageSlug: page.slug },
        fix: 'Give the hero or header section a headline — it becomes the H1',
      });
      categoryCount.headings++;
    } else if (h1Count > 1) {
      issues.push({
        severity: 'error',
        category: 'headings',
        criterion: '1.3.1',
        level: 'A',
        message: `Page "${page.title}" has ${h1Count} H1 headings — use exactly one`,
        location: { pageSlug: page.slug },
        fix: 'Demote extra hero/header sections or make only the first one the page hero',
      });
      categoryCount.headings++;
    }
    for (const h of headings) {
      if (!h.trim()) {
        issues.push({
          severity: 'error',
          category: 'headings',
          criterion: '2.4.6',
          level: 'A',
          message: `Page "${page.title}" contains an empty heading`,
          location: { pageSlug: page.slug },
          fix: 'Remove the empty heading or provide descriptive text',
        });
        categoryCount.headings++;
        break; // one empty-heading error per page is enough
      }
    }
  }

  // ── General suggestions ─────────────────────────────────────────────
  if (categoryCount.images > 0) {
    suggestions.push({
      category: 'images',
      impact: 'high',
      description: 'Add alt text to all informative images; mark decorative images with alt=""',
    });
  }
  suggestions.push({
    category: 'structure',
    impact: 'medium',
    description: 'Use semantic landmarks (<main>, <nav>, <footer>) — the renderer already emits them for landmark sections',
  });
  suggestions.push({
    category: 'forms',
    impact: 'medium',
    description: 'Associate every input with a <label for> and provide clear placeholder/error text',
  });

  if (issues.length === 0) {
    suggestions.push({
      category: 'structure',
      impact: 'low',
      description: 'No accessibility issues detected. Consider a manual screen-reader pass for edge cases',
    });
  }

  // ── Scoring ──────────────────────────────────────────────────────────
  const errorCount = issues.filter((i) => i.severity === 'error').length;
  const warningCount = issues.filter((i) => i.severity === 'warning').length;
  // Errors weigh heavily (each costs ~12 pts), warnings ~4 pts. Floor at 0.
  const score = Math.max(0, 100 - errorCount * 12 - warningCount * 4);
  const grade = scoreGrade(score);

  return {
    score,
    grade,
    errorCount,
    warningCount,
    issues,
    suggestions,
    byCategory: buildCategorySummary(categoryCount),
  };
}

// ─── Sub-audits ──────────────────────────────────────────────────────────

function auditLinks(
  content: SectionContent,
  section: Section,
  loc: { pageSlug?: string; sectionId?: string; sectionType?: string },
  issues: A11yIssue[],
  categoryCount: Record<Category, number>
): void {
  const linkContainers = [
    content.cta,
    content.ctaPrimary,
    content.ctaSecondary,
    content.button,
  ];
  for (const entry of linkContainers) {
    if (!entry) continue;
    const links = Array.isArray(entry) ? entry : [entry];
    for (const link of links as Record<string, unknown>[]) {
      const text = asString(link.text) ?? asString(link.label);
      if (text && VAGUE_LINK_TEXT.test(text.trim())) {
        issues.push({
          severity: 'warning',
          category: 'links',
          criterion: '2.4.4',
          level: 'A',
          message: `Link "${text}" in "${section.type}" section is not descriptive`,
          location: loc,
          fix: 'Replace vague link text like "click here" with text describing the destination',
        });
        categoryCount.links++;
      }
    }
  }
  // Bare URL as link text ("https://example.com")
  if (content.links && Array.isArray(content.links)) {
    for (const link of content.links as Record<string, unknown>[]) {
      const text = asString(link.text);
      if (text && /^https?:\/\//i.test(text.trim())) {
        issues.push({
          severity: 'warning',
          category: 'links',
          criterion: '2.4.4',
          level: 'A',
          message: `Bare URL used as link text in "${section.type}" section`,
          location: loc,
          fix: 'Use descriptive link text instead of the raw URL',
        });
        categoryCount.links++;
      }
    }
  }
}

function auditForm(
  content: SectionContent,
  section: Section,
  loc: { pageSlug?: string; sectionId?: string; sectionType?: string },
  issues: A11yIssue[],
  categoryCount: Record<Category, number>
): void {
  const fields = collectFormFields(content);

  if (fields.length === 0) {
    // No field array — flag once
    issues.push({
      severity: 'warning',
      category: 'forms',
      criterion: '3.3.2',
      level: 'A',
      message: `"${section.type}" section has no form fields`,
      location: loc,
      fix: 'Add input fields (name, email, message) with labels for the form',
    });
    categoryCount.forms++;
    return;
  }

  for (const [i, field] of fields.entries()) {
    if (!field.label) {
      issues.push({
        severity: 'error',
        category: 'forms',
        criterion: '3.3.2',
        level: 'A',
        message: `Form field #${i + 1} in "${section.type}" section has no label`,
        location: loc,
        fix: field.placeholder
          ? 'Placeholder is not a label — add an explicit <label> element'
          : 'Add a label for every input field',
      });
      categoryCount.forms++;
    }
    if (field.type && field.type !== 'submit' && !field.name) {
      issues.push({
        severity: 'warning',
        category: 'forms',
        criterion: '4.1.2',
        level: 'A',
        message: `Form field #${i + 1} in "${section.type}" section has no name attribute (won\'t be submitted)`,
        location: loc,
        fix: 'Add a name attribute matching the field\'s purpose',
      });
      categoryCount.forms++;
    }
  }

  // Submit control present?
  const hasSubmit =
    fields.some((f) => f.type === 'submit') ||
    asString((content.submitLabel as unknown) ?? (content.buttonText as unknown)) !== undefined;
  if (!hasSubmit) {
    issues.push({
      severity: 'error',
      category: 'forms',
      criterion: '3.2.2',
      level: 'A',
      message: `"${section.type}" form has no submit button`,
      location: loc,
      fix: 'Add a submit button (or a field with type="submit")',
    });
    categoryCount.forms++;
  }
}

function auditThemeContrast(
  project: ProjectWithPages,
  issues: A11yIssue[],
  categoryCount: Record<Category, number>
): void {
  const globalStyles = (project.globalStyles ?? {}) as Record<string, unknown>;
  const colors = (globalStyles.colors ?? {}) as Record<string, unknown>;
  // Try common color pairings the theme engine exposes.
  const pairs: Array<[string, string, string]> = [
    [asString(colors.text) ?? '', asString(colors.background) ?? '', 'body text vs background'],
    [asString(colors.textSecondary) ?? '', asString(colors.background) ?? '', 'secondary text vs background'],
    [asString(colors.primary) ?? '', asString(colors.background) ?? '', 'primary color vs background'],
  ];
  for (const [fg, bg, label] of pairs) {
    if (!fg || !bg) continue;
    const ratio = contrastRatio(fg, bg);
    if (ratio === null) continue;
    if (ratio < 4.5) {
      const criterion = ratio < 3 ? '1.4.3' : '1.4.3';
      issues.push({
        severity: ratio < 3 ? 'error' : 'warning',
        category: 'contrast',
        criterion,
        level: 'AA',
        message: `Low contrast: ${label} (ratio ${ratio.toFixed(1)}:1, needs ≥4.5:1)`,
        fix: `Darken the foreground or lighten the background to reach a 4.5:1 contrast ratio`,
      });
      categoryCount.contrast++;
    }
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────

const LANDMARK_TYPES = new Set(['hero', 'header', 'nav', 'footer']);
function isLandmarkType(type: string): boolean {
  return LANDMARK_TYPES.has(type);
}

function scoreGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

function buildCategorySummary(
  count: Record<Category, number>
): Record<Category, { passed: boolean; issueCount: number }> {
  const result = {} as Record<Category, { passed: boolean; issueCount: number }>;
  for (const key of Object.keys(count) as Category[]) {
    result[key] = { passed: count[key] === 0, issueCount: count[key] };
  }
  return result;
}
