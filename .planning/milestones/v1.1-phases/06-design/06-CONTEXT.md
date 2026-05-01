# Phase 6: Design - Context

**Gathered:** 2026-04-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Design status filter pills UI for the mill production view. Create/update the mill-production.pen file with filter pill placement, styling, and interaction states. Get user approval before implementation begins (Phase 8).

</domain>

<decisions>
## Implementation Decisions

### Pill Placement
- **D-01:** Filter pills appear as a horizontal strip above all three columns (Premix, Excel, CGM)
- **D-02:** Pills are left-aligned compact (grouped on the left with space on the right)

### Pill Styling
- **D-03:** Match orders page visual style (rounded pills with background color)
- **D-04:** Add count badges showing total orders per status (e.g., "Completed (12)")

### Color System
- **D-05:** Use existing design tokens from globals.css, not hardcoded colors
- **D-06:** Map status colors to existing tokens:
  - Completed = --success (green)
  - Blocked = --error (red)
  - Mixing = --warning (yellow/amber)
  - Pending = neutral (gray)

### Design Deliverable
- **D-07:** Create full interaction flow in .pen file:
  - Frame 1: Default state (no filters selected, all cards visible)
  - Frame 2: Hover/focus state on individual pills
  - Frame 3: Some pills selected (active state styling)
  - Frame 4: Filtered result (showing how cards hide when not matching)

### Claude's Discretion
- Specific pill dimensions (padding, border-radius) following orders page patterns
- Exact spacing between pills and below filter strip
- Count badge positioning (inline vs. superscript)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design Files
- `designs/mill-production.pen` — Current mill production view design (update this file)
- `designs/order-dashboard.pen` — Reference for existing filter pill styling
- `designs/design-system.pen` — Design tokens and component patterns

### Requirements
- `.planning/REQUIREMENTS.md` — DESGN-01, DESGN-02 requirements for this phase

### Design Tokens
- `src/app/globals.css` — CSS custom properties defining colors (--success, --error, --warning, etc.)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `FilterPill` component in OrdersTable.tsx — Reference for pill styling
- `StatusBadge` component — Reference for status color application
- STATUS_CONFIG in StatusBadge.tsx — Existing status-to-color mapping

### Established Patterns
- Tailwind CSS utility classes with CSS custom properties
- Filter pills using template literals for conditional styling
- Pill states: default (gray background), active (colored background)

### Integration Points
- mill-production.pen is the target design file
- Filter strip will sit between Header and the three mill columns
- Colors must use globals.css tokens for consistency

</code_context>

<specifics>
## Specific Ideas

- Status order in filter strip: Completed, Mixing, Blocked, Pending (matches STATE_ORDER in code)
- Count badges show TOTAL orders per status (not filtered count) — same as FILTR-04 requirement
- Visual hierarchy: filter strip should be secondary to mill columns, not dominant

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 6-Design*
*Context gathered: 2026-04-28*
