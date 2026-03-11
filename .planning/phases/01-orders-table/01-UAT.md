---
status: complete
phase: 01-orders-table
source: [01-01-SUMMARY.md, 01-02-SUMMARY.md, 01-03-SUMMARY.md]
started: 2026-03-11T21:00:00Z
updated: 2026-03-11T21:10:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Orders Table Displays 18 Orders with 7 Columns
expected: Open the app in browser. OrdersTable shows 18 orders with columns: Document #, Customer, Product (combined texture+formula), Quantity (tons), Location, Delivery date (formatted "Month Day, Year"), and Status badge.
result: pass

### 2. Red Dot Indicator on Orders with Changes
expected: Orders that have changes show a red dot indicator on the row. Not all orders should have this dot.
result: pass

### 3. Multi-Select Status Filter Pills
expected: Click a status pill (e.g., "Pending"). Table filters to only show orders with that status. Click another status pill - both statuses now shown (OR behavior). Click an active pill again to deselect it.
result: pass

### 4. Has Changes Filter Pill
expected: Click the "Has Changes" pill (rightmost, has red dot). Table filters to only orders with changes. This combines with status filters - selecting "Pending" + "Has Changes" shows only pending orders that also have changes.
result: pass

### 5. Dynamic Filter Counts
expected: Filter counts on each pill update based on context. When "Has Changes" is active, status counts reflect only orders with changes. When searching, all counts update to match visible results.
result: pass

### 6. Search Filters by Customer and Product
expected: Type "green" in search box. After brief pause (~300ms), table filters to show only orders matching "green" in customer name or product. "Greenfield Farms" should appear with "green" highlighted.
result: pass

### 7. Search Text Highlighting
expected: When searching, matching text is highlighted in customer and product columns with a subtle background color.
result: pass

### 8. Row Selection
expected: Click any table row. Row gets a highlighted background (primary/10 tint). Click a different row - new row is selected, old row loses highlight. Click the same selected row again - it stays selected (no toggle/deselect).
result: pass

### 9. Keyboard Navigation
expected: Click a row to select it (or click the table area to focus). Press Arrow Down - selection moves to next row. Press Arrow Up - selection moves to previous row. If row is out of view, table scrolls to show it.
result: pass

### 10. Empty State
expected: Search for "xyz123" or apply filters that match no orders. Table shows empty state with message "No orders match" and a "Clear all filters" button. Clicking the button resets search and all filters, showing all orders again.
result: pass

### 11. Combined Filtering
expected: Apply status filter (e.g., "Pending"), enable "Has Changes", and search for text. All three filters combine - only orders matching ALL criteria appear. Status counts update to reflect the combined filter state.
result: pass

## Summary

total: 11
passed: 11
issues: 0
pending: 0
skipped: 0

## Gaps

[none]
