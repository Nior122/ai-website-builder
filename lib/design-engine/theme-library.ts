// =============================================================================
// Design Generation Engine — Theme Library
// =============================================================================
// A reusable library of 21 curated design themes. The engine either reuses a
// library theme (matched to the industry) or generates a completely new one
// from the industry seed — never a hardcoded single look.
// =============================================================================

import type { IndustryProfile } from './types';

export interface ThemeLibraryEntry {
  id: string;
  label: string;
  seed: string;
  mode: 'light' | 'dark';
  typographyStyle: string;
  layout: string;
  description: string;
}

export const THEME_LIBRARY: ThemeLibraryEntry[] = [
  { id: 'modern-saas', label: 'Modern SaaS', seed: '#2563eb', mode: 'light', typographyStyle: 'modern', layout: 'modern-startup', description: 'Blue-led, clean, conversion-optimized.' },
  { id: 'luxury-dark', label: 'Luxury Dark', seed: '#c9a96a', mode: 'dark', typographyStyle: 'luxury', layout: 'luxury', description: 'Gold on deep charcoal, generous air.' },
  { id: 'creative-studio', label: 'Creative Studio', seed: '#ff4d00', mode: 'light', typographyStyle: 'creative', layout: 'creative-agency', description: 'Bold orange, display type, portfolio-first.' },
  { id: 'elegant-fashion', label: 'Elegant Fashion', seed: '#212121', mode: 'light', typographyStyle: 'editorial', layout: 'editorial', description: 'Monochrome editorial with serif moments.' },
  { id: 'minimal-white', label: 'Minimal White', seed: '#171717', mode: 'light', typographyStyle: 'minimalist', layout: 'minimal', description: 'Whitespace-first, almost no chrome.' },
  { id: 'glass', label: 'Glass', seed: '#6366f1', mode: 'dark', typographyStyle: 'geometric', layout: 'glassmorphism', description: 'Frosted panels over vivid gradients.' },
  { id: 'gradient-neon', label: 'Gradient Neon', seed: '#a855f7', mode: 'dark', typographyStyle: 'geometric', layout: 'gradient', description: 'Neon gradients and glow accents.' },
  { id: 'editorial', label: 'Editorial', seed: '#3d2c1e', mode: 'light', typographyStyle: 'editorial', layout: 'editorial', description: 'Magazine-grade serif-led storytelling.' },
  { id: 'corporate-blue', label: 'Corporate Blue', seed: '#1f4e8c', mode: 'light', typographyStyle: 'corporate', layout: 'corporate', description: 'Trustworthy blue, structured grids.' },
  { id: 'startup-purple', label: 'Startup Purple', seed: '#7c3aed', mode: 'light', typographyStyle: 'geometric', layout: 'modern-startup', description: 'Purple-led modern startup energy.' },
  { id: 'medical-clean', label: 'Medical Clean', seed: '#0e7c7b', mode: 'light', typographyStyle: 'modern', layout: 'card-grid', description: 'Calm teal, clinical whites.' },
  { id: 'restaurant-warm', label: 'Restaurant Warm', seed: '#b3541e', mode: 'light', typographyStyle: 'elegant', layout: 'editorial', description: 'Warm terracotta with food-editorial type.' },
  { id: 'education-bright', label: 'Education Bright', seed: '#3b82c4', mode: 'light', typographyStyle: 'friendly', layout: 'education', description: 'Bright blue, rounded friendly type.' },
  { id: 'architecture-minimal', label: 'Architecture Minimal', seed: '#4a4a4a', mode: 'light', typographyStyle: 'minimalist', layout: 'architecture', description: 'Geometric gray with sharp precision.' },
  { id: 'agency-bold', label: 'Agency Bold', seed: '#e11d48', mode: 'light', typographyStyle: 'creative', layout: 'creative-agency', description: 'Crimson boldness with oversized type.' },
  { id: 'travel-adventure', label: 'Travel Adventure', seed: '#0f7fa3', mode: 'light', typographyStyle: 'friendly', layout: 'travel', description: 'Cyan adventure tones, candid imagery.' },
  { id: 'ai-futuristic', label: 'AI Futuristic', seed: '#6d28d9', mode: 'dark', typographyStyle: 'geometric', layout: 'glassmorphism', description: 'Deep violet futuristic glass.' },
  { id: 'store-premium', label: 'Store Premium', seed: '#d97706', mode: 'light', typographyStyle: 'modern', layout: 'store', description: 'Amber commerce with clean cards.' },
  { id: 'finance-professional', label: 'Finance Professional', seed: '#0f4c81', mode: 'light', typographyStyle: 'classic', layout: 'finance', description: 'Deep navy, serif authority.' },
  { id: 'real-estate-luxury', label: 'Real Estate Luxury', seed: '#9c7b4d', mode: 'light', typographyStyle: 'elegant', layout: 'luxury', description: 'Champagne neutrals, architectural air.' },
  { id: 'gaming-dark', label: 'Gaming Dark', seed: '#7c3aed', mode: 'dark', typographyStyle: 'energetic', layout: 'gradient', description: 'Electric purple on near-black, punchy.' },
];

