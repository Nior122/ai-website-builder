// =============================================================================
// Settings Page
// =============================================================================
// Dashboard settings page — profile, account, and preferences.
// =============================================================================

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/ui';
import { AIProviderTest } from '@/components/settings/AIProviderTest';

export default async function SettingsPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage your account and preferences"
      />

      <div className="space-y-6">
        {/* Profile Section */}
        <section className="rounded-xl border border-neutral-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-neutral-900">Profile</h2>
          <p className="text-sm text-neutral-500">
            Manage your profile settings through Clerk. Click the button below to open your profile.
          </p>
        </section>

        {/* AI Configuration Section */}
        <AIProviderTest />

        {/* Danger Zone */}
        <section className="rounded-xl border border-red-200 bg-white p-6">
          <h2 className="mb-2 text-lg font-semibold text-red-600">Danger Zone</h2>
          <p className="mb-4 text-sm text-neutral-500">
            Permanently delete your account and all associated data.
          </p>
          <button className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
            Delete Account
          </button>
        </section>
      </div>
    </div>
  );
}
