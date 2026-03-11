# Feature Landscape: Operations Dashboard Order Management

**Domain:** Feed mill operations / logistics dashboard
**Researched:** 2026-03-11
**Focus:** Order management table interactivity

## Table Stakes

Features users expect from an operations/logistics dashboard. Missing any of these makes the product feel incomplete or unusable.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Status filtering** | Users need to focus on specific order states (pending, in-progress, complete) | Low | Industry standard. Filter pills/tabs above table. Should update counts dynamically. |
| **Text search** | Users remember customer names or order numbers, not row positions | Low | Search across customer name, order/document number, product. Debounced input (300ms). |
| **Status badges** | Visual scanning requires color-coded states | Low | Color convention: Green (complete/shipped), Blue (in-progress), Yellow (mixing/loading), Red (pending/urgent). |
| **Row selection** | Users need to view details without navigation | Low | Click row to highlight and show detail panel. Single selection model for v1. |
| **Sort by column** | Users organize by delivery date, customer, status to prioritize work | Medium | Click column header to sort. Show sort direction indicator (↑↓). Common defaults: delivery date ascending, status grouped. |
| **Clear visual hierarchy** | Scanning 20-100+ rows requires scannable typography | Low | Bold order numbers and quantities. Secondary text for metadata. Adequate line height (40-48px rows). |
| **Empty states** | No results from filters/search needs helpful messaging | Low | "No orders match your filters" with clear action to reset. Prevents confusion. |
| **Row hover state** | Affordance for clickability | Low | Subtle background change on hover. Industry standard for interactive tables. |
| **Responsive column widths** | Data truncation breaks usability | Low | Order # fixed narrow, customer/destination flex, quantity fixed narrow, status fixed. |
| **Loading states** | Async operations need feedback | Low | Skeleton rows or spinner during data fetch. Prevents perceived freeze. |
| **Persistent filters** | Users expect selections to remain during session | Medium | State management for active filters. Reset on page reload acceptable for v1. |
| **Date formatting** | Operations teams work in calendar time | Low | Relative dates (Today, Tomorrow, Mar 15) or consistent format (MM/DD/YYYY). Local timezone. |
| **Alert/flag indicators** | Changed orders need immediate visibility | Low | Red dot or badge. Feed mill context: quantity changes, delivery date shifts, formula changes. |
| **Batch size visibility** | Large datasets need pagination or virtual scroll | Medium | For 100+ rows: pagination (20-50/page) OR infinite scroll. Feed mills often 10-100 active orders, so may defer. |

## Differentiators

Features that set the product apart. Not expected, but create competitive advantage or delight.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Multi-column sorting** | Sort by status, then delivery date creates workflow optimization | Medium | Hold Shift + click second column. Common in advanced dashboards (Airtable, Notion). |
| **Saved filter presets** | Operations managers create views: "My urgent deliveries", "Changed orders this week" | High | Requires backend persistence. Reduces repeated filtering. Power user feature. |
| **Bulk actions** | Select multiple rows → mark as reviewed, export, print delivery slips | High | Checkbox column, action bar appears. Common in logistics tools (ShipStation, Odoo). |
| **Column customization** | Users show/hide columns based on role (dispatcher vs production) | Medium | Dropdown menu to toggle columns. Saves to localStorage or backend. |
| **Smart filters** | "Overdue deliveries", "High priority customers", "Changed in last 24h" | Medium | Pre-built filter logic. Reduces cognitive load vs manual filtering. |
| **Keyboard shortcuts** | Power users navigate with arrow keys, Enter to select row | Medium | ↑↓ to navigate rows, Enter to open details, / to focus search. Accessibility benefit. |
| **Export functionality** | Download filtered view as CSV/Excel for offline analysis | Low-Medium | Common request from operations teams. Reporting workflow. |
| **Inline editing** | Quick quantity or date adjustments without detail panel | High | Double-click cell to edit. Requires validation, save states. Risky for production data. |
| **Real-time updates** | Orders update without refresh when changed by other users | High | Requires WebSocket/SSE. Prevents stale data in multi-user environment. |
| **Advanced search** | Boolean operators, wildcards, field-specific search (customer:ABC) | Medium | Power user feature. Common in tools like Jira, GitHub. |
| **Density toggle** | Compact/comfortable/spacious row height | Low | User preference. Comfortable = 48px rows, Compact = 36px. Power users prefer compact. |
| **Column pinning** | Pin order # and status columns while scrolling horizontally | Medium | Sticky columns. Useful for wide tables (8+ columns). |
| **Row grouping** | Group by status or delivery date for visual organization | High | Collapsible sections. Adds complexity to filtering/sorting. |

