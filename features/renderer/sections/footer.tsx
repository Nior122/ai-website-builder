// =============================================================================
// Footer Section Component
// =============================================================================
// Site footer with brand name, tagline, navigation links, social icons, copyright.
// =============================================================================

import type { SectionProps } from '../components/section-renderer';
import {
  Facebook, Twitter, Instagram, Linkedin, Youtube, Github, Globe,
} from 'lucide-react';

function SocialIcon({ platform, url }: { platform: string; url: string }) {
  const icons: Record<string, typeof Facebook> = {
    facebook: Facebook,
    twitter: Twitter,
    instagram: Instagram,
    linkedin: Linkedin,
    youtube: Youtube,
    github: Github,
    website: Globe,
  };
  const Icon = icons[platform.toLowerCase()] || Globe;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-neutral-800)] text-[var(--color-neutral-400)] hover:bg-[var(--color-primary-600)] hover:text-white transition-colors"
      aria-label={platform}
    >
      <Icon className="h-4 w-4" />
    </a>
  );
}

export function FooterSection({ section, content }: SectionProps) {
  const headline = (content.headline as string) || '';
  const subheadline = (content.subheadline as string) || '';
  const body = (content.body as string) || '';
  const items = (content.items as Array<{
    id: string;
    title: string;
    description: string;
    url?: string;
  }>) || [];

  // Parse social links from body
  let socialLinks: Record<string, string> = {};
  try {
    socialLinks = body ? JSON.parse(body) : {};
  } catch {
    socialLinks = {};
  }

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[var(--color-neutral-900)] text-[var(--color-neutral-300)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            {headline && (
              <h3 className="text-xl font-bold text-white mb-3">
                {headline}
              </h3>
            )}
            {subheadline && (
              <p className="text-sm text-[var(--color-neutral-400)] mb-6">
                {subheadline}
              </p>
            )}

            {/* Social Links */}
            {Object.keys(socialLinks).length > 0 && (
              <div className="flex gap-3">
                {Object.entries(socialLinks).map(([platform, url]) =>
                  url ? (
                    <SocialIcon key={platform} platform={platform} url={url} />
                  ) : null
                )}
              </div>
            )}
          </div>

          {/* Navigation Links */}
          {items.length > 0 && (
            <div className="lg:col-span-2">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
                    Links
                  </h4>
                  <ul className="space-y-2">
                    {items.map((item) => (
                      <li key={item.id}>
                        <a
                          href={item.url || '#'}
                          className="text-sm text-[var(--color-neutral-400)] hover:text-white transition-colors"
                        >
                          {item.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Copyright */}
        <div className="mt-12 pt-8 border-t border-[var(--color-neutral-800)]">
          <p className="text-sm text-[var(--color-neutral-500)]">
            &copy; {currentYear} {headline || 'Your Company'}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
