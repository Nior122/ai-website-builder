// =============================================================================
// Website Builder — Component Library
// =============================================================================
// 18 reusable components, each with multiple variants. The renderer and the
// editor's insert-section panel consume this registry so every component is
// consistent with the active theme tokens.
// =============================================================================

import type { LibraryComponent } from './types';

export const COMPONENT_LIBRARY: LibraryComponent[] = [
  {
    id: 'button',
    label: 'Buttons',
    variants: [
      { id: 'solid', label: 'Solid', tokens: { style: 'solid', radius: 'md', shadow: 'none' } },
      { id: 'outline', label: 'Outline', tokens: { style: 'outline', radius: 'md', shadow: 'none' } },
      { id: 'ghost', label: 'Ghost', tokens: { style: 'ghost', radius: 'md', shadow: 'none' } },
    ],
  },
  {
    id: 'card',
    label: 'Cards',
    variants: [
      { id: 'bordered', label: 'Bordered', tokens: { style: 'bordered', radius: 'lg', shadow: 'sm' } },
      { id: 'elevated', label: 'Elevated', tokens: { style: 'elevated', radius: 'lg', shadow: 'lg' } },
      { id: 'flat', label: 'Flat', tokens: { style: 'flat', radius: 'md', shadow: 'none' } },
    ],
  },
  {
    id: 'testimonial',
    label: 'Testimonials',
    variants: [
      { id: 'card', label: 'Card', tokens: { layout: 'card', radius: 'lg', shadow: 'sm' } },
      { id: 'quote', label: 'Quote', tokens: { layout: 'quote', radius: 'none', shadow: 'none' } },
      { id: 'carousel', label: 'Carousel', tokens: { layout: 'carousel', radius: 'lg', shadow: 'md' } },
    ],
  },
  {
    id: 'pricing-card',
    label: 'Pricing Cards',
    variants: [
      { id: 'tiered', label: 'Tiered', tokens: { layout: 'tiered', radius: 'lg', shadow: 'md' } },
      { id: 'highlight', label: 'Highlighted middle', tokens: { layout: 'highlight', radius: 'lg', shadow: 'lg' } },
      { id: 'toggle', label: 'Monthly/Yearly toggle', tokens: { layout: 'toggle', radius: 'lg', shadow: 'md' } },
    ],
  },
  {
    id: 'form',
    label: 'Forms',
    variants: [
      { id: 'stacked', label: 'Stacked', tokens: { layout: 'stacked', radius: 'md' } },
      { id: 'inline', label: 'Inline', tokens: { layout: 'inline', radius: 'md' } },
      { id: 'card', label: 'Card', tokens: { layout: 'card', radius: 'lg', shadow: 'md' } },
    ],
  },
  {
    id: 'features',
    label: 'Features',
    variants: [
      { id: 'grid-3', label: '3-column grid', tokens: { layout: 'grid-3', radius: 'lg', shadow: 'sm' } },
      { id: 'grid-4', label: '4-column grid', tokens: { layout: 'grid-4', radius: 'lg', shadow: 'sm' } },
      { id: 'split', label: 'Split', tokens: { layout: 'split', radius: 'lg', shadow: 'none' } },
    ],
  },
  {
    id: 'faq',
    label: 'FAQs',
    variants: [
      { id: 'accordion', label: 'Accordion', tokens: { layout: 'accordion', radius: 'md' } },
      { id: 'two-column', label: 'Two-column', tokens: { layout: 'two-column', radius: 'md' } },
      { id: 'tabs', label: 'Tabs', tokens: { layout: 'tabs', radius: 'md' } },
    ],
  },
  {
    id: 'navbar',
    label: 'Navbar',
    variants: [
      { id: 'sticky', label: 'Sticky', tokens: { position: 'sticky', background: 'translucent' } },
      { id: 'transparent', label: 'Transparent', tokens: { position: 'absolute', background: 'transparent' } },
      { id: 'bordered', label: 'Bordered', tokens: { position: 'static', background: 'solid', border: 'bottom' } },
    ],
  },
  {
    id: 'footer',
    label: 'Footer',
    variants: [
      { id: 'mega', label: 'Mega footer', tokens: { layout: 'mega', columns: 4 } },
      { id: 'simple', label: 'Simple', tokens: { layout: 'simple', columns: 2 } },
      { id: 'split', label: 'Split brand', tokens: { layout: 'split', columns: 3 } },
    ],
  },
  {
    id: 'gallery',
    label: 'Gallery',
    variants: [
      { id: 'masonry', label: 'Masonry', tokens: { layout: 'masonry', radius: 'lg' } },
      { id: 'grid', label: 'Grid', tokens: { layout: 'grid', radius: 'lg' } },
      { id: 'carousel', label: 'Carousel', tokens: { layout: 'carousel', radius: 'lg' } },
    ],
  },
  {
    id: 'team-card',
    label: 'Team Cards',
    variants: [
      { id: 'photo', label: 'Photo', tokens: { layout: 'photo', radius: 'lg', shadow: 'sm' } },
      { id: 'minimal', label: 'Minimal', tokens: { layout: 'minimal', radius: 'md' } },
      { id: 'social', label: 'With social links', tokens: { layout: 'social', radius: 'lg', shadow: 'md' } },
    ],
  },
  {
    id: 'service-card',
    label: 'Service Cards',
    variants: [
      { id: 'icon-top', label: 'Icon top', tokens: { layout: 'icon-top', radius: 'lg', shadow: 'sm' } },
      { id: 'icon-left', label: 'Icon left', tokens: { layout: 'icon-left', radius: 'lg', shadow: 'sm' } },
      { id: 'numbered', label: 'Numbered', tokens: { layout: 'numbered', radius: 'lg', shadow: 'none' } },
    ],
  },
  {
    id: 'statistics',
    label: 'Statistics',
    variants: [
      { id: 'banner', label: 'Banner', tokens: { layout: 'banner', radius: 'md' } },
      { id: 'grid-4', label: '4-stat grid', tokens: { layout: 'grid-4', radius: 'md' } },
      { id: 'split', label: 'Split with copy', tokens: { layout: 'split', radius: 'md' } },
    ],
  },
  {
    id: 'timeline',
    label: 'Timeline',
    variants: [
      { id: 'vertical', label: 'Vertical', tokens: { layout: 'vertical' } },
      { id: 'horizontal', label: 'Horizontal', tokens: { layout: 'horizontal' } },
      { id: 'numbered', label: 'Numbered', tokens: { layout: 'numbered' } },
    ],
  },
  {
    id: 'contact-form',
    label: 'Contact Forms',
    variants: [
      { id: 'split', label: 'Split with info', tokens: { layout: 'split', radius: 'lg' } },
      { id: 'centered', label: 'Centered', tokens: { layout: 'centered', radius: 'lg' } },
      { id: 'sidebar', label: 'Sidebar', tokens: { layout: 'sidebar', radius: 'lg' } },
    ],
  },
  {
    id: 'newsletter-form',
    label: 'Newsletter Forms',
    variants: [
      { id: 'inline', label: 'Inline', tokens: { layout: 'inline', radius: 'full' } },
      { id: 'card', label: 'Card', tokens: { layout: 'card', radius: 'lg', shadow: 'md' } },
      { id: 'banner', label: 'Banner', tokens: { layout: 'banner', radius: 'xl' } },
    ],
  },
  {
    id: 'badge',
    label: 'Badges',
    variants: [
      { id: 'pill', label: 'Pill', tokens: { radius: 'full' } },
      { id: 'soft', label: 'Soft', tokens: { radius: 'md', background: 'accent-10' } },
      { id: 'outline', label: 'Outline', tokens: { radius: 'md', style: 'outline' } },
    ],
  },
  {
    id: 'icon',
    label: 'Icons',
    variants: [
      { id: 'outline', label: 'Outline', tokens: { style: 'outline', weight: 1.5 } },
      { id: 'solid', label: 'Solid', tokens: { style: 'solid', weight: 2 } },
      { id: 'duotone', label: 'Duotone', tokens: { style: 'duotone', weight: 1.5 } },
    ],
  },
];

export function getComponent(id: string): LibraryComponent | undefined {
  return COMPONENT_LIBRARY.find((component) => component.id === id);
}

export function listComponents(): LibraryComponent[] {
  return COMPONENT_LIBRARY.map((component) => ({
    ...component,
    variants: [...component.variants],
  }));
}

export function getVariant(
  componentId: string,
  variantId: string
): LibraryComponent['variants'][number] | undefined {
  return getComponent(componentId)?.variants.find((variant) => variant.id === variantId);
}
