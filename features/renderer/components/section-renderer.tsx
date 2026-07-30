// =============================================================================
// Section Renderer
// =============================================================================
// Maps Section.type → React component via a registry pattern.
// Wraps each section in AnimatedSection for scroll-triggered animations.
// Applies section-level styles (padding, bg color, max-width, etc.).
// Respects SectionVisibility for responsive hiding.
// =============================================================================

'use client';

import type { Section, SectionContent, SectionType } from '@/types';
import AnimatedSection from './animated-section';
import { HeroSection } from '../sections/hero';
import { FeaturesSection } from '../sections/features';
import { TestimonialsSection } from '../sections/testimonials';
import { PricingSection } from '../sections/pricing';
import { FAQSection } from '../sections/faq';
import { ContactSection } from '../sections/contact';
import { CTASection } from '../sections/cta';
import { StatsSection } from '../sections/stats';
import { TeamSection } from '../sections/team';
import { NewsletterSection } from '../sections/newsletter';
import { AboutSection } from '../sections/about';
import { FooterSection } from '../sections/footer';

// ─────────────────────────────────────────────────────────────────────────────
// Section Props Interface
// ─────────────────────────────────────────────────────────────────────────────

export interface SectionProps {
  section: Section;
  content: SectionContent;
  isEditor?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component Registry
// Maps SectionType → React component. Unregistered types render a placeholder.
// ─────────────────────────────────────────────────────────────────────────────

const SECTION_COMPONENTS: Record<string, React.ComponentType<SectionProps>> = {
  hero: HeroSection,
  features: FeaturesSection,
  testimonials: TestimonialsSection,
  pricing: PricingSection,
  faq: FAQSection,
  contact: ContactSection,
  cta: CTASection,
  stats: StatsSection,
  team: TeamSection,
  newsletter: NewsletterSection,
  about: AboutSection,
  footer: FooterSection,
};

// ─────────────────────────────────────────────────────────────────────────────
// Section Styles → Inline Style Conversion
// ─────────────────────────────────────────────────────────────────────────────

function buildSectionStyle(section: Section): React.CSSProperties {
  const { styles } = section;
  const style: React.CSSProperties = {};

  // Padding
  if (styles.padding) {
    style.paddingTop = styles.padding.top || undefined;
    style.paddingRight = styles.padding.right || undefined;
    style.paddingBottom = styles.padding.bottom || undefined;
    style.paddingLeft = styles.padding.left || undefined;
  }

  // Margin
  if (styles.margin) {
    style.marginTop = styles.margin.top || undefined;
    style.marginRight = styles.margin.right || undefined;
    style.marginBottom = styles.margin.bottom || undefined;
    style.marginLeft = styles.margin.left || undefined;
  }

  // Background
  if (styles.backgroundColor) {
    style.backgroundColor = styles.backgroundColor;
  }
  if (styles.backgroundImage) {
    style.backgroundImage = `url(${styles.backgroundImage})`;
    style.backgroundSize = styles.backgroundSize || 'cover';
    style.backgroundPosition = styles.backgroundPosition || 'center';
    style.backgroundRepeat = styles.backgroundRepeat || 'no-repeat';
  }

  // Border
  if (styles.borderRadius) {
    style.borderRadius = styles.borderRadius;
  }
  if (styles.border) {
    style.border = styles.border;
  }
  if (styles.boxShadow) {
    style.boxShadow = styles.boxShadow;
  }

  // Opacity
  if (styles.opacity !== undefined && styles.opacity !== 1) {
    style.opacity = styles.opacity;
  }

  // Overflow
  if (styles.overflow && styles.overflow !== 'visible') {
    style.overflow = styles.overflow;
  }

  // Text align
  if (styles.textAlign) {
    style.textAlign = styles.textAlign;
  }

  return style;
}

// ─────────────────────────────────────────────────────────────────────────────
// Visibility CSS Classes
// ─────────────────────────────────────────────────────────────────────────────

function buildVisibilityClasses(section: Section): string {
  const { visibility } = section;
  const classes: string[] = [];

  if (!visibility.desktop) classes.push('hidden lg:block'); // hide on all, show on lg+ — but actually we want hide on desktop
  if (!visibility.tablet) classes.push('max-md:hidden');
  if (!visibility.mobile) classes.push('max-sm:hidden');

  // Simplified: if all visible, no classes needed
  if (visibility.desktop && visibility.tablet && visibility.mobile) {
    return '';
  }

  // If hidden on specific breakpoints
  if (!visibility.desktop && !visibility.tablet && !visibility.mobile) {
    return 'hidden';
  }

  if (!visibility.desktop) classes.push('lg:hidden');
  if (!visibility.tablet) classes.push('md:hidden');
  if (!visibility.mobile) classes.push('sm:hidden');

  return classes.join(' ');
}

// ─────────────────────────────────────────────────────────────────────────────
// Placeholder for Unregistered Section Types
// ─────────────────────────────────────────────────────────────────────────────

function SectionPlaceholder({ section }: { section: Section }) {
  return (
    <div className="flex items-center justify-center py-12 text-[var(--color-text-secondary)]">
      <p className="text-sm">
        Section type &quot;{section.type}&quot; is not yet available in the preview.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section Renderer
// ─────────────────────────────────────────────────────────────────────────────

export function SectionRenderer({
  section,
  isEditor = false,
}: {
  section: Section;
  isEditor?: boolean;
}) {
  const Component = SECTION_COMPONENTS[section.type];
  const style = buildSectionStyle(section);
  const visibilityClasses = buildVisibilityClasses(section);
  const animation = section.animations?.[0];

  return (
    <AnimatedSection animation={animation}>
      <section
        id={section.customId || section.id}
        className={visibilityClasses}
        style={style}
        data-section-type={section.type}
        data-section-id={section.id}
      >
        {Component ? (
          <Component
            section={section}
            content={section.content}
            isEditor={isEditor}
          />
        ) : (
          <SectionPlaceholder section={section} />
        )}
      </section>
    </AnimatedSection>
  );
}
