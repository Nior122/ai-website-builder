// =============================================================================
// Testimonials Section Component
// =============================================================================
// Customer testimonials with avatar, name, role, company, quote, rating stars.
// Supports cards and carousel layouts.
// =============================================================================

import type { SectionProps } from '../components/section-renderer';
import { Card } from '../components/ui/card';
import { Star, Quote } from 'lucide-react';
import Image from 'next/image';

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < rating
              ? 'fill-[var(--color-warning-400)] text-[var(--color-warning-400)]'
              : 'text-[var(--color-neutral-300)]'
          }`}
        />
      ))}
    </div>
  );
}

export function TestimonialsSection({ section, content }: SectionProps) {
  const headline = (content.headline as string) || '';
  const subheadline = (content.subheadline as string) || '';
  const testimonials = (content.testimonials as Array<{
    id: string;
    name: string;
    role: string;
    company: string;
    content: string;
    avatar?: string;
    rating?: number;
    featured: boolean;
  }>) || [];

  const isCarousel = section.layout === 'carousel';

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
      {/* Header */}
      {(headline || subheadline) && (
        <div className="text-center mb-16">
          {headline && (
            <h2 className="text-3xl font-bold text-[var(--color-text)] sm:text-4xl">
              {headline}
            </h2>
          )}
          {subheadline && (
            <p className="mt-4 text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto">
              {subheadline}
            </p>
          )}
        </div>
      )}

      {/* Testimonials Grid */}
      {testimonials.length > 0 && (
        <div
          className={`grid gap-8 ${
            isCarousel
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 overflow-x-auto snap-x'
              : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
          }`}
        >
          {testimonials.map((testimonial) => (
            <Card
              key={testimonial.id}
              variant={testimonial.featured ? 'elevated' : 'default'}
              padding="lg"
              className={isCarousel ? 'snap-center min-w-[350px]' : ''}
            >
              <div className="flex flex-col gap-5">
                {/* Quote icon */}
                <Quote className="h-8 w-8 text-[var(--color-primary-200)] rotate-180" />

                {/* Rating */}
                {testimonial.rating && (
                  <StarRating rating={testimonial.rating} />
                )}

                {/* Content */}
                <blockquote className="text-[var(--color-text)] leading-relaxed">
                  &ldquo;{testimonial.content}&rdquo;
                </blockquote>

                {/* Author */}
                <div className="flex items-center gap-3 pt-2 border-t border-[var(--color-border-light)]">
                  {testimonial.avatar ? (
                    <Image
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      width={48}
                      height={48}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-[var(--color-primary-100)] flex items-center justify-center">
                      <span className="text-lg font-semibold text-[var(--color-primary-600)]">
                        {testimonial.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-[var(--color-text)]">
                      {testimonial.name}
                    </p>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      {testimonial.role}
                      {testimonial.company && ` at ${testimonial.company}`}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