/** Industry → preferred library theme. */
const INDUSTRY_THEME: Record<string, string> = {
  restaurant: 'restaurant-warm',
  'law-firm': 'corporate-blue',
  hospital: 'medical-clean',
  hotel: 'luxury-dark',
  school: 'education-bright',
  church: 'editorial',
  'beauty-salon': 'elegant-fashion',
  barbershop: 'luxury-dark',
  fashion: 'elegant-fashion',
  gym: 'gradient-neon',
  'real-estate': 'real-estate-luxury',
  construction: 'corporate-blue',
  travel: 'travel-adventure',
  crypto: 'glass',
  saas: 'modern-saas',
  portfolio: 'minimal-white',
  agency: 'agency-bold',
  photography: 'minimal-white',
  architecture: 'architecture-minimal',
  consulting: 'corporate-blue',
  automotive: 'gaming-dark',
  healthcare: 'medical-clean',
  education: 'education-bright',
  'non-profit': 'editorial',
  ecommerce: 'store-premium',
  'financial-services': 'finance-professional',
  'event-planning': 'luxury-dark',
  wedding: 'luxury-dark',
  music: 'gradient-neon',
  creator: 'creative-studio',
  'ai-startup': 'ai-futuristic',
  technology: 'glass',
  marketing: 'creative-studio',
  dentist: 'medical-clean',
  'interior-design': 'architecture-minimal',
};

export interface ThemeSelection {
  entry: ThemeLibraryEntry;
  /** true when the library theme is used as-is, false when a new theme is derived. */
  fromLibrary: boolean;
}

/**
 * Pick a theme for an industry: use the matched library theme when it exists,
 * otherwise derive a brand-new theme from the industry seed (a generated
 * variant of the nearest library look).
 */
export function selectTheme(profile: IndustryProfile): ThemeSelection {
  const matchedId = INDUSTRY_THEME[profile.id];
  const entry = THEME_LIBRARY.find((t) => t.id === matchedId);
  if (entry) {
    return { entry, fromLibrary: true };
  }
  const fallback = THEME_LIBRARY[0];
  return {
    entry: {
      ...fallback,
      id: `generated-${profile.id}`,
      label: `${profile.label} Theme`,
      seed: profile.seed,
      mode: profile.mode,
      typographyStyle: profile.typographyStyle,
      layout: profile.layoutPatterns[0] ?? 'modern-startup',
      description: `Freshly generated theme for ${profile.label}.`,
    },
    fromLibrary: false,
  };
}

export function getThemeEntry(id: string): ThemeLibraryEntry | undefined {
  return THEME_LIBRARY.find((t) => t.id === id);
}

export function listThemes(): ThemeLibraryEntry[] {
  return [...THEME_LIBRARY];
}
