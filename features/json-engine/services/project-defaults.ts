// =============================================================================
// Project Defaults Service
// =============================================================================
// Generates default theme, SEO, and project configurations.
// Used during generation and by the editor for new sections/pages.
// =============================================================================

import type { Theme, ColorPalette, ColorShade, SEOConfig } from '@/types';

// ─── Theme Presets ──────────────────────────────────────────────────────

const PRESET_THEMES: Record<string, Partial<Theme>> = {
  minimal: {
    borderRadius: { sm: '0.125rem', md: '0.25rem', lg: '0.5rem', xl: '0.75rem', '2xl': '1rem', full: '9999px' },
    shadows: { sm: '0 1px 2px rgba(0,0,0,0.05)', md: '0 4px 6px rgba(0,0,0,0.07)', lg: '0 10px 15px rgba(0,0,0,0.1)', xl: '0 20px 25px rgba(0,0,0,0.1)', '2xl': '0 25px 50px rgba(0,0,0,0.15)', inner: 'inset 0 2px 4px rgba(0,0,0,0.05)', glow: '0 0 20px rgba(99,102,241,0.3)' },
  },
  luxury: {
    borderRadius: { sm: '0.25rem', md: '0.5rem', lg: '0.75rem', xl: '1rem', '2xl': '1.5rem', full: '9999px' },
    shadows: { sm: '0 1px 3px rgba(0,0,0,0.12)', md: '0 4px 12px rgba(0,0,0,0.15)', lg: '0 12px 24px rgba(0,0,0,0.2)', xl: '0 24px 48px rgba(0,0,0,0.25)', '2xl': '0 36px 72px rgba(0,0,0,0.3)', inner: 'inset 0 2px 4px rgba(0,0,0,0.1)', glow: '0 0 30px rgba(212,175,55,0.4)' },
  },
  corporate: {
    borderRadius: { sm: '0.125rem', md: '0.25rem', lg: '0.375rem', xl: '0.5rem', '2xl': '0.75rem', full: '9999px' },
    shadows: { sm: '0 1px 2px rgba(0,0,0,0.06)', md: '0 2px 4px rgba(0,0,0,0.08)', lg: '0 4px 12px rgba(0,0,0,0.1)', xl: '0 8px 24px rgba(0,0,0,0.12)', '2xl': '0 12px 36px rgba(0,0,0,0.15)', inner: 'inset 0 1px 2px rgba(0,0,0,0.06)', glow: '0 0 16px rgba(37,99,235,0.25)' },
  },
  modern: {
    borderRadius: { sm: '0.375rem', md: '0.5rem', lg: '0.75rem', xl: '1rem', '2xl': '1.5rem', full: '9999px' },
    shadows: { sm: '0 1px 3px rgba(0,0,0,0.1)', md: '0 4px 8px rgba(0,0,0,0.12)', lg: '0 12px 20px rgba(0,0,0,0.15)', xl: '0 20px 40px rgba(0,0,0,0.2)', '2xl': '0 24px 48px rgba(0,0,0,0.25)', inner: 'inset 0 2px 4px rgba(0,0,0,0.08)', glow: '0 0 24px rgba(139,92,246,0.3)' },
  },
  creative: {
    borderRadius: { sm: '0.5rem', md: '0.75rem', lg: '1rem', xl: '1.5rem', '2xl': '2rem', full: '9999px' },
    shadows: { sm: '0 2px 4px rgba(0,0,0,0.1)', md: '0 6px 12px rgba(0,0,0,0.12)', lg: '0 16px 28px rgba(0,0,0,0.16)', xl: '0 28px 48px rgba(0,0,0,0.2)', '2xl': '0 36px 64px rgba(0,0,0,0.25)', inner: 'inset 0 2px 6px rgba(0,0,0,0.1)', glow: '0 0 28px rgba(236,72,153,0.35)' },
  },
  glassmorphism: {
    borderRadius: { sm: '0.5rem', md: '0.75rem', lg: '1rem', xl: '1.25rem', '2xl': '1.5rem', full: '9999px' },
    shadows: { sm: '0 2px 4px rgba(0,0,0,0.08)', md: '0 4px 12px rgba(0,0,0,0.1)', lg: '0 8px 24px rgba(0,0,0,0.12)', xl: '0 16px 40px rgba(0,0,0,0.15)', '2xl': '0 24px 56px rgba(0,0,0,0.18)', inner: 'inset 0 1px 1px rgba(255,255,255,0.2)', glow: '0 0 20px rgba(99,102,241,0.25)' },
  },
  neumorphism: {
    borderRadius: { sm: '0.5rem', md: '1rem', lg: '1.5rem', xl: '2rem', '2xl': '2.5rem', full: '9999px' },
    shadows: { sm: '2px 2px 5px rgba(163,177,198,0.6), -2px -2px 5px rgba(255,255,255,0.5)', md: '4px 4px 8px rgba(163,177,198,0.6), -4px -4px 8px rgba(255,255,255,0.5)', lg: '6px 6px 12px rgba(163,177,198,0.6), -6px -6px 12px rgba(255,255,255,0.5)', xl: '10px 10px 20px rgba(163,177,198,0.6), -10px -10px 20px rgba(255,255,255,0.5)', '2xl': '14px 14px 28px rgba(163,177,198,0.6), -14px -14px 28px rgba(255,255,255,0.5)', inner: 'inset 4px 4px 8px rgba(163,177,198,0.6), inset -4px -4px 8px rgba(255,255,255,0.5)', glow: '0 0 16px rgba(163,177,198,0.4)' },
  },
};

