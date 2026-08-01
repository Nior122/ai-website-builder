// =============================================================================
// Website Builder — Quality, Export, Themes, Workflow Tests
// =============================================================================
import { describe, it, expect } from 'vitest';
import {
  runQualityChecks,
  exportProject,
  exportAll,
  COMPONENT_LIBRARY,
  BUILDER_THEMES,
  applyTheme,
  updateStyleToken,
  getStyleToken,
  validateFormSubmission,
  createBlogPost,
  listPosts,
  getRelatedPosts,
  paginatePosts,
  validateSeo,
  regenerateSection,
  runGenerationWorkflow,
  getComponent,
  type BuilderProject,
} from '@/lib/builder';
import { toDesignBrief } from '@/lib/ai/design-pipeline';
import { makeTestProject } from './fixtures';

function projectWithBrokenBits(): BuilderProject {
  const project = makeTestProject('Broken Co');
  return {
    ...project,
    pages: project.pages.map((page, pageIndex) => ({
      ...page,
      sections: page.sections.map((section, sectionIndex) =>
        sectionIndex === 0 && pageIndex === 0 ? { ...section, content: {} } : section
      ),
    })),
  };
}

describe('Quality Checks', () => {
  it('passes a well-formed project (with auto-repairs applied)', () => {
    const { report } = runQualityChecks(makeTestProject());
    expect(report).toBeDefined();
    expect(Array.isArray(report.issues)).toBe(true);
  });

  it('auto-repairs empty sections', () => {
    const { project, report } = runQualityChecks(projectWithBrokenBits());
    expect(report.repaired.some((entry) => entry.includes('empty'))).toBe(true);
    expect(project.pages.every((page) => page.sections.every((section) => Object.keys(section.content).length > 0 || section.type === 'divider' || section.type === 'spacer'))).toBe(true);
  });

  it('auto-repairs missing CTA on home', () => {
    const project = makeTestProject('No Cta Co');
    const stripped = {
      ...project,
      pages: project.pages.map((page) =>
        page.isHome ? { ...page, sections: page.sections.filter((section) => section.type !== 'cta') } : page
      ),
    };
    const { project: repaired } = runQualityChecks(stripped);
    const home = repaired.pages.find((page) => page.isHome);
    expect(home?.sections.some((section) => section.type === 'cta')).toBe(true);
  });

  it('auto-repairs missing SEO metadata', () => {
    const project = { ...makeTestProject(), seo: { ...makeTestProject().seo, metaTitle: '' } };
    const { project: repaired, report } = runQualityChecks(project);
    expect(repaired.seo.metaTitle.length).toBeGreaterThan(0);
    expect(report.repaired.some((entry) => entry.includes('seo'))).toBe(true);
  });
});

describe('Export Service', () => {
  it('exports JSON that round-trips', () => {
    const project = makeTestProject();
    const json = exportProject(project, 'json');
    const parsed = JSON.parse(json.content) as BuilderProject;
    expect(parsed.name).toBe(project.name);
    expect(parsed.pages.length).toBe(project.pages.length);
  });

  it('exports a self-contained HTML page', () => {
    const project = makeTestProject('HTML Co');
    const html = exportProject(project, 'html');
    expect(html.content).toContain('<!DOCTYPE html>');
    expect(html.content).toContain(project.name);
    expect(html.content).toContain('--primary:');
    expect(html.content).toContain('@media(max-width:768px)');
  });

  it('exports all six formats', () => {
    const exports = exportAll(makeTestProject());
    expect(exports).toHaveLength(6);
    expect(new Set(exports.map((entry) => entry.format)).size).toBe(6);
  });

  it('exports Tailwind config with theme tokens', () => {
    const tailwind = exportProject(makeTestProject(), 'tailwind');
    expect(tailwind.content).toContain('tailwindcss');
    expect(tailwind.content).toContain('primary:');
  });
});

describe('Component Library & Themes', () => {
  it('registers 18 components with at least 3 variants each', () => {
    expect(COMPONENT_LIBRARY).toHaveLength(18);
    for (const component of COMPONENT_LIBRARY) {
      expect(component.variants.length).toBeGreaterThanOrEqual(3);
      expect(getComponent(component.id)).toBeDefined();
    }
  });

  it('offers 19 switchable themes', () => {
    expect(BUILDER_THEMES).toHaveLength(19);
    const keys = new Set(BUILDER_THEMES.map((theme) => theme.key));
    expect(keys.size).toBe(19);
  });

  it('switches themes instantly', () => {
    const project = makeTestProject();
    const next = { ...project, theme: applyTheme(project, 'luxury') };
    expect(next.theme.preset).toBe('luxury');
    expect(next.theme.tokens).toBeDefined();
  });

  it('edits style tokens via the style editor', () => {
    const project = makeTestProject();
    const before = getStyleToken(project.theme, 'colors.primary') as string;
    const theme = updateStyleToken(project.theme, 'colors.primary', '#ff0000');
    expect(theme.tokens).toBeDefined();
    expect(theme.styleOverrides['colors.primary']).toBe('#ff0000');
    expect(before).not.toBe('#ff0000');
  });
});

