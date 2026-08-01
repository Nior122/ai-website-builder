// =============================================================================
// Website Builder — Navigation Builder
// =============================================================================
// Navbar + footer navigation editing: logo, menus, dropdowns, CTAs, sticky /
// transparent navbars, mobile menu style, and footer navigation columns.
// =============================================================================

import { nanoid } from 'nanoid';
import type { BuilderProject, FooterConfig, NavLink, NavigationConfig } from './types';

function makeLink(label: string, href: string): NavLink {
  return { id: nanoid(), label, href };
}

/** Default navigation derived from the project's pages. */
export function buildNavigation(project: BuilderProject): NavigationConfig {
  const links = project.pages
    .filter((page) => !['privacy', 'terms', '404', 'coming-soon'].includes(page.slug))
    .map((page) => makeLink(page.title, `/${page.slug}`));

  return {
    logoText: project.name,
    links,
    sticky: true,
    transparent: false,
    cta: { label: 'Get Started', href: '/contact' },
    mobileMenu: 'drawer',
  };
}

/** Default footer derived from the project. */
export function buildFooter(project: BuilderProject): FooterConfig {
  const mainLinks = project.pages
    .filter((page) => !['privacy', 'terms', '404', 'coming-soon'].includes(page.slug))
    .map((page) => makeLink(page.title, `/${page.slug}`));

  return {
    tagline: project.description,
    columns: [
      { title: 'Explore', links: mainLinks.slice(0, 4) },
      { title: 'Legal', links: [makeLink('Privacy', '/privacy'), makeLink('Terms', '/terms')] },
    ],
    socialLinks: [
      { platform: 'x', url: 'https://x.com/' },
      { platform: 'linkedin', url: 'https://linkedin.com/' },
    ],
    copyright: `© ${new Date().getFullYear()} ${project.name}. All rights reserved.`,
  };
}

// ─── Navbar ─────────────────────────────────────────────────────────────

export function updateNavigation(project: BuilderProject, patch: Partial<NavigationConfig>): BuilderProject {
  return { ...project, navigation: { ...project.navigation, ...patch } };
}

export function addNavLink(project: BuilderProject, label: string, href: string): BuilderProject {
  return updateNavigation(project, { links: [...project.navigation.links, makeLink(label, href)] });
}

export function removeNavLink(project: BuilderProject, linkId: string): BuilderProject {
  return updateNavigation(project, {
    links: project.navigation.links.filter((link) => link.id !== linkId),
  });
}

export function updateNavLink(project: BuilderProject, linkId: string, patch: Partial<NavLink>): BuilderProject {
  return updateNavigation(project, {
    links: project.navigation.links.map((link) => (link.id === linkId ? { ...link, ...patch } : link)),
  });
}

export function setNavbarMode(project: BuilderProject, mode: { sticky?: boolean; transparent?: boolean }): BuilderProject {
  return updateNavigation(project, { ...mode });
}

export function setNavbarCta(project: BuilderProject, cta: { label: string; href: string } | null): BuilderProject {
  return updateNavigation(project, { cta });
}

export function setMobileMenu(project: BuilderProject, mobileMenu: 'drawer' | 'dropdown'): BuilderProject {
  return updateNavigation(project, { mobileMenu });
}

// ─── Footer ─────────────────────────────────────────────────────────────

export function updateFooter(project: BuilderProject, patch: Partial<FooterConfig>): BuilderProject {
  return { ...project, footer: { ...project.footer, ...patch } };
}

export function setFooterColumn(project: BuilderProject, index: number, column: FooterConfig['columns'][number]): BuilderProject {
  const columns = [...project.footer.columns];
  if (index >= 0 && index < columns.length) {
    columns[index] = column;
  }
  return updateFooter(project, { columns });
}

export function addFooterColumn(project: BuilderProject, title: string): BuilderProject {
  return updateFooter(project, {
    columns: [...project.footer.columns, { title, links: [] }],
  });
}

export function addSocialLink(project: BuilderProject, platform: string, url: string): BuilderProject {
  return updateFooter(project, {
    socialLinks: [...project.footer.socialLinks, { platform, url }],
  });
}

export function removeSocialLink(project: BuilderProject, url: string): BuilderProject {
  return updateFooter(project, {
    socialLinks: project.footer.socialLinks.filter((link) => link.url !== url),
  });
}

export function setFooterTagline(project: BuilderProject, tagline: string): BuilderProject {
  return updateFooter(project, { tagline });
}
