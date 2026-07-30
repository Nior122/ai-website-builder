// =============================================================================
// POST /api/projects/[id]/export
// =============================================================================
// Export a project in the specified format.
// =============================================================================

import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { getProjectById } from '@/features/projects/services/project.service';
import { generateExport } from '@/features/export/services/export.service';
import { exportConfigSchema } from '@/lib/validations/project';
import { ok, errorResponse, unauthorized, notFound } from '@/lib/api-response';
import { ValidationError } from '@/lib/errors';
import { withRateLimit } from '@/lib/middleware/rate-limit';
import { withRequestLogging } from '@/lib/middleware/request-logger';

export const POST = withRequestLogging(
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
        const body = await request.json();
        const config = exportConfigSchema.parse(body);

        const files = await generateExport(project as never, config.format);

        const totalSize = files.reduce((acc, f) => acc + f.content.length, 0);

        return ok({
          id: `exp_${Date.now()}`,
          format: config.format,
          files,
          fileSize: totalSize,
          createdAt: new Date().toISOString(),
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return errorResponse(ValidationError.fromZodError(error));
        }
        return errorResponse(error instanceof Error ? error : new Error(String(error)));
      }
    },
    { tier: 'free' }
  )
);
