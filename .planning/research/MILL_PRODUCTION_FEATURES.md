# Feature Landscape: Mill Production Dashboard Filters & State Cards

**Domain:** Feed mill operations (production scheduling and real-time status tracking)
**Researched:** 2026-04-28
**Milestone:** v1.1 — Adding status filter pills, design polish, and data-driven mock service
**Context:** Extends existing mill production view (3-column layout with state-grouped cards)

---

## Overview

This research documents features for the **Mill Production Dashboard** filtering system. Differs from Orders table (which displays individual order lines) — this view shows **production orders grouped by state** (Completed, Mixing, Blocked, Pending) across three mill lines (Premix, Excel, CGM).

---

## Table Stakes

Features users expect. Missing = product feels incomplete for production planning.

| Feature | Why Expected | Complexity | Notes | Dependency |
|---------|--------------|------------|-------|------------|
| **Real-time production state visibility** | Operations staff need to know what's Completed/Mixing/Blocked/Pending right now | Low | Already implemented via 3-column layout | Core view ✓ |
| **Filter by production state** | Users need to focus on specific workflow stages (e.g., "show me only Blocked orders") | Low | Toggle behavior exists in OrdersTable; adapt for 4 mill states | FilterPill pattern ✓ |
| **Progress tracking per mill line** | KPIs (completed lbs / total lbs) essential for workload assessment and shift planning | Low | Already calculated and displayed per column | Core view ✓ |
| **Visual state distinction** | Different colors/borders for each state (Completed=green, Blocked=red, Mixing=orange, Pending=gray) | Low | Already implemented with STATE_COLORS mapping | Core view ✓ |
| **State-grouped card layout** | Orders grouped by state within mill columns is standard kanban-style production view | Low | Already implemented with StateSection component | Core view ✓ |
| **Empty state handling** | When no orders in a state → don't show that section to reduce noise | Low | Already implemented (StateSection returns null for empty states) | Core view ✓ |
| **Filter counts on state pills** | Show count of items in each state to guide operator focus ("Blocked: 2 orders") | Low | NEW: Must implement for filter pills | FilterPill + counts |
| **Clear/reset filters button** | Operators can quickly return to "show all states" view | Low | NEW: Added as secondary action | Filter state management |
| **Filter persistence during session** | Selected filters remain as user navigates between cards, scrolls, returns to page | Low | NEW: useState in page component | React state |
| **Loading state** | Skeleton/spinner while production data fetches from mock service | Low | LoadingSkeleton component exists and works | Core view ✓ |

---

## Differentiators

Features that set this dashboard apart. Not expected, but valuable for production operations.

| Feature | Value Proposition | Complexity | Notes | Dependency |
|---------|-------------------|------------|-------|------------|
| **Mill line filter pills** | Filter by Premix/Excel/CGM in addition to state. Operators focus on their assigned line | Med | Could show which lines are bottlenecks, which are idle. Shows across all 3 columns | Add MillLine filter state |
| **Multi-filter state aggregation** | Combine state filters + mill line filters + (future) search. Answer complex questions: "Show me Blocked orders on Excel line" | Med | Requires coordinating multiple filter sources | Coordinated state + useMemo |
| **Dynamic badge counts respecting all filters** | Counts update as you add more filters (e.g., "Blocked: 2" becomes "Blocked: 1" when you also select "Excel line only") | Med | OrdersTable does this correctly. Badge counts flow from filtered data. | State aggregation |
| **Search integration** | Search by customer name or product to drill down within filtered state cards | Med-High | Not in v1.1 scope (planned v1.2). Would combine search + state + mill filters | Search input + filtering |
| **Color-coded weight indicators** | Progress bars or visual "fill" showing completed percentage per mill | Med-High | Deferred (requires design decision on visual approach) | Future: design phase |
| **Production velocity trending** | Show "Completed 50K lbs so far today" with trend (up/down vs yesterday) | High | Requires timestamped order data and historical calculations | Future: mock data enhancement |
| **Keyboard navigation** | Arrow keys to jump between cards/columns, Enter to drill down | Med | OrdersTable has keyboard nav for rows. Could adapt for card layout. | Future: interaction design |
| **Bulk state transition** | Select multiple cards → move to next state (Mixing → Blocked, etc.) via button | High | Not expected in v1.1. Inline editing deferred. | Future: form-based updates |
| **Shift-based swimlanes** | Horizontal swimlanes for Day/Night shifts, then vertical state columns | High | Out of scope for v1.1. Would completely restructure layout. | Future: architecture decision |