## Anti-Features

Features to explicitly NOT build. Avoids scope creep and maintains focus.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Advanced analytics/charts in table** | Table's job is data display, not analysis. Clutters interface. | Separate KPI cards (already exists) or dedicated analytics view. |
| **Drag-and-drop reordering** | Order priority should be managed by business logic (delivery date, status), not manual sorting. | Smart default sorting (delivery date + status). |
| **Inline chat/comments** | Feature creep. Communication tools exist (email, Slack). | Link to external communication or defer to v2+ with dedicated comments feature. |
| **Mobile app (v1)** | Feed mill operations happen at desktop workstations. Mobile adds complexity without ROI. | Responsive design for tablet acceptable. Defer native mobile. |
| **Custom theming per user** | Single operations team, shared visual language reduces confusion. | System-wide theme only. |
| **Unlimited undo/redo** | Complex state management for minimal benefit in view-only dashboard. | Standard browser back/forward if navigation implemented. |
| **AI-powered search** | Over-engineering for structured data. Traditional search sufficient. | Exact match + fuzzy search on key fields. |
| **Embedded document preview** | Scope creep. Invoices/BOLs should live in external systems. | Download link or external system integration. |
| **Social features** | Not a collaboration tool. Operations focus. | Separate communication channels. |

## Feature Dependencies

```
Row selection → Order details panel (one enables the other)
Text search → Empty states (search without results needs messaging)
Status filtering → Filter reset button (filters need clearing mechanism)
Column sorting → Sort indicator UI (sorting needs visible state)
Multi-select → Bulk actions (bulk actions meaningless without selection)
Saved filters → User accounts (persistence requires identity)
Real-time updates → Backend integration (requires data source)
Inline editing → Validation + save states (editing requires data integrity)
Export → Filtered data state (export reflects current view)
```

## MVP Recommendation

**Prioritize** (Milestone 1 - Orders Table):
1. **Status filtering** - Core workflow. Users organize by production stage.
2. **Text search** - Find specific orders quickly. Customer name + order number.
3. **Row selection** - Opens detail panel. Primary interaction.
4. **Row hover state** - Affordance for selection.
5. **Alert indicators** - Changed orders are high priority in feed mills.
6. **Sort by column** - Delivery date and status are primary organization axes.
7. **Empty states** - Prevents confusion when filters yield no results.
8. **Clear visual hierarchy** - Scannable at a glance.

**Defer to v1.5/v2**:
- **Pagination** - Only needed if dataset exceeds 50-100 rows. Check real usage first.
- **Multi-column sorting** - Nice-to-have, not critical for initial release.
- **Column customization** - Wait for user feedback on which columns matter.
- **Keyboard shortcuts** - Accessibility win, but not blocking for launch.
- **Export functionality** - Common request, but defer until data structure stable.

**Defer to v2+**:
- **Saved filter presets** - Requires backend + auth. Validate manual filtering patterns first.
- **Bulk actions** - Wait for clear use case from users.
- **Inline editing** - High risk. Validate read-only workflow sufficient first.
- **Real-time updates** - Polling/refresh acceptable for v1. Add WebSocket when multi-user confirmed.
- **Advanced search** - Validate simple search covers 90%+ of cases first.
- **Row grouping** - Adds visual complexity. Validate users want this vs status filters.

