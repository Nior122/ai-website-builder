// =============================================================================
// JSON Transformer Service
// =============================================================================
// Transforms raw AI output into validated, normalized JSON ready for DB storage.
// Raw AI output is NEVER stored directly — it always passes through this layer.
// =============================================================================

import { nanoid } from 'nanoid';
import { ZodError } from 'zod';
import { aiProjectOutputSchema } from '../schemas/project-schemas';
import { SECTION_CONTENT_SCHEMAS } from '../schemas/section-schemas';
import { SECTION_REGISTRY, getDefaultSection } from './section-registry';
import { AIResponseParseError, ValidationError } from '@/lib/errors';
import { normalizeSectionContent, deepLog, formatValidationErrors } from '@/lib/ai/normalizer';
import type { SectionType, LayoutType, SectionStyles, Animation, AnimationType, ImageConfig, SectionVisibility } from '@/types';

// ─── Types ──────────────────────────────────────────────────────────────

export interface NormalizedSection {
  id: string;
  type: SectionType;
  layout: LayoutType;
  content: Record<string, unknown>;
  styles: Partial<SectionStyles>;
  animations: Animation[];
  images: ImageConfig[];
  visibility: SectionVisibility;
  order: number;
}

export interface NormalizedPage {
  id: string;
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  isHome: boolean;
  sections: NormalizedSection[];
}

export interface NormalizedProject {
  brand: {
    name: string;
    tagline: string;
    description?: string;
    tone: string;
    mission?: string;
    vision?: string;
    values?: string[];
    colors?: Record<string, string>;
    typography?: { heading: string; body: string };
  };
  pages: NormalizedPage[];
  theme: Record<string, unknown>;
  seo?: Record<string, unknown>;
}

export interface TransformResult {
  success: boolean;
  data?: NormalizedProject;
  errors: TransformError[];
}

export interface TransformError {
  type: 'validation' | 'normalization' | 'schema';
  pageSlug?: string;
  sectionId?: string;
  sectionType?: string;
  field?: string;
  message: string;
}

// ─── Main Transformer ───────────────────────────────────────────────────

/**
 * Transform raw AI output into validated, normalized project data.
 * This is the main entry point for the normalization pipeline.
 */
export function transformAIOutput(raw: Record<string, unknown>): TransformResult {
  const errors: TransformError[] = [];

  // Step 1: Validate top-level structure with Zod
  const topValidation = aiProjectOutputSchema.safeParse(raw);
  if (!topValidation.success) {
    const zodErrors = topValidation.error.issues.map((issue) => ({
      type: 'validation' as const,
      field: issue.path.join('.'),
      message: issue.message,
    }));
    return { success: false, errors: zodErrors };
  }

  const validated = topValidation.data;

  // Step 2: Normalize brand
  const brand = normalizeBrand(validated.brand);

  // Step 3: Normalize pages and sections
  const pages: NormalizedPage[] = [];
  for (let i = 0; i < validated.pages.length; i++) {
    const pageResult = normalizePage(validated.pages[i], i);
    pages.push(pageResult.page);
    errors.push(...pageResult.errors);
  }

  // Step 4: Normalize theme (pass through with defaults)
  const theme = normalizeTheme(validated.theme);

  return {
    success: errors.length === 0,
    data: {
      brand,
      pages,
      theme,
      seo: validated.seo as Record<string, unknown> | undefined,
    },
    errors,
  };
}

// ─── Brand Normalizer ───────────────────────────────────────────────────

function normalizeBrand(raw: Record<string, unknown>): NormalizedProject['brand'] {
  return {
    name: String(raw.name || 'Untitled'),
    tagline: String(raw.tagline || ''),
    description: raw.description ? String(raw.description) : undefined,
    tone: String(raw.tone || 'professional'),
    mission: raw.mission ? String(raw.mission) : undefined,
    vision: raw.vision ? String(raw.vision) : undefined,
    values: Array.isArray(raw.values) ? raw.values.map(String) : undefined,
    colors: typeof raw.colors === 'object' && raw.colors !== null
      ? raw.colors as Record<string, string>
      : undefined,
    typography: typeof raw.typography === 'object' && raw.typography !== null
      ? raw.typography as { heading: string; body: string }
      : undefined,
  };
}

