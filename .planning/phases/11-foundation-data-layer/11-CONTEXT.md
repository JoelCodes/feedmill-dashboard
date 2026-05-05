# Phase 11: Foundation (Data Layer) - Context

**Gathered:** 2026-05-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Define TypeScript types and create mock services for customers and bins. Add `customerId` field to existing Order type to establish customer-order relationships. Services follow the existing async pattern in `src/services/`.

</domain>

<decisions>
## Implementation Decisions

### Customer-Order Linkage
- **D-01:** Add `customerId` field to existing Order type (not derive from name)
- **D-02:** Multiple orders from same customer share the same customerId (consolidate customers by name)
- **D-03:** Customer names in existing orders become the source for customer IDs — match by exact name string

### Mock Data Generation
- **D-04:** Derive customer records from existing 18 orders (extract unique customer names, generate customer records with aggregated stats)
- **D-05:** Bin data defined separately from orders (independent realistic dataset per customer, not parsed from order locations)

### Service Architecture
- **D-06:** Separate services: `customers.ts` and `bins.ts` (matches existing `orders.ts` pattern)
- **D-07:** Each service follows existing async pattern with simulated delay

### Data Consistency
- **D-08:** Shared data module (`mockData.ts`) exports orders/customers/bins arrays
- **D-09:** Services import from shared module — single source of truth for IDs and relationships
- **D-10:** Order type modification requires updating mockOrders array to include customerId values

### Claude's Discretion
None — all areas had explicit decisions.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — DATA-01, DATA-02, DATA-03, DATA-04 define what types and services are needed
- `.planning/ROADMAP.md` Phase 11 section — success criteria for data layer

### Existing Types and Services
- `src/types/order.ts` — Existing Order interface to extend with customerId
- `src/services/orders.ts` — Service pattern to follow (async functions, delay simulation)
- `src/services/millProduction.ts` — Another service example

### Design Decisions from Phase 10
- `.planning/phases/10-design/10-CONTEXT.md` — UI decisions that inform data shape (D-01 through D-16)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Order type pattern**: `src/types/order.ts` — TypeScript interface with status union type
- **Service pattern**: `src/services/orders.ts` — async functions with `delay()` helper, Promise return types
- **Mock data arrays**: Existing 18 orders in orders.ts provide customer names to extract

### Established Patterns
- **Types in src/types/**: Type definitions live in dedicated type files
- **Services in src/services/**: Async mock services with simulated network delay (200-300ms)
- **Array filtering**: Services use `.filter()`, `.find()` for queries
- **Status union types**: `OrderStatus` pattern for constrained string values

### Integration Points
- **Order type**: Adding customerId requires updating both type definition and all mock order records
- **Customer list page**: Will call `getCustomers()` from new customer service
- **Customer detail page**: Will call `getCustomerById()` and `getBinsByCustomerId()`
- **Order aggregation**: Customer stats (order count, active orders) computed from shared orders array

</code_context>

<specifics>
## Specific Ideas

- Customers extracted from existing 18 orders (unique names become customer records)
- Bin data is realistic but independent of order locations (simulates BinSentry-style data)
- Shared mockData.ts ensures customer IDs match across orders/customers/bins

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 11-foundation-data-layer*
*Context gathered: 2026-05-04*
