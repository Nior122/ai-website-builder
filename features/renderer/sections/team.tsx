// =============================================================================
// Team Section Component
// =============================================================================
// Team member cards with avatar, name, role, bio, social links. Grid layout.
// =============================================================================

import type { SectionProps } from '../components/section-renderer';
import { Card } from '../components/ui/card';
import Image from 'next/image';
import { Linkedin, Twitter, Github, Globe } from 'lucide-react';

function SocialIcon({ platform, url }: { platform: string; url: string }) {
  const icons: Record<string, typeof Linkedin> = {
    linkedin: Linkedin,
    twitter: Twitter,
    github: Github,
    website: Globe,
  };
  const Icon = icons[platform.toLowerCase()] || Globe;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-primary-50)] hover:text-[var(--color-primary-500)] transition-colors"
      aria-label={platform}
    >
      <Icon className="h-4 w-4" />
    </a>
  );
}

export function TeamSection({ section, content }: SectionProps) {
  const headline = (content.headline as string) || '';
  const subheadline = (content.subheadline as string) || '';
  const team = (content.team as Array<{
    id: string;
    name: string;
    role: string;
    bio?: string;
    avatar?: string;
    social?: Record<string, string>;
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

      {/* Team Grid */}
      {team.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {team.map((member) => (
            <Card key={member.id} padding="none" variant="outlined" className="overflow-hidden">
              {/* Avatar */}
              <div className="relative h-64 bg-[var(--color-neutral-100)]">
                {member.avatar ? (
                  <Image
                    src={member.avatar}
                    alt={member.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <span className="text-5xl font-bold text-[var(--color-neutral-300)]">
                      {member.name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-6">
                <h3 className="text-lg font-semibold text-[var(--color-text)]">
                  {member.name}
                </h3>
                <p className="text-sm text-[var(--color-primary-500)]">
                  {member.role}
                </p>
                {member.bio && (
                  <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
                    {member.bio}
                  </p>
                )}

                {/* Social Links */}
                {member.social && Object.keys(member.social).length > 0 && (
                  <div className="mt-4 flex gap-2">
                    {Object.entries(member.social).map(([platform, url]) =>
                      url ? (
                        <SocialIcon key={platform} platform={platform} url={url} />
                      ) : null
                    )}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
