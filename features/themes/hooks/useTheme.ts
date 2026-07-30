// =============================================================================
// useTheme Hook
// =============================================================================
// Theme management: preset selection, color customization, live preview.
// =============================================================================

'use client';

import { useState, useCallback, useMemo } from 'react';
import type { ThemePreset, ColorPalette, ColorShade } from '@/types';
import type { ThemeCustomization } from '../types';
import { THEME_PRESETS, getPresetById } from '../presets';

export function useTheme(initialPreset: ThemePreset = 'modern') {
  const [activePreset, setActivePreset] = useState<ThemePreset>(initialPreset);
  const [customizations, setCustomizations] = useState<ThemeCustomization>({});

  const preset = useMemo(() => getPresetById(activePreset)!, [activePreset]);

  const colors = useMemo<ColorPalette>(() => {
    const base = preset.colors;
    const toShade = (hex: string) =>
      ({ 50: hex, 100: hex, 200: hex, 300: hex, 400: hex, 500: hex, 600: hex, 700: hex, 800: hex, 900: hex, 950: hex } as ColorShade);
    return {
      primary: toShade(customizations.primaryColor || base.primary),
      secondary: toShade(customizations.secondaryColor || base.secondary),
      accent: toShade(customizations.accentColor || base.accent),
      neutral: toShade(base.primary),
      background: customizations.backgroundColor || base.background,
      surface: base.surface,
      surfaceHover: base.surface,
      text: customizations.textColor || base.text,
      textSecondary: base.textMuted,
      textMuted: base.textMuted,
      border: base.border,
      borderLight: base.border,
      success: toShade(base.success),
      warning: toShade(base.warning),
      error: toShade(base.error),
      info: toShade(base.accent),
      gradient: { primary: base.primary, secondary: base.secondary, accent: base.accent, mesh: base.primary },
    };
  }, [preset, customizations]);

  const selectPreset = useCallback((presetId: ThemePreset) => {
    setActivePreset(presetId);
    setCustomizations({});
  }, []);

  const customizeColor = useCallback((key: keyof ThemeCustomization, value: string) => {
    setCustomizations((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetCustomizations = useCallback(() => {
    setCustomizations({});
  }, []);

  return {
    activePreset,
    preset,
    colors,
    customizations,
    selectPreset,
    customizeColor,
    resetCustomizations,
    presets: THEME_PRESETS,
  };
}
