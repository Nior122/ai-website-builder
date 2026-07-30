// =============================================================================
// POST /api/storage/upload
// =============================================================================
// Generate a presigned upload URL for client-side file uploads to S3/R2.
// =============================================================================

import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { getPresignedUploadUrl, projectAssetKey } from '@/lib/s3/client';
import { ok, errorResponse, unauthorized, badRequest } from '@/lib/api-response';
import { ValidationError } from '@/lib/errors';
import { UPLOAD_LIMITS } from '@/lib/constants';
import { withRateLimit } from '@/lib/middleware/rate-limit';
import { withRequestLogging } from '@/lib/middleware/request-logger';

const uploadSchema = z.object({
  projectId: z.string(),
  filename: z.string().min(1).max(255),
  contentType: z.string(),
  type: z.enum(['images', 'exports', 'uploads']).default('uploads'),
});

export const POST = withRequestLogging(
  withRateLimit(
    async (request: NextRequest) => {
      try {
        const { userId } = await auth();
        if (!userId) return unauthorized();

        const body = await request.json();
        const { projectId, filename, contentType, type } = uploadSchema.parse(body);

        // Validate file type
        const allowedTypes = UPLOAD_LIMITS.image.allowedTypes;
        if (!(allowedTypes as readonly string[]).includes(contentType)) {
          return badRequest(
            `File type ${contentType} is not allowed. Allowed types: ${allowedTypes.join(', ')}`
          );
        }

        const key = projectAssetKey(projectId, `${Date.now()}-${filename}`, type);
        const uploadUrl = await getPresignedUploadUrl(key, contentType, 3600);

        return ok({
          uploadUrl,
          key,
          expiresIn: 3600,
        });
      } catch (err) {
        if (err instanceof z.ZodError) {
          return errorResponse(ValidationError.fromZodError(err));
        }
        return errorResponse(err instanceof Error ? err : new Error(String(err)));
      }
    },
    { tier: 'free' }
  )
);
