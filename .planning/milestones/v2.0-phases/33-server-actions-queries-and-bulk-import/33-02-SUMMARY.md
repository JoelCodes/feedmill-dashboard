---
phase: 33-server-actions-queries-and-bulk-import
plan: "02"
subsystem: db/queries
tags:
  - queries
  - drizzle
  - unstable_cache
  - read-layer
  - tdd

dependency_graph:
  requires:
    - src/db/index.ts (db singleton, server-only)
    - src/db/schema/orders.ts (productionOrders table, ProductionOrder/MillLine/ProductionState types)
    - src/db/schema/events.ts (orderEvents table, OrderEvent type)
  provides:
    - getProductionOrders — consumed by Phase 34 dashboard RSC (three-column layout)
    - getOrderById — consumed by plan 33-04 transition actions as state-guard read
    - getOrderEvents — consumed by Phase 34 timeline panel
    - ProductionOrderFilters — exported type alias for plan 33-04 and Phase 34 reuse
  affects:
    - plan 33-04 (transition actions call getOrderById; revalidateTag('production-orders') invalidates getProductionOrders + getOrderEvents)
    - Phase 34 (dashboard RSC calls getProductionOrders and getOrderEvents)

tech_stack:
  added: []
  patterns:
    - unstable_cache with tags: ['production-orders'] (half of cache invalidation contract; revalidateTag in plan 33-04 is the other half)
    - import 'server-only' as first line (server-only scope discipline, matches src/db/index.ts pattern)
    - Plain db.select() queries without Drizzle relations() (avoids modifying src/db/index.ts)

key_files:
  created:
    - src/db/queries/orders.ts
    - src/db/queries/events.ts
    - src/db/queries/__tests__/orders.test.ts
    - src/db/queries/__tests__/events.test.ts
  modified: []

decisions:
  - D-defer-relations: Drizzle relations() deferred to Phase 34 per RESEARCH.md Open Question 1 — getOrderEvents uses plain db.select() so src/db/index.ts is not modified
  - D-no-requireRole: Read queries do not call requireRole per AUTH-03 (CONTEXT.md line 172); page-level RSC guard handles auth
  - D-no-revalidate-ttl: Both cached queries use tag-only invalidation (no revalidate integer); data is fresh after revalidateTag('production-orders') from mutating actions

metrics:
  duration_minutes: 3
  completed_date: "2026-05-14"
  tasks_completed: 3
  files_created: 4
  files_modified: 0
requirements-completed: []
---

# Phase 33 Plan 02: Read-Layer Query Functions Summary

**One-liner:** Three Drizzle query functions (getProductionOrders, getOrderById, getOrderEvents) with unstable_cache wrapping using tag 'production-orders' for cache invalidation by plan 33-04 transition actions.

## What Was Built

### Exported Functions

**`src/db/queries/orders.ts`**
- `getProductionOrders(filters?: ProductionOrderFilters): Promise<ProductionOrder[]>` — wrapped in `unstable_cache` with tag `'production-orders'`. Accepts optional `{ millLine?: MillLine; states?: ProductionState[] }` filters, applies `eq` and `inArray` conditions via Drizzle, orders by `deliveryTime`.
- `getOrderById(id: string): Promise<ProductionOrder | null>` — plain async function, NOT cached. State-guard read for transition actions in plan 33-04. Returns `null` (not `undefined`) when no row found.
- `ProductionOrderFilters` — exported type alias for reuse by plan 33-04 and Phase 34.

**`src/db/queries/events.ts`**
- `getOrderEvents(orderId: string): Promise<OrderEvent[]>` — wrapped in `unstable_cache` with tag `'production-orders'`, ordered by `desc(orderEvents.changedAt)`. Supported by index `idx_events_order_id_changed_at_desc`.

### Cache Invalidation Contract

The tag string `'production-orders'` appears in both query files. When plan 33-04 calls `revalidateTag('production-orders')` after a successful transition, all `unstable_cache` entries tagged `'production-orders'` (both `getProductionOrders` and `getOrderEvents`) are invalidated. `getOrderById` is intentionally NOT cached — it reads fresh state before the optimistic UPDATE.

### TDD Gate Compliance

1. **RED gate (test commit `d8f64ba`):** `test(33-02)` — both test files created, failed with `Cannot find module '../orders'` and `Cannot find module '../events'`
2. **GREEN gate (feat commit `08659de`):** `feat(33-02)` — implementation files created, all 12 tests pass
3. **REFACTOR gate (refactor commit `c4b718a`):** `refactor(33-02)` — explicit return types, JSDoc for ProductionOrderFilters type alias

## Commits

| Hash | Type | Description |
|------|------|-------------|
| d8f64ba | test(33-02) | RED - add failing query contract tests for orders and events |
| 08659de | feat(33-02) | GREEN - implement getProductionOrders, getOrderById, getOrderEvents |
| c4b718a | refactor(33-02) | document cache-tag contract and extract ProductionOrderFilters type |

## Deviations from Plan

None — plan executed exactly as written. The REFACTOR task acceptance criteria (ProductionOrderFilters exported, JSDoc with STATE.md and idx_events_order_id_changed_at_desc references) were already satisfied in the GREEN implementation; the REFACTOR commit added explicit return type annotations as a substantive change.

## Known Stubs

None. This plan ships pure data-access functions with no UI rendering. There are no placeholder values, hardcoded returns, or stub implementations.

## Threat Surface Scan

No new network endpoints, auth paths, or file access patterns introduced. The query functions are server-only modules that call into the existing `src/db/index.ts` singleton. All filter parameters are TypeScript-typed unions (`MillLine`, `ProductionState[]`, `string`) — no raw SQL string interpolation. Threat register items from plan frontmatter are addressed:

- **T-33-AuthCreep (Elevation of Privilege):** `grep requireRole` returns empty for both query files — acceptance criteria enforced in tests (Test 4 in events.test.ts).
- **T-33-SQLi (Tampering):** Drizzle `eq`/`inArray` operators parameterize all values; no string concatenation.
- **T-33-Stale (Tampering):** `getOrderById` is NOT cached — confirmed by Test 8 source assertion and plain `export async function` declaration.

## Self-Check: PASSED

| Item | Status |
|------|--------|
| src/db/queries/orders.ts | FOUND |
| src/db/queries/events.ts | FOUND |
| src/db/queries/__tests__/orders.test.ts | FOUND |
| src/db/queries/__tests__/events.test.ts | FOUND |
| commit d8f64ba (RED) | FOUND |
| commit 08659de (GREEN) | FOUND |
| commit c4b718a (REFACTOR) | FOUND |
