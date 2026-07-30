// =============================================================================
// POST /api/generate/create-project
// =============================================================================
// Creates a minimal project for the AI generation flow.
// Uses the database User ID (not Clerk user ID) as ownerId,
// since Project.ownerId references User.id (DB cuid) not User.clerkId.
// =============================================================================

import { type NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { createProject } from '@/features/projects/services/project.service';
import { unauthorized } from '@/lib/api-response';
import prisma from '@/lib/prisma/client';
import { logger } from '@/lib/logger';

const LOG = { route: 'POST /api/generate/create-project' } as const;

export async function POST(request: NextRequest) {
  try {
    // ── Step 1: Auth ──────────────────────────────────────────────
    logger.info('Step 1: Authenticating...', LOG);
    const { userId } = await auth();
    if (!userId) {
      logger.warn('Step 1 FAILED: No userId from auth()', LOG);
      return unauthorized();
    }
    logger.info('Step 1 OK: userId=' + userId, LOG);

    // ── Step 2: Resolve DB User ID ───────────────────────────────
    logger.info('Step 2: Resolving database user for clerkId=' + userId, LOG);
    let dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });

    if (dbUser) {
      logger.info('Step 2 OK: Found existing user dbUserId=' + dbUser.id, LOG);
    } else {
      logger.warn('Step 2: No DB user for clerkId=' + userId + ' — attempting auto-create', LOG);

      // Try Clerk API first to get real user data
      try {
        const clerk = await clerkClient();
        const clerkUser = await clerk.users.getUser(userId);
        const primaryEmail = clerkUser.emailAddresses[0]?.emailAddress || 'unknown@email.com';

        logger.info('Step 2: Clerk API returned email=' + primaryEmail + ' — upserting user', LOG);
        dbUser = await prisma.user.upsert({
          where: { clerkId: userId },
          create: {
            clerkId: userId,
            email: primaryEmail,
            firstName: clerkUser.firstName || null,
            lastName: clerkUser.lastName || null,
            avatarUrl: clerkUser.imageUrl || null,
          },
          update: {},
          select: { id: true },
        });
        logger.info('Step 2 OK: Auto-created user dbUserId=' + dbUser.id, LOG);
      } catch (clerkErr) {
        logger.warn('Step 2: Clerk API failed (' + String(clerkErr) + ') — using fallback upsert', LOG);

        // Last-resort fallback: insert minimal user record
        dbUser = await prisma.user.upsert({
          where: { clerkId: userId },
          create: {
            clerkId: userId,
            email: 'user@placeholder.com',
          },
          update: {},
          select: { id: true },
        });
        logger.info('Step 2 OK: Fallback user created dbUserId=' + dbUser.id, LOG);
      }
    }

    // ── Step 3: Parse request body ────────────────────────────────
    logger.info('Step 3: Parsing request body...', LOG);
    const body = await request.json();
    const { name, description, industry, templateId } = body;
    logger.info('Step 3 OK: name=' + name + ' industry=' + industry + ' templateId=' + templateId, LOG);

    // ── Step 4: Create project ────────────────────────────────────
    logger.info('Step 4: Creating project with ownerId=' + dbUser.id + ' (DB user ID)', LOG);
    const project = await createProject({
      name: name || 'My Website',
      description: description || '',
      industry: industry || 'general',
      businessType: 'business',
      ownerId: dbUser.id,
      ...(templateId ? { templateId } : {}),
    });

    logger.info('Step 4 OK: Project created projectId=' + project.id + ' slug=' + project.slug, LOG);

    return NextResponse.json({ data: project });
  } catch (err) {
    logger.error('FAILED:', LOG, err as Error);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create project' },
      { status: 500 }
    );
  }
}