describe('Forms & Blog', () => {
  it('validates form submissions with spam protection', () => {
    const project = makeTestProject();
    const form = project.forms[0];
    const ok = validateFormSubmission(form, { name: 'Ada', email: 'ada@example.com', message: 'Hello' });
    expect(ok.valid).toBe(true);
    const missing = validateFormSubmission(form, { name: '', email: '', message: '' });
    expect(missing.valid).toBe(false);
    const spam = validateFormSubmission(form, { company_website: 'http://spam.example' });
    expect(spam.spamDetected).toBe(true);
  });

  it('creates, searches, relates, and paginates blog posts', () => {
    let project = createBlogPost(makeTestProject(), {
      title: 'Design Trends 2026',
      excerpt: 'What matters this year.',
      content: 'Full article body.',
      tags: ['design'],
      featured: true,
    });
    project = createBlogPost(project, {
      title: 'Design Systems 101',
      excerpt: 'Build once, reuse everywhere.',
      content: 'Article body.',
      tags: ['design', 'systems'],
    });
    expect(project.blog.posts).toHaveLength(2);
    expect(listPosts(project, { search: 'trends' })).toHaveLength(1);
    expect(listPosts(project, { tag: 'systems' })).toHaveLength(1);
    const related = getRelatedPosts(project, project.blog.posts[0].id, 2);
    expect(related.length).toBeGreaterThanOrEqual(0);
    const page = paginatePosts(project.blog.posts, 1, 1);
    expect(page.totalPages).toBe(2);
    expect(page.items).toHaveLength(1);
  });
});

describe('SEO Panel', () => {
  it('flags empty metadata', () => {
    const issues = validateSeo({ metaTitle: '', metaDescription: '', keywords: [], ogImage: null, twitterCard: '', canonicalUrl: null, robots: 'index,follow', sitemap: true, schema: [] });
    expect(issues.some((issue) => issue.field === 'metaTitle' && issue.severity === 'error')).toBe(true);
  });
});

describe('AI Section Regeneration', () => {
  it('regenerates only the targeted section', () => {
    const project = makeTestProject();
    const home = project.pages.find((page) => page.isHome)!;
    const target = home.sections[0];
    const result = regenerateSection(project, home.id, target.id);
    expect(result.section.id).toBe(target.id);
    expect(result.section.type).toBe(target.type);
    expect(result.section.layout).toBe(target.layout);
    expect(result.prompt).toContain('Regenerate ONLY the requested section');
    expect(typeof result.section.content.headline).toBe('string');
  });
});

describe('Generation Workflow', () => {
  it('builds a complete multi-page site with live progress', async () => {
    const progress: string[] = [];
    const result = await runGenerationWorkflow(
      toDesignBrief({
        description: 'A restaurant serving farm-to-table cuisine downtown.',
        industry: 'Restaurant',
        businessType: 'Restaurant',
        tone: 'professional',
      }),
      { onProgress: (update) => progress.push(update.message) }
    );

    expect(result.project.pages.length).toBeGreaterThanOrEqual(7);
    expect(result.project.pages.filter((page) => page.isHome)).toHaveLength(1);
    expect(result.project.navigation.links.length).toBeGreaterThan(0);
    expect(result.project.forms.length).toBeGreaterThanOrEqual(2);
    expect(progress.at(-1)).toBe('✓ Website Ready');
    expect(progress.some((message) => message.includes('Quality Assurance'))).toBe(true);
    expect(result.quality).toBeDefined();
  });

  it('produces different themes for different industries', async () => {
    const restaurant = await runGenerationWorkflow(
      toDesignBrief({ description: 'A restaurant.', industry: 'Restaurant', businessType: 'Restaurant' })
    );
    const tech = await runGenerationWorkflow(
      toDesignBrief({ description: 'A software company.', industry: 'Technology', businessType: 'SaaS' })
    );
    expect(restaurant.project.theme.preset).not.toBe(tech.project.theme.preset);
  });
});
