---
phase: 28
plan: 02
subsystem: security
tags:
  - security
  - rsc
  - requireRole
  - clerk
  - tdd
dependency_graph:
  requires:
    - src/lib/auth.ts (requireRole guard)
    - src/test/fixtures/clerkAuth.ts (28-01 fixture)
    - src/app/demo/customers/[id]/page.tsx (existing async RSC anchor)
  provides:
    - src/app/demo/customers/[id]/page.tsx (now guarded with await requireRole('demo'))
    - Canonical minimal-delta pattern proven on a real RSC page (D-05 inner guard)
    - First end-to-end consumer of the 28-01 fixture
  affects:
    - .planning/phases/28-client-component-security-audit/28-03-PLAN.md (uses same fixture+pattern)
    - .planning/phases/28-client-component-security-audit/28-04-PLAN.md (uses same fixture+pattern)
    - .planning/phases/28-client-component-security-audit/28-05-PLAN.md (uses same fixture+pattern)
tech_stack:
  added: []
  patterns:
    - guard-as-first-statement (await requireRole('demo') before any data fetch — D-01/RESEARCH §Pitfall 4)
    - redirect-sentinel-throw assertion in async-RSC unit tests (consumed via nextNavigationMockFactory)
    - mockDemoSession-default-in-beforeEach (green-path session is the default; redirect tests override per-case)
key_files:
  created: []
  modified:
    - src/app/demo/customers/[id]/page.tsx (+2 lines: 1 import + 1 guard)
    - src/app/demo/customers/[id]/page.test.tsx (+34 net lines: fixture wiring + 3 new tests + notFound mock-shim cleanup)
decisions:
  - "Replaced the legacy `(notFound as jest.Mock).mockImplementation(...)` shim with the fixture's sentinel-throw `notFound` — the existing notFound test now asserts `.rejects.toThrow('NEXT_NOT_FOUND')` instead. Same intent (verify the notFound branch is reached); canonical pattern consumers in 28-03/04/05 inherit."
  - "Default the green-path session in `beforeEach` via `mockDemoSession()`. Lets existing render-path tests stay free of per-test session setup; only the three new redirect tests override with `mockUnauthenticatedSession()` / `mockNonDemoSession(role)`."
metrics:
  duration: ~10 minutes
  completed_date: "2026-05-12"
  tasks_completed: 2
  files_modified: 2
  tests_added: 3
  tests_total_before: 7
  tests_total_after: 10
  tests_passing: 10
requirements_completed: []
---

# Phase 28 Plan 02: Page-Level requireRole Guard on /demo/customers/[id] Summary

**One-liner:** Two-line minimal-delta addition of `await requireRole('demo')` to the existing async RSC customer-detail page, plus three new branch-coverage tests (sign-in redirect, demo-mismatch redirect for `user`, demo-mismatch redirect for `admin`) proven end-to-end against the 28-01 clerkAuth fixture.

## Performance

- **Duration:** ~10 minutes
- **Tasks:** 2 (TDD RED → GREEN)
- **Files modified:** 2 (1 source, 1 test)

## Accomplishments

- **Canonical pattern proven on a real RSC page.** `src/app/demo/customers/[id]/page.tsx` now exercises the exact "import requireRole + `await requireRole('demo')` as the first statement before `await params`" shape that plans 28-03/04/05 will mirror.
- **Defense-in-depth (D-05) inner guard active.** Even if `src/middleware.ts` ever stops matching `/demo/customers/[id]`, the page-level guard still redirects non-demo sessions to `/` and unauthenticated sessions to `/sign-in`. Verified by the three new tests, which call `CustomerDetailPage(...)` directly and bypass middleware.
- **28-01 fixture exercised end-to-end for the first time.** No API drift surfaced; `clerkAuthMockFactory`, `nextNavigationMockFactory`, `mockAuth`, `mockDemoSession`, `mockNonDemoSession`, and `mockUnauthenticatedSession` all wired cleanly. The hoisting-tolerant factory-import pattern works in practice on a consumer-side file.
- **Existing test count 7 → 10, all passing.** No regressions in the partial-failure or ActivityTimeline tests.

