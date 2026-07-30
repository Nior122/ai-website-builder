// =============================================================================
// GET /api/auth/me
// =============================================================================
// Returns the current authenticated user's profile.
// =============================================================================

import type { NextRequest } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { ok, unauthorized, internalError } from '@/lib/api-response';
import { withRateLimit } from '@/lib/middleware/rate-limit';
import { withRequestLogging } from '@/lib/middleware/request-logger';

export const GET = withRequestLogging(
  withRateLimit(
    async (_request: NextRequest) => {
      try {
        const { userId } = await auth();
        if (!userId) return unauthorized();

        const user = await currentUser();
        if (!user) return unauthorized();

        return ok({
          id: user.id,
          email: user.emailAddresses[0]?.emailAddress || '',
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: [user.firstName, user.lastName].filter(Boolean).join(' ') || 'User',
          avatar: user.imageUrl,
          createdAt: user.createdAt,
        });
      } catch (error) {
        return internalError('Failed to fetch user');
      }
    },
    { tier: 'free' }
  )
);
