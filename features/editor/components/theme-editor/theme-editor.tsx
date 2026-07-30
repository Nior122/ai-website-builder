// =============================================================================
// Theme Editor
// =============================================================================
// Right rail (sidebar) control surface for the active theme. Composed of:
//   - Preset Picker: grid of the 7 built-in presets; selecting one loads a
//     full Theme via the store's `selectPreset()` (rebuilds the entire color
//     ramp, borderRadius, shadows, etc.).
//   - Color Editor: per-token color customization (see color-editor.tsx).
//   - Typography Editor: font family + type scale (see typography-editor.tsx).
//   - Reset: revert to the current preset's pristine defaults.
//
// The canvas re-renders live because every mutation writes `theme` into the
// Zustand store, which feeds the ThemeProvider wrapping the canvas.
// =============================================================================

'use client';

import { useEditorStore } from '@/features/editor/store/editor-store';
import { THEME_PRESETS } from '@/features/themes/presets';
import { cn } from '@/lib/cn';
import { RotateCcw } from 'lucide-react';
import { ColorEditor } from './color-editor';
import { TypographyEditor } from './typography-editor';
import type { ThemePreset, ColorShade } from '@/types';

// ─── Swatch Color Coercion ──────────────────────────────────────────────────
// Preset color values are declared as ColorPalette members (ColorShade objects
// for primary/secondary/accent) but the preset data actually stores plain hex
// strings. Coerce both shapes to a usable CSS background value.

function swatchColor(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && '500' in (value as ColorShade)) {
    return (value as ColorShade)[500];
  }
  return '#CCCCCC';
}

// ─── Component ─────────────────────────────────────────────────────────────

export function ThemeEditor() {
  const theme = useEditorStore((s) => s.theme);
  const selectPreset = useEditorStore((s) => s.selectPreset);

  if (!theme) {
    return (
      <div className="p-4 text-sm text-neutral-500">
        No theme loaded. Themes become available once a project is initialized.
      </div>
    );
  }

  const activePreset = theme.preset;

  return (
    <div className="flex flex-col gap-5 p-3">
      {/* ── Preset Picker ─────────────────────────────────────────────────── */}
      <section>
        <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-neutral-400">
          Preset
        </div>
        <div className="grid grid-cols-2 gap-2">
          {THEME_PRESETS.map((preset) => {
            const isActive = preset.id === activePreset;
            return (
              <button
                key={preset.id}
                onClick={() => selectPreset(preset.id as ThemePreset)}
                title={preset.description}
                className={cn(
                  'rounded-lg border-2 p-2.5 text-left transition-colors',
                  isActive
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-neutral-200 hover:border-neutral-300'
                )}
              >
                {/* Preview swatches */}
                <div className="mb-1.5 flex gap-1">
                  <span
                    className="h-4 w-4 rounded-full ring-1 ring-black/5"
                    style={{ background: swatchColor(preset.colors.primary) }}
                  />
                  <span
                    className="h-4 w-4 rounded-full ring-1 ring-black/5"
                    style={{ background: swatchColor(preset.colors.accent) }}
                  />
                  <span
                    className="h-4 w-4 rounded-full ring-1 ring-black/5"
                    style={{ background: swatchColor(preset.colors.background) }}
                  />
                  <span
                    className="h-4 w-4 rounded-full ring-1 ring-black/5"
                    style={{ background: swatchColor(preset.colors.secondary) }}
                  />
                </div>
                <div
                  className={cn(
                    'text-xs font-medium',
                    isActive ? 'text-blue-700' : 'text-neutral-700'
                  )}
                >
                  {preset.name}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Colors ────────────────────────────────────────────────────────── */}
      <ColorEditor />

      {/* ── Typography ────────────────────────────────────────────────────── */}
      <TypographyEditor />

      {/* ── Reset ─────────────────────────────────────────────────────────── */}
      <section>
        <button
          onClick={() => selectPreset(activePreset)}
          className="flex w-full items-center justify-center gap-1.5 rounded-md border border-neutral-200 px-3 py-2 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-900"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset to {THEME_PRESETS.find((p) => p.id === activePreset)?.name ?? 'Preset'} Defaults
        </button>
        <p className="mt-1.5 px-1 text-[10px] leading-relaxed text-neutral-400">
          Resetting reloads the preset, discarding all color and typography
          customizations.
        </p>
      </section>
    </div>
  );
}
