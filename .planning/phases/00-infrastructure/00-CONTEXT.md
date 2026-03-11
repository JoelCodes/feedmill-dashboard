# Phase 0: Infrastructure - Context

**Gathered:** 2026-03-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Establish data layer foundation and shared components that enable all subsequent interactive features. This includes TypeScript types for Order data, a mock orders service with async interface, extracting StatusBadge as a reusable component, and creating loading skeleton components.

</domain>

<decisions>
## Implementation Decisions

### Status Values
- Use 5 statuses from requirements: Pending, Producing, Ready, In Transit, Complete
- Replace current prototype statuses (shipped, loading, mixing, pending)
- Color assignment by progression:
  - Pending = neutral gray
  - Producing = warning yellow
  - Ready = info blue
  - In Transit = purple
  - Complete = success green
- Labels are flexible — abbreviations like "Transit" allowed if space is tight

### Mock Data Scope
- ~15-20 orders in the mock dataset
- Cover all edge cases:
  - At least one order per status
  - Some orders with changes flag (hasChanges: true)
  - Some with long customer/product names
- Use real feed mill terminology from example-data/Book1.xlsx:
  - Texture types: PELLET, MASH, SH PELLET, FINE CR, C. CRUMBLE
  - Formula types: NON MEDICATED, MED ALBAC Z, MED ALBAC A, etc.
  - Realistic customer/farm names
- Simulate async delay (200-500ms) to test loading states

### File Organization
- Types: `src/types/` directory
- Services: `src/services/` directory
- Shared components: `src/components/ui/` directory
- Status config (colors, labels): Co-located with StatusBadge component

### Claude's Discretion
- Exact async delay duration within 200-500ms range
- Specific mock order data content (within constraints above)
- Skeleton component design details
- TypeScript type naming conventions

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `OrdersTable.tsx`: Contains inline types (`Order`, `OrderStatus`) and `statusConfig` — extract to `src/types/`
- `StatusBadge` function in OrdersTable: Extract to `src/components/ui/StatusBadge.tsx`
- `FilterPill` function: Related to StatusBadge, may share status config
- CSS variables in `globals.css`: `--success`, `--info`, `--warning`, `--error` — use for status colors

### Established Patterns
- Component files are PascalCase: `StatusBadge.tsx`
- Default exports for components
- Props interfaces with `Props` suffix
- Tailwind classes with CSS variables: `bg-[var(--success-light)]`
- `Record<Status, Config>` pattern for status config mapping

### Integration Points
- OrdersTable will import extracted StatusBadge from `@/components/ui/StatusBadge`
- OrdersTable will import Order type from `@/types/order`
- OrdersTable will call orders service from `@/services/orders`
- Other components (KPICard, OrderDetails) will reuse StatusBadge

</code_context>

<specifics>
## Specific Ideas

- "Product = Texture Type + Formula Type" — already decided at project level
- "Each order line = separate row" — already decided at project level
- Service interface should match what a real API would use (same async signature)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 00-infrastructure*
*Context gathered: 2026-03-11*