---

## Anti-Features

Features to explicitly NOT build for mill production dashboard.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Drag-drop card reorganization** | Production state is determined by machine logic and quality tests, not manual moves. Prevents operator override of business logic. | Keep state-based auto-grouping. No reordering allowed. |
| **Inline card editing** | Editing state/weight directly in dashboard creates inconsistency with production system. Changes belong in dedicated forms with validation. | Forms-based updates deferred to Phase 2+. Dashboard is read-only view. |
| **Global complex filter modal** (AND/OR/NOT) | Simple toggle filters cover 90% of use cases. Complex query builders overwhelm shift operators. | Keep pill-based toggles additive and simple. No advanced query language. |
| **Real-time push updates** (WebSocket) | Polling or manual refresh sufficient for current scale. WebSocket adds infrastructure complexity without clear ROI. | Keep async mock service. Polling acceptable. Manual refresh button sufficient. |
| **Cross-mill consolidated view** | Operators typically focus on one mill at a time. Cross-mill comparison is useful but filtering across mills is secondary workflow. | Defer: future phase could have separate "All Mills Overview" view. |
| **Custom filter save/recall** (named views) | Deferred until team confirms persistent named views are needed. Most operators use ad-hoc filtering. | Keep default view stateless. Bookmark via URL if needed (future). |
| **Card sorting** (by date, weight, etc.) | Cards are grouped by STATE, which is immutable. Sorting within state breaks the kanban metaphor. | Keep state-based grouping. No secondary sorting within states (v1). |
| **Detailed inline metrics** | Clutter card layouts. Detailed metrics belong in drill-down or dedicated analytics dashboard. | Keep cards simple: order#, customer, product, weight, delivery. Details in side panel (future). |

---

## Current State vs. Desired State

### What Already Works (v1.0 — Core View)

