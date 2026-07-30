// =============================================================================
// Features Section Component
// =============================================================================
// Grid of feature items (icon + title + description).
// Supports grid-2, grid-3, grid-4, and cards layouts.
// =============================================================================

import type { SectionProps } from '../components/section-renderer';
import { Card } from '../components/ui/card';
import {
  Sparkles, Zap, Shield, Globe, Lock, BarChart3,
  Layers, Code, Smartphone, Palette, Cpu, Rocket,
  type LucideIcon
} from 'lucide-react';

// Icon name → Lucide component mapping
const ICON_MAP: Record<string, LucideIcon> = {
  sparkles: Sparkles,
  zap: Zap,
  shield: Shield,
  globe: Globe,
  lock: Lock,
  'bar-chart': BarChart3,
  layers: Layers,
  code: Code,
  smartphone: Smartphone,
  palette: Palette,
  cpu: Cpu,
  rocket: Rocket,
};

function getIcon(iconName?: string): LucideIcon {
  if (!iconName) return Sparkles;
  return ICON_MAP[iconName.toLowerCase()] || Sparkles;
}

function getGridCols(layout: string): string {
  switch (layout) {
    case 'grid-2': return 'grid-cols-1 sm:grid-cols-2';
    case 'grid-4': return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';
    case 'cards': return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
    default: return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
  }
}

export function FeaturesSection({ section, content }: SectionProps) {
  const headline = (content.headline as string) || '';
  const subheadline = (content.subheadline as string) || '';
  const items = (content.items as Array<{
    id: string;
    title: string;
    description: string;
    icon?: string;
    highlight?: boolean;
  }>) || [];

  const gridCols = getGridCols(section.layout);

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

      {/* Grid */}
      {items.length > 0 && (
        <div className={`grid ${gridCols} gap-8`}>
          {items.map((item) => {
            const Icon = getIcon(item.icon);
            return (
              <Card key={item.id} variant={item.highlight ? 'elevated' : 'default'} padding="lg">
                <div className="flex flex-col gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-primary-50)]">
                    <Icon className="h-6 w-6 text-[var(--color-primary-500)]" />
                  </div>
                  <h3 className="text-xl font-semibold text-[var(--color-text)]">
                    {item.title}
                  </h3>
                  <p className="text-[var(--color-text-secondary)]">
                    {item.description}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
