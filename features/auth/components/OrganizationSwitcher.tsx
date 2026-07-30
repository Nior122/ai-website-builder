// =============================================================================
// OrganizationSwitcher Component
// =============================================================================
// Wraps Clerk's OrganizationSwitcher for team/org management.
// =============================================================================

'use client';

import { OrganizationSwitcher as ClerkOrgSwitcher } from '@clerk/nextjs';

export function OrganizationSwitcher() {
  return (
    <ClerkOrgSwitcher
      appearance={{
        elements: {
          rootBox: 'w-full',
          trigger:
            'w-full justify-start gap-2 bg-neutral-100 hover:bg-neutral-200 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          organizationSwitcherTriggerIcon: 'text-neutral-500',
          popoverCard: 'bg-white border border-neutral-200 shadow-xl rounded-xl',
          organizationPreview: 'gap-2',
          organizationPreviewAvatarContainer: 'rounded-lg overflow-hidden',
          organizationPreviewTextContainer: 'text-sm font-medium',
          createOrganization: 'text-neutral-900 font-medium',
          organizationSwitcherAction: 'text-neutral-900 font-medium',
        },
      }}
      afterCreateOrganizationUrl="/dashboard/projects"
      afterSelectOrganizationUrl="/dashboard/projects"
    />
  );
}
