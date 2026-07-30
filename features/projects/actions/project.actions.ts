// =============================================================================
// Project Server Actions
// =============================================================================
// Server-side mutations callable from client components via 'use server'.
// These validate input, call services, and return typed results.
// =============================================================================

'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import {
  createProject,
  updateProject,
  deleteProject,
  duplicateProject,
  listProjects,
} from '../services/project.service';
import { checkPlanLimits } from '@/features/billing/services/subscription.service';
import { createProjectSchema, updateProjectSchema } from '@/lib/validations/project';
import { PlanLimitExceededError } from '@/lib/errors';
import prisma from '@/lib/prisma/client';

/**
 * Resolve the Clerk user ID (user_xxx) to the database User.id (cuid).
 * All Prisma relations use the DB id, NOT the Clerk clerkId string.
 */
async function resolveDbUserId(clerkUserId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { clerkId: clerkUserId },
    select: { id: true },
  });
  if (!user) throw new Error('User not found — please sign in again.');
  return user.id;
}

/**
 * Create a new project.
 */
export async function handleCreateProject(input: {
  name: string;
  description?: string;
  industry: string;
  businessType: string;
  templateId?: string;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const dbUserId = await resolveDbUserId(userId);

  // Check plan limits (needs DB user ID, not Clerk ID)
  const { allowed, current, limit } = await checkPlanLimits(dbUserId, 'projects');
  if (!allowed) {
    throw new PlanLimitExceededError('projects', current, limit);
  }

  const validated = createProjectSchema.parse(input);
  const project = await createProject({
    ...validated,
    ownerId: dbUserId,
  });

  revalidatePath('/dashboard/projects');
  return project;
}

/**
 * Update an existing project.
 */
export async function handleUpdateProject(
  projectId: string,
  input: Record<string, unknown>
) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const dbUserId = await resolveDbUserId(userId);

  const validated = updateProjectSchema.partial().parse(input);
  const project = await updateProject(projectId, dbUserId, validated as never);

  revalidatePath('/dashboard/projects');
  revalidatePath(`/editor/${projectId}`);
  return project;
}

/**
 * Delete a project.
 */
export async function handleDeleteProject(projectId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const dbUserId = await resolveDbUserId(userId);

  await deleteProject(projectId, dbUserId);
  revalidatePath('/dashboard/projects');
}

/**
 * Duplicate a project.
 */
export async function handleDuplicateProject(projectId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const dbUserId = await resolveDbUserId(userId);

  const duplicate = await duplicateProject(projectId, dbUserId);
  revalidatePath('/dashboard/projects');
  return duplicate;
}

/**
 * List all projects for the current user.
 */
export async function handleListProjects() {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const dbUserId = await resolveDbUserId(userId);

  return listProjects(dbUserId);
}
