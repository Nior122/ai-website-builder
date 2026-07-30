// =============================================================================
// Project Service Tests
// =============================================================================
// Unit tests for project CRUD operations.
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mocks ─────────────────────────────────────────────────────────────

vi.mock('@/lib/prisma/client', () => ({
  default: {
    project: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn().mockResolvedValue(null),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    // Idempotent Clerk→DB resolution: a user_* clerkId maps back to itself,
    // matching the test data's assumption that MOCK_USER_ID is the ownerId.
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

vi.mock('@/features/admin/services/audit.service', () => ({
  logAuditEntry: vi.fn(),
}));

vi.mock('@/lib/redis/cache', () => ({
  cacheGet: vi.fn(),
  cacheSet: vi.fn(),
  cacheDelete: vi.fn(),
  cacheKeys: {
    project: (id: string) => `project:${id}`,
    projectBySlug: (slug: string) => `project:slug:${slug}`,
  },
}));

// ─── Imports ───────────────────────────────────────────────────────────

import {
  getProjectById,
  listProjects,
  createProject,
  updateProject,
  deleteProject,
  duplicateProject,
} from '@/features/projects/services/project.service';
import prisma from '@/lib/prisma/client';
import { cacheGet, cacheSet, cacheDelete } from '@/lib/redis/cache';
import { NotFoundError, ForbiddenError } from '@/lib/errors';

// ─── Test Data ─────────────────────────────────────────────────────────

const MOCK_USER_ID = 'user_123';
const MOCK_PROJECT_ID = 'proj_456';

const mockProject = {
  id: MOCK_PROJECT_ID,
  name: 'Test Project',
  slug: 'test-project',
  description: 'A test project',
  industry: 'Technology',
  businessType: 'SaaS',
  ownerId: MOCK_USER_ID,
  status: 'draft',
  settings: {},
  globalStyles: {},
  seo: {},
  createdAt: new Date(),
  updatedAt: new Date(),
  pages: [],
};

// ─── Tests ─────────────────────────────────────────────────────────────

describe('ProjectService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getProjectById', () => {
    it('should return cached project if available', async () => {
      vi.mocked(cacheGet).mockResolvedValue(mockProject as never);

      const result = await getProjectById(MOCK_PROJECT_ID, MOCK_USER_ID);

      expect(result).toEqual(mockProject);
      expect(prisma.project.findUnique).not.toHaveBeenCalled();
    });

    it('should fetch from database on cache miss', async () => {
      vi.mocked(cacheGet).mockResolvedValue(null);
      vi.mocked(prisma.project.findUnique).mockResolvedValue({
        ...mockProject,
        pages: [],
      } as never);

      const result = await getProjectById(MOCK_PROJECT_ID, MOCK_USER_ID);

      expect(result.id).toBe(MOCK_PROJECT_ID);
      expect(cacheSet).toHaveBeenCalled();
    });

    it('should throw NotFoundError for non-existent project', async () => {
      vi.mocked(cacheGet).mockResolvedValue(null);
      vi.mocked(prisma.project.findUnique).mockResolvedValue(null);

      await expect(
        getProjectById('nonexistent', MOCK_USER_ID)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ForbiddenError for non-owner', async () => {
      vi.mocked(cacheGet).mockResolvedValue(null);
      vi.mocked(prisma.project.findUnique).mockResolvedValue({
        ...mockProject,
        ownerId: 'other_user',
      } as never);

      await expect(
        getProjectById(MOCK_PROJECT_ID, MOCK_USER_ID)
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('listProjects', () => {
    it('should list projects for user', async () => {
      vi.mocked(prisma.project.findMany).mockResolvedValue([
        mockProject,
      ] as never);

      const result = await listProjects(MOCK_USER_ID);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(MOCK_PROJECT_ID);
    });

    it('should return empty array when no projects', async () => {
      vi.mocked(prisma.project.findMany).mockResolvedValue([]);

      const result = await listProjects(MOCK_USER_ID);

      expect(result).toEqual([]);
    });
  });

  describe('createProject', () => {
    it('should create project successfully', async () => {
      vi.mocked(prisma.project.create).mockResolvedValue(mockProject as never);

      const result = await createProject({
        name: 'Test Project',
        description: 'A test project',
        industry: 'Technology',
        businessType: 'SaaS',
        ownerId: MOCK_USER_ID,
      });

      expect(result.id).toBe(MOCK_PROJECT_ID);
      expect(result.name).toBe('Test Project');
      expect(prisma.project.create).toHaveBeenCalledOnce();
    });

    it('should generate slug from name', async () => {
      vi.mocked(prisma.project.create).mockResolvedValue(mockProject as never);

      await createProject({
        name: 'My Awesome Project!',
        industry: 'Technology',
        businessType: 'SaaS',
        ownerId: MOCK_USER_ID,
      });

      expect(prisma.project.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            slug: 'my-awesome-project',
          }),
        })
      );
    });
  });

  describe('updateProject', () => {
    it('should update project successfully', async () => {
      vi.mocked(cacheGet).mockResolvedValue(mockProject as never);
      vi.mocked(prisma.project.update).mockResolvedValue({
        ...mockProject,
        name: 'Updated Name',
      } as never);

      const result = await updateProject(MOCK_PROJECT_ID, MOCK_USER_ID, {
        name: 'Updated Name',
      });

      expect(result.name).toBe('Updated Name');
      expect(cacheDelete).toHaveBeenCalled();
    });

    it('should throw NotFoundError for non-existent project', async () => {
      vi.mocked(cacheGet).mockResolvedValue(null);
      vi.mocked(prisma.project.findUnique).mockResolvedValue(null);

      await expect(
        updateProject('nonexistent', MOCK_USER_ID, { name: 'Updated' })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteProject', () => {
    it('should delete project successfully', async () => {
      vi.mocked(cacheGet).mockResolvedValue(mockProject as never);
      vi.mocked(prisma.project.delete).mockResolvedValue({} as never);

      await deleteProject(MOCK_PROJECT_ID, MOCK_USER_ID);

      expect(prisma.project.delete).toHaveBeenCalledOnce();
      expect(cacheDelete).toHaveBeenCalled();
    });

    it('should throw ForbiddenError for non-owner', async () => {
      vi.mocked(cacheGet).mockResolvedValue(null);
      vi.mocked(prisma.project.findUnique).mockResolvedValue({
        ...mockProject,
        ownerId: 'other_user',
      } as never);

      await expect(
        deleteProject(MOCK_PROJECT_ID, MOCK_USER_ID)
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('duplicateProject', () => {
    it('should duplicate project with copy suffix', async () => {
      vi.mocked(cacheGet).mockResolvedValue(mockProject as never);
      vi.mocked(prisma.project.create).mockResolvedValue({
        ...mockProject,
        id: 'proj_789',
        name: 'Test Project (Copy)',
        slug: 'test-project-copy',
      } as never);

      const result = await duplicateProject(MOCK_PROJECT_ID, MOCK_USER_ID);

      expect(result.id).toBe('proj_789');
      expect(result.name).toBe('Test Project (Copy)');
    });
  });
});
