// =============================================================================
// WebsiteRenderer
// =============================================================================
// Converts the JSON-first section structure into rendered React components.
// This is the bridge between the AI-generated JSON and the visual output.
// =============================================================================

'use client';

import type { Section, Theme } from '@/types';
import type { RendererProps } from '../types';
import { generateSectionStyles, isSectionVisible } from '../utils';
import { cn } from '@/utils/cn';

/**
 * Renders a full page from an array of sections.
 */
export function WebsiteRenderer({
  sections,
  theme,
  isPreview = false,
  className,
}: RendererProps) {
  // Filter to visible sections
  const visibleSections = sections.filter((s) =>
    isSectionVisible(s.visibility, 'desktop')
  );

  return (
    <div
      className={cn('w-full', className)}
      style={
        {
          '--color-primary': theme.colors.primary,
          '--color-secondary': theme.colors.secondary,
          '--color-accent': theme.colors.accent,
          '--color-background': theme.colors.background,
          '--color-surface': theme.colors.surface,
          '--color-text': theme.colors.text,
          '--color-text-muted': theme.colors.textMuted,
          '--font-heading': theme.typography.fontFamily.heading,
          '--font-body': theme.typography.fontFamily.body,
        } as React.CSSProperties
      }
    >
      {visibleSections.map((section) => (
        <SectionRenderer
          key={section.id}
          section={section}
          theme={theme}
          isPreview={isPreview}
        />
      ))}
    </div>
  );
}

/**
 * Renders a single section based on its type.
 */
function SectionRenderer({
  section,
  theme,
  isPreview,
}: {
  section: Section;
  theme: Theme;
  isPreview: boolean;
}) {
  const content = section.content as Record<string, unknown>;
  const styles = generateSectionStyles(theme, (section.styles as unknown as Record<string, unknown>) || {});
  const Component = SECTION_COMPONENTS[section.type] || DefaultSection;

  return (
    <section
      data-section-type={section.type}
      data-section-id={section.id}
      className={cn('section', `section--${section.type}`)}
      style={styles}
    >
      <Component content={content} section={section} theme={theme} isPreview={isPreview} />
    </section>
  );
}

// ─── Section Components ─────────────────────────────────────────────────

function HeroSection({ content, theme }: SectionComponentProps) {
  return (
    <div className="relative overflow-hidden bg-[var(--color-background)] py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1
            className="text-4xl font-bold tracking-tight sm:text-6xl"
            style={{
              color: 'var(--color-text)',
              fontFamily: 'var(--font-heading)',
            }}
          >
            {(content.headline as string) || 'Welcome'}
          </h1>
          {!!content.subheadline && (
            <p
              className="mx-auto mt-6 max-w-2xl text-lg leading-8"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {content.subheadline as string}
            </p>
          )}
          {!!content.cta && (
            <div className="mt-10">
              <a
                href={(content.cta as Record<string, string>)?.href || '#'}
                className="inline-flex items-center rounded-md px-6 py-3 text-sm font-semibold shadow-sm"
                style={{
                  backgroundColor: 'var(--color-primary)',
                  color: 'var(--color-background)',
                }}
              >
                {(content.cta as Record<string, string>)?.text || 'Get Started'}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FeaturesSection({ content }: SectionComponentProps) {
  const features = (content.features as Array<{ title: string; description: string }>) || [];
  return (
    <div className="bg-[var(--color-surface)] py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2
          className="text-3xl font-bold text-center"
          style={{ color: 'var(--color-text)', fontFamily: 'var(--font-heading)' }}
        >
          {(content.headline as string) || 'Features'}
        </h2>
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <div key={i} className="rounded-lg bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                {feature.title}
              </h3>
              <p className="mt-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TestimonialsSection({ content }: SectionComponentProps) {
  const testimonials = (content.testimonials as Array<{ name: string; role: string; text: string }>) || [];
  return (
    <div className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2
          className="text-3xl font-bold text-center"
          style={{ color: 'var(--color-text)', fontFamily: 'var(--font-heading)' }}
        >
          {(content.headline as string) || 'Testimonials'}
        </h2>
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t, i) => (
            <div key={i} className="rounded-lg bg-[var(--color-surface)] p-6">
              <p className="text-sm italic" style={{ color: 'var(--color-text-muted)' }}>
                &ldquo;{t.text}&rdquo;
              </p>
              <div className="mt-4">
                <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                  {t.name}
                </p>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {t.role}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CTASection({ content }: SectionComponentProps) {
  return (
    <div
      className="py-20"
      style={{ backgroundColor: 'var(--color-primary)' }}
    >
      <div className="mx-auto max-w-4xl px-4 text-center">
        <h2 className="text-3xl font-bold" style={{ color: 'var(--color-background)' }}>
          {(content.headline as string) || 'Ready to Get Started?'}
        </h2>
        <p className="mt-4 text-lg" style={{ color: 'var(--color-background)', opacity: 0.8 }}>
          {(content.body as string) || ''}
        </p>
        {!!content.cta && (
          <div className="mt-8">
            <a
              href={(content.cta as Record<string, string>)?.href || '#'}
              className="inline-flex items-center rounded-md bg-white px-6 py-3 text-sm font-semibold shadow-sm"
              style={{ color: 'var(--color-primary)' }}
            >
              {(content.cta as Record<string, string>)?.text || 'Get Started'}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function DefaultSection({ content }: SectionComponentProps) {
  return (
    <div className="py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {!!(content.headline || content.title) && (
          <h2
            className="text-3xl font-bold text-center"
            style={{ color: 'var(--color-text)', fontFamily: 'var(--font-heading)' }}
          >
            {(content.headline || content.title) as string}
          </h2>
        )}
        {!!content.body && (
          <p
            className="mx-auto mt-4 max-w-2xl text-center"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {content.body as string}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Component Registry ─────────────────────────────────────────────────

interface SectionComponentProps {
  content: Record<string, unknown>;
  section: Section;
  theme: Theme;
  isPreview: boolean;
}

const SECTION_COMPONENTS: Record<string, React.ComponentType<SectionComponentProps>> = {
  hero: HeroSection,
  features: FeaturesSection,
  testimonials: TestimonialsSection,
  cta: CTASection,
};
