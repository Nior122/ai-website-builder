// =============================================================================
// Clerk Configuration
// =============================================================================
// Centralized Clerk setup. Defines allowed redirect paths, appearance
// overrides, and role-checking helpers.
// =============================================================================

/**
 * Redirect paths after auth events.
 */
export const AUTH_REDIRECTS = {
  signInUrl: '/sign-in',
  signUpUrl: '/sign-up',
  afterSignIn: '/dashboard/projects',
  afterSignUp: '/dashboard/projects',
  afterSignOut: '/',
  profileSettings: '/dashboard/settings/profile',
  billingSettings: '/dashboard/settings/billing',
} as const;

/**
 * Clerk appearance overrides for consistent branding.
 */
export const CLERK_APPEARANCE = {
  elements: {
    rootBox: 'mx-auto',
    card: 'shadow-lg border border-neutral-200 rounded-xl',
    formButtonPrimary:
      'bg-neutral-900 hover:bg-neutral-800 text-white font-medium py-2.5 px-4 rounded-lg transition-colors',
    formButtonSecondary:
      'bg-neutral-100 hover:bg-neutral-200 text-neutral-900 font-medium py-2.5 px-4 rounded-lg transition-colors',
    formFieldInput:
      'border border-neutral-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 transition-shadow',
    formFieldLabel: 'text-sm font-medium text-neutral-700',
    headerTitle: 'text-xl font-bold text-neutral-900',
    headerSubtitle: 'text-sm text-neutral-500',
    dividerLine: 'bg-neutral-200',
    dividerText: 'text-xs text-neutral-500 uppercase tracking-wide',
    socialButtonsBlockButton:
      'border border-neutral-300 rounded-lg py-2.5 px-4 text-sm font-medium hover:bg-neutral-50 transition-colors',
    footerActionLink: 'text-neutral-900 font-medium hover:underline',
  },
} as const;

/**
 * Available social login providers.
 */
export const SOCIAL_PROVIDERS = [
  { id: 'google', name: 'Google', icon: 'google' },
  { id: 'github', name: 'GitHub', icon: 'github' },
] as const;

/**
 * Role hierarchy for authorization checks.
 */
const ROLE_HIERARCHY: Record<string, number> = {
  viewer: 0,
  member: 1,
  admin: 2,
  owner: 3,
};

/**
 * Check if a user role has sufficient permission level.
 */
export function hasRole(userRole: string, requiredRole: string): boolean {
  const userLevel = ROLE_HIERARCHY[userRole] ?? -1;
  const requiredLevel = ROLE_HIERARCHY[requiredRole] ?? 999;
  return userLevel >= requiredLevel;
}

/**
 * Check if the user is an admin or higher.
 */
export function isAdmin(role: string): boolean {
  return hasRole(role, 'admin');
}

/**
 * Check if the user is an owner.
 */
export function isOwner(role: string): boolean {
  return hasRole(role, 'owner');
}
