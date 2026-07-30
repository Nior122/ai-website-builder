// =============================================================================
// Theme Types
// =============================================================================

import type { Theme, ThemePreset, ColorPalette, TypographyConfig } from '@/types';

export interface ThemeConfig {
  preset: ThemePreset;
  colors: ColorPalette;
  typography: TypographyConfig;
  borderRadius: string;
  spacing: string;
  animations: boolean;
}

export interface PresetColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  border: string;
  success: string;
  warning: string;
  error: string;
}

export interface ThemePresetOption {
  id: ThemePreset;
  name: string;
  description: string;
  thumbnail: string;
  colors: PresetColors;
}

export interface ThemeCustomization {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
  headingFont?: string;
  bodyFont?: string;
  borderRadius?: string;
}
