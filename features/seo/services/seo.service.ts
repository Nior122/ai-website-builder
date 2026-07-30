// =============================================================================
// SEO Service
// =============================================================================
// SEO analysis, meta tag generation, sitemap creation, and structured data.
// =============================================================================

import type { SEOAuditResult, SEOIssue, SEOSuggestion, MetaTagConfig, SitemapEntry } from '../types';
import type { Project, Page, Section } from '@prisma/client';

type ProjectWithPages = Project & {
  pages: (Page & { sections: Section[] })[];
};

/**
 * Run a full SEO audit on a project.
 */
export function auditSEO(project: ProjectWithPages): SEOAuditResult {
  const issues: SEOIssue[] = [];
  const suggestions: SEOSuggestion[] = [];
  let score = 100;

  // Check project-level SEO
  const seo = (project.seo || {}) as Record<string, unknown>;
  if (!seo.metaTitle && !project.name) {
    issues.push({ type: 'error', category: 'meta', message: 'Missing meta title' });
    score -= 15;
  }

  if (!seo.metaDescription) {
    issues.push({ type: 'warning', category: 'meta', message: 'Missing meta description' });
    score -= 10;
  }

  // Check each page
  for (const page of project.pages) {
    if (!page.metaTitle) {
      issues.push({ type: 'warning', category: 'meta', message: `Page "${page.title}" missing meta title` });
      score -= 5;
    }

    if (!page.metaDescription) {
      issues.push({ type: 'warning', category: 'meta', message: `Page "${page.title}" missing meta description` });
      score -= 5;
    }

    if (page.metaTitle && page.metaTitle.length > 60) {
      issues.push({ type: 'warning', category: 'meta', message: `Page "${page.title}" meta title too long (${page.metaTitle.length}/60 chars)` });
      score -= 3;
    }

    if (page.metaDescription && page.metaDescription.length > 160) {
      issues.push({ type: 'warning', category: 'meta', message: `Page "${page.title}" meta description too long` });
      score -= 3;
    }

    // Check sections for content quality
    for (const section of page.sections) {
      const content = section.content as Record<string, unknown>;

      if (section.type === 'hero' && !content.headline) {
        issues.push({ type: 'error', category: 'content', message: `Hero section on "${page.title}" missing headline` });
        score -= 10;
      }

      if (section.type === 'hero' && !content.cta) {
        suggestions.push({ type: 'info', category: 'conversion', message: 'Consider adding a call-to-action to the hero section' } as any);
      }
    }
  }

  // General suggestions
  suggestions.push({
    category: 'performance',
    impact: 'high',
    description: 'Ensure images are optimized with Next.js Image component for better Core Web Vitals',
  });

  suggestions.push({
    category: 'accessibility',
    impact: 'medium',
    description: 'Add alt text to all images and ensure proper heading hierarchy',
  });

  return {
    score: Math.max(0, score),
    grade: score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F',
    issues,
    suggestions,
  };
}

/**
 * Generate meta tags for a page.
 */
export function generateMetaTags(page: {
  title: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
  slug: string;
}): MetaTagConfig {
  return {
    title: page.metaTitle || page.title,
    description: page.metaDescription || '',
    ogTitle: page.metaTitle || page.title,
    ogDescription: page.metaDescription || '',
    ogType: 'website',
    twitterCard: 'summary_large_image',
    twitterTitle: page.metaTitle || page.title,
    twitterDescription: page.metaDescription || '',
    robots: 'index, follow',
  };
}

/**
 * Generate a sitemap for a project.
 */
export function generateSitemap(project: ProjectWithPages): SitemapEntry[] {
  return project.pages.map((page) => ({
    url: `https://${project.slug || 'example.com'}/${page.isHome ? '' : page.slug}`,
    lastModified: project.updatedAt.toISOString(),
    changeFrequency: page.isHome ? 'weekly' : 'monthly' as const,
    priority: page.isHome ? 1.0 : 0.8,
  }));
}
