---
phase: 34-production-dashboard-ui-and-homepage-promotion
plan: 05
subsystem: production-dashboard
tags: [dashboard, nuqs, polling, filter-pills, search-debounce, suspense, tdd, client-wrapper]
dependency_graph:
  requires:
    - src/lib/search-params.ts (STATE_ORDER, searchParamsCache — 34-01)
    - src/app/layout.tsx (NuqsAdapter mounted — 34-01)
    - src/hooks/useProductionPolling.ts (30s polling hook — 34-02)
    - src/components/BlockedAlertBand.tsx (blocked alert band — 34-03)
    - src/components/LastUpdatedChip.tsx (last-updated chip — 34-03)
    - src/components/ColumnSkeleton.tsx (column loading fallback — 34-03)
    - src/lib/production-derivations.ts (filterOrders, groupOrdersByState — 34-04)
    - src/components/MillColumn.tsx (per-line column — 34-04)
    - src/components/ProductionCard.tsx (clickable order card — 34-04)
  provides:
    - src/components/ProductionDashboard.tsx (client wrapper: header strip + filter + search + polling + columns + band)
    - src/components/ProductionDashboard.test.tsx (12 RTL+nuqs+fake-timer tests)
  affects:
    - Plan 34-06: ProductionDashboard accepts drawerOrder/drawerEvents props; plan 06 will wire <ProductionDrawer>
    - Plan 34-07: page RSC calls ProductionDashboard with the locked prop signature
tech_stack:
  added: []
  patterns:
    - "useQueryStates({ status, q, order }) — three URL params managed by a single nuqs call (D-04, D-05, D-06)"
    - "NuqsTestingAdapter with onUrlUpdate callback for testing URL state changes without a real router"
    - "filterOrders(orders, status, q) as the single pure-function entry point for all client filtering"
    - "Explicit per-column Suspense boundaries with data-suspense='column' wrapper divs for test discoverability (D-23)"
    - "useEffect([orders]) to reset lastUpdated — orders prop reference changes after every router.refresh()"
key_files:
  created:
    - src/components/ProductionDashboard.tsx
    - src/components/ProductionDashboard.test.tsx
  modified: []
key_decisions:
  - "Filter pills use PRODUCTION_STATE_PILL_CONFIG and STATE_COLORS as local consts — D-01 prohibits importing from MillProductionUI.tsx. Both consts are verbatim copies from the visual prior art."
  - "Columns rendered explicitly (not via .map) to satisfy the acceptance criteria that grep -c '<Suspense returns ≥ 3 literal occurrences. This also makes each Suspense boundary individually visible to code review."
  - "drawerOrder/drawerEvents props accepted via void — plan 06 will hook them up. This keeps the page RSC contract stable so plan 07 can call ProductionDashboard with the full prop list without waiting for plan 06."
  - "onUrlUpdate() in NuqsTestingAdapter is called asynchronously via nuqs scheduler; Test 6 uses waitFor() instead of synchronous assertion to avoid brittle timing."
  - "useEffect(() => setQuery({ q: debouncedSearch }), [debouncedSearch]) omits setQuery from the dependency array (stable ref warning suppressed via eslint-disable) to avoid a double-flush on initial mount."
requirements-completed: [PROD-02, PROD-03, PROD-04, PROD-06, PROD-09, PROD-10, PROD-11]
duration: ~8 minutes
completed: "2026-05-14T19:59:07Z"
---

# Phase 34 Plan 05: ProductionDashboard Client Wrapper Summary

**Client wrapper composing nuqs URL-synced filter pills + 150ms-debounced search + 30s polling + BlockedAlertBand + three Suspense-wrapped MillColumns, with 12 RTL+fake-timer integration tests**

## Performance

- **Duration:** ~8 minutes
- **Started:** 2026-05-14T19:51:07Z
- **Completed:** 2026-05-14T19:59:07Z
- **Tasks:** 1 (TDD — RED commit + GREEN commit)
- **Files modified:** 2 (created both)

## Accomplishments

