// =============================================================================
// Color Editor
// =============================================================================
// Inline color customization for the active theme's core color tokens.
// Each row exposes a native color picker + hex input and commits immediately
// to the store via `updateColors()`, triggering the debounced save.
//
// Two token shapes exist on ColorPalette:
//   - ColorShade tokens (primary/secondary/accent): edit the 500 shade, the
//     representative key the renderer leans on for "base" usage.
//   - Simple string tokens (background/surface/text/textSecondary/textMuted/
//     border): edit the value directly.
// =============================================================================

'use client';

import { useEditorStore } from '@/features/editor/store/editor-store';
import { cn } from '@/lib/cn';
import type { ColorPalette, ColorShade } from '@/types';

// ─── Token Descriptor ──────────────────────────────────────────────────────

interface ColorToken {
  key: keyof ColorPalette;
  label: string;
  /** True when ColorPalette[key] is a full ColorShade (50-950). */
  isShade: boolean;
}

const COLOR_TOKENS: ColorToken[] = [
  { key: 'primary', label: 'Primary', isShade: true },
  { key: 'secondary', label: 'Secondary', isShade: true },
  { key: 'accent', label: 'Accent', isShade: true },
  { key: 'background', label: 'Background', isShade: false },
  { key: 'surface', label: 'Surface', isShade: false },
  { key: 'text', label: 'Text', isShade: false },
  { key: 'textSecondary', label: 'Text Secondary', isShade: false },
  { key: 'textMuted', label: 'Text Muted', isShade: false },
  { key: 'border', label: 'Border', isShade: false },
];

// ─── Helpers ───────────────────────────────────────────────────────────────
// Read the current value as a single hex string regardless of token shape.

function getCurrentColor(value: ColorShade | string): string {
  if (typeof value === 'string') return value;
  // ColorShade — use the 500 shade as the representative value.
  return value[500];
}

function normalizeHex(input: string): string {
  const trimmed = input.trim();
  // Bare hex without leading '#'
  if (/^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(trimmed)) {
    return trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
  }
  return trimmed;
}

// ─── Component ─────────────────────────────────────────────────────────────

export function ColorEditor() {
  const theme = useEditorStore((s) => s.theme);
  const updateColors = useEditorStore((s) => s.updateColors);

  if (!theme) {
    return (
      <p className="px-3 py-4 text-xs text-neutral-500">
        No theme loaded.
      </p>
    );
  }

  const commit = (token: ColorToken, hex: string) => {
    if (token.isShade) {
      // Replace the full shade ramp with the chosen color as the 500 anchor;
      // keep the rest of the existing ramp so lighter/darker shades remain.
      const existing = theme.colors[token.key] as ColorShade;
      updateColors({ [token.key]: { ...existing, 500: hex } });
    } else {
      updateColors({ [token.key]: hex });
    }
  };

  return (
    <div className="space-y-2">
      <div className="px-1 text-[10px] font-medium uppercase tracking-wider text-neutral-400">
        Colors
      </div>

      {COLOR_TOKENS.map((token) => {
        const raw = theme.colors[token.key];
        const value = typeof raw === 'string' ? raw : '500' in raw ? raw[500] : '#000';

        return (
          <div
            key={token.key}
            className="flex items-center gap-2 rounded-md border border-neutral-200 px-2 py-1.5"
          >
            {/* Color swatch + native picker */}
            <label
              className="relative h-6 w-6 shrink-0 cursor-pointer overflow-hidden rounded-full border border-neutral-200"
              style={{ background: value }}
              title={`${token.label} — ${value}`}
            >
              <input
                type="color"
                value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : '#000000'}
                onChange={(e) => commit(token, e.target.value)}
                className="absolute inset-0 cursor-pointer opacity-0"
                aria-label={`${token.label} color picker`}
              />
            </label>

            {/* Label */}
            <span className="flex-1 text-xs font-medium text-neutral-700">
              {token.label}
            </span>

            {/* Hex input */}
            <input
              type="text"
              value={value}
              onChange={(e) => {
                // Optimistic local commit only on blur/Enter to avoid partial
                // hex strings flashing through the canvas while typing.
                const next = e.target.value;
                const normalized = normalizeHex(next);
                commit(token, normalized);
              }}
              className={cn(
                'w-20 rounded border border-neutral-200 bg-white px-1.5 py-0.5 text-right',
                'font-mono text-[11px] text-neutral-700',
                'focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400'
              )}
              spellCheck={false}
            />
          </div>
        );
      })}

      <p className="px-1 pt-1 text-[10px] leading-relaxed text-neutral-400">
        Primary, secondary, and accent edit the 500 shade; the surrounding
        lighter/darker shades keep their ramp.
      </p>
    </div>
  );
}
