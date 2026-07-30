// =============================================================================
// Stats Section Component
// =============================================================================
// Statistics counters with value, label, prefix/suffix. Grid layout.
// Uses IntersectionObserver for scroll-triggered number animation.
// =============================================================================

'use client';

import type { SectionProps } from '../components/section-renderer';
import { useEffect, useRef, useState } from 'react';
import { TrendingUp, Users, Globe, Award, type LucideIcon } from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  'trending-up': TrendingUp,
  users: Users,
  globe: Globe,
  award: Award,
};

function getIcon(iconName?: string): LucideIcon | null {
  if (!iconName) return null;
  return ICON_MAP[iconName.toLowerCase()] || null;
}

function AnimatedCounter({ value, prefix, suffix }: { value: string; prefix?: string; suffix?: string }) {
  const [displayValue, setDisplayValue] = useState('0');
  const ref = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated.current) {
            hasAnimated.current = true;
            animateValue(value, setDisplayValue);
          }
        });
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [value]);

  return (
    <div ref={ref} className="text-4xl font-bold text-[var(--color-text)] sm:text-5xl">
      {prefix && <span className="text-[var(--color-primary-500)]">{prefix}</span>}
      {displayValue}
      {suffix && <span className="text-[var(--color-primary-500)]">{suffix}</span>}
    </div>
  );
}

function animateValue(target: string, setter: (v: string) => void) {
  // Extract numeric part
  const match = target.match(/^([\d,.]+)/);
  if (!match) {
    setter(target);
    return;
  }

  const numericStr = match[1].replace(/,/g, '');
  const targetNum = parseFloat(numericStr);
  const prefix = target.slice(0, target.indexOf(match[1]));
  const suffix = target.slice(target.indexOf(match[1]) + match[1].length);
  const hasDecimal = match[1].includes('.');
  const decimalPlaces = hasDecimal ? match[1].split('.')[1].length : 0;
  const hasComma = match[1].includes(',');
  const duration = 1500;
  const startTime = performance.now();

  function update(currentTime: number) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = targetNum * eased;

    let formatted: string;
    if (hasDecimal) {
      formatted = current.toFixed(decimalPlaces);
    } else {
      formatted = Math.round(current).toString();
    }

    if (hasComma) {
      formatted = formatted.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    setter(`${prefix}${formatted}${suffix}`);

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

export function StatsSection({ section, content }: SectionProps) {
  const headline = (content.headline as string) || '';
  const stats = (content.stats as Array<{
    id: string;
    value: string;
    label: string;
    prefix?: string;
    suffix?: string;
    icon?: string;
  }>) || [];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
      {headline && (
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-[var(--color-text)] sm:text-4xl">
            {headline}
          </h2>
        </div>
      )}

      {stats.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat) => {
            const Icon = getIcon(stat.icon);
            return (
              <div key={stat.id} className="text-center">
                {Icon && (
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-primary-50)]">
                    <Icon className="h-6 w-6 text-[var(--color-primary-500)]" />
                  </div>
                )}
                <AnimatedCounter
                  value={stat.value}
                  prefix={stat.prefix}
                  suffix={stat.suffix}
                />
                <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                  {stat.label}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
