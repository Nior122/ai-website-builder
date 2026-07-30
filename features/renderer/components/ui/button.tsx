// =============================================================================
// Button Component
// =============================================================================
// Reusable CTA button with variants and sizes. Used across all section components.
// =============================================================================

import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:
          'bg-[var(--color-primary-500)] text-white hover:bg-[var(--color-primary-600)] focus-visible:ring-[var(--color-primary-500)] shadow-sm',
        secondary:
          'bg-[var(--color-secondary-500)] text-white hover:bg-[var(--color-secondary-600)] focus-visible:ring-[var(--color-secondary-500)] shadow-sm',
        ghost:
          'bg-transparent text-[var(--color-text)] hover:bg-[var(--color-surface)] focus-visible:ring-[var(--color-primary-500)]',
        outline:
          'border-2 border-[var(--color-border)] bg-transparent text-[var(--color-text)] hover:bg-[var(--color-surface)] focus-visible:ring-[var(--color-primary-500)]',
        danger:
          'bg-[var(--color-error-500)] text-white hover:bg-[var(--color-error-600)] focus-visible:ring-[var(--color-error-500)] shadow-sm',
        success:
          'bg-[var(--color-success-500)] text-white hover:bg-[var(--color-success-600)] focus-visible:ring-[var(--color-success-500)] shadow-sm',
      },
      size: {
        sm: 'h-8 px-3 text-xs rounded-[var(--radius-sm)]',
        md: 'h-10 px-5 text-sm rounded-[var(--radius-md)]',
        lg: 'h-12 px-7 text-base rounded-[var(--radius-lg)]',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  href?: string;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
