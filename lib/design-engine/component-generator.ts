// =============================================================================
// Design Generation Engine — Component Generator
// =============================================================================
// Every component ships with 5-8 design variants. The AI selects the most
// appropriate variant per industry; variant tokens (radius, shadow, alignment,
// layout) are normalized by the consistency checker so one design language
// runs through the whole site.
// =============================================================================

import type { ComponentSpec, ComponentVariantSpec, IndustryProfile } from './types';

export const COMPONENT_TYPES = [
  'hero', 'features', 'pricing', 'faq', 'testimonials', 'gallery', 'team', 'portfolio',
  'timeline', 'services', 'blog', 'cta', 'newsletter', 'contact', 'footer', 'navbar',
  'cards', 'forms', 'statistics', 'mission', 'vision', 'values',
] as const;

export type ComponentType = (typeof COMPONENT_TYPES)[number];

const v = (id: string, label: string, layout: string, tokens: Record<string, unknown>): ComponentVariantSpec => ({ id, label, layout, tokens });

export const COMPONENT_VARIANTS: Record<ComponentType, ComponentVariantSpec[]> = {
  hero: [
    v('split', 'Split Hero', 'split', { radius: 'xl', shadow: 'soft', align: 'left', background: 'background' }),
    v('centered', 'Centered Hero', 'centered', { radius: 'lg', shadow: 'none', align: 'center', background: 'gradient-soft' }),
    v('full-bleed', 'Full-Bleed Hero', 'full', { radius: 'none', shadow: 'none', align: 'left', background: 'image-overlay' }),
    v('editorial', 'Editorial Hero', 'editorial', { radius: 'none', shadow: 'none', align: 'left', background: 'background' }),
    v('glass', 'Glass Hero', 'glass', { radius: 'xl', shadow: 'glow', align: 'center', background: 'gradient-vivid' }),
    v('minimal', 'Minimal Hero', 'centered', { radius: 'lg', shadow: 'none', align: 'center', background: 'background' }),
    v('overlay', 'Image Overlay Hero', 'full', { radius: 'none', shadow: 'none', align: 'center', background: 'image-overlay' }),
    v('stacked', 'Stacked Hero', 'stacked', { radius: 'xl', shadow: 'soft', align: 'center', background: 'surface' }),
  ],
  features: [
    v('grid-3', '3-Column Grid', 'grid-3', { columns: 3, cardStyle: 'bordered', radius: 'lg' }),
    v('grid-4', '4-Column Grid', 'grid-4', { columns: 4, cardStyle: 'flat', radius: 'md' }),
    v('bento', 'Bento Features', 'bento', { columns: 4, cardStyle: 'elevated', radius: 'xl' }),
    v('alternating', 'Alternating Rows', 'alternating', { columns: 2, cardStyle: 'none', radius: 'xl' }),
    v('cards', 'Feature Cards', 'cards', { columns: 3, cardStyle: 'elevated', radius: 'xl' }),
    v('split-list', 'Split List', 'split', { columns: 2, cardStyle: 'flat', radius: 'md' }),
    v('numbers', 'Numbered Features', 'numbered', { columns: 3, cardStyle: 'bordered', radius: 'lg' }),
  ],
  pricing: [
    v('three-tier', '3-Tier Pricing', 'grid-3', { columns: 3, highlight: 'middle', radius: 'xl' }),
    v('four-tier', '4-Tier Pricing', 'grid-4', { columns: 4, highlight: 'none', radius: 'lg' }),
    v('toggle', 'Monthly/Yearly Toggle', 'grid-3', { columns: 3, toggle: true, highlight: 'middle', radius: 'xl' }),
    v('highlighted', 'Highlighted Plan', 'grid-3', { columns: 3, highlight: 'middle', radius: '2xl', shadow: 'glow' }),
    v('side-by-side', 'Side-by-Side', 'split', { columns: 2, highlight: 'first', radius: 'xl' }),
    v('minimal-tiers', 'Minimal Tiers', 'grid-3', { columns: 3, highlight: 'none', radius: 'md', cardStyle: 'flat' }),
  ],
  faq: [
    v('accordion', 'Accordion', 'accordion', { radius: 'lg', columns: 1 }),
    v('two-column', 'Two-Column FAQ', 'split', { columns: 2, radius: 'lg' }),
    v('cards', 'FAQ Cards', 'cards', { columns: 2, radius: 'xl', cardStyle: 'elevated' }),
    v('minimal', 'Minimal FAQ', 'accordion', { radius: 'md', columns: 1, cardStyle: 'flat' }),
    v('tabs', 'Tabbed FAQ', 'tabs', { columns: 1, radius: 'lg' }),
    v('centered', 'Centered FAQ', 'centered', { columns: 1, radius: 'lg' }),
  ],
  testimonials: [
    v('grid', 'Testimonial Grid', 'grid-3', { columns: 3, cardStyle: 'bordered', radius: 'xl' }),
    v('carousel', 'Carousel', 'carousel', { columns: 1, radius: 'xl', cardStyle: 'elevated' }),
    v('featured', 'Featured Quote', 'centered', { columns: 1, radius: '2xl', shadow: 'soft' }),
    v('masonry', 'Masonry Quotes', 'masonry', { columns: 3, cardStyle: 'flat', radius: 'lg' }),
    v('logos', 'Logos + Quotes', 'split', { columns: 2, radius: 'lg' }),
    v('cards', 'Testimonial Cards', 'cards', { columns: 3, cardStyle: 'elevated', radius: 'xl' }),
  ],
  gallery: [
    v('grid', 'Uniform Grid', 'grid-3', { columns: 3, radius: 'lg', ratio: '4/3' }),
    v('masonry', 'Masonry', 'masonry', { columns: 3, radius: 'md', ratio: 'variable' }),
    v('carousel', 'Carousel', 'carousel', { columns: 1, radius: 'xl', ratio: '16/9' }),
    v('bento', 'Bento Gallery', 'bento', { columns: 4, radius: 'xl', ratio: 'mixed' }),
    v('collage', 'Collage', 'collage', { columns: 3, radius: 'none', ratio: 'mixed' }),
    v('tiles', 'Hover Tiles', 'grid-3', { columns: 3, radius: 'lg', ratio: '1/1', hover: 'zoom' }),
  ],
  team: [
    v('grid', 'Team Grid', 'grid-4', { columns: 4, radius: 'xl', photo: 'circle' }),
    v('cards', 'Team Cards', 'grid-3', { columns: 3, radius: 'xl', photo: 'rounded' }),
    v('rows', 'Team Rows', 'rows', { columns: 2, radius: 'lg', photo: 'circle' }),
    v('spotlight', 'Spotlight', 'alternating', { columns: 2, radius: '2xl', photo: 'rounded' }),
    v('minimal', 'Minimal Team', 'grid-4', { columns: 4, radius: 'md', photo: 'circle', cardStyle: 'flat' }),
    v('masonry', 'Masonry Team', 'masonry', { columns: 3, radius: 'lg', photo: 'rounded' }),
  ],
  portfolio: [
    v('grid', 'Project Grid', 'grid-3', { columns: 3, radius: 'lg', ratio: '4/3' }),
    v('masonry', 'Masonry Work', 'masonry', { columns: 3, radius: 'md' }),
    v('bento', 'Bento Portfolio', 'bento', { columns: 4, radius: 'xl' }),
    v('carousel', 'Showcase Carousel', 'carousel', { columns: 1, radius: 'xl', ratio: '16/9' }),
    v('editorial', 'Editorial Case List', 'list', { columns: 1, radius: 'none' }),
    v('alternating', 'Case Studies', 'alternating', { columns: 2, radius: 'xl' }),
  ],
  timeline: [
    v('vertical', 'Vertical Timeline', 'timeline-v', { columns: 1, radius: 'lg' }),
    v('horizontal', 'Horizontal Timeline', 'timeline-h', { columns: 4, radius: 'lg' }),
    v('alternating', 'Alternating Timeline', 'timeline-a', { columns: 2, radius: 'xl' }),
    v('numbered', 'Numbered Steps', 'numbered', { columns: 3, radius: 'xl', cardStyle: 'elevated' }),
    v('minimal', 'Minimal Steps', 'numbered', { columns: 3, radius: 'md', cardStyle: 'flat' }),
  ],
  services: [
    v('cards', 'Service Cards', 'grid-3', { columns: 3, cardStyle: 'elevated', radius: 'xl' }),
    v('split', 'Split Services', 'split', { columns: 2, radius: 'lg' }),
    v('numbered', 'Numbered Services', 'numbered', { columns: 3, cardStyle: 'bordered', radius: 'lg' }),
    v('icons', 'Icon Services', 'grid-4', { columns: 4, cardStyle: 'flat', radius: 'md' }),
    v('pricing-like', 'Service Tiers', 'grid-3', { columns: 3, cardStyle: 'bordered', radius: 'xl' }),
    v('alternating', 'Alternating Services', 'alternating', { columns: 2, radius: 'xl' }),
  ],
  blog: [
    v('grid', 'Blog Grid', 'grid-3', { columns: 3, radius: 'lg', ratio: '16/9' }),
    v('featured', 'Featured + Grid', 'featured', { columns: 3, radius: 'xl' }),
    v('list', 'Article List', 'list', { columns: 1, radius: 'lg' }),
    v('magazine', 'Magazine', 'magazine', { columns: 3, radius: 'md' }),
    v('masonry', 'Masonry Posts', 'masonry', { columns: 3, radius: 'lg' }),
    v('cards', 'Post Cards', 'cards', { columns: 3, cardStyle: 'elevated', radius: 'xl' }),
  ],
  cta: [
    v('banner', 'CTA Banner', 'banner', { radius: '2xl', shadow: 'soft', background: 'primary' }),
    v('split', 'Split CTA', 'split', { radius: 'xl', background: 'gradient-soft' }),
    v('centered', 'Centered CTA', 'centered', { radius: 'none', background: 'background' }),
    v('glass', 'Glass CTA', 'glass', { radius: '2xl', shadow: 'glow', background: 'gradient-vivid' }),
    v('card', 'CTA Card', 'card', { radius: '2xl', shadow: 'soft', background: 'surface' }),
    v('full', 'Full-Width CTA', 'full', { radius: 'none', background: 'primary' }),
  ],
  newsletter: [
    v('split', 'Split Newsletter', 'split', { radius: 'xl', background: 'surface' }),
    v('centered', 'Centered Newsletter', 'centered', { radius: '2xl', background: 'surface' }),
    v('inline', 'Inline Bar', 'inline', { radius: 'lg', background: 'background' }),
    v('card', 'Newsletter Card', 'card', { radius: 'xl', shadow: 'soft', background: 'surface' }),
    v('footer', 'Footer Newsletter', 'footer', { radius: 'md', background: 'background' }),
  ],
  contact: [
    v('split', 'Split Contact', 'split', { radius: 'xl', cardStyle: 'elevated' }),
    v('cards', 'Contact Cards + Form', 'cards', { radius: 'xl', columns: 2 }),
    v('centered', 'Centered Form', 'centered', { radius: 'xl', cardStyle: 'bordered' }),
    v('minimal', 'Minimal Contact', 'split', { radius: 'md', cardStyle: 'flat' }),
    v('full', 'Full-Width Form', 'full', { radius: 'lg', cardStyle: 'bordered' }),
  ],
  footer: [
    v('columns', 'Multi-Column Footer', 'columns', { columns: 4, radius: 'none' }),
    v('split', 'Split Footer', 'split', { columns: 2, radius: 'none' }),
    v('centered', 'Centered Footer', 'centered', { columns: 1, radius: 'none' }),
    v('newsletter', 'Newsletter Footer', 'columns', { columns: 4, newsletter: true, radius: 'none' }),
    v('minimal', 'Minimal Footer', 'columns', { columns: 3, radius: 'none' }),
  ],
  navbar: [
    v('classic', 'Classic Navbar', 'classic', { radius: 'none', background: 'background', sticky: true }),
    v('floating', 'Floating Pill', 'floating', { radius: 'full', background: 'surface', shadow: 'soft', sticky: true }),
    v('glass', 'Glass Navbar', 'glass', { radius: 'xl', background: 'glass', shadow: 'soft', sticky: true }),
    v('minimal', 'Minimal Navbar', 'classic', { radius: 'none', background: 'transparent', sticky: true }),
    v('centered-logo', 'Centered Logo', 'centered', { radius: 'none', background: 'background', sticky: true }),
    v('top-bar', 'Top Bar + Nav', 'topbar', { radius: 'none', background: 'surface', sticky: true }),
  ],
  cards: [
    v('elevated', 'Elevated Card', 'elevated', { radius: 'xl', shadow: 'soft', padding: '32px' }),
    v('bordered', 'Bordered Card', 'bordered', { radius: 'lg', shadow: 'none', padding: '28px' }),
    v('flat', 'Flat Card', 'flat', { radius: 'md', shadow: 'none', padding: '24px' }),
    v('glass', 'Glass Card', 'glass', { radius: 'xl', shadow: 'glow', padding: '32px' }),
    v('image', 'Image Card', 'image', { radius: 'lg', shadow: 'soft', padding: '0px' }),
    v('hover', 'Hover-Lift Card', 'elevated', { radius: 'xl', shadow: 'soft', hover: 'lift', padding: '32px' }),
  ],
  forms: [
    v('bordered', 'Bordered Form', 'bordered', { radius: 'lg', shadow: 'none', layout: 'stacked' }),
    v('floating', 'Floating Labels', 'floating', { radius: 'lg', shadow: 'none', layout: 'stacked' }),
    v('split', 'Split Form', 'split', { radius: 'xl', shadow: 'soft', layout: 'grid' }),
    v('minimal', 'Minimal Form', 'minimal', { radius: 'md', shadow: 'none', layout: 'stacked' }),
    v('inline', 'Inline Form', 'inline', { radius: 'lg', shadow: 'none', layout: 'inline' }),
    v('card', 'Form Card', 'card', { radius: 'xl', shadow: 'soft', layout: 'stacked' }),
  ],
  statistics: [
    v('grid', 'Stat Grid', 'grid-4', { columns: 4, cardStyle: 'flat' }),
    v('banner', 'Stat Banner', 'banner', { columns: 4, background: 'primary', radius: 'xl' }),
    v('cards', 'Stat Cards', 'cards', { columns: 4, cardStyle: 'elevated', radius: 'xl' }),
    v('split', 'Split Stats', 'split', { columns: 2, cardStyle: 'flat' }),
    v('minimal', 'Minimal Stats', 'grid-4', { columns: 4, cardStyle: 'flat', radius: 'md' }),
  ],
  mission: [
    v('split', 'Split Mission', 'split', { radius: 'xl', background: 'background' }),
    v('centered', 'Centered Mission', 'centered', { radius: 'none', background: 'background' }),
    v('quote', 'Mission Quote', 'quote', { radius: '2xl', shadow: 'soft', background: 'surface' }),
    v('image', 'Mission with Image', 'image-left', { radius: 'xl', background: 'background' }),
    v('minimal', 'Minimal Mission', 'centered', { radius: 'none', background: 'background' }),
  ],
  vision: [
    v('split', 'Split Vision', 'split', { radius: 'xl', background: 'background' }),
    v('centered', 'Centered Vision', 'centered', { radius: 'none', background: 'background' }),
    v('quote', 'Vision Quote', 'quote', { radius: '2xl', shadow: 'soft', background: 'surface' }),
    v('image', 'Vision with Image', 'image-right', { radius: 'xl', background: 'background' }),
    v('minimal', 'Minimal Vision', 'centered', { radius: 'none', background: 'background' }),
  ],
  values: [
    v('grid', 'Values Grid', 'grid-3', { columns: 3, cardStyle: 'bordered', radius: 'xl' }),
    v('cards', 'Value Cards', 'cards', { columns: 3, cardStyle: 'elevated', radius: 'xl' }),
    v('numbered', 'Numbered Values', 'numbered', { columns: 3, cardStyle: 'flat', radius: 'lg' }),
    v('icons', 'Icon Values', 'grid-4', { columns: 4, cardStyle: 'flat', radius: 'md' }),
    v('alternating', 'Alternating Values', 'alternating', { columns: 2, radius: 'xl' }),
    v('minimal', 'Minimal Values', 'grid-3', { columns: 3, cardStyle: 'flat', radius: 'md' }),
  ],
};

