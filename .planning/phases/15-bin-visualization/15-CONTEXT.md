# Phase 15: Bin Visualization - Context

**Gathered:** 2026-05-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Display customer bin fill levels using vertical tank gauges on the customer detail page. Each gauge shows fill percentage with color thresholds (green for normal, yellow for low, red for critical). Bins are displayed in a horizontal row within the existing contact info section.

</domain>

<decisions>
## Implementation Decisions

### Empty State Handling
- **D-01:** Hide bins section entirely when customer has no bins — no empty state message or placeholder

### Visual Design (carried forward from Phase 10)
- **D-02:** Vertical tank gauge style — fill bar grows bottom to top like a tank level indicator
- **D-03:** Color fills threshold zones — green (#48bb78) above 25%, yellow (#f59e0b) 10-25%, red (#e53e3e) below 10%
- **D-04:** Compact row of gauges layout — horizontal row within contact info section
- **D-05:** Display location code + feed type below each gauge, percentage shown inside gauge

### Integration
- **D-06:** Use existing `getBinsByCustomerId` service function — already implemented in Phase 11
- **D-07:** Add bins fetch in customer detail page with parallel data fetching pattern

### Claude's Discretion
None — all areas had explicit decisions.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — BIN-01, BIN-02, BIN-03 define success criteria
- `.planning/ROADMAP.md` Phase 15 section — success criteria for bin visualization

### Design Files
- `designs/customer-detail.pen` — Bin gauge design (lines ~495-810 for BinGaugeRow component)
- Design shows: 40×70px gauge containers, fill bars, percentage text, location/feed labels

### Prior Phase Decisions
- `.planning/phases/10-design/10-CONTEXT.md` — D-09 through D-12 define visual style
- `.planning/phases/13-customer-detail-infrastructure/13-CONTEXT.md` — Page infrastructure

### Existing Types and Services
- `src/types/bin.ts` — Bin interface with fillPercentage, alertLevel, locationCode, feedType
- `src/services/bins.ts` — `getBinsByCustomerId()` service function
- `src/app/customers/[id]/page.tsx` — Customer detail page to integrate bins into

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Bin type**: Complete interface with fillPercentage, alertLevel, capacityTons, currentFillTons
- **getBinsByCustomerId service**: Async function ready for parallel fetching
- **Design tokens**: `--success` (#48bb78), `--warning` (#f59e0b), `--error` (#e53e3e) in globals.css

### Established Patterns
- **Server Component parallel fetching**: `Promise.all([...])` pattern in customer detail page
- **Design token colors**: Use `bg-[var(--success)]` style for threshold colors
- **Component structure**: Props interface at top, default export function

### Integration Points
- **Customer detail page**: Add BinGaugeRow component after ActivityTimeline
- **Data fetching**: Add `getBinsByCustomerId(id)` to existing parallel fetch
- **Conditional rendering**: Only render bins section if bins.length > 0 (D-01)

</code_context>

<specifics>
## Specific Ideas

- Gauge dimensions from design: 40×70px container, 36×N fill bar
- Fill bar position: starts at y=2px from bottom, height varies with percentage
- Percentage text: 12px bold white (or dark when low fill), centered in gauge
- Location label: 10px bold dark, below gauge
- Feed type: 10px normal gray, below location
- Gap between gauges: 24px

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 15-bin-visualization*
*Context gathered: 2026-05-05*
