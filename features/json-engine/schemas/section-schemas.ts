// =============================================================================
// Section Content Schemas — Zod
// =============================================================================
// Zod schemas for every section type's content field.
// Single source of truth for what content each section type requires.
// Used by the JSON engine for validation and by the editor for defaults.
// =============================================================================

import { z } from 'zod';
import { nanoid } from 'nanoid';

// ─── Shared Sub-Schemas ─────────────────────────────────────────────────

export const ctaSchema = z.object({
  text: z.string().min(1),
  url: z.string(),
  style: z.enum(['primary', 'secondary', 'ghost', 'outline', 'danger', 'success']).default('primary'),
  size: z.enum(['sm', 'md', 'lg']).default('md'),
  icon: z.string().optional(),
  openInNewTab: z.boolean().default(false),
});

export const imageConfigSchema = z.object({
  id: z.string(),
  src: z.string(),
  alt: z.string(),
  width: z.number().optional(),
  height: z.number().optional(),
  loading: z.enum(['lazy', 'eager']).default('lazy'),
  placeholder: z.string().optional(),
  blurDataURL: z.string().optional(),
});

export const contentItemSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  description: z.string(),
  icon: z.string().optional(),
  image: z.string().optional(),
  url: z.string().optional(),
  badge: z.string().optional(),
  highlight: z.boolean().optional(),
});

export const testimonialSchema = z.object({
  id: z.string().default(() => nanoid()),
  name: z.string(),
  role: z.string(),
  company: z.string().default(''),
  content: z.string(),
  avatar: z.string().optional(),
  rating: z.number().min(0).max(5).optional(),
  featured: z.boolean().default(false),
});

export const faqSchema = z.object({
  id: z.string().default(() => nanoid()),
  question: z.string(),
  answer: z.string(),
  category: z.string().optional(),
  order: z.number().default(0),
});

export const statSchema = z.object({
  id: z.string().default(() => nanoid()),
  value: z.string(),
  label: z.string(),
  prefix: z.string().optional(),
  suffix: z.string().optional(),
  icon: z.string().optional(),
});

export const pricingFeatureSchema = z.object({
  text: z.string(),
  included: z.boolean(),
  icon: z.string().optional(),
});

export const pricingPlanSchema = z.object({
  id: z.string().default(() => nanoid()),
  name: z.string(),
  description: z.string().optional(),
  price: z.number(),
  originalPrice: z.number().optional(),
  period: z.enum(['monthly', 'yearly', 'one-time']).default('monthly'),
  features: z.array(pricingFeatureSchema),
  highlighted: z.boolean().default(false),
  cta: z.string().default('Get Started'),
  badge: z.string().optional(),
});

export const teamMemberSchema = z.object({
  id: z.string().default(() => nanoid()),
  name: z.string(),
  role: z.string(),
  bio: z.string().optional(),
  // AI prompt uses "avatarQuery" — accept either field name
  avatar: z.string().optional(),
  avatarQuery: z.string().optional(),
  social: z
    .object({
      linkedin: z.string().optional(),
      twitter: z.string().optional(),
      github: z.string().optional(),
    })
    .optional(),
});

export const galleryItemSchema = z.object({
  id: z.string().default(() => nanoid()),
  src: z.string(),
  alt: z.string(),
  caption: z.string().optional(),
  category: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
});

export const videoConfigSchema = z.object({
  url: z.string(),
  poster: z.string().optional(),
  autoplay: z.boolean().default(false),
  loop: z.boolean().default(false),
  muted: z.boolean().default(true),
  controls: z.boolean().default(true),
});