// ─── Default Theme Generator ────────────────────────────────────────────

/**
 * Generate a complete default theme from a preset name and brand colors.
 */
export function getDefaultTheme(
  preset: string = 'modern',
  brandColors?: { primary: string; secondary: string; accent: string }
): Theme {
  const effectivePreset = PRESET_THEMES[preset] ? preset : 'modern';
  const basePreset = PRESET_THEMES[effectivePreset];

  const primaryColor = brandColors?.primary || '#6366F1';
  const secondaryColor = brandColors?.secondary || '#8B5CF6';
  const accentColor = brandColors?.accent || '#EC4899';

  return {
    name: effectivePreset,
    mode: 'light',
    preset: effectivePreset as Theme['preset'],
    colors: generateColorPalette(primaryColor, secondaryColor, accentColor),
    typography: {
      fontFamily: {
        heading: "'Inter', system-ui, sans-serif",
        body: "'Inter', system-ui, sans-serif",
        mono: "'JetBrains Mono', monospace",
      },
      scale: 1.25,
      lineHeight: {
        tight: 1.2,
        snug: 1.375,
        normal: 1.5,
        relaxed: 1.625,
        loose: 2,
      },
    },
    spacing: {
      unit: 8,
      scale: [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32, 40, 48, 64],
    },
    borderRadius: basePreset.borderRadius || PRESET_THEMES.modern.borderRadius!,
    shadows: basePreset.shadows || PRESET_THEMES.modern.shadows!,
    animations: {
      enabled: true,
      duration: { fast: 150, normal: 300, slow: 500 },
      easing: { default: 'cubic-bezier(0.4, 0, 0.2, 1)', in: 'cubic-bezier(0.4, 0, 1, 1)', out: 'cubic-bezier(0, 0, 0.2, 1)', inOut: 'cubic-bezier(0.4, 0, 0.2, 1)' },
      reduceMotion: false,
    },
  };
}

// ─── Color Palette Generator ────────────────────────────────────────────

function generateColorPalette(
  primary: string,
  secondary: string,
  accent: string
): ColorPalette {
  return {
    primary: generateShades(primary),
    secondary: generateShades(secondary),
    accent: generateShades(accent),
    neutral: generateShades('#64748B'),
    background: '#FFFFFF',
    surface: '#F8FAFC',
    surfaceHover: '#F1F5F9',
    text: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#94A3B8',
    border: '#E2E8F0',
    borderLight: '#F1F5F9',
    success: generateShades('#10B981'),
    warning: generateShades('#F59E0B'),
    error: generateShades('#EF4444'),
    info: generateShades('#3B82F6'),
    gradient: {
      primary: `linear-gradient(135deg, ${primary}, ${secondary})`,
      secondary: `linear-gradient(135deg, ${secondary}, ${accent})`,
      accent: `linear-gradient(135deg, ${accent}, ${primary})`,
      mesh: `radial-gradient(at 40% 20%, ${primary}40 0px, transparent 50%), radial-gradient(at 80% 0%, ${secondary}30 0px, transparent 50%), radial-gradient(at 0% 50%, ${accent}20 0px, transparent 50%)`,
    },
  };
}

