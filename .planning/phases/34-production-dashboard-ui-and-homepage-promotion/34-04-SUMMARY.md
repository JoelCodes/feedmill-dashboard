---
phase: 34
plan: 04
subsystem: production-dashboard
tags: [card, column, next-up, in-progress, tdd, pure-functions, production-derivations]
dependency_graph:
  requires:
    - src/lib/search-params.ts (STATE_ORDER ordering reference — 34-01)
    - src/db/schema/orders.ts (ProductionOrder, ProductionState, MillLine types)
  provides:
    - src/lib/production-derivations.ts (groupOrdersByState, computeColumnWeights, filterOrders, isOrderNextUp)
    - src/components/ProductionCard.tsx (DB-shape clickable card with isNextUp + isInProgress + a11y)
    - src/components/MillColumn.tsx (per-line composition consuming ProductionCard + pure derivations)
  affects:
    - Plan 34-05: ProductionDashboard imports filterOrders and passes per-mill arrays to MillColumn
    - Any component that renders ProductionOrder data (weight formatting via parseFloat is now enforced)
tech_stack:
  added: []
  patterns:
    - TDD RED→GREEN with RTL for component visual contracts
    - Pure helper module pattern (no React/Next imports, usable from RSC + client contexts)
    - parseFloat(weightLbs) discipline for Drizzle numeric string columns (Pitfall 6)
    - Local STATE_COLORS constant per component (D-01: no code sharing with /demo)
    - role="button" + tabIndex=0 + onKeyDown Enter/Space keyboard accessibility
key_files:
  created:
    - src/lib/production-derivations.ts
    - src/lib/__tests__/production-derivations.test.ts
    - src/components/ProductionCard.tsx
    - src/components/ProductionCard.test.tsx
    - src/components/MillColumn.tsx
    - src/components/MillColumn.test.tsx
  modified: []
decisions:
  - "MillColumn uses COLUMN_STATE_ORDER = ['Completed','Mixing','Blocked','Pending'] (visual order per UI-SPEC §3), separate from search-params STATE_ORDER (parsing order). Both exist to separate concerns."
  - "formatWeight local to each component (ProductionCard + MillColumn) instead of extracting to production-derivations — kept pure-module boundary clean (no UI-rendering logic in pure helpers)."
  - "Test 2 (MillColumn sub-label) uses getAllByText(/\\/ .+ lbs/) instead of getByText because cards also contain lbs text — multi-match avoided by anchoring on the '/' separator in the sub-label."
metrics:
  duration: ~6 minutes
  completed: "2026-05-14T19:44:14Z"
---

# Phase 34 Plan 04: Pure Derivations + ProductionCard + MillColumn Summary

Wave 2 part B: shipped the four pure derivation helpers, the DB-shape ProductionCard component, and the MillColumn composition layer. All 33 tests green; TypeScript clean on new files. Pitfall 6 (weightLbs string-vs-number) eliminated at every render site.

## Four Exported Pure Helpers

All in `src/lib/production-derivations.ts` — no React, no Next.js, importable from RSC + client:

| Function | Signature | Purpose |
|----------|-----------|---------|
| `groupOrdersByState` | `(orders: ProductionOrder[]) => Record<ProductionState, ProductionOrder[]>` | Groups orders into all-four-states buckets; empty buckets always present |
| `computeColumnWeights` | `(orders: ProductionOrder[]) => { completed: number; total: number }` | parseFloat-safe sum; never raw string arithmetic (T-34-04-01) |
| `filterOrders` | `(orders, status: ProductionState[], q: string) => ProductionOrder[]` | Status-first then q substring (D-07); empty status=show all (Pitfall 11) |
| `isOrderNextUp` | `(order, pendingOrdersInColumn: ProductionOrder[]) => boolean` | True only for `pendingOrdersInColumn[0]` |

## Component Composition Diagram

```
MillColumn (per mill line)
  ├── computeColumnWeights(orders)   → completed/total for sub-label
  ├── groupOrdersByState(orders)     → state buckets
  ├── COLUMN_STATE_ORDER.map         → Completed → Mixing → Blocked → Pending
  │   └── StateSection (per state)
  │       └── ProductionCard (per order)
  │           ├── isOrderNextUp(order, grouped.Pending)  → isNextUp prop
  │           ├── order.state === 'Mixing'               → isInProgress prop
  │           └── onClick={() => onOrderClick(order.id)} → callback
  └── [empty] → "No orders" centered text
```

## Test Counts

