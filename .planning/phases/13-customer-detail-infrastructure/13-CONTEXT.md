# Phase 13: Customer Detail Infrastructure - Context

**Gathered:** 2026-05-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement the customer detail page at `/customers/[id]` with header infrastructure showing customer contact info and summary stats. The page uses Server Component data fetching with parallel requests for customer and stats. Timeline and bin visualization are deferred to Phase 14/15.

</domain>

<spec_lock>
## Requirements (locked via UI-SPEC.md)

**UI contract is locked.** See `13-UI-SPEC.md` for full visual and interaction contract.

Downstream agents MUST read `13-UI-SPEC.md` before planning or implementing. Component specs are not duplicated here.

**In scope (from UI-SPEC.md):**
- CustomerDetailHeader component with contact info and summary stats
- Route: `/customers/[id]` with dynamic params
- Navigation from customer list to detail page
- Navigation from order link to orders page with selected order
- Loading and error states for customer data fetching
- Empty states for missing customer data

**Out of scope (from UI-SPEC.md):**
- ActivityTimeline component (Phase 14)
- BinGaugeRow component (Phase 15)
- Tab navigation between sections (Phase 14/15)
- Timeline event expand/collapse (Phase 14)
- Bin visualization with fill levels (Phase 15)

</spec_lock>

<decisions>
## Implementation Decisions

### Data Fetching Strategy
- **D-01:** Server Component for page — async function fetches data before render
- **D-02:** Parallel fetch using `Promise.all([getCustomerById(id), getCustomerStats(id)])`
- **D-03:** No client-side loading states needed — Server Component handles wait

### Customer Not Found Handling
- **D-04:** Call `notFound()` from `next/navigation` when customer ID doesn't exist (standard 404)
- **D-05:** Partial failure (stats fail but customer succeeds) shows customer with fallback stat values (zeros or dashes)

### Page Content Scope
- **D-06:** Header only for Phase 13 — nothing below CustomerDetailHeader
- **D-07:** No placeholder tabs, no "coming soon" message — clean infrastructure phase

### Delivery Preferences
- **D-08:** Add `deliveryPreferences: string` field to Customer type
- **D-09:** Store as free-form string (e.g., "Mon/Wed/Fri, 6-8 AM") — no structured object

### Prior Phase Decisions (carried forward)
- **D-10:** Customer-order linkage via `customerId` field (from Phase 11 D-01)
- **D-11:** Shared `mockData.ts` singleton for data consistency (from Phase 11 D-08)
- **D-12:** Customer row click navigates to `/customers/[id]` (from Phase 12 D-01)

### Claude's Discretion
None — all areas had explicit decisions.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — CDET-01, CDET-02, CDET-03 define success criteria
- `.planning/ROADMAP.md` Phase 13 section — success criteria for customer detail infrastructure

### UI Design Contract
- `.planning/phases/13-customer-detail-infrastructure/13-UI-SPEC.md` — Locked requirements — MUST read before planning

### Design Files
- `public/designs/customer-detail.pen` — Customer detail view design (lines 217-475 for header)

### Prior Phase Decisions
- `.planning/phases/11-foundation-data-layer/11-CONTEXT.md` — Data model and service decisions
- `.planning/phases/12-customer-list-page/12-CONTEXT.md` — Customer list navigation decisions

### Existing Types and Services
- `src/types/customer.ts` — Customer, CustomerStats, CustomerWithStats interfaces (needs deliveryPreferences addition)
- `src/services/customers.ts` — `getCustomerById()`, `getCustomerStats()` functions
- `src/services/mockData.ts` — Shared mock data singleton

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Customer service**: `getCustomerById()` and `getCustomerStats()` already exist
- **Design tokens**: `--primary`, `--text-primary`, `--text-secondary` in globals.css
- **lucide-react icons**: MapPin, Phone, Mail for contact info row icons
- **CustomerWithStats type**: Combines customer + stats (may simplify fetch)

### Established Patterns
- **Server Component data fetching**: Next.js App Router async Server Component pattern
- **notFound() for 404**: Standard Next.js pattern for missing resources
- **Design token usage**: `bg-[var(--bg-card)]`, `text-[var(--text-primary)]` etc.
- **Component structure**: Props interface at top, default export function

### Integration Points
- **Route**: New dynamic route at `src/app/customers/[id]/page.tsx`
- **Customer type extension**: Add `deliveryPreferences` field to `src/types/customer.ts`
- **Mock data update**: Add `deliveryPreferences` values to customer records in `mockData.ts`
- **Link from list**: CustomerRow already navigates via `router.push('/customers/${id}')`

</code_context>

<specifics>
## Specific Ideas

- CustomerDetailHeader styling from customer-detail.pen lines 217-475 (exact padding, colors, typography)
- Contact info rows: MapPin + location, Phone + phone, Mail + email (all gray icons/text)
- Delivery preferences in accent color (#4fd1c5) below contact rows
- Summary stats horizontal row: Total Orders | Active Bins | Recent Activity

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 13-customer-detail-infrastructure*
*Context gathered: 2026-05-05*
