// =============================================================================
// Card Component
// =============================================================================
// Reusable card container with optional hover effects.
// Used by features, testimonials, pricing, team sections.
// =============================================================================

import { type HTMLAttributes, forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const cardVariants = cva(
  'rounded-[var(--radius-lg)] border border-[var(--color-border-light)] bg-[var(--color-surface)] transition-all duration-200',
  {
    variants: {
      variant: {
        default: '',
        elevated: 'shadow-[var(--shadow-md)]',
        outlined: 'border-[var(--color-border)]',
        ghost: 'border-transparent bg-transparent',
      },
      hover: {
        none: '',
        lift: 'hover:shadow-[var(--shadow-lg)] hover:-translate-y-1',
        glow: 'hover:shadow-[var(--shadow-glow)]',
        border: 'hover:border-[var(--color-primary-300)]',
      },
      padding: {
        none: '',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
        xl: 'p-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      hover: 'lift',
      padding: 'md',
    },
  }
);

export interface CardProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, hover, padding, ...props }, ref) => {
    return (
      <div
        className={cn(cardVariants({ variant, hover, padding, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Card.displayName = 'Card';

export { Card, cardVariants };
