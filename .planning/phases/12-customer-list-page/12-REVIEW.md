---
phase: 12-customer-list-page
reviewed: 2026-05-04T20:30:00Z
depth: standard
files_reviewed: 4
files_reviewed_list:
  - src/utils/customerSort.ts
  - src/utils/customerSort.test.ts
  - src/app/customers/page.tsx
  - src/app/customers/page.test.tsx
findings:
  critical: 1
  warning: 3
  info: 1
  total: 5
status: issues_found
---

# Phase 12: Code Review Report

**Reviewed:** 2026-05-04T20:30:00Z
**Depth:** standard
**Files Reviewed:** 4
**Status:** issues_found

## Summary

Reviewed customer list page implementation including sorting utility, page component, and associated tests. Found one critical bug involving unsafe non-null assertion operators that will cause runtime crashes, three warnings related to missing error handling and edge case validation, and one info-level issue regarding test reliability.

The sorting logic correctly implements descending date sorting with customers having no orders appearing at the end. However, the implementation contains a critical type safety issue that bypasses TypeScript's null checking, which could lead to production crashes.

## Critical Issues

### CR-01: Unsafe Non-Null Assertion in Sort Function

**File:** `src/utils/customerSort.ts:38-39`

**Issue:** The code uses non-null assertion operators (`!`) on `Map.get()` results without verifying the values exist. If a customer ID is not found in the `customerDates` Map, `get()` returns `undefined`, and the `!` operator incorrectly asserts it's non-null, leading to runtime errors when comparing dates.

**Impact:** This will cause a runtime crash if a customer ID somehow doesn't match between the array and the Map. While unlikely with the current implementation, it violates defensive programming principles and creates a fragile dependency.

**Fix:**
```typescript
return [...customers].sort((a, b) => {
  const aDate = customerDates.get(a.id);
  const bDate = customerDates.get(b.id);

  // Defensive check - should never happen but prevents crashes
  if (aDate === undefined || bDate === undefined) {
    console.error('Customer ID not found in date map:', aDate === undefined ? a.id : b.id);
    return 0; // Maintain current order if data is inconsistent
  }

  // If a has no date, move to end (return positive)
  if (aDate === null) return 1;

  // If b has no date, a stays before (return negative)
  if (bDate === null) return -1;

  // Both have dates - sort descending (most recent first)
  return bDate.getTime() - aDate.getTime();
});
```

## Warnings

### WR-01: Missing Error Handling in useEffect

**File:** `src/app/customers/page.tsx:52-58`

**Issue:** The `getCustomers()` promise chain has no `.catch()` handler. If the service call fails (network error, service unavailable, etc.), the error will be unhandled and the page will remain in loading state indefinitely with no user feedback.

**Fix:**
```typescript
useEffect(() => {
  getCustomers()
    .then(data => {
      setCustomers(sortCustomersByRecentActivity(data));
    })
    .catch(error => {
      console.error('Failed to load customers:', error);
      // TODO: Set error state and display error message to user
    })
    .finally(() => setLoading(false));
}, []);
```

### WR-02: Unchecked Array Access in Reduce

**File:** `src/utils/customerSort.ts:16-18`

**Issue:** The `reduce()` function on line 16 is called on `customerOrders` array without first checking if the array is non-empty (already checked on line 11, so safe), but more importantly, `deliveryDate` comparison assumes both dates are valid Date objects. If mockData contains invalid dates or null/undefined values, this will silently produce incorrect results or fail.

**Impact:** Low risk with current mock data structure, but fragile if data source changes.

**Fix:**
```typescript
const mostRecentOrder = customerOrders.reduce((latest, current) => {
  // Defensive check for invalid dates
  if (!current.deliveryDate || !(current.deliveryDate instanceof Date)) {
    return latest;
  }
  if (!latest.deliveryDate || !(latest.deliveryDate instanceof Date)) {
    return current;
  }
  return current.deliveryDate > latest.deliveryDate ? current : latest;
});

// Additional safety check
if (!mostRecentOrder.deliveryDate || !(mostRecentOrder.deliveryDate instanceof Date)) {
  return null;
}

return mostRecentOrder.deliveryDate;
```

### WR-03: Potential XSS Risk with Inline Styles

**File:** `src/app/customers/page.tsx:120,124,137,144`

**Issue:** Multiple inline `style` attributes use CSS custom properties via `var()` (e.g., `style={{ color: 'var(--primary)' }}`). While CSS custom properties themselves are safe, using inline styles bypasses Content Security Policy (CSP) `style-src` directives that many security-conscious deployments enforce. This isn't an immediate XSS risk, but makes the app incompatible with strict CSP policies.

**Recommendation:** Move inline styles to CSS classes or use Tailwind's CSS variable support:

```tsx
// Replace:
<Package
  className="h-4 w-4"
  style={{ color: 'var(--primary)' }}
  data-testid="status-orders"
/>

// With:
<Package
  className="h-4 w-4 text-[var(--primary)]"
  data-testid="status-orders"
/>
```

## Info

### IN-01: Test Relies on Mock Implementation Detail

**File:** `src/app/customers/page.test.tsx:18`

**Issue:** The test mocks `sortCustomersByRecentActivity` to simply return customers unchanged: `jest.fn((customers) => customers)`. This means the tests never verify that the page actually calls the sort function correctly or handles sorted results. If the page stopped calling the sort function, these tests would still pass.

**Fix:** Either:
1. Don't mock the sort function and let it run (integration test approach)
2. Use `mockReturnValue` with a specific sorted order and verify it's rendered correctly

```typescript
// Approach 1: Don't mock (better for integration testing)
// Remove the mock entirely and import the real function

// Approach 2: Mock with verification
const mockSortedCustomers = [mockCustomers[2], mockCustomers[0], mockCustomers[1]];
(sortCustomersByRecentActivity as jest.Mock).mockReturnValue(mockSortedCustomers);

// Then verify the order matches mockSortedCustomers
```

---

_Reviewed: 2026-05-04T20:30:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
