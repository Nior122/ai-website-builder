// =============================================================================
// Editor Toolbar
// =============================================================================
// Top toolbar with project name, save status, preview link, and the Phase 11
// publish action. The Publish / Unpublish button is the user-facing entrypoint
// for going live:
//   - draft      → green "Publish" (disabled while there are unsaved changes;
//                  publishing stale edits would surface an old site at /site)
//   - published  → muted "Unpublish" + a "View site" link to /site/<slug>
// The `usePublish` hook owns the in-flight state and the live `publishedUrl`,
// seeded with `project.status` (the server value fetched on editor load).
// =============================================================================

'use client';

import Link from 'next/link';
import { useEditorStore } from '@/features/editor/store/editor-store';
import { usePublish } from '@/features/publishing/hooks/usePublish';
import { buildPublishedUrl } from '@/lib/url';
import { ArrowLeft, ExternalLink, Globe, Loader2, Save, Unplug } from 'lucide-react';
import type { Project } from '@/types';

// ─── Props ─────────────────────────────────────────────────────────────────

interface EditorToolbarProps {
  project: Project;
}

// ─── Component ─────────────────────────────────────────────────────────────

export function EditorToolbar({ project }: EditorToolbarProps) {
  const isSaving = useEditorStore((s) => s.isSaving);
  const isDirty = useEditorStore((s) => s.isDirty);
  const save = useEditorStore((s) => s.save);

  const { status, isPublishing, error, publish, unpublish, clearError } =
    usePublish(project.status);

  // The live publish status: the hook overrides once a mutation succeeds,
  // otherwise the server-fetched `project.status` drives the initial render.
  const liveStatus = status ?? project.status;
  const isPublished = liveStatus === 'published';
  const isArchived = liveStatus === 'archived';
  // Gate publishing on a clean save state — never publish stale edits.
  const publishDisabled = isDirty || isSaving || isPublishing || isArchived;

  const publishedUrl = buildPublishedUrl(project.slug);

  return (
    <header className="flex h-12 items-center justify-between border-b border-neutral-200 bg-white px-4">
      {/* Left: Back + Project Name */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/projects"
          className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Dashboard</span>
        </Link>

        <div className="h-5 w-px bg-neutral-200" />

        <h1 className="text-sm font-semibold text-neutral-900 truncate max-w-[200px]">
          {project.name}
        </h1>
      </div>

      {/* Right: Save Status + Actions */}
      <div className="flex items-center gap-3">
        {/* Save Status */}
        <div className="flex items-center gap-2 text-xs">
          {isSaving ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />
              <span className="text-blue-600">Saving…</span>
            </>
          ) : isDirty ? (
            <>
              <div className="h-2 w-2 rounded-full bg-amber-400" />
              <span className="text-amber-600">Unsaved changes</span>
            </>
          ) : (
            <>
              <div className="h-2 w-2 rounded-full bg-green-400" />
              <span className="text-neutral-500">Saved</span>
            </>
          )}
        </div>

        {/* Save Button */}
        <button
          onClick={() => save()}
          disabled={!isDirty || isSaving}
          className="flex items-center gap-1.5 rounded-md border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Save className="h-3.5 w-3.5" />
          Save
        </button>

        {/* Publish / Unpublish */}
        {isPublished ? (
          <>
            <Link
              href={publishedUrl}
              target="_blank"
              className="flex items-center gap-1.5 rounded-md border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
              title="Open the published site in a new tab"
            >
              <Globe className="h-3.5 w-3.5" />
              View site
            </Link>
            <button
              onClick={() => unpublish(project.id)}
              disabled={isPublishing}
              className="flex items-center gap-1.5 rounded-md border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-500 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
              title="Take the site offline (back to draft)"
            >
              {isPublishing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Unplug className="h-3.5 w-3.5" />
              )}
              Unpublish
            </button>
          </>
        ) : (
          <button
            onClick={() => publish(project.id)}
            disabled={publishDisabled}
            title={
              isDirty
                ? 'Save your changes before publishing'
                : undefined
            }
            className="flex items-center gap-1.5 rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPublishing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Globe className="h-3.5 w-3.5" />
            )}
            Publish
          </button>
        )}

        {/* Preview Link */}
        <Link
          href={`/preview/${project.id}`}
          target="_blank"
          className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Preview
        </Link>

        {/* Publish error (dismissible) */}
        {error && (
          <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-600">
            <span>{error}</span>
            <button
              onClick={clearError}
              className="text-red-400 hover:text-red-600"
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
