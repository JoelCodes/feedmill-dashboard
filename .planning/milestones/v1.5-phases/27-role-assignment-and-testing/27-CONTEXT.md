# Phase 27: Role Assignment and Testing - Context

**Gathered:** 2026-05-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire real role assignment to Clerk users and verify role-based access control end-to-end. When complete:
- Server components can call `checkRole()` / `requireRole()` for role-aware logic (ACCESS-02)
- Role data flows through the session token (closes Phase 25 success criterion #1) so middleware and utilities read claims without a network call
- Three real Clerk users (demo / no-role / admin) exist and have their roles assigned via the Clerk Dashboard
- Unit tests cover the new utilities, and Playwright E2E covers the four access-control scenarios end-to-end
- Manual UAT confirms the felt behavior across roles before the phase ships

This phase does **not** add new application capabilities — it makes the infrastructure built in Phase 25 / Phase 26 actually enforce roles against real users.

</domain>

<decisions>
## Implementation Decisions

### Utility Function API
- **D-01:** Role utilities live in `src/lib/auth.ts` (auth-focused module; room for related helpers later)
- **D-02:** `checkRole(role: Role): Promise<boolean>` — async, reads `auth().sessionClaims?.metadata?.role`. No network call. Returns `false` if no session or no claim.
- **D-03:** `requireRole(role: Role): Promise<void>` — uses `next/navigation`'s `redirect()`. On wrong role: `redirect('/')` (mirrors middleware D-01 from Phase 25). On missing `userId`: `redirect('/sign-in')`. One-call guard for server components.

### Role Source Migration
- **D-04:** Migrate middleware **and** utilities to read from `auth().sessionClaims?.metadata?.role`. Drop the per-request `clerkClient.users.getUser()` call and the `clerkClient` import.
- **D-05:** Clerk Dashboard JWT template customization is a **manual step** captured in `docs/clerk-setup.md`. The template adds `{"metadata": {"role": "{{user.public_metadata.role}}"}}` to the session token claims.
- **D-06:** No fallback to `clerkClient.getUser()` if the claim is missing — clean migration. Existing sessions get the new claim on next sign-in.
- **D-07:** Document the sign-out / sign-in requirement for existing users in `docs/clerk-setup.md` and the phase verification notes. No programmatic session revocation.

### Testing Strategy
- **D-08:** Unit tests for `checkRole` / `requireRole` using `jest.mock('@clerk/nextjs/server')` to stub `auth()` (same pattern as existing `src/middleware.test.ts`). Cover: matching role, mismatched role, missing `sessionClaims`, missing `userId`, redirect targets for `requireRole`.
- **D-09:** Update `src/middleware.test.ts` to reflect the session-claims source (drop `clerkClient` assertions, add `sessionClaims.metadata.role` assertions).
- **D-10:** Unskip the existing `.skip()`'d test in `e2e/demo-route-protection.spec.ts` and add Playwright auth fixtures using **`@clerk/testing`** (Clerk's official Playwright integration with testing tokens — bypasses CAPTCHA/2FA).
- **D-11:** Four E2E scenarios required to land green:
  1. Demo user accesses `/demo/orders`, `/demo/customers`, `/demo/mill-production` successfully
  2. Non-demo user is redirected to `/` when accessing any `/demo/*` route
  3. Both demo and non-demo authenticated users can access `/settings`
  4. Unauthenticated user accessing `/demo/*` redirects to `/sign-in` (existing test, regression guard)

### Role Assignment Scope
- **D-12:** Three real Clerk users created and role-assigned via the Clerk Dashboard during this phase: `e2e-demo@…` (role: `demo`), `e2e-norole@…` (no `publicMetadata.role`), `e2e-admin@…` (role: `admin`). Admin user exists for completeness even though admin behavior isn't exercised in v1.5.
- **D-13:** Joel creates these users manually in Clerk Dashboard. Email patterns and role assignments documented in `docs/clerk-setup.md`. No backend-API seeding script in this phase.
- **D-14:** Test credentials stored in `.env.local` and documented in `.env.example`:
  - `E2E_DEMO_USER_EMAIL` / `E2E_DEMO_USER_PASSWORD`
  - `E2E_NOROLE_USER_EMAIL` / `E2E_NOROLE_USER_PASSWORD`
  - `E2E_ADMIN_USER_EMAIL` / `E2E_ADMIN_USER_PASSWORD`

### Verification
- **D-15:** Phase verification ends with a manual UAT checklist (in `27-VERIFICATION.md` or the PLAN.md acceptance block): sign in as each of the three users, navigate to `/demo/*` and `/settings`, confirm expected redirect/access behavior visually.

