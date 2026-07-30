// =============================================================================
// Section Type Registry
// =============================================================================
// Central registry mapping each SectionType to its configuration:
// default styles, valid layouts, image requirements, and content schema.
//
// Adding a new section type = add one entry here + one schema in section-schemas.ts
// =============================================================================

import { nanoid } from 'nanoid';
import { SECTION_CONTENT_SCHEMAS, validateSectionContent } from '../schemas/section-schemas';
import type { SectionType, LayoutType, SectionStyles, Animation, ImageConfig, SectionVisibility } from '@/types';

// ─── Image Requirements ─────────────────────────────────────────────────

export interface ImageRequirement {
  /** How many images this section type needs */
  count: number;
  /** Ideal aspect ratio (width:height) */
  aspectRatio: string;
  /** Image query context hints */
  contexts: string[];
}

// ─── Section Type Configuration ─────────────────────────────────────────

export interface SectionTypeConfig {
  type: SectionType;
  label: string;
  description: string;
  category: 'hero' | 'content' | 'social' | 'commerce' | 'forms' | 'media' | 'utility' | 'layout' | 'legal' | 'special';
  validLayouts: LayoutType[];
  defaultLayout: LayoutType;
  defaultStyles: Partial<SectionStyles>;
  defaultAnimations: Animation[];
  imageRequirements: ImageRequirement;
  /** Whether this section type typically appears only once per page */
  singleton: boolean;
  /** Whether this section requires specific fields in content */
  requiredFields: string[];
  /** Recommended page contexts where this section is commonly used */
  recommendedPages: string[];
}

// ─── Registry ───────────────────────────────────────────────────────────

const DEFAULT_SPACING = {
  top: '4rem',
  right: '1.5rem',
  bottom: '4rem',
  left: '1.5rem',
};

const COMPACT_SPACING = {
  top: '2rem',
  right: '1.5rem',
  bottom: '2rem',
  left: '1.5rem',
};

const MINIMAL_ANIMATION: Animation[] = [
  { type: 'fade-in-up', duration: 600, delay: 0, easing: 'ease-out', once: true },
];

