// =============================================================================
// Website Builder — Blog System
// =============================================================================
// Blog home, posts, categories, tags, author, search, related posts, featured
// posts, and pagination.
// =============================================================================

import { nanoid } from 'nanoid';
import type { BlogPost, BlogState, BuilderProject } from './types';

export function defaultBlogState(author: string): BlogState {
  return {
    posts: [],
    categories: ['News'],
    tags: [],
    author,
  };
}

export function createBlogPost(
  project: BuilderProject,
  input: {
    title: string;
    excerpt: string;
    content: string;
    category?: string;
    tags?: string[];
    featured?: boolean;
  }
): BuilderProject {
  const post: BlogPost = {
    id: nanoid(),
    slug: input.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || `post-${nanoid(6)}`,
    title: input.title,
    excerpt: input.excerpt,
    content: input.content,
    category: input.category ?? 'News',
    tags: input.tags ?? [],
    author: project.blog.author,
    featured: input.featured ?? false,
    publishedAt: new Date().toISOString(),
  };

  return {
    ...project,
    blog: {
      ...project.blog,
      posts: [post, ...project.blog.posts],
      categories: Array.from(new Set([...project.blog.categories, post.category])),
      tags: Array.from(new Set([...project.blog.tags, ...post.tags])),
    },
  };
}

export function updateBlogPost(project: BuilderProject, postId: string, patch: Partial<BlogPost>): BuilderProject {
  return {
    ...project,
    blog: {
      ...project.blog,
      posts: project.blog.posts.map((post) => (post.id === postId ? { ...post, ...patch } : post)),
    },
  };
}

export function deleteBlogPost(project: BuilderProject, postId: string): BuilderProject {
  return {
    ...project,
    blog: { ...project.blog, posts: project.blog.posts.filter((post) => post.id !== postId) },
  };
}

export interface BlogFilters {
  category?: string;
  tag?: string;
  search?: string;
  featuredOnly?: boolean;
}

export function listPosts(project: BuilderProject, filters: BlogFilters = {}): BlogPost[] {
  let posts = [...project.blog.posts];

  if (filters.featuredOnly) posts = posts.filter((post) => post.featured);
  if (filters.category) posts = posts.filter((post) => post.category === filters.category);
  if (filters.tag) posts = posts.filter((post) => post.tags.includes(filters.tag ?? ''));
  if (filters.search) {
    const query = filters.search.toLowerCase();
    posts = posts.filter((post) =>
      `${post.title} ${post.excerpt} ${post.content}`.toLowerCase().includes(query)
    );
  }

  return posts.sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''));
}

export function getRelatedPosts(project: BuilderProject, postId: string, limit = 3): BlogPost[] {
  const post = project.blog.posts.find((p) => p.id === postId);
  if (!post) return [];
  return project.blog.posts
    .filter((p) => p.id !== postId)
    .map((p) => {
      const overlap = p.tags.filter((tag) => post.tags.includes(tag)).length;
      return { post: p, overlap };
    })
    .sort((a, b) => b.overlap - a.overlap)
    .slice(0, limit)
    .map((entry) => entry.post);
}

export function paginatePosts(posts: BlogPost[], page: number, pageSize = 6): { items: BlogPost[]; totalPages: number; page: number } {
  const safePage = Math.max(1, page);
  const start = (safePage - 1) * pageSize;
  return {
    items: posts.slice(start, start + pageSize),
    totalPages: Math.max(1, Math.ceil(posts.length / pageSize)),
    page: safePage,
  };
}
