// =============================================================================
// Editor Page
// =============================================================================
// Server component that fetches project data and renders the visual editor.
// The editor is a client component that manages state via Zustand.
// =============================================================================

import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma/client';
import { EditorLayout } from '@/features/editor/components/editor-layout';
import { parseProjectPages } from '@/features/renderer/lib/parse-page';
import { getDefaultTheme } from '@/features/json-engine/services/project-defaults';
import type { Page, Theme, Project } from '@/types';

interface EditorPageProps {
  params: Promise<{ projectId: string }>;
}

/**
 * Merge stored globalStyles with the full default theme structure.
 * The stored value may be null, empty, or only contain a preset name
 * (e.g. from an early version), missing deeply nested fields that
 * generateCSSVariables requires (colors.gradient, typography.lineHeight,
 * animations.easing, etc.). We start from the default and overlay
 * whatever the DB has so nothing goes undefined.
 */
function ensureCompleteTheme(stored: unknown): Theme {
  const defaults = getDefaultTheme('modern');
  if (!stored || typeof stored !== 'object') return defaults;

  const partial = stored as Record<string, unknown>;

  return {
    ...defaults,
    ...partial,
    colors: partial.colors && typeof partial.colors === 'object'
      ? { ...defaults.colors, ...(partial.colors as Record<string, unknown>) }
      : defaults.colors,
    typography: partial.typography && typeof partial.typography === 'object'
      ? deepMerge(defaults.typography, partial.typography as Record<string, unknown>)
      : defaults.typography,
    spacing: partial.spacing && typeof partial.spacing === 'object'
      ? { ...defaults.spacing, ...(partial.spacing as Record<string, unknown>) }
      : defaults.spacing,
    borderRadius: partial.borderRadius && typeof partial.borderRadius === 'object'
      ? { ...defaults.borderRadius, ...(partial.borderRadius as Record<string, unknown>) }
      : defaults.borderRadius,
    shadows: partial.shadows && typeof partial.shadows === 'object'
      ? { ...defaults.shadows, ...(partial.shadows as Record<string, unknown>) }
      : defaults.shadows,
    animations: partial.animations && typeof partial.animations === 'object'
      ? deepMerge(defaults.animations, partial.animations as Record<string, unknown>)
      : defaults.animations,
  } as Theme;
}

/** Shallow-merge nested objects one level deep. */
function deepMerge<T extends object>(base: T, override: Record<string, unknown>): T {
  const result = { ...base } as Record<string, unknown>;
  for (const key of Object.keys(override)) {
    const baseVal = (base as Record<string, unknown>)[key];
    const overrideVal = override[key];
    if (baseVal && typeof baseVal === 'object' && !Array.isArray(baseVal) &&
        overrideVal && typeof overrideVal === 'object' && !Array.isArray(overrideVal)) {
      result[key] = { ...(baseVal as Record<string, unknown>), ...(overrideVal as Record<string, unknown>) };
    } else {
      result[key] = overrideVal;
    }
  }
  return result as T;
}

async function getProject(projectId: string): Promise<{
  project: Project;
  pages: Page[];
  theme: Theme;
} | null> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      pages: {
        orderBy: { createdAt: 'asc' },
        include: {
          sections: {
            orderBy: { order: 'asc' },
          },
        },
      },
    },
  });

  if (!project) return null;

  const pages: Page[] = parseProjectPages(project.pages as unknown as Parameters<typeof parseProjectPages>[0]);
  const completeTheme = ensureCompleteTheme(project.globalStyles);

  return {
    project: {
      id: project.id,
      name: project.name,
      slug: project.slug,
      description: project.description,
      businessType: project.businessType,
      industry: project.industry,
      status: project.status as Project['status'],
      pages,
      globalStyles: completeTheme as unknown as Project['globalStyles'],
      seo: project.seo as unknown as Project['seo'],
      settings: project.settings as unknown as Project['settings'],
      ownerId: project.ownerId,
      organizationId: project.organizationId,
      templateId: project.templateId,
      thumbnailUrl: project.thumbnailUrl,
      customDomain: project.customDomain,
      publishedAt: project.publishedAt,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    } as Project,
    pages,
    theme: completeTheme,
  };
}

export default async function EditorPage({ params }: EditorPageProps) {
  const { projectId } = await params;
  const data = await getProject(projectId);

  if (!data) {
    notFound();
  }

  return (
    <EditorLayout
      project={data.project}
      pages={data.pages}
      theme={data.theme}
    />
  );
}
