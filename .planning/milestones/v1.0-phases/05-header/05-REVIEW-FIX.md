---
phase: 05-header
fixed_at: 2026-04-29T00:30:19Z
review_path: .planning/phases/05-header/05-REVIEW.md
iteration: 2
findings_in_scope: 7
fixed: 7
skipped: 0
status: all_fixed
---

# Phase 05: Code Review Fix Report

**Fixed at:** 2026-04-29T00:30:19Z
**Source review:** .planning/phases/05-header/05-REVIEW.md
**Iteration:** 2

**Summary:**
- Findings in scope: 7
- Fixed: 7
- Skipped: 0

## Fixed Issues

### CR-01: Missing Error Handling in OrdersTable Data Fetch

**Files modified:** `src/components/OrdersTable.tsx`
**Commit:** a6e3596
**Applied fix:** Added `.catch()` handler to `getOrders()` promise to log errors and prevent unhandled promise rejections. Error logging is suppressed in production to align with prior IN-01 fix pattern.

### CR-02: Missing Error Handling in Mill Production Page

**Files modified:** `src/app/mill-production/page.tsx`
**Commit:** 601765b
**Applied fix:** Added `.catch()` handler to `getProductionOrders()` promise. The catch block logs the error (in non-production) and calls `setLoading(false)` to exit the loading state, preventing users from being stuck on an infinite loading skeleton.

### WR-01: Unsafe Type Assertion in Theme Select Handler

**Files modified:** `src/app/settings/page.tsx`
**Commit:** 2c8b66d
**Applied fix:** Replaced unsafe `as "light" | "dark"` cast with runtime validation. Now checks if value is exactly `'light'` or `'dark'` before calling `updateTheme()`, making the code type-safe without relying on TypeScript casts.

### WR-02: Unsafe Type Assertion in Density Select Handler

**Files modified:** `src/app/settings/page.tsx`
**Commit:** 30949b1
**Applied fix:** Replaced unsafe `as "comfortable" | "compact"` cast with runtime validation. Now checks if value is exactly `'comfortable'` or `'compact'` before calling `updateDensity()`.

### WR-03: Keyboard Handler Cannot Receive Events Without Focus

**Files modified:** `src/components/NotificationDropdown.tsx`
**Commit:** aff2a63
**Applied fix:** Added focus management to NotificationDropdown:
- Added `useEffect` and `useRef` imports
- Created `dropdownRef` for focus management
- Added `useEffect` to focus dropdown when `isOpen` becomes true
- Added `tabIndex={-1}` to make div focusable
- Added `focus:outline-none` class for clean appearance
- Combined `clickOutsideRef` and `dropdownRef` using callback ref pattern

### WR-04: Potential Null Event Target in useClickOutside

**Files modified:** `src/hooks/useClickOutside.ts`
**Commit:** 9b36b74
**Applied fix:** Added explicit null check for `event.target` before using it in `el.contains()`. The code now extracts `target` to a variable and checks `!target` in the early-return condition.

### IN-01: Hardcoded "18 dispatched this week" in OrdersTable

**Files modified:** `src/components/OrdersTable.tsx`
**Commit:** 91415ae
**Applied fix:** Replaced hardcoded "18" with computed `dispatchedThisWeek` value:
- Added `useMemo` hook that calculates orders with status `'Complete'` and `deliveryDate` within the last 7 days
- Updated JSX to use `{dispatchedThisWeek}` interpolation instead of hardcoded number

## Skipped Issues

None -- all findings were fixed.

---

_Fixed: 2026-04-29T00:30:19Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 2_
