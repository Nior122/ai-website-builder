// =============================================================================
// SEO Types
// =============================================================================

export interface SEOAuditResult {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  issues: SEOIssue[];
  suggestions: SEOSuggestion[];
}

export interface SEOIssue {
  type: 'error' | 'warning' | 'info';
  category: string;
  message: string;
  fix?: string;
}

export interface SEOSuggestion {
  category: string;
  impact: 'high' | 'medium' | 'low';
  description: string;
}

export interface MetaTagConfig {
  title: string;
  description: string;
  keywords?: string[];
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  canonicalUrl?: string;
  robots?: string;
  structuredData?: Record<string, unknown>;
}

export interface SitemapEntry {
  url: string;
  lastModified: string;
  changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
}
