---
phase: 31-role-expansion-and-db-infrastructure
plan: 04
subsystem: auth
tags: [rsc, clerk, mill-operator, canEdit, presentational-component, tdd]

requires:
  - phase: 31-01
    provides: "checkRole(role: Role): Promise<boolean>; mockMillOperatorSession(); mockDualRoleSession(); 'mill_operator' in Role union"
  - phase: 28
    provides: "RSC + client wrapper pattern (await auth() in async server component → boolean prop to client child)"

provides:
  - "src/app/page.tsx — minimal async RSC stub with auth gate (D-02) + canEdit boolean (D-03)"
  - "src/components/MillReadOnlyStub.tsx — 'use client' presentational component with data-mode='read-only'|'edit' indicator; zero clerk/server imports (D-03 security boundary preserved)"
  - "4 RSC behavior branches under test: unauth-redirect, read-only, edit-mill_operator, edit-dual-role"

affects: [phase-34-production-dashboard, phase-33-server-actions]

tech-stack:
  added: []
  patterns: ["Phase-28 RSC+client pattern reused for the canEdit boolean-prop flow"]

key-files:
  created:
    - src/components/MillReadOnlyStub.tsx
  modified:
    - src/app/page.tsx
    - src/app/page.test.tsx

key-decisions:
  - "RED-GREEN-GREEN sequence: page.test.tsx behavior branches written FIRST (failing), then MillReadOnlyStub built (allows page.tsx to import a real client component), then page.tsx rewritten (tests pass)"
  - "MillReadOnlyStub.tsx is structurally enforced as presentational only — Plan 31-04 Task 2 acceptance criteria included NEGATIVE grep assertions on `checkRole`, `requireRole`, `@clerk/nextjs`, `<Protect`, `import 'server-only'` (all must return 0). All five enforced (verified)."
  - "Open Question 1 resolution honored: canEdit branches live in `src/app/page.test.tsx`, NOT a standalone `MillReadOnlyStub.test.tsx`. The stub itself is trivial enough that branch coverage on the RSC parent is sufficient."

patterns-established:
  - "Pattern (reaffirmed): server-side capability flag → client component prop. checkRole runs in the RSC, canEdit boolean flows into <MillReadOnlyStub canEdit={canEdit}>. Phase 33 server actions will use requireRole as the actual write gate."
  - "Pattern (new for v2.0): UI mode indicator via data-mode attribute. The 'use client' presentational stub renders `data-mode='read-only'|'edit'` for both Jest and Playwright assertions. Plan 31-03's e2e smoke spec consumes this same attribute."

requirements-completed: [AUTH-02, AUTH-03]

duration: 7min
completed: 2026-05-12
---

# Phase 31 Plan 04: Page Rewrite + MillReadOnlyStub Summary

**`src/app/page.tsx` now derives canEdit server-side from `checkRole('mill_operator')` and passes it to a presentational `<MillReadOnlyStub>` client component — fulfilling D-01..D-05 enforcement model without leaking Clerk into the client bundle.**

## Performance

- **Duration:** ~7 min (agent stalled before SUMMARY commit; orchestrator wrote SUMMARY after spot-checking the three task commits per workflow §"Completion signal fallback")
- **Started:** 2026-05-12T18:14:39-07:00 (first task commit)
- **Completed:** 2026-05-12T18:20:46-07:00 (last task commit)
- **Tasks:** 3 completed (RED → GREEN-stub → GREEN-page)
- **Files modified:** 3 (1 created, 2 modified)

## Accomplishments

- 4 RSC behavior branches under test cover D-01..D-05 enforcement model (RED → GREEN sequence)
- MillReadOnlyStub.tsx structurally enforced as presentational only — zero clerk/server imports, line 1 is `'use client';`
- Coming Soon placeholder retired; `/` now an auth-gated read-only-or-edit landing per D-01

## Task Commits

Each task was committed atomically on the worktree branch `worktree-agent-a01e2024fd4475c4c`:

1. **Task 1: RED — rewrite page.test.tsx for async RSC + canEdit branches** — `7f0f33a` (test)
2. **Task 2: GREEN part 1 — add MillReadOnlyStub presentational stub** — `6a7f18d` (feat)
3. **Task 3: GREEN part 2 — rewrite page.tsx as async RSC with auth gate + canEdit** — `b89394e` (feat)

**SUMMARY commit:** added post-hoc by orchestrator after the executor agent stalled on stream-idle-timeout (#2410) immediately before its scheduled SUMMARY write. All three task commits land cleanly on the branch; spot-checks (security-critical grep, tsc, 4/4 page.test.tsx passes) verified before merge.

## Files Created/Modified

- `src/components/MillReadOnlyStub.tsx` — new `'use client'` component; renders `data-mode='read-only'|'edit'` indicator from canEdit prop. No imports from `@clerk/*`, `next/server`, or `src/lib/auth`. Phase 34 will replace this with the real three-column board.
- `src/app/page.tsx` — was Coming Soon placeholder; now async RSC: `await auth()` → `redirect('/sign-in')` on missing userId, `await checkRole('mill_operator')` for canEdit, render inside `<DashboardLayout><MillReadOnlyStub canEdit={canEdit} /></DashboardLayout>`.
- `src/app/page.test.tsx` — was DashboardLayout-wrapper assertion; now 4 behavior branches: (1) unauth redirect, (2) authenticated non-operator read-only, (3) mill_operator edit, (4) dual-role demo+mill_operator edit.

## Decisions Made

Followed plan as written — no Rule-2 or Rule-3 deviations during execution. The orchestrator post-hoc SUMMARY write is a Rule-1 mechanical fill-in to satisfy the worktree-mode contract (SUMMARY must be committed before worktree removal), NOT a content deviation. All claimed work in this SUMMARY is verified against the three task commits and live worktree files.

## Deviations from Plan

None at the task-execution level. The post-hoc SUMMARY write is an orchestrator-side recovery from a known runtime issue (#2410 stream idle timeout), documented in workflow §"Completion signal fallback".

## Verification

Spot-checks executed by the orchestrator inside the worktree before merge:

- `head -1 src/components/MillReadOnlyStub.tsx` → `'use client';` ✓
- Negative grep on MillReadOnlyStub.tsx for `checkRole`, `requireRole`, `@clerk/nextjs`, `<Protect`, `import 'server-only'` → all 0 ✓
- `src/app/page.tsx` contains `await auth()`, `await checkRole('mill_operator')`, `redirect('/sign-in')`; does NOT contain `requireRole` ✓
- 4 `it()` blocks in page.test.tsx covering the required branches ✓
- `npx tsc --noEmit` exit 0 ✓
- `npm test -- --testPathPatterns='app/page\.test'` → 4/4 passed ✓
