# Phase 8: Filter Implementation - Context

**Gathered:** 2026-04-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement interactive status filter pills (Completed, Mixing, Blocked, Pending) for the mill production view with multi-select toggle behavior. Filter pills appear above the three mill columns, allowing users to filter the visible cards by production state.

</domain>

<decisions>
## Implementation Decisions

### Component Architecture
- **D-01:** Extract shared FilterPill to `src/components/FilterPill.tsx` — both orders page and mill production use the same component with different color configs
- **D-02:** FilterPill accepts a generic color prop, decoupling it from any specific status type

### Filter Behavior
- **D-03:** Non-matching cards hidden completely when filters active (not dimmed) — matches orders page pattern
- **D-04:** No filters selected by default (show all cards) — FILTR-05 requirement
- **D-05:** Multi-select toggle: clicking a pill toggles that status on/off, multiple pills can be active simultaneously — FILTR-03 requirement

### Count Badges
- **D-06:** Count badges show total orders per status, not filtered count — per D-04 from Phase 6 and FILTR-04 requirement
- **D-07:** Counts remain static regardless of which other filters are active

### Claude's Discretion
- FilterPill props interface design (label, count, color, isActive, onClick)
- State management approach (useState with Set, matching orders page pattern)
- Filter strip positioning/spacing within the layout

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design Specifications
- `designs/mill-production.pen` — Filter pill design (D-07 shows all interaction states)
- `.planning/phases/06-design/06-CONTEXT.md` — Design decisions D-01 through D-07 for filter pill styling and placement

### Requirements
- `.planning/REQUIREMENTS.md` — FILTR-01 through FILTR-05 requirements for this phase

### Existing Implementation Reference
- `src/components/OrdersTable.tsx` — FilterPill component (lines 396-428), activeStatuses pattern, toggle logic
- `src/app/mill-production/page.tsx` — Current page implementation, STATE_ORDER and STATE_COLORS already defined

### Type Definitions
- `src/types/millProduction.ts` — ProductionState type: "Completed" | "Mixing" | "Blocked" | "Pending"

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `FilterPill` in OrdersTable.tsx — Reference implementation to extract and generalize
- `useDebounce` hook — Available if needed (not likely required for filter toggles)
- `STATUS_CONFIG` pattern in StatusBadge.tsx — Status-to-color mapping approach

### Established Patterns
- `activeStatuses: Set<Status>` with toggle function: `setActiveStatuses(prev => { const next = new Set(prev); next.has(s) ? next.delete(s) : next.add(s); return next; })`
- Filter logic: `activeStatuses.size === 0` means show all; non-empty means filter to matching
- Status counts computed via `useMemo` from full orders array (not filtered)
- Status order already defined in mill-production/page.tsx: `STATE_ORDER = ["Completed", "Mixing", "Blocked", "Pending"]`

### Integration Points
- Filter strip inserts between Header and the three MillColumn components
- MillColumn receives filtered `orders` prop (or full orders with filter applied at parent level)
- STATE_COLORS already defined with border/header colors; extend to include filter pill colors using design tokens

</code_context>

<specifics>
## Specific Ideas

- Reuse exact same toggle interaction pattern from orders page (click to toggle, multi-select)
- Status order in filter strip: Completed, Mixing, Blocked, Pending (matches existing STATE_ORDER)
- Design tokens from globals.css: --success (green), --error (red), --warning (yellow), neutral gray

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 8-Filter Implementation*
*Context gathered: 2026-04-29*
