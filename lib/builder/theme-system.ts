// =============================================================================
// Website Builder — Theme System
// =============================================================================
// 19 switchable themes with complete token sets (colors, typography, radii,
// spacing, motion, style direction). Themes can be swapped instantly and
// individual style tokens edited via the style editor.
// =============================================================================

import { createDesignTokens, getThemePreset, type DesignTokens } from '@/lib/ai/design-pipeline';
import type { BuilderTheme, ThemeMode } from './types';

export interface ThemeDefinition {
  key: string;
  label: string;
  /** Maps to the Phase 2 business preset when available. */
  presetKey?: string;
  seed?: string;
  mode?: ThemeMode;
  headingFont?: string;
  bodyFont?: string;
  radius?: 'sm' | 'md' | 'lg';
  description: string;
}

/** The 19 themes exposed in the builder's theme picker. */
export const BUILDER_THEMES: ThemeDefinition[] = [
  { key: 'luxury', label: 'Luxury', presetKey: 'luxury', description: 'Gold-on-ink luxury with serif display type.' },
  { key: 'minimal', label: 'Minimal', presetKey: 'minimal', description: 'Monochrome minimalism, generous whitespace.' },
  { key: 'corporate', label: 'Corporate', presetKey: 'corporate', description: 'Trustworthy blue corporate.' },
  { key: 'startup', label: 'Startup', seed: '#0ea5e9', mode: 'light', headingFont: 'Sora', bodyFont: 'Inter', radius: 'lg', description: 'Bright sky-blue startup energy.' },
  { key: 'modern-saas', label: 'Modern SaaS', presetKey: 'modern-saas', description: 'Indigo SaaS aesthetic with large radii.' },
  { key: 'creative', label: 'Creative', presetKey: 'creative', description: 'Expressive fuchsia with grotesk type.' },
  { key: 'education', label: 'Education', presetKey: 'education', description: 'Friendly sky-blue, rounded everything.' },
  { key: 'medical', label: 'Medical', presetKey: 'medical', description: 'Clinical teal, calm and trustworthy.' },
  { key: 'restaurant', label: 'Restaurant', presetKey: 'restaurant', description: 'Warm dark restaurant with editorial serif.' },
  { key: 'beauty', label: 'Beauty', presetKey: 'beauty', description: 'Rose-pink with elegant serif + sans.' },
  { key: 'travel', label: 'Travel', presetKey: 'travel', description: 'Airy teal with floating motion.' },
  { key: 'construction', label: 'Construction', presetKey: 'construction', description: 'Industrial amber, condensed headings.' },
  { key: 'fitness', label: 'Fitness', presetKey: 'fitness', description: 'High-energy green dark theme.' },
  { key: 'technology', label: 'Technology', presetKey: 'technology', description: 'Deep-tech blue dark theme.' },
  { key: 'ecommerce', label: 'Ecommerce', seed: '#e11d48', mode: 'light', headingFont: 'Manrope', bodyFont: 'Manrope', radius: 'md', description: 'Conversion-focused rose commerce theme.' },
  { key: 'real-estate', label: 'Real Estate', presetKey: 'real-estate', description: 'Warm bronze with serif display.' },
  { key: 'church', label: 'Church', presetKey: 'church', description: 'Violet-gold, reverent serif.' },
  { key: 'school', label: 'School', presetKey: 'school', description: 'Optimistic orange, friendly rounded.' },
  { key: 'law-firm', label: 'Law Firm', presetKey: 'law-firm', description: 'Slate-and-cream classical serif.' },
];

export function getThemeDefinition(key: string): ThemeDefinition | undefined {
  return BUILDER_THEMES.find((theme) => theme.key === key);
}

export function listBuilderThemes(): ThemeDefinition[] {
  return [...BUILDER_THEMES];
}

function resolveSeed(def: ThemeDefinition, fallbackSeed: string): string {
  if (def.seed) return def.seed;
  if (def.presetKey) return getThemePreset(def.presetKey).seed;
  return fallbackSeed;
}