export const SECTION_REGISTRY: Record<string, SectionTypeConfig> = {
  hero: {
    type: 'hero',
    label: 'Hero',
    description: 'Large header section with headline, CTA, and optional image/video',
    category: 'hero',
    validLayouts: ['centered', 'split', 'image-left', 'image-right', 'full-width'],
    defaultLayout: 'centered',
    defaultStyles: {
      padding: { top: '6rem', right: '1.5rem', bottom: '6rem', left: '1.5rem' },
      backgroundColor: null,
      textAlign: 'center',
      maxWidth: '1200px',
    },
    defaultAnimations: MINIMAL_ANIMATION,
    imageRequirements: {
      count: 1,
      aspectRatio: '16:9',
      contexts: ['hero background', 'main banner'],
    },
    singleton: true,
    requiredFields: ['headline'],
    recommendedPages: ['home'],
  },

  features: {
    type: 'features',
    label: 'Features',
    description: 'Grid of feature items with icons and descriptions',
    category: 'content',
    validLayouts: ['grid-2', 'grid-3', 'grid-4', 'cards', 'centered'],
    defaultLayout: 'grid-3',
    defaultStyles: {
      padding: DEFAULT_SPACING,
      textAlign: 'center',
    },
    defaultAnimations: MINIMAL_ANIMATION,
    imageRequirements: { count: 0, aspectRatio: '1:1', contexts: [] },
    singleton: false,
    requiredFields: ['headline', 'items'],
    recommendedPages: ['home', 'about', 'services'],
  },

  services: {
    type: 'services',
    label: 'Services',
    description: 'Service offerings with descriptions and optional pricing',
    category: 'content',
    validLayouts: ['grid-2', 'grid-3', 'grid-4', 'cards', 'split'],
    defaultLayout: 'grid-3',
    defaultStyles: { padding: DEFAULT_SPACING },
    defaultAnimations: MINIMAL_ANIMATION,
    imageRequirements: { count: 0, aspectRatio: '1:1', contexts: [] },
    singleton: false,
    requiredFields: ['headline', 'items'],
    recommendedPages: ['services', 'home'],
  },

  pricing: {
    type: 'pricing',
    label: 'Pricing',
    description: 'Pricing plans comparison with features',
    category: 'commerce',
    validLayouts: ['grid-2', 'grid-3', 'cards', 'centered'],
    defaultLayout: 'grid-3',
    defaultStyles: { padding: DEFAULT_SPACING, textAlign: 'center' },
    defaultAnimations: MINIMAL_ANIMATION,
    imageRequirements: { count: 0, aspectRatio: '1:1', contexts: [] },
    singleton: true,
    requiredFields: ['headline', 'plans'],
    recommendedPages: ['pricing', 'home'],
  },

  testimonials: {
    type: 'testimonials',
    label: 'Testimonials',
    description: 'Customer testimonials with ratings and photos',
    category: 'social',
    validLayouts: ['cards', 'carousel', 'masonry', 'centered'],
    defaultLayout: 'cards',
    defaultStyles: { padding: DEFAULT_SPACING, textAlign: 'center' },
    defaultAnimations: MINIMAL_ANIMATION,
    imageRequirements: { count: 0, aspectRatio: '1:1', contexts: ['avatar photos'] },
    singleton: false,
    requiredFields: ['headline', 'items'],
    recommendedPages: ['home', 'about'],
  },

  faq: {
    type: 'faq',
    label: 'FAQ',
    description: 'Frequently asked questions in accordion or grid',
    category: 'content',
    validLayouts: ['accordion', 'grid-2', 'centered'],
    defaultLayout: 'accordion',
    defaultStyles: { padding: DEFAULT_SPACING, maxWidth: '800px' },
    defaultAnimations: [],
    imageRequirements: { count: 0, aspectRatio: '1:1', contexts: [] },
    singleton: true,
    requiredFields: ['headline', 'items'],
    recommendedPages: ['faq', 'home', 'services'],
  },

  gallery: {
    type: 'gallery',
    label: 'Gallery',
    description: 'Image gallery with grid or masonry layout',
    category: 'media',
    validLayouts: ['grid-2', 'grid-3', 'grid-4', 'masonry', 'carousel'],
    defaultLayout: 'grid-3',
    defaultStyles: { padding: DEFAULT_SPACING },
    defaultAnimations: MINIMAL_ANIMATION,
    imageRequirements: { count: 6, aspectRatio: '4:3', contexts: ['gallery photos'] },
    singleton: false,
    requiredFields: ['headline', 'items'],
    recommendedPages: ['gallery', 'portfolio', 'home'],
  },

  contact: {
    type: 'contact',
    label: 'Contact',
    description: 'Contact form with map and business info',
    category: 'forms',
    validLayouts: ['split', 'centered', 'full-width'],
    defaultLayout: 'split',
    defaultStyles: { padding: DEFAULT_SPACING },
    defaultAnimations: [],
    imageRequirements: { count: 0, aspectRatio: '16:9', contexts: [] },
    singleton: true,
    requiredFields: ['headline'],
    recommendedPages: ['contact', 'home'],
  },

  cta: {
    type: 'cta',
    label: 'Call to Action',
    description: 'Prominent call-to-action with headline and button',
    category: 'content',
    validLayouts: ['centered', 'split', 'full-width'],
    defaultLayout: 'centered',
    defaultStyles: {
      padding: { top: '5rem', right: '1.5rem', bottom: '5rem', left: '1.5rem' },
      textAlign: 'center',
      backgroundColor: null,
    },
    defaultAnimations: MINIMAL_ANIMATION,
    imageRequirements: { count: 0, aspectRatio: '16:9', contexts: [] },
    singleton: false,
    requiredFields: ['headline'],
    recommendedPages: ['home', 'services', 'pricing'],
  },

  stats: {
    type: 'stats',
    label: 'Statistics',
    description: 'Key statistics and numbers',
    category: 'content',
    validLayouts: ['grid-2', 'grid-3', 'grid-4', 'centered'],
    defaultLayout: 'grid-4',
    defaultStyles: {
      padding: DEFAULT_SPACING,
      textAlign: 'center',
      backgroundColor: null,
    },
    defaultAnimations: MINIMAL_ANIMATION,
    imageRequirements: { count: 0, aspectRatio: '1:1', contexts: [] },
    singleton: false,
    requiredFields: ['items'],
    recommendedPages: ['home', 'about'],
  },

  team: {
    type: 'team',
    label: 'Team',
    description: 'Team member profiles with bios and social links',
    category: 'social',
    validLayouts: ['grid-2', 'grid-3', 'grid-4', 'cards'],
    defaultLayout: 'grid-3',
    defaultStyles: { padding: DEFAULT_SPACING, textAlign: 'center' },
    defaultAnimations: MINIMAL_ANIMATION,
    imageRequirements: { count: 0, aspectRatio: '1:1', contexts: ['team member photos'] },
    singleton: false,
    requiredFields: ['headline', 'members'],
    recommendedPages: ['about', 'team'],
  },

  timeline: {
    type: 'timeline',
    label: 'Timeline',
    description: 'Chronological timeline of events or milestones',
    category: 'content',
    validLayouts: ['timeline', 'centered'],
    defaultLayout: 'timeline',
    defaultStyles: { padding: DEFAULT_SPACING },
    defaultAnimations: MINIMAL_ANIMATION,
    imageRequirements: { count: 0, aspectRatio: '1:1', contexts: [] },
    singleton: false,
    requiredFields: ['headline', 'items'],
    recommendedPages: ['about', 'history'],
  },

  about: {
    type: 'about',
    label: 'About',
    description: 'Company about section with story, stats, and values',
    category: 'content',
    validLayouts: ['split', 'centered', 'full-width'],
    defaultLayout: 'split',
    defaultStyles: { padding: DEFAULT_SPACING },
    defaultAnimations: MINIMAL_ANIMATION,
    imageRequirements: { count: 1, aspectRatio: '4:3', contexts: ['company photo', 'team photo'] },
    singleton: true,
    requiredFields: ['headline', 'body'],
    recommendedPages: ['about'],
  },

  mission: {
    type: 'mission',
    label: 'Mission & Vision',
    description: 'Mission statement, vision, and core values',
    category: 'content',
    validLayouts: ['split', 'centered', 'grid-2'],
    defaultLayout: 'split',
    defaultStyles: { padding: DEFAULT_SPACING, textAlign: 'center' },
    defaultAnimations: MINIMAL_ANIMATION,
    imageRequirements: { count: 1, aspectRatio: '4:3', contexts: ['mission image'] },
    singleton: true,
    requiredFields: ['headline', 'mission', 'vision'],
    recommendedPages: ['about'],
  },

  values: {
    type: 'values',
    label: 'Values',
    description: 'Company core values grid',
    category: 'content',
    validLayouts: ['grid-2', 'grid-3', 'grid-4', 'cards'],
    defaultLayout: 'grid-3',
    defaultStyles: { padding: DEFAULT_SPACING, textAlign: 'center' },
    defaultAnimations: MINIMAL_ANIMATION,
    imageRequirements: { count: 0, aspectRatio: '1:1', contexts: [] },
    singleton: true,
    requiredFields: ['headline', 'items'],
    recommendedPages: ['about'],
  },

  process: {
    type: 'process',
    label: 'Process',
    description: 'Step-by-step process or workflow',
    category: 'content',
    validLayouts: ['grid-2', 'grid-3', 'grid-4', 'timeline', 'centered'],
    defaultLayout: 'grid-3',
    defaultStyles: { padding: DEFAULT_SPACING, textAlign: 'center' },
    defaultAnimations: MINIMAL_ANIMATION,
    imageRequirements: { count: 0, aspectRatio: '1:1', contexts: [] },
    singleton: false,
    requiredFields: ['headline', 'steps'],
    recommendedPages: ['home', 'services', 'about'],
  },

  portfolio: {
    type: 'portfolio',
    label: 'Portfolio',
    description: 'Project portfolio showcase with filtering',
    category: 'media',
    validLayouts: ['grid-2', 'grid-3', 'masonry', 'carousel'],
    defaultLayout: 'grid-3',
    defaultStyles: { padding: DEFAULT_SPACING },
    defaultAnimations: MINIMAL_ANIMATION,
    imageRequirements: { count: 4, aspectRatio: '4:3', contexts: ['portfolio project photos'] },
    singleton: false,
    requiredFields: ['headline', 'items'],
    recommendedPages: ['portfolio', 'home'],
  },

  newsletter: {
    type: 'newsletter',
    label: 'Newsletter',
    description: 'Email newsletter signup form',
    category: 'forms',
    validLayouts: ['centered', 'split', 'full-width'],
    defaultLayout: 'centered',
    defaultStyles: {
      padding: DEFAULT_SPACING,
      textAlign: 'center',
      backgroundColor: null,
    },
    defaultAnimations: [],
    imageRequirements: { count: 0, aspectRatio: '1:1', contexts: [] },
    singleton: true,
    requiredFields: ['headline'],
    recommendedPages: ['home', 'blog'],
  },

  video: {
    type: 'video',
    label: 'Video',
    description: 'Embedded video player with optional caption',
    category: 'media',
    validLayouts: ['centered', 'full-width', 'split'],
    defaultLayout: 'centered',
    defaultStyles: { padding: DEFAULT_SPACING },
    defaultAnimations: [],
    imageRequirements: { count: 0, aspectRatio: '16:9', contexts: [] },
    singleton: false,
    requiredFields: ['video'],
    recommendedPages: ['home', 'about'],
  },

  map: {
    type: 'map',
    label: 'Map',
    description: 'Interactive map with business location',
    category: 'utility',
    validLayouts: ['full-width', 'split', 'centered'],
    defaultLayout: 'full-width',
    defaultStyles: { padding: COMPACT_SPACING },
    defaultAnimations: [],
    imageRequirements: { count: 0, aspectRatio: '16:9', contexts: [] },
    singleton: true,
    requiredFields: ['map'],
    recommendedPages: ['contact'],
  },

  accordion: {
    type: 'accordion',
    label: 'Accordion',
    description: 'Expandable accordion content sections',
    category: 'layout',
    validLayouts: ['accordion', 'centered'],
    defaultLayout: 'accordion',
    defaultStyles: { padding: DEFAULT_SPACING, maxWidth: '800px' },
    defaultAnimations: [],
    imageRequirements: { count: 0, aspectRatio: '1:1', contexts: [] },
    singleton: false,
    requiredFields: ['items'],
    recommendedPages: ['faq', 'services'],
  },

  tabs: {
    type: 'tabs',
    label: 'Tabs',
    description: 'Tabbed content navigation',
    category: 'layout',
    validLayouts: ['tabs', 'centered'],
    defaultLayout: 'tabs',
    defaultStyles: { padding: DEFAULT_SPACING },
    defaultAnimations: [],
    imageRequirements: { count: 0, aspectRatio: '1:1', contexts: [] },
    singleton: false,
    requiredFields: ['items'],
    recommendedPages: ['services', 'features'],
  },

  divider: {
    type: 'divider',
    label: 'Divider',
    description: 'Visual section divider',
    category: 'utility',
    validLayouts: ['full-width'],
    defaultLayout: 'full-width',
    defaultStyles: { padding: COMPACT_SPACING },
    defaultAnimations: [],
    imageRequirements: { count: 0, aspectRatio: '1:1', contexts: [] },
    singleton: false,
    requiredFields: [],
    recommendedPages: [],
  },

  spacer: {
    type: 'spacer',
    label: 'Spacer',
    description: 'Empty vertical space',
    category: 'utility',
    validLayouts: ['full-width'],
    defaultLayout: 'full-width',
    defaultStyles: { padding: { top: '0', right: '0', bottom: '0', left: '0' } },
    defaultAnimations: [],
    imageRequirements: { count: 0, aspectRatio: '1:1', contexts: [] },
    singleton: false,
    requiredFields: [],
    recommendedPages: [],
  },

  html: {
    type: 'html',
    label: 'Custom HTML',
    description: 'Raw custom HTML embed',
    category: 'utility',
    validLayouts: ['full-width', 'centered'],
    defaultLayout: 'full-width',
    defaultStyles: { padding: COMPACT_SPACING },
    defaultAnimations: [],
    imageRequirements: { count: 0, aspectRatio: '1:1', contexts: [] },
    singleton: false,
    requiredFields: ['html'],
    recommendedPages: [],
  },

  blog: {
    type: 'blog',
    label: 'Blog',
    description: 'Blog post listing with excerpts',
    category: 'content',
    validLayouts: ['grid-2', 'grid-3', 'cards', 'centered'],
    defaultLayout: 'grid-3',
    defaultStyles: { padding: DEFAULT_SPACING },
    defaultAnimations: MINIMAL_ANIMATION,
    imageRequirements: { count: 0, aspectRatio: '16:9', contexts: ['blog post thumbnails'] },
    singleton: true,
    requiredFields: ['headline'],
    recommendedPages: ['blog', 'home'],
  },

  booking: {
    type: 'booking',
    label: 'Booking',
    description: 'Booking/appointment scheduling form',
    category: 'forms',
    validLayouts: ['centered', 'split'],
    defaultLayout: 'centered',
    defaultStyles: { padding: DEFAULT_SPACING },
    defaultAnimations: [],
    imageRequirements: { count: 0, aspectRatio: '1:1', contexts: [] },
    singleton: true,
    requiredFields: ['headline'],
    recommendedPages: ['booking', 'services'],
  },

  checkout: {
    type: 'checkout',
    label: 'Checkout',
    description: 'Checkout/payment form',
    category: 'commerce',
    validLayouts: ['centered', 'split'],
    defaultLayout: 'centered',
    defaultStyles: { padding: DEFAULT_SPACING },
    defaultAnimations: [],
    imageRequirements: { count: 0, aspectRatio: '1:1', contexts: [] },
    singleton: true,
    requiredFields: ['headline'],
    recommendedPages: ['checkout'],
  },

  'coming-soon': {
    type: 'coming-soon',
    label: 'Coming Soon',
    description: 'Coming soon landing page with countdown',
    category: 'special',
    validLayouts: ['centered', 'full-width'],
    defaultLayout: 'centered',
    defaultStyles: {
      padding: { top: '8rem', right: '1.5rem', bottom: '8rem', left: '1.5rem' },
      textAlign: 'center',
    },
    defaultAnimations: MINIMAL_ANIMATION,
    imageRequirements: { count: 1, aspectRatio: '16:9', contexts: ['background image'] },
    singleton: true,
    requiredFields: ['headline'],
    recommendedPages: ['coming-soon'],
  },

  landing: {
    type: 'landing',
    label: 'Landing Page',
    description: 'Full landing page with features, testimonials, and CTA',
    category: 'special',
    validLayouts: ['centered', 'full-width'],
    defaultLayout: 'full-width',
    defaultStyles: { padding: DEFAULT_SPACING },
    defaultAnimations: MINIMAL_ANIMATION,
    imageRequirements: { count: 1, aspectRatio: '16:9', contexts: ['hero image'] },
    singleton: true,
    requiredFields: ['headline', 'cta'],
    recommendedPages: ['landing'],
  },

  sales: {
    type: 'sales',
    label: 'Sales Page',
    description: 'Long-form sales page with benefits, testimonials, and urgency',
    category: 'special',
    validLayouts: ['centered', 'full-width'],
    defaultLayout: 'full-width',
    defaultStyles: { padding: DEFAULT_SPACING },
    defaultAnimations: MINIMAL_ANIMATION,
    imageRequirements: { count: 1, aspectRatio: '16:9', contexts: ['product image'] },
    singleton: true,
    requiredFields: ['headline', 'cta'],
    recommendedPages: ['sales'],
  },

  terms: {
    type: 'terms',
    label: 'Terms of Service',
    description: 'Legal terms of service page',
    category: 'legal',
    validLayouts: ['centered'],
    defaultLayout: 'centered',
    defaultStyles: { padding: DEFAULT_SPACING, maxWidth: '800px' },
    defaultAnimations: [],
    imageRequirements: { count: 0, aspectRatio: '1:1', contexts: [] },
    singleton: true,
    requiredFields: ['headline', 'lastUpdated', 'sections'],
    recommendedPages: ['terms'],
  },

  privacy: {
    type: 'privacy',
    label: 'Privacy Policy',
    description: 'Privacy policy page',
    category: 'legal',
    validLayouts: ['centered'],
    defaultLayout: 'centered',
    defaultStyles: { padding: DEFAULT_SPACING, maxWidth: '800px' },
    defaultAnimations: [],
    imageRequirements: { count: 0, aspectRatio: '1:1', contexts: [] },
    singleton: true,
    requiredFields: ['headline', 'lastUpdated', 'sections'],
    recommendedPages: ['privacy'],
  },

  '404': {
    type: '404',
    label: '404 Not Found',
    description: 'Custom 404 error page',
    category: 'special',
    validLayouts: ['centered'],
    defaultLayout: 'centered',
    defaultStyles: {
      padding: { top: '8rem', right: '1.5rem', bottom: '8rem', left: '1.5rem' },
      textAlign: 'center',
    },
    defaultAnimations: [],
    imageRequirements: { count: 0, aspectRatio: '1:1', contexts: [] },
    singleton: true,
    requiredFields: [],
    recommendedPages: ['404'],
  },
};

