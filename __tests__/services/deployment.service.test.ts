// =============================================================================
// Deployment Service Tests
// =============================================================================
// Unit tests for the deployment orchestrator. Mocks Prisma and platform
// services to test the deployment lifecycle without real API calls.
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mocks ─────────────────────────────────────────────────────────────

// Mock Prisma
vi.mock('@/lib/prisma/client', () => ({
  default: {
    deployment: {
      create: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    notification: {
      create: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
    // Idempotent Clerk→DB resolution for ownership checks.
    user: {
      findUnique: vi.fn(async ({ where: { clerkId } }: { where: { clerkId: string } }) => ({
        id: clerkId,
      })),
    },
  },
}));

// Mock project service
vi.mock('@/features/projects/services/project.service', () => ({
  getProjectById: vi.fn(),
}));

// Mock export service
vi.mock('@/features/export/services/export.service', () => ({
  generateExport: vi.fn(),
}));

// Mock cache
vi.mock('@/lib/redis/cache', () => ({
  cacheDelete: vi.fn(),
  cacheKeys: {
    project: (id: string) => `project:${id}`,
    projectBySlug: (slug: string) => `project:slug:${slug}`,
    deployment: (id: string) => `deployment:${id}`,
  },
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock Vercel service
const mockDeployToVercel = vi.fn();
const mockIsVercelConfigured = vi.fn();
vi.mock('@/features/deployment/services/vercel.service', () => ({
  deployToVercel: (...args: unknown[]) => mockDeployToVercel(...args),
  isVercelConfigured: (...args: unknown[]) => mockIsVercelConfigured(...args),
}));

// Mock Netlify service
const mockDeployToNetlify = vi.fn();
const mockIsNetlifyConfigured = vi.fn();
vi.mock('@/features/deployment/services/netlify.service', () => ({
  deployToNetlify: (...args: unknown[]) => mockDeployToNetlify(...args),
  isNetlifyConfigured: (...args: unknown[]) => mockIsNetlifyConfigured(...args),
}));

// ─── Imports (after mocks) ─────────────────────────────────────────────

import { deployProject, getDeploymentStatus, getProjectDeployments } from '@/features/deployment/services/deployment.service';
import prisma from '@/lib/prisma/client';
import { getProjectById } from '@/features/projects/services/project.service';
import { generateExport } from '@/features/export/services/export.service';
import { cacheDelete } from '@/lib/redis/cache';

// ─── Test Data ─────────────────────────────────────────────────────────

const MOCK_USER_ID = 'user_123';
const MOCK_PROJECT_ID = 'proj_456';
const MOCK_DEPLOYMENT_ID = 'dep_789';

const mockProject = {
  id: MOCK_PROJECT_ID,
  name: 'Test Project',
  slug: 'test-project',
  ownerId: MOCK_USER_ID,
  pages: [],
  globalStyles: {},
  seo: {},
  settings: {},
};

const mockExportFiles = [
  { path: 'index.html', content: '<html></html>', size: 14, type: 'html' as const },
  { path: 'styles.css', content: 'body {}', size: 7, type: 'css' as const },
];

const mockDeploymentRecord = {
  id: MOCK_DEPLOYMENT_ID,
  projectId: MOCK_PROJECT_ID,
  userId: MOCK_USER_ID,
  platform: 'vercel',
  status: 'building',
  url: null,
  customDomain: null,
  config: {},
  buildLog: [],
  deployedAt: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  project: { ownerId: MOCK_USER_ID },
};

// ─── Tests ─────────────────────────────────────────────────────────────

describe('DeploymentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('deployProject', () => {
    it('should deploy to Vercel successfully', async () => {
      // Arrange
      vi.mocked(getProjectById).mockResolvedValue(mockProject as never);
      vi.mocked(generateExport).mockResolvedValue(mockExportFiles);
      vi.mocked(prisma.deployment.create).mockResolvedValue(mockDeploymentRecord as never);
      mockIsVercelConfigured.mockReturnValue(true);
      mockDeployToVercel.mockResolvedValue({
        deploymentId: 'vercel_dep_123',
        url: 'https://test-project.vercel.app',
        status: 'deployed',
        buildLog: ['Deployed successfully'],
      });
      vi.mocked(prisma.deployment.update).mockResolvedValue({
        ...mockDeploymentRecord,
        status: 'deployed',
        url: 'https://test-project.vercel.app',
        deployedAt: new Date(),
      } as never);

      // Act
      const result = await deployProject({
        projectId: MOCK_PROJECT_ID,
        platform: 'vercel',
        userId: MOCK_USER_ID,
      });

      // Assert
      expect(result.status).toBe('deployed');
      expect(result.url).toBe('https://test-project.vercel.app');
      expect(result.platform).toBe('vercel');
      expect(mockDeployToVercel).toHaveBeenCalledOnce();
      expect(prisma.deployment.create).toHaveBeenCalledOnce();
      expect(prisma.deployment.update).toHaveBeenCalledOnce();
    });

    it('should deploy to Netlify successfully', async () => {
      // Arrange
      vi.mocked(getProjectById).mockResolvedValue(mockProject as never);
      vi.mocked(generateExport).mockResolvedValue(mockExportFiles);
      vi.mocked(prisma.deployment.create).mockResolvedValue(mockDeploymentRecord as never);
      mockIsNetlifyConfigured.mockReturnValue(true);
      mockDeployToNetlify.mockResolvedValue({
        deploymentId: 'netlify_dep_123',
        url: 'https://test-project.netlify.app',
        status: 'deployed',
        buildLog: ['Deployed successfully'],
      });
      vi.mocked(prisma.deployment.update).mockResolvedValue({
        ...mockDeploymentRecord,
        status: 'deployed',
        url: 'https://test-project.netlify.app',
        deployedAt: new Date(),
      } as never);

      // Act
      const result = await deployProject({
        projectId: MOCK_PROJECT_ID,
        platform: 'netlify',
        userId: MOCK_USER_ID,
      });

      // Assert
      expect(result.status).toBe('deployed');
      expect(result.url).toBe('https://test-project.netlify.app');
      expect(result.platform).toBe('netlify');
      expect(mockDeployToNetlify).toHaveBeenCalledOnce();
    });

    it('should return failure for unsupported platform', async () => {
      // Arrange
      vi.mocked(getProjectById).mockResolvedValue(mockProject as never);
      vi.mocked(generateExport).mockResolvedValue(mockExportFiles);
      vi.mocked(prisma.deployment.create).mockResolvedValue(mockDeploymentRecord as never);
      vi.mocked(prisma.deployment.update).mockResolvedValue({
        ...mockDeploymentRecord,
        status: 'failed',
      } as never);

      // Act
      const result = await deployProject({
        projectId: MOCK_PROJECT_ID,
        platform: 'docker' as never,
        userId: MOCK_USER_ID,
      });

      // Assert
      expect(result.status).toBe('failed');
      expect(result.buildLog.some((line) => line.includes('not yet supported'))).toBe(true);
    });

    it('should handle Vercel deployment failure gracefully', async () => {
      // Arrange
      vi.mocked(getProjectById).mockResolvedValue(mockProject as never);
      vi.mocked(generateExport).mockResolvedValue(mockExportFiles);
      vi.mocked(prisma.deployment.create).mockResolvedValue(mockDeploymentRecord as never);
      mockIsVercelConfigured.mockReturnValue(true);
      mockDeployToVercel.mockResolvedValue({
        deploymentId: '',
        url: '',
        status: 'failed',
        buildLog: ['Build failed'],
      });
      vi.mocked(prisma.deployment.update).mockResolvedValue({
        ...mockDeploymentRecord,
        status: 'failed',
      } as never);

      // Act
      const result = await deployProject({
        projectId: MOCK_PROJECT_ID,
        platform: 'vercel',
        userId: MOCK_USER_ID,
      });

      // Assert
      expect(result.status).toBe('failed');
      expect(cacheDelete).not.toHaveBeenCalled();
    });

    it('should handle platform API exception gracefully', async () => {
      // Arrange
      vi.mocked(getProjectById).mockResolvedValue(mockProject as never);
      vi.mocked(generateExport).mockResolvedValue(mockExportFiles);
      vi.mocked(prisma.deployment.create).mockResolvedValue(mockDeploymentRecord as never);
      mockIsVercelConfigured.mockReturnValue(true);
      mockDeployToVercel.mockRejectedValue(new Error('Network error'));
      vi.mocked(prisma.deployment.update).mockResolvedValue({
        ...mockDeploymentRecord,
        status: 'failed',
      } as never);

      // Act
      const result = await deployProject({
        projectId: MOCK_PROJECT_ID,
        platform: 'vercel',
        userId: MOCK_USER_ID,
      });

      // Assert
      expect(result.status).toBe('failed');
      expect(result.buildLog.some((line) => line.includes('Network error'))).toBe(true);
    });

    it('should throw when project is not found', async () => {
      // Arrange
      vi.mocked(getProjectById).mockResolvedValue(null as never);

      // Act & Assert
      await expect(
        deployProject({
          projectId: MOCK_PROJECT_ID,
          platform: 'vercel',
          userId: MOCK_USER_ID,
        })
      ).rejects.toThrow('Project not found or access denied');
    });

    it('should return failure when Vercel token is not configured', async () => {
      // Arrange
      vi.mocked(getProjectById).mockResolvedValue(mockProject as never);
      vi.mocked(generateExport).mockResolvedValue(mockExportFiles);
      vi.mocked(prisma.deployment.create).mockResolvedValue(mockDeploymentRecord as never);
      mockIsVercelConfigured.mockReturnValue(false);
      vi.mocked(prisma.deployment.update).mockResolvedValue({
        ...mockDeploymentRecord,
        status: 'failed',
      } as never);

      // Act
      const result = await deployProject({
        projectId: MOCK_PROJECT_ID,
        platform: 'vercel',
        userId: MOCK_USER_ID,
      });

      // Assert
      expect(result.status).toBe('failed');
      expect(result.buildLog.some((line) => line.includes('not configured'))).toBe(true);
    });

    it('should return failure when Netlify token is not configured', async () => {
      // Arrange
      vi.mocked(getProjectById).mockResolvedValue(mockProject as never);
      vi.mocked(generateExport).mockResolvedValue(mockExportFiles);
      vi.mocked(prisma.deployment.create).mockResolvedValue(mockDeploymentRecord as never);
      mockIsNetlifyConfigured.mockReturnValue(false);
      vi.mocked(prisma.deployment.update).mockResolvedValue({
        ...mockDeploymentRecord,
        status: 'failed',
      } as never);

      // Act
      const result = await deployProject({
        projectId: MOCK_PROJECT_ID,
        platform: 'netlify',
        userId: MOCK_USER_ID,
      });

      // Assert
      expect(result.status).toBe('failed');
      expect(result.buildLog.some((line) => line.includes('not configured'))).toBe(true);
    });
  });

  describe('getDeploymentStatus', () => {
    it('should return deployment status for authorized user', async () => {
      // Arrange
      vi.mocked(prisma.deployment.findUnique).mockResolvedValue(mockDeploymentRecord as never);

      // Act
      const result = await getDeploymentStatus(MOCK_DEPLOYMENT_ID, MOCK_USER_ID);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.id).toBe(MOCK_DEPLOYMENT_ID);
      expect(result?.platform).toBe('vercel');
    });

    it('should return null for unauthorized user', async () => {
      // Arrange
      vi.mocked(prisma.deployment.findUnique).mockResolvedValue({
        ...mockDeploymentRecord,
        project: { ownerId: 'other_user' },
      } as never);

      // Act
      const result = await getDeploymentStatus(MOCK_DEPLOYMENT_ID, MOCK_USER_ID);

      // Assert
      expect(result).toBeNull();
    });

    it('should return null for non-existent deployment', async () => {
      // Arrange
      vi.mocked(prisma.deployment.findUnique).mockResolvedValue(null);

      // Act
      const result = await getDeploymentStatus('nonexistent', MOCK_USER_ID);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('getProjectDeployments', () => {
    it('should return deployments for authorized project', async () => {
      // Arrange
      vi.mocked(getProjectById).mockResolvedValue(mockProject as never);
      vi.mocked(prisma.deployment.findMany).mockResolvedValue([
        mockDeploymentRecord,
        { ...mockDeploymentRecord, id: 'dep_2', status: 'deployed' },
      ] as never);

      // Act
      const result = await getProjectDeployments(MOCK_PROJECT_ID, MOCK_USER_ID);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(MOCK_DEPLOYMENT_ID);
    });

    it('should return empty array for unauthorized project', async () => {
      // Arrange
      vi.mocked(getProjectById).mockResolvedValue(null as never);

      // Act
      const result = await getProjectDeployments(MOCK_PROJECT_ID, 'other_user');

      // Assert
      expect(result).toEqual([]);
    });
  });
});
