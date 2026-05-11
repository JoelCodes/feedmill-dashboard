---
plan: 20-03
phase: 20-clerk-foundation-setup
type: gap_closure
completed: 2026-05-10
status: complete
requirements: [AUTH-03]
---

# Summary: Gap Closure - Clerk URL Environment Variables

## What Was Built

Added missing Clerk URL environment variables (`NEXT_PUBLIC_CLERK_SIGN_IN_URL` and `NEXT_PUBLIC_CLERK_SIGN_UP_URL`) to configure custom sign-in/sign-up page routing.

**Purpose:** Without these variables, Clerk's `auth.protect()` middleware redirects unauthenticated users to Clerk's hosted authentication pages at accounts.clerk.com instead of the custom `/sign-in` route with CGM Dashboard branding and theme support.

## Tasks Completed

| # | Task | Status |
|---|------|--------|
| 1 | Add Clerk URL environment variables to .env.local and .env.example | Done |
| 2 | Verify build succeeds with new configuration | Done |

## Key Files

### Created
- None

### Modified
- `.env.local` - Added NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in and NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
- `.env.example` - Added documented template for Clerk URL configuration

## Verification

- [x] `grep -c "NEXT_PUBLIC_CLERK_SIGN_IN_URL" .env.local .env.example` returns non-zero for both files
- [x] `npm run build` succeeds without errors
- [x] Sign-in page route (/sign-in) compiles correctly

## Issues Encountered

None. Straightforward configuration change.

## Self-Check: PASSED

All verification criteria met:
- .env.local contains NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
- .env.local contains NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
- .env.example documents both variables with comments
- Build completes successfully

## Gap Closure Context

This plan addresses the UAT gap identified in Test 4 (Theme Toggle on Sign-in Page). The test required accessing the sign-in page to verify theme toggle functionality, but without the URL configuration, users were redirected to Clerk's hosted pages instead of the custom `/sign-in` route.

With this fix, unauthenticated users will be redirected to `/sign-in` where they can see the themed SignIn component that respects the dashboard's light/dark mode settings.
