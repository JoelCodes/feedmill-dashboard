# Phase 12: Customer List Page - Context

**Gathered:** 2026-05-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement a searchable customer table page at `/customers` with status indicators showing order count, changes flag, and bin alert level. Clicking a customer row navigates to `/customers/[id]` (detail page implemented in Phase 13).

</domain>

<decisions>
## Implementation Decisions

### Row Click Behavior
- **D-01:** Clicking a customer row navigates to `/customers/[id]` (full page navigation)
- **D-02:** No split-view panel like OrdersTable — detail page is separate route (Phase 13)

### Default Sort Order
- **D-03:** Customers sorted by most recent order delivery date (descending)
- **D-04:** Customers with no orders appear at the end of the list

### Empty State
- **D-05:** "No customers found" empty state appears in both scenarios: no search results AND empty customer list
- **D-06:** Empty state uses the copy from UI-SPEC.md ("No customers found" / "Try adjusting your search...")

### Loading State
- **D-07:** Skeleton rows during data fetch (matches OrdersTable pattern)
- **D-08:** Show 5 skeleton rows as placeholder (consistent with expected data size)

### Prior Phase Decisions (carried forward)
- **D-09:** Table rows layout (from Phase 10 D-01)
- **D-10:** Minimal columns: Name + Status only (from Phase 10 D-02)
- **D-11:** Combined status indicator uses stacked icons — orders badge + changes dot + bin alert icon (from Phase 10 D-03)
- **D-12:** Search box only at top, no status filter pills (from Phase 10 D-04)
- **D-13:** Match Header search styling (from Phase 10 D-16)

### Claude's Discretion
None — all areas had explicit decisions.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — CUST-01, CUST-02, CUST-03, CUST-04 define success criteria
- `.planning/ROADMAP.md` Phase 12 section — success criteria for customer list page

### UI Design Contract
- `.planning/phases/12-customer-list-page/12-UI-SPEC.md` — Visual and interaction contract (spacing, typography, colors, components)

### Design Files
- `public/designs/customers.pen` — Customer list view design

### Prior Phase Decisions
- `.planning/phases/10-design/10-CONTEXT.md` — UI layout decisions (D-01 through D-16)
- `.planning/phases/11-foundation-data-layer/11-CONTEXT.md` — Data model and service decisions

### Existing Patterns
- `src/components/OrdersTable.tsx` — Table pattern to follow (search, keyboard navigation, row selection)
- `src/services/customers.ts` — Customer service with `getCustomers()` returning `CustomerWithStats[]`
- `src/types/customer.ts` — `Customer`, `CustomerStats`, `CustomerWithStats` interfaces
- `src/types/bin.ts` — `BinAlertLevel` type for alert indicator logic

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **OrdersTable search pattern**: Real-time filtering with debounce via `useDebounce` hook
- **Skeleton loader**: Create CustomerTableSkeleton matching OrdersTable skeleton pattern
- **StatusBadge component**: Pattern for status indicators (but customer uses icons, not badges)
- **Design tokens**: `--primary`, `--error`, `--warning` for status indicator colors
- **lucide-react icons**: `Package`, `AlertTriangle`, `Search` for status indicators

### Established Patterns
- **Async data fetching**: `useEffect` + `getCustomers()` with loading state
- **Search filtering**: Case-insensitive includes() on customer name
- **Keyboard navigation**: Arrow keys to move selection (optional for Phase 12)
- **Empty state**: Centered icon + message + action button
- **Row hover**: `hover:bg-gray-50` with `cursor-pointer`

### Integration Points
- **Route**: New page at `src/app/customers/page.tsx`
- **Navigation**: Link in Sidebar.tsx (already has Users nav item pointing to `/customers`)
- **Customer service**: Import `getCustomers` from `@/services/customers`
- **Router navigation**: `useRouter().push('/customers/[id]')` on row click

</code_context>

<specifics>
## Specific Ideas

- Status indicators follow left-to-right priority: Package icon (active orders) → Red dot (changes) → Alert triangle (bin alerts)
- Package icon uses `--primary` (#4fd1c5) color
- Alert triangle uses `--warning` (#f59e0b) for low, `--error` (#e53e3e) for critical
- Sorting by most recent order requires computing max delivery date from customer's orders

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 12-customer-list-page*
*Context gathered: 2026-05-04*