## Interaction Patterns by Feature

### Status Filtering
**Pattern:** Filter pills/tabs above table
- All (default selected, shows count)
- Status-specific pills (Pending, Producing, Ready, In Transit, Complete)
- Click pill to filter, click again to deselect
- Multiple statuses selectable (OR logic)
- Count badge on each pill updates with filtered results
- "Has changes" toggle as additional filter

**Rationale:** Visual scanning faster than dropdown. Industry standard (Asana, Linear, Jira).

### Text Search
**Pattern:** Search input in header area (top-right of table card)
- Placeholder: "Search orders..."
- Debounced 300ms to prevent excessive filtering
- Search fields: Customer name, Order/Document number, Product (texture + formula)
- Case-insensitive partial match
- Clear button (X) appears when text entered
- Updates results count indicator

**Rationale:** Users remember names/numbers, not row positions. Top-right placement convention (Gmail, Notion).

### Row Selection
**Pattern:** Click anywhere on row (excluding interactive elements)
- Single selection model (clicking new row deselects previous)
- Selected row: highlighted background (subtle primary color tint)
- Opens order details panel to the right or below
- Keyboard: ↑↓ to navigate, Enter to select (enhancement)

**Rationale:** Entire row clickable reduces precision needed. Single selection simpler than multi for detail view.

### Column Sorting
**Pattern:** Click column header to sort
- Initial click: ascending
- Second click: descending
- Third click: remove sort (return to default)
- Default sort: Delivery date ascending (soonest first)
- Sort indicator: ↑ (ascending) ↓ (descending) in header
- Only one column sorted at a time (v1)

**Rationale:** Delivery date and status are primary organization needs. Single-column sorting simpler for initial release.

### Alert/Change Indicators
**Pattern:** Red dot next to order number
- Appears when order has changes (quantity, date, formula modifications)
- Tooltip on hover: "This order has changes" (enhancement)
- Filter pill: "Has changes" to show only flagged orders
- Flag stored in data: `hasChanges: boolean`

**Rationale:** Feed mills need immediate visibility into changed orders. Red dot convention from notification systems.

### Empty States
**Pattern:** Center message when no results
- No orders at all: "No orders yet. Orders will appear here once created."
- No search results: "No orders match '{search term}'. Try a different search."
- No filter results: "No {status} orders. Try a different filter." + "Clear filters" button
- Icon + message + action button layout

**Rationale:** Prevents user confusion. Actionable messaging reduces support burden.

## Data Display Conventions

### Column Structure (left to right)
1. **Order/Document #** - Fixed width ~100px, bold, left-aligned
2. **Customer** - Flex, left-aligned, truncate with ellipsis if needed
3. **Product** - Flex, left-aligned, shows "Texture + Formula" (e.g., "PELLET / NON MEDICATED")
4. **Quantity** - Fixed width ~80px, right-aligned, bold, unit (lbs)
5. **Location/Bin** - Fixed width ~100px, left-aligned
6. **Delivery Date** - Fixed width ~100px, left-aligned, formatted (MM/DD or "Today")
7. **Status** - Fixed width ~120px, badge component

### Typography
- **Header row:** 10px, bold, uppercase, secondary text color
- **Data rows:** 12px, regular, primary text color
- **Bold emphasis:** Order number, quantity
- **Line height:** 40-48px for comfortable scanning

### Status Badge Colors (following existing pattern)
- **Pending:** Red background, red dot
- **Producing/Mixing:** Yellow/orange background, yellow dot
- **Ready:** Blue background, blue dot
- **In Transit/Loading:** Blue background, blue dot
- **Complete/Shipped:** Green background, green dot

### Row Styling
- **Background:** White default, subtle hover (gray-50), selected (primary-50)
- **Divider:** 1px gray-200 between rows
- **Padding:** 12px vertical, 16px horizontal
- **Border radius:** 8px on table card, no radius on individual rows

