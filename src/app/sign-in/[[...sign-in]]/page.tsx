"use client";

import { SignIn } from "@clerk/nextjs";
import { clerkAppearance } from "@/lib/clerk-theme";
import ThemeToggle from "@/components/ui/ThemeToggle";

/**
 * Sign-in page with CGM Dashboard branding.
 *
 * Uses Clerk's catch-all route pattern [[...sign-in]] to handle:
 * - Initial sign-in
 * - Password reset flows
 * - Email verification
 *
 * Branding matches Sidebar pattern (logo square + app name).
 * Theme toggle positioned in top-right corner for easy access.
 */
export default function SignInPage() {
  return (
    <main
      className="relative flex min-h-screen flex-col items-center justify-center bg-[var(--bg-page)]"
      aria-labelledby="sign-in-heading"
    >
      {/* Theme toggle - top-right corner */}
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      {/* Branding - matches Sidebar pattern */}
      <div className="mb-8 flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-lg bg-[var(--primary)]" aria-hidden="true" />
        <span id="sign-in-heading" className="text-sm font-bold text-[var(--text-primary)]">
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
    </main>
  );
}
