// =============================================================================
// Design Tokens
// =============================================================================
// Generates the full token set: semantic colors (primary/secondary/accent/
// success/warning/danger/info/neutral/surface/background/text/border),
// shadow/radius scales, a 4px-base spacing scale, font + line-height scales,
// motion tokens, and style direction tokens.
//
// All color math (WCAG relative luminance, contrast, mixing) is implemented
// here — no external color library required.
// =============================================================================

import type { ColorMode, DesignTokens } from './types';

// ─── Color Math ─────────────────────────────────────────────────────────

export interface RGB {
  r: number;
  g: number;
  b: number;
}

const HEX_RE = /^#?([0-9a-fA-F]{6})$/;

export function hexToRgb(hex: string): RGB {
  const match = HEX_RE.exec(hex.trim());
  if (!match) throw new Error(`Invalid hex color: "${hex}"`);
  const value = parseInt(match[1], 16);
  return {
    r: (value >> 16) & 0xff,
    g: (value >> 8) & 0xff,
    b: value & 0xff,
  };
}

export function rgbToHex(rgb: RGB): string {
  const toHex = (n: number): string => Math.round(n).toString(16).padStart(2, '0');
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

/** Linear interpolation between two colors; t=0 → a, t=1 → b. */
export function mixHex(a: string, b: string, t: number): string {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  return rgbToHex({
    r: ca.r + (cb.r - ca.r) * t,
    g: ca.g + (cb.g - ca.g) * t,
    b: ca.b + (cb.b - ca.b) * t,
  });
}

/** Shift a color toward white (t>0) or black (t<0). */
export function shade(hex: string, t: number): string {
  if (t >= 0) return mixHex(hex, '#ffffff', t);
  return mixHex(hex, '#000000', -t);
}

/** WCAG 2.1 relative luminance of a hex color. */
export function luminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const channel = (value: number): number => {
    const s = value / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** WCAG contrast ratio between two colors (1..21). */
export function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

/** True when a text/background pair passes WCAG AA (4.5:1). */
export function passesAAContrast(text: string, background: string): boolean {
  return contrastRatio(text, background) >= 4.5;
}

/** True when a UI-component/background pair passes WCAG AA (3:1). */
export function passesAAContrastLarge(text: string, background: string): boolean {
  return contrastRatio(text, background) >= 3.0;
}

/** Generate 50..950 shade ramp for a seed color. */
export function deriveShades(seed: string): Record<string, string> {
  const steps = [0.92, 0.82, 0.7, 0.58, 0.45, 0.32, 0.2, 0.12, 0.06, 0.0];
  const keys = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'];
  const shades: Record<string, string> = {};
  steps.forEach((t, i) => {
    shades[keys[i]] = i < 5 ? shade(seed, t) : shade(seed, -t);
  });
  shades['950'] = shade(seed, -0.04);
  return shades;
}

/** Rotate a hue-ish color by mixing toward a hue anchor (approximation). */
export function deriveHue(seed: string, anchor: string, t: number): string {
  return mixHex(seed, anchor, t);
}

// ─── Scales ─────────────────────────────────────────────────────────────

export function buildSpacingScale(base = 4): Record<string, number> {
  const keys = ['0', '0.5', '1', '1.5', '2', '3', '4', '5', '6', '8', '10', '12', '16'];
  const values = [0, 0.5, 1, 1.5, 2, 3, 4, 5, 6, 8, 10, 12, 16];
  const scale: Record<string, number> = {};
  keys.forEach((key, i) => {
    scale[key] = values[i] * base;
  });
  return scale;
}

export function buildFontSizeScale(): Record<string, string> {
  return {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
    '6xl': '3.75rem',
  };
}

// ─── Semantic Palettes ──────────────────────────────────────────────────

export interface SemanticColors {
  primary: string;
  secondary: string;
  accent: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  neutral: string;
  surface: string;
  background: string;
  text: string;
  border: string;
}

const SEMANTIC_DEFAULTS: Record<ColorMode, Omit<SemanticColors, 'primary' | 'secondary' | 'accent' | 'surface' | 'background' | 'text' | 'border'>> = {
  light: {
    success: '#16a34a',
    warning: '#d97706',
    danger: '#dc2626',
    info: '#0284c7',
    neutral: '#64748b',
  },
  dark: {
    success: '#4ade80',
    warning: '#fbbf24',
    danger: '#f87171',
    info: '#38bdf8',
    neutral: '#94a3b8',
  },
};

function buildSemanticColors(seed: string, mode: ColorMode): SemanticColors {
  const fixed = SEMANTIC_DEFAULTS[mode];
  const base = hexToRgb(seed);
  const isLight = base.r + base.g + base.b > 500;

  // Derive secondary + accent from the seed via mixing anchors.
  const secondaryAnchor = isLight ? '#7c3aed' : '#a78bfa';
  const accentAnchor = isLight ? '#d97706' : '#fbbf24';
  const secondary = deriveHue(seed, secondaryAnchor, 0.55);
  const accent = deriveHue(seed, accentAnchor, 0.45);

  if (mode === 'dark') {
    return {
      primary: mixHex(seed, '#ffffff', 0.18),
      secondary,
      accent,
      ...fixed,
      surface: '#0f172a',
      background: '#020617',
      text: '#e2e8f0',
      border: '#1e293b',
    };
  }

  return {
    primary: seed,
    secondary,
    accent,
    ...fixed,
    surface: '#f8fafc',
    background: '#ffffff',
    text: '#0f172a',
    border: '#e2e8f0',
  };
}

// ─── Token Builder ──────────────────────────────────────────────────────

export interface DesignTokenOptions {
  headingFont?: string;
  bodyFont?: string;
  monoFont?: string;
  radius?: 'sm' | 'md' | 'lg';
  style?: Partial<DesignTokens['style']>;
}

const RADII: Record<'sm' | 'md' | 'lg', DesignTokens['radius']> = {
  sm: { sm: '4px', md: '8px', lg: '12px', xl: '16px', full: '9999px' },
  md: { sm: '6px', md: '12px', lg: '20px', xl: '28px', full: '9999px' },
  lg: { sm: '8px', md: '16px', lg: '24px', xl: '32px', full: '9999px' },
};

export function createDesignTokens(
  seed: string,
  mode: ColorMode,
  options: DesignTokenOptions = {}
): DesignTokens {
  const colors = buildSemanticColors(seed, mode);
  const radius = RADII[options.radius ?? 'md'];

  return {
    seed,
    mode,
    colors,
    primaryShades: deriveShades(seed),
    shadow: {
      sm: '0 1px 2px rgba(0,0,0,0.06)',
      md: '0 4px 12px rgba(0,0,0,0.08)',
      lg: '0 12px 32px rgba(0,0,0,0.12)',
    },
    radius,
    spacing: buildSpacingScale(4),
    fontSize: buildFontSizeScale(),
    fontFamily: {
      heading: options.headingFont ?? 'Inter',
      body: options.bodyFont ?? 'Inter',
      mono: options.monoFont ?? 'JetBrains Mono',
    },
    lineHeight: { tight: 1.2, snug: 1.35, normal: 1.55, relaxed: 1.75 },
    letterSpacing: { tight: '-0.02em', normal: '0em', wide: '0.04em' },
    motion: { fast: 150, base: 250, slow: 400, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
    style: {
      icon: options.style?.icon ?? 'outline-1.5',
      button: options.style?.button ?? 'rounded-md',
      card: options.style?.card ?? 'bordered',
      illustration: options.style?.illustration ?? 'modern-flat',
      photography: options.style?.photography ?? 'natural-warm',
      animation: options.style?.animation ?? 'subtle-fade',
    },
  };
}

export function getDefaultDesignTokens(): DesignTokens {
  return createDesignTokens('#2563eb', 'light');
}
