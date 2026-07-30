// =============================================================================
// Publishing Service Tests
// =============================================================================
// Unit tests for publish/unpublish state machine and snapshot builder.
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mocks ─────────────────────────────────────────────────────────────

vi.mock('@/lib/prisma/client', () => ({
  default: {
    project: {
      update: vi.fn(),
    },
    $transaction: vi.fn((fn: (tx: unknown) => unknown) =>
      fn({
        project: { update: vi.fn().mockResolvedValue({ id: 'proj_1', status: 'published', slug: 'test' }) },
        version: { create: vi.fn().mockResolvedValue({}) },
      })
    ),
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

vi.mock('@/lib/redis/cache', () => ({
  cacheDelete: vi.fn().mockResolvedValue(undefined),
  cacheKeys: {
    project: (id: string) => `project:${id}`,
    projectBySlug: (slug: string) => `project:slug:${slug}`,
  },
}));

vi.mock('@/features/projects/services/project.service', () => ({
  getProjectById: vi.fn(),
}));

vi.mock('@/features/admin/services/audit.service', () => ({
  logAuditEntry: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/features/publishing/services/version.service', () => ({
  getNextVersionNumber: vi.fn().mockResolvedValue(1),
}));

// ─── Imports ───────────────────────────────────────────────────────────

import {
  buildPublishedUrl,
  buildProjectSnapshot,
  publishProject,
  unpublishProject,
} from '@/features/publishing/services/publishing.service';
import { getProjectById } from '@/features/projects/services/project.service';
import prisma from '@/lib/prisma/client';
import { cacheDelete } from '@/lib/redis/cache';

// ─── Test Data ─────────────────────────────────────────────────────────

const now = new Date('2025-06-15T12:00:00Z');

const mockProjectWithPages = {
  id: 'proj_1',
  name: 'Test Project',
  slug: 'test-project',
  description: 'A test',
  industry: 'Tech',
  businessType: 'SaaS',
  status: 'draft',
  customDomain: null,
  thumbnailUrl: null,
  templateId: null,
  globalStyles: { primaryColor: '#000' },
  seo: { title: 'Test' },
  settings: {},
  publishedAt: null,
  ownerId: 'user_1',
  createdAt: now,
  updatedAt: now,
  pages: [
    {
      id: 'page_1',
      slug: 'home',
      title: 'Home',
      metaTitle: 'Home',
      metaDescription: '',
      isHome: true,
      order: 0,
      createdAt: now,
      updatedAt: now,
      projectId: 'proj_1',
      sections: [
        {
          id: 'sec_1',
          type: 'hero',
          layout: 'centered',
          order: 0,
          content: { headline: 'Hello' },
          styles: {},
          animations: [],
          images: [],
          visibility: { desktop: true, tablet: true, mobile: true },
          pageId: 'page_1',
          createdAt: now,
          updatedAt: now,
        },
      ],
    },
  ],
} as never;

// ─── Tests ─────────────────────────────────────────────────────────────

describe('PublishingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('buildPublishedUrl', () => {
    it('should return /site/<slug>', () => {
      expect(buildPublishedUrl('my-project')).toBe('/site/my-project');
    });
  });

  describe('buildProjectSnapshot', () => {
    it('should serialize project with ISO dates', () => {
      const snapshot = buildProjectSnapshot(mockProjectWithPages);

      expect(snapshot.project.id).toBe('proj_1');
      expect(snapshot.project.name).toBe('Test Project');
      expect(snapshot.project.publishedAt).toBeNull();
      expect(snapshot.project.createdAt).toBe('2025-06-15T12:00:00.000Z');
    });

    it('should serialize pages sorted by order', () => {
      const snapshot = buildProjectSnapshot(mockProjectWithPages);

      expect(snapshot.pages).toHaveLength(1);
      expect(snapshot.pages[0].slug).toBe('home');
      expect(snapshot.pages[0].isHome).toBe(true);
    });

    it('should serialize sections sorted by order', () => {
      const snapshot = buildProjectSnapshot(mockProjectWithPages);

      expect(snapshot.pages[0].sections).toHaveLength(1);
      expect(snapshot.pages[0].sections[0].type).toBe('hero');
      expect(snapshot.pages[0].sections[0].content).toEqual({ headline: 'Hello' });
    });

    it('should serialize publishedAt as ISO string', () => {
      const project = {
        ...(mockProjectWithPages as Record<string, unknown>),
        publishedAt: new Date('2025-01-01T00:00:00Z'),
      } as never;

      const snapshot = buildProjectSnapshot(project);

      expect(snapshot.project.publishedAt).toBe('2025-01-01T00:00:00.000Z');
    });

    it('should pass through JSON fields as-is', () => {
      const snapshot = buildProjectSnapshot(mockProjectWithPages);

      expect(snapshot.project.globalStyles).toEqual({ primaryColor: '#000' });
      expect(snapshot.project.seo).toEqual({ title: 'Test' });
      expect(snapshot.project.settings).toEqual({});
    });
  });

  describe('publishProject', () => {
    it('should publish a project and return result', async () => {
      vi.mocked(getProjectById).mockResolvedValue(mockProjectWithPages as never);
      vi.mocked(prisma.$transaction).mockImplementation(async (fn: any) => {
        return fn({
          project: {
            update: vi.fn().mockResolvedValue({
              id: 'proj_1',
              status: 'published',
              slug: 'test-project',
              publishedAt: now,
            }),
          },
          version: { create: vi.fn().mockResolvedValue({}) },
        });
      });

      const result = await publishProject('proj_1', 'user_1');

      expect(result.id).toBe('proj_1');
      expect(result.status).toBe('published');
      expect(result.publishedUrl).toBe('/site/test-project');
      expect(cacheDelete).toHaveBeenCalled();
    });

    it('should call getNextVersionNumber for version numbering', async () => {
      const { getNextVersionNumber } = await import('@/features/publishing/services/version.service');
      vi.mocked(getProjectById).mockResolvedValue(mockProjectWithPages as never);
      vi.mocked(prisma.$transaction).mockImplementation(async (fn: any) => {
        return fn({
          project: { update: vi.fn().mockResolvedValue({ id: 'proj_1', status: 'published', slug: 'test' }) },
          version: { create: vi.fn().mockResolvedValue({}) },
        });
      });

      await publishProject('proj_1', 'user_1');

      expect(getNextVersionNumber).toHaveBeenCalledWith('proj_1');
    });
  });

  describe('unpublishProject', () => {
    it('should unpublish a project', async () => {
      vi.mocked(getProjectById).mockResolvedValue(mockProjectWithPages as never);
      vi.mocked(prisma.project.update).mockResolvedValue({
        id: 'proj_1',
        status: 'draft',
        slug: 'test-project',
        publishedAt: now,
      } as never);

      const result = await unpublishProject('proj_1', 'user_1');

      expect(result.id).toBe('proj_1');
      expect(result.status).toBe('draft');
      expect(result.publishedUrl).toBeNull();
      expect(cacheDelete).toHaveBeenCalled();
    });

    it('should keep publishedAt as historical record', async () => {
      vi.mocked(getProjectById).mockResolvedValue(mockProjectWithPages as never);
      vi.mocked(prisma.project.update).mockResolvedValue({
        id: 'proj_1',
        status: 'draft',
        slug: 'test-project',
        publishedAt: now,
      } as never);

      const result = await unpublishProject('proj_1', 'user_1');

      expect(result.publishedAt).toEqual(now);
    });
  });
});
