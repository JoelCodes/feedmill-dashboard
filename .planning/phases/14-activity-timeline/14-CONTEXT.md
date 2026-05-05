# Phase 14: Activity Timeline - Context

**Gathered:** 2026-05-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement a unified activity timeline on the customer detail page that shows orders, deliveries, and bin alerts merged chronologically. Events are expandable to show details, with order events linking to the full order view. The timeline uses a dedicated ActivityEvent type for explicit event records.

</domain>

<decisions>
## Implementation Decisions

### Event Data Model
- **D-01:** Create explicit `ActivityEvent` type — persisted event records with timestamp, type, and details (not derived on-the-fly)
- **D-02:** Event types support full scope: orders + deliveries + bin alerts (covers TMLN-01 requirement)
- **D-03:** One event per order lifecycle stage — order_placed, production_started, ready, out_for_delivery, delivered (shows full history)

### Expand/Collapse UX
- **D-04:** Click entire timeline row to toggle expand/collapse — large tap target, discoverable
- **D-05:** Multiple events can be expanded simultaneously — no accordion behavior, user can compare events

### Expanded Order Content
- **D-06:** Match design exactly — show Quantity, Product (texture type), Status, and "View Order Details" link

### Performance Strategy
- **D-07:** Simple list with scroll — render all events in scrollable container, no virtualization needed for 100 items

### Prior Phase Decisions (carried forward)
- **D-08:** Customer detail page infrastructure from Phase 13 — Server Component with `getCustomerById`
- **D-09:** Shared `mockData.ts` singleton for data consistency (from Phase 11 D-08)
- **D-10:** Customer-order linkage via `customerId` field (from Phase 11 D-01)

### Claude's Discretion
None — all areas had explicit decisions.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — TMLN-01, TMLN-02, TMLN-03 define success criteria
- `.planning/ROADMAP.md` Phase 14 section — success criteria for activity timeline

### Design Files
- `designs/customer-detail.pen` — Timeline section design (lines ~880-1900 for activity-timeline component)
- Design shows: expandable items with icon, title, description, date, expanded detail box, "View Order Details" link

### Prior Phase Decisions
- `.planning/phases/13-customer-detail-infrastructure/13-CONTEXT.md` — Customer detail page infrastructure
- `.planning/phases/11-foundation-data-layer/11-CONTEXT.md` — Data model and service patterns

### Existing Timeline Pattern
- `src/components/OrderDetails.tsx` — Reference implementation of timeline visualization (TimelineItem component, colorMap, date formatting)

### Existing Types
- `src/types/order.ts` — Order interface with status, dates, customerId
- `src/types/bin.ts` — Bin interface with alertLevel, lastUpdated
- `src/types/customer.ts` — Customer, CustomerStats interfaces

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **TimelineItem pattern**: OrderDetails.tsx has TimelineItem component with icon, connector line, color mapping — similar structure needed
- **Color mapping**: colorMap in OrderDetails.tsx for primary/success/error/pending event colors
- **formatTimelineDate**: Date formatting function with "Est." prefix for pending events
- **lucide-react icons**: FileText, Truck, AlertTriangle, Factory, CheckCircle available

### Established Patterns
- **Timeline visualization**: Left column (icon + vertical connector), right column (title, description, date, details)
- **Design tokens**: `--primary`, `--success`, `--error`, `--text-primary`, `--text-secondary` in globals.css
- **Server Component data fetching**: Async function fetches data before render (customer detail page pattern)

### Integration Points
- **Customer detail page**: Add timeline below CustomerDetailHeader at `src/app/customers/[id]/page.tsx`
- **Activity service**: New service function to get activity events for a customer
- **Mock data**: Add ActivityEvent records to mockData.ts for testing
- **Orders page link**: "View Order Details" navigates to `/orders?selected={orderId}` pattern

</code_context>

<specifics>
## Specific Ideas

- Timeline section matches customer-detail.pen design: white card with rounded corners, vertical event list
- Event icons: file-text (order placed), factory (production), truck (delivery), alert-triangle (bin alert)
- Expanded detail box: light gray background (#f8f9fa), rounded corners, shows order specifics
- "View Order Details" link in primary color with underline

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 14-activity-timeline*
*Context gathered: 2026-05-05*
