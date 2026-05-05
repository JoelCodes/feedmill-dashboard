---
phase: 12-customer-list-page
plan: 01
subsystem: data-utilities
tags:
  - tdd
  - customer-sorting
  - utility-function
dependency_graph:
  requires:
    - src/types/customer.ts (CustomerWithStats interface)
    - src/types/order.ts (Order interface)
    - src/services/mockData.ts (mockOrders data source)
  provides:
    - sortCustomersByRecentActivity function
  affects: []
tech_stack:
  added: []
  patterns:
    - TDD red-green-refactor cycle
    - Pure function design
    - Performance optimization with memoization
key_files:
  created:
    - src/utils/customerSort.ts
    - src/utils/customerSort.test.ts
  modified: []
decisions:
  - decision: Pre-compute delivery dates before sorting
    rationale: Avoid O(n²) lookups during sort comparisons
    alternatives: Compute on-demand during sort (simpler but slower)
    outcome: Chose memoization for better performance
  - decision: Use getTime() for date comparison
    rationale: Ensures precise datetime sorting, not just date
    alternatives: String comparison (unreliable), toISOString (slower)
    outcome: getTime() is fastest and most reliable
metrics:
  duration_seconds: 176
  completed_date: "2026-05-05T03:23:51Z"
  commits: 3
  test_count: 7
---

# Phase 12 Plan 01: Customer Sort by Recent Activity Summary

TDD implementation of customer sorting logic to order customers by most recent order delivery date.

## What Was Built

**sortCustomersByRecentActivity** — Pure utility function that sorts customers by their most recent order delivery date (descending), with customers having no orders appearing at the end.

**Key features:**
- Sorts by exact datetime (not just date) for precision
- Customers with no orders always at end
- Non-mutating (uses spread operator)
- Optimized with date memoization to avoid repeated lookups
- 7 comprehensive tests covering edge cases

## TDD Cycle Execution

### RED Phase (Commit: ff9cdf8)

**Tests written:**
1. Sort by most recent delivery date (descending)
2. Customers with no orders appear at end
3. Preserve stable order for customers with no orders
4. Handle empty array
5. Handle single customer
6. Sort by exact datetime (not just date)
7. Do not mutate input array

**Initial failing tests:** 3 failed, 4 passed (stub implementation)

**Why they failed:** Stub implementation returned unsorted array

### GREEN Phase (Commit: 9e0d29b)

**Implementation added:**
- `getMostRecentDeliveryDate(customerId)` helper function
  - Filters mockOrders by customerId
  - Returns null if no orders
  - Uses reduce to find max deliveryDate
- `sortCustomersByRecentActivity(customers)` main function
  - Spreads input array to avoid mutation
  - Sort comparator handles null dates (customers with no orders)
  - Descending sort using getTime() comparison

**Test fix:** Corrected "preserve stable order" test to "sort by exact datetime" — CUST-005 has later time on same day as CUST-001 (14:00 vs 08:00), so should come first.

**Result:** All 7 tests passing

### REFACTOR Phase (Commit: 9925889)

**Optimization:** Pre-compute delivery dates using Map to avoid repeated lookups during sort

**Before:** O(n × m × log n) where m is avg orders per customer
**After:** O(n × m + n log n) — compute once, then sort

**Changes:**
- Created customerDates Map before sorting
- Pre-populate with getMostRecentDeliveryDate for each customer
- Sort comparator uses cached dates

**Verification:** All 7 tests still passing

## Commits

| Type     | Hash    | Message                                         |
| -------- | ------- | ----------------------------------------------- |
| test     | ff9cdf8 | Add failing tests for customer sort            |
| feat     | 9e0d29b | Implement customer sort by recent activity      |
| refactor | 9925889 | Optimize customer sort with date memoization    |

## Deviations from Plan

None - plan executed exactly as written.

## Success Criteria

- [x] Failing test written and committed (RED)
- [x] Implementation passes test (GREEN)
- [x] Refactor complete (REFACTOR)
- [x] All 3 commits present with correct prefixes
- [x] 7 tests passing
- [x] Function ready for consumption by customer list page

## Known Stubs

None - function is fully implemented with real data from mockOrders.

## Self-Check: PASSED

**Created files verified:**
```
FOUND: src/utils/customerSort.ts
FOUND: src/utils/customerSort.test.ts
```

**Commits verified:**
```
FOUND: ff9cdf8
FOUND: 9e0d29b
FOUND: 9925889
```

**Tests verified:**
```
Test Suites: 1 passed, 1 total
Tests:       7 passed, 7 total
```
