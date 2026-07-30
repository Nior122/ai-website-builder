// =============================================================================
// Accessibility Audit Service Tests
// =============================================================================
// Unit tests for WCAG-oriented accessibility audit engine and contrast helper.
// Pure function tests — no mocking needed.
// =============================================================================

import { describe, it, expect } from 'vitest';
import {
  auditAccessibility,
  contrastRatio,
} from '@/features/accessibility/services/accessibility.service';

// ─── Test Data Builders ────────────────────────────────────────────────

function makeProject(overrides: Record<string, unknown> = {}) {
  return {
    id: 'proj_1',
    name: 'Test Project',
    slug: 'test-project',
    globalStyles: {
      colors: { text: '#1a1a1a', background: '#ffffff', primary: '#4f46e5' },
    },
    pages: [
      {
        id: 'page_1',
        title: 'Home',
        slug: '',
        isHome: true,
        sections: [
          {
            id: 'sec_hero',
            type: 'hero',
            content: {
              headline: 'Welcome to Our Site',
              subheadline: 'Building the future',
              cta: { text: 'Get Started', url: '/signup' },
            },
            layout: 'centered',
            order: 0,
          },
        ],
      },
    ],
    ...overrides,
  } as never;
}

function section(type: string, content: Record<string, unknown>, id?: string) {
  return {
    id: id ?? `sec_${Math.random().toString(36).slice(2, 8)}`,
    type,
    content,
    layout: 'default',
    order: 0,
  } as never;
}

// ─── contrastRatio ─────────────────────────────────────────────────────

describe('contrastRatio', () => {
  it('should return 21:1 for black on white (maximum contrast)', () => {
    const ratio = contrastRatio('#000000', '#ffffff');
    expect(ratio).toBeCloseTo(21, 0);
  });

  it('should return 1:1 for same color on itself', () => {
    const ratio = contrastRatio('#ff0000', '#ff0000');
    expect(ratio).toBeCloseTo(1, 1);
  });

  it('should handle short hex (#RGB)', () => {
    const ratio = contrastRatio('#000', '#fff');
    expect(ratio).toBeCloseTo(21, 0);
  });

  it('should return null for unparseable color', () => {
    expect(contrastRatio('not-a-color', '#fff')).toBeNull();
    expect(contrastRatio('#fff', 'rgb(0,0,0)')).toBeNull();
  });

  it('should detect low contrast pair', () => {
    // light gray on white — very low contrast
    const ratio = contrastRatio('#cccccc', '#ffffff');
    expect(ratio).toBeLessThan(4.5);
  });

  it('should detect acceptable contrast pair', () => {
    // dark blue on white — should pass AA
    const ratio = contrastRatio('#003366', '#ffffff');
    expect(ratio).toBeGreaterThan(4.5);
  });
});

// ─── auditAccessibility ────────────────────────────────────────────────