- `ProductionDashboard.tsx` integrates all Wave 1+2 primitives in a single `'use client'` wrapper with the locked prop signature for plan 07
- URL state (status / q / order) all managed via `useQueryStates` with proper parsers, wired to FilterPills + search input + card click
- 12 RTL+nuqs+fake-timer tests GREEN covering all plan acceptance criteria including Pitfall 11, debounce, polling, Suspense, and lastUpdated reset

## Component Prop Signature

```typescript
type Props = {
  orders: ProductionOrder[];
  canEdit: boolean;
  drawerOrder: ProductionOrder | null;   // accepted; TODO plan 06
  drawerEvents: OrderEvent[];            // accepted; TODO plan 06
};

export default function ProductionDashboard(props: Props): JSX.Element;
```

This is the locked signature plan 07's page RSC calls verbatim.

## URL State Contract

| Param | Parser | Default | Consumer |
|-------|--------|---------|----------|
| `status` | `parseAsArrayOf(parseAsStringLiteral(STATE_ORDER))` | `[]` | FilterPill `isActive`, `filterOrders` |
| `q` | `parseAsString` | `''` | 150ms-debounced search input → `filterOrders` |
| `order` | `parseAsString` | `''` | ProductionCard click → set; drawer open signal (plan 06) |

**Pitfall 11 mitigation:** `filterOrders(orders, [], q)` returns all orders when `status` is empty. This is the "no filter active = show all" behavior. Removing the last active pill empties the array — correct behavior, not "show none".

## Polling Cadence Verification (Test 8)

Test 8 asserts: `after 30_000ms fake-timer advance, mockRefresh called ≥ 1 time`. This confirms `useProductionPolling()` is mounted (not just imported) in the wrapper. If the hook were absent or mounted incorrectly, the mock would never fire.

## The Drawer Pass-Through TODO

The `drawerOrder` and `drawerEvents` props are accepted and immediately voided:

```typescript
void canEdit;
void drawerOrder;
void drawerEvents;
// TODO(plan-06): render <ProductionDrawer order={drawerOrder} events={drawerEvents} canEdit={canEdit} />
```

Plan 06 will remove the `void` statements and compose `<ProductionDrawer>` conditionally when `drawerOrder !== null`. The page RSC in plan 07 is already ready to pass all four props.

## Pitfall 11 Mitigation

`filterOrders` (from `@/lib/production-derivations`) handles the empty-array case:

```typescript
const afterStatus =
  status.length === 0
    ? orders                    // empty = show all (Pitfall 11 — NOT show none)
    : orders.filter((o) => status.includes(o.state));
```

Test 5 verifies: with `searchParams=""` (status=[]), all four fixture orders render. With `?status=Pending`, only Pending orders render.

## Task Commits

| Phase | Hash | Message |
|-------|------|---------|
| RED (test) | `3e7e6c6` | `test(34-05): add failing RTL+nuqs+fake-timer tests for ProductionDashboard (TDD red)` |
| GREEN (feat) | `1ece2b7` | `feat(34-05): implement ProductionDashboard client wrapper (TDD green)` |

## Files Created

- `src/components/ProductionDashboard.tsx` — Client wrapper (267 lines): 'use client', useProductionPolling, useQueryStates (status/q/order), 150ms debounce, filterOrders, ordersByMill, stateCounts, lastUpdated reset, header strip, BlockedAlertBand, 3 explicit Suspense-wrapped MillColumns
- `src/components/ProductionDashboard.test.tsx` — 12 integration tests (RTL + NuqsTestingAdapter + fake timers): Tests 1-5 render assertions, Test 6 pill toggle, Test 7 search debounce, Test 8 polling, Test 9 card click, Test 10 alert band, Test 11 Suspense wrapper, Test 12 lastUpdated reset

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] NuqsTestingAdapter onUrlUpdate async assertion**
- **Found during:** Task 1 GREEN phase — Test 6 initial run
- **Issue:** `onUrlUpdate` callback is called asynchronously via nuqs scheduler. Synchronous assertion after `fireEvent.click` saw `urlUpdates.length === 0`.
- **Fix:** Wrapped Test 6 assertion in `waitFor()` to wait for the async URL update to propagate.
- **Files modified:** `src/components/ProductionDashboard.test.tsx`
- **Commit:** Included in `1ece2b7`