## Task Commits

| # | Task                                                                            | Type   | Commit    |
| - | ------------------------------------------------------------------------------- | ------ | --------- |
| 1 | Write failing redirect-branch tests for CustomerDetailPage (RED)                | test   | `96e8f2f` |
| 2 | Add `requireRole` guard to CustomerDetailPage (GREEN)                           | feat   | `b9d6aab` |

RED → GREEN gate sequence confirmed:
- `96e8f2f` left the suite at `Tests: 3 failed, 7 passed, 10 total` — only the three new branch tests fail (no `requireRole` in production yet); existing tests still green.
- `b9d6aab` adds the two-line guard; suite goes to `Tests: 10 passed, 10 total`.

## Exact Diff Applied

### `src/app/demo/customers/[id]/page.tsx` (+2 lines)

```diff
 import { getOrdersByCustomerId } from '@/services/orders';
+import { requireRole } from '@/lib/auth';

 export default async function CustomerDetailPage({
   params,
 }: {
   params: Promise<{ id: string }>
 }) {
+  await requireRole('demo');
   // CRITICAL: await params (Next.js 16 requirement)
   const { id } = await params;
```

No other lines touched. `Promise.all` shape, `notFound` branch, JSX return — all unchanged. `git diff --numstat` reports `2 0` on this file.

### `src/app/demo/customers/[id]/page.test.tsx` (+54 / −20 lines)

Three changes, all in service of consuming the 28-01 fixture and adding branch coverage:

1. **Fixture imports + factory-wired `jest.mock` calls** moved to the top of the file (Jest-hoisting compatible — the factory import rises with the mock):
   ```ts
   import { clerkAuthMockFactory, nextNavigationMockFactory, mockAuth,
            mockDemoSession, mockNonDemoSession, mockUnauthenticatedSession }
     from '@/test/fixtures/clerkAuth';

   jest.mock('@clerk/nextjs/server', () => clerkAuthMockFactory());
   jest.mock('next/navigation', () => nextNavigationMockFactory());
   ```
   This replaced the old inline 7-line `jest.mock('next/navigation', () => ({ notFound: jest.fn(), ... }))` block and the now-unused `import { notFound }` at line 49 of the old file.

2. **`beforeEach` adds `mockAuth.mockReset(); mockDemoSession();`** as the first two statements. Every existing test now runs with a pre-seeded demo-session pass-through; redirect-branch tests override per-case.

3. **Three new `it(...)` cases** inserted after the "renders CustomerDetailHeader with customer stats" test and before the `partial failure handling` nested describe:
   - `redirects to /sign-in when userId is missing (unauthenticated)` → `mockUnauthenticatedSession()` → asserts `.rejects.toMatchObject({ url: '/sign-in' })`
   - `redirects to / when role is user (non-demo)` → `mockNonDemoSession('user')` → asserts `.rejects.toMatchObject({ url: '/' })`
   - `redirects to / when role is admin (any non-demo role)` → `mockNonDemoSession('admin')` → asserts `.rejects.toMatchObject({ url: '/' })`

## Test Count Before/After

| Group                                | Before | After | Notes                                              |
| ------------------------------------ | ------ | ----- | -------------------------------------------------- |
| `renders / notFound / header stats`  | 3      | 3     | unchanged                                          |
| `redirect branches` (NEW)            | 0      | 3     | sign-in, user-redirect, admin-redirect             |
| `partial failure handling`           | 1      | 1     | unchanged                                          |
| `ActivityTimeline integration`       | 3      | 3     | unchanged                                          |
| **Total**                            | **7**  | **10**| 3 added, 0 removed, 0 modified in behavior         |

