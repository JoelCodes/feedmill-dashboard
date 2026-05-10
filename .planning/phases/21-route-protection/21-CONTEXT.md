# Phase 21: Route Protection - Context

**Gathered:** 2026-05-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Verify and harden route protection so unauthenticated users cannot access dashboard pages. This phase validates that the middleware configured in Phase 20 correctly protects all dashboard routes and implements the proper redirect flow.

**Scope:** Verification via automated E2E tests, not new middleware implementation (middleware exists from Phase 20).

</domain>

<decisions>
## Implementation Decisions

### Root Path Handling
- **D-01:** Root path (`/`) stays as the dashboard home page — protected like all other routes.
- **D-02:** After sign-in with no specific page requested, user lands on `/` (root dashboard home).

### Verification Approach
- **D-03:** Use automated E2E tests with Playwright to verify route protection.
- **D-04:** Test scope: unauthenticated redirect behavior only — no authenticated access tests in this phase.
- **D-05:** Test coverage: only success criteria routes from roadmap (`/orders`, `/customers`, `/mill-production`, `/settings`).
- **D-06:** Include return URL verification — test that after sign-in, user is redirected back to originally requested page.

### Claude's Discretion
None — all areas received explicit user decisions.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 20 Foundation
- `.planning/phases/20-clerk-foundation-setup/20-CONTEXT.md` — Prior decisions about middleware configuration, public routes, return URL behavior

### Clerk Integration
- `.planning/research/SUMMARY.md` — Research summary with pitfall #2 (Default Public Routes) and route protection patterns
- `src/middleware.ts` — Existing middleware with `auth.protect()` and `createRouteMatcher`

### Requirements
- `.planning/REQUIREMENTS.md` — PROT-01 (redirect to sign-in), PROT-02 (all dashboard pages require auth)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/middleware.ts`: Clerk middleware already configured with `auth.protect()` for non-public routes
- `createRouteMatcher` for public routes (`/sign-in(.*)`, `/sign-up(.*)`)

### Established Patterns
- Middleware-based protection: All routes protected by default except explicit public routes
- Clerk's `returnBackUrl` parameter handles post-sign-in redirect automatically

### Integration Points
- New Playwright tests will live in `tests/` or `e2e/` directory
- Tests verify middleware behavior without modifying it

### Protected Routes (from codebase scan)
- `/` (root dashboard)
- `/orders`
- `/customers`
- `/customers/[id]`
- `/mill-production`
- `/settings`
- `/inventory`
- `/shipments`

### Public Routes (from middleware)
- `/sign-in(.*)`
- `/sign-up(.*)`

</code_context>

<specifics>
## Specific Ideas

- Playwright tests should verify each protected route redirects to `/sign-in` when accessed unauthenticated
- Return URL test: access `/orders` → redirect to `/sign-in` → complete sign-in → land on `/orders`
- Tests should run in CI to catch regressions

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 21-Route Protection*
*Context gathered: 2026-05-09*
