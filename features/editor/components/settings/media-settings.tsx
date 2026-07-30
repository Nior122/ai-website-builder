// =============================================================================
// Media Settings Panel
// =============================================================================
// Image assets: favicon for the published site and project thumbnail for the
// dashboard. Favicon is stored in `settings.favicon` (JSON column); thumbnail
// is the `thumbnailUrl` scalar on the Prisma `Project` model.
// =============================================================================

'use client';

import { useEditorStore } from '@/features/editor/store/editor-store';
import { useSettings } from '../../hooks/use-settings';
import { ImageUploader } from '../image-uploader';
import type { ProjectSettings } from '@/types';
import { Palette } from 'lucide-react';

// ─── Component ─────────────────────────────────────────────────────────────

export function MediaSettings() {
  const project = useEditorStore((s) => s.project);
  const { updateSettings, updateProject } = useSettings();

  if (!project) return null;

  const settings = project.settings as ProjectSettings;

  return (
    <div className="flex flex-col gap-5 p-3">
      {/* Favicon */}
      <section>
        <label className="mb-1 block text-xs font-medium text-neutral-600">
          Favicon
        </label>
        <p className="mb-2 text-[10px] text-neutral-400">
          The small icon shown in browser tabs. Square images (32×32 or 64×64)
          work best. PNG, ICO, or SVG formats recommended.
        </p>
        <ImageUploader
          value={settings.favicon}
          onChange={(url) => updateSettings({ favicon: url })}
          projectId={project.id}
          aspectRatio="1/1"
          type="uploads"
        />
      </section>

      <div className="h-px bg-neutral-200" />

      {/* Project Thumbnail */}
      <section>
        <label className="mb-1 block text-xs font-medium text-neutral-600">
          Project Thumbnail
        </label>
        <p className="mb-2 text-[10px] text-neutral-400">
          The preview image shown in the dashboard. Landscape format (16:9) looks
          best.
        </p>
        <ImageUploader
          value={project.thumbnailUrl}
          onChange={(url) => updateProject({ thumbnailUrl: url as string | null })}
          projectId={project.id}
          aspectRatio="16/9"
          type="images"
        />
      </section>
    </div>
  );
}
