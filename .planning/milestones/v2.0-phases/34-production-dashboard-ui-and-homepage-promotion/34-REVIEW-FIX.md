---
phase: 34-production-dashboard-ui-and-homepage-promotion
fixed_at: 2026-05-14T00:00:00Z
review_path: .planning/phases/34-production-dashboard-ui-and-homepage-promotion/34-REVIEW.md
iteration: 2
findings_in_scope: 10
fixed: 10
skipped: 0
status: all_fixed
---

# Phase 34: Code Review Fix Report (Iteration 2 — Deep Re-Review)

**Fixed at:** 2026-05-14
**Source review:** `.planning/phases/34-production-dashboard-ui-and-homepage-promotion/34-REVIEW.md` (deep re-review, commit `796f7ef`)
**Iteration:** 2 (replaces the iteration-1 partial-scope report from an earlier review pass)

**Summary:**
- Findings in scope: 10 (3 Critical + 7 Warning; Info excluded — `--all` not passed)
- Fixed: 10
- Skipped: 0

All in-scope Critical and Warning findings landed cleanly with regression coverage where applicable. The `Info` findings (IN-01..IN-04) were intentionally excluded from this fix pass per the default `critical_and_warning` scope.

This iteration replaces the prior `34-REVIEW-FIX.md` (iteration 1, scope: WR-01..WR-04 only). The deep re-review at commit `796f7ef` re-validated prior findings against current source, promoted CR-01 (which the iteration-1 fixer had not addressed), added new cross-file findings (CR-02, CR-03, WR-05, WR-06, WR-07, IN-04), and is the source of record for this iteration.

## Fixed Issues

### CR-01: `ImportFlow` — unhandled rejection in `previewImportAction` / `commitImportAction` leaves UI in stuck spinner

**Files modified:** `src/components/ImportFlow.tsx`, `src/components/ImportFlow.test.tsx`
**Commit:** `163265a`
**Applied fix:** Wrapped the two server-action awaits in `try/catch/finally` so that a rejected promise (network error, 500, RSC payload failure) reliably resets `isPending` and surfaces a generic operator-facing error instead of pinning the UI on "Processing…" / "Committing…". Added two regression tests (`mockRejectedValue`) covering both rejection paths and asserting the input/Browse and Commit buttons return to enabled.

### CR-02: `TransitionButtons` sub-buttons pin `orderId`/`version` at first render — second click after refresh sends stale version

**Files modified:** `src/components/TransitionButtons.tsx`, `src/components/TransitionButtons.test.tsx`
**Commit:** `0c9b731`
**Applied fix:** Replaced the direct prop closure inside each `useActionState` callback (`StartMixingButton`, `CompleteOrderButton`, `ResumeButton`) with a `useRef` synced via `useEffect` on every render. The action dereferences `propsRef.current` at click time, so a re-render with a bumped version is reflected on the next click. Added three regression tests (one per sub-button) that re-render with `version=2` after a `version=1` click and assert the second call carries the new version.

### CR-03: `ImportHistoryTable` test pins broken behavior as contract — string `importedAt` crashes the page if any caller bypasses `ImportFlow`

**Files modified:** `src/components/ImportHistoryTable.tsx`, `src/components/ImportHistoryTable.test.tsx`, `src/components/ImportFlow.tsx`, `src/components/ImportFlow.test.tsx`
**Commit:** `c706e9e`
**Applied fix:** Pushed normalisation into `formatBatchDate` itself: `Date | string` accepted, `new Date(d)` for the string branch, defensive `''` fallback for unparseable input. Removed the now-redundant `useMemo` hydration shim in `ImportFlow.tsx` (and the unused `useMemo` import). Replaced the `expect(...).toThrow(RangeError)` test in `ImportHistoryTable.test.tsx` with the corrected contract — string input renders the formatted date — plus a defensive test for unparseable input.

### WR-01: `ProductionDashboard` — suppressed `react-hooks/exhaustive-deps` hides missing `setQuery` dependency

**Files modified:** `src/components/ProductionDashboard.tsx`
**Commit:** `388f02f`
**Applied fix:** Replaced the bare `// eslint-disable-next-line react-hooks/exhaustive-deps` with one carrying a justification comment ("`setQuery` is stable per nuqs contract; omitting prevents redundant URL writes"). Future edits inheriting this suppression now see the rationale.

