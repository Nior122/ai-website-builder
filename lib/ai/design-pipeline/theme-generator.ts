// =============================================================================
// Theme Generator
// =============================================================================
// Generates complete, distinct themes per business type. Every business type
// gets its own seed color, font pairing, radius language, icon style, and
// animation language — no two business types share a design language.
// =============================================================================

import { createDesignTokens } from './design-tokens';
import type { ColorMode, DesignBrief, DesignTokens, ThemeDesign } from './types';

export interface ThemePresetConfig {
  key: string;
  label: string;
  seed: string;
  mode: ColorMode;
  headingFont: string;
  bodyFont: string;
  radius: 'sm' | 'md' | 'lg';
  iconStyle: string;
  animationStyle: string;
  description: string;
}

export const BUSINESS_THEME_PRESETS: Record<string, ThemePresetConfig> = {
  luxury: {
    key: 'luxury', label: 'Luxury', seed: '#b48a3f', mode: 'light',
    headingFont: 'Playfair Display', bodyFont: 'Lato', radius: 'sm',
    iconStyle: 'outline-thin', animationStyle: 'slow-refined',
    description: 'Gold-on-ink luxury with serif display type and restrained motion.',
  },
  minimal: {
    key: 'minimal', label: 'Minimal', seed: '#18181b', mode: 'light',
    headingFont: 'Inter', bodyFont: 'Inter', radius: 'sm',
    iconStyle: 'line', animationStyle: 'none-subtle',
    description: 'Monochrome minimalism with generous whitespace and no decoration.',
  },
  'modern-saas': {
    key: 'modern-saas', label: 'Modern SaaS', seed: '#4f46e5', mode: 'light',
    headingFont: 'Plus Jakarta Sans', bodyFont: 'Inter', radius: 'lg',
    iconStyle: 'rounded-2', animationStyle: 'snappy-ease',
    description: 'Indigo SaaS aesthetic with large radii and confident gradients.',
  },
  medical: {
    key: 'medical', label: 'Medical', seed: '#0e7490', mode: 'light',
    headingFont: 'Source Sans 3', bodyFont: 'Source Sans 3', radius: 'sm',
    iconStyle: 'solid-soft', animationStyle: 'calm',
    description: 'Clinical teal with calm, trustworthy type and soft solid icons.',
  },
  corporate: {
    key: 'corporate', label: 'Corporate', seed: '#1d4ed8', mode: 'light',
    headingFont: 'IBM Plex Sans', bodyFont: 'IBM Plex Sans', radius: 'sm',
    iconStyle: 'outline-1.5', animationStyle: 'professional',
    description: 'Trustworthy blue corporate with crisp sans and minimal motion.',
  },
  restaurant: {
    key: 'restaurant', label: 'Restaurant', seed: '#c2410c', mode: 'dark',
    headingFont: 'Fraunces', bodyFont: 'Work Sans', radius: 'md',
    iconStyle: 'hand-drawn', animationStyle: 'warm',
    description: 'Warm dark restaurant palette with editorial serif display type.',
  },
  travel: {
    key: 'travel', label: 'Travel', seed: '#0d9488', mode: 'light',
    headingFont: 'Manrope', bodyFont: 'Manrope', radius: 'lg',
    iconStyle: 'rounded-2', animationStyle: 'floating',
    description: 'Teal travel palette with airy type and soft floating motion.',
  },
  creative: {
    key: 'creative', label: 'Creative', seed: '#d946ef', mode: 'light',
    headingFont: 'Space Grotesk', bodyFont: 'Work Sans', radius: 'md',
    iconStyle: 'duotone', animationStyle: 'playful',
    description: 'Expressive fuchsia palette with grotesk display type.',
  },
  agency: {
    key: 'agency', label: 'Agency', seed: '#ea580c', mode: 'dark',
    headingFont: 'Archivo', bodyFont: 'Archivo', radius: 'md',
    iconStyle: 'bold-outline', animationStyle: 'energetic',
    description: 'Bold orange agency dark theme with heavyweight display type.',
  },
  education: {
    key: 'education', label: 'Education', seed: '#0284c7', mode: 'light',
    headingFont: 'Nunito', bodyFont: 'Nunito', radius: 'lg',
    iconStyle: 'friendly', animationStyle: 'friendly',
    description: 'Friendly sky-blue education palette with rounded everything.',
  },
  beauty: {
    key: 'beauty', label: 'Beauty', seed: '#db2777', mode: 'light',
    headingFont: 'Cormorant Garamond', bodyFont: 'Jost', radius: 'lg',
    iconStyle: 'elegant-line', animationStyle: 'soft',
    description: 'Rose-pink beauty palette with elegant serif + geometric sans.',
  },
  fitness: {
    key: 'fitness', label: 'Fitness', seed: '#16a34a', mode: 'dark',
    headingFont: 'Oswald', bodyFont: 'Roboto', radius: 'sm',
    iconStyle: 'solid-bold', animationStyle: 'punchy',
    description: 'High-energy green fitness dark theme with condensed display type.',
  },
  construction: {
    key: 'construction', label: 'Construction', seed: '#b45309', mode: 'light',
    headingFont: 'Roboto Condensed', bodyFont: 'Roboto', radius: 'sm',
    iconStyle: 'solid-soft', animationStyle: 'sturdy',
    description: 'Industrial amber construction palette with condensed headings.',
  },
  technology: {
    key: 'technology', label: 'Technology', seed: '#3b82f6', mode: 'dark',
    headingFont: 'Space Grotesk', bodyFont: 'Inter', radius: 'md',
    iconStyle: 'gradient-line', animationStyle: 'tech-glint',
    description: 'Deep-tech blue dark theme with geometric display type.',
  },
  fashion: {
    key: 'fashion', label: 'Fashion', seed: '#111827', mode: 'light',
    headingFont: 'Bodoni Moda', bodyFont: 'Montserrat', radius: 'sm',
    iconStyle: 'minimal-line', animationStyle: 'editorial',
    description: 'High-contrast editorial black with didone serif display type.',
  },
  automotive: {
    key: 'automotive', label: 'Automotive', seed: '#334155', mode: 'dark',
    headingFont: 'Chakra Petch', bodyFont: 'Inter', radius: 'sm',
    iconStyle: 'angular', animationStyle: 'speed-lines',
    description: 'Slate automotive dark theme with technical display type.',
  },
  finance: {
    key: 'finance', label: 'Finance', seed: '#047857', mode: 'light',
    headingFont: 'Sora', bodyFont: 'Inter', radius: 'sm',
    iconStyle: 'outline-1.5', animationStyle: 'precise',
    description: 'Green-ink finance palette with precise geometric type.',
  },
  'real-estate': {
    key: 'real-estate', label: 'Real Estate', seed: '#92400e', mode: 'light',
    headingFont: 'DM Serif Display', bodyFont: 'DM Sans', radius: 'md',
    iconStyle: 'elegant-line', animationStyle: 'calm',
    description: 'Warm bronze real-estate palette with serif display type.',
  },
  hospital: {
    key: 'hospital', label: 'Hospital', seed: '#0369a1', mode: 'light',
    headingFont: 'Lato', bodyFont: 'Lato', radius: 'sm',
    iconStyle: 'solid-soft', animationStyle: 'calm',
    description: 'Clear, reassuring blue hospital palette with humanist type.',
  },
  church: {
    key: 'church', label: 'Church', seed: '#5b21b6', mode: 'light',
    headingFont: 'Cormorant Garamond', bodyFont: 'Source Sans 3', radius: 'md',
    iconStyle: 'ethereal-line', animationStyle: 'serene',
    description: 'Violet-gold church palette with reverent serif display type.',
  },
  school: {
    key: 'school', label: 'School', seed: '#ea580c', mode: 'light',
    headingFont: 'Baloo 2', bodyFont: 'Nunito', radius: 'lg',
    iconStyle: 'friendly', animationStyle: 'friendly',
    description: 'Optimistic orange school palette with friendly rounded type.',
  },
  'law-firm': {
    key: 'law-firm', label: 'Law Firm', seed: '#1e293b', mode: 'light',
    headingFont: 'Libre Caslon', bodyFont: 'Source Sans 3', radius: 'sm',
    iconStyle: 'outline-thin', animationStyle: 'measured',
    description: 'Slate-and-cream law-firm palette with classical serif type.',
  },
};

