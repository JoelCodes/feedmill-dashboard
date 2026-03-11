---
phase: 01-orders-table
plan: 03
subsystem: orders-table
tags: [search, selection, keyboard-nav, ux, interactivity]
dependency_graph:
  requires:
    - 01-02-filtering
  provides:
    - search-debounce
    - row-selection
    - keyboard-navigation
    - empty-state
  affects:
    - orders-table-component
tech_stack:
  added:
    - useDebounce hook
  patterns:
    - debounced search (~300ms)
    - derived state for selection validation
    - keyboard event handling
    - text highlighting with regex
key_files:
  created:
    - src/hooks/useDebounce.ts
  modified:
    - src/components/OrdersTable.tsx
decisions:
  - Derived validSelectedId from filteredOrders to avoid setState in useEffect (React best practice)
  - Text highlighting uses regex with escaped special characters for safety
  - Empty state provides "Clear all filters" button for better UX
  - Selection validation automatically clears when row filtered out
metrics:
  duration: 262s
  tasks_completed: 3
  files_created: 1
  files_modified: 1
  commits: 3
  completed_at: "2026-03-11T19:43:19Z"
---

# Phase 01 Plan 03: Search, Selection & Keyboard Nav Summary

**One-liner:** Debounced search with text highlighting, single-row selection with arrow key navigation, and empty state feedback.

## What Was Built

Added complete interactivity to the Orders Table:

1. **Search functionality** - Text input with debounced filtering by customer name or product (texture + formula type)
2. **Text highlighting** - Matching search terms highlighted in customer and product columns with primary/20 background
3. **Row selection** - Single-row selection with primary/10 background tint
4. **Keyboard navigation** - Arrow keys move selection up/down through visible rows
5. **Empty state** - Friendly message and "Clear all filters" button when no orders match

## Tasks Completed

| # | Task | Status | Commit |
|---|------|--------|--------|
| 1 | Create useDebounce hook | ✓ | 2b154d4 |
| 2 | Add search with debounce and text highlighting | ✓ | 8733620 |
| 3 | Add row selection, keyboard navigation, and empty state | ✓ | 34490ed |

## Key Implementation Details

### useDebounce Hook
- Generic TypeScript hook with 300ms default delay
- Returns debounced value after specified delay
- Cleans up timeout on unmount or value change

### Search & Highlighting
- Search input positioned above filters per CONTEXT.md
- `debouncedSearch` value drives filtering to prevent rapid re-renders
- `escapeRegex` function prevents regex injection from search terms
- `highlightMatch` splits text on matches and wraps in `<mark>` tags
- Filter counts (status + hasChanges) respect search filter

### Selection & Keyboard Nav
- `selectedId` state tracks user's selected row
- `validSelectedId` derived from `filteredOrders` - automatically null if selected row filtered out
- Clicking already-selected row does NOT deselect (per requirements)
- Arrow Down/Up navigate through `visibleIds` array
- Selected row scrolls into view with smooth behavior
- Table container is focusable (tabIndex={0}) for keyboard events

### Empty State
- Shows Package icon, message, and "Clear all filters" button
- Clear button resets all three filter types: search, status pills, hasChanges

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed React setState-in-effect lint error**
- **Found during:** Task 3 verification
- **Issue:** useEffect calling setSelectedId(null) synchronously causes cascading renders and violates React best practices
- **Fix:** Changed to derived state pattern - compute `validSelectedId` from `selectedId` and `visibleIds` instead of clearing in effect
- **Files modified:** src/components/OrdersTable.tsx
- **Commit:** 34490ed (included in Task 3 commit)

## Verification

### Automated
- [x] `npm run lint` passes with no errors
- [x] `npm run build` passes with no errors
- [x] TypeScript compilation succeeds

### Manual (Ready for Human)
Per plan verification steps:

**Search:**
- [ ] Type "green" in search - see "Greenfield Farms" with "green" highlighted
- [ ] Type "pellet" - see multiple orders with "PELLET" highlighted in product column
- [ ] Search is debounced - type quickly and filtering only happens after pause

**Selection:**
- [ ] Click a row - it gets primary/10 background tint
- [ ] Click the same row again - stays selected (no deselect)
- [ ] Click different row - new row selected, old row loses highlight

**Keyboard:**
- [ ] Use arrow down key - selection moves to next row
- [ ] Use arrow up key - selection moves to previous row
- [ ] Arrow navigation scrolls row into view if needed

**Empty State:**
- [ ] Search for "xyz123" - empty state appears with "No orders match" message
- [ ] Click "Clear all filters" button - all orders return

**Combined:**
- [ ] Filter to "Pending" status, search "green" - see filtered list with highlighting
- [ ] Status counts update when search/filter changes

## Success Criteria

- [x] Search input above filters with debounced filtering (~300ms)
- [x] Search filters by customer name and product (texture + formula)
- [x] Matching text highlighted with primary/20 background
- [x] Single row selection with primary/10 background
- [x] Clicking selected row does NOT deselect
- [x] Arrow keys navigate between visible rows
- [x] Selection clears when row no longer visible (after filter change)
- [x] Empty state displays when no orders match filters
- [x] "Clear all filters" button resets search and filters
- [x] Build and lint pass

## Files Modified

### Created
- `src/hooks/useDebounce.ts` - Generic debounce hook for React state

### Modified
- `src/components/OrdersTable.tsx` - Added search, selection, keyboard nav, empty state

## Next Steps

Phase 1 complete! The Orders Table now has:
- Static data display (Plan 01)
- Multi-select filtering (Plan 02)
- Search, selection, and keyboard navigation (Plan 03)

Phase 2 will add the Order Details panel and wire selection to show order details.

## Self-Check: PASSED

**Created files:**
- ✓ FOUND: src/hooks/useDebounce.ts

**Commits:**
- ✓ FOUND: 2b154d4 (Task 1 - useDebounce hook)
- ✓ FOUND: 8733620 (Task 2 - search with highlighting)
- ✓ FOUND: 34490ed (Task 3 - selection, keyboard nav, empty state)

All claims verified.