### WR-02: `Header.tsx` — `toggleDropdown` missing `useCallback` and uses non-functional setter

**Files modified:** `src/components/Header.tsx`
**Commit:** `b6328ae`
**Applied fix:** Wrapped `toggleDropdown` in `useCallback(() => setIsDropdownOpen(prev => !prev), [])`. This both stabilises the function reference (for shallow-equality memoization in any wrapping memoized parent) and avoids the stale-closure read of `isDropdownOpen` under batched renders. Mirrors the pattern of the two existing handlers (`handleMarkAsRead`, `handleClearAll`).

### WR-03: `React.JSX.Element` referenced without `import React` in 3 source files

**Files modified:** `src/components/ImportHistoryTable.tsx`, `src/app/page.tsx`, `src/app/import/page.tsx`
**Commit:** `b5be451`
**Applied fix:** Added explicit `import React from 'react';` to all three files. Brings them in line with peer files (`ImportFlow.tsx`, `ProductionDashboard.tsx`, `BlockReasonModal.tsx`, `MillColumn.tsx`, `ProductionDrawer.tsx`) which already import React explicitly when referencing `React.JSX.Element`.

### WR-04: `BlockReasonModal` action callback closes over `reason`, `version`, `onClose`, `orderId`

**Files modified:** `src/components/BlockReasonModal.tsx`, `src/components/BlockReasonModal.test.tsx`
**Commit:** `9277eba`
**Applied fix:** Two-part fix:
1. **Closure fix** — applied the same `useRef` mitigation as CR-02 for `orderId` / `version` / `onClose`. Read `reason` from `FormData` (hidden input mirrors the controlled textarea) instead of closing over the `useState` value.
2. **Side-effect ordering** — reordered the success path to `setReason() → onClose() → router.refresh()`. `router.refresh()` runs last so the async RSC fetch is scheduled AFTER unmount handoff, avoiding state updates on a soon-to-unmount tree.

Added a regression test that re-renders with `version=2` after a successful `version=1` submit and asserts the next call carries both the new version AND the new reason text.

### WR-05: Three parallel `useQueryStates({ order })` hooks each duplicate the option literals

**Files modified:** `src/hooks/useOrderQuery.ts` (new), `src/components/ProductionDashboard.tsx`, `src/components/ProductionDrawer.tsx`, `src/components/BlockedAlertBand.tsx`
**Commit:** `1d35ebd`
**Applied fix:** Created `src/hooks/useOrderQuery.ts` exporting a single `useOrderQuery()` hook that internalises `parseAsString.withDefault('')` and `{ shallow: false, history: 'push' }`. Replaced each of the three call sites with the one-liner `const [{ order }, setQuery] = useOrderQuery();`. The URL contract for `?order=` now lives in exactly one place.

### WR-06: `STATE_ORDER` constant duplicated across 3 files with conflicting orderings

**Files modified:** `src/lib/state-order.ts` (new), `src/lib/search-params.ts`, `src/lib/production-derivations.ts`, `src/components/MillColumn.tsx`
**Commit:** `4d86a53`
**Applied fix:** Created `src/lib/state-order.ts` (no `'server-only'` imports) exporting both canonical tuples — `STATE_ORDER` (parsing/filter/grouping order) and `COLUMN_STATE_ORDER` (visual column section order). Updated all three consumers to import from the shared module. `search-params.ts` re-exports `STATE_ORDER` for backward compatibility with existing call sites. The two distinct orderings ("parse order" vs "visual order") now have a single source of truth and cannot drift independently.

### WR-07: `dateToIsoString` in `import.ts` is timezone-dependent

**Files modified:** `src/actions/import.ts`
**Commit:** `7d092c0`
**Applied fix:** Replaced `d.toISOString().split('T')[0]` with explicit UTC component getters (`getUTCFullYear`, `getUTCMonth`, `getUTCDate`). The derivation is now locked to UTC regardless of `process.env.TZ`, eliminating the silent prod-vs-dev divergence on non-UTC servers (Vercel/Neon prod runs UTC; local dev/CI typically does not).

## Skipped Issues

None — all 10 in-scope findings were applied cleanly.

## Test Results

Per-fix verification was performed inline:

