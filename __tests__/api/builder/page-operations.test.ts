// =============================================================================
// Website Builder — Page Operations Tests
// =============================================================================
import { describe, it, expect } from 'vitest';
import {
  buildStandardPages,
  ensureRequiredPages,
  createPage,
  renamePage,
  deletePage,
  duplicatePage,
  reorderPages,
  setHomePage,
  setPageStatus,
  updatePageMeta,
  getPageBySlug,
  getHomePage,
  uniqueSlug,
  slugify,
  type BuilderProject,
} from '@/lib/builder';
import { makeTestProject } from './fixtures';

describe('Page Operations', () => {
  it('builds the standard multi-page set with exactly one home', () => {
    const project = makeTestProject();
    expect(project.pages.length).toBeGreaterThanOrEqual(4);
    expect(project.pages.filter((page) => page.isHome)).toHaveLength(1);
    expect(getHomePage(project)?.slug).toBe('home');
  });

  it('generates URL-safe unique slugs', () => {
    expect(slugify('My Business!')).toBe('my-business');
    const project = makeTestProject();
    expect(uniqueSlug(project, 'home')).not.toBe('home'); // collision
    expect(uniqueSlug(project, 'brand-new-page')).toBe('brand-new-page');
  });

  it('creates and renames pages', () => {
    let project = createPage(makeTestProject(), 'Careers');
    expect(getPageBySlug(project, 'careers')).toBeDefined();
    project = renamePage(project, getPageBySlug(project, 'careers')!.id, 'Join Us');
    expect(getPageBySlug(project, 'join-us')).toBeDefined();
  });

  it('never deletes the last page and promotes a new home', () => {
    let project = makeTestProject();
    const solo: BuilderProject = {
      ...project,
      pages: [project.pages[0]],
    };
    const unchanged = deletePage(solo, solo.pages[0].id);
    expect(unchanged.pages).toHaveLength(1);

    const home = getHomePage(project)!;
    project = deletePage(project, home.id);
    expect(getHomePage(project)?.isHome).toBe(true);
    expect(project.pages.some((page) => page.slug === 'home')).toBe(false);
  });

  it('duplicates pages with fresh ids and slugs', () => {
    const project = makeTestProject();
    const target = project.pages[0];
    const next = duplicatePage(project, target.id);
    expect(next.pages).toHaveLength(project.pages.length + 1);
    expect(next.pages.at(-1)?.slug).toContain('copy');
  });

  it('reorders pages', () => {
    const project = makeTestProject();
    const ids = [...project.pages].reverse().map((page) => page.id);
    const next = reorderPages(project, ids);
    expect(next.pages[0].id).toBe(ids[0]);
    expect(next.pages.map((page) => page.order)).toEqual(next.pages.map((_, i) => i));
  });

  it('switches the homepage and publish status', () => {
    let project = makeTestProject();
    const about = getPageBySlug(project, 'about')!;
    project = setHomePage(project, about.id);
    expect(getHomePage(project)?.slug).toBe('about');
    project = setPageStatus(project, about.id, 'draft');
    expect(getPageBySlug(project, 'about')?.status).toBe('draft');
  });

  it('updates page SEO metadata', () => {
    const project = makeTestProject();
    const home = getHomePage(project)!;
    const next = updatePageMeta(project, home.id, { metaTitle: 'Custom Title' });
    expect(getPageBySlug(next, 'home')?.metaTitle).toBe('Custom Title');
  });

  it('ensures privacy, terms, 404 and coming-soon pages exist', () => {
    const project = makeTestProject();
    for (const slug of ['privacy', 'terms', '404', 'coming-soon']) {
      expect(getPageBySlug(project, slug)).toBeDefined();
    }
  });

  it('buildStandardPages guarantees the core trio', () => {
    const project = makeTestProject();
    const pages = buildStandardPages(project, ['gallery']);
    const slugs = pages.map((page) => page.slug);
    expect(slugs).toContain('home');
    expect(slugs).toContain('about');
    expect(slugs).toContain('contact');
  });
});
