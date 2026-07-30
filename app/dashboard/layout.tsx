// =============================================================================
// Dashboard Layout
// =============================================================================
// Protected shell layout for all /dashboard/* routes. Provides sidebar
// navigation, top bar with user button and org switcher, and content area.
// Uses Clerk's auth to gate access server-side.
// =============================================================================

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import prisma from '@/lib/prisma/client';
import { UserButton } from '@/features/auth/components/UserButton';
import { OrganizationSwitcher } from '@/features/auth/components/OrganizationSwitcher';
import { NotificationBell } from '@/features/notifications/components/notification-bell';

// All /dashboard/* routes are per-user (Clerk-gated) and must never be
// statically prerendered. This forces server-render-on-demand for every
// nested route — required so Clerk's publishable-key validation isn't
// exercised at build time against an absent/placeholder key.
export const dynamic = 'force-dynamic';

const NAV_ITEMS = [
  { label: 'Projects', href: '/dashboard/projects', icon: '📁' },
  { label: 'Templates', href: '/dashboard/templates', icon: '🎨' },
  { label: 'AI Generator', href: '/dashboard/generate', icon: '✨' },
  { label: 'Analytics', href: '/dashboard/analytics', icon: '📊' },
  { label: 'Settings', href: '/dashboard/settings', icon: '⚙️' },
  { label: 'Billing', href: '/dashboard/settings/billing', icon: '💳' },
];

const ADMIN_NAV_ITEM = { label: 'Admin', href: '/dashboard/admin', icon: '🛡️' };

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  // Fetch user role to conditionally show admin nav.
  // Gracefully handle database failures (e.g. Neon auto-paused) so the
  // dashboard still renders — the user just won't see the Admin nav item.
  let user: { role: string } | null = null;
  try {
    user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true },
    });
  } catch {
    // Database unreachable — render dashboard without role-dependent UI
  }

  const navItems = user?.role === 'admin'
    ? [...NAV_ITEMS, ADMIN_NAV_ITEM]
    : NAV_ITEMS;

  return (
    <div className="flex h-screen bg-neutral-50">
      {/* ─── Sidebar ──────────────────────────────────────────────── */}
      <aside className="flex w-64 flex-col border-r border-neutral-200 bg-white">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 border-b border-neutral-200 px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900 text-sm font-bold text-white">
            AI
          </div>
          <span className="text-sm font-semibold text-neutral-900">
            Website Builder
          </span>
        </div>

        {/* Organization Switcher */}
        <div className="border-b border-neutral-200 px-3 py-3">
          <OrganizationSwitcher />
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User Button */}
        <div className="border-t border-neutral-200 p-3">
          <UserButton />
        </div>
      </aside>

      {/* ─── Main Content ─────────────────────────────────────────── */}
      <main className="flex-1 overflow-auto">
        {/* Top Bar */}
        <div className="flex h-16 items-center justify-end border-b border-neutral-200 bg-white px-6">
          <NotificationBell />
        </div>

        <div className="mx-auto max-w-7xl px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
