// =============================================================================
// Pricing Section Component
// =============================================================================
// Pricing cards with plan name, price, period, feature list, highlighted badge, CTA.
// =============================================================================

import type { SectionProps } from '../components/section-renderer';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Check, X } from 'lucide-react';

export function PricingSection({ section, content }: SectionProps) {
  const headline = (content.headline as string) || '';
  const subheadline = (content.subheadline as string) || '';
  const pricing = (content.pricing as Array<{
    id: string;
    name: string;
    description?: string;
    price: number;
    originalPrice?: number;
    period: 'monthly' | 'yearly' | 'one-time';
    features: Array<{ text: string; included: boolean }>;
    highlighted: boolean;
    cta: string;
    badge?: string;
  }>) || [];

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

      {/* Pricing Cards */}
      {pricing.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
          {pricing.map((plan) => (
            <Card
              key={plan.id}
              variant={plan.highlighted ? 'elevated' : 'outlined'}
              padding="none"
              className={`relative ${
                plan.highlighted
                  ? 'ring-2 ring-[var(--color-primary-500)] scale-[1.02]'
                  : ''
              }`}
            >
              {/* Highlighted badge */}
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge variant="default">{plan.badge}</Badge>
                </div>
              )}

              <div className="p-8">
                {/* Plan name */}
                <h3 className="text-xl font-bold text-[var(--color-text)]">
                  {plan.name}
                </h3>
                {plan.description && (
                  <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                    {plan.description}
                  </p>
                )}

                {/* Price */}
                <div className="mt-6 flex items-baseline gap-1">
                  {plan.price === 0 ? (
                    <span className="text-4xl font-bold text-[var(--color-text)]">Free</span>
                  ) : (
                    <>
                      {plan.originalPrice && (
                        <span className="text-lg line-through text-[var(--color-text-muted)]">
                          ${plan.originalPrice}
                        </span>
                      )}
                      <span className="text-4xl font-bold text-[var(--color-text)]">
                        ${plan.price}
                      </span>
                      <span className="text-[var(--color-text-secondary)]">
                        /{plan.period === 'one-time' ? 'once' : plan.period === 'yearly' ? 'yr' : 'mo'}
                      </span>
                    </>
                  )}
                </div>

                {/* Features */}
                {plan.features.length > 0 && (
                  <ul className="mt-8 space-y-3">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        {feature.included ? (
                          <Check className="h-5 w-5 shrink-0 text-[var(--color-success-500)]" />
                        ) : (
                          <X className="h-5 w-5 shrink-0 text-[var(--color-text-muted)]" />
                        )}
                        <span
                          className={`text-sm ${
                            feature.included
                              ? 'text-[var(--color-text)]'
                              : 'text-[var(--color-text-muted)]'
                          }`}
                        >
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                {/* CTA */}
                <div className="mt-8">
                  <Button
                    variant={plan.highlighted ? 'primary' : 'outline'}
                    size="lg"
                    className="w-full"
                  >
                    {plan.cta}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
