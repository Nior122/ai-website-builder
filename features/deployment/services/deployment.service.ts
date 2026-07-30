// =============================================================================
// Deployment Service (Orchestrator)
// =============================================================================
// Central orchestration layer for project deployments. Coordinates:
//   1. Project ownership verification
//   2. Export generation (JSON → platform-specific files)
//   3. Platform-specific deployment (Vercel, Netlify, etc.)
//   4. Deployment record creation and updates in the database
//   5. Cache invalidation after deployment
//
// This service is called by the POST /api/deploy route. It encapsulates
// the full deployment lifecycle so the API route stays thin.
// =============================================================================

import prisma from '@/lib/prisma/client';
import { getProjectById } from '@/features/projects/services/project.service';
import { generateExport } from '@/features/export/services/export.service';
import { cacheDelete, cacheKeys } from '@/lib/redis/cache';
import { logger } from '@/lib/logger';
import { deployToVercel, isVercelConfigured } from './vercel.service';
import { deployToNetlify, isNetlifyConfigured } from './netlify.service';
import { createNotification } from '@/features/notifications/services/notification.service';
import { logAuditEntry } from '@/features/admin/services/audit.service';
import type { ExportFile } from '@/features/export/types';
import type { DeploymentStatus } from '../types';

// ─── Types ─────────────────────────────────────────────────────────────

export interface DeployOptions {
  projectId: string;
  platform: 'vercel' | 'netlify' | 'cloudflare' | 'github' | 'docker';
  userId: string;
  customDomain?: string;
  branch?: string;
  environment?: 'production' | 'staging' | 'development';
  envVars?: Record<string, string>;
}

export interface DeployResult {
  deploymentId: string;
  platform: string;
  status: DeploymentStatus;
  url: string | null;
  buildLog: string[];
  deployedAt: string | null;
  createdAt: string;
}

// ─── Platform → Export Format Mapping ───────────────────────────────────

const PLATFORM_EXPORT_FORMAT: Record<string, 'nextjs' | 'html'> = {
  vercel: 'nextjs',
  netlify: 'html',
  cloudflare: 'nextjs',
  github: 'nextjs',
  docker: 'nextjs',
};

// ─── Main Deploy Function ──────────────────────────────────────────────

/**
 * Deploy a project to the specified hosting platform.
 *
 * Flow:
 *   1. Verify project ownership via getProjectById (throws if not found)
 *   2. Generate export files (JSON → platform-specific code)
 *   3. Create a Deployment record with status 'building'
 *   4. Call the platform-specific deploy function
 *   5. Update the Deployment record with the result
 *   6. Invalidate relevant caches
 */