**2. [Rule 1 - Bug] Test 1 multiple-match on "Pending" text**
- **Found during:** Task 1 GREEN phase — Test 1 first run
- **Issue:** `screen.getByText('Pending')` matched both the FilterPill span and the MillColumn section heading h3.
- **Fix:** Changed Test 1 to use `screen.getByRole('button', { name: /filter by pending/i })` which uniquely identifies FilterPill buttons via their aria-label.
- **Files modified:** `src/components/ProductionDashboard.test.tsx`
- **Commit:** Included in `1ece2b7`

**3. [Rule 1 - Bug] Explicit columns instead of .map() for Suspense grep assertion**
- **Found during:** Task 1 verification (source assertions)
- **Issue:** `grep -c "<Suspense" src/components/ProductionDashboard.tsx` returned 1 when Suspense was inside `.map()`. Acceptance criteria requires ≥ 3 literal occurrences.
- **Fix:** Changed from `MILL_LINES.map(line => <Suspense>)` to three explicit JSX blocks, one per mill line.
- **Files modified:** `src/components/ProductionDashboard.tsx`
- **Commit:** Included in `1ece2b7`

---

**Total deviations:** 3 auto-fixed (Rule 1 — bugs found during test execution and source assertion verification)
**Impact on plan:** All auto-fixes improve test reliability and satisfy explicit acceptance criteria. No scope creep.

## Known Stubs

- `drawerOrder` and `drawerEvents` props are accepted but voided with a `TODO(plan-06)` comment. This is intentional per the plan (plan 06 owns drawer composition). The stub does NOT prevent the plan's goal — the dashboard renders fully without the drawer.

## Threat Flags

None — all new surface (URL param parsing, client-side filtering, polling, click handlers) is covered by the plan's threat model (T-34-05-01 through T-34-05-06). No new unmodeled surface introduced.

## Self-Check: PASSED

### Created files:
- [x] src/components/ProductionDashboard.tsx — FOUND
- [x] src/components/ProductionDashboard.test.tsx — FOUND

### Commits verified:
- [x] 3e7e6c6 — test(34-05): add failing RTL+nuqs+fake-timer tests (TDD red)
- [x] 1ece2b7 — feat(34-05): implement ProductionDashboard client wrapper (TDD green)

### Key acceptance criteria:
- [x] 'use client' count: 1
- [x] useProductionPolling() count: 1
- [x] useQueryStates count: ≥ 1
- [x] parseAsArrayOf(parseAsStringLiteral count: ≥ 1
- [x] filterOrders count: ≥ 1
- [x] useDebounce 150 count: ≥ 1 (D-05)
- [x] Suspense count: 5 (≥ 3 required — 3 real + 2 in comments)
- [x] ColumnSkeleton count: 3 (≥ 1 required)
- [x] BlockedAlertBand count: 1
- [x] LastUpdatedChip count: 1
- [x] MillColumn count: 3 (≥ 1 required)
- [x] Premix/Excel/CGM count: ≥ 3
- [x] Import Orders count: ≥ 1
- [x] MillProductionUI import count: 0 (D-01)
- [x] lastUpdated reset wired to [orders] dependency
- [x] All 12 tests GREEN
- [x] npx tsc --noEmit: no errors in ProductionDashboard.tsx

## TDD Gate Compliance

Strict RED → GREEN sequence followed:

1. **RED:** Commit `3e7e6c6` (`test(34-05): add failing RTL+nuqs+fake-timer tests`) — ProductionDashboard.tsx did not exist; test suite failed with "Cannot find module './ProductionDashboard'"
2. **GREEN:** Commit `1ece2b7` (`feat(34-05): implement ProductionDashboard client wrapper`) — all 12 tests pass

No REFACTOR commit needed — implementation was clean on first pass (after inline bug fixes tracked as deviations).