// ─── Page Normalizer ────────────────────────────────────────────────────

function normalizePage(
  raw: Record<string, unknown>,
  index: number
): { page: NormalizedPage; errors: TransformError[] } {
  const errors: TransformError[] = [];
  const slug = String(raw.slug || `page-${index + 1}`);

  const rawSections = Array.isArray(raw.sections) ? raw.sections : [];

  const sections: NormalizedSection[] = [];
  for (let i = 0; i < rawSections.length; i++) {
    const sectionResult = normalizeSection(rawSections[i], i, slug);
    sections.push(sectionResult.section);
    errors.push(...sectionResult.errors);
  }

  return {
    page: {
      id: nanoid(),
      slug,
      title: String(raw.title || 'Untitled Page'),
      metaTitle: String(raw.metaTitle || raw.title || 'Untitled Page'),
      metaDescription: String(raw.metaDescription || ''),
      isHome: Boolean(raw.isHome),
      sections,
    },
    errors,
  };
}

// ─── Content Field Name Normalization ────────────────────────────────────
// Maps AI-generated field names to schema field names so validation passes.
const CONTENT_FIELD_NAME_MAP: Record<string, Record<string, string>> = {
  team: { avatarQuery: 'avatar' },
};

function normalizeContentFieldNames(
  content: Record<string, unknown>,
  sectionType: string
): void {
  const fieldMap = CONTENT_FIELD_NAME_MAP[sectionType];
  if (!fieldMap) return;

  for (const [aiName, schemaName] of Object.entries(fieldMap)) {
    if (aiName in content && !(schemaName in content)) {
      content[schemaName] = content[aiName];
      delete content[aiName];
    }
  }

  // Also handle field renames inside array items (e.g. members[].avatarQuery)
  if (sectionType === 'team' && Array.isArray(content.members)) {
    for (const member of content.members) {
      if (member && typeof member === 'object' && 'avatarQuery' in member && !('avatar' in member)) {
        (member as Record<string, unknown>).avatar = (member as Record<string, unknown>).avatarQuery;
        delete (member as Record<string, unknown>).avatarQuery;
      }
    }
  }
}

// ─── Section Normalizer ─────────────────────────────────────────────────

function normalizeSection(
  raw: Record<string, unknown>,
  index: number,
  pageSlug: string
): { section: NormalizedSection; errors: TransformError[] } {
  const errors: TransformError[] = [];
  const type = String(raw.type || 'hero') as string;
  const config = SECTION_REGISTRY[type];

  // Validate content against section-specific schema
  const content = (typeof raw.content === 'object' && raw.content !== null
    ? raw.content
    : {}) as Record<string, unknown>;

  // Map AI-generated field names to schema field names
  normalizeContentFieldNames(content, type);

  // Normalize array fields in section content before Zod validation
  // (handles object → array for known fields like members, items, plans, etc.)
  normalizeSectionContent(type, content);

  const contentSchema = SECTION_CONTENT_SCHEMAS[type];
  if (contentSchema) {
    const contentResult = contentSchema.safeParse(content);
    if (!contentResult.success) {
      const missingFields = contentResult.error.issues
        .filter((i) => i.code === 'too_small' || i.code === 'invalid_type')
        .map((i) => i.path.join('.') || i.message);

      errors.push({
        type: 'validation',
        pageSlug,
        sectionType: type,
        field: 'content',
        message: `Section "${type}" content validation failed: ${missingFields.join(', ') || contentResult.error.issues[0]?.message || 'unknown error'}`,
      });
    } else {
      // Use parsed content with Zod defaults applied (auto-generated IDs, etc.)
      Object.assign(content, contentResult.data);
    }
  }

  // Determine layout — use provided or default from registry
  let layout = String(raw.layout || config?.defaultLayout || 'centered');
  if (config && !config.validLayouts.includes(layout as LayoutType)) {
    layout = config.defaultLayout;
  }

  // Normalize styles — merge provided with defaults
  const defaultStyles = config?.defaultStyles || {};
  const rawStyles = typeof raw.styles === 'object' && raw.styles !== null
    ? raw.styles as Record<string, unknown>
    : {};
  const styles: Partial<SectionStyles> = {
    ...defaultStyles,
    ...rawStyles,
  } as Partial<SectionStyles>;

  // Normalize animations
  const animations = normalizeAnimations(
    Array.isArray(raw.animations) ? raw.animations : config?.defaultAnimations || [],
    config?.defaultAnimations
  );

  // Normalize images
  const images = normalizeImages(
    Array.isArray(raw.images) ? raw.images : [],
    type
  );

  return {
    section: {
      id: nanoid(),
      type: type as SectionType,
      layout: layout as LayoutType,
      content,
      styles,
      animations,
      images,
      visibility: {
        desktop: true,
        tablet: true,
        mobile: true,
        ...((typeof raw.visibility === 'object' && raw.visibility !== null)
          ? raw.visibility
          : {}),
      } as SectionVisibility,
      order: typeof raw.order === 'number' ? raw.order : index,
    },
    errors,
  };
}

