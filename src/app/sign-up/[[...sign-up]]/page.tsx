import { SignUp } from "@clerk/nextjs";
import { clerkAppearance } from "@/lib/clerk-theme";

/**
 * Sign-up page with CGM Dashboard branding.
 *
 * Uses Clerk's catch-all route pattern [[...sign-up]] to handle:
 * - Initial sign-up
 * - Email verification
 * - Additional sign-up steps
 *
 * Branding matches Sidebar pattern (logo square + app name).
 */
export default function SignUpPage() {
  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg-page)]"
      aria-labelledby="sign-up-heading"
    >
      {/* Branding - matches Sidebar pattern */}
      <div className="mb-8 flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-lg bg-[var(--primary)]" aria-hidden="true" />
        <span id="sign-up-heading" className="text-sm font-bold text-[var(--text-primary)]">
          CGM DASHBOARD
        </span>
      </div>

      {/* Clerk SignUp Component */}
      <SignUp
        appearance={clerkAppearance}
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        fallbackRedirectUrl="/"
      />
    </main>
  );
}
