// =============================================================================
// Typography Editor
// =============================================================================
// Heading/body font family selectors + modular type-scale slider.
// Commitments flow through `updateTypography()` and trigger the debounced save.
// Font options are a curated Google Fonts subset; values are stored verbatim
// as CSS font-family strings so the renderer can apply them directly.
// =============================================================================

'use client';

import { useEditorStore } from '@/features/editor/store/editor-store';
import { cn } from '@/lib/cn';

// ─── Font Options ───────────────────────────────────────────────────────────
// value === the CSS font-family stack the renderer injects.

interface FontOption {
  label: string;
  value: string;
}

const HEADING_FONTS: FontOption[] = [
  { label: 'Inter', value: 'Inter, system-ui, sans-serif' },
  { label: 'Playfair Display', value: '"Playfair Display", Georgia, serif' },
  { label: 'Poppins', value: 'Poppins, system-ui, sans-serif' },
  { label: 'Montserrat', value: 'Montserrat, system-ui, sans-serif' },
  { label: 'Lato', value: 'Lato, system-ui, sans-serif' },
  { label: 'Roboto', value: 'Roboto, system-ui, sans-serif' },
  { label: 'Georgia (serif)', value: 'Georgia, serif' },
];

const BODY_FONTS: FontOption[] = [
  { label: 'Inter', value: 'Inter, system-ui, sans-serif' },
  { label: 'Roboto', value: 'Roboto, system-ui, sans-serif' },
  { label: 'Lato', value: 'Lato, system-ui, sans-serif' },
  { label: 'Poppins', value: 'Poppins, system-ui, sans-serif' },
  { label: 'Source Sans', value: '"Source Sans Pro", system-ui, sans-serif' },
  { label: 'Open Sans', value: '"Open Sans", system-ui, sans-serif' },
  { label: 'Georgia (serif)', value: 'Georgia, serif' },
];

// ─── Local Labels ──────────────────────────────────────────────────────────

function selectedFontLabel(options: FontOption[], value: string): string {
  return options.find((o) => o.value === value)?.label ?? 'Custom';
}

// ─── Component ─────────────────────────────────────────────────────────────

export function TypographyEditor() {
  const theme = useEditorStore((s) => s.theme);
  const updateTypography = useEditorStore((s) => s.updateTypography);

  if (!theme) {
    return (
      <p className="px-3 py-4 text-xs text-neutral-500">
        No theme loaded.
      </p>
    );
  }

  const { fontFamily, scale } = theme.typography;

  return (
    <div className="space-y-3">
      <div className="px-1 text-[10px] font-medium uppercase tracking-wider text-neutral-400">
        Typography
      </div>

      {/* Heading Font */}
      <div>
        <label className="mb-1 block px-1 text-xs font-medium text-neutral-600">
          Heading Font
        </label>
        <select
          value={fontFamily.heading}
          onChange={(e) =>
            updateTypography({
              fontFamily: { ...fontFamily, heading: e.target.value },
            })
          }
          className={cn(
            'w-full rounded-md border border-neutral-200 bg-white px-2 py-1.5 text-xs text-neutral-700',
            'focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400'
          )}
        >
          {HEADING_FONTS.map((f) => (
            <option key={f.label} value={f.value}>
              {f.label}
            </option>
          ))}
          {!HEADING_FONTS.some((f) => f.value === fontFamily.heading) && (
            <option value={fontFamily.heading}>
              Custom ({selectedFontLabel(HEADING_FONTS, fontFamily.heading)})
            </option>
          )}
        </select>
      </div>

      {/* Body Font */}
      <div>
        <label className="mb-1 block px-1 text-xs font-medium text-neutral-600">
          Body Font
        </label>
        <select
          value={fontFamily.body}
          onChange={(e) =>
            updateTypography({
              fontFamily: { ...fontFamily, body: e.target.value },
            })
          }
          className={cn(
            'w-full rounded-md border border-neutral-200 bg-white px-2 py-1.5 text-xs text-neutral-700',
            'focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400'
          )}
        >
          {BODY_FONTS.map((f) => (
            <option key={f.label} value={f.value}>
              {f.label}
            </option>
          ))}
          {!BODY_FONTS.some((f) => f.value === fontFamily.body) && (
            <option value={fontFamily.body}>
              Custom ({selectedFontLabel(BODY_FONTS, fontFamily.body)})
            </option>
          )}
        </select>
      </div>

      {/* Type Scale */}
      <div>
        <div className="mb-1 flex items-center justify-between px-1">
          <label className="text-xs font-medium text-neutral-600">
            Type Scale
          </label>
          <span className="font-mono text-[11px] text-neutral-500">
            {scale.toFixed(2)}
          </span>
        </div>
        <input
          type="range"
          min={0.875}
          max={1.375}
          step={0.0625}
          value={scale}
          onChange={(e) =>
            updateTypography({ scale: parseFloat(e.target.value) })
          }
          className="w-full accent-blue-600"
        />
        <div className="mt-1 flex justify-between px-1 text-[10px] text-neutral-400">
          <span>Tighter</span>
          <span>Wider</span>
        </div>
      </div>
    </div>
  );
}