### Claude's Discretion
None — every selected area was explicitly decided.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Roadmap
- `.planning/REQUIREMENTS.md` §v1.5 Requirements — ACCESS-02 requirement and out-of-scope guardrails
- `.planning/ROADMAP.md` §Phase 27 — Success criteria (4 items)

### Prior Phase Decisions (must carry forward)
- `.planning/phases/25-foundation-and-middleware-configuration/25-CONTEXT.md` — Role types (D-05/D-06), redirect-to-root behavior (D-01), DashboardLayout pattern
- `.planning/phases/26-route-restructuring-and-migration/26-CONTEXT.md` — `/demo/*` namespace, settings-always-visible (D-07), context-aware sidebar (D-02)

### Existing Implementation (must integrate with)
- `src/middleware.ts` — Current middleware (will be modified: drop `clerkClient.getUser()`, read from `sessionClaims`)
- `src/middleware.test.ts` — Existing middleware tests (will be updated to match new role source)
- `src/types/clerk.d.ts` — `Role` union and `CustomJwtSessionClaims.metadata.role` declaration (already correct)
- `e2e/demo-route-protection.spec.ts` — Skipped non-demo-redirect test to unskip
- `playwright.config.ts` — Playwright config to extend with `@clerk/testing` setup

### Library Documentation
- `@clerk/testing` Playwright integration — setupClerkTestingToken pattern for E2E auth
- Clerk Dashboard → Sessions → Customize session token — JWT template configuration UI

### Docs to Create
- `docs/clerk-setup.md` — Clerk Dashboard setup reproducibility guide (JWT template JSON, test user email patterns, sign-out/sign-in note)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/middleware.ts`: Pattern for `auth()` usage and route matchers — utilities use the same `auth()` import path.
- `src/middleware.test.ts`: Established Jest mock pattern for `@clerk/nextjs/server` — reuse for utility unit tests.
- `e2e/demo-route-protection.spec.ts`: Existing E2E structure with `test.describe` per requirement — extend for new scenarios.
- `src/types/clerk.d.ts`: Already declares `CustomJwtSessionClaims.metadata.role` — no type changes needed.

### Established Patterns
- Server-side checks via `auth()` from `@clerk/nextjs/server` — utilities follow this idiom.
- Test files colocated with source (e.g., `src/middleware.test.ts` next to `src/middleware.ts`) — place `src/lib/auth.test.ts` next to `src/lib/auth.ts`.
- E2E tests use `test.describe` blocks keyed to requirement IDs (PROT-03, ACCESS-01, etc.) — new tests should reference ACCESS-02 and Phase 27 success criteria.
- `.env.local` is gitignored, `.env.example` documents keys — follow for E2E credentials.

### Integration Points
- `src/lib/auth.ts` (new): Imports `auth` from `@clerk/nextjs/server` and `redirect` from `next/navigation`. Imports `Role` from `@/types/clerk`.
- `src/middleware.ts`: Refactor to read `sessionClaims?.metadata?.role` instead of fetching user. Remove `clerkClient` import.
- `playwright.config.ts`: Add `@clerk/testing` setup hooks for auth fixtures.
- New `e2e` helper (e.g., `e2e/fixtures/auth.ts`): Wraps `@clerk/testing` for signing in as each test user role.

</code_context>

<specifics>
## Specific Ideas

- JWT template JSON shape: `{"metadata": {"role": "{{user.public_metadata.role}}"}}` — must match the existing `CustomJwtSessionClaims.metadata.role` declaration verbatim.
- Test user email convention: `e2e-demo@`, `e2e-norole@`, `e2e-admin@` — single prefix pattern makes them easy to identify in the Clerk Dashboard.
- Acknowledged constraint: Production E2E automation still blocked by Clerk 2FA on custom domains (carried from v1.4) — Phase 27 E2E runs in dev environment only.

</specifics>

<deferred>
## Deferred Ideas

- **Automatic role assignment on sign-up (ROLE-04):** Stays deferred per REQUIREMENTS.md. Phase 27 covers manual assignment only.
- **Admin role behavior:** Admin user exists for testing surface but no admin-only features in v1.5. Future milestone.
- **Programmatic test-user seeding script:** A `scripts/seed-test-users.ts` using `@clerk/backend` could replace manual Dashboard creation. Not in this phase — defer until test-user churn justifies the script.
- **Production E2E with real auth:** Still blocked by Clerk 2FA on the production custom domain. Same blocker as v1.4.

</deferred>

---

*Phase: 27-Role Assignment and Testing*
*Context gathered: 2026-05-11*