describe('auditAccessibility', () => {
  describe('scoring and grading', () => {
    it('should give score 100 / grade A for a clean project', () => {
      const project = makeProject();
      const result = auditAccessibility(project);
      expect(result.score).toBe(100);
      expect(result.grade).toBe('A');
      expect(result.errorCount).toBe(0);
    });

    it('should deduct points for errors', () => {
      const project = makeProject({
        pages: [
          {
            id: 'p1',
            title: 'Page',
            slug: '',
            isHome: true,
            sections: [
              section('hero', {
                headline: 'Hi',
                image: { src: '/img.jpg' }, // missing alt → error
              }),
              section('hero', { headline: 'Second H1' }), // second H1 → error
            ],
          },
        ],
      });
      const result = auditAccessibility(project);
      expect(result.errorCount).toBeGreaterThanOrEqual(2);
      expect(result.score).toBeLessThan(100);
    });

    it('should deduct fewer points for warnings', () => {
      const project = makeProject({
        pages: [
          {
            id: 'p1',
            title: 'Page',
            slug: '',
            isHome: true,
            sections: [
              section('features', {
                headline: 'Features',
                cta: { text: 'click here', url: '/more' }, // vague link → warning
              }),
            ],
          },
        ],
      });
      const result = auditAccessibility(project);
      expect(result.warningCount).toBeGreaterThanOrEqual(1);
      expect(result.score).toBeGreaterThan(80);
    });

    it('should never go below 0', () => {
      const badSections = Array.from({ length: 20 }, (_, i) =>
        section('hero', {
          headline: `H1 #${i}`,
          image: { src: `/img${i}.jpg` },
        })
      );
      const project = makeProject({
        pages: [
          { id: 'p1', title: 'P', slug: '', isHome: true, sections: badSections },
        ],
      });
      const result = auditAccessibility(project);
      expect(result.score).toBeGreaterThanOrEqual(0);
    });

    it('should assign correct grade thresholds', () => {
      // Grade mapping: A≥90, B≥80, C≥70, D≥60, F<60
      const project = makeProject();
      expect(auditAccessibility(project).grade).toBe('A');
    });
  });

  describe('image checks (WCAG 1.1.1)', () => {
    it('should flag images missing alt text', () => {
      const project = makeProject({
        pages: [
          {
            id: 'p1',
            title: 'P',
            slug: '',
            isHome: true,
            sections: [
              section('hero', {
                headline: 'Hi',
                image: { src: '/hero.jpg' },
              }),
            ],
          },
        ],
      });
      const result = auditAccessibility(project);
      const imgIssues = result.issues.filter((i) => i.category === 'images');
      expect(imgIssues.length).toBeGreaterThanOrEqual(1);
      expect(imgIssues[0].criterion).toBe('1.1.1');
      expect(imgIssues[0].severity).toBe('error');
    });

    it('should not flag images with alt text', () => {
      const project = makeProject({
        pages: [
          {
            id: 'p1',
            title: 'P',
            slug: '',
            isHome: true,
            sections: [
              section('hero', {
                headline: 'Hi',
                image: { src: '/hero.jpg', alt: 'A beautiful sunset' },
              }),
            ],
          },
        ],
      });
      const result = auditAccessibility(project);
      const imgIssues = result.issues.filter(
        (i) => i.category === 'images' && i.severity === 'error'
      );
      expect(imgIssues.length).toBe(0);
    });

    it('should warn about very long alt text (>125 chars)', () => {
      const longAlt = 'A'.repeat(130);
      const project = makeProject({
        pages: [
          {
            id: 'p1',
            title: 'P',
            slug: '',
            isHome: true,
            sections: [
              section('hero', {
                headline: 'Hi',
                image: { src: '/hero.jpg', alt: longAlt },
              }),
            ],
          },
        ],
      });
      const result = auditAccessibility(project);
      const longAltIssues = result.issues.filter(
        (i) => i.category === 'images' && i.message.includes('very long')
      );
      expect(longAltIssues.length).toBe(1);
      expect(longAltIssues[0].severity).toBe('warning');
    });

    it('should flag nested images in content arrays', () => {
      const project = makeProject({
        pages: [
          {
            id: 'p1',
            title: 'P',
            slug: '',
            isHome: true,
            sections: [
              section('features', {
                headline: 'Features',
                cards: [
                  { title: 'Card 1', image: { src: '/c1.jpg' } },
                  { title: 'Card 2', image: { src: '/c2.jpg' } },
                ],
              }),
            ],
          },
        ],
      });
      const result = auditAccessibility(project);
      const imgIssues = result.issues.filter((i) => i.category === 'images');
      expect(imgIssues.length).toBe(2);
    });
  });

  describe('heading checks (WCAG 1.3.1, 2.4.6)', () => {
    it('should warn when page has no H1', () => {
      const project = makeProject({
        pages: [
          {
            id: 'p1',
            title: 'P',
            slug: '',
            isHome: true,
            sections: [section('features', { headline: 'Features' })],
          },
        ],
      });
      const result = auditAccessibility(project);
      const headingIssues = result.issues.filter(
        (i) => i.category === 'headings' && i.message.includes('no H1')
      );
      expect(headingIssues.length).toBe(1);
    });

    it('should error when page has multiple H1s', () => {
      const project = makeProject({
        pages: [
          {
            id: 'p1',
            title: 'P',
            slug: '',
            isHome: true,
            sections: [
              section('hero', { headline: 'First H1' }),
              section('hero', { headline: 'Second H1' }),
            ],
          },
        ],
      });
      const result = auditAccessibility(project);
      const multiH1 = result.issues.filter(
        (i) => i.category === 'headings' && i.message.includes('H1 headings')
      );
      expect(multiH1.length).toBe(1);
      expect(multiH1[0].severity).toBe('error');
    });

    it('should have exactly one H1 from hero section', () => {
      const project = makeProject();
      const result = auditAccessibility(project);
      const h1Issues = result.issues.filter(
        (i) => i.category === 'headings' && (i.message.includes('no H1') || i.message.includes('H1 headings'))
      );
      expect(h1Issues.length).toBe(0);
    });
  });

  describe('link checks (WCAG 2.4.4)', () => {
    it('should warn about vague link text', () => {
      const project = makeProject({
        pages: [
          {
            id: 'p1',
            title: 'P',
            slug: '',
            isHome: true,
            sections: [
              section('cta', {
                headline: 'CTA',
                cta: { text: 'click here', url: '/page' },
              }),
            ],
          },
        ],
      });
      const result = auditAccessibility(project);
      const linkIssues = result.issues.filter(
        (i) => i.category === 'links' && i.message.includes('not descriptive')
      );
      expect(linkIssues.length).toBeGreaterThanOrEqual(1);
      expect(linkIssues[0].criterion).toBe('2.4.4');
    });

    it('should warn about bare URLs as link text', () => {
      const project = makeProject({
        pages: [
          {
            id: 'p1',
            title: 'P',
            slug: '',
            isHome: true,
            sections: [
              section('footer', {
                links: [{ text: 'https://example.com', url: 'https://example.com' }],
              }),
            ],
          },
        ],
      });
      const result = auditAccessibility(project);
      const bareUrlIssues = result.issues.filter(
        (i) => i.category === 'links' && i.message.includes('Bare URL')
      );
      expect(bareUrlIssues.length).toBe(1);
    });

    it('should not flag descriptive link text', () => {
      const project = makeProject({
        pages: [
          {
            id: 'p1',
            title: 'P',
            slug: '',
            isHome: true,
            sections: [
              section('cta', {
                headline: 'CTA',
                cta: { text: 'View our pricing plans', url: '/pricing' },
              }),
            ],
          },
        ],
      });
      const result = auditAccessibility(project);
      const linkIssues = result.issues.filter((i) => i.category === 'links');
      expect(linkIssues.length).toBe(0);
    });
  });

  describe('form checks (WCAG 3.3.2, 4.1.2)', () => {
    it('should error when form fields have no labels', () => {
      const project = makeProject({
        pages: [
          {
            id: 'p1',
            title: 'P',
            slug: '',
            isHome: true,
            sections: [
              section('contact', {
                headline: 'Contact Us',
                fields: [
                  { type: 'text', name: 'email', placeholder: 'Enter email' },
                ],
              }),
            ],
          },
        ],
      });
      const result = auditAccessibility(project);
      const formIssues = result.issues.filter(
        (i) => i.category === 'forms' && i.message.includes('no label')
      );
      expect(formIssues.length).toBe(1);
      expect(formIssues[0].severity).toBe('error');
    });

    it('should warn when form fields have no name attribute', () => {
      const project = makeProject({
        pages: [
          {
            id: 'p1',
            title: 'P',
            slug: '',
            isHome: true,
            sections: [
              section('contact', {
                headline: 'Contact Us',
                fields: [
                  { type: 'text', label: 'Email' }, // no name
                ],
                submitLabel: 'Send',
              }),
            ],
          },
        ],
      });
      const result = auditAccessibility(project);
      const nameIssues = result.issues.filter(
        (i) => i.category === 'forms' && i.message.includes('no name attribute')
      );
      expect(nameIssues.length).toBe(1);
      expect(nameIssues[0].severity).toBe('warning');
    });

    it('should error when form has no submit button', () => {
      const project = makeProject({
        pages: [
          {
            id: 'p1',
            title: 'P',
            slug: '',
            isHome: true,
            sections: [
              section('contact', {
                headline: 'Contact',
                fields: [{ type: 'text', label: 'Name', name: 'name' }],
                // no submitLabel, no button
              }),
            ],
          },
        ],
      });
      const result = auditAccessibility(project);
      const submitIssues = result.issues.filter(
        (i) => i.category === 'forms' && i.message.includes('no submit button')
      );
      expect(submitIssues.length).toBe(1);
    });

    it('should not error when submitLabel is present', () => {
      const project = makeProject({
        pages: [
          {
            id: 'p1',
            title: 'P',
            slug: '',
            isHome: true,
            sections: [
              section('contact', {
                headline: 'Contact',
                fields: [{ type: 'text', label: 'Name', name: 'name' }],
                submitLabel: 'Send Message',
              }),
            ],
          },
        ],
      });
      const result = auditAccessibility(project);
      const submitIssues = result.issues.filter(
        (i) => i.category === 'forms' && i.message.includes('no submit button')
      );
      expect(submitIssues.length).toBe(0);
    });

    it('should flag contact section with no fields at all', () => {
      const project = makeProject({
        pages: [
          {
            id: 'p1',
            title: 'P',
            slug: '',
            isHome: true,
            sections: [
              section('contact', {
                headline: 'Contact',
              }),
            ],
          },
        ],
      });
      const result = auditAccessibility(project);
      const noFieldIssues = result.issues.filter(
        (i) => i.category === 'forms' && i.message.includes('no form fields')
      );
      expect(noFieldIssues.length).toBe(1);
    });
  });

  describe('structure checks (WCAG 1.3.1)', () => {
    it('should warn when first section is not a landmark', () => {
      const project = makeProject({
        pages: [
          {
            id: 'p1',
            title: 'P',
            slug: '',
            isHome: true,
            sections: [
              section('features', { headline: 'Features' }),
              section('hero', { headline: 'Hero' }),
            ],
          },
        ],
      });
      const result = auditAccessibility(project);
      const structIssues = result.issues.filter(
        (i) => i.category === 'structure' && i.message.includes('not start with a landmark')
      );
      expect(structIssues.length).toBe(1);
    });

    it('should not warn when first section is a hero', () => {
      const project = makeProject();
      const result = auditAccessibility(project);
      const structIssues = result.issues.filter(
        (i) => i.category === 'structure'
      );
      expect(structIssues.length).toBe(0);
    });

    it('should accept header and nav as landmark first sections', () => {
      for (const type of ['hero', 'header', 'nav', 'footer']) {
        const project = makeProject({
          pages: [
            {
              id: 'p1',
              title: 'P',
              slug: '',
              isHome: true,
              sections: [section(type, { headline: 'H' })],
            },
          ],
        });
        const result = auditAccessibility(project);
        const structIssues = result.issues.filter(
          (i) => i.category === 'structure' && i.message.includes('not start with a landmark')
        );
        expect(structIssues.length).toBe(0);
      }
    });
  });

  describe('color contrast checks (WCAG 1.4.3)', () => {
    it('should flag low-contrast theme colors', () => {
      const project = makeProject({
        globalStyles: {
          colors: { text: '#cccccc', background: '#ffffff' }, // ~1.6:1 — fails
        },
      });
      const result = auditAccessibility(project);
      const contrastIssues = result.issues.filter(
        (i) => i.category === 'contrast' && i.message.includes('Low contrast')
      );
      expect(contrastIssues.length).toBeGreaterThanOrEqual(1);
      expect(contrastIssues[0].severity).toBe('error'); // ratio < 3
    });

    it('should not flag high-contrast theme colors', () => {
      const project = makeProject({
        globalStyles: {
          colors: { text: '#1a1a1a', background: '#ffffff' }, // ~16:1 — passes
        },
      });
      const result = auditAccessibility(project);
      const contrastIssues = result.issues.filter(
        (i) => i.category === 'contrast'
      );
      expect(contrastIssues.length).toBe(0);
    });

    it('should handle missing globalStyles gracefully', () => {
      const project = makeProject({ globalStyles: null });
      const result = auditAccessibility(project);
      // Should not crash; no contrast issues since there are no colors
      const contrastIssues = result.issues.filter(
        (i) => i.category === 'contrast'
      );
      expect(contrastIssues.length).toBe(0);
    });
  });

  describe('category summaries', () => {
    it('should mark categories as passed when no issues', () => {
      const project = makeProject();
      const result = auditAccessibility(project);
      expect(result.byCategory.images.passed).toBe(true);
      expect(result.byCategory.headings.passed).toBe(true);
      expect(result.byCategory.forms.passed).toBe(true);
      expect(result.byCategory.contrast.passed).toBe(true);
    });

    it('should mark category as failed with correct issue count', () => {
      const project = makeProject({
        pages: [
          {
            id: 'p1',
            title: 'P',
            slug: '',
            isHome: true,
            sections: [
              section('hero', {
                headline: 'Hi',
                image: { src: '/a.jpg' },
              }),
              section('features', {
                headline: 'F',
                image: { src: '/b.jpg' },
              }),
            ],
          },
        ],
      });
      const result = auditAccessibility(project);
      expect(result.byCategory.images.passed).toBe(false);
      expect(result.byCategory.images.issueCount).toBe(2);
    });
  });

  describe('suggestions', () => {
    it('should include image suggestion when image issues exist', () => {
      const project = makeProject({
        pages: [
          {
            id: 'p1',
            title: 'P',
            slug: '',
            isHome: true,
            sections: [
              section('hero', {
                headline: 'Hi',
                image: { src: '/img.jpg' },
              }),
            ],
          },
        ],
      });
      const result = auditAccessibility(project);
      const imgSugg = result.suggestions.filter(
        (s) => s.category === 'images'
      );
      expect(imgSugg.length).toBeGreaterThanOrEqual(1);
      expect(imgSugg[0].impact).toBe('high');
    });

    it('should always include structure and form suggestions', () => {
      const project = makeProject();
      const result = auditAccessibility(project);
      const cats = result.suggestions.map((s) => s.category);
      expect(cats).toContain('structure');
      expect(cats).toContain('forms');
    });
  });

  describe('multi-page projects', () => {
    it('should audit all pages independently', () => {
      const project = makeProject({
        pages: [
          {
            id: 'p1',
            title: 'Home',
            slug: '',
            isHome: true,
            sections: [section('hero', { headline: 'Home H1' })],
          },
          {
            id: 'p2',
            title: 'About',
            slug: 'about',
            isHome: false,
            sections: [section('hero', { headline: 'About H1' })],
          },
          {
            id: 'p3',
            title: 'No H1 Page',
            slug: 'no-h1',
            isHome: false,
            sections: [section('features', { headline: 'Just features' })],
          },
        ],
      });
      const result = auditAccessibility(project);
      // Page 3 has no H1 → warning
      const noH1 = result.issues.filter(
        (i) =>
          i.category === 'headings' &&
          i.message.includes('no H1') &&
          i.location?.pageSlug === 'no-h1'
      );
      expect(noH1.length).toBe(1);
    });
  });
});
