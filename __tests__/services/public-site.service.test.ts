// =============================================================================
// Public Site Service Tests
// =============================================================================
// Tests for public site data retrieval, SEO config, domain lookup, and
// metadata generation. Requires Prisma, Redis, and renderer mocks.
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getPublishedProjectBySlug,
  getSeoConfig,
  getProjectByDomain,
  buildPublicMetadata,
} from '@/features/publishing/services/public-site.service';

// ─── Mocks ─────────────────────────────────────────────────────────────

vi.mock('@/lib/prisma/client', () => ({
  default: {
    project: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}));

vi.mock('@/lib/redis/cache', () => ({
  cacheGetOrSet: vi.fn((_key: string, fn: () => Promise<any>) => fn()),
  cacheGet: vi.fn(),
  cacheSet: vi.fn(),
  cacheKeys: {
    projectBySlug: (slug: string) => `project:slug:${slug}`,
    domainLookup: (domain: string) => `domain:${domain}`,
  },
}));

vi.mock('@/features/renderer/lib/parse-page', () => ({
  parseProjectPages: vi.fn((pages: any[]) =>
    pages.map((p: any) => ({
      ...p,
      sections: p.sections?.map((s: any) => ({
        ...s,
        content: typeof s.content === 'string' ? JSON.parse(s.content) : s.content,
        animations: typeof s.animations === 'string' ? JSON.parse(s.animations) : (s.animations ?? []),
        images: typeof s.images === 'string' ? JSON.parse(s.images) : (s.images ?? []),
        visibility: typeof s.visibility === 'string' ? JSON.parse(s.visibility) : (s.visibility ?? {}),
        styles: typeof s.styles === 'string' ? JSON.parse(s.styles) : (s.styles ?? {}),
        settings: typeof s.settings === 'string' ? JSON.parse(s.settings) : (s.settings ?? {}),
      })),
    }))
  ),
}));

vi.mock('@/features/json-engine', () => ({
  getDefaultTheme: vi.fn((preset = 'modern') => ({
    preset,
    mode: 'light',
    colors: { primary: {}, secondary: {}, accent: {} },
    typography: { fontFamily: { heading: 'Inter', body: 'Inter' } },
    spacing: { unit: 8 },
    borderRadius: {},
    shadows: {},
    animations: { enabled: true },
  })),
}));

vi.mock('@/features/seo/services/seo.service', () => ({
  generateMetaTags: vi.fn((page: any) => ({
    title: page.title || 'Untitled',
    description: page.metaDescription || '',
    ogTitle: page.metaTitle || page.title,
    ogDescription: page.metaDescription || '',
  })),
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

// ─── Tests ─────────────────────────────────────────────────────────────

describe('PublicSiteService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPublishedProjectBySlug', () => {
    it('should return null when project not found', async () => {
      const { default: prisma } = await import('@/lib/prisma/client');
      (prisma.project.findUnique as any).mockResolvedValue(null);

      const result = await getPublishedProjectBySlug('nonexistent-slug');
      expect(result).toBeNull();
    });

    it('should return null when project is not published', async () => {
      const { default: prisma } = await import('@/lib/prisma/client');
      (prisma.project.findUnique as any).mockResolvedValue({
        id: 'proj-1',
        name: 'Draft Site',
        slug: 'draft-site',
        status: 'draft',
        pages: [],
      });

      const result = await getPublishedProjectBySlug('draft-site');
      expect(result).toBeNull();
    });

    it('should return published project data with parsed pages', async () => {
      const { default: prisma } = await import('@/lib/prisma/client');
      const mockProject = {
        id: 'proj-1',
        name: 'Test Site',
        slug: 'test-site',
        description: 'A test site',
        businessType: 'startup',
        industry: 'tech',
        status: 'published',
        ownerId: 'user-1',
        organizationId: null,
        templateId: null,
        thumbnailUrl: null,
        customDomain: null,
        publishedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        globalStyles: { preset: 'modern', mode: 'light', colors: { primary: '#3b82f6' } },
        seo: { title: 'Test Site', description: 'Best site' },
        settings: {},
        pages: [
          {
            id: 'page-1',
            slug: 'home',
            title: 'Home',
            metaTitle: 'Home | Test',
            metaDescription: 'Welcome',
            isHome: true,
            order: 0,
            seo: null,
            sections: [
              {
                id: 'sec-1',
                type: 'hero',
                layout: 'centered',
                content: '{"headline":"Hello"}',
                animations: '[]',
                images: '[]',
                order: 0,
                visibility: '{"desktop":true,"tablet":true,"mobile":true}',
                styles: '{}',
                isLocked: false,
                settings: '{}',
                createdAt: new Date(),
                updatedAt: new Date(),
                pageId: 'page-1',
                parentId: null,
              },
            ],
          },
        ],
      };
      (prisma.project.findUnique as any).mockResolvedValue(mockProject);

      const result = await getPublishedProjectBySlug('test-site');

      expect(result).not.toBeNull();
      expect(result!.project.name).toBe('Test Site');
      expect(result!.project.id).toBe('proj-1');
      expect(result!.page.slug).toBe('home');
      expect(result!.theme.preset).toBeDefined();
    });

    it('should resolve a specific page by slug', async () => {
      const { default: prisma } = await import('@/lib/prisma/client');
      const mockProject = {
        id: 'proj-1',
        name: 'Test Site',
        slug: 'test-site',
        description: null,
        businessType: null,
        industry: null,
        status: 'published',
        ownerId: 'user-1',
        organizationId: null,
        templateId: null,
        thumbnailUrl: null,
        customDomain: null,
        publishedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        globalStyles: null,
        seo: null,
        settings: null,
        pages: [
          {
            id: 'page-1',
            slug: 'home',
            title: 'Home',
            metaTitle: null,
            metaDescription: null,
            isHome: true,
            order: 0,
            seo: null,
            sections: [],
          },
          {
            id: 'page-2',
            slug: 'about',
            title: 'About',
            metaTitle: null,
            metaDescription: null,
            isHome: false,
            order: 1,
            seo: null,
            sections: [],
          },
        ],
      };
      (prisma.project.findUnique as any).mockResolvedValue(mockProject);

      const result = await getPublishedProjectBySlug('test-site', 'about');

      expect(result).not.toBeNull();
      expect(result!.page.slug).toBe('about');
    });

    it('should return null for non-existent page slug', async () => {
      const { default: prisma } = await import('@/lib/prisma/client');
      const mockProject = {
        id: 'proj-1',
        name: 'Test Site',
        slug: 'test-site',
        description: null,
        businessType: null,
        industry: null,
        status: 'published',
        ownerId: 'user-1',
        organizationId: null,
        templateId: null,
        thumbnailUrl: null,
        customDomain: null,
        publishedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        globalStyles: null,
        seo: null,
        settings: null,
        pages: [
          {
            id: 'page-1',
            slug: 'home',
            title: 'Home',
            metaTitle: null,
            metaDescription: null,
            isHome: true,
            order: 0,
            seo: null,
            sections: [],
          },
        ],
      };
      (prisma.project.findUnique as any).mockResolvedValue(mockProject);

      const result = await getPublishedProjectBySlug('test-site', 'nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('getSeoConfig', () => {
    it('should return SEO config from project', () => {
      const project = {
        name: 'Test Site',
        seo: { title: 'Test Site', description: 'Best site' },
      } as any;

      const result = getSeoConfig(project);
      expect(result).toEqual({ title: 'Test Site', description: 'Best site' });
    });

    it('should return empty object when seo is null', () => {
      const project = {
        name: 'Test',
        seo: null,
      } as any;

      const result = getSeoConfig(project);
      expect(result).toEqual({});
    });

    it('should return empty object when seo is undefined', () => {
      const project = {
        name: 'Test',
      } as any;

      const result = getSeoConfig(project);
      expect(result).toEqual({});
    });
  });

  describe('getProjectByDomain', () => {
    it('should find project by custom domain', async () => {
      const { default: prisma } = await import('@/lib/prisma/client');
      (prisma.project.findFirst as any).mockResolvedValue({
        slug: 'my-site',
        id: 'proj-1',
      });

      const result = await getProjectByDomain('example.com');
      expect(result).toEqual({ slug: 'my-site', id: 'proj-1' });
    });

    it('should return null for unknown domain', async () => {
      const { default: prisma } = await import('@/lib/prisma/client');
      (prisma.project.findFirst as any).mockResolvedValue(null);

      const result = await getProjectByDomain('unknown.com');
      expect(result).toBeNull();
    });

    it('should pass correct where clause', async () => {
      const { default: prisma } = await import('@/lib/prisma/client');
      (prisma.project.findFirst as any).mockResolvedValue(null);

      await getProjectByDomain('my-domain.com');

      expect(prisma.project.findFirst).toHaveBeenCalledWith({
        where: { customDomain: 'my-domain.com', status: 'published' },
        select: { slug: true, id: true },
      });
    });
  });

  describe('buildPublicMetadata', () => {
    it('should build metadata from site data', () => {
      const data = {
        project: {
          name: 'Test Site',
          seo: { metaTitle: 'Custom Title', metaDescription: 'Custom desc' },
        },
        page: {
          slug: 'home',
          title: 'Home',
          metaTitle: 'Home | Test',
          metaDescription: 'Welcome',
          isHome: true,
        },
      } as any;

      const result = buildPublicMetadata(data);
      expect(result.title).toBe('Custom Title');
      expect(result.description).toBe('Custom desc');
    });

    it('should fall back to page title when no project SEO', () => {
      const data = {
        project: {
          name: 'Test Site',
          seo: null,
        },
        page: {
          slug: 'home',
          title: 'Home',
          metaTitle: null,
          metaDescription: 'Page desc',
          isHome: true,
        },
      } as any;

      const result = buildPublicMetadata(data);
      expect(result.title).toBe('Home');
    });

    it('should return empty object for null data', () => {
      const result = buildPublicMetadata(null);
      expect(result).toEqual({});
    });

    it('should include openGraph metadata', () => {
      const data = {
        project: {
          name: 'Test Site',
          seo: {
            metaTitle: 'OG Title',
            metaDescription: 'OG Desc',
            ogType: 'article',
            ogImage: 'https://example.com/og.png',
          },
        },
        page: {
          slug: 'home',
          title: 'Home',
          metaTitle: null,
          metaDescription: null,
          isHome: true,
        },
      } as any;

      const result = buildPublicMetadata(data);
      expect(result.openGraph).toBeDefined();
      expect((result.openGraph as any)!.type).toBe('article');
    });

    it('should include twitter card metadata', () => {
      const data = {
        project: {
          name: 'Test Site',
          seo: {
            twitterCard: 'summary',
            twitterSite: '@testsite',
          },
        },
        page: {
          slug: 'home',
          title: 'Home',
          metaTitle: null,
          metaDescription: null,
          isHome: true,
        },
      } as any;

      const result = buildPublicMetadata(data);
      expect(result.twitter).toBeDefined();
    });
  });
});
