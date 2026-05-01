# Phase 10: Design - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-01
**Phase:** 10-design
**Areas discussed:** Customer list layout, Customer detail structure, Bin visualization style, Visual consistency

---

## Customer List Layout

### Display Style

| Option | Description | Selected |
|--------|-------------|----------|
| Table rows (Recommended) | Matches OrdersTable pattern — columns for name, order count, changes flag, bin alerts. Consistent with existing pages. | ✓ |
| Cards grid | Each customer as a card showing stats. More visual but breaks from table pattern established in orders/mill-production. | |
| You decide | Let Claude choose based on codebase patterns | |

**User's choice:** Table rows (Recommended)

### Columns

| Option | Description | Selected |
|--------|-------------|----------|
| Name, Orders, Changes, Bins (Recommended) | Name (primary), active order count badge, changes flag indicator, bin alert indicator (low/critical) | |
| Name, Location, Orders, Alerts | Add location column, combine changes + bin alerts into single alerts column | |
| Minimal: Name + Status | Just name and a combined status indicator. Details on click. | ✓ |

**User's choice:** Minimal: Name + Status

### Status Indicator

| Option | Description | Selected |
|--------|-------------|----------|
| Badge with icon | Single badge showing most urgent state — red for critical, yellow for warning, green for healthy. Similar to StatusBadge pattern. | |
| Stacked icons | Row of small icons: orders badge + changes dot + bin alert icon. Shows all states at once. | ✓ |
| Color-coded row | Subtle row background color indicating health. Red-tinted for critical, yellow-tinted for warning. | |

**User's choice:** Stacked icons

### Search/Filter

| Option | Description | Selected |
|--------|-------------|----------|
| Search box only (Recommended) | Match the Header search pattern — filters customer names in real-time. Consistent with existing search behavior. | ✓ |
| Search + status filters | Add FilterPill toggles for healthy/warning/critical customers alongside search. | |
| No search on page | Use only the global header search. Keeps page simpler. | |

**User's choice:** Search box only (Recommended)

---

## Customer Detail Structure

### Page Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Header + single scroll (Recommended) | Fixed header with customer name/info, then scrollable content with timeline and bins sections. Matches OrderDetails panel approach. | ✓ |
| Header + tabs | Tabs for Timeline, Bins, Order History. Separates content but requires more clicks to see everything. | |
| Three-column layout | Left: customer info, Middle: timeline, Right: bins. All visible at once but more complex. | |

**User's choice:** Header + single scroll (Recommended)

### Header Content

| Option | Description | Selected |
|--------|-------------|----------|
| Name + location + summary stats | Customer name, farm location, and 3 stat cards (total orders, active bins, recent activity count) | |
| Name + location only | Minimal header — stats shown inline with content sections below | |
| Full contact card | Name, location, contact info, delivery preferences. More detail but takes more space. | ✓ |

**User's choice:** Full contact card

### Section Order

| Option | Description | Selected |
|--------|-------------|----------|
| Timeline first, then Bins (Recommended) | Activity timeline shows what's happening now. Bins section below for current fill levels. | |
| Bins first, then Timeline | Bin status is quick-glance info. Detailed timeline history below. | ✓ |
| Side by side | Timeline left, Bins right — both visible without scrolling (if screen wide enough) | |

**User's choice:** Bins first, then Timeline

### Back Navigation

| Option | Description | Selected |
|--------|-------------|----------|
| Back button in header | Explicit back arrow returns to customer list. Clear navigation path. | |
| Breadcrumb trail | Customers > [Customer Name] breadcrumb at top. More context but takes space. | |
| Browser back only | No explicit back UI — rely on browser back button. Minimal but less discoverable. | ✓ |

**User's choice:** Browser back only

---

## Bin Visualization Style

### Fill Level Display

| Option | Description | Selected |
|--------|-------------|----------|
| Horizontal percentage bar (Recommended) | Fill bar grows left to right showing percentage. Standard progress bar pattern. Matches ROADMAP spec (BIN-01). | |
| Vertical tank gauge | Fill bar grows bottom to top like a tank level indicator. More literal but needs more vertical space. | ✓ |
| Circular gauge | Ring/donut showing percentage filled. Compact but harder to compare across multiple bins. | |

**User's choice:** Vertical tank gauge

### Threshold Visualization

| Option | Description | Selected |
|--------|-------------|----------|
| Color fills threshold zones | Green when above low threshold, yellow in warning zone, red in critical zone. Fill color changes as level drops. | ✓ |
| Marker lines on gauge | Horizontal lines marking threshold levels. Fill stays neutral color, lines show danger zones. | |
| Color + lines combined | Both threshold markers AND color-coded fill. More info but potentially cluttered. | |

**User's choice:** Color fills threshold zones

### Multiple Bins Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Card grid (Recommended) | 2-3 bins per row in card layout. Each card shows gauge + metadata (location code, capacity, feed type). Matches ROADMAP spec (BIN-03). | |
| Vertical list | One bin per row, full width. More detail visible per bin but takes more vertical space. | |
| Compact row of gauges | Just the tank gauges side by side, metadata on hover/click. Minimal but less scannable. | ✓ |

**User's choice:** Compact row of gauges

### Bin Metadata

| Option | Description | Selected |
|--------|-------------|----------|
| Location code + percentage | Bin name/code and current fill percentage displayed near gauge | |
| Location + feed type | Which bin and what feed type. Percentage shown in gauge itself. | ✓ |
| Full details on click | Just gauge visible, click reveals location, capacity, feed type, percentage in a tooltip/popover | |

**User's choice:** Location + feed type

---

## Visual Consistency

### Alert Colors

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, use existing tokens (Recommended) | Use --success (green), --warning (yellow), --error (red) from globals.css. Consistent with StatusBadge colors. | ✓ |
| New bin-specific palette | Define new tokens like --bin-ok, --bin-low, --bin-critical. Allows differentiation from order statuses. | |
| Grayscale bins | Bins use neutral grays, only show color on alert states. Less visual noise. | |

**User's choice:** Yes, use existing tokens (Recommended)

### Status Icons

| Option | Description | Selected |
|--------|-------------|----------|
| Lucide icons like existing (Recommended) | Use lucide-react icons to match Header, Sidebar, OrdersTable patterns. Package icon for orders, AlertTriangle for alerts, etc. | ✓ |
| Colored dots/badges | Simple colored indicators without icons. Cleaner but less descriptive. | |
| Custom SVG icons | New icons specific to customer/bin context. More distinctive but adds design work. | |

**User's choice:** Lucide icons like existing (Recommended)

### Timeline Pattern

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, extend existing pattern | Reuse TimelineItem pattern from OrderDetails, add event types for deliveries and bin alerts. | ✓ |
| New timeline component | Design fresh timeline optimized for mixed event types. May look different from order timeline. | |
| Simple event list | No visual timeline connector — just a list of dated events. Simpler implementation. | |

**User's choice:** Yes, extend existing pattern

### Search Box Styling

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, match Header search (Recommended) | Same search icon, input styling, placeholder text pattern as Header.tsx | ✓ |
| Simpler inline input | Basic text input with placeholder. Less styled, blends into content area. | |
| You decide | Let Claude choose based on context | |

**User's choice:** Yes, match Header search (Recommended)

---

## Claude's Discretion

None — user made explicit choices for all areas.

## Deferred Ideas

None — discussion stayed within phase scope.
