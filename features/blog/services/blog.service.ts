// =============================================================================
// Blog Service
// =============================================================================
// AI-powered blog generation and CRUD operations.
// Blog posts are stored as sections of type "blog" within project pages.
// =============================================================================

import prisma from '@/lib/prisma/client';
import { createStructuredCompletion } from '@/lib/ai/client';
import { buildBlogPrompt } from '@/features/ai-engine/prompts';
import { NotFoundError, ForbiddenError, AIGenerationError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import type { BlogPost, BlogGenerationRequest } from '../types';

// ─── Types ───────────────────────────────────────────────────────────────────

interface CreateBlogPostInput {
  projectId: string;
  userId: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  coverImage?: string;
  author?: string;
  tags?: string[];
  metaTitle?: string;
  metaDescription?: string;
}

interface UpdateBlogPostInput {
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  coverImage?: string;
  tags?: string[];
  metaTitle?: string;
  metaDescription?: string;
  status?: 'draft' | 'published';
}

interface ListBlogPostsOptions {
  projectId: string;
  userId: string;
  status?: 'draft' | 'published';
  page?: number;
  limit?: number;
}

interface PaginatedBlogPosts {
  posts: BlogPost[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function requireProjectAccess(projectId: string, userId: string) {
  // Resolve Clerk userId → DB User.id
  let dbUserId = userId;
  if (userId.startsWith('user_')) {
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });
    if (!dbUser) throw new ForbiddenError('User not found');
    dbUserId = dbUser.id;
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, ownerId: true },
  });

  if (!project) {
    throw new NotFoundError('Project', projectId);
  }

  if (project.ownerId !== dbUserId) {
    throw new ForbiddenError('You do not have access to this project');
  }

  return project;
}

async function findBlogPage(projectId: string) {
  // Find or create a blog page in the project
  let page = await prisma.page.findFirst({
    where: { projectId, slug: 'blog' },
  });

  if (!page) {
    page = await prisma.page.create({
      data: {
        projectId,
        slug: 'blog',
        title: 'Blog',
        metaTitle: 'Blog',
        metaDescription: 'Read our latest articles',
        isHome: false,
        order: 10,
      },
    });
  }

  return page;
}

function sectionToBlogPost(section: any): BlogPost {
  const content = section.content as Record<string, any>;
  return {
    id: section.id,
    title: content.title || 'Untitled',
    slug: content.slug || section.id,
    excerpt: content.excerpt || '',
    content: content.content || '',
    coverImage: content.coverImage || null,
    author: content.author || 'Team',
    tags: content.tags || [],
    metaTitle: content.metaTitle || content.title || '',
    metaDescription: content.metaDescription || content.excerpt || '',
    publishedAt: content.publishedAt || null,
    status: content.publishedAt ? 'published' : 'draft',
  };
}

// ─── Generate Blog Post ──────────────────────────────────────────────────────

export async function generateBlogPost(
  request: BlogGenerationRequest,
  projectId: string,
  userId: string
): Promise<BlogPost> {
  await requireProjectAccess(projectId, userId);

  // Get project for business context
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { name: true, industry: true, businessType: true },
  });

  if (!project) {
    throw new NotFoundError('Project', projectId);
  }

  try {
    // Build prompt and call AI
    const prompt = buildBlogPrompt({
      topic: request.topic,
      tone: request.tone,
      wordCount: request.wordCount,
      keywords: request.keywords,
      businessType: project.businessType || project.name,
    });

    const result = await createStructuredCompletion<{
      title: string;
      slug: string;
      excerpt: string;
      content: string;
      author: string;
      publishedAt: string | null;
      tags: string[];
      metaTitle: string;
      metaDescription: string;
      readingTime: string;
    }>({
      system: 'You are a professional blog writer. Return valid JSON.',
      messages: [{ role: 'user', content: prompt }],
      schema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          slug: { type: 'string' },
          excerpt: { type: 'string' },
          content: { type: 'string' },
          author: { type: 'string' },
          publishedAt: { type: ['string', 'null'] },
          tags: { type: 'array', items: { type: 'string' } },
          metaTitle: { type: 'string' },
          metaDescription: { type: 'string' },
          readingTime: { type: 'string' },
        },
        required: ['title', 'slug', 'excerpt', 'content', 'tags', 'metaTitle', 'metaDescription'],
      },
    });

    // Store as a blog section
    const page = await findBlogPage(projectId);
    const section = await prisma.section.create({
      data: {
        pageId: page.id,
        type: 'blog',
        layout: '1-col',
        content: {
          title: result.title,
          slug: result.slug,
          excerpt: result.excerpt,
          content: result.content,
          author: result.author,
          tags: result.tags,
          metaTitle: result.metaTitle,
          metaDescription: result.metaDescription,
          readingTime: result.readingTime,
          publishedAt: null, // starts as draft
          coverImage: null,
        },
        styles: {},
        animations: [],
        images: [],
        visibility: { desktop: true, tablet: true, mobile: true },
        order: 0,
      },
    });

    logger.info('Blog post generated', {
      projectId,
      sectionId: section.id,
      title: result.title,
    });

    return sectionToBlogPost(section);
  } catch (error) {
    logger.error('Blog generation failed', { error: String(error) });
    throw new AIGenerationError(
      error instanceof Error ? error.message : 'Blog generation failed'
    );
  }
}

