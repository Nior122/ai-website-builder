// =============================================================================
// Sign-In Page
// =============================================================================
// Full sign-in page using Clerk's SignIn component with social providers
// and email/password authentication.
// =============================================================================

import { SignIn } from '@clerk/nextjs';
import { CLERK_APPEARANCE } from '@/lib/auth/config';

export default function SignInPage() {
  return (
    <SignIn
      appearance={CLERK_APPEARANCE}
      routing="path"
      path="/sign-in"
      signUpUrl="/sign-up"
      redirectUrl="/dashboard/projects"
    />
  );
}