// ─── Public API ─────────────────────────────────────────────────────────

/**
 * Get the full configuration for a section type.
 */
export function getSectionConfig(type: string): SectionTypeConfig | undefined {
  return SECTION_REGISTRY[type];
}

/**
 * Create a default section for a given type.
 */
export function getDefaultSection(type: string): {
  type: string;
  layout: string;
  content: Record<string, unknown>;
  styles: Partial<SectionStyles>;
  animations: Animation[];
  images: ImageConfig[];
  visibility: SectionVisibility;
  order: number;
  id: string;
  customId: string | null;
  isLocked: boolean;
} | null {
  const config = SECTION_REGISTRY[type];
  if (!config) return null;

  return {
    id: nanoid(),
    customId: null,
    type: config.type,
    layout: config.defaultLayout,
    content: {},
    styles: config.defaultStyles,
    animations: config.defaultAnimations,
    images: [],
    visibility: { desktop: true, tablet: true, mobile: true },
    order: 0,
    isLocked: false,
  };
}

/**
 * Validate section content against its type schema.
 */
export function validateSection(type: string, content: Record<string, unknown>): { valid: boolean; errors?: string[] } {
  const config = SECTION_REGISTRY[type];
  if (!config) {
    return { valid: false, errors: [`Unknown section type: ${type}`] };
  }

  // Check required fields
  const missingFields = config.requiredFields.filter((field) => !(field in content) || content[field] === undefined || content[field] === '');
  if (missingFields.length > 0) {
    return { valid: false, errors: [`Missing required fields: ${missingFields.join(', ')}`] };
  }

  // Validate against Zod schema
  try {
    validateSectionContent(type, content);
    return { valid: true };
  } catch (err) {
    if (err instanceof Error) {
      return { valid: false, errors: [err.message] };
    }
    return { valid: false, errors: ['Validation failed'] };
  }
}

/**
 * Check if a layout is valid for a given section type.
 */
export function isValidLayout(type: string, layout: string): boolean {
  const config = SECTION_REGISTRY[type];
  if (!config) return false;
  return config.validLayouts.includes(layout as LayoutType);
}

/**
 * Get all section types in a given category.
 */
export function getSectionTypesByCategory(category: SectionTypeConfig['category']): SectionTypeConfig[] {
  return Object.values(SECTION_REGISTRY).filter((config) => config.category === category);
}

/**
 * Get all singleton section types (can only appear once per page).
 */
export function getSingletonSectionTypes(): SectionTypeConfig[] {
  return Object.values(SECTION_REGISTRY).filter((config) => config.singleton);
}

/**
 * Get recommended sections for a given page type.
 */
export function getRecommendedSections(pageType: string): SectionTypeConfig[] {
  return Object.values(SECTION_REGISTRY).filter((config) =>
    config.recommendedPages.includes(pageType)
  );
}

/**
 * Get all valid section type names.
 */
export function getValidSectionTypes(): string[] {
  return Object.keys(SECTION_REGISTRY);
}
