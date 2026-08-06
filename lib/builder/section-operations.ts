// =============================================================================
// Website Builder — Section Operations
// =============================================================================
// Section management: add, delete, duplicate, move up/down, drag-and-drop
// reorder, hide/show, lock/unlock, regenerate, copy/paste, save/insert
// templates. All operations are immutable — they return a new page.
// =============================================================================

import { nanoid } from 'nanoid';
import type { BuilderPage, BuilderSection } from './types';

// ─── Default section content per type ───────────────────────────────────

const DEFAULT_CONTENT: Record<string, Record<string, unknown>> = {
  hero: { headline: 'Welcome', subheadline: 'Tell your story and drive action.' },
  features: { headline: 'Features', subheadline: 'What makes you different.', items: [] },
  services: { headline: 'Services', subheadline: 'What we offer.', items: [] },
  about: { headline: 'About', subheadline: 'Our story and mission.' },
  mission: { headline: 'Our Mission', subheadline: '' },
  vision: { headline: 'Our Vision', subheadline: '' },
  values: { headline: 'Our Values', items: [] },
  process: { headline: 'How It Works', steps: [] },
  pricing: { headline: 'Pricing', plans: [] },
  gallery: { headline: 'Gallery', items: [] },
  portfolio: { headline: 'Portfolio', items: [] },
  statistics: { headline: 'By the Numbers', items: [] },
  timeline: { headline: 'Timeline', items: [] },
  testimonials: { headline: 'Testimonials', items: [] },
  team: { headline: 'Our Team', members: [] },
  faq: { headline: 'FAQ', items: [] },
  blog: { headline: 'Latest Posts', items: [] },
  cta: { headline: 'Get Started Today', subheadline: '', ctaText: 'Contact Us', ctaLink: '/contact' },
  contact: { headline: 'Contact Us', subheadline: 'We reply within one business day.' },
  newsletter: { headline: 'Stay in the Loop', subheadline: '' },
  map: { headline: 'Find Us', subheadline: '' },
  video: { headline: '', subheadline: '', embedUrl: null },
  accordion: { headline: '', items: [] },
  divider: { headline: '' },
  spacer: { headline: '', height: '64px' },
  'custom-html': { html: '' },
};

const DEFAULT_LAYOUT: Record<string, string> = {
  hero: 'split',
  features: 'grid',
  services: 'cards',
  pricing: 'cards',
  gallery: 'masonry',
  portfolio: 'grid',
  statistics: 'banner',
  testimonials: 'masonry',
  team: 'grid',
  faq: 'accordion',
  contact: 'split',
  cta: 'banner',
  newsletter: 'centered',
  map: 'fullwidth',
  timeline: 'timeline',
  process: 'timeline',
  about: 'split',
  mission: 'centered',
  vision: 'centered',
  values: 'grid',
  blog: 'grid',
  video: 'fullwidth',
  accordion: 'accordion',
  divider: 'default',
  spacer: 'default',
  'custom-html': 'default',
};

export function defaultSection(type: string, order: number): BuilderSection {
  return {
    id: nanoid(),
    type,
    layout: DEFAULT_LAYOUT[type] ?? 'default',
    order,
    content: JSON.parse(JSON.stringify(DEFAULT_CONTENT[type] ?? {})) as Record<string, unknown>,
    styles: {},
    animations: {},
    images: [],
    locked: false,
    visible: true,
    templateId: null,
  };
}

function normalizeOrders(page: BuilderPage): BuilderPage {
  return {
    ...page,
    sections: page.sections.map((section, index) => ({ ...section, order: index })),
  };
}

export function addSection(page: BuilderPage, type: string, index?: number): BuilderPage {
  const section = defaultSection(type, page.sections.length);
  const sections = [...page.sections];
  const at = index ?? sections.length;
  sections.splice(at, 0, section);
  return normalizeOrders({ ...page, sections });
}

export function deleteSection(page: BuilderPage, sectionId: string): BuilderPage {
  return normalizeOrders({
    ...page,
    sections: page.sections.filter((section) => section.id !== sectionId),
  });
}

