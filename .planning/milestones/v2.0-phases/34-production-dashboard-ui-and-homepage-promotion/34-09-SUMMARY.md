---
phase: 34-production-dashboard-ui-and-homepage-promotion
plan: 9
subsystem: import-flow
tags: [bug-fix, tdd, client-component, date-hydration, router-refresh, rsc-boundary]
dependency_graph:
  requires:
    - 34-07  # ImportFlow + ImportHistoryTable components
    - 33-*   # server-side revalidateTag wiring (import.ts:793,808)
  provides:
    - T9a-fix: router.refresh() after successful commitImportAction
    - T9b-fix: importedAt Date hydration at RSC→client boundary
  affects:
    - src/components/ImportFlow.tsx
    - src/components/ImportFlow.test.tsx
    - src/components/ImportHistoryTable.test.tsx
tech_stack:
  added: []
  patterns:
    - useMemo for prop-boundary type coercion (RSC→client string→Date)
    - useRouter().refresh() after server action success (client-side RSC re-fetch)
key_files:
  modified:
    - src/components/ImportFlow.tsx
    - src/components/ImportFlow.test.tsx
    - src/components/ImportHistoryTable.test.tsx
decisions:
  - "T9b hydration: Option B (useMemo in ImportFlow) chosen over Option A (new Date inside formatBatchDate) and Option C (move table server-side)"
  - "router.refresh() called BEFORE setPhase('committed') to allow React 19 batching of both updates"
  - "instanceof Date guard used in hydration to handle both real Date instances (test fixtures) and RSC-serialized strings"
metrics:
  duration: "3 minutes"
  completed: "2026-05-14T23:11:24Z"
  tasks_completed: 2
  files_modified: 3
requirements-completed:
  - PROD-01
  - PROD-02
  - IMPORT-04
  - IMPORT-05
  - IMPORT-06
---

# Phase 34 Plan 9: T9a + T9b ImportFlow Gap Closure Summary

**One-liner:** Date hydration via useMemo at RSC boundary + router.refresh() on commit close two coupled UAT gaps (T9a stale table, T9b RangeError) so operators see the new batch immediately after XLSX commit without errors.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add T9b regression tests for ImportHistoryTable | 4774079 | src/components/ImportHistoryTable.test.tsx |
| 2 | Hydrate batches in ImportFlow + wire router.refresh() | cd0333c | src/components/ImportFlow.tsx, src/components/ImportFlow.test.tsx |

## What Was Built

### T9b Fix: Date Hydration at RSC→Client Boundary

`ImportFlow` is a `'use client'` component. The `batches: ImportBatch[]` prop crosses the RSC→client serialization boundary, turning `Date` instances into ISO strings. `ImportHistoryTable.tsx:27` calls `Intl.DateTimeFormat.format(d)` which throws `RangeError: Invalid time value` on string input.

**Fix:** Added `useMemo`-based `hydratedBatches` computation inside `ImportFlow`:

```typescript
const hydratedBatches = useMemo(
  () => batches.map((b) => ({
    ...b,
    importedAt: b.importedAt instanceof Date ? b.importedAt : new Date(b.importedAt as unknown as string),
  })),
  [batches]
);
// ...
<ImportHistoryTable batches={hydratedBatches} />
```

The `instanceof Date` guard handles both runtime shapes: test fixtures that construct real `Date` instances stay correct (no double-conversion), while RSC-serialized strings get coerced.

### T9a Fix: router.refresh() After Successful Commit

`handleCommit` was missing a `router.refresh()` call after `commitImportAction` returned `{ ok: true }`. The server-side `revalidateTag('import-batches', 'max')` was already wired in `src/actions/import.ts:793,808` (Phase 33 D-21 patch). The gap was purely client-side.

**Fix:** Added `router.refresh()` call immediately before `setPhase('committed')`:

```typescript
// T9a fix: trigger the parent RSC to re-fetch so ImportHistoryTable
// receives the new batch from the freshly invalidated cache.
router.refresh();

setPhase('committed');
```

Mirrors the pattern in `TransitionButtons.tsx:67-71` (router.refresh after action success).

### Fix Ordering: T9b First, T9a Second

T9b was sequenced first (within Task 2 implementation) because T9a's `router.refresh()` causes the page RSC to re-fetch and pass a fresh `batches` array to `ImportFlow`. Without T9b's hydration in place, that fresh array arrives as strings and immediately surfaces the RangeError. The safe order is: hydration fix → refresh wiring.

## Hydration Approach: Option B (Rejected Alternatives)

The plan specified Option B from the debug session (hydrate in ImportFlow useMemo):

- **Option A rejected** — `new Date()` inside `formatBatchDate` would mask the type lie. The function signature declares `Date` input; hiding coercion inside it prevents TypeScript from catching callers that pass strings.
- **Option B chosen** — Hydrate at the prop boundary in ImportFlow. Single coercion point, honest types downstream, testable independently.
- **Option C rejected** — Moving ImportHistoryTable server-side was too large a scope change for gap closure.

## Tests Added

### ImportHistoryTable.test.tsx (Task 1 - TDD RED/GREEN)

Two new tests in `describe('ImportHistoryTable date hydration contract (T9b regression)')`:

1. **Baseline test** — Passes a real `Date` instance, asserts component renders without throwing. Confirms the happy path still works.
2. **Contract-pin test** — Passes a string-typed `importedAt` via `as unknown as Date` cast, asserts `RangeError` is thrown. This documents that callers MUST hydrate before passing to `ImportHistoryTable`. If `ImportFlow` ever regresses on hydration, this test fails loudly with the exact RangeError from UAT T9b.

### ImportFlow.test.tsx (Task 2 - TDD RED/GREEN)

Three new tests:

1. **T9a positive** — Mocks `useRouter`, drives full entry→preview→commit flow with successful `commitImportAction`, asserts `mockRefresh` called exactly once.
2. **T9a negative** — Same flow with `commitImportAction` returning `{ ok: false }`, asserts `mockRefresh` NOT called.
3. **T9b** — Mounts `ImportFlow` with string-typed `importedAt` in batches, asserts no throw and filename renders (hydration prevents RangeError).

### Test Counts

- `ImportHistoryTable.test.tsx`: 4 original + 2 new = **6 total** (all passing)
- `ImportFlow.test.tsx`: 8 original + 3 new = **11 total** (all passing)

## Phase 33 GAP-02 Contract Verification

`src/actions/import.ts` lines 793 and 808 (`revalidateTag('import-batches', 'max')`) are **untouched** by this plan. The server-side cache invalidation contract established in Phase 33 D-21 remains in place. This plan only added the client-side `router.refresh()` counterpart that was missing from `handleCommit`.

## Deviations from Plan

None — plan executed exactly as written. The `as unknown as string` cast in the `new Date()` call was required by TypeScript because `ImportBatch.importedAt` is typed as `Date`, not `string|Date`. This is the honest acknowledgment of the type lie that occurs at the RSC boundary and was anticipated in the plan's interface notes.

## Self-Check

- [x] `src/components/ImportFlow.tsx` modified with useRouter + useMemo hydratedBatches
- [x] `src/components/ImportFlow.test.tsx` modified with T9a/T9b tests + next/navigation mock
- [x] `src/components/ImportHistoryTable.test.tsx` modified with T9b contract tests
- [x] Commit 4774079 exists (Task 1 - test)
- [x] Commit cd0333c exists (Task 2 - feat)
- [x] All 17 tests pass across both test files
- [x] TypeScript errors in changed files: 0 (pre-existing errors in other files are unchanged)

## Self-Check: PASSED
