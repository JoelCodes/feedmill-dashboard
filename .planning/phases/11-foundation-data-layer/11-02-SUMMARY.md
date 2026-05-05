---
phase: 11-foundation-data-layer
plan: 02
subsystem: data-services
tags: [tdd, services, customers, aggregation]
dependency_graph:
  requires:
    - 11-01 (types, mockData)
  provides:
    - customers service with stats aggregation
  affects:
    - future customer UI components
tech_stack:
  added: []
  patterns:
    - TDD (Red/Green/Refactor)
    - Async service functions with delay
    - Stats aggregation from related data
key_files:
  created:
    - src/services/customers.ts
    - src/services/customers.test.ts
  modified: []
decisions:
  - Compute stats at query time (not cached) for data freshness
  - BinAlertLevel priority: critical > low > none
  - Active orders = total - completed (any non-Complete status)
metrics:
  duration: 2m 41s
  completed: 2026-05-05T00:41:33Z
  tasks: 1
  files_created: 2
  files_modified: 0
  test_count: 11
---

# Phase 11 Plan 02: Customer Service with Stats Aggregation

Customer service with getCustomers() and getCustomerById() functions, computing stats from orders and bins using TDD.

## TDD Phases

### RED Phase: Write Failing Tests

**Commit:** `1c10448` - test(11-02): add failing tests for customer service

**Tests written (11 total):**
1. `getCustomers()` returns array with length 18
2. First customer has `id` property
3. First customer has `stats` object with `totalOrders` property
4. Customer with orders has `totalOrders > 0` (CUST-001)
5. Customer with completed orders has `completedOrders > 0` (CUST-016)
6. Customer with bin at critical level has `binAlertLevel "critical"` (CUST-001)
7. Customer stats has correct `activeOrders` count
8. Customer with order changes has `hasChanges true` (CUST-002)
9. `getCustomerById("CUST-001")` returns customer with correct id
10. `getCustomerById("INVALID")` returns null
11. Returned customer has stats with all required properties

**Why tests failed:** Module `./customers` did not exist.

### GREEN Phase: Implement Service

**Commit:** `2907c8c` - feat(11-02): implement customer service with stats aggregation

**Implementation:**
- `getCustomers()`: Returns all 18 customers with computed stats (300ms delay)
- `getCustomerById(id)`: Returns single customer with stats or null (200ms delay)
- `calculateCustomerStats(customerId)`: Aggregates orders/bins for a customer
- `calculateBinAlertLevel(bins)`: Returns highest alert level (critical > low > none)

**Stats computation:**
```typescript
totalOrders = customerOrders.length;
completedOrders = orders.filter(o => o.status === "Complete").length;
activeOrders = totalOrders - completedOrders;
hasChanges = customerOrders.some(o => o.hasChanges);
binAlertLevel = calculateBinAlertLevel(customerBins);
```

### REFACTOR Phase: Clean Up

**Commit:** `b5bb024` - refactor(11-02): remove unused Customer import

**Change:** Removed unused `Customer` type import since `CustomerWithStats extends Customer` provides the base type implicitly when spreading.

## Commits

| Type | Hash | Message |
|------|------|---------|
| test | 1c10448 | add failing tests for customer service |
| feat | 2907c8c | implement customer service with stats aggregation |
| refactor | b5bb024 | remove unused Customer import |

## Test Results

```
Test Suites: 1 passed, 1 total
Tests:       11 passed, 11 total
Time:        3.664 s
```

## Deviations from Plan

None - plan executed exactly as written.

## TDD Gate Compliance

- RED gate: `1c10448` (test commit exists)
- GREEN gate: `2907c8c` (feat commit exists after test)
- REFACTOR gate: `b5bb024` (refactor commit exists after feat)

All TDD gates passed.

## Self-Check: PASSED

- [x] src/services/customers.ts exists (85 lines)
- [x] src/services/customers.test.ts exists (85 lines)
- [x] Commit 1c10448 exists (test)
- [x] Commit 2907c8c exists (feat)
- [x] Commit b5bb024 exists (refactor)
- [x] All 11 tests pass
