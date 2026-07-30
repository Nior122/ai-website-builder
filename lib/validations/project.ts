// =============================================================================
// Project Validation Schemas
// =============================================================================
// Zod schemas for project data validation. Used at every API boundary
// to ensure type-safe, validated data flows.
// =============================================================================

import { z } from 'zod';

// ─────────────────────────────────────────────────────────────────────────────
// SPACING & STYLE SCHEMAS
// ─────────────────────────────────────────────────────────────────────────────

export const spacingValueSchema = z.object({
  top: z.string().default('0px'),
  right: z.string().default('0px'),
  bottom: z.string().default('0px'),
  left: z.string().default('0px'),
});

export const sectionVisibilitySchema = z.object({
  desktop: z.boolean().default(true),
  tablet: z.boolean().default(true),
  mobile: z.boolean().default(true),
});

export const animationSchema = z.object({
  type: z.enum([
    'fade-in', 'fade-in-up', 'fade-in-down', 'fade-in-left', 'fade-in-right',
    'scale-in', 'slide-in-up', 'slide-in-down', 'zoom-in', 'blur-in',
    'flip-in', 'bounce-in', 'none',
  ]).default('fade-in'),
  duration: z.number().min(0).max(5000).default(500),
  delay: z.number().min(0).max(5000).default(0),
  easing: z.string().default('ease-out'),
  once: z.boolean().default(true),
});

export const sectionStylesSchema = z.object({
  padding: spacingValueSchema.default({ top: '0px', right: '0px', bottom: '0px', left: '0px' }),
  margin: spacingValueSchema.default({ top: '0px', right: '0px', bottom: '0px', left: '0px' }),
  backgroundColor: z.string().nullable().default(null),
  backgroundImage: z.string().nullable().default(null),
  backgroundSize: z.string().default('cover'),
  backgroundPosition: z.string().default('center'),
  backgroundRepeat: z.string().default('no-repeat'),
  borderRadius: z.string().nullable().default(null),
  boxShadow: z.string().nullable().default(null),
  border: z.string().nullable().default(null),
  opacity: z.number().min(0).max(1).default(1),
  overflow: z.string().default('visible'),
  customClass: z.string().nullable().default(null),
  customCss: z.string().nullable().default(null),
  maxWidth: z.string().nullable().default(null),
  textAlign: z.enum(['left', 'center', 'right']).default('left'),
  animation: z.enum([
    'fade-in', 'fade-in-up', 'fade-in-down', 'fade-in-left', 'fade-in-right',
    'scale-in', 'slide-in-up', 'slide-in-down', 'zoom-in', 'blur-in',
    'flip-in', 'bounce-in', 'none',
  ]).nullable().default(null),
});

// ─────────────────────────────────────────────────────────────────────────────
// CONTENT SCHEMAS
// ─────────────────────────────────────────────────────────────────────────────

export const ctaSchema = z.object({
  text: z.string().min(1).max(100),
  url: z.string().min(1),
  style: z.enum(['primary', 'secondary', 'ghost', 'outline', 'danger', 'success']).default('primary'),
  size: z.enum(['sm', 'md', 'lg']).default('md'),
  icon: z.string().optional(),
  openInNewTab: z.boolean().default(false),
});

export const contentItemSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  icon: z.string().optional(),
  image: z.string().optional(),
  url: z.string().optional(),
  badge: z.string().optional(),
  highlight: z.boolean().optional().default(false),
});

export const testimonialSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  role: z.string().min(1).max(100),
  company: z.string().min(1).max(100),
  content: z.string().min(10).max(2000),
  avatar: z.string().optional(),
  rating: z.number().min(1).max(5).optional(),
  featured: z.boolean().default(false),
});

export const faqSchema = z.object({
  id: z.string(),
  question: z.string().min(5).max(200),
  answer: z.string().min(10).max(5000),
  category: z.string().optional(),
  order: z.number().default(0),
});

