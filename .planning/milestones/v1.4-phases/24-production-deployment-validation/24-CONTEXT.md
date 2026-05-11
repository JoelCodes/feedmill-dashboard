# Phase 24: Production Deployment Validation - Context

**Gathered:** 2026-05-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Validate that Clerk authentication works correctly in production with live keys and proper domain configuration. This phase configures Vercel environment variables, associates the production domain with Clerk, and verifies authentication flows on the live deployment.

**Scope:** Production configuration and validation only. All authentication implementation is complete from Phases 20-23.

</domain>

<decisions>
## Implementation Decisions

### Deployment Target
- **D-01:** Deploy to Vercel. Personal account with existing project. Native Next.js support, automatic env var management per environment.
- **D-02:** Project already deployed but no Clerk env vars configured yet. Need to add all Clerk variables for production and preview environments.
- **D-03:** Using default Vercel subdomain (*.vercel.app) for now. Custom domain deferred to future milestone.

### Environment Setup
- **D-04:** Use same Clerk application with both key types. One Clerk app, dev keys (pk_test_/sk_test_) for preview, live keys (pk_live_/sk_live_) for production. Shared user pool.
- **D-05:** Vercel per-environment configuration: Production uses pk_live_/sk_live_, preview and development use pk_test_/sk_test_. Best practice separation.
- **D-06:** Live Clerk keys already generated. Ready to configure in Vercel.

### Domain Verification
- **D-07:** Associate Vercel subdomain only with Clerk production instance. Custom domain can be added later when acquired.
- **D-08:** Self-hosted sign-in pages on Vercel domain. Requires adding Vercel domain to Clerk's allowed origins in production instance settings.

### Validation Scope
- **D-09:** Both manual and automated validation. Manual smoke test first, then set up automated E2E for ongoing monitoring.
- **D-10:** Create dedicated test user for automated tests. Isolates test activity from real user data.
- **D-11:** Run automated prod tests in CI on deploy via GitHub Actions. Catches regressions automatically after each production deployment.

### Claude's Discretion
None — all areas received explicit user decisions.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Prior Phase Decisions
- `.planning/phases/20-clerk-foundation-setup/20-CONTEXT.md` — D-08 through D-11 for Clerk appearance config, environment variable pattern
- `.planning/phases/21-route-protection/21-CONTEXT.md` — D-01 through D-06 for route protection approach
- `.planning/phases/23-user-experience-integration/23-CONTEXT.md` — D-01 through D-07 for UserButton integration

### Clerk Integration
- `.planning/research/SUMMARY.md` — Phase 4 section details production deployment validation requirements and pitfalls
- `src/middleware.ts` — Current middleware with route protection
- `.env.local` — Development environment variable pattern to replicate in Vercel

### Vercel Deployment
- Vercel Dashboard > Project Settings > Environment Variables — where to configure Clerk keys
- Clerk Dashboard > Production Instance > Domains — where to add Vercel subdomain

### Requirements
- `.planning/ROADMAP.md` — Phase 24 success criteria (5 items)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `.env.local`: Template showing required Clerk environment variables (NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY, NEXT_PUBLIC_CLERK_SIGN_IN_URL, etc.)
- `.env.example`: Public documentation of required env vars
- `playwright.config.ts`: Existing E2E test configuration, extend for production smoke tests
- `tests/e2e/`: Existing E2E tests for route protection, can adapt for production validation

### Established Patterns
- Environment variables: Clerk requires NEXT_PUBLIC_ prefix for client-side key
- Vercel per-environment vars: Production, Preview, Development scopes
- GitHub Actions: Can trigger on Vercel deployment webhook or after push to main

### Integration Points
- Vercel Dashboard: Environment Variables section for production/preview config
- Clerk Dashboard: Production instance domains for self-hosted sign-in pages
- GitHub Actions: New workflow file for production smoke tests

</code_context>

<specifics>
## Specific Ideas

- Add Vercel domain to Clerk allowed origins before deploying with live keys
- Use GitHub Actions with `repository_dispatch` or Vercel webhook to trigger post-deploy validation
- Test user should have a recognizable email pattern (e.g., test-user@cgm-dashboard.app)
- Smoke tests should cover: sign-in, route access, header user display, sign-out

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 24-Production Deployment Validation*
*Context gathered: 2026-05-10*