// Industry keyword → preset fallback when businessType is unknown.
const INDUSTRY_HINTS: Array<{ keywords: string[]; preset: string }> = [
  { keywords: ['health', 'medical', 'clinic', 'care', 'wellness'], preset: 'medical' },
  { keywords: ['tech', 'software', 'it', 'saas', 'startup', 'digital'], preset: 'technology' },
  { keywords: ['restaurant', 'cafe', 'coffee', 'food', 'bar'], preset: 'restaurant' },
  { keywords: ['law', 'legal', 'attorney', 'lawyer'], preset: 'law-firm' },
  { keywords: ['school', 'education', 'academy', 'tutor', 'university'], preset: 'education' },
  { keywords: ['church', 'ministry', 'nonprofit'], preset: 'church' },
  { keywords: ['hospital', 'clinic', 'dental', 'physio'], preset: 'hospital' },
  { keywords: ['real', 'estate', 'property', 'housing'], preset: 'real-estate' },
  { keywords: ['finance', 'bank', 'invest', 'accounting', 'insurance'], preset: 'finance' },
  { keywords: ['auto', 'car', 'automotive', 'vehicle'], preset: 'automotive' },
  { keywords: ['fashion', 'clothing', 'boutique', 'apparel'], preset: 'fashion' },
  { keywords: ['construction', 'building', 'contractor', 'renovation'], preset: 'construction' },
  { keywords: ['fitness', 'gym', 'sport', 'yoga', 'training'], preset: 'fitness' },
  { keywords: ['beauty', 'salon', 'spa', 'cosmetic', 'hair'], preset: 'beauty' },
  { keywords: ['travel', 'tour', 'hotel', 'hospitality'], preset: 'travel' },
  { keywords: ['agency', 'marketing', 'advertising', 'design studio'], preset: 'agency' },
  { keywords: ['creative', 'art', 'studio', 'media'], preset: 'creative' },
  { keywords: ['corporate', 'business', 'consulting', 'enterprise'], preset: 'corporate' },
];