export const pricingFeatureSchema = z.object({
  text: z.string().min(1).max(200),
  included: z.boolean().default(true),
  icon: z.string().optional(),
});

export const pricingTierSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  price: z.number().min(0),
  originalPrice: z.number().min(0).optional(),
  period: z.enum(['monthly', 'yearly', 'one-time']).default('monthly'),
  features: z.array(pricingFeatureSchema).default([]),
  highlighted: z.boolean().default(false),
  cta: z.string().min(1).max(50),
  badge: z.string().max(50).optional(),
});

export const statSchema = z.object({
  id: z.string(),
  value: z.string().min(1).max(50),
  label: z.string().min(1).max(100),
  prefix: z.string().max(10).optional(),
  suffix: z.string().max(10).optional(),
  icon: z.string().optional(),
});

export const teamMemberSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  role: z.string().min(1).max(100),
  bio: z.string().max(1000).optional(),
  avatar: z.string().optional(),
  social: z.object({
    facebook: z.string().optional(),
    twitter: z.string().optional(),
    instagram: z.string().optional(),
    linkedin: z.string().optional(),
  }).optional(),
});

export const galleryItemSchema = z.object({
  id: z.string(),
  src: z.string().min(1),
  alt: z.string().min(1).max(200),
  caption: z.string().max(500).optional(),
  category: z.string().max(100).optional(),
  width: z.number().optional(),
  height: z.number().optional(),
});

export const formFieldSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  label: z.string().min(1).max(100),
  type: z.enum([
    'text', 'email', 'phone', 'number', 'textarea', 'select',
    'radio', 'checkbox', 'date', 'time', 'file', 'hidden',
  ]),
  placeholder: z.string().max(200).optional(),
  required: z.boolean().default(false),
  options: z.array(z.object({
    label: z.string(),
    value: z.string(),
  })).optional(),
  validation: z.object({
    minLength: z.number().optional(),
    maxLength: z.number().optional(),
    pattern: z.string().optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    message: z.string(),
  }).optional(),
  width: z.enum(['full', 'half', 'third']).default('full'),
  order: z.number().default(0),
});

export const formDataSchema = z.object({
  type: z.enum(['contact', 'booking', 'reservation', 'quote', 'job', 'support', 'newsletter', 'checkout', 'appointment']),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  fields: z.array(formFieldSchema).min(1).max(50),
  submitText: z.string().min(1).max(50).default('Submit'),
  successMessage: z.string().min(1).max(500).default('Thank you! We will get back to you soon.'),
  redirectUrl: z.string().optional(),
  emailTo: z.string().email().optional(),
  webhookUrl: z.string().url().optional(),
});

// ─────────────────────────────────────────────────────────────────────────────
// IMAGE & MEDIA SCHEMAS
// ─────────────────────────────────────────────────────────────────────────────

export const imageConfigSchema = z.object({
  id: z.string(),
  src: z.string().min(1),
  alt: z.string().min(1).max(200),
  width: z.number().optional(),
  height: z.number().optional(),
  loading: z.enum(['lazy', 'eager']).default('lazy'),
  placeholder: z.string().optional(),
  blurDataURL: z.string().optional(),
});

