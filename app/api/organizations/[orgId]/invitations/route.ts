// =============================================================================
// GET/POST/DELETE /api/organizations/[orgId]/invitations
// =============================================================================
// List, create, and revoke organization invitations.
// =============================================================================

import type { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ok, unauthorized, errorResponse } from '@/lib/api-response';
import { withValidation } from '@/lib/middleware/validate';
import { withRateLimit } from '@/lib/middleware/rate-limit';
import { withRequestLogging } from '@/lib/middleware/request-logger';
import {
  listInvitations,
  createInvitation,
  revokeInvitation,
} from '@/features/collaboration/services/collaboration.service';
import { z } from 'zod';

const createInvitationSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'member', 'viewer']).default('member'),
});

const revokeInvitationSchema = z.object({
  invitationId: z.string().min(1),
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
    const invitations = await listInvitations(orgId, userId);
    return ok(invitations);
  } catch (error) {
    return errorResponse(error instanceof Error ? error : new Error(String(error)));
  }
};

// ─── POST ───────────────────────────────────────────────────────────────

const POSTHandler = withValidation(
  async (request, { body, params }) => {
    try {
      const { userId } = await auth();
      if (!userId) return unauthorized();

      const typedBody = body as { email: string; role: string };
      const invitation = await createInvitation({
        organizationId: params.orgId,
        email: typedBody.email,
        role: typedBody.role,
        invitedBy: userId,
      });

      return ok(invitation, 201);
    } catch (error) {
      return errorResponse(error instanceof Error ? error : new Error(String(error)));
    }
  },
  { body: createInvitationSchema }
);

// ─── DELETE ─────────────────────────────────────────────────────────────

const DELETEHandler = withValidation(
  async (request, { body }) => {
    try {
      const { userId } = await auth();
      if (!userId) return unauthorized();

      const typedBody = body as { invitationId: string };
      await revokeInvitation(typedBody.invitationId, userId);
      return ok({ revoked: true });
    } catch (error) {
      return errorResponse(error instanceof Error ? error : new Error(String(error)));
    }
  },
  { body: revokeInvitationSchema }
);

const GET = withRequestLogging(withRateLimit(GETHandler, { tier: 'free' }));
const POST = withRequestLogging(withRateLimit(POSTHandler, { tier: 'free' }));
const DELETE = withRequestLogging(withRateLimit(DELETEHandler, { tier: 'free' }));

export { GET, POST, DELETE };
