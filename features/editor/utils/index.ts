// =============================================================================
// Editor Utilities
// =============================================================================

import type { EditorSnapshot } from '../types';
import type { Section } from '@/types';

export function createSnapshot(
  pages: Array<{ sections: Section[] }>,
  selectedPageId: string | null
): EditorSnapshot {
  return {
    pages: JSON.parse(JSON.stringify(pages)),
    selectedPageId,
    timestamp: new Date().toISOString(),
  };
}

export function canUndo(stack: EditorSnapshot[]): boolean {
  return stack.length > 0;
}

export function canRedo(stack: EditorSnapshot[]): boolean {
  return stack.length > 0;
}

export function findSectionById(
  pages: Array<{ sections: Section[] }>,
  sectionId: string
): Section | undefined {
  for (const page of pages) {
    const section = page.sections.find((s) => s.id === sectionId);
    if (section) return section;
  }
  return undefined;
}

export function reorderArray<T>(array: T[], from: number, to: number): T[] {
  const result = [...array];
  const [removed] = result.splice(from, 1);
  result.splice(to, 0, removed);
  return result;
}
