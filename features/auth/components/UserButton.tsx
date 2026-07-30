// =============================================================================
// UserButton Component
// =============================================================================
// Drop-in user avatar button with profile dropdown menu.
// Shows user info, settings link, billing, and sign-out.
// =============================================================================

'use client';

import { UserButton as ClerkUserButton } from '@clerk/nextjs';
import { dark } from '@clerk/themes';

export function UserButton() {
  return (
    <ClerkUserButton
      appearance={{
        baseTheme: dark,
        elements: {
          avatarBox: 'h-9 w-9 rounded-lg',
          userButtonPopoverCard: 'bg-neutral-900 border border-neutral-800 shadow-xl',
          userButtonPopoverActionButton: 'text-neutral-300 hover:text-white hover:bg-neutral-800',
          userButtonPopoverFooter: 'border-t border-neutral-800',
        },
      }}
      afterSignOutUrl="/"
      userProfileMode="modal"
    >
      <ClerkUserButton.MenuItems>
        <ClerkUserButton.Link
          label="Dashboard"
          href="/dashboard/projects"
          labelIcon="📊"
        />
        <ClerkUserButton.Link
          label="Profile Settings"
          href="/dashboard/settings/profile"
          labelIcon="⚙️"
        />
        <ClerkUserButton.Link
          label="Billing"
          href="/dashboard/settings/billing"
          labelIcon="💳"
        />
      </ClerkUserButton.MenuItems>
    </ClerkUserButton>
  );
}
