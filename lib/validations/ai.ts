// =============================================================================
// AI Generation Validation Schemas
// =============================================================================
// Validates AI generation requests and responses at every boundary.
// =============================================================================

import { z } from 'zod';

// ─────────────────────────────────────────────────────────────────────────────
// GENERATION REQUEST SCHEMA
// ─────────────────────────────────────────────────────────────────────────────

export const generateRequestSchema = z.object({
  /** Pre-created project ID — when provided, generation fills the existing
   *  project instead of creating a new one. */
  projectId: z
    .string()
    .optional()
    .describe('Existing project ID from /api/generate/create-project'),

  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(5000, 'Description must be under 5000 characters')
    .describe('Plain English description of the business'),

  industry: z
    .string()
    .min(1, 'Industry is required')
    .describe('Industry category for the business'),

  businessType: z
    .string()
    .min(1, 'Business type is required')
    .describe('Specific type of business'),

  businessName: z
    .string()
    .min(1)
    .max(200)
    .optional()
    .describe('Name of the business (AI can suggest if not provided)'),

  tone: z
    .enum([
      'professional', 'casual', 'luxury', 'creative', 'corporate',
      'playful', 'authoritative', 'friendly', 'minimal', 'bold',
    ])
    .default('professional')
    .describe('Brand tone for generated content'),

  features: z
    .array(z.string())
    .max(20)
    .default([])
    .describe('Specific features the website should have'),

  pages: z
    .array(z.string())
    .max(30)
    .default(['home', 'about', 'services', 'contact'])
    .describe('Pages to generate'),

  templateId: z
    .string()
    .optional()
    .describe('Optional template ID to base the design on'),

  imageProvider: z
    .enum(['dalle', 'flux', 'midjourney', 'stable-diffusion'])
    .default('dalle')
    .describe('Image generation provider for prompts'),

  language: z
    .string()
    .length(2)
    .default('en')
    .describe('ISO 639-1 language code'),
});

// ─────────────────────────────────────────────────────────────────────────────
// AI RESPONSE SCHEMAS
// ─────────────────────────────────────────────────────────────────────────────

export const aiBrandSchema = z.object({
  name: z.string(),
  tagline: z.string(),
  slogan: z.string(),
  mission: z.string(),
  vision: z.string(),
  values: z.array(z.string()),
  personality: z.array(z.string()),
  voice: z.object({
    tone: z.array(z.string()),
    style: z.string(),
    doUse: z.array(z.string()),
    dontUse: z.array(z.string()),
  }),
  colors: z.object({
    primary: z.string(),
    secondary: z.string(),
    accent: z.string(),
    background: z.string(),
    surface: z.string(),
    text: z.string(),
    textSecondary: z.string(),
    border: z.string(),
  }),
  typography: z.object({
    heading: z.string(),
    body: z.string(),
    mono: z.string(),
  }),
});

export const aiPageSchema = z.object({
  slug: z.string(),
  title: z.string(),
  metaTitle: z.string(),
  metaDescription: z.string(),
  isHome: z.boolean(),
  sections: z.array(z.object({
    type: z.string(),
    layout: z.string(),
    content: z.record(z.unknown()),
    animations: z.array(z.object({
      type: z.string(),
      duration: z.number(),
      delay: z.number(),
    })),
    images: z.array(z.object({
      src: z.string(),
      alt: z.string(),
      prompt: z.string().optional(),
    })),
  })),
});

export const aiProjectSchema = z.object({
  name: z.string(),
  description: z.string(),
  industry: z.string(),
  businessType: z.string(),
  brand: aiBrandSchema,
  pages: z.array(aiPageSchema),
  seo: z.object({
    metaTitle: z.string(),
    metaDescription: z.string(),
    keywords: z.array(z.string()),
    ogImage: z.string().optional(),
    jsonLd: z.array(z.record(z.unknown())).optional(),
  }),
  settings: z.object({
    language: z.string(),
    favicon: z.string().optional(),
    socialLinks: z.record(z.string()).optional(),
  }),
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION GENERATION SCHEMAS
// ─────────────────────────────────────────────────────────────────────────────

export const refineSectionRequestSchema = z.object({
  projectId: z.string(),
  pageId: z.string(),
  sectionId: z.string(),
  instruction: z
    .string()
    .min(5)
    .max(1000)
    .describe('Natural language instruction for how to modify the section'),
});

export const blogGenerationRequestSchema = z.object({
  projectId: z.string(),
  topic: z.string().min(3).max(200),
  tone: z.enum([
    'professional', 'casual', 'luxury', 'creative', 'corporate',
    'playful', 'authoritative', 'friendly', 'minimal', 'bold',
  ]).default('professional'),
  wordCount: z.number().min(300).max(5000).default(1500),
  includeImages: z.boolean().default(true),
  includeToc: z.boolean().default(true),
});

// ─────────────────────────────────────────────────────────────────────────────
// IMAGE GENERATION SCHEMAS
// ─────────────────────────────────────────────────────────────────────────────

export const imagePromptRequestSchema = z.object({
  businessType: z.string(),
  industry: z.string(),
  style: z.enum(['photorealistic', 'illustration', 'abstract', 'minimal', 'artistic']),
  count: z.number().min(1).max(10).default(1),
  subjects: z.array(z.string()).optional(),
  dimensions: z.object({
    width: z.number(),
    height: z.number(),
  }).default({ width: 1200, height: 630 }),
});

export const imagePromptResponseSchema = z.object({
  prompts: z.array(z.object({
    subject: z.string(),
    prompt: z.string(),
    negativePrompt: z.string().optional(),
    provider: z.enum(['dalle', 'flux', 'midjourney', 'stable-diffusion']),
    dimensions: z.object({
      width: z.number(),
      height: z.number(),
    }),
  })),
});

// ─────────────────────────────────────────────────────────────────────────────
// TYPE EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

export type GenerateRequestInput = z.infer<typeof generateRequestSchema>;
export type RefineSectionInput = z.infer<typeof refineSectionRequestSchema>;
export type BlogGenerationInput = z.infer<typeof blogGenerationRequestSchema>;
export type ImagePromptInput = z.infer<typeof imagePromptRequestSchema>;
export type AIBrandOutput = z.infer<typeof aiBrandSchema>;
export type AIPageOutput = z.infer<typeof aiPageSchema>;
export type AIProjectOutput = z.infer<typeof aiProjectSchema>;
