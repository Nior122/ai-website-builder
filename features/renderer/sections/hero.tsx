// =============================================================================
// Hero Section Component
// =============================================================================
// Full-width hero with headline, subheadline, CTA buttons, optional badge.
// Supports centered, split, image-left, image-right layouts.
// =============================================================================

import type { SectionProps } from '../components/section-renderer';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ArrowRight, Play } from 'lucide-react';
import Image from 'next/image';

export function HeroSection({ section, content }: SectionProps) {
  const { layout } = section;
  const headline = (content.headline as string) || 'Welcome';
  const subheadline = (content.subheadline as string) || '';
  const body = (content.body as string) || '';
  const cta = content.cta as SectionProps['content']['cta'];
  const items = (content.items as Array<{ id: string; title: string; description: string; icon?: string; badge?: string }>) || [];
  const badge = items[0]?.badge;

  const heroImage = section.images?.[0];

  const isSplit = layout === 'split' || layout === 'image-left' || layout === 'image-right';
  const imageOnLeft = layout === 'image-left';

  const textContent = (
    <div className="flex flex-col gap-6">
      {badge && <Badge>{badge}</Badge>}

      <h1 className="text-4xl font-bold tracking-tight text-[var(--color-text)] sm:text-5xl lg:text-6xl">
        {headline}
      </h1>

      {subheadline && (
        <p className="text-lg text-[var(--color-text-secondary)] sm:text-xl max-w-2xl">
          {subheadline}
        </p>
      )}

      {body && !subheadline && (
        <p className="text-lg text-[var(--color-text-secondary)] max-w-2xl">
          {body}
        </p>
      )}

      {cta && (
        <div className="flex flex-wrap gap-4 mt-2">
          <Button variant={cta.style === 'ghost' ? 'ghost' : cta.style === 'outline' ? 'outline' : 'primary'} size={cta.size}>
            {cta.text}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );

  const imageContent = heroImage ? (
    <div className="relative overflow-hidden rounded-[var(--radius-xl)]">
      <Image
        src={heroImage.src}
        alt={heroImage.alt || headline}
        width={heroImage.width || 800}
        height={heroImage.height || 600}
        className="w-full h-auto object-cover"
        loading="eager"
        priority
      />
    </div>
  ) : null;

  // Centered layout (default)
  if (!isSplit) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28 text-center">
        <div className="mx-auto max-w-3xl">
          {textContent}
        </div>
        {imageContent && (
          <div className="mt-12 mx-auto max-w-4xl">
            {imageContent}
          </div>
        )}
      </div>
    );
  }

  // Split layout
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {imageOnLeft ? (
          <>
            <div>{imageContent}</div>
            <div>{textContent}</div>
          </>
        ) : (
          <>
            <div>{textContent}</div>
            <div>{imageContent}</div>
          </>
        )}
      </div>
    </div>
  );
}