// ─── Animation Normalizer ───────────────────────────────────────────────

function normalizeAnimations(
  raw: unknown[],
  defaults: Animation[] = []
): Animation[] {
  if (raw.length === 0 && defaults.length > 0) {
    return [...defaults];
  }

  return raw.map((item): Animation => {
    const anim = item as Record<string, unknown>;
    return {
      type: String(anim.type || 'fade-in-up') as AnimationType,
      duration: typeof anim.duration === 'number' ? anim.duration : 600,
      delay: typeof anim.delay === 'number' ? anim.delay : 0,
      easing: anim.easing ? String(anim.easing) : '',
      once: anim.once !== undefined ? Boolean(anim.once) : true,
    };
  });
}

// ─── Image Normalizer ───────────────────────────────────────────────────

function normalizeImages(raw: unknown[], sectionType: string): ImageConfig[] {
  const config = SECTION_REGISTRY[sectionType];

  return raw.map((item, index): ImageConfig => {
    const img = item as Record<string, unknown>;
    return {
      id: nanoid(),
      src: String(img.src || img.query || ''),
      alt: String(img.alt || ''),
      width: typeof img.width === 'number' ? img.width : undefined,
      height: typeof img.height === 'number' ? img.height : undefined,
      loading: (img.loading as 'lazy' | 'eager') || 'lazy',
      placeholder: img.placeholder ? String(img.placeholder) : undefined,
      blurDataURL: img.blurDataURL ? String(img.blurDataURL) : undefined,
    };
  });
}

// ─── Theme Normalizer ───────────────────────────────────────────────────

function normalizeTheme(raw: Record<string, unknown>): Record<string, unknown> {
  // Theme passes through mostly as-is; the renderer applies defaults
  return {
    preset: String(raw.preset || 'modern'),
    mode: String(raw.mode || 'light'),
    colors: typeof raw.colors === 'object' ? raw.colors : {},
    typography: typeof raw.typography === 'object' ? raw.typography : {},
    spacing: typeof raw.spacing === 'object' ? raw.spacing : { unit: 8, scale: [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32, 40, 48, 64] },
    borderRadius: typeof raw.borderRadius === 'object' ? raw.borderRadius : {},
    shadows: typeof raw.shadows === 'object' ? raw.shadows : {},
    animations: typeof raw.animations === 'object' ? raw.animations : { enabled: true, reduceMotion: false },
  };
}

// ─── Image Config Builder ───────────────────────────────────────────────

/**
 * Build ImageConfig entries from AI-generated image queries.
 * Used when the AI returns image requirements but hasn't fetched the URLs yet.
 */
export function buildImageConfigs(
  queries: Array<{ query: string; alt: string; position?: number }>
): ImageConfig[] {
  return queries.map((q) => ({
    id: nanoid(),
    src: '', // Will be populated by image generation service
    alt: q.alt,
    loading: 'lazy' as const,
    placeholder: q.query, // Store the query for later image generation
  }));
}
