// =============================================================================
// SEO Service Tests
// =============================================================================
// Unit tests for SEO audit, meta tag generation, and sitemap creation.
// These are pure function tests — no mocking needed.
// =============================================================================

import { describe, it, expect } from 'vitest';
import { auditSEO, generateMetaTags, generateSitemap } from '@/features/seo/services/seo.service';

// ─── Test Data ─────────────────────────────────────────────────────────

function makeProject(overrides: Record<string, unknown> = {}) {
  return {
    id: 'proj_1',
    name: 'Test Project',
    slug: 'test-project',
    description: 'A test project',
    seo: { metaTitle: 'Test Title', metaDescription: 'Test description for SEO' },
    settings: {},
    pages: [
      {
        id: 'page_1',
        title: 'Home',
        slug: '',
        isHome: true,
        metaTitle: 'Home Page',
        metaDescription: 'Welcome to our site',
        sections: [
          {
            id: 'sec_1',
            type: 'hero',
            content: { headline: 'Welcome', cta: 'Get Started' },
            styles: {},
            layout: 'centered',
            order: 0,
          },
        ],
      },
    ],
    updatedAt: new Date('2026-01-15'),
    ...overrides,
  } as never;
}

// ─── Tests ─────────────────────────────────────────────────────────────

describe('SEOService', () => {
  describe('auditSEO', () => {
    it('should give high score for well-configured project', () => {
      // Arrange
      const project = makeProject();

      // Act
      const result = auditSEO(project);

      // Assert
      expect(result.score).toBeGreaterThanOrEqual(80);
      expect(result.grade).toMatch(/^[AB]/);
      expect(result.issues.filter((i) => i.type === 'error')).toHaveLength(0);
    });

    it('should flag missing meta title as error', () => {
      // Arrange
      const project = makeProject({ name: '', seo: {} });

      // Act
      const result = auditSEO(project);

      // Assert
      const metaTitleIssues = result.issues.filter((i) => i.message.includes('meta title'));
      expect(metaTitleIssues.length).toBeGreaterThan(0);
      expect(metaTitleIssues[0].type).toBe('error');
    });

    it('should flag missing meta description as warning', () => {
      // Arrange
      const project = makeProject({ seo: { metaTitle: 'Title' } });

      // Act
      const result = auditSEO(project);

      // Assert
      const descIssues = result.issues.filter((i) => i.message.includes('meta description'));
      expect(descIssues.length).toBeGreaterThan(0);
      expect(descIssues[0].type).toBe('warning');
    });

    it('should flag meta title that is too long', () => {
      // Arrange
      const project = makeProject({
        pages: [
          {
            id: 'page_1',
            title: 'Home',
            slug: '',
            isHome: true,
            metaTitle: 'A'.repeat(61), // 61 chars, limit is 60
            metaDescription: 'Description',
            sections: [],
          },
        ],
      });

      // Act
      const result = auditSEO(project);

      // Assert
      const longTitleIssues = result.issues.filter((i) => i.message.includes('too long'));
      expect(longTitleIssues.length).toBeGreaterThan(0);
    });

    it('should flag meta description that is too long', () => {
      // Arrange
      const project = makeProject({
        pages: [
          {
            id: 'page_1',
            title: 'Home',
            slug: '',
            isHome: true,
            metaTitle: 'Title',
            metaDescription: 'A'.repeat(161), // 161 chars, limit is 160
            sections: [],
          },
        ],
      });

      // Act
      const result = auditSEO(project);

      // Assert
      const longDescIssues = result.issues.filter((i) => i.message.includes('meta description') && i.message.includes('too long'));
      expect(longDescIssues.length).toBeGreaterThan(0);
    });

    it('should flag hero section missing headline as error', () => {
      // Arrange
      const project = makeProject({
        pages: [
          {
            id: 'page_1',
            title: 'Home',
            slug: '',
            isHome: true,
            metaTitle: 'Title',
            metaDescription: 'Description',
            sections: [
              {
                id: 'sec_1',
                type: 'hero',
                content: {}, // no headline
                styles: {},
                layout: 'centered',
                order: 0,
              },
            ],
          },
        ],
      });

      // Act
      const result = auditSEO(project);

      // Assert
      const heroIssues = result.issues.filter((i) => i.message.includes('headline'));
      expect(heroIssues.length).toBeGreaterThan(0);
      expect(heroIssues[0].type).toBe('error');
    });

    it('should suggest adding CTA to hero section', () => {
      // Arrange
      const project = makeProject({
        pages: [
          {
            id: 'page_1',
            title: 'Home',
            slug: '',
            isHome: true,
            metaTitle: 'Title',
            metaDescription: 'Description',
            sections: [
              {
                id: 'sec_1',
                type: 'hero',
                content: { headline: 'Welcome' }, // no cta
                styles: {},
                layout: 'centered',
                order: 0,
              },
            ],
          },
        ],
      });

      // Act
      const result = auditSEO(project);

      // Assert
      const ctaSuggestions = result.suggestions.filter((s) =>
        (s as any).message?.includes('call-to-action')
      );
      expect(ctaSuggestions.length).toBeGreaterThan(0);
    });

    it('should never go below 0 score', () => {
      // Arrange — project with many issues
      const project = makeProject({
        name: '',
        seo: {},
        pages: Array.from({ length: 10 }, (_, i) => ({
          id: `page_${i}`,
          title: `Page ${i}`,
          slug: `page-${i}`,
          isHome: false,
          metaTitle: 'A'.repeat(100),
          metaDescription: 'B'.repeat(200),
          sections: [
            {
              id: `sec_${i}`,
              type: 'hero',
              content: {},
              styles: {},
              layout: 'centered',
              order: 0,
            },
          ],
        })),
      });

      // Act
      const result = auditSEO(project);

      // Assert
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.grade).toBe('F');
    });
  });

  describe('generateMetaTags', () => {
    it('should use metaTitle when provided', () => {
      // Act
      const result = generateMetaTags({
        title: 'Default Title',
        metaTitle: 'Custom SEO Title',
        metaDescription: 'SEO description',
        slug: 'my-page',
      });

      // Assert
      expect(result.title).toBe('Custom SEO Title');
      expect(result.ogTitle).toBe('Custom SEO Title');
      expect(result.twitterTitle).toBe('Custom SEO Title');
    });

    it('should fall back to page title when metaTitle is not provided', () => {
      // Act
      const result = generateMetaTags({
        title: 'Page Title',
        slug: 'my-page',
      });

      // Assert
      expect(result.title).toBe('Page Title');
      expect(result.ogTitle).toBe('Page Title');
    });

    it('should set correct OG and Twitter defaults', () => {
      // Act
      const result = generateMetaTags({
        title: 'Title',
        metaDescription: 'Description',
        slug: 'my-page',
      });

      // Assert
      expect(result.ogType).toBe('website');
      expect(result.twitterCard).toBe('summary_large_image');
      expect(result.robots).toBe('index, follow');
      expect(result.ogDescription).toBe('Description');
      expect(result.twitterDescription).toBe('Description');
    });
  });

  describe('generateSitemap', () => {
    it('should generate sitemap entries for all pages', () => {
      // Arrange
      const project = makeProject({
        slug: 'my-site',
        pages: [
          { id: 'p1', title: 'Home', slug: '', isHome: true, sections: [] },
          { id: 'p2', title: 'About', slug: 'about', isHome: false, sections: [] },
          { id: 'p3', title: 'Contact', slug: 'contact', isHome: false, sections: [] },
        ],
      });

      // Act
      const result = generateSitemap(project);

      // Assert
      expect(result).toHaveLength(3);
    });

    it('should set home page priority to 1.0', () => {
      // Arrange
      const project = makeProject({
        slug: 'my-site',
        pages: [
          { id: 'p1', title: 'Home', slug: '', isHome: true, sections: [] },
        ],
      });

      // Act
      const result = generateSitemap(project);

      // Assert
      expect(result[0].priority).toBe(1.0);
      expect(result[0].changeFrequency).toBe('weekly');
    });

    it('should set non-home page priority to 0.8', () => {
      // Arrange
      const project = makeProject({
        slug: 'my-site',
        pages: [
          { id: 'p1', title: 'About', slug: 'about', isHome: false, sections: [] },
        ],
      });

      // Act
      const result = generateSitemap(project);

      // Assert
      expect(result[0].priority).toBe(0.8);
      expect(result[0].changeFrequency).toBe('monthly');
    });

    it('should use project slug in URL', () => {
      // Arrange
      const project = makeProject({
        slug: 'my-awesome-site',
        pages: [
          { id: 'p1', title: 'Home', slug: '', isHome: true, sections: [] },
        ],
      });

      // Act
      const result = generateSitemap(project);

      // Assert
      expect(result[0].url).toContain('my-awesome-site');
    });
  });
});
