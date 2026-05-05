---
phase: 14
plan: 01
subsystem: activity-timeline
tags: [tdd, data-layer, types, service]
dependency_graph:
  requires: [mockData, Order, Bin, Customer]
  provides: [ActivityEvent, getActivityEvents]
  affects: []
tech_stack:
  added: []
  patterns: [TDD, event-generation, timestamp-sorting]
key_files:
  created:
    - src/types/activity.ts
    - src/services/activity.ts
    - src/services/activity.test.ts
  modified: []
decisions:
  - "ActivityEvent type uses explicit event records (not derived on-the-fly) per D-01"
  - "Event generation follows order lifecycle progression per D-03"
  - "Title/description templates match UI-SPEC copywriting contract exactly"
metrics:
  duration_seconds: 1794
  completed_date: "2026-05-05"
  tasks_completed: 1
  files_created: 3
  files_modified: 0
  tests_added: 9
---

# Phase 14 Plan 01: Activity Event Service Summary

**One-liner:** Activity event service with TDD implementation generates timeline events from orders (lifecycle stages) and bins (alerts) following UI-SPEC copywriting templates.

## What Was Built

Created the data foundation for the activity timeline feature:

1. **ActivityEvent type** (`src/types/activity.ts`)
   - Defines 8 event types: order_placed, production_started, ready, out_for_delivery, delivered, delivery_completed, bin_alert_low, bin_alert_critical
   - Interface includes common fields (id, customerId, type, timestamp, title, description)
   - Optional order-specific fields (orderId, orderQuantity, orderProduct, orderStatus)
   - Optional bin-specific fields (binId, binLocationCode, binFillPercentage)

2. **Activity service** (`src/services/activity.ts`)
   - `getActivityEvents(customerId)` returns all events for a customer
   - Generates events from orders based on lifecycle stage (D-03)
   - Generates bin alert events for bins with alertLevel "low" or "critical"
   - Events sorted by timestamp descending (newest first)
   - Title/description templates per UI-SPEC copywriting contract

3. **TDD test suite** (`src/services/activity.test.ts`)
   - 9 comprehensive tests covering all requirements
   - Tests empty results, sorting, field presence, event generation logic
   - Validates title/description format against UI-SPEC templates
   - All tests passing

## Deviations from Plan

None - plan executed exactly as written.

## TDD Gate Compliance

✓ RED gate: Test commit dc079ae (failing tests for activity events)
✓ GREEN gate: Implementation commit 273ecd0 (passing tests with types + service)
✓ REFACTOR gate: Included in GREEN commit (JSDoc documentation, import cleanup)

## Key Implementation Details

### Event Generation Logic

**Order events:** Per D-03, one event per order lifecycle stage based on current status. For example:
- Order with status "Ready" generates 3 events: order_placed, production_started, ready
- Order with status "Complete" generates 5 events: order_placed, production_started, ready, out_for_delivery, delivered

**Bin alert events:** Generated for bins where alertLevel is "low" or "critical" (not "none"):
- bin_alert_low: triggered when fillPercentage < 40%
- bin_alert_critical: triggered when fillPercentage < 20%

### Copywriting Templates (UI-SPEC Contract)

**Order titles:**
- order_placed: "Order #{documentNumber} Placed"
- production_started: "Production Started - Order #{documentNumber}"
- ready: "Order #{documentNumber} Ready for Pickup"
- out_for_delivery: "Order #{documentNumber} Out for Delivery"
- delivered: "Order #{documentNumber} Delivered"

**Order descriptions:**
- order_placed: "{quantity} tons {product} ordered for delivery"
- production_started: "Producing {quantity} tons {product}"
- ready: "Order ready for shipment"
- out_for_delivery: "Shipment departed for {location}"
- delivered: "Delivered to {location}"

**Bin alert titles:**
- bin_alert_low: "Low Feed Alert - Bin {locationCode}"
- bin_alert_critical: "Critical Feed Alert - Bin {locationCode}"

**Bin alert descriptions:**
- bin_alert_low: "{feedType} level dropped below 30%"
- bin_alert_critical: "{feedType} level dropped below 15%"

## Test Coverage

| Test | Description | Status |
|------|-------------|--------|
| 1 | Empty array for non-existent customer | ✓ Pass |
| 2 | Events sorted by timestamp descending | ✓ Pass |
| 3 | Order events include correct fields | ✓ Pass |
| 4 | Bin alert events generated for bins with alerts | ✓ Pass |
| 5 | Title/description match UI-SPEC contract | ✓ Pass |
| 6 | Delivery events for Complete orders | ✓ Pass |
| 7 | Production events for Producing orders | ✓ Pass |
| 8 | Ready events for Ready orders | ✓ Pass |
| 9 | Out for delivery events for In Transit orders | ✓ Pass |

## Known Stubs

None. All functionality is fully implemented.

## Files Created

1. `src/types/activity.ts` (27 lines)
   - Exports: ActivityEventType, ActivityEvent

2. `src/services/activity.ts` (153 lines)
   - Exports: getActivityEvents

3. `src/services/activity.test.ts` (120 lines)
   - Test suite: 9 tests

## Dependencies

**Imports:**
- `@/types/order` (Order, OrderStatus)
- `@/types/bin` (Bin)
- `./mockData` (mockOrders, mockBins)

**Exports used by:**
- Future: ActivityTimeline component (Phase 14 Plan 02)
- Future: Customer detail page integration (Phase 14 Plan 03)

## Integration Points

### Existing Code
- Uses mockOrders and mockBins from shared mockData.ts singleton (Phase 11 D-08)
- Follows existing Order and Bin type definitions
- Consistent customerId linkage pattern

### Future Integration
- ActivityTimeline component will consume ActivityEvent[] from getActivityEvents
- Customer detail page will call getActivityEvents(customerId) to populate timeline

## Success Criteria

✓ ActivityEvent type defined with all event types per D-01, D-02
✓ Activity service generates events from orders and bins
✓ Events sorted by timestamp descending (newest first)
✓ Title/description templates match UI-SPEC copywriting contract
✓ All TDD tests pass

## Self-Check: PASSED

**Files created:**
- ✓ src/types/activity.ts exists
- ✓ src/services/activity.ts exists
- ✓ src/services/activity.test.ts exists

**Commits:**
- ✓ dc079ae exists (test commit)
- ✓ 273ecd0 exists (feat commit)

**Exports:**
- ✓ ActivityEvent type exported from activity.ts
- ✓ ActivityEventType type exported from activity.ts
- ✓ getActivityEvents function exported from activity.ts

**Tests:**
- ✓ All 9 tests passing
- ✓ No test failures or warnings
