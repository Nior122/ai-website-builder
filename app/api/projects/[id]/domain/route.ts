// =============================================================================
// POST /api/projects/[id]/domain
// DELETE /api/projects/[id]/domain
// =============================================================================
// Custom domain management for published projects.
//   POST: set a custom domain on the project (validates format, checks for
//         uniqueness, stores in `Project.customDomain`).
//   DELETE: remove the custom domain (set to null).
//
// Both routes enforce Clerk auth + ownership via `getProjectById`. The domain
// is validated client-side (DomainSettings) and server-side (regex) to prevent
// garbage data. No DNS verification is done at the API level — the user
// configures DNS externally; the middleware routes requests by hostname.
//
// Domain uniqueness is NOT enforced across projects in this phase (two projects
// could share a domain — the middleware picks the first match). This is flagged
// for later when multi-tenant domain management is needed.
// =============================================================================

import type { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma/client';
import { cacheDelete, cacheKeys } from '@/lib/redis/cache';
import { ok, errorResponse, unauthorized, badRequest, notFound } from '@/lib/api-response';
import { withRateLimit } from '@/lib/middleware/rate-limit';
import { withRequestLogging } from '@/lib/middleware/request-logger';

// ─── Domain Validation ─────────────────────────────────────────────────────

const DOMAIN_REGEX =
  /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.){1,}(?:[a-zA-Z]{2,})$/;

function isValidDomain(value: string): boolean {
  return DOMAIN_REGEX.test(value);
}

// ─── POST — set custom domain ──────────────────────────────────────────────

export const POST = withRequestLogging(
  withRateLimit(
    async (
      request: NextRequest,
      { params }: { params: Promise<{ id: string }> }
    ) => {
      try {
        const { userId } = await auth();
        if (!userId) return unauthorized();

        // Resolve Clerk userId → DB User.id
        const dbUser = await prisma.user.findUnique({
          where: { clerkId: userId },
          select: { id: true },
        });
        if (!dbUser) return unauthorized();

        const { id } = await params;
        const body = await request.json();
        const domain = typeof body.domain === 'string' ? body.domain.trim().toLowerCase() : '';

        if (!domain) {
          return badRequest('Domain is required');
        }

        if (!isValidDomain(domain)) {
          return badRequest(
            'Invalid domain format. Use a bare hostname (e.g. www.example.com) without protocol, paths, or ports.'
          );
        }

        // Verify project ownership
        const project = await prisma.project.findUnique({
          where: { id },
          select: { ownerId: true, slug: true },
        });

        if (!project || project.ownerId !== dbUser.id) {
          return notFound('Project');
        }

        // Check if domain is already used by another project
        const existing = await prisma.project.findFirst({
          where: {
            customDomain: domain,
            id: { not: id },
          },
          select: { id: true, slug: true },
        });

        if (existing) {
          return badRequest(
            `This domain is already connected to another project (/${existing.slug}).`
          );
        }

        // Set the custom domain
        const updated = await prisma.project.update({
          where: { id },
          data: { customDomain: domain },
          select: { id: true, customDomain: true, slug: true },
        });

        // Invalidate caches
        await cacheDelete(cacheKeys.project(id));
        await cacheDelete(cacheKeys.projectBySlug(updated.slug));

        return ok({
          customDomain: updated.customDomain,
          publishedUrl: `https://${domain}`,
        });
      } catch (error) {
        return errorResponse(error instanceof Error ? error : new Error(String(error)));
      }
    },
    { tier: 'free' }
  )
);

// ─── DELETE — remove custom domain ─────────────────────────────────────────

export const DELETE = withRequestLogging(
  withRateLimit(
    async (
      _request: NextRequest,
      { params }: { params: Promise<{ id: string }> }
    ) => {
      try {
        const { userId } = await auth();
        if (!userId) return unauthorized();

        // Resolve Clerk userId → DB User.id
        const dbUser = await prisma.user.findUnique({
          where: { clerkId: userId },
          select: { id: true },
        });
        if (!dbUser) return unauthorized();

        const { id } = await params;

        // Verify project ownership
        const project = await prisma.project.findUnique({
          where: { id },
          select: { ownerId: true, slug: true, customDomain: true },
        });

        if (!project || project.ownerId !== dbUser.id) {
          return notFound('Project');
        }

        if (!project.customDomain) {
          return ok({ customDomain: null, message: 'No custom domain set' });
        }

        // Remove the custom domain
        const updated = await prisma.project.update({
          where: { id },
          data: { customDomain: null },
          select: { id: true, customDomain: true, slug: true },
        });

        // Invalidate caches
        await cacheDelete(cacheKeys.project(id));
        await cacheDelete(cacheKeys.projectBySlug(updated.slug));

        return ok({ customDomain: null });
      } catch (error) {
        return errorResponse(error instanceof Error ? error : new Error(String(error)));
      }
    },
    { tier: 'free' }
  )
);