// ─── List Blog Posts ─────────────────────────────────────────────────────────

export async function listBlogPosts(
  options: ListBlogPostsOptions
): Promise<PaginatedBlogPosts> {
  const { projectId, userId, status, page = 1, limit = 20 } = options;

  await requireProjectAccess(projectId, userId);

  // Find blog page
  const blogPage = await prisma.page.findFirst({
    where: { projectId, slug: 'blog' },
  });

  if (!blogPage) {
    return { posts: [], total: 0, page, limit, totalPages: 0 };
  }

  // Get sections (blog posts)
  const where: any = {
    pageId: blogPage.id,
    type: 'blog',
  };

  const [sections, total] = await Promise.all([
    prisma.section.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.section.count({ where }),
  ]);

  let posts = sections.map(sectionToBlogPost);

  // Filter by status
  if (status) {
    posts = posts.filter((p) => p.status === status);
  }

  return {
    posts,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

// ─── Get Blog Post ───────────────────────────────────────────────────────────

export async function getBlogPost(
  sectionId: string,
  projectId: string,
  userId: string
): Promise<BlogPost> {
  await requireProjectAccess(projectId, userId);

  const section = await prisma.section.findFirst({
    where: { id: sectionId, type: 'blog' },
  });

  if (!section) {
    throw new NotFoundError('Blog post', sectionId);
  }

  return sectionToBlogPost(section);
}

// ─── Update Blog Post ────────────────────────────────────────────────────────

export async function updateBlogPost(
  sectionId: string,
  input: UpdateBlogPostInput,
  projectId: string,
  userId: string
): Promise<BlogPost> {
  await requireProjectAccess(projectId, userId);

  const section = await prisma.section.findFirst({
    where: { id: sectionId, type: 'blog' },
  });

  if (!section) {
    throw new NotFoundError('Blog post', sectionId);
  }

  const content = section.content as Record<string, any>;

  const updatedContent = {
    ...content,
    ...(input.title !== undefined && { title: input.title }),
    ...(input.slug !== undefined && { slug: input.slug }),
    ...(input.excerpt !== undefined && { excerpt: input.excerpt }),
    ...(input.content !== undefined && { content: input.content }),
    ...(input.coverImage !== undefined && { coverImage: input.coverImage }),
    ...(input.tags !== undefined && { tags: input.tags }),
    ...(input.metaTitle !== undefined && { metaTitle: input.metaTitle }),
    ...(input.metaDescription !== undefined && { metaDescription: input.metaDescription }),
    ...(input.status !== undefined && {
      publishedAt: input.status === 'published'
        ? content.publishedAt || new Date().toISOString()
        : null,
    }),
  };

  const updated = await prisma.section.update({
    where: { id: sectionId },
    data: { content: updatedContent },
  });

  return sectionToBlogPost(updated);
}

// ─── Delete Blog Post ────────────────────────────────────────────────────────

export async function deleteBlogPost(
  sectionId: string,
  projectId: string,
  userId: string
): Promise<void> {
  await requireProjectAccess(projectId, userId);

  const section = await prisma.section.findFirst({
    where: { id: sectionId, type: 'blog' },
  });

  if (!section) {
    throw new NotFoundError('Blog post', sectionId);
  }

  await prisma.section.delete({ where: { id: sectionId } });

  logger.info('Blog post deleted', { projectId, sectionId });
}
