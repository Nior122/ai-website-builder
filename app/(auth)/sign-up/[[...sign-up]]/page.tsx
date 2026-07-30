// =============================================================================
// Sign-Up Page
// =============================================================================
// Full sign-up page using Clerk's SignUp component.
// =============================================================================

import { SignUp } from '@clerk/nextjs';
import { CLERK_APPEARANCE } from '@/lib/auth/config';

export default function SignUpPage() {
  return (
    <SignUp
      appearance={CLERK_APPEARANCE}
      routing="path"
      path="/sign-up"
      signInUrl="/sign-in"
      redirectUrl="/dashboard/projects"
    />
  );
}
