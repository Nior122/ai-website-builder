// =============================================================================
// Robots.txt Configuration
// =============================================================================
// Controls search engine crawling behavior. Allows public pages,
// blocks private/authenticated areas.
// =============================================================================

import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://aiwebsitebuilder.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard/',
          '/editor/',
          '/api/',
          '/site/',
          '/preview/',
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
