import { SignIn } from "@clerk/nextjs";
import { clerkAppearance } from "@/lib/clerk-theme";

/**
 * Sign-in page with CGM Dashboard branding.
 *
 * Uses Clerk's catch-all route pattern [[...sign-in]] to handle:
 * - Initial sign-in
 * - Password reset flows
 * - Email verification
 *
 * Branding matches Sidebar pattern (logo square + app name).
 */
export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg-page)]">
      {/* Branding - matches Sidebar pattern */}
      <div className="mb-8 flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-lg bg-[var(--primary)]" />
        <span className="text-sm font-bold text-[var(--text-primary)]">
          CGM DASHBOARD
        </span>
      </div>

      {/* Clerk SignIn Component */}
      <SignIn
        appearance={clerkAppearance}
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        fallbackRedirectUrl="/"
      />
    </div>
  );
}