export const videoConfigSchema = z.object({
  url: z.string().url(),
  poster: z.string().optional(),
  autoplay: z.boolean().default(false),
  loop: z.boolean().default(false),
  muted: z.boolean().default(true),
  controls: z.boolean().default(true),
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION SCHEMA
// ─────────────────────────────────────────────────────────────────────────────

export const sectionContentSchema = z.record(z.unknown());

export const sectionSchema = z.object({
  id: z.string(),
  pageId: z.string(),
  type: z.enum([
    'hero', 'features', 'services', 'pricing', 'testimonials', 'faq',
    'gallery', 'contact', 'blog', 'cta', 'stats', 'team', 'timeline',
    'about', 'mission', 'values', 'process', 'portfolio', 'newsletter',
    'video', 'map', 'accordion', 'tabs', 'divider', 'spacer', 'html',
    'checkout', 'booking', 'appointment', 'terms', 'privacy', '404',
    'coming-soon', 'landing', 'sales',
  ]),
  layout: z.enum([
    'centered', 'split', 'image-left', 'image-right', 'full-width',
    'grid-2', 'grid-3', 'grid-4', 'cards', 'masonry', 'carousel',
    'tabs', 'accordion', 'timeline', 'columns-2', 'columns-3',
  ]),
  content: sectionContentSchema,
  styles: sectionStylesSchema,
  animations: z.array(animationSchema).default([]),
  images: z.array(imageConfigSchema).default([]),
  visibility: sectionVisibilitySchema,
  order: z.number().min(0),
  isLocked: z.boolean().default(false),
  customId: z.string().nullable().default(null),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// ─────────────────────────────────────────────────────────────────────────────
// PAGE SCHEMA
// ─────────────────────────────────────────────────────────────────────────────

export const pageInputSchema = z.object({
  slug: z.string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens'),
  title: z.string().min(1).max(200),
  metaTitle: z.string().max(100).optional(),
  metaDescription: z.string().max(500).optional(),
  isHome: z.boolean().default(false),
  order: z.number().min(0).default(0),
});

export const pageSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  slug: z.string(),
  title: z.string(),
  metaTitle: z.string().nullable(),
  metaDescription: z.string().nullable(),
  // `ogImage` and `isPublished` removed to match the Prisma `Page` model and
  // the reconciled `Page` type. Per-page og lives in `settings` JSON if added
  // later; publish-state is project-level (`Project.status`).
  sections: z.array(sectionSchema),
  isHome: z.boolean(),
  order: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// ─────────────────────────────────────────────────────────────────────────────
// PROJECT SCHEMAS
// ─────────────────────────────────────────────────────────────────────────────

export const projectSettingsSchema = z.object({
  language: z.string().default('en'),
  direction: z.enum(['ltr', 'rtl']).default('ltr'),
  favicon: z.string().nullable().default(null),
  customCss: z.string().nullable().default(null),
  customHead: z.string().nullable().default(null),
  analyticsId: z.string().nullable().default(null),
  passwordProtection: z.boolean().default(false),
  passwordHash: z.string().nullable().default(null),
  maintenanceMode: z.boolean().default(false),
});

export const createProjectSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  description: z.string().max(1000).optional(),
  industry: z.string().min(1),
  businessType: z.string().min(1),
  templateId: z.string().optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  description: z.string().max(1000).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  settings: projectSettingsSchema.partial().optional(),
});

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT SCHEMAS
// ─────────────────────────────────────────────────────────────────────────────

export const exportConfigSchema = z.object({
  format: z.enum(['nextjs', 'react', 'html', 'tailwind', 'zip', 'markdown', 'pdf', 'json']),
  options: z.object({
    includeImages: z.boolean().default(true),
    includeStyles: z.boolean().default(true),
    minify: z.boolean().default(false),
    typescript: z.boolean().default(true),
    tailwind: z.boolean().default(true),
    eslint: z.boolean().default(false),
    prettier: z.boolean().default(false),
  }),
});

// ─────────────────────────────────────────────────────────────────────────────
// DEPLOYMENT SCHEMAS
// ─────────────────────────────────────────────────────────────────────────────

export const deployConfigSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  platform: z.enum(['vercel', 'netlify', 'cloudflare', 'github', 'docker']),
  branch: z.string().optional().default('main'),
  environment: z.enum(['production', 'staging', 'development']).default('production'),
  customDomain: z.string().optional(),
  envVars: z.record(z.string()).optional(),
});

// ─────────────────────────────────────────────────────────────────────────────
// TYPE INFERENCE EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type PageInput = z.infer<typeof pageInputSchema>;
export type ExportConfigInput = z.infer<typeof exportConfigSchema>;
export type DeployConfigInput = z.infer<typeof deployConfigSchema>;
