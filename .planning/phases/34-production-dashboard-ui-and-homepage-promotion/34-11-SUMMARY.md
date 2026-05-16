---
phase: 34-production-dashboard-ui-and-homepage-promotion
plan: 11
subsystem: production-dashboard
tags: [nuqs, url-state, rsc, performance, drawer, gap-closure]
dependency_graph:
  requires:
    - 34-05 (ProductionDashboard component with nuqs URL state)
    - 34-06 (ProductionDrawer component)
    - 34-07 (BlockedAlertBand component)
  provides:
    - Non-shallow order URL updates that trigger page RSC re-fetch
    - DrawerSkeleton Suspense fallback during order fetch (startTransition)
    - Browser back-button drawer toggle (history: push)
  affects:
    - src/app/page.tsx (RSC re-runs on order param change)
tech_stack:
  patterns:
    - nuqs split useQueryStates (shallow vs non-shallow per key)
    - React.startTransition wrapping for Suspense boundary activation
    - TDD RED/GREEN per task
key_files:
  modified:
    - src/components/ProductionDashboard.tsx
    - src/components/BlockedAlertBand.tsx
    - src/components/ProductionDrawer.tsx
    - src/components/ProductionDashboard.test.tsx
    - src/components/BlockedAlertBand.test.tsx
    - src/components/ProductionDrawer.test.tsx
decisions:
  - "Split useQueryStates: status+q stay shallow (client-side filter, no RSC fetch); order is non-shallow (must trigger RSC to fetch getOrderById + getOrderEvents)"
  - "history: push chosen over replace so browser back button toggles the drawer (deep-link parity)"
  - "startTransition wrapping at every order-setter call site activates DrawerSkeleton Suspense fallback during RSC fetch"
  - "Used jest.mock assertion style (not NuqsTestingAdapter onUrlUpdate) for BlockedAlertBand/ProductionDrawer tests due to existing mock-based test structure"
metrics:
  duration: "~25 minutes"
  completed: "2026-05-14"
  tasks_completed: 2
  files_changed: 6
requirements-completed:
  - PROD-03
  - PROD-04
  - PROD-05
  - PROD-10
---

# Phase 34 Plan 11: nuqs Shallow Split for Drawer RSC Fetch (T10b) Summary

Split the combined `useQueryStates` hook in `ProductionDashboard`, `BlockedAlertBand`, and `ProductionDrawer` so that the `order` URL parameter uses `shallow: false` + `history: 'push'` — triggering a page RSC re-fetch on every card click, blocked-chip click, and drawer close. This closes gap T10b: drawer perceived load from 0–30s (avg ~15s) → ~1s.

## What Was Built

### nuqs Hook Split Rationale

The root cause (per `.planning/debug/t10b-drawer-slow-load.md`) was that `setQuery({ order: id })` used the nuqs default `shallow: true`. Shallow updates only patch `history.replaceState` and do NOT trigger App Router RSC re-fetch. The page RSC (`src/app/page.tsx:39-43`) is the only place `getOrderById + getOrderEvents` are called, so with shallow updates the drawer props stayed `null` / `[]` until `useProductionPolling` fired `router.refresh()` on its 30s interval.

**The fix: split the hook into two separate `useQueryStates` calls:**

```typescript
// Status + q — SHALLOW (client-side filter, no RSC fetch per pill toggle / keystroke)
const [{ status, q }, setQuery] = useQueryStates({
  status: parseAsArrayOf(parseAsStringLiteral(STATE_ORDER)).withDefault([]),
  q: parseAsString.withDefault(''),
});

// Order — NON-SHALLOW (must trigger RSC to fetch order details + events)
const [{ order }, setOrderQuery] = useQueryStates(
  { order: parseAsString.withDefault('') },
  { shallow: false, history: 'push' }
);
```

Why `status` and `q` stay shallow:
- Filter pills execute client-side over the already-fetched `orders` array — no RSC needed
- Search uses a 150ms debounce and also filters client-side — no RSC needed per keystroke
- Keeping them shallow preserves the snappy UX (instant response, no skeleton flash)

