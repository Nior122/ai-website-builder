// =============================================================================
// GET/PATCH/DELETE /api/organizations/[orgId]/members
// =============================================================================
// List, update role, or remove members from an organization.
// =============================================================================

import type { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ok, unauthorized, errorResponse } from '@/lib/api-response';
import { withValidation } from '@/lib/middleware/validate';
import { withRateLimit } from '@/lib/middleware/rate-limit';
import { withRequestLogging } from '@/lib/middleware/request-logger';
import {
  listMembers,
  updateMemberRole,
  removeMember,
} from '@/features/collaboration/services/collaboration.service';
import { z } from 'zod';

const updateRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(['admin', 'member', 'viewer']),
});

const removeMemberSchema = z.object({
  userId: z.string().min(1),
});

// ─── GET ────────────────────────────────────────────────────────────────

const GETHandler = async (
  _request: NextRequest,
  { params }: { params: Promise<Record<string, string>> }
) => {
  try {
    const { userId } = await auth();
    if (!userId) return unauthorized();

    const { orgId } = await params;
    const members = await listMembers(orgId, userId);
    return ok(members);
  } catch (error) {
    return errorResponse(error instanceof Error ? error : new Error(String(error)));
  }
};

// ─── PATCH (update role) ────────────────────────────────────────────────

const PATCHHandler = withValidation(
  async (request, { body, params }) => {
    try {
      const { userId } = await auth();
      if (!userId) return unauthorized();

      const typedBody = body as { userId: string; role: string };
      const membership = await updateMemberRole(
        params.orgId,
        typedBody.userId,
        typedBody.role,
        userId
      );
      return ok(membership);
    } catch (error) {
      return errorResponse(error instanceof Error ? error : new Error(String(error)));
    }
  },
  { body: updateRoleSchema }
);

// ─── DELETE (remove member) ─────────────────────────────────────────────

const DELETEHandler = withValidation(
  async (request, { body, params }) => {
    try {
      const { userId } = await auth();
      if (!userId) return unauthorized();

      const typedBody = body as { userId: string };
      await removeMember(params.orgId, typedBody.userId, userId);
      return ok({ removed: true });
    } catch (error) {
      return errorResponse(error instanceof Error ? error : new Error(String(error)));
    }
  },
  { body: removeMemberSchema }
);

const GET = withRequestLogging(withRateLimit(GETHandler, { tier: 'free' }));
const PATCH = withRequestLogging(withRateLimit(PATCHHandler, { tier: 'free' }));
const DELETE = withRequestLogging(withRateLimit(DELETEHandler, { tier: 'free' }));

export { GET, PATCH, DELETE };
