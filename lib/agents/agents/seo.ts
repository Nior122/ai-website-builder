// =============================================================================
// Agent 7 — SEO Agent
// =============================================================================
// Generates meta title, meta description, keywords, OpenGraph, Twitter cards,
// schema markup, sitemap info, and SEO recommendations.
// =============================================================================

import { Agent, isNonEmptyArray, isNonEmptyString, isRecord } from '../base';
import type { ProjectContext } from '../context';
import type { AgentSeo } from '../types';

export class SeoAgent extends Agent {
  readonly id = 'seo' as const;
  readonly outputKey = 'seo';

  run(context: ProjectContext): AgentSeo {
    const req = context.request;
    const brand = context.brand;
    const ux = context.ux;

    const name = brand?.name ?? req.businessType;
    const metaTitle = `${name} | ${req.industry} ${req.businessType}`.slice(0, 60);
    const metaDescription = (brand?.tagline ?? `${req.businessType} services in ${req.industry}.`)
      .slice(0, 160);

    const keywords = Array.from(
      new Set(
        [
          req.industry.toLowerCase(),
          req.businessType.toLowerCase(),
          ...req.industry.toLowerCase().split(/\s+/),
          ...req.businessType.toLowerCase().split(/\s+/),
          'services',
          'quality',
        ].filter((keyword) => keyword.length > 1)
      )
    ).slice(0, 10);

    const pageTitles = ux?.pages.map((page) => page.title) ?? ['Home'];

    return {
      metaTitle,
      metaDescription,
      keywords,
      ogImage: null,
      ogType: 'website',
      twitterCard: 'summary_large_image',
      schema: [
        {
          type: 'Organization',
          data: { name, url: null, logo: null, sameAs: [] },
        },
        {
          type: 'WebSite',
          data: { name, url: null, potentialAction: { type: 'SearchAction' } },
        },
      ],
      sitemap: true,
      recommendations: [
        `Set canonical URLs for every page: ${pageTitles.join(', ')}`,
        'Compress images to WebP/AVIF with explicit dimensions',
        'Add descriptive alt text to every image (done by the Accessibility agent)',
        'Publish fresh content on the blog to grow keyword coverage',
        'Submit the sitemap in Google Search Console after launch',
      ],
    };
  }

  validate(output: unknown): boolean {
    if (!isRecord(output)) return false;
    return (
      isNonEmptyString(output.metaTitle) &&
      isNonEmptyString(output.metaDescription) &&
      isNonEmptyArray(output.keywords) &&
      Array.isArray(output.schema)
    );
  }

  fallback(context: ProjectContext): AgentSeo {
    const req = context.request;
    return {
      metaTitle: `${req.businessType} services in ${req.industry}`.slice(0, 60),
      metaDescription: `Professional ${req.businessType} services in ${req.industry}.`,
      keywords: [req.industry.toLowerCase(), req.businessType.toLowerCase(), 'services'],
      ogImage: null,
      ogType: 'website',
      twitterCard: 'summary_large_image',
      schema: [{ type: 'Organization', data: {} }],
      sitemap: true,
      recommendations: ['Add canonical URLs', 'Compress images'],
    };
  }
}
