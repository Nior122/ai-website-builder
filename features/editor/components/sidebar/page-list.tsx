// =============================================================================
// Page List Panel
// =============================================================================
// Lists all pages in the project. Click to switch the active page.
// =============================================================================

'use client';

import { useEditorStore } from '@/features/editor/store/editor-store';
import { FileText, Home } from 'lucide-react';

// ─── Component ─────────────────────────────────────────────────────────────

export function PageList() {
  const pages = useEditorStore((s) => s.pages);
  const currentPageId = useEditorStore((s) => s.currentPageId);
  const setCurrentPage = useEditorStore((s) => s.setCurrentPage);

  if (pages.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-neutral-500">
        <p>No pages yet.</p>
      </div>
    );
  }

  return (
    <div className="p-2">
      <div className="mb-2 px-2 text-xs font-medium text-neutral-500 uppercase tracking-wide">
        Pages ({pages.length})
      </div>
      <div className="space-y-1">
        {pages.map((page) => {
          const isActive = currentPageId === page.id;
          const sectionCount = page.sections?.length ?? 0;

          return (
            <button
              key={page.id}
              onClick={() => setCurrentPage(page.id)}
              className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              {/* Icon */}
              {page.isHome ? (
                <Home className="h-4 w-4 flex-shrink-0" />
              ) : (
                <FileText className="h-4 w-4 flex-shrink-0" />
              )}

              {/* Name + Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="truncate font-medium">{page.title || 'Untitled'}</span>
                  {page.isHome && (
                    <span className="flex-shrink-0 rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-500">
                      Home
                    </span>
                  )}
                </div>
                <div className="mt-0.5 text-xs text-neutral-400">
                  {sectionCount} section{sectionCount !== 1 ? 's' : ''} · {page.slug ? `/${page.slug}` : '/'}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