✓ 3-column mill line layout (Premix, Excel, CGM)
✓ Orders grouped by state (Completed, Mixing, Blocked, Pending)
✓ Progress tracking (completed lbs / total lbs per mill)
✓ Color-coded state headers and card borders
✓ Empty state handling (sections don't render if no orders)
✓ Async mock data fetching
✓ Loading skeleton
✓ Responsive card layout

### What's Missing (v1.1 Target)

✗ **Filter pills for production states** — Click "Blocked" to filter and show only Blocked orders across all mills
✗ **Count badges on filter pills** — "Blocked (2)" shows 2 orders are currently blocked
✗ **Filter state aggregation** — Selecting multiple states uses OR logic (show Completed OR Mixing)
✗ **Toggle-off to reset** — Clicking an active filter deselects it, OR have explicit "Clear filters" button
✗ **Search box integration** — Combine state filter + search for "customer name" or "product"
✗ **Design polish** — Match .pen design pixel-for-pixel (colors, spacing, typography)
✗ **Data-driven mock service** — Ensure mock data distribution supports filter testing

---

## Feature Dependencies

Indicates what must be built/exist before other features can work.

```
ProductionOrder data type
    ↓
getProductionOrders() mock service
    ↓
StateSection component with state-based grouping
    ↓
STATE_COLORS mapping & visual styling
    ↓
✅ v1.0 CORE VIEW (complete)

    ↓
📋 STATUS FILTERS (v1.1 NEW)
    ├── FilterPill component
    │   ├── Label (state name: Completed, Mixing, Blocked, Pending)
    │   ├── Count badge (number of orders in that state)
    │   ├── Active state styling
    │   └── Click handler (toggle on/off)
    ├── State filter toggle logic
    │   ├── Track activeStates: Set<ProductionState>
    │   ├── Filter orders before grouping by state
    │   └── Reset button (clear all selections)
    └── Badge count calculation
        ├── For each state: count matching orders
        └── Update when filters change

    ↓
🔍 SEARCH FILTER (v1.2 PLANNED)
    ├── Search input box
    ├── useDebounce(300ms)
    └── Filter logic (customer OR product)

    ↓
🔗 MULTI-FILTER AGGREGATION (v1.2+)
    ├── Coordinate state + search filters
    ├── All filters must apply (AND logic)
    └── Badge counts reflect all active filters
```

---

## Complexity Assessment

### Low Complexity (Can implement this iteration)

**State filter pills with toggle behavior**
- Reuse/adapt FilterPill component from OrdersTable.tsx
- Pattern: `const [activeStates, setActiveStates] = useState<Set<ProductionState>>(new Set())`
- Toggle logic: Same as OrdersTable (add to Set on first click, delete on second)
- Filter orders before passing to columns:
  ```typescript
  const filteredOrders = activeStates.size === 0
    ? orders
    : orders.filter(o => activeStates.has(o.state));
  ```
- **Estimated LOC:** ~40-60 lines (copy OrdersTable pattern, adapt for 4 states vs 5)

**Badge count calculation**
- For each state: count orders matching current filters
- useMemo dependency: [orders, activeStates]
- Pattern exists in OrdersTable (`statusCounts` useMemo)
- **Estimated LOC:** ~20-30 lines

**Clear filters button**
- Single button: "Clear all" or "Reset view"
- onClick: `setActiveStates(new Set())`
- Show only when filters active (conditional render)
- **Estimated LOC:** ~5-10 lines

**Total for v1.1:** ~65-100 lines of TypeScript + TSX

---

### Medium Complexity (Phase boundary, deferred to v1.2)

**Search integration**
- Add search input box (pattern exists in OrdersTable)
- useDebounce hook already available
- Filter logic: customer name OR product contains search term
- Coordinate search + state filters (both must apply)
- **Estimated LOC:** ~80-100 additional

**Mill line filter (future option)**
- Add MillLine toggle to filter state
- Filter orders by millLine after state filter
- Could reduce noise when operator focuses on one mill
- **Estimated LOC:** ~30-40 additional

**Dynamic count updates**
- Ensure all filters update badge counts correctly
- Edge case: if search filters everything out, state counts show "0"
- Pattern: OrdersTable statusCounts useMemo respects hasChangesFilter but NOT activeStatuses (intentional)
- Challenge: getting counts "right" when multiple filters combine
- **Estimated LOC:** ~15-20 lines (useMemo logic)

---

### High Complexity (Future roadmap, likely v1.3+)

**URL-based filter persistence**
- Requires Next.js useSearchParams() integration
- Serialize/deserialize filter state to URL params
- Risk: bookmarked URLs break if data changes
- Benefit: shareable filter views, bookmarkable states

**Production velocity trending**
- Requires timestamped order data
- Mock service needs `createdAt`, `completedAt` fields
- Calculate: "Completed 50K lbs this hour", trending vs last hour
- Requires historical data or analytics calculation

**Shift-based swimlanes**
- Completely restructure layout from [Mill][State] to [Shift][State]
- Would require data enhancement (shift field on ProductionOrder)
- Significant architectural change

---

## Mock Data Service Requirements

The v1.1 milestone requires **data-driven mock service**. Current implementation is static.

### Current Mock Data

Location: `/src/services/millProduction.ts`

```typescript
export async function getProductionOrders(): Promise<ProductionOrder[]> {
  await delay(200 + Math.random() * 100);
  return mockOrders; // Static array, ~200-300ms latency
}
```

### What Already Works

✓ 12 total orders (4 per mill line)
✓ Distribution: 3 Completed, 2 Mixing, 2 Blocked, 5 Pending (good for testing filters)
✓ Weights: 6,000–18,000 lbs (realistic for feed mill batches)
✓ Async interface (returns Promise)
✓ Realistic latency (200-300ms)

### What's Needed (v1.1)

- No schema changes needed. ProductionOrder interface is sufficient.
- Ensure data distribution supports filter testing:
  - Each mill line has orders in multiple states
  - At least 1 Blocked order per mill (to test "Blocked filter works")
  - Mix of weights so progress tracking shows useful percentages
  - Customer/product names diverse enough to test search (future)

### Example Mock Data Verification

Current mockOrders distribution:
- **Premix:** 1 Completed, 1 Mixing, 1 Blocked, 1 Pending ✓ Good
- **Excel:** 2 Completed, 1 Mixing, 0 Blocked, 1 Pending ✓ OK (one line weak on Blocked)
- **CGM:** 1 Completed, 1 Mixing, 1 Blocked, 1 Pending ✓ Good

**Recommendation:** Could add more Blocked orders to Excel for better filtering test coverage, but current distribution is acceptable for v1.1.

---

## Empty States and Error Handling

### Pattern (Proven from Orders Table)

When no results match filters:
1. Display centered message with icon
2. Offer "Clear filters" button
3. Don't show empty sections

### For Mill Production Dashboard

#### No orders in a state
Already handled: `StateSection` returns `null` if `orders.length === 0`

#### All orders filtered out
Need to add: Message "No orders match your filters. Clear filters to see all."
- Show this when: `filteredOrders.length === 0` AND `activeStates.size > 0`
- Display: Centered in main content area, replacing the 3-column layout
- CTA: "Clear filters" button

#### Data load failure
Already handled: catch block logs error, sets loading to false
- Could enhance: Show error message instead of blank screen

#### Loading
Already handled: LoadingSkeleton renders while loading

---

## Interaction Patterns by Feature

### State Filter Pills

**Visual Design:**
- 4 pills: Completed, Mixing, Blocked, Pending
- Inactive (default): Light background (gray-100), gray text, count badge in gray
- Active (clicked): Primary color background (blue), white text, white badge
- Count badge: Smaller background with matching text color
- Rounded corners (pill shape)

**Behavior:**
- Click pill → toggles on (active styling)
- Click again → toggles off (inactive styling)
- Multiple selections allowed (OR logic: show all selected states)
- No filters selected → show all orders
- Badge shows count in that state (respecting any other active filters)

**Accessibility:**
- Button semantic (not div with onClick)
- aria-pressed attribute (true when active)
- Sufficient color contrast
- Keyboard focusable (Tab)

### Clear Filters Button

**Visual Design:**
- Secondary button style (outline or light background)
- Text: "Clear filters" or "Reset view"
- Disabled appearance when no filters active

**Behavior:**
- Click → sets activeStates to empty Set
- Only visible/enabled when 1+ filters active
- Clears state filters only (if search added later, clear button clears all)

---

## Badge Count Calculation Logic

### Pattern (from OrdersTable)

```typescript
const statusCounts = useMemo(() => {
  const counts: Record<ProductionState, number> = {
    'Completed': 0,
    'Mixing': 0,
    'Blocked': 0,
    'Pending': 0,
  };

  // Count from filtered orders
  // (respecting mill line filters, search, etc.)
  let ordersToCount = orders;

  // [If search implemented: filter by search term]
  // [If mill filter implemented: filter by mill line]

  ordersToCount.forEach(order => {
    counts[order.state]++;
  });

  return counts;
}, [orders /* + other filter deps */]);
```

### Key Points

- Badge counts show available items **after applying other filters** (if any)
- If state filter is active, counts should show how many in other states (so user can change filter)
- Edge case: If only "Blocked" selected, badges should show: Completed (3), Mixing (2), Blocked (2, active), Pending (5)

---

## Success Criteria (v1.1 Milestone)

For "state filter pills" feature to be shipped:

- [ ] FilterPill component renders all 4 state names (Completed, Mixing, Blocked, Pending)
- [ ] Click to toggle on/off with visual change (active/inactive styling)
- [ ] Badge shows count of orders in that state
- [ ] Selecting 1+ filters hides non-matching cards from all 3 mill columns
- [ ] Counts update if filters change (e.g., toggle "Blocked" off → other counts increase)
- [ ] "Clear filters" button visible and working when filters active
- [ ] No filters selected returns to showing all orders
- [ ] Pixel-matches .pen design (colors, spacing, typography)
- [ ] Works consistently on all 3 mill columns
- [ ] No console errors or accessibility violations
- [ ] Button elements have aria-pressed for active state
- [ ] FilterPill group renders above the 3-column layout (similar to OrdersTable)

---

## Comparison: OrdersTable Filter Pattern vs Mill Production

To clarify what patterns transfer and what's different:

| Aspect | OrdersTable | Mill Production |
|--------|-------------|-----------------|
| **Data model** | Flat table rows (Order.ts) | Grouped by state within columns (ProductionOrder.ts) |
| **Filter type** | 5 statuses (Pending, Producing, Ready, In Transit, Complete) | 4 states (Completed, Mixing, Blocked, Pending) |
| **Filter count** | 6 filters total (5 status + HasChanges) | 4 filters initially (state only), could expand |
| **Toggle behavior** | Set-based on/off per status | Set-based on/off per state (same pattern) |
| **Badge counts** | statusCounts useMemo + hasChangesCount useMemo | Will need stateCounts useMemo |
| **Search** | Customer name OR product, debounced 300ms | NOT YET (planned v1.2) |
| **Empty state** | Centered placeholder message | Don't render section (null return) |
| **Keyboard nav** | Arrow keys to move rows | NOT IMPLEMENTED (future) |
| **Component reuse** | FilterPill ← USE THIS | FilterPill (same component, different data) |
| **Coordinate filters** | Status AND HasChanges AND Search | Just state initially (search in v1.2) |

**Takeaway:** FilterPill component is reusable. Core filtering logic is same. Main difference is data structure (flat vs grouped).

---

## Implementation Roadmap

### v1.1 (Current Milestone)

1. **Design phase**
   - Design filter pills in .pen (Pencil.dev)
   - Get visual approval (colors, spacing, active state, count badge placement)

2. **Infrastructure phase**
   - Verify mock data distribution is good
   - No changes needed to ProductionOrder type or getProductionOrders()

3. **Build phase**
   - Import FilterPill from OrdersTable (or extract to shared component)
   - Add activeStates state to page component
   - Add toggleState() handler
   - Calculate stateCounts in useMemo
   - Filter orders before passing to MillColumn
   - Add "Clear filters" button
   - Polish to match .pen design
   - Test: each filter toggles correctly, counts update, multiple selections work

**Estimated effort:** 2-3 hours (mostly copy/paste from OrdersTable, adapt to 4 states)

### v1.2 (Proposed Next)

1. Add search input box
2. Coordinate search + state filters
3. Update badge counts to include search
4. Test empty state with combined filters
5. **Estimated effort:** 2-3 hours

### v1.3+ (Future)

1. Mill line filter toggle
2. URL-based filter persistence
3. Keyboard navigation
4. Production velocity metrics
5. Historical trending

---

## Pitfalls & Gotchas

### Common Mistakes

| Mistake | Why It's Bad | Prevention |
|---------|------------|-----------|
| Counting only filtered data for badges | Hides count of items in non-selected states | Count from all data, not filtered data |
| Losing filter state on page reload | User confused why filters disappeared | Store in URL or localStorage (future) |
| "Clear filters" disabled when no filters active | Button flickers or disappears | Conditional render, not disabled state |
| Forgetting to filter before grouping | Shows all orders in unselected states too | Apply filter → then group by state |
| Badge count includes state filter itself | Badge shows "Completed: 2" but clicking shows 3 | Badge counts from all data, filter applies separately |

### Edge Cases

**Edge case 1:** User selects "Completed" filter, then all other states show count 0
- Expected? Depends on UX decision. OrdersTable hides counts for unselected statuses. Mill production could show all counts (to help user switch filters).
- **Recommendation:** Show all counts (helps operators see if they should change filter). OrdersTable behavior is specific to that table's design.

**Edge case 2:** User filters to "Blocked" and there are 0 blocked orders
- Expected: Cards for that mill show "Blocked" section with no cards
- Actually: StateSection returns null, section doesn't render
- This is fine — empty section disappears

**Edge case 3:** User selects multiple states (Completed AND Mixing) — does count update?
- Expected: Yes. Badge "Blocked: 2" stays same, but we're showing more orders
- Actual: Depends on implementation. If counts calculated from unfiltered data, yes.

---

## Sources

**Filter UI/UX Best Practices:**
- [Filter UX Design Patterns & Best Practices - Pencil & Paper](https://www.pencilandpaper.io/articles/ux-pattern-analysis-enterprise-filtering)
- [20 Filter UI Examples for SaaS: Design Patterns & Best Practices](https://arounda.agency/blog/filter-ui-examples)
- [Designing Filters That Work: Best Practices and Guidelines — Smashing Magazine](https://www.smashingmagazine.com/2021/07/frustrating-design-patterns-broken-frozen-filters/)
- [Filter UI Examples for SaaS - Eleken](https://www.eleken.co/blog-posts/filter-ux-and-ui-for-saas)

**Production & Kanban Patterns:**
- [Kanban Board Filter - Business Map](https://businessmap.io/blog/kanban-board-filter)
- [Manufacturing Dashboard - Budibase](https://budibase.com/blog/tutorials/manufacturing-dashboard/)
- [Kanban Inventory Management Guide - TeamHood](https://teamhood.com/kanban/kanban-inventory/)

**Empty States & Error Handling:**
- [Empty State UX Examples & Best Practices - Pencil & Paper](https://www.pencilandpaper.io/articles/empty-states)
- [Empty state — Shopify Polaris](https://polaris-react.shopify.com/components/layout-and-structure/empty-state)

**React State Management & Mocking:**
- [Mock Data Pattern - Cory House](https://github.com/coryhouse/mock-data-pattern)
- [React Design Patterns: A Practical Guide - Syncfusion](https://www.syncfusion.com/blogs/post/react-design-patterns)

**Data-Driven UI Patterns:**
- [The three states of data-driven UI - DEV Community](https://dev.to/tomekbuszewski/the-three-states-of-data-driven-ui-24go)
- [Dynamic badge content in React - Syncfusion](https://ej2.syncfusion.com/react/documentation/badge/how-to/dynamic-badge-content)

---

## Confidence Assessment

| Area | Level | Reasoning |
|------|-------|-----------|
| **Table stakes features** | HIGH | Kanban-style filtering and state grouping are well-established patterns in manufacturing dashboards (SAP, Odoo, Asana boards). Filter pills are industry standard. |
| **FilterPill reuse** | HIGH | Exact component exists in OrdersTable.tsx and works well. Copy/adapt approach is low-risk. |
| **Mock data adequacy** | MEDIUM-HIGH | Current distribution supports filter testing. Could enhance distribution but not required for v1.1. |
| **State filter implementation** | HIGH | Simple toggle logic, no complex derivations. OrdersTable proves the pattern works. |
| **Count badge logic** | MEDIUM | Edge cases exist (what counts are shown when filters active?). Recommend clarifying with design before implementation. |
| **Integration with existing view** | HIGH | Filter pills sit above 3-column layout. No refactoring of existing StateSection or MillColumn needed. |
| **Empty state handling** | MEDIUM | Current null-return approach is OK but could show placeholder when all filters empty results. Recommend design guidance. |
| **Future extensibility** | MEDIUM | Adding search (v1.2) and mill filters requires coordinated state management. Current plan scales. |

---

*Research completed: 2026-04-28*
*Downstream consumer: Phase 2 roadmap planning*
*Next step: Use this feature landscape to design filter pills in .pen and inform v1.1 implementation requirements*
