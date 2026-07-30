// =============================================================================
// GET /api/templates
// =============================================================================
// List available website templates.
// =============================================================================

import { type NextRequest, NextResponse } from 'next/server';
import { ok, errorResponse } from '@/lib/api-response';
import { TEMPLATE_DATA } from '@/features/templates/data/template-data';
import { withRateLimit } from '@/lib/middleware/rate-limit';
import { withRequestLogging } from '@/lib/middleware/request-logger';

export const GET = withRequestLogging(
  withRateLimit(
    async (request: NextRequest) => {
      try {
        const { searchParams } = new URL(request.url);
        const industry = searchParams.get('industry');
        const search = searchParams.get('search');
        const featured = searchParams.get('featured') === 'true';

        let templates = [...TEMPLATE_DATA];

        if (industry) {
          templates = templates.filter((t) => t.industry === industry);
        }

        if (search) {
          const q = search.toLowerCase();
          templates = templates.filter(
            (t) =>
              t.name.toLowerCase().includes(q) ||
              t.description.toLowerCase().includes(q) ||
              t.tags.some((tag) => tag.toLowerCase().includes(q))
          );
        }

        if (featured) {
          templates = templates.filter((t) => t.featured);
        }

        return ok(templates);
      } catch (error) {
        return errorResponse(error instanceof Error ? error : new Error(String(error)));
      }
    },
    { tier: 'anonymous' }
  )
);
