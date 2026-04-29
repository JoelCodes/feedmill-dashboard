# Phase 7: Data Infrastructure - Context

**Gathered:** 2026-04-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Create production orders mock service derived from Book1.xlsx example data. The service provides realistic mock data for the mill production view, with 30+ orders distributed across mill lines and production states.

</domain>

<decisions>
## Implementation Decisions

### Data Fields
- **D-01:** Hybrid approach — add Texture Type and Line Code to ProductionOrder type
- **D-02:** Keep current fields: orderNumber, customer, product, weightLbs, deliveryTime, state, millLine
- **D-03:** Farm Location Code and Salesperson ID stay out for now

### Data Volume
- **D-04:** Service returns 30+ mock orders (matching scale of daily delivery files)
- **D-05:** Orders distributed across all three mill lines (Premix, Excel, CGM)

### Mill Line Mapping
- **D-06:** Arbitrary mill assignment for demo purposes — no need to match real-world CGM/EFI processing rules
- **D-07:** Distribution roughly even across Premix, Excel, CGM columns

### State Distribution
- **D-08:** Production-weighted distribution:
  - Completed: 40-50%
  - Pending: 25-30%
  - Mixing: 15-20%
  - Blocked: 5-10%

### Claude's Discretion
- Realistic customer names drawn from example data (Westbridge Farm, Starbird @ Jaedel, etc.)
- Realistic product names drawn from example data (BROILER BRD 16% OS, SEVERINSKI DAIRY MASH, etc.)
- Delivery times spread throughout business hours (6:00 AM - 3:00 PM)
- Weight values in realistic ranges (3,000 - 18,000 lbs)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Example Data
- `example-data/Book1.xlsx` — Source data structure (binary, use daily delivery .md for readable format)
- `example-data/Daily Delivery April.22.nd.md` — Readable example showing columns: Customer Name, Line Code, Item Description, Ordered Quantity, Farm Location Code, Salesperson ID, Texture Type, Document Number

### Existing Services
- `src/services/millProduction.ts` — Current mock service to update (12 orders → 30+)
- `src/types/millProduction.ts` — TypeScript types to extend with textureType, lineCode

### Prior Phase Context
- `.planning/phases/06-design/06-CONTEXT.md` — D-05/D-06 define status colors (Completed=success, Blocked=error, Mixing=warning, Pending=gray)

### Requirements
- `.planning/REQUIREMENTS.md` — DATA-01, DATA-02 requirements for this phase

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/services/millProduction.ts` — Base service structure with getProductionOrders() and getOrdersByMillLine()
- `src/services/orders.ts` — Pattern reference for async mock service with delay simulation
- Existing ProductionOrder type with id, orderNumber, customer, product, weightLbs, deliveryTime, state, millLine

### Established Patterns
- Services use async interface with simulated delay (200ms + random jitter)
- Mock data defined as const array at module level
- Export async functions that filter/return the mock data
- Types defined in separate `@/types/` module

### Integration Points
- `src/app/mill-production/page.tsx` — Consumes getProductionOrders()
- Filter pills (Phase 8) will consume state counts from this data
- ProductionState type: "Completed" | "Mixing" | "Blocked" | "Pending"

</code_context>

<specifics>
## Specific Ideas

- Pull realistic customer names from Daily Delivery .md files (Westbridge Farm, Rockwall @ Peardonville, Cedarcroft Poultry, Severinski Farm, etc.)
- Pull realistic product names (BROILER BRD 16% OS, BROILER GROWER I MD, DAIRY MASH, FINISHER FEB 2026 WHEY, etc.)
- Texture types from real data: MASH, PELLET, C. CRUMBLE, SH PELLET, FINE CR
- Line codes are numeric (33161, 22563, 66218, etc.)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 7-Data Infrastructure*
*Context gathered: 2026-04-28*
