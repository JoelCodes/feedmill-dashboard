---
phase: 12-customer-list-page
plan: 02
subsystem: customer-list-ui
tags:
  - tdd
  - customer-list
  - search-filtering
  - status-indicators
dependency_graph:
  requires:
    - src/types/customer.ts (CustomerWithStats interface)
    - src/services/customers.ts (getCustomers service)
    - src/utils/customerSort.ts (sortCustomersByRecentActivity)
    - src/hooks/useDebounce.ts (debounce hook)
    - src/components/Sidebar.tsx (page layout)
    - src/components/Header.tsx (page layout)
  provides:
    - Customer list page at /customers route
  affects:
    - Site navigation (Customers link now functional)
tech_stack:
  added: []
  patterns:
    - TDD red-green-refactor cycle
    - Real-time search with debouncing
    - Conditional status indicator rendering
    - Loading skeleton pattern
    - Empty state pattern
key_files:
  created:
    - src/app/customers/page.tsx
    - src/app/customers/page.test.tsx
  modified: []
decisions:
  - decision: Mock usePathname in tests
    rationale: Sidebar component uses usePathname for active state detection
    alternatives: Create a separate test wrapper without Sidebar
    outcome: Added usePathname mock to test setup (deviation Rule 3 - blocking issue)
metrics:
  duration_seconds: 144
  completed_date: "2026-05-05T03:29:36Z"
  commits: 2
  test_count: 10
---

# Phase 12 Plan 02: Customer List Page Summary

Customer list page with real-time search, status indicators (orders/changes/bin alerts), loading states, and row-click navigation to customer detail.

## What Was Built

**Customer list page at /customers** — Searchable table showing all customers with visual status indicators for order activity, changes flags, and bin alert levels.

**Key features:**
- Real-time search filtering by customer name (debounced 300ms)
- Status indicators in fixed 120px column: Package icon (active orders), red dot (changes), AlertTriangle (bin alerts)
- Package icon uses --primary color when customer has active orders
- Red dot shows when customer has orders with changes
- Yellow AlertTriangle for low bin alerts, red for critical
- 5 skeleton rows during data loading
- Empty state with Users icon when no results
- Row click navigates to /customers/[id] (detail page in Phase 13)
- Customers sorted by recent delivery date via sortCustomersByRecentActivity

## TDD Cycle Execution

### RED Phase (Commit: 9736fb7)

**Tests written:**
1. Renders search input with placeholder "Search customers by name..."
2. Renders customer names from getCustomers() service
3. Filters customers by name when search term entered (case-insensitive)
4. Shows Package icon when stats.activeOrders > 0
5. Shows red dot when stats.hasChanges is true
6. Shows yellow AlertTriangle when stats.binAlertLevel is "low"
7. Shows red AlertTriangle when stats.binAlertLevel is "critical"
8. Shows 5 skeleton rows when loading
9. Shows empty state when no customers match search
10. Calls router.push('/customers/[id]') when row clicked

**Initial failing tests:** All 10 failed (page component didn't exist)

**Why they failed:** Module './page' not found

### GREEN Phase (Commit: 1aa6582)

**Implementation added:**
- CustomersPage component with Sidebar + Header layout
- Search input with debounced filtering (300ms delay)
- Customer list with name and status indicators
- CustomerTableSkeleton component (5 rows, matching design)
- EmptyState component with Users icon and copy from UI-SPEC.md
- Status indicators with data-testids for testing
- Row click handler using useRouter().push()
- Loading state management with useEffect + async getCustomers

**Test fix:** Added usePathname mock to handle Sidebar dependency (deviation Rule 3)

**Result:** All 10 tests passing

### REFACTOR Phase

**Not needed** — Component is already clean and follows established patterns from OrdersTable. No performance or maintainability improvements identified.

## Commits

| Type | Hash    | Message                                    |
| ---- | ------- | ------------------------------------------ |
| test | 9736fb7 | Add failing tests for customer list page  |
| feat | 1aa6582 | Implement customer list page              |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking Issue] Added usePathname mock to test setup**
- **Found during:** GREEN phase test execution
- **Issue:** Tests failed with "TypeError: usePathname is not a function" because Sidebar component uses usePathname for active route detection
- **Fix:** Updated jest.mock('next/navigation') to include usePathname: jest.fn(() => '/customers')
- **Files modified:** src/app/customers/page.test.tsx
- **Commit:** 1aa6582 (included in GREEN phase commit)

## Human Verification Required (Non-Blocking Checkpoint)

**Task 2: Visual verification of customer list page**

This plan included a non-blocking human-verify checkpoint. The following verification steps are recommended but not blocking:

### What Was Built
Customer list page at /customers with search, status indicators, loading states, and empty states

### How to Verify
1. Start dev server: `npm run dev`
2. Navigate to http://localhost:3000/customers
3. Verify loading state: Should briefly show 5 skeleton rows
4. Verify customer list: Should show 18 customers sorted by recent delivery date
5. Verify status indicators:
   - Look for Package icon (teal) on customers with active orders
   - Look for red dots on customers with order changes (Valley Ranch, Pine Hill, Mountain View, Highland)
   - Look for yellow/red alert triangles on customers with bin alerts
6. Test search:
   - Type "green" - should filter to show "Greenfield Farms"
   - Type "xyz" - should show empty state "No customers found"
   - Clear search - should show all customers
7. Test row click:
   - Click any customer row - should navigate to /customers/CUST-XXX (page won't exist yet, but URL should change)

### Expected Behavior
- Search filters customers in real-time (debounced)
- Status indicators appear correctly based on customer stats
- Loading skeleton appears during initial load
- Empty state appears when no search results
- Row click updates browser URL to /customers/[id]

## Success Criteria

- [x] Customer list page renders at /customers
- [x] Search filters customers by name (case-insensitive, debounced)
- [x] Package icon shows when stats.activeOrders > 0
- [x] Red dot shows when stats.hasChanges is true
- [x] Yellow AlertTriangle shows when stats.binAlertLevel is "low"
- [x] Red AlertTriangle shows when stats.binAlertLevel is "critical"
- [x] 5 skeleton rows show during loading
- [x] Empty state shows when no customers match search
- [x] Row click navigates to /customers/[id]
- [x] All tests pass (10/10)
- [x] Customers sorted by recent delivery date (via sortCustomersByRecentActivity from Plan 01)

## Known Stubs

None - component is fully implemented with real data from getCustomers service. Navigation to /customers/[id] route is intentional - detail page will be implemented in Phase 13.

## Self-Check: PASSED

**Created files verified:**
```
FOUND: src/app/customers/page.tsx
FOUND: src/app/customers/page.test.tsx
```

**Commits verified:**
```
FOUND: 9736fb7
FOUND: 1aa6582
```

**Tests verified:**
```
Test Suites: 1 passed, 1 total
Tests:       10 passed, 10 total
```

**Build verified:**
```
Route (app): /customers ✓
```
