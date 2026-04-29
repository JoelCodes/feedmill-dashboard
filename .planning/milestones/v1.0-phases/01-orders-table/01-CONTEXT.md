# Phase 1: Orders Table - Context

**Gathered:** 2026-03-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can filter, search, and select orders in the orders table. Display order lines with all required columns, provide status filtering with pills, search by customer/product, and row selection with visual highlight. Opening the details panel is Phase 2 scope.

</domain>

<decisions>
## Implementation Decisions

### Column Display
- Delivery date format: Absolute full ("March 15, 2026")
- Quantity display: Number only (e.g., "24.5"), no unit in cell
- Column header: "QTY (TONS)" to clarify unit
- Long text handling: Wrap to multiple lines (no truncation)
- Product column: Texture Type + Formula Type combined (prior decision)

### Filter Behavior
- Status pills: Multi-select (toggle multiple statuses on/off)
- No "All" pill — when nothing selected, show all orders automatically
- "Has changes" filter: Displayed as a pill alongside status pills (with red dot indicator)
- Filter counts: Update dynamically to reflect current filter context

### Search Behavior
- Search timing: Debounced (~300ms after user stops typing)
- Search scope: Customer name + Product (texture + formula)
- Highlight matches: Yes, bold or background color on matched text
- Search position: Above filters, at top of table card

### Row Selection
- Selection mode: Single row only (click to select)
- Highlight style: Subtle background tint (light primary color)
- Deselection: Clicking selected row does NOT deselect (must click different row)
- Keyboard navigation: Basic support (arrow keys to move, Enter to confirm)

### Claude's Discretion
- Exact debounce timing (around 300ms)
- Specific background color for selected row
- Empty state design and messaging
- Loading state during filter/search changes

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `StatusBadge` component with `STATUS_CONFIG` — already handles all 5 statuses with correct styling
- `FilterPill` component — exists in OrdersTable, needs modification for multi-select behavior
- `Order` type — has all required fields including `hasChanges` boolean
- Mock orders service — 18 orders with async interface (`getOrders()`, `getOrdersByStatus()`)
- `TableSkeleton` component — for loading states

### Established Patterns
- Tailwind CSS with CSS custom properties for design tokens
- `@/` path aliases for imports
- Pascal case components, camelCase variables
- Default exports for main components, named exports for utilities

### Integration Points
- OrdersTable.tsx — main component to modify
- Currently uses hardcoded `orders` array — switch to `getOrders()` service
- Status counts currently hardcoded — need to compute from filtered data

</code_context>

<specifics>
## Specific Ideas

- "In Transit" abbreviated to "Transit" in UI labels (prior decision from Phase 0)
- Red dot indicator for orders with changes — already in prototype

</specifics>

<deferred>
## Deferred Ideas

- Keyboard navigation was originally in v2 requirements (ADV-03) but user wants basic support in v1

</deferred>

---

*Phase: 01-orders-table*
*Context gathered: 2026-03-11*
