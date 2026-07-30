// =============================================================================
// Newsletter Section Component
// =============================================================================
// Email signup with headline, email input, subscribe button.
// Inline or card layout.
// =============================================================================

'use client';

import type { SectionProps } from '../components/section-renderer';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Mail } from 'lucide-react';
import { useState } from 'react';

export function NewsletterSection({ section, content }: SectionProps) {
  const headline = (content.headline as string) || '';
  const subheadline = (content.subheadline as string) || '';
  const cta = content.cta as SectionProps['content']['cta'];
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
    }
  };

  const isCard = section.layout === 'cards' || section.layout === 'centered';

  const inner = (
    <div className="flex flex-col items-center gap-6 text-center">
      {/* Icon */}
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-primary-50)]">
        <Mail className="h-7 w-7 text-[var(--color-primary-500)]" />
      </div>

      {headline && (
        <h2 className="text-2xl font-bold text-[var(--color-text)] sm:text-3xl">
          {headline}
        </h2>
      )}

      {subheadline && (
        <p className="text-[var(--color-text-secondary)] max-w-lg">
          {subheadline}
        </p>
      )}

      {/* Form */}
      {submitted ? (
        <p className="text-[var(--color-success-600)] font-medium">
          Thank you for subscribing!
        </p>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="flex w-full max-w-md flex-col sm:flex-row gap-3"
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            className="flex-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-transparent"
          />
          <Button type="submit" variant="primary" size="md">
            {cta?.text || 'Subscribe'}
          </Button>
        </form>
      )}
    </div>
  );

  if (isCard) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <Card padding="xl">
          {inner}
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
      {inner}
    </div>
  );
}
