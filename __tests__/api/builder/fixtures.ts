// =============================================================================
// Website Builder Tests — Shared Fixtures
// =============================================================================
import { nanoid } from 'nanoid';
import {
  buildStandardPages,
  ensureRequiredPages,
  buildNavigation,
  buildFooter,
  buildDefaultSeo,
  defaultForms,
  defaultBlogState,
  createBuilderTheme,
  type BuilderProject,
} from '@/lib/builder';

export function makeTestProject(name = 'Acme Studio'): BuilderProject {
  const base: BuilderProject = {
    id: nanoid(),
    name,
    description: 'A creative studio delivering design and engineering.',
    industry: 'Design',
    businessType: 'Agency',
    theme: createBuilderTheme('modern-saas', 'light'),
    pages: [],
    navigation: {
      logoText: name,
      links: [],
      sticky: true,
      transparent: false,
      cta: { label: 'Get Started', href: '/contact' },
      mobileMenu: 'drawer',
    },
    footer: {
      tagline: 'A creative studio delivering design and engineering.',
      columns: [],
      socialLinks: [],
      copyright: `© ${new Date().getFullYear()} ${name}`,
    },
    seo: {
      metaTitle: `${name} — Design Agency`,
      metaDescription: 'A creative studio delivering design and engineering.',
      keywords: ['design', 'agency', 'services'],
      ogImage: null,
      twitterCard: 'summary_large_image',
      canonicalUrl: null,
      robots: 'index,follow',
      sitemap: true,
      schema: [],
    },
    media: [],
    blog: defaultBlogState(name),
    forms: defaultForms(),
    updatedAt: Date.now(),
    version: 1,
  };

  let project = { ...base, pages: buildStandardPages(base, ['home', 'about', 'services', 'contact']) };
  project = { ...project, navigation: buildNavigation(project), footer: buildFooter(project) };
  project = { ...project, seo: buildDefaultSeo(project) };
  return ensureRequiredPages(project);
}
