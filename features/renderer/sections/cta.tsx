// =============================================================================
// CTA Section Component
// =============================================================================
// Call-to-action banner with headline, subheadline, primary + secondary buttons.
// Gradient or solid background.
// =============================================================================

import type { SectionProps } from '../components/section-renderer';
import { Button } from '../components/ui/button';
import { ArrowRight } from 'lucide-react';

export function CTASection({ section, content }: SectionProps) {
  const headline = (content.headline as string) || '';
  const subheadline = (content.subheadline as string) || '';
  const cta = content.cta as SectionProps['content']['cta'];
  const items = (content.items as Array<{ id: string; title: string; url?: string }>) || [];

  // Secondary CTA from items
  const secondaryCta = items[0];

  return (
    <div className="relative overflow-hidden">
      {/* Background gradient */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary-600)] to-[var(--color-primary-800)]"
        aria-hidden="true"
      />

      {/* Decorative pattern */}
      <div className="absolute inset-0 opacity-10" aria-hidden="true">
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-[var(--color-accent-400)]" />
        <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-[var(--color-secondary-400)]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-24 text-center">
        <div className="mx-auto max-w-3xl">
          {headline && (
            <h2 className="text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
              {headline}
            </h2>
          )}
          {subheadline && (
            <p className="mt-6 text-lg text-white/80 sm:text-xl max-w-2xl mx-auto">
              {subheadline}
            </p>
          )}

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            {cta && (
              <Button
                variant="primary"
                size={cta.size}
                className="bg-white text-[var(--color-primary-700)] hover:bg-white/90 border-0"
              >
                {cta.text}
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
            {secondaryCta && (
              <Button
                variant="outline"
                size="lg"
                className="border-white/30 text-white hover:bg-white/10"
              >
                {secondaryCta.title}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