export function getThemePreset(businessType: string, industry = ''): ThemePresetConfig {
  const normalized = businessType.trim().toLowerCase();
  if (BUSINESS_THEME_PRESETS[normalized]) return BUSINESS_THEME_PRESETS[normalized];

  const haystack = `${normalized} ${industry.toLowerCase()}`;
  for (const hint of INDUSTRY_HINTS) {
    if (hint.keywords.some((keyword) => haystack.includes(keyword))) {
      return BUSINESS_THEME_PRESETS[hint.preset];
    }
  }
  return BUSINESS_THEME_PRESETS['modern-saas'];
}

/**
 * Generate a complete theme for a business.
 * Two businesses of different types always get different design languages
 * (different seed, fonts, radius, motion).
 */
export function generateThemeForBusiness(
  businessType: string,
  brief?: Pick<DesignBrief, 'industry' | 'tone'>
): ThemeDesign {
  const preset = getThemePreset(businessType, brief?.industry ?? '');

  const tokens: DesignTokens = createDesignTokens(preset.seed, preset.mode, {
    headingFont: preset.headingFont,
    bodyFont: preset.bodyFont,
    radius: preset.radius,
    style: {
      icon: preset.iconStyle,
      animation: preset.animationStyle,
    },
  });

  return {
    preset: preset.key,
    mode: preset.mode,
    fonts: {
      heading: preset.headingFont,
      body: preset.bodyFont,
      mono: tokens.fontFamily.mono,
    },
    tokens,
    description: preset.description,
  };
}

export function listThemePresets(): ThemePresetConfig[] {
  return Object.values(BUSINESS_THEME_PRESETS);
}

export function getThemePresetConfig(key: string): ThemePresetConfig | undefined {
  return BUSINESS_THEME_PRESETS[key];
}