export async function deployProject(
  options: DeployOptions
): Promise<DeployResult> {
  const { projectId, platform, userId, customDomain } = options;

  // Step 1: Verify ownership + fetch project data
  const project = await getProjectById(projectId, userId);
  if (!project) {
    throw new Error('Project not found or access denied');
  }

  // Step 2: Generate export files
  const exportFormat = PLATFORM_EXPORT_FORMAT[platform] ?? 'html';
  const files = await generateExport(project as never, exportFormat as 'html');

  logger.info(
    `[Deployment] Generated ${files.length} files for project "${project.slug}" (${exportFormat})`
  );

  // Step 3: Create Deployment record
  const deployment = await prisma.deployment.create({
    data: {
      projectId,
      userId,
      platform,
      status: 'building',
      url: null,
      customDomain: customDomain ?? null,
      config: {
        platform,
        branch: options.branch,
        environment: options.environment,
        customDomain,
      },
      buildLog: [],
    },
  });

  logger.info(`[Deployment] Created record ${deployment.id} for platform "${platform}"`);

  // Step 4: Deploy to platform
  let deployResult: { url: string; status: DeploymentStatus; buildLog: string[] };

  try {
    switch (platform) {
      case 'vercel':
        deployResult = await deployToPlatformVercel(project.slug, files, customDomain);
        break;
      case 'netlify':
        deployResult = await deployToPlatformNetlify(project.slug, files, customDomain);
        break;
      default:
        // Unsupported platforms return a clear failure
        deployResult = {
          url: '',
          status: 'failed',
          buildLog: [
            `[${new Date().toISOString()}] Platform "${platform}" is not yet supported.`,
            `Supported platforms: vercel, netlify.`,
          ],
        };
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown deployment error';
    logger.error(`[Deployment] Platform deploy failed: ${msg}`);
    deployResult = {
      url: '',
      status: 'failed',
      buildLog: [`[${new Date().toISOString()}] Deployment failed: ${msg}`],
    };
  }

  // Step 5: Update Deployment record
  const updatedDeployment = await prisma.deployment.update({
    where: { id: deployment.id },
    data: {
      status: deployResult.status,
      url: deployResult.url || null,
      buildLog: deployResult.buildLog,
      deployedAt: deployResult.status === 'deployed' ? new Date() : null,
    },
  });

  // Step 6: Invalidate caches
  if (deployResult.status === 'deployed') {
    await Promise.all([
      cacheDelete(cacheKeys.project(projectId)),
      cacheDelete(cacheKeys.projectBySlug(project.slug)),
      cacheDelete(cacheKeys.deployment(deployment.id)),
    ]);
  }

  // Step 7: Notify user
  if (deployResult.status === 'deployed') {
    await createNotification({
      userId,
      type: 'deployment_complete',
      title: 'Deployment Complete',
      message: `Your project "${project.name}" is live on ${platform}.`,
      data: { deploymentId: deployment.id, url: deployResult.url, platform },
      actionUrl: deployResult.url || undefined,
    });

    // Audit log (fire-and-forget)
    await logAuditEntry({
      userId,
      action: 'deployment.complete',
      resource: 'deployment',
      resourceId: deployment.id,
      newValues: { platform, url: deployResult.url, projectId },
    });
  } else {
    await createNotification({
      userId,
      type: 'deployment_failed',
      title: 'Deployment Failed',
      message: `Deployment to ${platform} failed. Check the build log for details.`,
      data: { deploymentId: deployment.id, platform },
    });

    // Audit log (fire-and-forget)
    await logAuditEntry({
      userId,
      action: 'deployment.failed',
      resource: 'deployment',
      resourceId: deployment.id,
      newValues: { platform, projectId },
    });
  }

  logger.info(
    `[Deployment] Complete: ${deployResult.status} — URL: ${deployResult.url || 'none'}`
  );

  return {
    deploymentId: deployment.id,
    platform,
    status: deployResult.status,
    url: deployResult.url || null,
    buildLog: deployResult.buildLog,
    deployedAt: updatedDeployment.deployedAt?.toISOString() ?? null,
    createdAt: updatedDeployment.createdAt.toISOString(),
  };
}

// ─── Platform Adapters ─────────────────────────────────────────────────

async function deployToPlatformVercel(
  slug: string,
  files: ExportFile[],
  customDomain?: string
): Promise<{ url: string; status: DeploymentStatus; buildLog: string[] }> {
  if (!isVercelConfigured()) {
    return {
      url: '',
      status: 'failed',
      buildLog: [
        `[${new Date().toISOString()}] VERCEL_TOKEN is not configured.`,
        `Add VERCEL_TOKEN to your environment variables to enable Vercel deployment.`,
        `Generate a token at: https://vercel.com/account/tokens`,
      ],
    };
  }

  const result = await deployToVercel({
    projectName: slug,
    files,
    customDomain,
  });

  return {
    url: result.url,
    status: result.status === 'deployed' ? 'deployed' : 'failed',
    buildLog: result.buildLog,
  };
}

async function deployToPlatformNetlify(
  slug: string,
  files: ExportFile[],
  customDomain?: string
): Promise<{ url: string; status: DeploymentStatus; buildLog: string[] }> {
  if (!isNetlifyConfigured()) {
    return {
      url: '',
      status: 'failed',
      buildLog: [
        `[${new Date().toISOString()}] NETLIFY_AUTH_TOKEN is not configured.`,
        `Add NETLIFY_AUTH_TOKEN to your environment variables to enable Netlify deployment.`,
        `Generate a token at: https://app.netlify.com/user/applications#personal-access-tokens`,
      ],
    };
  }

  const result = await deployToNetlify({
    projectName: slug,
    files,
    customDomain,
  });

  return {
    url: result.url,
    status: result.status === 'deployed' ? 'deployed' : 'failed',
    buildLog: result.buildLog,
  };
}

// ─── Deployment Status Query ───────────────────────────────────────────

/**
 * Get deployment status for a specific deployment record.
 * Enforces ownership via the project's ownerId.
 */
export async function getDeploymentStatus(
  deploymentId: string,
  userId: string
): Promise<{
  id: string;
  platform: string;
  status: string;
  url: string | null;
  buildLog: string[];
  deployedAt: string | null;
  createdAt: string;
} | null> {
  const deployment = await prisma.deployment.findUnique({
    where: { id: deploymentId },
    include: {
      project: {
        select: { ownerId: true },
      },
    },
  });

  if (!deployment) return null;

  // Resolve Clerk userId → DB User.id for ownership check
  let dbUserId = userId;
  if (userId.startsWith('user_')) {
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });
    if (!dbUser) return null;
    dbUserId = dbUser.id;
  }

  if (deployment.project.ownerId !== dbUserId) {
    return null;
  }

  return {
    id: deployment.id,
    platform: deployment.platform,
    status: deployment.status,
    url: deployment.url,
    buildLog: (deployment.buildLog as string[]) ?? [],
    deployedAt: deployment.deployedAt?.toISOString() ?? null,
    createdAt: deployment.createdAt.toISOString(),
  };
}

/**
 * Get all deployments for a project, ordered by most recent first.
 */
export async function getProjectDeployments(
  projectId: string,
  userId: string
): Promise<Array<{
  id: string;
  platform: string;
  status: string;
  url: string | null;
  deployedAt: string | null;
  createdAt: string;
}>> {
  // Verify ownership
  const project = await getProjectById(projectId, userId);
  if (!project) return [];

  const deployments = await prisma.deployment.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
    take: 20, // last 20 deployments
  });

  return deployments.map((d) => ({
    id: d.id,
    platform: d.platform,
    status: d.status,
    url: d.url,
    deployedAt: d.deployedAt?.toISOString() ?? null,
    createdAt: d.createdAt.toISOString(),
  }));
}
