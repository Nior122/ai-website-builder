// =============================================================================
// GET /api/projects/[id]/seo
// =============================================================================
// Run an SEO audit on a project and return the result.
// The audit runs in-memory over the JSON project structure (no headless browser).
// =============================================================================

import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getProjectById } from '@/features/projects/services/project.service';
import { auditSEO, generateMetaTags, generateSitemap } from '@/features/seo/services/seo.service';
import { ok, errorResponse, unauthorized, notFound } from '@/lib/api-response';
import { withRateLimit } from '@/lib/middleware/rate-limit';
import { withRequestLogging } from '@/lib/middleware/request-logger';

export const GET = withRequestLogging(
  withRateLimit(
    async (
      request: NextRequest,
      { params }: { params: Promise<{ id: string }> }
    ) => {
      try {
        const { userId } = await auth();
        if (!userId) return unauthorized();

        const { id } = await params;
        const project = await getProjectById(id, userId);
        if (!project) return notFound('Project');

        const auditResult = auditSEO(project as never);
        const sitemap = generateSitemap(project as never);
        // Generate meta tags for each page for convenience
        const metaTags = project.pages.map((p) => ({
          page: p.slug,
          ...generateMetaTags(p),
        }));

        return ok({
          audit: auditResult,
          sitemap,
          metaTags,
        });
      } catch (error) {
        return errorResponse(error instanceof Error ? error : new Error(String(error)));
      }
    },
    { tier: 'free' }
  )
);