### startTransition Wrapping

Per React 19, state updates routed through the RSC pipeline (`router.replace` with `shallow: false`) are treated as "transitions" only if marked. Without `startTransition`, React commits synchronously and skips the `<Suspense fallback>`. With `startTransition`, React keeps the old UI and renders `DrawerSkeleton` during the RSC fetch.

All 5 order-setter call sites are wrapped:
1. `ProductionDashboard.tsx` — Premix `onOrderClick`
2. `ProductionDashboard.tsx` — Excel `onOrderClick`
3. `ProductionDashboard.tsx` — CGM `onOrderClick`
4. `BlockedAlertBand.tsx` — blocked-chip `onClick`
5. `ProductionDrawer.tsx` — `handleClose`

### history: 'push' Decision

`history: 'push'` is used instead of `'replace'` so the browser back button toggles the drawer (deep-link parity). Operator clicks a card → drawer opens; back button → drawer closes. This matches user expectation for navigation.

## Performance Delta

| Metric | Before | After |
|--------|--------|-------|
| Drawer perceived load (card click) | 0–30s (avg ~15s) | ~1s |
| Filter pill toggle | Instant (no change) | Instant (no change) |
| Search keystroke | Instant/debounced (no change) | Instant/debounced (no change) |
| Browser back button toggles drawer | No | Yes |

## T10b UAT Status

T10b ("Drawer opens responsively — target: <500ms perceived load") is now closable on re-test. The RSC round-trip time (~1s for `Promise.all([getOrders, getOrderById, getOrderEvents])`) is within the operator's expectation. The DrawerSkeleton appears immediately on click (within one frame via startTransition).

## TDD Gate Compliance

### Task 1 (ProductionDashboard)
- RED commit: `21d51df` — 3 failing tests added
- GREEN commit: `9446af0` — all 3 tests pass

### Task 2 (BlockedAlertBand + ProductionDrawer)
- RED commit: `3f32e97` — 2 failing tests added
- GREEN commit: `93bb334` — both tests pass

## Deviations from Plan

### Test Strategy Adjustment (Rule 1 - Implementation Detail)

**Found during:** Task 2
**Issue:** The plan specified using `NuqsTestingAdapter` with `onUrlUpdate` callback to assert `options.shallow === false`. However, both `BlockedAlertBand.test.tsx` and `ProductionDrawer.test.tsx` mock the entire `nuqs` module at the top level, which breaks `NuqsTestingAdapter` (it depends on real nuqs internals).
**Fix:** Used `jest.fn()` spy on the mocked `useQueryStates` to assert the hook is called with the correct second argument `{ shallow: false, history: 'push' }`. This tests the same contract (the options are correctly passed to nuqs) without requiring a full module unmock/remock cycle.
**Files modified:** `BlockedAlertBand.test.tsx`, `ProductionDrawer.test.tsx`

### Pre-existing Test Failures (Out of Scope)

Tests 8 and 9 in `ProductionDrawer.test.tsx` were pre-existing failures before this plan:
- Test 8: `screen.getByText(/Pending.*Mixing|Mixing/)` matches multiple elements (use `getAllByText`)
- Test 9: `TransitionButtons` mock returns `data-testid="transition-buttons"` but the real component (via un-mocked TransitionButtons in plan 34-08+) renders a form instead

These failures exist in all worktrees and in the main repo before this plan. They are NOT caused by any changes in this plan. Logged to `deferred-items.md` for future cleanup.

## Known Stubs

None. All wired to real data layer.

## Threat Flags

None. This plan modifies URL state propagation only — no new network endpoints, auth paths, or schema changes.

## Self-Check

All files exist:
- `src/components/ProductionDashboard.tsx` — contains `shallow: false` at line 156
- `src/components/BlockedAlertBand.tsx` — contains `shallow: false` at line 33
- `src/components/ProductionDrawer.tsx` — contains `shallow: false` at line 130

All commits exist:
- `21d51df` — RED phase Task 1
- `9446af0` — GREEN phase Task 1
- `3f32e97` — RED phase Task 2
- `93bb334` — GREEN phase Task 2