| Finding | Test command | Result |
| --- | --- | --- |
| CR-01 | `jest src/components/ImportFlow.test.tsx` | 13/13 pass (11 existing + 2 new) |
| CR-02 | `jest src/components/TransitionButtons.test.tsx` | 23/23 pass (20 existing + 3 new) |
| CR-03 | `jest src/components/ImportHistoryTable.test.tsx src/components/ImportFlow.test.tsx` | 20/20 pass |
| WR-01 | `jest src/components/ProductionDashboard.test.tsx` | 15/15 pass |
| WR-02 | `jest src/components/Header.test.tsx` | 12/12 pass |
| WR-03 | `jest src/components/ImportHistoryTable.test.tsx src/app/page.test.tsx src/app/import/__tests__/page.test.tsx` | 18/18 pass |
| WR-04 | `jest src/components/BlockReasonModal.test.tsx` | 13/13 pass (12 existing + 1 new) |
| WR-05 | `jest src/components/ProductionDashboard.test.tsx src/components/ProductionDrawer.test.tsx src/components/BlockedAlertBand.test.tsx` | 30/30 pass |
| WR-06 | `jest src/lib/__tests__/production-derivations.test.ts src/lib/__tests__/search-params.test.ts src/components/MillColumn.test.tsx src/components/ProductionDashboard.test.tsx` | 45/45 pass |
| WR-07 | `jest src/actions/__tests__/import-preview.test.ts src/actions/__tests__/import-commit.test.ts` | 53/53 pass |

**Full-suite final pass:** 71/72 suites pass, 750/764 tests pass.

The single failing suite (`src/app/settings/__tests__/page.test.tsx`, 14 tests) is a **pre-existing failure** unrelated to this review-fix pass — verified by running the same suite against the unmodified `main` branch (same 14 failures, all `throwMissingClerkProviderError` from a missing ClerkProvider mock). The settings page is not in the 50-file scope of `34-REVIEW.md`. No regression introduced.

`npx tsc --noEmit` reports no new errors in any of the touched files.

## Verification Notes

The CR-02 / WR-04 closure fix is conceptually identical: both use the `useRef` pattern to break out of `useActionState`'s first-callback memoisation. New regression tests on both files re-render with a bumped version and assert the action sees the fresh prop — these are direct tests of the bug class, not just smoke tests, and would fail loudly under any future regression of either component.

The WR-05 + WR-06 refactors introduce two new modules (`src/hooks/useOrderQuery.ts`, `src/lib/state-order.ts`). Both are deliberately minimal — they hold only the constants/factories that were previously duplicated, with no behavior change. All existing tests continue to pass without modification.

The CR-03 fix removed the `expect(...).toThrow(RangeError)` contract-pin test and replaced it with positive assertions of the corrected behavior. This is the more important architectural change of the three Criticals: a green test now means "the code is correct" rather than "the bug is preserved."

## Commit Index

| Finding | Commit | Files |
| --- | --- | --- |
| CR-01 | `163265a` | `ImportFlow.tsx`, `ImportFlow.test.tsx` |
| CR-02 | `0c9b731` | `TransitionButtons.tsx`, `TransitionButtons.test.tsx` |
| CR-03 | `c706e9e` | `ImportHistoryTable.tsx`, `ImportHistoryTable.test.tsx`, `ImportFlow.tsx`, `ImportFlow.test.tsx` |
| WR-01 | `388f02f` | `ProductionDashboard.tsx` |
| WR-02 | `b6328ae` | `Header.tsx` |
| WR-03 | `b5be451` | `ImportHistoryTable.tsx`, `app/page.tsx`, `app/import/page.tsx` |
| WR-04 | `9277eba` | `BlockReasonModal.tsx`, `BlockReasonModal.test.tsx` |
| WR-05 | `1d35ebd` | `hooks/useOrderQuery.ts` (new), `ProductionDashboard.tsx`, `ProductionDrawer.tsx`, `BlockedAlertBand.tsx` |
| WR-06 | `4d86a53` | `lib/state-order.ts` (new), `lib/search-params.ts`, `lib/production-derivations.ts`, `MillColumn.tsx` |
| WR-07 | `7d092c0` | `actions/import.ts` |

---

_Fixed: 2026-05-14_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 2_
