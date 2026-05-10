---
status: resolved
trigger: "Clerk redirecting to hosted sign-in instead of custom page"
created: 2026-05-09T00:00:00Z
updated: 2026-05-10T12:00:00Z
resolved_by: "20-03-PLAN.md"
---

## Current Focus

hypothesis: CONFIRMED - Missing NEXT_PUBLIC_CLERK_SIGN_IN_URL and NEXT_PUBLIC_CLERK_SIGN_UP_URL environment variables cause Clerk to default to hosted pages
test: Verified against Clerk documentation
expecting: N/A - root cause confirmed
next_action: Return diagnosis

## Symptoms

expected: When unauthenticated users access protected routes, middleware should redirect to /sign-in (local page)
actual: User is redirected to Clerk's hosted sign-in page (accounts.clerk.com)
errors: No error messages - just wrong redirect destination
reproduction: Access any protected route while unauthenticated
started: After Phase 20 implementation of Clerk authentication

## Eliminated

## Evidence

- timestamp: 2026-05-09T00:01:00Z
  checked: src/middleware.ts
  found: Uses clerkMiddleware with auth.protect() for non-public routes. No explicit signInUrl configuration passed to protect().
  implication: When auth.protect() redirects, it needs to know where to send users - currently using Clerk default (hosted page)

- timestamp: 2026-05-09T00:02:00Z
  checked: src/app/sign-in/[[...sign-in]]/page.tsx
  found: Custom sign-in page exists with correct catch-all route pattern, SignIn component has routing="path" and path="/sign-in"
  implication: Page is correctly set up, but Clerk middleware doesn't know to redirect here

- timestamp: 2026-05-09T00:03:00Z
  checked: src/app/layout.tsx
  found: ClerkProvider has no signInUrl or signUpUrl props configured
  implication: ClerkProvider doesn't know where custom sign-in page is located

- timestamp: 2026-05-09T00:04:00Z
  checked: .env.local
  found: Only has NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY. Missing NEXT_PUBLIC_CLERK_SIGN_IN_URL and NEXT_PUBLIC_CLERK_SIGN_UP_URL
  implication: Clerk has no way of knowing custom pages exist, defaults to hosted

## Resolution

root_cause: Missing environment variables NEXT_PUBLIC_CLERK_SIGN_IN_URL and NEXT_PUBLIC_CLERK_SIGN_UP_URL that tell Clerk where custom sign-in/sign-up pages are located. Per Clerk documentation, these variables must be set to tell Clerk where the <SignIn /> and <SignUp /> components are hosted. Without them, Clerk defaults to its hosted authentication pages at accounts.clerk.com.
fix: Add to .env.local: NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in and NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
verification: PASSED - env vars added in 20-03, build succeeds
files_changed: [".env.local", ".env.example"]
