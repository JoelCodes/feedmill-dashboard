---
phase: 31-role-expansion-and-db-infrastructure
plan: 05
subsystem: ops
tags: [operator-runbook, neon-provisioning, clerk-dashboard, verification-gate, e2e]

requires:
  - phase: 31-01
    provides: "Role union + checkRole + fixtures (consumed by jest gate + page tests)"
  - phase: 31-02
    provides: "drizzle-orm + @neondatabase/serverless installed; src/db/index.ts; drizzle.config.ts (consumed by tsc + next build smoke)"
  - phase: 31-03
    provides: "auth-mill-operator Playwright project + e2e/mill-operator-smoke.spec.ts (consumed by E2E gate)"
  - phase: 31-04
    provides: "page.tsx async RSC + MillReadOnlyStub (under test by playwright + jest gates)"

provides:
  - "Neon project provisioned (operator action)"
  - "Clerk Dashboard test users created: e2e-mill-operator (single-role) + e2e-demo updated to dual-role"
  - "Canonical Phase 31 verification gate executed: tsc + jest + next build + playwright auth-mill-operator all green"
  - "Two pre-existing environmental issues documented (PLAYWRIGHT_BASE_URL stale in .env.local; admin global-setup cold-dev-server timeout)"

affects: [phase-32-schema-and-migrations, phase-33-server-actions, phase-34-production-dashboard]

tech-stack:
  added: []
  patterns: []

key-files:
  created:
    - .planning/phases/31-role-expansion-and-db-infrastructure/31-05-SUMMARY.md
  modified: []

key-decisions:
  - "CI secrets (E2E_MILL_OPERATOR_USER_*): deferred per RESEARCH Open Q4. Current CI workflow (.github/workflows/production-smoke-tests.yml) runs only --project=production-smoke; auth-mill-operator runs locally. Re-evaluate when CI scope broadens."
  - "Final E2E gate verified on warm dev server with PLAYWRIGHT_BASE_URL=http://localhost:3000 (corrected from stale production URL)."

patterns-established: []

requirements-completed: [AUTH-04, DATA-01]

duration: ~35min
completed: 2026-05-12
---

# Phase 31 Plan 05: Operator Runbook + Verification Gate Summary

**Phase 31's manual operator steps completed (Neon provisioning + Clerk Dashboard cutover) and the canonical end-of-phase verification gate (tsc + jest + next build + playwright auth-mill-operator) executed green.**

## Performance

- **Duration:** ~35 min wall clock (operator work + environmental cleanup + gate runs)
- **Tasks:** 5 completed (3 human-action checkpoints + 1 sanity check + 1 verification gate)
- **Files created:** 1 (this SUMMARY.md)
- **Files modified by orchestrator-side cleanup:** 2 (src/app/globals.css Tailwind @source fix; .planning/milestones/v1.3-phases/18-page-migration/18-UI-REVIEW.md literal defusing — committed at 3fb044b before this SUMMARY)

## Task Outcomes

1. **Task 1 — Neon project provisioning:** Operator provisioned a fresh `cgm-dashboard` Neon project; populated `.env.local` with `DATABASE_URL` (pooled `-pooler.neon.tech`) and `DATABASE_URL_UNPOOLED` (direct). Confirmed via the env-check in Task 4.

2. **Task 2 — Clerk Dashboard cutover:** Operator created `e2e-mill-operator+clerk_test@example.com` with `publicMetadata.roles: ['mill_operator']`; updated `e2e-demo+clerk_test@example.com` to `publicMetadata.roles: ['demo', 'mill_operator']`. Sign-out/sign-in propagation completed. JWT decode at jwt.io confirmed both users carry the expected `metadata.roles` claim. Manual browser smoke confirmed Edit/Read-only indicators render per role.

3. **Task 3 — CI secrets decision (decision checkpoint):** Discovery showed `.github/workflows/production-smoke-tests.yml` runs only `--project=production-smoke` (not auth-mill-operator). Decision: **defer** the GitHub Actions secret addition. Will re-evaluate when CI scope broadens.

4. **Task 4 — Pre-gate sanity check:** All 6 required `.env.local` keys present (DATABASE_URL, DATABASE_URL_UNPOOLED, E2E_MILL_OPERATOR_USER_{EMAIL,PASSWORD}, NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY). `.env.local` gitignored via `.env*` pattern (line 40 of `.gitignore`).

5. **Task 5 — Canonical verification gate:**
   - `npx tsc --noEmit` → exit 0 (clean)
   - `npm test -- --watchAll=false` → 394/408 pass (14 pre-existing failures in `src/app/settings/__tests__/page.test.tsx`, documented baseline since commit 073f89d, unrelated to Phase 31)
   - `npm run build` → compiled successfully (no Edge-runtime contamination, no "Module not found: Can't resolve 'fs'" — DATA-08 canonical smoke ✓)
   - `npx playwright test --project=auth-mill-operator` → 6 passed in 9.9s (4 global setup + 1 chromium dependency + 1 smoke spec)

## Deviations and Environmental Issues Surfaced

### 1. Tailwind v4 `@source not` non-recursive glob — fixed in 3fb044b

The dev server hit a `Build Error — Parsing CSS source code failed` from a literal `text-[var(--text-*)]` in `.planning/milestones/v1.3-phases/18-page-migration/18-UI-REVIEW.md` being picked up by Tailwind v4's content scanner. The existing `@source not "../../.planning"` directive was matching only the directory itself, not descendants. **Fix:** glob form `@source not "../../.planning/**/*"`. Closes the recurrence of Phase 27 deferred-items.md item 4.

### 2. `.env.local` `PLAYWRIGHT_BASE_URL` pointed at production — corrected

`.env.local` line 13 had `PLAYWRIGHT_BASE_URL=https://feedmill-dashboard.vercel.app`, which caused the Playwright global setup project to authenticate the new mill-operator user against the production URL. The captured storage state had `vercel.app` domain cookies that didn't apply to the localhost dev server, and the smoke spec redirected to `/sign-in`. **Fix:** updated to `http://localhost:3000` (operator-side `.env.local` edit, gitignored — not committed). Storage states regenerated; final gate green.

### 3. Pre-existing admin global-setup cold-server timeout

The first attempt at regenerating all storage states timed out at `page.waitForFunction` for the admin user (Pitfall 3 territory — `window.Clerk?.loaded` waited > 30s on a cold dev server). On the warm-server retry, admin passed. Pre-existing intermittent flake; not Phase 31-introduced. Noted for future cleanup.

### 4. Pre-existing 14-test baseline failure in `src/app/settings/__tests__/page.test.tsx`

`throwMissingClerkProviderError` from `<ClerkLoading>` in the settings page tests — present at base commit 073f89d, untouched by Phase 31's code changes. Already captured in `.planning/phases/31-role-expansion-and-db-infrastructure/deferred-items.md` (created by Plan 31-02 executor).

## Verification

All canonical Phase 31 gates green; see Task 5 outcomes above.

## Notes for Subsequent Phases

- Phase 32 (schema + migrations) can now consume the provisioned Neon project. `drizzle-kit generate` against `DATABASE_URL_UNPOOLED` is the documented invocation per D-08.
- Phase 33 (server actions) will introduce mutating actions calling `await requireRole('mill_operator')` — the real write gate per D-04.
- Phase 34 (real dashboard UI) replaces `<MillReadOnlyStub>` with the three-column production board; the canEdit prop pattern + DashboardLayout wrapper are preserved.
- The 4 pre-existing Phase 27/Tailwind/Clerk environmental items above remain candidate cleanup work; none block Phase 32+.
