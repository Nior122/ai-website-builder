// =============================================================================
// GET /api/admin/audit
// =============================================================================
// Paginated audit log query. Requires auth. Supports filtering by userId,
// resource, resourceId, action, and date range. Returns audit entries
// ordered by most recent first.
// =============================================================================

import type { NextRequest } from 'next/server';
import { getAuditLogs } from '@/features/admin/services/audit.service';
import { okPaginated } from '@/lib/api-response';
import { withRateLimit } from '@/lib/middleware/rate-limit';
import { withRequestLogging } from '@/lib/middleware/request-logger';

export const GET = withRequestLogging(
  withRateLimit(
    async (request: NextRequest) => {
      const { searchParams } = new URL(request.url);

      const page = parseInt(searchParams.get('page') ?? '1', 10);
      const limit = parseInt(searchParams.get('limit') ?? '20', 10);
      const userId = searchParams.get('userId') ?? undefined;
      const resource = searchParams.get('resource') ?? undefined;
      const resourceId = searchParams.get('resourceId') ?? undefined;
      const action = searchParams.get('action') ?? undefined;
      const startDate = searchParams.get('startDate') ?? undefined;
      const endDate = searchParams.get('endDate') ?? undefined;

      const result = await getAuditLogs({
        userId,
        resource,
        resourceId,
        action,
        startDate,
        endDate,
        page,
        limit,
      });

      return okPaginated(result.logs, result.totalCount, result.page, result.limit);
    },
    { tier: 'enterprise' }
  )
);
