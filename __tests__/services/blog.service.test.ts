// =============================================================================
// Blog Service Tests
// =============================================================================
// Unit tests for blog post generation and CRUD.
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mocks ─────────────────────────────────────────────────────────────

vi.mock('@/lib/prisma/client', () => ({
  default: {
    project: {
      findUnique: vi.fn(),
    },
    page: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    section: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    // Idempotent Clerk→DB resolution for ownership checks.
    user: {
      findUnique: vi.fn(async ({ where: { clerkId } }: { where: { clerkId: string } }) => ({
        id: clerkId,
      })),
    },
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('@/lib/ai/client', () => ({
  createStructuredCompletion: vi.fn(),
}));

vi.mock('@/features/ai-engine/prompts', () => ({
  buildBlogPrompt: vi.fn().mockReturnValue('mock prompt'),
}));

// ─── Imports ───────────────────────────────────────────────────────────

import {
  generateBlogPost,
  listBlogPosts,
  getBlogPost,
  updateBlogPost,
  deleteBlogPost,
} from '@/features/blog/services/blog.service';
import prisma from '@/lib/prisma/client';
import { createStructuredCompletion } from '@/lib/ai/client';
import { NotFoundError, ForbiddenError } from '@/lib/errors';

// ─── Test Data ─────────────────────────────────────────────────────────

const MOCK_USER_ID = 'user_123';
const MOCK_PROJECT_ID = 'proj_456';

const mockProject = {
  id: MOCK_PROJECT_ID,
  ownerId: MOCK_USER_ID,
  name: 'Test Project',
  industry: 'Technology',
  businessType: 'SaaS',
};

const mockBlogPage = {
  id: 'page_blog',
  projectId: MOCK_PROJECT_ID,
  slug: 'blog',
  title: 'Blog',
};

const mockBlogSection = {
  id: 'section_blog_001',
  pageId: 'page_blog',
  type: 'blog',
  layout: '1-col',
  content: {
    title: 'Test Blog Post',
    slug: 'test-blog-post',
    excerpt: 'This is a test blog post',
    content: '# Test Content\n\nThis is the full content.',
    author: 'Test Author',
    tags: ['test', 'blog'],
    metaTitle: 'Test Blog Post',
    metaDescription: 'This is a test blog post',
    readingTime: '3 min',
    publishedAt: null,
    coverImage: null,
  },
  styles: {},
  animations: [],
  images: [],
  visibility: { desktop: true, tablet: true, mobile: true },
  order: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ─── Tests ─────────────────────────────────────────────────────────────

describe('BlogService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateBlogPost', () => {
    it('should generate a blog post successfully', async () => {
      vi.mocked(prisma.project.findUnique).mockResolvedValue(mockProject as never);
      vi.mocked(prisma.page.findFirst).mockResolvedValue(mockBlogPage as never);
      vi.mocked(createStructuredCompletion).mockResolvedValue({
        title: 'AI Generated Post',
        slug: 'ai-generated-post',
        excerpt: 'Generated excerpt',
        content: '# Generated Content',
        author: 'AI Writer',
        publishedAt: null,
        tags: ['ai', 'generated'],
        metaTitle: 'AI Generated Post',
        metaDescription: 'Generated description',
        readingTime: '5 min',
      });
      vi.mocked(prisma.section.create).mockResolvedValue(mockBlogSection as never);

      const result = await generateBlogPost(
        {
          topic: 'Test Topic',
          tone: 'professional',
          wordCount: 800,
          keywords: ['test'],
          includeImages: false,
        },
        MOCK_PROJECT_ID,
        MOCK_USER_ID
      );

      expect(result.title).toBe('Test Blog Post');
      expect(result.status).toBe('draft');
      expect(prisma.section.create).toHaveBeenCalledOnce();
    });

    it('should throw ForbiddenError for non-owner', async () => {
      vi.mocked(prisma.project.findUnique).mockResolvedValue({
        ...mockProject,
        ownerId: 'other_user',
      } as never);

      await expect(
        generateBlogPost(
          {
            topic: 'Test Topic',
            tone: 'professional',
            wordCount: 800,
            keywords: [],
            includeImages: false,
          },
          MOCK_PROJECT_ID,
          MOCK_USER_ID
        )
      ).rejects.toThrow(ForbiddenError);
    });

    it('should throw NotFoundError for non-existent project', async () => {
      vi.mocked(prisma.project.findUnique).mockResolvedValue(null);

      await expect(
        generateBlogPost(
          {
            topic: 'Test Topic',
            tone: 'professional',
            wordCount: 800,
            keywords: [],
            includeImages: false,
          },
          'nonexistent',
          MOCK_USER_ID
        )
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('listBlogPosts', () => {
    it('should list blog posts for authorized user', async () => {
      vi.mocked(prisma.project.findUnique).mockResolvedValue(mockProject as never);
      vi.mocked(prisma.page.findFirst).mockResolvedValue(mockBlogPage as never);
      vi.mocked(prisma.section.findMany).mockResolvedValue([mockBlogSection] as never);
      vi.mocked(prisma.section.count).mockResolvedValue(1);

      const result = await listBlogPosts({
        projectId: MOCK_PROJECT_ID,
        userId: MOCK_USER_ID,
      });

      expect(result.posts).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.posts[0].title).toBe('Test Blog Post');
    });

    it('should return empty result when no blog page exists', async () => {
      vi.mocked(prisma.project.findUnique).mockResolvedValue(mockProject as never);
      vi.mocked(prisma.page.findFirst).mockResolvedValue(null);

      const result = await listBlogPosts({
        projectId: MOCK_PROJECT_ID,
        userId: MOCK_USER_ID,
      });

      expect(result.posts).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should filter by status', async () => {
      vi.mocked(prisma.project.findUnique).mockResolvedValue(mockProject as never);
      vi.mocked(prisma.page.findFirst).mockResolvedValue(mockBlogPage as never);
      vi.mocked(prisma.section.findMany).mockResolvedValue([
        mockBlogSection,
        {
          ...mockBlogSection,
          id: 'section_blog_002',
          content: {
            ...mockBlogSection.content,
            publishedAt: new Date().toISOString(),
          },
        },
      ] as never);
      vi.mocked(prisma.section.count).mockResolvedValue(2);

      const result = await listBlogPosts({
        projectId: MOCK_PROJECT_ID,
        userId: MOCK_USER_ID,
        status: 'published',
      });

      expect(result.posts).toHaveLength(1);
      expect(result.posts[0].status).toBe('published');
    });
  });

  describe('getBlogPost', () => {
    it('should get a blog post by ID', async () => {
      vi.mocked(prisma.project.findUnique).mockResolvedValue(mockProject as never);
      vi.mocked(prisma.section.findFirst).mockResolvedValue(mockBlogSection as never);

      const result = await getBlogPost(
        'section_blog_001',
        MOCK_PROJECT_ID,
        MOCK_USER_ID
      );

      expect(result.id).toBe('section_blog_001');
      expect(result.title).toBe('Test Blog Post');
    });

    it('should throw NotFoundError for non-existent post', async () => {
      vi.mocked(prisma.project.findUnique).mockResolvedValue(mockProject as never);
      vi.mocked(prisma.section.findFirst).mockResolvedValue(null);

      await expect(
        getBlogPost('nonexistent', MOCK_PROJECT_ID, MOCK_USER_ID)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('updateBlogPost', () => {
    it('should update blog post fields', async () => {
      vi.mocked(prisma.project.findUnique).mockResolvedValue(mockProject as never);
      vi.mocked(prisma.section.findFirst).mockResolvedValue(mockBlogSection as never);
      vi.mocked(prisma.section.update).mockResolvedValue({
        ...mockBlogSection,
        content: {
          ...mockBlogSection.content,
          title: 'Updated Title',
        },
      } as never);

      const result = await updateBlogPost(
        'section_blog_001',
        { title: 'Updated Title' },
        MOCK_PROJECT_ID,
        MOCK_USER_ID
      );

      expect(result.title).toBe('Updated Title');
    });

    it('should publish a blog post', async () => {
      vi.mocked(prisma.project.findUnique).mockResolvedValue(mockProject as never);
      vi.mocked(prisma.section.findFirst).mockResolvedValue(mockBlogSection as never);
      vi.mocked(prisma.section.update).mockResolvedValue({
        ...mockBlogSection,
        content: {
          ...mockBlogSection.content,
          publishedAt: new Date().toISOString(),
        },
      } as never);

      const result = await updateBlogPost(
        'section_blog_001',
        { status: 'published' },
        MOCK_PROJECT_ID,
        MOCK_USER_ID
      );

      expect(result.status).toBe('published');
    });

    it('should throw NotFoundError for non-existent post', async () => {
      vi.mocked(prisma.project.findUnique).mockResolvedValue(mockProject as never);
      vi.mocked(prisma.section.findFirst).mockResolvedValue(null);

      await expect(
        updateBlogPost('nonexistent', { title: 'Updated' }, MOCK_PROJECT_ID, MOCK_USER_ID)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteBlogPost', () => {
    it('should delete a blog post', async () => {
      vi.mocked(prisma.project.findUnique).mockResolvedValue(mockProject as never);
      vi.mocked(prisma.section.findFirst).mockResolvedValue(mockBlogSection as never);
      vi.mocked(prisma.section.delete).mockResolvedValue({} as never);

      await deleteBlogPost('section_blog_001', MOCK_PROJECT_ID, MOCK_USER_ID);

      expect(prisma.section.delete).toHaveBeenCalledOnce();
    });

    it('should throw NotFoundError for non-existent post', async () => {
      vi.mocked(prisma.project.findUnique).mockResolvedValue(mockProject as never);
      vi.mocked(prisma.section.findFirst).mockResolvedValue(null);

      await expect(
        deleteBlogPost('nonexistent', MOCK_PROJECT_ID, MOCK_USER_ID)
      ).rejects.toThrow(NotFoundError);
    });
  });
});
