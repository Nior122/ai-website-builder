// =============================================================================
// Project-Level Zod Schemas
// =============================================================================
// Validates the complete AI output structure: pages, sections, themes, SEO.
// Applied after generation to ensure data integrity before DB storage.
// =============================================================================

import { z } from 'zod';
import { SECTION_CONTENT_SCHEMAS } from './section-schemas';

// ─── Theme Schemas ──────────────────────────────────────────────────────

const colorShadeSchema = z.object({
  '50': z.string(),
  '100': z.string(),
  '200': z.string(),
  '300': z.string(),
  '400': z.string(),
  '500': z.string(),
  '600': z.string(),
  '700': z.string(),
  '800': z.string(),
  '900': z.string(),
  '950': z.string(),
});

const colorPaletteSchema = z.object({
  primary: colorShadeSchema,
  secondary: colorShadeSchema,
  accent: colorShadeSchema,
  neutral: colorShadeSchema,
  background: z.string(),
  surface: z.string(),
  surfaceHover: z.string(),
  text: z.string(),
  textSecondary: z.string(),
  textMuted: z.string(),
  border: z.string(),
  borderLight: z.string(),
  success: colorShadeSchema,
  warning: colorShadeSchema,
  error: colorShadeSchema,
  info: colorShadeSchema,
  gradient: z.object({
    primary: z.string(),
    secondary: z.string(),
    accent: z.string(),
    mesh: z.string(),
  }),
});

const typographyConfigSchema = z.object({
  fontFamily: z.object({
    heading: z.string(),
    body: z.string(),
    mono: z.string(),
  }),
  scale: z.number(),
  lineHeight: z.object({
    tight: z.number(),
    snug: z.number(),
    normal: z.number(),
    relaxed: z.number(),
    loose: z.number(),
  }),
});

// Lenient theme schema for raw AI input — the normalizer fills full defaults
const themeSchema = z.record(z.unknown()).default({});

// ─── SEO Schema ─────────────────────────────────────────────────────────

// Lenient SEO schema for raw AI input — the normalizer/page defaults fill gaps
const seoSchema = z.record(z.unknown()).default({});

// ─── Section Schema ─────────────────────────────────────────────────────

const sectionSchema = z.object({
  type: z.string(),
  layout: z.string().optional(),
  content: z.record(z.unknown()).default({}),
  styles: z.record(z.unknown()).default({}),
  animations: z
    .array(
      z.object({
        type: z.string(),
        duration: z.number(),
        delay: z.number(),
        easing: z.string().optional(),
        once: z.boolean().optional(),
      })
    )
    .default([]),
  images: z
    .array(
      z.union([
        z.object({
          query: z.string(),
          alt: z.string(),
          position: z.number().optional(),
        }),
        z.object({
          src: z.string(),
          alt: z.string(),
          width: z.number().optional(),
          height: z.number().optional(),
        }),
      ])
    )
    .default([]),
});

// ─── Page Schema ────────────────────────────────────────────────────────

const pageSchema = z.object({
  slug: z.string().optional(),
  title: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  isHome: z.boolean().optional(),
  sections: z.array(sectionSchema).min(1),
});

// ─── Brand Schema ───────────────────────────────────────────────────────

const brandSchema = z.object({
  name: z.string(),
  tagline: z.string().optional(),
  slogan: z.string().optional(),
  description: z.string().optional(),
  tone: z.string().optional(),
  mission: z.string().optional(),
  vision: z.string().optional(),
  values: z.array(z.string()).optional(),
  colors: z
    .object({
      primary: z.string(),
      secondary: z.string(),
      accent: z.string(),
      background: z.string().optional(),
      surface: z.string().optional(),
      text: z.string().optional(),
      textSecondary: z.string().optional(),
      border: z.string().optional(),
    })
    .optional(),
  typography: z
    .object({
      heading: z.string(),
      body: z.string(),
      mono: z.string().optional(),
    })
    .optional(),
});

// ─── Full Project Output Schema ─────────────────────────────────────────

export const aiProjectOutputSchema = z.object({
  brand: brandSchema,
  pages: z.array(pageSchema).min(1),
  theme: themeSchema,
  seo: seoSchema.optional(),
});

// ─── Section Content Validation (per-type) ──────────────────────────────

/**
 * Validate a single section against its content schema.
 */
export function validateSectionType(
  type: string,
  content: Record<string, unknown>
): { valid: boolean; errors?: string[] } {
  const schema = SECTION_CONTENT_SCHEMAS[type];
  if (!schema) {
    // Unknown section type — cannot validate content, pass through
    return { valid: true };
  }

  const result = schema.safeParse(content);
  if (result.success) {
    return { valid: true };
  }

  const errors = result.error.issues.map(
    (issue) => `${issue.path.join('.')}: ${issue.message}`
  );
  return { valid: false, errors };
}

/**
 * Validate all sections across all pages.
 */
export function validateAllSections(
  pages: z.infer<typeof pageSchema>[]
): { valid: boolean; sectionErrors: Array<{ pageSlug: string; sectionIndex: number; type: string; errors: string[] }> } {
  const sectionErrors: Array<{ pageSlug: string; sectionIndex: number; type: string; errors: string[] }> = [];

  for (const page of pages) {
    for (let i = 0; i < page.sections.length; i++) {
      const section = page.sections[i];
      const result = validateSectionType(section.type, section.content);
      if (!result.valid) {
        sectionErrors.push({
          pageSlug: page.slug ?? '',
          sectionIndex: i,
          type: section.type,
          errors: result.errors || ['Unknown validation error'],
        });
      }
    }
  }

  return { valid: sectionErrors.length === 0, sectionErrors };
}

// ─── Type Exports ───────────────────────────────────────────────────────

export type AIProjectOutput = z.infer<typeof aiProjectOutputSchema>;
export type AIPageOutput = z.infer<typeof pageSchema>;
export type AISectionOutput = z.infer<typeof sectionSchema>;
export type AIBrandOutput = z.infer<typeof brandSchema>;
export type ThemeOutput = z.infer<typeof themeSchema>;
export type SEOOutput = z.infer<typeof seoSchema>;
export type ColorPaletteOutput = z.infer<typeof colorPaletteSchema>;
