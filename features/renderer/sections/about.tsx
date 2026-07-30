// =============================================================================
// About Section Component
// =============================================================================
// About section with headline, body text, image, optional stats and values list.
// Supports split and centered layouts.
// =============================================================================

import type { SectionProps } from '../components/section-renderer';
import { Badge } from '../components/ui/badge';
import { CheckCircle2 } from 'lucide-react';
import Image from 'next/image';

export function AboutSection({ section, content }: SectionProps) {
  const headline = (content.headline as string) || '';
  const subheadline = (content.subheadline as string) || '';
  const body = (content.body as string) || '';
  const items = (content.items as Array<{
    id: string;
    title: string;
    description: string;
    icon?: string;
  }>) || [];
  const stats = (content.stats as Array<{
    id: string;
    value: string;
    label: string;
  }>) || [];

  const aboutImage = section.images?.[0];
  const isSplit = section.layout === 'split' || section.layout === 'image-left' || section.layout === 'image-right';
  const imageOnLeft = section.layout === 'image-left';

  const textContent = (
    <div className="flex flex-col gap-6">
      {subheadline && <Badge>{subheadline}</Badge>}

      {headline && (
        <h2 className="text-3xl font-bold text-[var(--color-text)] sm:text-4xl">
          {headline}
        </h2>
      )}

      {body && (
        <p className="text-lg text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-line">
          {body}
        </p>
      )}

      {/* Values / Checklist */}
      {items.length > 0 && (
        <div className="flex flex-col gap-3 mt-2">
          {items.map((item) => (
            <div key={item.id} className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5 text-[var(--color-success-500)]" />
              <div>
                <p className="font-medium text-[var(--color-text)]">{item.title}</p>
                {item.description && (
                  <p className="text-sm text-[var(--color-text-secondary)]">{item.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats row */}
      {stats.length > 0 && (
        <div className="flex gap-8 mt-4 pt-6 border-t border-[var(--color-border-light)]">
          {stats.map((stat) => (
            <div key={stat.id}>
              <p className="text-2xl font-bold text-[var(--color-primary-500)]">{stat.value}</p>
              <p className="text-sm text-[var(--color-text-secondary)]">{stat.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const imageContent = aboutImage ? (
    <div className="relative overflow-hidden rounded-[var(--radius-xl)] aspect-[4/3]">
      <Image
        src={aboutImage.src}
        alt={aboutImage.alt || headline}
        fill
        className="object-cover"
        loading="lazy"
      />
    </div>
  ) : null;

  if (!isSplit) {
    // Centered layout
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="mx-auto max-w-3xl text-center">
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
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
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
