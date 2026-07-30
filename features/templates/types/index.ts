// =============================================================================
// Template Types
// =============================================================================

import type { IndustryType } from '@/types';

export interface Template {
  id: string;
  name: string;
  description: string;
  industry: IndustryType;
  thumbnail: string;
  previewUrl: string;
  pages: string[];
  theme: string;
  tags: string[];
  featured: boolean;
  usageCount: number;
}

export interface TemplateFilter {
  industry?: IndustryType;
  search?: string;
  featured?: boolean;
  tags?: string[];
  sortBy?: 'popular' | 'newest' | 'name';
}