| Module | Suite | Tests | Commit |
|--------|-------|-------|--------|
| production-derivations.ts | Pure unit tests | 16 | ff12f51 (GREEN) |
| ProductionCard.tsx | RTL component tests | 9 | ff01662 (GREEN) |
| MillColumn.tsx | RTL component tests | 8 | 37658fb (GREEN) |
| **Total** | | **33** | |

### TDD Gate Compliance

All three tasks followed strict RED → GREEN sequence:

1. **Task 1 (pure derivations):** RED commit `589ed82` (test) → GREEN commit `ff12f51` (feat)
2. **Task 2 (ProductionCard):** RED commit `41319d6` (test) → GREEN commit `ff01662` (feat)
3. **Task 3 (MillColumn):** RED commit `4df64eb` (test) → GREEN commit `37658fb` (feat)

## Note for Plan 05 (ProductionDashboard wrapper)

The dashboard wrapper will:

```typescript
import { filterOrders, groupOrdersByState } from '@/lib/production-derivations';
import MillColumn from '@/components/MillColumn';

// In ProductionDashboard (client component):
const filteredOrders = useMemo(
  () => filterOrders(orders, status, q),
  [orders, status, q]
);

const ordersByMill = useMemo(() => ({
  Premix: filteredOrders.filter(o => o.millLine === 'Premix'),
  Excel:  filteredOrders.filter(o => o.millLine === 'Excel'),
  CGM:    filteredOrders.filter(o => o.millLine === 'CGM'),
}), [filteredOrders]);

// Render:
<MillColumn millLine="Premix" orders={ordersByMill.Premix} onOrderClick={...} />
```

The dashboard wrapper owns nuqs hooks (`useQueryStates`); MillColumn is purely presentational. `filterOrders` is the pure helper that connects nuqs state to the column data.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Test 2 (MillColumn) sub-label getByText matcher caused multiple-elements error**
- **Found during:** Task 3 GREEN phase — first test run
- **Issue:** `getByText(/lbs/)` matched multiple elements (sub-label AND each card's weight row both contain "lbs")
- **Fix:** Updated test assertion to `getAllByText(/\/ .+ lbs/)` which anchors on the "/" separator unique to the sub-label
- **Files modified:** `src/components/MillColumn.test.tsx`
- **Commit:** Included in `37658fb` (Task 3 GREEN commit)

## Known Stubs

None — all four artifacts are fully implemented with no placeholder values. ProductionCard and MillColumn render real ProductionOrder data. The `onOrderClick` callback is a prop (not a stub) — it will be wired to nuqs `setQuery({ order: id })` in Plan 05.

## Threat Flags

None — all new surface is covered by the plan's threat model (T-34-04-01 through T-34-04-06). Weight formatting (T-34-04-01) is mitigated by parseFloat at both computeColumnWeights and ProductionCard.

## Self-Check: PASSED

### Created files:
- [x] src/lib/production-derivations.ts — FOUND
- [x] src/lib/__tests__/production-derivations.test.ts — FOUND
- [x] src/components/ProductionCard.tsx — FOUND
- [x] src/components/ProductionCard.test.tsx — FOUND
- [x] src/components/MillColumn.tsx — FOUND
- [x] src/components/MillColumn.test.tsx — FOUND

### Commits verified:
- [x] 589ed82 — test(34-04): add failing tests for production-derivations (TDD red)
- [x] ff12f51 — feat(34-04): implement production-derivations pure helpers (TDD green)
- [x] 41319d6 — test(34-04): add failing RTL tests for ProductionCard (TDD red)
- [x] ff01662 — feat(34-04): implement ProductionCard DB-shape card component (TDD green)
- [x] 4df64eb — test(34-04): add failing RTL tests for MillColumn (TDD red)
- [x] 37658fb — feat(34-04): implement MillColumn per-line composition component (TDD green)

### Key acceptance criteria:
- [x] groupOrdersByState exports 4 functions total (verified by grep)
- [x] computeColumnWeights uses parseFloat >= 2 times
- [x] filterOrders has toLowerCase() and trim() calls
- [x] production-derivations.ts has 0 'use client' / React / Next imports
- [x] ProductionCard has role="button", tabIndex={0}, onKeyDown, parseFloat(order.weightLbs), "Next Up", aria-label="In progress", animate-pulse
- [x] MillColumn imports groupOrdersByState + computeColumnWeights + isOrderNextUp (3 helpers)
- [x] MillColumn imports ProductionCard (import + JSX)
- [x] MillColumn has COLUMN_STATE_ORDER with Completed→Mixing→Blocked→Pending
- [x] MillColumn has "No orders" empty state
- [x] All 33 tests green (16 pure + 9 card + 8 column)
- [x] npx tsc --noEmit clean for new files (pre-existing errors in schema test files are unrelated)