> Note: the plan body said "5 → 8" — the existing file actually had 7 tests (the plan undercounted the ActivityTimeline group). All existing tests pass after the migration; the 3 → 10 invariant is verified by `npm test`.

## Fixture-Import Quirks Encountered

**None substantive.** The Jest-hoisting pattern (factory functions exported from the fixture module, then `jest.mock('mod', () => factory())` at consumer top) worked as designed by 28-01. Specifically:

- `clerkAuthMockFactory` and `nextNavigationMockFactory` are reached from the `jest.mock(...)` arrow despite Jest's hoisting — confirming the 28-01 hypothesis that named imports tracked by the hoister rise with the mock call.
- `mockDemoSession()` in `beforeEach` correctly seeds the green-path session for all subsequent tests in the suite.
- Per-test calls to `mockUnauthenticatedSession()` / `mockNonDemoSession()` correctly override the beforeEach default (last-write-wins on `mockAuth.mockResolvedValue`).

The only minor adjustment was unrelated to fixture API: the legacy `(notFound as jest.Mock).mockImplementation(...)` shim in the existing notFound test broke because the fixture's `notFound` is a real sentinel-throw function, not a `jest.fn()`. Cleanup retained the test's intent and uses the fixture's natural throw (see Decisions).

## Decisions Made

1. **Replace `notFound.mockImplementation(...)` shim with the fixture's sentinel-throw.** The fixture's `notFound` already throws `Object.assign(new Error('NEXT_NOT_FOUND'), {})`. The existing notFound-branch test now reads as `.rejects.toThrow('NEXT_NOT_FOUND')` — same coverage, canonical idiom. Removed the now-unused `import { notFound } from 'next/navigation'` line.
2. **Default `mockDemoSession()` in `beforeEach`.** Keeps the 7 existing tests free of per-test session setup. Redirect tests override locally. This is the same idiom 28-03/04/05 should use.

## Deviations from Plan

### Plan-spec deltas (minor)

**1. [Plan-mismatch — neutral] Test count is 7 → 10, not 5 → 8.**
- **Plan said:** "5 → 8" (3 new tests added to an existing 5).
- **Reality:** the existing file had 7 tests (the plan undercounted the `ActivityTimeline integration` and `partial failure handling` groups). Net result is still "3 new tests added; 0 removed; no behavior changes to existing tests" — the canonical pattern is preserved regardless of the absolute count.

**2. [Rule 1 — Bug] Updated the legacy `notFound.mockImplementation` shim.**
- **Found during:** Task 1 first test run.
- **Issue:** Replacing `jest.mock('next/navigation', () => ({ notFound: jest.fn(), ... }))` with `nextNavigationMockFactory()` (which provides a real sentinel-throw `notFound`) broke the existing `calls notFound when customer ID does not exist` test — `notFound.mockImplementation` is not a function on the real function reference.
- **Fix:** Asserted `.rejects.toThrow('NEXT_NOT_FOUND')` directly against the fixture's natural sentinel-throw. Test intent and coverage preserved.
- **Files modified:** `src/app/demo/customers/[id]/page.test.tsx`
- **Verification:** Test passes after the fix; final suite is 10/10.
- **Committed in:** `96e8f2f` (Task 1 RED commit — fixture-wiring + new tests + this cleanup all land together).

### Auto-fixed Issues

See Deviation #2 above. No other Rule 1/2/3 fixes triggered.

---

**Total deviations:** 1 plan-mismatch documentation note, 1 auto-fix (necessary to consume the fixture cleanly).
**Impact on plan:** Zero scope creep. Both adjustments preserve the canonical pattern and the plan's behavioral contract.

## Verification Results

