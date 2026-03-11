# Phase 2: Order Details - Context

**Gathered:** 2026-03-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can view detailed order information, timeline, and change history in a panel. Clicking a table row updates the details panel content. The panel displays full order info, a timeline of events (status changes, order placement, mill/logistics changes), and change history inline in the timeline.

</domain>

<decisions>
## Implementation Decisions

### Panel Behavior
- Panel is always visible on the right side (current prototype layout)
- Clicking a row updates panel content — no open/close mechanics needed
- Auto-select first row on page load — panel always has content
- When filters change and selected order is filtered out, auto-select first visible order
- Clicking the selected row does NOT deselect (always have a selection)

### Timeline Content
- Events to show: Status changes, Order placed, Mill/logistics changes
- Detail level: Brief — title + timestamp + one-line description
- Color coding by event type: Normal events = primary blue, changes/alerts = red, completion = green
- Sort order: Newest first by default
- Toggle to switch sort direction (small icon/button near "Timeline" header)
- Sort preference persisted in local storage

### Change History
- Changes appear inline in timeline (not separate section)
- Change types to track: Mill assignment, Delivery date, Quantity, Product changes
- Show before/after values: "Mill: ABC Mill → McGruff Mill" diff format
- Visual distinction: Red icon + red connector (error color) for change events

### Panel Header
- Title: Document # + Customer name ("ORD-2847 — Greenfield Farms")
- Status badge: Show current order status
- Subtitle: Product summary (quantity + texture + formula)
- Include: Delivery location

### Stat Cards
- Display: Quantity ordered, Delivery date, Texture type (with formula subtext)
- Behavior: Static display only (not interactive)

### Claude's Discretion
- Exact stat card layout and sizing
- Timeline toggle icon design
- Loading/transition states when switching orders
- Empty timeline handling (if no events yet)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `OrderDetails.tsx`: Complete timeline prototype with `TimelineItem`, `TimelineConnector`, `StatCard` components
- `StatusBadge` component: Reuse for status in panel header
- `DetailsSkeleton.tsx`: Loading state already built
- `Order` type: All required fields available including `hasChanges`

### Established Patterns
- Timeline uses `colorMap` for primary/success/error colors
- TimelineStep interface with icon, title, description, date, color
- StatCard pattern for displaying key metrics

### Integration Points
- page.tsx: OrderDetails and OrdersTable rendered side-by-side
- Need to lift selection state to page.tsx (or use context)
- OrdersTable already has `selectedOrderId` state — need to expose it
- OrderDetails needs to receive `orderId` prop and fetch/display that order

</code_context>

<specifics>
## Specific Ideas

- Timeline sort toggle should persist in localStorage so user preference is remembered
- Change events should clearly show what changed with before → after format
- Panel header combines document number and customer (prototype pattern: "ORD-2847 — Greenfield Farms")

</specifics>

<deferred>
## Deferred Ideas

- QC milestones (moisture/protein readings, batch numbers) — could be added later if needed
- Expandable timeline events for rich detail — keep simple for v1
- Clickable stat cards for drill-down — not needed for this phase

</deferred>

---

*Phase: 02-order-details*
*Context gathered: 2026-03-11*