export function duplicateSection(page: BuilderPage, sectionId: string): BuilderPage {
  const index = page.sections.findIndex((section) => section.id === sectionId);
  if (index === -1) return page;
  const source = page.sections[index];
  const clone: BuilderSection = {
    ...(JSON.parse(JSON.stringify(source)) as BuilderSection),
    id: nanoid(),
    order: source.order + 1,
    locked: false,
  };
  const sections = [...page.sections];
  sections.splice(index + 1, 0, clone);
  return normalizeOrders({ ...page, sections });
}

export function moveSection(page: BuilderPage, sectionId: string, direction: 'up' | 'down'): BuilderPage {
  const index = page.sections.findIndex((section) => section.id === sectionId);
  const target = direction === 'up' ? index - 1 : index + 1;
  if (index === -1 || target < 0 || target >= page.sections.length) return page;
  const sections = [...page.sections];
  const [moved] = sections.splice(index, 1);
  sections.splice(target, 0, moved);
  return normalizeOrders({ ...page, sections });
}

/** Drag-and-drop result: reorder sections to match the given id order. */
export function reorderSections(page: BuilderPage, orderedIds: string[]): BuilderPage {
  const byId = new Map(page.sections.map((section) => [section.id, section]));
  const sections = orderedIds
    .map((id) => byId.get(id))
    .filter((section): section is BuilderSection => section !== undefined);
  return normalizeOrders({ ...page, sections });
}

export function setSectionVisibility(page: BuilderPage, sectionId: string, visible: boolean): BuilderPage {
  return {
    ...page,
    sections: page.sections.map((section) =>
      section.id === sectionId ? { ...section, visible } : section
    ),
  };
}

export function setSectionLocked(page: BuilderPage, sectionId: string, locked: boolean): BuilderPage {
  return {
    ...page,
    sections: page.sections.map((section) =>
      section.id === sectionId ? { ...section, locked } : section
    ),
  };
}

export function updateSectionContent(
  page: BuilderPage,
  sectionId: string,
  content: Record<string, unknown>
): BuilderPage {
  return {
    ...page,
    sections: page.sections.map((section) =>
      section.id === sectionId ? { ...section, content } : section
    ),
  };
}

// ─── Copy / Paste / Templates ───────────────────────────────────────────

let clipboard: BuilderSection | null = null;

export function copySectionToClipboard(section: BuilderSection): void {
  clipboard = JSON.parse(JSON.stringify(section)) as BuilderSection;
}

export function pasteSection(page: BuilderPage, index?: number): BuilderPage {
  if (!clipboard) return page;
  const clone: BuilderSection = {
    ...(JSON.parse(JSON.stringify(clipboard)) as BuilderSection),
    id: nanoid(),
    locked: false,
  };
  const sections = [...page.sections];
  const at = index ?? sections.length;
  sections.splice(at, 0, clone);
  return normalizeOrders({ ...page, sections });
}

const SECTION_TEMPLATES: Record<string, BuilderSection> = {};

export function saveSectionAsTemplate(name: string, section: BuilderSection): string {
  const id = nanoid();
  SECTION_TEMPLATES[id] = {
    ...(JSON.parse(JSON.stringify(section)) as BuilderSection),
    id: nanoid(),
    templateId: id,
  };
  return id;
}

export function listSectionTemplates(): Array<{ id: string; type: string }> {
  return Object.entries(SECTION_TEMPLATES).map(([id, section]) => ({ id, type: section.type }));
}

export function insertTemplate(page: BuilderPage, templateId: string, index?: number): BuilderPage {
  const template = SECTION_TEMPLATES[templateId];
  if (!template) return page;
  const clone: BuilderSection = {
    ...(JSON.parse(JSON.stringify(template)) as BuilderSection),
    id: nanoid(),
    locked: false,
  };
  const sections = [...page.sections];
  const at = index ?? sections.length;
  sections.splice(at, 0, clone);
  return normalizeOrders({ ...page, sections });
}

// ─── Lookup ─────────────────────────────────────────────────────────────

export function getSection(page: BuilderPage, sectionId: string): BuilderSection | undefined {
  return page.sections.find((section) => section.id === sectionId);
}

export function sectionCount(page: BuilderPage): number {
  return page.sections.length;
}