/**
 * Build a BuilderTheme from a theme definition.
 */
export function createBuilderTheme(
  key: string,
  mode: ThemeMode = 'light',
  fallbackSeed = '#4f46e5'
): BuilderTheme {
  const def = getThemeDefinition(key) ?? BUILDER_THEMES[3];
  const seed = resolveSeed(def, fallbackSeed);
  const preset = def.presetKey ? getThemePreset(def.presetKey) : undefined;

  const tokens: DesignTokens = createDesignTokens(seed, def.mode ?? mode, {
    headingFont: def.headingFont ?? preset?.headingFont,
    bodyFont: def.bodyFont ?? preset?.bodyFont,
    radius: def.radius ?? preset?.radius,
    style: preset ? { icon: preset.iconStyle, animation: preset.animationStyle } : undefined,
  });

  return {
    preset: key,
    mode: def.mode ?? mode,
    tokens: tokens as unknown as Record<string, unknown>,
    styleOverrides: {},
  };
}

/**
 * Switch a project's theme instantly (keeps overrides merged).
 */
export function applyTheme(
  project: { theme: BuilderTheme },
  key: string,
  mode?: ThemeMode
): BuilderTheme {
  const next = createBuilderTheme(key, mode ?? project.theme.mode);
  next.styleOverrides = { ...project.theme.styleOverrides };
  return next;
}

// ─── Style Editor ──────────────────────────────────────────────────────

export type StyleTokenPath = string;

/**
 * Update a single style token via dot path (e.g. "colors.primary").
 * Returns a new theme; invalid paths are ignored safely.
 */
export function updateStyleToken(
  theme: BuilderTheme,
  path: StyleTokenPath,
  value: unknown
): BuilderTheme {
  const parts = path.split('.');
  const tokens = JSON.parse(JSON.stringify(theme.tokens)) as Record<string, unknown>;
  let current: Record<string, unknown> = tokens;
  for (let i = 0; i < parts.length - 1; i += 1) {
    const part = parts[i];
    if (typeof current[part] !== 'object' || current[part] === null) {
      current[part] = {};
    }
    current = current[part] as Record<string, unknown>;
  }
  if (parts.length > 0) {
    current[parts[parts.length - 1]] = value;
  }
  return {
    ...theme,
    tokens,
    styleOverrides: { ...theme.styleOverrides, [path]: value },
  };
}

/**
 * Read a style token via dot path (undefined when missing).
 */
export function getStyleToken(theme: BuilderTheme, path: StyleTokenPath): unknown {
  const parts = path.split('.');
  let current: unknown = theme.tokens;
  for (const part of parts) {
    if (typeof current !== 'object' || current === null) return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

/** Style-editor field descriptors: what the user can edit without code. */
export const STYLE_EDITOR_FIELDS: Array<{ path: string; label: string; kind: 'color' | 'text' | 'number' | 'select' }> = [
  { path: 'colors.primary', label: 'Primary Color', kind: 'color' },
  { path: 'colors.secondary', label: 'Secondary Color', kind: 'color' },
  { path: 'colors.accent', label: 'Accent', kind: 'color' },
  { path: 'colors.background', label: 'Background', kind: 'color' },
  { path: 'colors.text', label: 'Text', kind: 'color' },
  { path: 'colors.surface', label: 'Surface', kind: 'color' },
  { path: 'colors.border', label: 'Border', kind: 'color' },
  { path: 'fontFamily.heading', label: 'Heading Font', kind: 'text' },
  { path: 'fontFamily.body', label: 'Body Font', kind: 'text' },
  { path: 'radius.md', label: 'Border Radius (md)', kind: 'text' },
  { path: 'radius.lg', label: 'Border Radius (lg)', kind: 'text' },
  { path: 'motion.base', label: 'Animation Duration (ms)', kind: 'number' },
  { path: 'style.button', label: 'Button Style', kind: 'select' },
  { path: 'style.card', label: 'Card Style', kind: 'select' },
  { path: 'style.icon', label: 'Icon Style', kind: 'select' },
];
