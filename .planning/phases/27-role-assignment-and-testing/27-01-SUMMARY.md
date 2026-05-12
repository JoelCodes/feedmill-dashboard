---
phase: 27-role-assignment-and-testing
plan: 01
subsystem: auth
tags: [clerk, rbac, auth, server-utilities, tdd, jest, nextjs]

# Dependency graph
requires:
  - phase: 25-foundation-and-middleware-configuration
    provides: "Role union type and CustomJwtSessionClaims declaration in src/types/clerk.d.ts; canonical await auth() destructure pattern in src/middleware.ts"
  - phase: 26-route-restructuring-and-migration
    provides: "Demo namespace under /demo/* — the consumer surface for requireRole('demo')"
provides:
  - "checkRole(role): Promise<boolean> — server-only role probe reading sessionClaims.metadata.role; no Clerk Backend API call (ACCESS-02)"
  - "requireRole(role): Promise<void> — server-only guard that redirects to /sign-in on missing userId, / on wrong role (ACCESS-02)"
  - "Sentinel-throw redirect mock pattern for unit-testing next/navigation.redirect() under Jest (RESEARCH §Pattern 3, first use in repo)"
affects: [27-02, 27-03, 27-04, 28-client-component-security-audit]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Server-only utility module reading auth() claims (first src/lib/* file to call @clerk/nextjs/server)"
    - "Jest mock of next/navigation.redirect() via sentinel-throw (Error with .url) so requireRole's side-effect is observable in tests"
    - "describe-per-export convention extended from src/lib/utils.test.ts to a 2-export module (checkRole + requireRole)"

key-files:
  created:
    - "src/lib/auth.ts (75 LOC) — checkRole + requireRole exports"
    - "src/lib/auth.test.ts (90 LOC) — 8 it() cases, fully green"
    - ".planning/phases/27-role-assignment-and-testing/deferred-items.md — log of pre-existing baseline issues found during regression check"
  modified: []

key-decisions:
  - "Mock redirect() with sentinel-throw rather than jest.fn() so requireRole's never-returns control flow is faithfully tested (RESEARCH Pitfall 5)"
  - "Plain mockAuth = jest.fn() returning mockResolvedValue per case — no shared fixtures; each test sets its own auth shape for clarity"
  - "Module-level JSDoc explicitly documents server-only nature (mitigation T-27-02); per-function JSDoc documents no-network-call guarantee (T-27-01) and never-returns-when-redirecting (D-03)"

patterns-established:
  - "Pattern (auth-utility): Server-only async function reads `await auth()` claims, no Backend API call — the template for any future role/permission helpers under src/lib/auth.ts"
  - "Pattern (redirect-test): jest.mock('next/navigation', () => ({ redirect: (url) => { throw Object.assign(new Error('NEXT_REDIRECT'), { url }) } })) + await expect(fn()).rejects.toMatchObject({ url: '...' }) — applicable to any future test of a server function that calls redirect()"

requirements-completed: [ACCESS-02]

# Metrics
duration: 3min
completed: 2026-05-12
---

# Phase 27 Plan 01: checkRole + requireRole utility (TDD) Summary

**Server-only role utilities `checkRole(role)` and `requireRole(role)` exported from `src/lib/auth.ts`, reading session-JWT claims with no Clerk Backend API call, fully TDD-driven against an 8-case Jest suite (all green).**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-05-12T01:19:11Z
- **Completed:** 2026-05-12T01:22:27Z (approximate, see commit timestamps)
- **Tasks:** 3 (RED → GREEN → REFACTOR)
- **Files created:** 3 (2 source + 1 deferred-items log)
- **Files modified:** 0 (clean greenfield)

## Accomplishments
- Delivered the ACCESS-02 utility contract end-to-end: signature, behavior, and JSDoc all match the locked D-01/D-02/D-03 decisions verbatim.
- 8/8 unit tests green, covering all 5 missing-data paths for `checkRole` and all 3 redirect/resolve branches for `requireRole`.
- Introduced the sentinel-throw redirect mock pattern to the repo (first use of `next/navigation.redirect()` server-side).
- Confirmed zero `tsc` errors in the new files (the 21 pre-existing baseline errors are all in unrelated test fixtures and exist at `a78167a`).

## Task Commits

Each task was committed atomically per the TDD cycle:

1. **Task 1 (RED): Author src/lib/auth.test.ts with 8 failing test cases** — `0ef19f2` (test)
2. **Task 2 (GREEN): Implement src/lib/auth.ts so all 8 tests pass** — `bdb2d03` (feat)
3. **Task 3 (REFACTOR): JSDoc polish and full-suite regression check** — `2de725e` (refactor)

## Files Created/Modified

- `src/lib/auth.ts` (created, 75 LOC) — module-level server-only JSDoc + two exported async functions; imports from `@clerk/nextjs/server` (`auth`), `next/navigation` (`redirect`), and `@/types/clerk` (`Role`).
- `src/lib/auth.test.ts` (created, 90 LOC) — `describe('checkRole')` with 5 cases, `describe('requireRole')` with 3 cases; `mockAuth = jest.fn()` reset per `beforeEach`; sentinel-throw `redirect` mock.
- `.planning/phases/27-role-assignment-and-testing/deferred-items.md` (created) — audit trail confirming pre-existing baseline issues (jest-picks-up-playwright e2e specs, mockData tsc drift) are not caused by this plan.

## Decisions Made

- **Mock shape for `auth()`:** `const mockAuth = jest.fn(); jest.mock('@clerk/nextjs/server', () => ({ auth: () => mockAuth() }))`. Wrapping `mockAuth()` in a callable expression keeps the export shape stable across `jest.mock` hoisting and lets each test set `mockResolvedValue` cleanly.
- **Mock shape for `redirect()`:** Sentinel-throw `Object.assign(new Error('NEXT_REDIRECT'), { url })` rather than a plain `jest.fn()` spy. Mirrors real Next.js runtime control flow — a plain spy would let the function under test continue executing past the redirect call and mask bugs (RESEARCH §Pitfall 5).
- **JSDoc tone:** Documented the no-network-call guarantee (D-02) and never-returns-when-redirecting note (D-03) directly in each function's JSDoc, plus a module-level server-only warning. Each function has one `@example` block in line with the `src/lib/utils.ts` precedent.

## Deviations from Plan

None — plan executed exactly as written. Three atomic commits land in RED → GREEN → REFACTOR sequence with the exact conventional-commit prefixes specified in `<done>` blocks.

## Issues Encountered

### Pre-existing baseline failures discovered during Task 3 full-suite regression check

Task 3's acceptance criterion `npm test` exits zero, but the broader suite has **14 pre-existing failures** and **21 pre-existing `tsc` errors** that are **not** caused by this plan. Audit trail in `.planning/phases/27-role-assignment-and-testing/deferred-items.md` documents the reproduction:

- Temporarily removed `src/lib/auth.ts` and `src/lib/auth.test.ts` from the worktree and re-ran the failing commands; failures persist identically at base commit `a78167a`.
- The 14 Jest failures come from Playwright e2e specs (`e2e/route-protection.spec.ts`, `e2e/demo-route-protection.spec.ts`, `e2e/production-smoke.spec.ts`) — `jest.config.ts` is missing `testPathIgnorePatterns: ['<rootDir>/e2e/']`, so Jest tries to run them and `@playwright/test` throws `throwIfRunningInsideJest`. Plus one settings page test failure also pre-existing.
- The 21 tsc errors are all mock-data shape drift in `*.test.tsx`/`*.test.ts` fixtures (missing `customerId` on `Order` and `activeBins` on `CustomerStats`) — zero errors in `src/lib/auth.ts` or `src/lib/auth.test.ts`.

**Per execution scope-boundary rule** ("only auto-fix issues DIRECTLY caused by the current task's changes"), I did not fix these. The targeted plan-scope verification — `npm test -- src/lib/auth.test.ts` — is fully green (8/8 passing) and `tsc` reports zero errors for the new files. Pre-existing failures are logged for a future hygiene/cleanup plan.

## User Setup Required

None — no external service configuration required for this plan. (Phase 27 plans 02–05 will require Clerk Dashboard work per the phase CONTEXT; not in scope for 27-01.)

## TDD Gate Compliance

| Gate | Required commit | Actual commit | Status |
|------|-----------------|---------------|--------|
| RED | `test(27-01): …` before any implementation | `0ef19f2 test(27-01): add failing tests for checkRole and requireRole (RED)` | OK |
| GREEN | `feat(27-01): …` after RED | `bdb2d03 feat(27-01): implement checkRole and requireRole utilities (GREEN)` | OK |
| REFACTOR | `refactor(27-01): …` after GREEN (optional) | `2de725e refactor(27-01): polish JSDoc for checkRole and requireRole (REFACTOR)` | OK |

RED gate verified by `npm test -- src/lib/auth.test.ts` producing `Cannot find module './auth'` before the GREEN commit. GREEN gate verified by the same command producing `Tests: 8 passed, 8 total` after.

## Next Phase Readiness

- `src/lib/auth.ts` is now importable as `@/lib/auth` from any server component or route handler. Plans 27-02 onwards (middleware migration, JWT template docs, Playwright fixtures, E2E scenarios) can consume `checkRole` / `requireRole` directly.
- No blockers introduced. Plan 27-02 (middleware refactor to read `sessionClaims.metadata.role`) is independent and can proceed.

## Self-Check: PASSED

**File existence:**
- FOUND: `src/lib/auth.ts`
- FOUND: `src/lib/auth.test.ts`
- FOUND: `.planning/phases/27-role-assignment-and-testing/deferred-items.md`

**Commit existence:**
- FOUND: `0ef19f2` (RED)
- FOUND: `bdb2d03` (GREEN)
- FOUND: `2de725e` (REFACTOR)

**Behavioral verification:**
- `npm test -- src/lib/auth.test.ts` exits 0 with `Tests: 8 passed, 8 total`.
- `npx tsc --noEmit` reports zero errors in `src/lib/auth.ts` and `src/lib/auth.test.ts` (21 pre-existing errors elsewhere, documented in deferred-items.md).
- `grep -F "clerkClient" src/lib/auth.ts` returns no matches (clean session-claim migration, D-04/D-06).

---
*Phase: 27-role-assignment-and-testing*
*Completed: 2026-05-12*
