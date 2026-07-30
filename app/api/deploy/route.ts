// =============================================================================
// POST /api/deploy
// GET /api/deploy?projectId=...
// =============================================================================
// Deploy a project to a hosting platform, or query deployment history.
//
// POST: Creates a deployment record, generates export files, deploys to the
//       specified platform (Vercel/Netlify), and returns the result.
//
// GET:  Returns the last 20 deployments for a project (requires projectId
//       query param). Enforces ownership via the deployment service.
//
// The heavy lifting (export generation, platform API calls, record management)
// is handled by `deployProject()` and `getProjectDeployments()` in the
// deployment orchestrator service. This route stays thin: auth → parse → call.
// =============================================================================

import type { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { deployConfigSchema } from '@/lib/validations/project';
import {
  deployProject,
  getProjectDeployments,
} from '@/features/deployment/services/deployment.service';
import { ok, errorResponse, unauthorized, badRequest } from '@/lib/api-response';
import { withRateLimit } from '@/lib/middleware/rate-limit';
import { withRequestLogging } from '@/lib/middleware/request-logger';

// ─── GET — deployment history ──────────────────────────────────────────

export const GET = withRequestLogging(
  withRateLimit(
    async (request: NextRequest) => {
      try {
        const { userId } = await auth();
        if (!userId) return unauthorized();

        const projectId = request.nextUrl.searchParams.get('projectId');
        if (!projectId) {
          return badRequest('projectId query parameter is required');
        }

        const deployments = await getProjectDeployments(projectId, userId);
        return ok({ deployments });
      } catch (err) {
        return errorResponse(err instanceof Error ? err : new Error(String(err)));
      }
    },
    { tier: 'free' }
  )
);

// ─── POST — deploy project ─────────────────────────────────────────────

export const POST = withRequestLogging(
  withRateLimit(
    async (request: NextRequest) => {
      try {
        const { userId } = await auth();
        if (!userId) return unauthorized();

        const body = await request.json();
        const config = deployConfigSchema.parse(body);

        const result = await deployProject({
          projectId: config.projectId,
          platform: config.platform,
          userId,
          customDomain: config.customDomain,
          branch: config.branch,
          environment: config.environment,
          envVars: config.envVars,
        });

        return ok(result);
      } catch (err) {
        if (err instanceof z.ZodError) {
          return badRequest('Invalid deployment config');
        }
        return errorResponse(err instanceof Error ? err : new Error(String(err)));
      }
    },
    { tier: 'free' }
  )
);
