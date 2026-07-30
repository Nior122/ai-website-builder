// =============================================================================
// Style Editor
// =============================================================================
// Form fields for editing section styles: padding, margin, background, etc.
// =============================================================================

'use client';

import { useEditorStore } from '@/features/editor/store/editor-store';
import type { Section, SectionStyles, SpacingValue } from '@/types';

// ─── Props ─────────────────────────────────────────────────────────────────

interface StyleEditorProps {
  section: Section;
}

// ─── Component ─────────────────────────────────────────────────────────────

export function StyleEditor({ section }: StyleEditorProps) {
  const updateSectionStyles = useEditorStore((s) => s.updateSectionStyles);
  const styles = section.styles as SectionStyles;

  const update = (patch: Partial<SectionStyles>) => {
    updateSectionStyles(section.id, patch);
  };

  return (
    <div className="space-y-5 p-4">
      {/* Padding */}
      <SpacingGroup
        label="Padding"
        value={styles.padding}
        onChange={(padding) => update({ padding })}
      />

      {/* Margin */}
      <SpacingGroup
        label="Margin"
        value={styles.margin}
        onChange={(margin) => update({ margin })}
      />

      {/* Background Color */}
      <Field label="Background Color">
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={styles.backgroundColor || '#ffffff'}
            onChange={(e) => update({ backgroundColor: e.target.value })}
            className="h-8 w-8 cursor-pointer rounded border border-neutral-200"
          />
          <input
            type="text"
            value={styles.backgroundColor || ''}
            onChange={(e) => update({ backgroundColor: e.target.value })}
            className="flex-1 rounded-md border border-neutral-200 px-3 py-1.5 text-sm text-neutral-900 font-mono placeholder:text-neutral-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            placeholder="#ffffff"
          />
        </div>
        {/* Quick Swatches */}
        <div className="mt-2 flex gap-1.5">
          {['#ffffff', '#f9fafb', '#f3f4f6', '#111827', '#1f2937', '#000000'].map((color) => (
            <button
              key={color}
              onClick={() => update({ backgroundColor: color })}
              className={`h-6 w-6 rounded border ${
                styles.backgroundColor === color
                  ? 'border-blue-500 ring-1 ring-blue-500'
                  : 'border-neutral-200'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </Field>

      {/* Text Align */}
      <Field label="Text Align">
        <div className="flex gap-1">
          {(['left', 'center', 'right'] as const).map((align) => (
            <button
              key={align}
              onClick={() => update({ textAlign: align })}
              className={`flex-1 rounded-md border px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                styles.textAlign === align
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              {align}
            </button>
          ))}
        </div>
      </Field>

      {/* Border Radius */}
      <Field label="Border Radius">
        <select
          value={styles.borderRadius || ''}
          onChange={(e) => update({ borderRadius: e.target.value || undefined })}
          className="w-full rounded-md border border-neutral-200 px-3 py-1.5 text-sm text-neutral-900 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
        >
          <option value="">None</option>
          <option value="0.25rem">Small (0.25rem)</option>
          <option value="0.5rem">Medium (0.5rem)</option>
          <option value="0.75rem">Large (0.75rem)</option>
          <option value="1rem">Extra Large (1rem)</option>
          <option value="9999px">Full Round</option>
        </select>
      </Field>

      {/* Box Shadow */}
      <Field label="Box Shadow">
        <select
          value={styles.boxShadow || ''}
          onChange={(e) => update({ boxShadow: e.target.value || undefined })}
          className="w-full rounded-md border border-neutral-200 px-3 py-1.5 text-sm text-neutral-900 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
        >
          <option value="">None</option>
          <option value="0 1px 3px rgba(0,0,0,0.1)">Small</option>
          <option value="0 4px 6px rgba(0,0,0,0.1)">Medium</option>
          <option value="0 10px 15px rgba(0,0,0,0.1)">Large</option>
          <option value="0 20px 25px rgba(0,0,0,0.1)">Extra Large</option>
        </select>
      </Field>

      {/* Max Width */}
      <Field label="Max Width">
        <input
          type="text"
          value={styles.maxWidth || ''}
          onChange={(e) => update({ maxWidth: e.target.value || undefined })}
          className="w-full rounded-md border border-neutral-200 px-3 py-1.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
          placeholder="e.g. 1200px, 80rem"
        />
      </Field>

      {/* Opacity */}
      <Field label={`Opacity (${Math.round((styles.opacity ?? 1) * 100)}%)`}>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={styles.opacity ?? 1}
          onChange={(e) => update({ opacity: parseFloat(e.target.value) })}
          className="w-full accent-blue-600"
        />
      </Field>

      {/* Border */}
      <Field label="Border">
        <input
          type="text"
          value={styles.border || ''}
          onChange={(e) => update({ border: e.target.value || undefined })}
          className="w-full rounded-md border border-neutral-200 px-3 py-1.5 text-sm text-neutral-900 font-mono placeholder:text-neutral-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
          placeholder="e.g. 1px solid #e5e7eb"
        />
      </Field>

      {/* Background Image */}
      <Field label="Background Image URL">
        <input
          type="text"
          value={styles.backgroundImage || ''}
          onChange={(e) => update({ backgroundImage: e.target.value || undefined })}
          className="w-full rounded-md border border-neutral-200 px-3 py-1.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
          placeholder="https://example.com/image.jpg"
        />
      </Field>
    </div>
  );
}

// ─── Field Wrapper ─────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-neutral-600">{label}</label>
      {children}
    </div>
  );
}

// ─── Spacing Group ─────────────────────────────────────────────────────────

function SpacingGroup({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: SpacingValue;
  onChange: (v: SpacingValue) => void;
}) {
  const updateSide = (side: keyof SpacingValue, val: string) => {
    onChange({ ...value, [side]: val || undefined } as SpacingValue);
  };

  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-neutral-600">{label}</label>
      <div className="grid grid-cols-2 gap-1.5">
        {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
          <input
            key={side}
            type="text"
            value={value?.[side] || ''}
            onChange={(e) => updateSide(side, e.target.value)}
            className="rounded-md border border-neutral-200 px-2 py-1 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-blue-400 focus:outline-none"
            placeholder={side}
          />
        ))}
      </div>
      {/* Quick Presets */}
      <div className="mt-1.5 flex gap-1">
        {[
          { label: 'None', value: { top: '', right: '', bottom: '', left: '' } },
          { label: 'SM', value: { top: '1rem', right: '1rem', bottom: '1rem', left: '1rem' } },
          { label: 'MD', value: { top: '2rem', right: '2rem', bottom: '2rem', left: '2rem' } },
          { label: 'LG', value: { top: '4rem', right: '4rem', bottom: '4rem', left: '4rem' } },
        ].map((preset) => (
          <button
            key={preset.label}
            onClick={() => onChange(preset.value)}
            className="rounded border border-neutral-200 px-2 py-0.5 text-[10px] text-neutral-500 hover:bg-neutral-50"
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}
