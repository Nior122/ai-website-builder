// =============================================================================
// GET /api/admin/users
// =============================================================================
// Paginated user management for the admin dashboard. Supports search by
// email or name. Returns user list with project counts and plan info.
// Requires admin role.
// =============================================================================

import type { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { requireAdmin } from '@/features/admin/services/auth.service';
import { getUsers } from '@/features/admin/services/admin.service';
import { okPaginated, errorResponse, forbidden } from '@/lib/api-response';
import { ForbiddenError } from '@/lib/errors';
import { withRateLimit } from '@/lib/middleware/rate-limit';
import { withRequestLogging } from '@/lib/middleware/request-logger';

export const GET = withRequestLogging(
  withRateLimit(
    async (request: NextRequest) => {
      try {
        const { userId } = await auth();
        if (!userId) return forbidden('Authentication required');

        await requireAdmin(userId);

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') ?? '1', 10);
        const limit = parseInt(searchParams.get('limit') ?? '20', 10);
        const search = searchParams.get('search') ?? undefined;

        const result = await getUsers({ page, limit, search });

        return okPaginated(
          result.users,
          result.totalCount,
          result.page,
          result.pageSize
        );
      } catch (err) {
        if (err instanceof ForbiddenError) {
          return forbidden(err.message);
        }
        return errorResponse(err as Error);
      }
    },
    { tier: 'enterprise' }
  )
);
