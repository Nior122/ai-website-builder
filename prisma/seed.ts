// =============================================================================
// Database Seed Script
// =============================================================================
// Seeds the database with default feature flags, templates, and a demo
// organization. Run with: npx prisma db seed
// =============================================================================

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...\n');

  // ─── Feature Flags ────────────────────────────────────────────────
  const flags = [
    { key: 'ai_generation', name: 'AI Generation', description: 'Enable AI website generation', enabled: true, rollout: 100 },
    { key: 'export_engine', name: 'Export Engine', description: 'Enable project exports', enabled: true, rollout: 100 },
    { key: 'deployment', name: 'Deployments', description: 'Enable one-click deployment', enabled: true, rollout: 50 },
    { key: 'collaboration', name: 'Real-time Collaboration', description: 'Enable multi-user editing', enabled: false, rollout: 0 },
    { key: 'blog_engine', name: 'Blog Engine', description: 'AI-powered blog generation', enabled: false, rollout: 0 },
    { key: 'analytics_dashboard', name: 'Analytics Dashboard', description: 'Built-in analytics', enabled: false, rollout: 0 },
    { key: 'custom_fonts', name: 'Custom Fonts', description: 'Upload and use custom fonts', enabled: false, rollout: 0 },
    { key: 'multi_language', name: 'Multi-Language', description: 'Multi-language site support', enabled: false, rollout: 0 },
  ];

  for (const flag of flags) {
    await prisma.featureFlag.upsert({
      where: { key: flag.key },
      create: flag,
      update: { enabled: flag.enabled, rollout: flag.rollout },
    });
  }
  console.log(`  ✓ ${flags.length} feature flags`);

  // ─── Templates ────────────────────────────────────────────────────
  const templates = [
    {
      name: 'Modern Restaurant',
      slug: 'modern-restaurant',
      description: 'Elegant restaurant template with menu, reservations, and gallery',
      industry: 'restaurant',
      tags: ['restaurant', 'food', 'dining'],
      featured: true,
      data: {
        pages: ['home', 'menu', 'about', 'reservations', 'gallery', 'contact'],
        theme: 'luxury',
        sections: ['hero', 'features', 'testimonials', 'cta'],
      },
    },
    {
      name: 'Tech Startup',
      slug: 'tech-startup',
      description: 'Clean, conversion-focused template for SaaS and tech companies',
      industry: 'technology',
      tags: ['technology', 'saas', 'startup'],
      featured: true,
      data: {
        pages: ['home', 'features', 'pricing', 'about', 'blog', 'contact'],
        theme: 'modern',
        sections: ['hero', 'features', 'pricing', 'testimonials', 'cta'],
      },
    },
    {
      name: 'Law Firm Professional',
      slug: 'law-firm',
      description: 'Authoritative template for legal practices and consultants',
      industry: 'legal',
      tags: ['legal', 'law', 'professional'],
      featured: true,
      data: {
        pages: ['home', 'practice-areas', 'attorneys', 'about', 'contact'],
        theme: 'corporate',
        sections: ['hero', 'features', 'team', 'testimonials', 'cta'],
      },
    },
    {
      name: 'Fitness Studio',
      slug: 'fitness-studio',
      description: 'High-energy template for gyms and personal trainers',
      industry: 'fitness',
      tags: ['fitness', 'gym', 'health'],
      featured: true,
      data: {
        pages: ['home', 'classes', 'trainers', 'pricing', 'schedule', 'contact'],
        theme: 'creative',
        sections: ['hero', 'features', 'pricing', 'cta'],
      },
    },
    {
      name: 'Real Estate Listings',
      slug: 'real-estate',
      description: 'Property-focused template with listings and agent profiles',
      industry: 'real-estate',
      tags: ['real estate', 'property', 'listings'],
      featured: true,
      data: {
        pages: ['home', 'listings', 'agents', 'about', 'contact'],
        theme: 'corporate',
        sections: ['hero', 'features', 'team', 'cta'],
      },
    },
    {
      name: 'Creative Agency',
      slug: 'creative-agency',
      description: 'Bold, visually striking template for creative agencies',
      industry: 'creative-agency',
      tags: ['agency', 'creative', 'portfolio'],
      featured: true,
      data: {
        pages: ['home', 'work', 'services', 'team', 'blog', 'contact'],
        theme: 'creative',
        sections: ['hero', 'features', 'testimonials', 'cta'],
      },
    },
  ];

  for (const template of templates) {
    await prisma.template.upsert({
      where: { slug: template.slug },
      create: template,
      update: { name: template.name, description: template.description },
    });
  }
  console.log(`  ✓ ${templates.length} templates`);

  console.log('\n✅ Seed complete');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