## Confidence Assessment

| Area | Confidence | Source |
|------|------------|--------|
| Table stakes features | **HIGH** | Established patterns from ERP systems (SAP, Odoo), logistics platforms (ShipStation, Flexport), and project management tools (Asana, Linear, Jira). These patterns are 10+ year conventions. |
| Interaction patterns | **HIGH** | Based on widely-adopted patterns in data table libraries (TanStack Table, AG Grid, Material-UI DataGrid) and design systems (Material Design, Carbon, Fluent). |
| Feed mill domain specifics | **MEDIUM** | Alert/change indicators and delivery date prominence derived from PROJECT.md context and general logistics workflows. Real user validation recommended. |
| Differentiators value | **MEDIUM** | Features like saved filters and bulk actions are common in enterprise tools, but specific ROI for feed mill operations should be validated with users. |
| Anti-features rationale | **HIGH** | Based on product focus (operations dashboard, not communication tool) and stated constraints (web-first, no mobile v1, mock data initially). |

## Notes & Considerations

### Search Performance
With mock data, search is instant. Real datasets of 500+ orders may need:
- Backend search API (vs client-side filtering)
- Search indexing
- Debounced input validation

**Recommendation:** Client-side search acceptable for <500 rows. Monitor performance with real data.

### Filter Combinations
Status filters + text search + "has changes" toggle create combined states:
- Apply filters in order: status → changes → search
- OR logic for multiple statuses (show all selected statuses)
- AND logic between filter types (status AND changes AND search)

**Recommendation:** Clear "Active filters" indicator showing current state.

### Accessibility
Table stakes for modern web apps:
- Keyboard navigation (Tab, ↑↓, Enter)
- ARIA labels for screen readers (`role="table"`, `aria-label`)
- Focus indicators (outline on keyboard navigation)
- Sufficient color contrast (WCAG AA minimum)

**Recommendation:** Implement keyboard navigation in Milestone 1. Full ARIA audit in Milestone 2.

### Mobile Considerations (deferred, but noted)
If responsive version needed:
- Stack columns vertically (card layout per order)
- Status filter becomes dropdown
- Search remains top-fixed
- Tap row for details (no hover state)

**Recommendation:** Desktop-first per PROJECT.md. Tablet (768px+) should work with current layout.

### Data Freshness
Operations teams need current data:
- Polling interval: 30-60 seconds acceptable for v1
- "Last updated" timestamp in UI
- Manual refresh button
- Visual indicator during fetch

**Recommendation:** Polling acceptable. WebSocket adds complexity without clear ROI for feed mill use case.

## Sources

**HIGH Confidence (established patterns):**
- Data table interaction patterns from TanStack Table (formerly React Table), AG Grid, Material-UI DataGrid documentation
- Design system conventions from Material Design (Google), Carbon Design System (IBM), Fluent UI (Microsoft)
- Enterprise dashboard patterns from SAP Fiori, Salesforce Lightning, Microsoft Dynamics
- Logistics platform patterns from industry observation (ShipStation, Flexport, project44 interfaces)

**MEDIUM Confidence (domain-specific):**
- Feed mill operations context from PROJECT.md and OrdersTable.tsx analysis
- Change tracking importance inferred from feed manufacturing domain (formula compliance, quality control)
- Delivery date prominence from logistics workflows

**Training Data Limitations:**
- Cannot verify current (2026) design trends without WebSearch/WebFetch access
- Interaction patterns based on pre-2025 libraries (though conventions are stable)
- No direct feed mill user research available

**Recommendations for Validation:**
- User testing with feed mill operations staff on filter/search patterns
- Analytics on which columns are most frequently sorted
- User feedback on alert/change indicator usefulness
- A/B test row selection model (single vs multi-select)

---

*Research completed: 2026-03-11*
*Next step: Use this feature landscape to inform Milestone 1 requirements and design decisions*