| Check                                                                                | Result                                       |
| ------------------------------------------------------------------------------------ | -------------------------------------------- |
| `npm test -- --runInBand src/app/demo/customers/[id]/page.test.tsx`                  | `Tests: 10 passed, 10 total`                 |
| `grep -c "redirects to /sign-in\|redirects to /" .../page.test.tsx`                  | `3` (≥ 3 required)                           |
| `grep -c "clerkAuthMockFactory\|nextNavigationMockFactory" .../page.test.tsx`        | `5` (≥ 2 required)                           |
| `grep -c "mockDemoSession()" .../page.test.tsx`                                      | `1` (≥ 1 required)                           |
| `grep -c "await requireRole" .../page.tsx`                                           | `1` (exact)                                  |
| `grep -c "from '@/lib/auth'" .../page.tsx`                                           | `1` (exact)                                  |
| `awk '...' .../page.tsx` (guard precedes `await params`)                             | `0` (true)                                   |
| `git diff page.tsx \| grep -c "^+"`                                                  | `3` (≤ 4 allowed)                            |
| `npx tsc --noEmit` errors on `src/app/demo/customers/[id]/page.tsx`                  | `0`                                          |
| Commit sequence                                                                      | `test(28-02) 96e8f2f` → `feat(28-02) b9d6aab`|

## TDD Gate Compliance

- **RED gate:** `test(28-02): add redirect-branch tests for CustomerDetailPage` at `96e8f2f` — suite at `Tests: 3 failed, 7 passed, 10 total`. The three new redirect tests fail because production has no `requireRole` call; existing tests still pass (regression-safe migration).
- **GREEN gate:** `feat(28-02): add page-level demo-role guard to customer detail page` at `b9d6aab` — suite at `Tests: 10 passed, 10 total`.
- **REFACTOR gate:** not needed; the two-line addition is already minimal and is the canonical shape for 28-03/04/05.

## Issues Encountered

**None** beyond the legacy `notFound.mockImplementation` shim noted in Deviations. No fixture-API drift, no Jest-hoisting surprises, no service-mock interactions, no TypeScript errors.

Pre-existing `act(...) wrapping` console warnings in the test output (raised by `Header` inside the existing `renders customer name` / `renders CustomerDetailHeader` tests) predate this plan and are out of scope per the Scope Boundary rule. Logged for awareness only — they do not fail any assertion.

## Known Stubs

**None.** The two new lines are real production code paths; the three new tests cover real branches.

## Threat Flags

None. This plan tightens — not loosens — the trust boundary it touches:

- T-28-02-01 (EoP via middleware drift) — **mitigated** by the new inner guard, verified by tests B and C.
- T-28-02-02 (Info disclosure pre-guard) — **mitigated** by the source assertion that `await requireRole('demo')` precedes the data fetch (acceptance criterion: `awk` line-number check, passing).
- T-28-02-03 (Missing `await` regression) — **mitigated** by the rejects-based test pattern, which would fail loudly if the function returned a never-redirected element instead of throwing.

## Next Phase Readiness

- **Plan 28-03 (orders), 28-04 (customers list), 28-05 (mill production) unblocked.** The canonical pattern (`import { requireRole } from '@/lib/auth';` + `await requireRole('demo');` at the top of the async function body, with the fixture-wired test mock block) is now proven on a real RSC page and ready to be replicated across the three parallel page refactors.
- **No outstanding issues** for the verifier / phase-complete step.

## Self-Check: PASSED

- `src/app/demo/customers/[id]/page.tsx` — FOUND, contains `await requireRole('demo');` before `await params`
- `src/app/demo/customers/[id]/page.test.tsx` — FOUND, contains 3 new redirect tests + fixture imports
- Commit `96e8f2f` (test RED) — FOUND in `git log --oneline -5`
- Commit `b9d6aab` (feat GREEN) — FOUND in `git log --oneline -5`
- `npm test -- --runInBand 'src/app/demo/customers/\[id\]/page.test.tsx'` — `Tests: 10 passed, 10 total`
- `npx tsc --noEmit` on the two modified files — `0` errors

---
*Phase: 28-client-component-security-audit*
*Plan: 02*
*Completed: 2026-05-12*