/** Hero variant preference per industry (all other components follow layout harmony). */
const HERO_VARIANT_PREFERENCES: Record<string, string> = {
  'saas': 'split',
  'ai-startup': 'glass',
  'restaurant': 'editorial',
  'agency': 'editorial',
  'photography': 'full-bleed',
  'law-firm': 'split',
  'hotel': 'full-bleed',
  'travel': 'full-bleed',
  'music': 'glass',
  'creator': 'stacked',
  'barbershop': 'full-bleed',
  'gym': 'full-bleed',
  'automotive': 'full-bleed',
  'crypto': 'glass',
  'wedding': 'editorial',
  'fashion': 'editorial',
  'portfolio': 'minimal',
  'architecture': 'minimal',
};

/**
 * Generate a ComponentSpec for every component type, choosing the variant that
 * best fits the industry (preference table + layout harmony with the chosen
 * page layout, falling back to the first variant).
 */
export function generateComponents(profile: IndustryProfile, preferredLayout: string): ComponentSpec[] {
  const heroPreference = HERO_VARIANT_PREFERENCES[profile.id];
  return COMPONENT_TYPES.map((type) => {
    const variants = COMPONENT_VARIANTS[type];
    let chosen = variants[0].id;
    if (type === 'hero' && heroPreference) {
      chosen = variants.some((variant) => variant.id === heroPreference) ? heroPreference : variants[0].id;
    }
    // Bias card-style components toward the page layout language.
    const layoutMatch = variants.find((variant) => variant.layout === preferredLayout);
    if (layoutMatch && type !== 'hero') {
      chosen = layoutMatch.id;
    } else if (variants.some((variant) => variant.layout === 'cards') && ['bento-grid', 'card-grid', 'premium-saas'].includes(preferredLayout)) {
      const cardsVariant = variants.find((variant) => variant.layout === 'cards');
      if (cardsVariant) {
        chosen = cardsVariant.id;
      }
    }
    return { type, variants, chosenVariant: chosen };
  });
}

export function getComponentVariants(type: ComponentType): ComponentVariantSpec[] {
  return COMPONENT_VARIANTS[type] ?? [];
}

export function listComponentTypes(): string[] {
  return [...COMPONENT_TYPES];
}
