# Phase 10: Design - Context

**Gathered:** 2026-05-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Create Pencil.dev design files for the customers page: customer list view (customers.pen) and customer detail page (customer-detail.pen) with bin visualization components. These designs will be reviewed and approved before implementation begins in later phases.

</domain>

<decisions>
## Implementation Decisions

### Customer List Layout
- **D-01:** Table rows layout (matches OrdersTable pattern for consistency)
- **D-02:** Minimal columns: Name + Status only (details on click)
- **D-03:** Combined status indicator uses stacked icons (orders badge + changes dot + bin alert icon)
- **D-04:** Search box only at top (no status filter pills) - matches Header search pattern

### Customer Detail Structure
- **D-05:** Header + single scroll layout (fixed header with customer info, scrollable content below)
- **D-06:** Full contact card header (name, location, contact info, delivery preferences)
- **D-07:** Section order: Bins first, then Timeline (bin status is quick-glance, timeline is detailed history)
- **D-08:** Browser back only for navigation (no explicit back button or breadcrumbs)

### Bin Visualization Style
- **D-09:** Vertical tank gauge (fill bar grows bottom to top like a tank level indicator)
- **D-10:** Color fills threshold zones (green above low threshold, yellow in warning zone, red in critical zone)
- **D-11:** Compact row of gauges layout (just tank gauges side by side, metadata on hover/click)
- **D-12:** Display location code + feed type near each gauge, percentage shown in gauge itself

### Visual Consistency
- **D-13:** Use existing color tokens from globals.css (--success, --warning, --error) for bin alert states
- **D-14:** Use Lucide icons (lucide-react) for customer list status icons (Package for orders, AlertTriangle for alerts, etc.)
- **D-15:** Extend existing TimelineItem pattern from OrderDetails for activity timeline (add event types for deliveries and bin alerts)
- **D-16:** Match Header search styling for the customer list search box

### Claude's Discretion
None - all areas had explicit decisions.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — DSGN-01, DSGN-02, DSGN-03 define what must be designed
- `.planning/ROADMAP.md` Phase 10 section — success criteria for design approval

### Design Patterns
- `src/components/OrdersTable.tsx` — Table row pattern to follow for customer list
- `src/components/OrderDetails.tsx` — TimelineItem pattern to extend for activity timeline
- `src/components/Header.tsx` — Search box styling to match
- `src/app/globals.css` — Design tokens (--success, --warning, --error, etc.)

### Prior Designs
- Existing .pen files (if any) — mill-production.pen for filter pill patterns

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **StatusBadge component**: Pattern for status indicators (can inform customer status icons)
- **FilterPill component**: Toggle pattern if filters added later
- **TimelineItem pattern**: Extend for order/delivery/bin alert events
- **Design tokens**: --success (green), --warning (yellow), --error (red) for threshold colors

### Established Patterns
- **Table rows**: OrdersTable uses table with columns, row click for selection
- **Search**: Header search with Search icon from lucide-react, real-time filtering
- **Icons**: All icons from lucide-react (Wheat, Package, AlertTriangle, etc.)
- **Spacing/shadows**: --shadow-card, --shadow-sm tokens for elevation

### Integration Points
- Customer list will be a new page at `/customers`
- Customer detail at `/customers/[id]`
- Timeline will link orders to existing `/orders` page
- Design tokens in globals.css will be reused directly

</code_context>

<specifics>
## Specific Ideas

- Vertical tank gauges for bins (more literal representation of fill levels)
- Stacked icons for customer status (shows all states at once: orders + changes + alerts)
- Compact row of bin gauges (visual density, metadata on hover)
- Full contact card in detail header (more info than typical summary)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 10-design*
*Context gathered: 2026-05-01*
