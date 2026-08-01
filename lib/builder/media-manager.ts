// =============================================================================
// Website Builder — Media Manager
// =============================================================================
// Manage images, videos, icons, backgrounds, illustrations, AI images,
// uploads, and stock search. Every media item carries type, source, and
// dimensions so the renderer can optimize and the quality agent can check it.
// =============================================================================

import { nanoid } from 'nanoid';
import type { BuilderProject, MediaItem, MediaSource, MediaType } from './types';

export interface NewMediaInput {
  type: MediaType;
  src: string;
  alt: string;
  source?: MediaSource;
  width?: number;
  height?: number;
}

export function addMediaItem(project: BuilderProject, input: NewMediaInput): BuilderProject {
  const item: MediaItem = {
    id: nanoid(),
    type: input.type,
    src: input.src,
    alt: input.alt,
    source: input.source ?? 'upload',
    width: input.width,
    height: input.height,
  };
  return { ...project, media: [...project.media, item] };
}

export function removeMediaItem(project: BuilderProject, mediaId: string): BuilderProject {
  return { ...project, media: project.media.filter((item) => item.id !== mediaId) };
}

export function updateMediaItem(project: BuilderProject, mediaId: string, patch: Partial<MediaItem>): BuilderProject {
  return {
    ...project,
    media: project.media.map((item) => (item.id === mediaId ? { ...item, ...patch } : item)),
  };
}

export function listMedia(project: BuilderProject, type?: MediaType): MediaItem[] {
  return type ? project.media.filter((item) => item.type === type) : [...project.media];
}

export function searchMedia(project: BuilderProject, query: string): MediaItem[] {
  const q = query.toLowerCase();
  return project.media.filter((item) => `${item.alt} ${item.src}`.toLowerCase().includes(q));
}

/**
 * Seed the library with generated placeholders from the agent's image
 * direction so the site never renders with missing images.
 */
export function seedMediaLibrary(project: BuilderProject, prompts: string[], style: string): BuilderProject {
  const items: MediaItem[] = prompts.map((prompt, index) => ({
    id: nanoid(),
    type: 'image',
    src: `/placeholder-images/${project.pages[0]?.slug ?? 'home'}-${index + 1}.jpg`,
    alt: `${prompt} — ${style}`.slice(0, 120),
    source: 'generated',
    width: 800,
    height: 600,
  }));
  return { ...project, media: [...project.media, ...items] };
}
