// =============================================================================
// Custom Code Settings Panel
// =============================================================================
// Advanced settings: custom CSS injection, custom <head> HTML, and analytics
// tracking ID. Custom CSS is injected into the published page's <style> block;
// custom <head> HTML goes into the raw <head> for third-party scripts, meta
// tags, or verification tokens. Analytics ID is stored for future integration
// with Google Analytics or similar.
// =============================================================================

'use client';

import { useEditorStore } from '@/features/editor/store/editor-store';
import { useSettings } from '../../hooks/use-settings';
import type { ProjectSettings } from '@/types';
import { Code, BarChart3, FileCode } from 'lucide-react';

// ─── Component ─────────────────────────────────────────────────────────────

export function CustomCodeSettings() {
  const project = useEditorStore((s) => s.project);
  const { updateSettings } = useSettings();

  if (!project) return null;

  const settings = project.settings as ProjectSettings;

  return (
    <div className="flex flex-col gap-5 p-3">
      {/* Custom CSS */}
      <section>
        <div className="mb-1 flex items-center gap-1.5">
          <Code className="h-3.5 w-3.5 text-neutral-500" />
          <label className="text-xs font-medium text-neutral-600">
            Custom CSS
          </label>
        </div>
        <p className="mb-2 text-[10px] text-neutral-400">
          Custom CSS injected into the published page. Use CSS variables from
          the theme (e.g. <code className="bg-neutral-100 px-0.5 rounded">var(--color-primary)</code>)
          for consistency.
        </p>
        <textarea
          value={settings.customCss ?? ''}
          onChange={(e) => updateSettings({ customCss: e.target.value || null })}
          placeholder={`/* Add custom styles here */\n.hero { padding: 4rem 0; }`}
          rows={8}
          spellCheck={false}
          className="w-full rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 font-mono text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none"
        />
      </section>

      <div className="h-px bg-neutral-200" />

      {/* Custom <head> HTML */}
      <section>
        <div className="mb-1 flex items-center gap-1.5">
          <FileCode className="h-3.5 w-3.5 text-neutral-500" />
          <label className="text-xs font-medium text-neutral-600">
            Custom &lt;head&gt; HTML
          </label>
        </div>
        <p className="mb-2 text-[10px] text-neutral-400">
          Raw HTML injected into the <code className="bg-neutral-100 px-0.5 rounded">&lt;head&gt;</code> of
          the published page. Use for verification tags, third-party scripts, or
          custom meta tags. Do <strong>not</strong> include{' '}
          <code className="bg-neutral-100 px-0.5 rounded">&lt;html&gt;</code>,{' '}
          <code className="bg-neutral-100 px-0.5 rounded">&lt;body&gt;</code>, or{' '}
          <code className="bg-neutral-100 px-0.5 rounded">&lt;head&gt;</code> tags themselves.
        </p>
        <textarea
          value={settings.customHead ?? ''}
          onChange={(e) =>
            updateSettings({ customHead: e.target.value || null })
          }
          placeholder={`<!-- Google Site Verification -->\n<meta name="google-site-verification" content="..." />`}
          rows={6}
          spellCheck={false}
          className="w-full rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 font-mono text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none"
        />
      </section>

      <div className="h-px bg-neutral-200" />

      {/* Analytics ID */}
      <section>
        <div className="mb-1 flex items-center gap-1.5">
          <BarChart3 className="h-3.5 w-3.5 text-neutral-500" />
          <label className="text-xs font-medium text-neutral-600">
            Analytics Tracking ID
          </label>
        </div>
        <p className="mb-2 text-[10px] text-neutral-400">
          Google Analytics (or similar) tracking ID. This will be added to the
          published page automatically.
        </p>
        <input
          type="text"
          value={settings.analyticsId ?? ''}
          onChange={(e) =>
            updateSettings({ analyticsId: e.target.value || null })
          }
          placeholder="G-XXXXXXXXXX"
          className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
      </section>
    </div>
  );
}
