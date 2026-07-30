// =============================================================================
// Project Card
// =============================================================================
// Card component for displaying a project in the dashboard grid.
// Shows thumbnail, name, status badge, metadata, and quick actions.
// =============================================================================

'use client';

import { useState } from 'react';
import Link from 'next/link';
interface ProjectCardType {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  status: string;
  industry: string;
  thumbnailUrl?: string | null;
  pageCount: number;
  lastEditedAt: string;
}
import { timeAgo } from '@/utils/format';

interface ProjectCardProps {
  project: ProjectCardType;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  draft: { bg: 'bg-neutral-100', text: 'text-neutral-600', dot: 'bg-neutral-400' },
  published: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  archived: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
};

const INDUSTRY_ICONS: Record<string, string> = {
  restaurant: '🍽️',
  technology: '💻',
  'legal services': '⚖️',
  fitness: '💪',
  'real estate': '🏠',
  creative: '🎨',
  healthcare: '🏥',
  education: '📚',
  ecommerce: '🛒',
  finance: '💰',
};

export function ProjectCard({ project, onDelete, onDuplicate }: ProjectCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const status = STATUS_STYLES[project.status] || STATUS_STYLES.draft;
  const industryIcon = INDUSTRY_ICONS[project.industry] || '🌐';

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm(`Delete "${project.name}"? This cannot be undone.`)) {
      setIsDeleting(true);
      onDelete(project.id);
    }
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDuplicate(project.id);
    setShowMenu(false);
  };

  return (
    <Link
      href={`/editor/${project.id}`}
      className="group relative block overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm transition-all hover:border-neutral-300 hover:shadow-md"
    >
      {/* Thumbnail */}
      <div className="relative h-40 overflow-hidden bg-neutral-100">
        {project.thumbnailUrl ? (
          <img
            src={project.thumbnailUrl}
            alt={project.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl opacity-40">
            {industryIcon}
          </div>
        )}
        {/* Status Badge */}
        <span className={`absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${status.bg} ${status.text}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
          {project.status}
        </span>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="mb-2 flex items-start justify-between">
          <h3 className="text-sm font-semibold text-neutral-900 group-hover:text-neutral-700">
            {project.name}
          </h3>
          {/* Menu Button */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="rounded p-1 text-neutral-400 opacity-0 transition-opacity hover:bg-neutral-100 hover:text-neutral-600 group-hover:opacity-100"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 16 16">
                <circle cx="8" cy="3" r="1.5" />
                <circle cx="8" cy="8" r="1.5" />
                <circle cx="8" cy="13" r="1.5" />
              </svg>
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-full z-20 mt-1 w-40 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-lg">
                  {/* View published site — only when the project is live.
                      Opens in a new tab; `stopPropagation` keeps the card's
                      outer `<Link to /editor>` from also firing. */}
                  {project.status === 'published' && (
                    <a
                      href={`/site/${project.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(false);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50"
                    >
                      🌐 View site
                    </a>
                  )}
                  <button
                    onClick={handleDuplicate}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50"
                  >
                    📋 Duplicate
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {project.description && (
          <p className="mb-3 line-clamp-2 text-xs text-neutral-500">
            {project.description}
          </p>
        )}

        {/* Meta */}
        <div className="flex items-center gap-3 text-xs text-neutral-400">
          <span className="flex items-center gap-1">
            📄 {project.pageCount} {project.pageCount === 1 ? 'page' : 'pages'}
          </span>
          <span>·</span>
          <span>{timeAgo(project.lastEditedAt)}</span>
        </div>
      </div>
    </Link>
  );
}