function generateShades(hex: string): ColorShade {
  // Simplified shade generation from a base hex color
  // In production, use a library like Tailwind's color generator
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  const toHex = (val: number) => Math.max(0, Math.min(255, Math.round(val))).toString(16).padStart(2, '0');
  const mix = (ratio: number) => `#${toHex(r + (255 - r) * ratio)}${toHex(g + (255 - g) * ratio)}${toHex(b + (255 - b) * ratio)}`;
  const darken = (ratio: number) => `#${toHex(r * (1 - ratio))}${toHex(g * (1 - ratio))}${toHex(b * (1 - ratio))}`;

  return {
    '50': mix(0.95),
    '100': mix(0.9),
    '200': mix(0.75),
    '300': mix(0.55),
    '400': mix(0.3),
    '500': hex,
    '600': darken(0.1),
    '700': darken(0.2),
    '800': darken(0.3),
    '900': darken(0.4),
    '950': darken(0.5),
  };
}

// ─── Default SEO Generator ──────────────────────────────────────────────

/**
 * Generate a default SEO configuration for a page.
 */
export function getDefaultSEO(page: {
  title: string;
  metaTitle?: string;
  metaDescription?: string;
  slug: string;
  brandName?: string;
}): SEOConfig {
  const brandSuffix = page.brandName ? ` | ${page.brandName}` : '';

  return {
    metaTitle: page.metaTitle || `${page.title}${brandSuffix}`,
    metaDescription:
      page.metaDescription ||
      `${page.title} — Learn more about our ${page.title.toLowerCase()} page.`,
    keywords: [],
    canonicalUrl: null,
    ogImage: null,
    ogType: 'website',
    twitterCard: 'summary_large_image',
    twitterSite: null,
    twitterCreator: null,
    noIndex: false,
    noFollow: false,
    jsonLd: [],
    sitemap: true,
    robotsTxt: 'User-agent: *\nAllow: /',
  };
}

// ─── Default Project Settings ───────────────────────────────────────────

export interface ProjectSettings {
  language: string;
  direction: 'ltr' | 'rtl';
  favicon: string | null;
  customCss: string;
  customJs: string;
  googleAnalyticsId: string | null;
  facebookPixelId: string | null;
}

/**
 * Get default project settings.
 */
export function getDefaultProjectSettings(): ProjectSettings {
  return {
    language: 'en',
    direction: 'ltr',
    favicon: null,
    customCss: '',
    customJs: '',
    googleAnalyticsId: null,
    facebookPixelId: null,
  };
}

// ─── Brand Config Builder ───────────────────────────────────────────────

export interface BrandConfig {
  name: string;
  tagline: string;
  description?: string;
  tone: string;
  logo?: string;
  favicon?: string;
  colors?: {
    primary: string;
    secondary: string;
    accent: string;
    background?: string;
    surface?: string;
    text?: string;
    textSecondary?: string;
    border?: string;
  };
  typography?: {
    heading: string;
    body: string;
    mono?: string;
  };
  social?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    youtube?: string;
  };
}

/**
 * Convert AI brand output to a full BrandConfig.
 */
export function buildBrandConfig(aiBrand: {
  name: string;
  tagline: string;
  description?: string;
  tone: string;
  colors?: Record<string, string>;
  typography?: { heading: string; body: string };
}): BrandConfig {
  return {
    name: aiBrand.name,
    tagline: aiBrand.tagline,
    description: aiBrand.description,
    tone: aiBrand.tone,
    colors: aiBrand.colors as BrandConfig['colors'],
    typography: aiBrand.typography,
  };
}
