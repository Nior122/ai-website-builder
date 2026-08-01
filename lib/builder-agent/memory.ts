// =============================================================================
// Autonomous Website Builder Agent — Agent Memory
// =============================================================================
// Shared memory across the entire generation pipeline. The agent remembers
// the business, brand, theme, fonts, icons, images, animations, pages,
// sections, navigation — everything it learned or built — so later stages
// never re-derive what earlier stages already decided.
// =============================================================================

import type { BuilderProject } from '@/lib/builder';

export class AgentMemory {
  private readonly data = new Map<string, unknown>();

  remember(key: string, value: unknown): void {
    this.data.set(key, value);
  }

  recall<T>(key: string): T | undefined {
    return this.data.get(key) as T | undefined;
  }

  has(key: string): boolean {
    return this.data.has(key);
  }

  rememberBusiness(input: { name?: string; industry: string; businessType: string; tone?: string; audience?: string[] }): void {
    this.remember('businessName', input.name ?? `${input.industry} ${input.businessType}`);
    this.remember('industry', input.industry);
    this.remember('businessType', input.businessType);
    this.remember('tone', input.tone ?? 'professional');
    this.remember('audience', input.audience ?? []);
  }

  /**
   * Capture everything worth remembering about the generated project so the
   * agent can answer "what did we build" without re-scanning the whole site.
   */
  rememberProject(project: BuilderProject): void {
    this.remember('businessName', project.name);
    this.remember('industry', project.industry);
    this.remember('businessType', project.businessType);
    this.remember('theme', project.theme.preset);
    this.remember('mode', project.theme.mode);
    this.remember('fonts', {
      heading: this.readToken(project, 'fontFamily.heading'),
      body: this.readToken(project, 'fontFamily.body'),
    });
    this.remember('colors', {
      primary: this.readToken(project, 'colors.primary'),
      secondary: this.readToken(project, 'colors.secondary'),
      accent: this.readToken(project, 'colors.accent'),
    });
    this.remember('iconStyle', this.readToken(project, 'style.icon'));
    this.remember('animationStyle', this.readToken(project, 'style.animation'));
    this.remember('pages', project.pages.map((page) => page.slug));
    this.remember('sectionCount', project.pages.reduce((sum, page) => sum + page.sections.length, 0));
    this.remember('imageCount', project.media.length);
    this.remember('navigation', project.navigation.links.map((link) => ({ label: link.label, href: link.href })));
  }

  private readToken(project: BuilderProject, path: string): string {
    const parts = path.split('.');
    let current: unknown = project.theme.tokens;
    for (const part of parts) {
      if (typeof current !== 'object' || current === null) return '';
      current = (current as Record<string, unknown>)[part];
    }
    return typeof current === 'string' ? current : '';
  }

  get businessName(): string | undefined {
    return this.recall<string>('businessName');
  }

  get industry(): string | undefined {
    return this.recall<string>('industry');
  }

  get theme(): string | undefined {
    return this.recall<string>('theme');
  }

  toJSON(): Record<string, unknown> {
    return Object.fromEntries(this.data.entries());
  }
}
