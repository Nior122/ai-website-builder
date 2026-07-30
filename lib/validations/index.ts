// =============================================================================
// API Validation Schemas
// =============================================================================
// Centralized Zod schemas for all API route inputs. Used by the withValidation
// middleware to validate request bodies, query params, and route params.
//
// Import from here in route handlers:
//   import { projectUpdateSchema, createSectionSchema } from '@/lib/validations';
// =============================================================================

import { z } from 'zod';

// ─── Projects ────────────────────────────────────────────────────────────

/** PATCH /api/projects/[id] — update project fields */
export const projectUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  globalStyles: z.record(z.unknown()).optional(),
  seo: z.record(z.unknown()).optional(),
  settings: z.record(z.unknown()).optional(),
});

/** Route params for /api/projects/[id] */
export const projectIdSchema = z.object({
  id: z.string().min(1),
});

// ─── Sections ────────────────────────────────────────────────────────────

/** POST /api/projects/[id]/sections — create a section */
export const createSectionSchema = z.object({
  pageId: z.string().min(1),
  type: z.string().min(1).max(50),
  layout: z.string().max(50).optional(),
  content: z.record(z.unknown()).optional(),
  afterSectionId: z.string().optional(),
});

/** PATCH /api/projects/[id]/sections/[sectionId] — update a section */
export const updateSectionSchema = z.object({
  content: z.record(z.unknown()).optional(),
  styles: z.record(z.unknown()).optional(),
  animations: z.record(z.unknown()).optional(),
  images: z.array(z.unknown()).optional(),
  visibility: z.record(z.boolean()).optional(),
  order: z.number().int().min(0).optional(),
  type: z.string().max(50).optional(),
  layout: z.string().max(50).optional(),
});

/** Route params for /api/projects/[id]/sections/[sectionId] */
export const sectionParamsSchema = z.object({
  id: z.string().min(1),
  sectionId: z.string().min(1),
});

// ─── AI Generation ───────────────────────────────────────────────────────

/** POST /api/ai/generate — generate website from prompt */
export const aiGenerateSchema = z.object({
  prompt: z.string().min(10).max(5000),
  projectId: z.string().optional(),
  templateId: z.string().optional(),
  industry: z.string().max(100).optional(),
  businessType: z.string().max(100).optional(),
});

/** POST /api/ai/refine — refine existing section */
export const aiRefineSchema = z.object({
  sectionId: z.string().min(1),
  instruction: z.string().min(5).max(2000),
  projectId: z.string().min(1),
});

// ─── Deployment ──────────────────────────────────────────────────────────

/** POST /api/deploy — trigger deployment */
export const deploySchema = z.object({
  projectId: z.string().min(1),
  provider: z.enum(['vercel', 'netlify']).optional(),
  customDomain: z.string().optional(),
});

// ─── Notifications ───────────────────────────────────────────────────────

/** GET /api/notifications — list notifications */
export const notificationListSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

// ─── Admin ───────────────────────────────────────────────────────────────

/** GET /api/admin/users — list users */
export const adminUserListSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(200).optional(),
  role: z.enum(['user', 'admin']).optional(),
});

/** POST /api/admin/flags — create feature flag */
export const createFlagSchema = z.object({
  key: z.string().min(1).max(100).regex(/^[a-z0-9_-]+$/, 'Key must be lowercase alphanumeric with hyphens/underscores'),
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  enabled: z.boolean().default(false),
  rolloutPercentage: z.number().int().min(0).max(100).default(0),
  allowedUserIds: z.array(z.string()).optional(),
  deniedUserIds: z.array(z.string()).optional(),
});

/** PATCH /api/admin/flags/[key] — update feature flag */
export const updateFlagSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(500).optional(),
  enabled: z.boolean().optional(),
  rolloutPercentage: z.number().int().min(0).max(100).optional(),
  allowedUserIds: z.array(z.string()).optional(),
  deniedUserIds: z.array(z.string()).optional(),
});

/** Route params for /api/admin/flags/[key] */
export const flagKeySchema = z.object({
  key: z.string().min(1),
});

// ─── Stripe ──────────────────────────────────────────────────────────────

/** POST /api/stripe/checkout — create checkout session */
export const checkoutSchema = z.object({
  priceId: z.string().min(1),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

// ─── Analytics ───────────────────────────────────────────────────────────

/** POST /api/analytics/track — track event */
export const trackEventSchema = z.object({
  projectId: z.string().min(1),
  eventType: z.enum(['page_view', 'click', 'form_submit', 'custom']),
  path: z.string().max(500).optional(),
  referrer: z.string().max(2000).optional(),
  userAgent: z.string().max(500).optional(),
});

/** GET /api/analytics/[projectId] — get analytics */
export const analyticsQuerySchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  period: z.enum(['day', 'week', 'month']).default('week'),
});

// ─── Storage ─────────────────────────────────────────────────────────────

/** POST /api/storage/upload — presigned upload URL */
export const storageUploadSchema = z.object({
  fileName: z.string().min(1).max(255),
  contentType: z.string().min(1),
  fileSize: z.number().int().min(1).max(10 * 1024 * 1024), // 10MB max
});

// ─── Feature Flags ───────────────────────────────────────────────────────

/** GET /api/flags/[key]/check — check flag for user */
export const flagCheckSchema = z.object({
  key: z.string().min(1),
});
