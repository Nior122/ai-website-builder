// =============================================================================
// Badge Component
// =============================================================================
// Small label/tag used for section badges, plan highlights, etc.
// =============================================================================

import { type HTMLAttributes, forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const badgeVariants = cva(
  'inline-flex items-center rounded-full font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-[var(--color-primary-100)] text-[var(--color-primary-700)]',
        secondary: 'bg-[var(--color-secondary-100)] text-[var(--color-secondary-700)]',
        accent: 'bg-[var(--color-accent-100)] text-[var(--color-accent-700)]',
        success: 'bg-[var(--color-success-100)] text-[var(--color-success-700)]',
        warning: 'bg-[var(--color-warning-100)] text-[var(--color-warning-700)]',
        error: 'bg-[var(--color-error-100)] text-[var(--color-error-700)]',
        outline: 'border border-[var(--color-border)] text-[var(--color-text-secondary)]',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-1 text-xs',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <span
        className={cn(badgeVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Badge.displayName = 'Badge';

export { Badge, badgeVariants };
