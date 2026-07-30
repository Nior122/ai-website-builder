// =============================================================================
// Blog Types
// =============================================================================

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string | null;
  author: string;
  tags: string[];
  metaTitle: string;
  metaDescription: string;
  publishedAt: string | null;
  status: 'draft' | 'published';
}

export interface BlogGenerationRequest {
  topic: string;
  tone: string;
  wordCount: number;
  keywords: string[];
  includeImages: boolean;
}

export interface BlogListConfig {
  postsPerPage: number;
  showExcerpts: boolean;
  showAuthor: boolean;
  showDate: boolean;
  showTags: boolean;
  layout: 'grid' | 'list' | 'masonry';
}