export const mapConfigSchema = z.object({
  address: z.string(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  zoom: z.number().default(14),
  style: z.enum(['roadmap', 'satellite', 'hybrid', 'terrain']).default('roadmap'),
});

// ─── Section-Specific Content Schemas ───────────────────────────────────

const heroContentSchema = z.object({
  headline: z.string().min(1),
  subheadline: z.string().optional(),
  body: z.string().optional(),
  cta: ctaSchema.optional(),
  secondaryCta: ctaSchema.optional(),
  badge: z.string().optional(),
  backgroundVideo: z.string().optional(),
});

const featuresContentSchema = z.object({
  headline: z.string().min(1),
  subheadline: z.string().optional(),
  body: z.string().optional(),
  items: z.array(contentItemSchema).min(1),
  columns: z.enum(['2', '3', '4']).default('3'),
  style: z.enum(['cards', 'minimal', 'centered', 'alternating']).default('cards'),
});

const servicesContentSchema = z.object({
  headline: z.string().min(1),
  subheadline: z.string().optional(),
  body: z.string().optional(),
  items: z.array(contentItemSchema).min(1),
  columns: z.enum(['2', '3', '4']).default('3'),
  showPricing: z.boolean().default(false),
});

const pricingContentSchema = z.object({
  headline: z.string().min(1),
  subheadline: z.string().optional(),
  body: z.string().optional(),
  plans: z.array(pricingPlanSchema).min(1),
  annualDiscount: z.string().optional(),
  badge: z.string().optional(),
});

const testimonialsContentSchema = z.object({
  headline: z.string().min(1),
  subheadline: z.string().optional(),
  items: z.array(testimonialSchema).min(1),
  style: z.enum(['cards', 'carousel', 'wall', 'minimal']).default('cards'),
  showRating: z.boolean().default(true),
});

const faqContentSchema = z.object({
  headline: z.string().min(1),
  subheadline: z.string().optional(),
  items: z.array(faqSchema).min(1),
  style: z.enum(['accordion', 'tabs', 'grid']).default('accordion'),
  allowMultiple: z.boolean().default(false),
});

const galleryContentSchema = z.object({
  headline: z.string().min(1),
  subheadline: z.string().optional(),
  items: z.array(galleryItemSchema).min(1),
  columns: z.enum(['2', '3', '4']).default('3'),
  style: z.enum(['grid', 'masonry', 'carousel', 'lightbox']).default('grid'),
  showCaptions: z.boolean().default(true),
});

const contactContentSchema = z.object({
  headline: z.string().min(1),
  subheadline: z.string().optional(),
  body: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  businessHours: z
    .array(
      z.object({
        days: z.string(),
        hours: z.string(),
      })
    )
    .optional(),
  map: mapConfigSchema.optional(),
  socialLinks: z
    .object({
      facebook: z.string().optional(),
      twitter: z.string().optional(),
      instagram: z.string().optional(),
      linkedin: z.string().optional(),
    })
    .optional(),
  formType: z.enum(['contact', 'quote', 'support']).default('contact'),
});

const ctaContentSchema = z.object({
  headline: z.string().min(1),
  subheadline: z.string().optional(),
  body: z.string().optional(),
  cta: ctaSchema.optional(),
  secondaryCta: ctaSchema.optional(),
  backgroundStyle: z.enum(['gradient', 'solid', 'image', 'video']).default('gradient'),
  backgroundImage: z.string().optional(),
});

const statsContentSchema = z.object({
  headline: z.string().optional(),
  subheadline: z.string().optional(),
  items: z.array(statSchema).min(1),
  style: z.enum(['default', 'cards', 'minimal', 'animated']).default('default'),
  columns: z.enum(['2', '3', '4', '5']).default('4'),
});

const teamContentSchema = z.object({
  headline: z.string().min(1),
  subheadline: z.string().optional(),
  body: z.string().optional(),
  members: z.array(teamMemberSchema).min(1),
  columns: z.enum(['2', '3', '4']).default('3'),
  style: z.enum(['cards', 'minimal', 'detailed']).default('cards'),
  showSocial: z.boolean().default(true),
});

const timelineContentSchema = z.object({
  headline: z.string().min(1),
  subheadline: z.string().optional(),
  items: z
    .array(
      z.object({
        id: z.string().default(() => nanoid()),
        year: z.string(),
        title: z.string(),
        description: z.string(),
        icon: z.string().optional(),
        image: z.string().optional(),
      })
    )
    .min(1),
  style: z.enum(['vertical', 'horizontal', 'alternating']).default('vertical'),
});

const aboutContentSchema = z.object({
  headline: z.string().min(1),
  subheadline: z.string().optional(),
  body: z.string().min(1),
  image: z.string().optional(),
  stats: z.array(statSchema).optional(),
  cta: ctaSchema.optional(),
  values: z
    .array(
      z.object({
        title: z.string(),
        description: z.string(),
        icon: z.string().optional(),
      })
    )
    .optional(),
});

const missionContentSchema = z.object({
  headline: z.string().min(1),
  mission: z.string().min(1),
  vision: z.string().min(1),
  values: z.array(z.string()).optional(),
  image: z.string().optional(),
  style: z.enum(['split', 'stacked', 'cards']).default('split'),
});

const valuesContentSchema = z.object({
  headline: z.string().min(1),
  subheadline: z.string().optional(),
  items: z
    .array(
      z.object({
        title: z.string(),
        description: z.string(),
        icon: z.string(),
      })
    )
    .min(1),
  style: z.enum(['grid', 'cards', 'minimal']).default('grid'),
});

const processContentSchema = z.object({
  headline: z.string().min(1),
  subheadline: z.string().optional(),
  steps: z
    .array(
      z.object({
        id: z.string().default(() => nanoid()),
        number: z.number(),
        title: z.string(),
        description: z.string(),
        icon: z.string().optional(),
        image: z.string().optional(),
      })
    )
    .min(1),
  style: z.enum(['numbered', 'icons', 'timeline']).default('numbered'),
});

const portfolioContentSchema = z.object({
  headline: z.string().min(1),
  subheadline: z.string().optional(),
  items: z
    .array(
      z.object({
        id: z.string().default(() => nanoid()),
        title: z.string(),
        description: z.string(),
        image: z.string(),
        category: z.string().optional(),
        url: z.string().optional(),
        client: z.string().optional(),
        year: z.string().optional(),
      })
    )
    .min(1),
  columns: z.enum(['2', '3', '4']).default('3'),
  style: z.enum(['grid', 'masonry', 'carousel']).default('grid'),
  showFilters: z.boolean().default(true),
});

const newsletterContentSchema = z.object({
  headline: z.string().min(1),
  subheadline: z.string().optional(),
  body: z.string().optional(),
  placeholder: z.string().default('Enter your email'),
  buttonText: z.string().default('Subscribe'),
  disclaimer: z.string().optional(),
  style: z.enum(['inline', 'card', 'banner', 'minimal']).default('inline'),
});

const videoContentSchema = z.object({
  headline: z.string().optional(),
  subheadline: z.string().optional(),
  video: videoConfigSchema,
  caption: z.string().optional(),
  style: z.enum(['full-width', 'embedded', 'picture-in-picture']).default('embedded'),
});

const mapContentSchema = z.object({
  headline: z.string().optional(),
  subheadline: z.string().optional(),
  map: mapConfigSchema,
  showInfo: z.boolean().default(true),
  infoTitle: z.string().optional(),
  infoAddress: z.string().optional(),
  infoPhone: z.string().optional(),
  infoEmail: z.string().optional(),
});

const accordionContentSchema = z.object({
  headline: z.string().optional(),
  items: z
    .array(
      z.object({
        id: z.string().default(() => nanoid()),
        header: z.string(),
        content: z.string(),
      })
    )
    .min(1),
  allowMultiple: z.boolean().default(false),
  defaultOpen: z.array(z.string()).default([]),
});

const tabsContentSchema = z.object({
  headline: z.string().optional(),
  items: z
    .array(
      z.object({
        id: z.string().default(() => nanoid()),
        label: z.string(),
        content: z.string(),
        icon: z.string().optional(),
      })
    )
    .min(2),
  style: z.enum(['underline', 'pills', 'cards']).default('underline'),
});

const dividerContentSchema = z.object({
  style: z.enum(['line', 'dots', 'gradient', 'image']).default('line'),
  image: z.string().optional(),
  spacing: z.enum(['sm', 'md', 'lg']).default('md'),
});

const spacerContentSchema = z.object({
  height: z.enum(['sm', 'md', 'lg', 'xl']).default('md'),
});

const htmlContentSchema = z.object({
  html: z.string().min(1),
  sandboxed: z.boolean().default(true),
});

const blogContentSchema = z.object({
  headline: z.string().min(1),
  subheadline: z.string().optional(),
  posts: z
    .array(
      z.object({
        id: z.string().default(() => nanoid()),
        title: z.string(),
        excerpt: z.string(),
        slug: z.string(),
        image: z.string().optional(),
        category: z.string().optional(),
        date: z.string(),
        readTime: z.string().optional(),
        author: z.string().optional(),
      })
    )
    .optional(),
  layout: z.enum(['grid', 'list', 'featured']).default('grid'),
  columns: z.enum(['2', '3']).default('3'),
  showExcerpt: z.boolean().default(true),
  showDate: z.boolean().default(true),
  showAuthor: z.boolean().default(true),
});

const bookingContentSchema = z.object({
  headline: z.string().min(1),
  subheadline: z.string().optional(),
  formType: z.enum(['booking', 'appointment', 'reservation']).default('booking'),
  duration: z.string().optional(),
  availableDays: z.array(z.string()).optional(),
  availableHours: z
    .object({
      start: z.string(),
      end: z.string(),
    })
    .optional(),
});

const checkoutContentSchema = z.object({
  headline: z.string().min(1),
  supportedMethods: z.array(z.string()).default(['credit-card', 'paypal']),
  currency: z.string().default('USD'),
  showOrderSummary: z.boolean().default(true),
});

const comingSoonContentSchema = z.object({
  headline: z.string().min(1),
  subheadline: z.string().optional(),
  body: z.string().optional(),
  launchDate: z.string().optional(),
  cta: ctaSchema.optional(),
  backgroundImage: z.string().optional(),
  showCountdown: z.boolean().default(true),
});

const landingContentSchema = z.object({
  headline: z.string().min(1),
  subheadline: z.string().optional(),
  body: z.string().optional(),
  cta: ctaSchema.optional(),
  features: z.array(contentItemSchema).optional(),
  testimonials: z.array(testimonialSchema).optional(),
  pricing: z.array(pricingPlanSchema).optional(),
  faq: z.array(faqSchema).optional(),
  showCountdown: z.boolean().default(false),
  countdownDate: z.string().optional(),
});

const salesContentSchema = z.object({
  headline: z.string().min(1),
  subheadline: z.string().optional(),
  body: z.string().optional(),
  cta: ctaSchema.optional(),
  price: z.string().optional(),
  originalPrice: z.string().optional(),
  features: z.array(contentItemSchema).optional(),
  testimonials: z.array(testimonialSchema).optional(),
  guarantee: z.string().optional(),
  urgencyText: z.string().optional(),
});

const termsContentSchema = z.object({
  headline: z.string().min(1),
  lastUpdated: z.string(),
  sections: z
    .array(
      z.object({
        title: z.string(),
        content: z.string(),
      })
    )
    .min(1),
});

const privacyContentSchema = z.object({
  headline: z.string().min(1),
  lastUpdated: z.string(),
  sections: z
    .array(
      z.object({
        title: z.string(),
        content: z.string(),
      })
    )
    .min(1),
});

const notFoundContentSchema = z.object({
  headline: z.string().default('404'),
  message: z.string().default('The page you\'re looking for doesn\'t exist.'),
  cta: ctaSchema.optional(),
  backgroundImage: z.string().optional(),
});

// ─── Schema Registry ────────────────────────────────────────────────────

export const SECTION_CONTENT_SCHEMAS: Record<string, z.ZodObject<z.ZodRawShape>> = {
  hero: heroContentSchema,
  features: featuresContentSchema,
  services: servicesContentSchema,
  pricing: pricingContentSchema,
  testimonials: testimonialsContentSchema,
  faq: faqContentSchema,
  gallery: galleryContentSchema,
  contact: contactContentSchema,
  cta: ctaContentSchema,
  stats: statsContentSchema,
  team: teamContentSchema,
  timeline: timelineContentSchema,
  about: aboutContentSchema,
  mission: missionContentSchema,
  values: valuesContentSchema,
  process: processContentSchema,
  portfolio: portfolioContentSchema,
  newsletter: newsletterContentSchema,
  video: videoContentSchema,
  map: mapContentSchema,
  accordion: accordionContentSchema,
  tabs: tabsContentSchema,
  divider: dividerContentSchema,
  spacer: spacerContentSchema,
  html: htmlContentSchema,
  blog: blogContentSchema,
  booking: bookingContentSchema,
  checkout: checkoutContentSchema,
  'coming-soon': comingSoonContentSchema,
  landing: landingContentSchema,
  sales: salesContentSchema,
  terms: termsContentSchema,
  privacy: privacyContentSchema,
  '404': notFoundContentSchema,
};

// ─── Validation Helpers ─────────────────────────────────────────────────

/**
 * Validate section content against its type's schema.
 * Returns the parsed content or throws a Zod error.
 */
export function validateSectionContent(
  type: string,
  content: Record<string, unknown>
): Record<string, unknown> {
  const schema = SECTION_CONTENT_SCHEMAS[type];
  if (!schema) {
    // Unknown section type — pass through with basic checks
    return content;
  }
  return schema.parse(content);
}

/**
 * Safely validate section content, returning errors instead of throwing.
 */
export function safeValidateSectionContent(
  type: string,
  content: Record<string, unknown>
): { success: true; data: Record<string, unknown> } | { success: false; errors: z.ZodError } {
  const schema = SECTION_CONTENT_SCHEMAS[type];
  if (!schema) {
    return { success: true, data: content };
  }
  const result = schema.safeParse(content);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

/**
 * Check if a section type is supported.
 */
export function isValidSectionType(type: string): boolean {
  return type in SECTION_CONTENT_SCHEMAS;
}

/**
 * Get all supported section type names.
 */
export function getValidSectionTypes(): string[] {
  return Object.keys(SECTION_CONTENT_SCHEMAS);
}
