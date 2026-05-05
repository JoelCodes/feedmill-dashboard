# Roadmap: CGM Dashboard

## Milestones

- ✅ **v1.0 MVP** — Phases 0-5 ([archived](./milestones/v1.0-ROADMAP.md)) — shipped 2026-04-29
- ✅ **v1.1 Mill Production Dashboard** — Phases 6-9 ([archived](./milestones/v1.1-ROADMAP.md)) — shipped 2026-04-29
- 🚧 **v1.2 Customers Page** — Phases 10-15 — in progress

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 0-5) — SHIPPED 2026-04-29</summary>

### Phase 0: Infrastructure
**Goal**: Foundation for orders table with type-safe data
**Plans**: 2 plans

Plans:
- [x] 00-01: Define TypeScript types and create mock orders service
- [x] 00-02: Create StatusBadge component and loading skeletons

### Phase 1: Orders Table
**Goal**: Interactive table with filtering and search
**Plans**: 3 plans

Plans:
- [x] 01-01: Display order lines with all required columns
- [x] 01-02: Implement status filtering with clickable pills
- [x] 01-03: Add search functionality and row selection

### Phase 2: Order Details
**Goal**: Complete order details panel with timeline
**Plans**: 2 plans

Plans:
- [x] 02-01: Implement order details panel with dynamic data
- [x] 02-02: Add timeline visualization and change history

### Phase 3: KPI Cards (DEFERRED)
**Goal**: Dashboard KPIs with click-to-filter
**Status**: Deferred to v1.2+

### Phase 4: Navigation
**Goal**: Functional navigation with auto-detecting active state
**Plans**: 1 plan

Plans:
- [x] 04-01: Implement sidebar with auto-detecting active state

### Phase 5: Header & Settings
**Goal**: Complete header system with notifications and settings
**Plans**: 4 plans

Plans:
- [x] 05-01: Implement notification system with localStorage state
- [x] 05-02: Wire header search to OrdersTable
- [x] 05-03: Create settings page with preferences
- [x] 05-04: Integrate header search with table filtering

</details>

<details>
<summary>✅ v1.1 Mill Production Dashboard (Phases 6-9) — SHIPPED 2026-04-29</summary>

### Phase 6: Design
**Goal**: Status filter pills designed and approved in mill-production.pen
**Plans**: 1 plan

Plans:
- [x] 06-01: Design filter pills with interaction states in mill-production.pen

### Phase 7: Data Infrastructure
**Goal**: Production orders mock service derived from Book1.xlsx example data
**Plans**: 1 plan

Plans:
- [x] 07-01: Expand mock service to 33 orders with textureType and lineCode fields

### Phase 8: Filter Implementation
**Goal**: Interactive status filter pills with toggle behavior
**Plans**: 2 plans

Plans:
- [x] 08-01: Extract shared FilterPill component with TDD
- [x] 08-02: Integrate filter pills into mill-production page

### Phase 9: Polish
**Goal**: Mill production view matches .pen design pixel-perfect
**Plans**: 1 plan

Plans:
- [x] 09-01: Add design tokens and replace hardcoded values with token-based styling

</details>

<details open>
<summary>🚧 v1.2 Customers Page (Phases 10-15) — IN PROGRESS</summary>

- [x] **Phase 10: Design** - Create Pencil.dev design files for customers page components (COMPLETED 2026-05-02)
- [ ] **Phase 11: Foundation (Data Layer)** - Type definitions and mock services for customers and bins
- [ ] **Phase 12: Customer List Page** - Searchable customer table with status indicators
- [ ] **Phase 13: Customer Detail Infrastructure** - Customer detail page with header and summary stats
- [ ] **Phase 14: Activity Timeline** - Unified chronological timeline across orders, deliveries, and bin alerts
- [ ] **Phase 15: Bin Visualization** - Bin fill level bars with threshold-based color coding

### Phase 10: Design ✅ COMPLETED
**Goal:** Customers page UI designed and approved in Pencil.dev
**Depends on:** Nothing (first phase of v1.2)
**Requirements:** DSGN-01 ✓, DSGN-02 ✓, DSGN-03 ✓
**Success Criteria** (what must be TRUE):
  1. ✅ customers.pen file created with customer list view design
  2. ✅ customer-detail.pen file created with detail page layout (header, timeline, bins)
  3. ✅ Bin visualization component designed with fill bars and alert states
  4. ✅ Design reviewed and approved before implementation begins
**Plans:** 1 plan (completed)

Plans:
- [x] 10-01-PLAN.md — Create customers.pen and customer-detail.pen design files (2 tasks, 302s)

### Phase 11: Foundation (Data Layer)
**Goal:** Data contracts and services exist for customers and bins
**Depends on:** Phase 10 (design approved)
**Requirements:** DATA-01, DATA-02, DATA-03, DATA-04
**Success Criteria** (what must be TRUE):
  1. Customer and bin TypeScript types are defined with complete interfaces
  2. Mock customer service returns customer list with aggregated order statistics
  3. Mock bin service returns bins with fill percentages and alert status
  4. Existing Order interface includes customerId field for customer-order relationship
  5. Shared mock data singleton prevents stale data inconsistency across pages
**Plans:** 3 plans

Plans:
- [x] 11-01-PLAN.md — Define types and create shared mockData.ts module (3 tasks, 221s)
- [ ] 11-02-PLAN.md — Customer service with stats aggregation (TDD)
- [ ] 11-03-PLAN.md — Bin service with customer filtering (TDD)

### Phase 12: Customer List Page
**Goal:** Users can search and view customers with status indicators
**Depends on:** Phase 11 (requires customer service and types)
**Requirements:** CUST-01, CUST-02, CUST-03, CUST-04
**Success Criteria** (what must be TRUE):
  1. User can type in search box and see customer list filter by name in real-time
  2. Customer row displays order count badge showing number of active orders
  3. Customer row displays changes flag indicator when customer has orders with changes
  4. Customer row displays bin alert indicator (yellow for low, red for critical)
  5. Customer list sorts by most recent activity by default
  6. Implementation matches customers.pen design file
**Plans:** TBD
**UI hint:** yes

### Phase 13: Customer Detail Infrastructure
**Goal:** Customer detail page displays header and summary information
**Depends on:** Phase 12 (requires customer routing established)
**Requirements:** CDET-01, CDET-02, CDET-03
**Success Criteria** (what must be TRUE):
  1. User can click customer row and navigate to detail page at /customers/[id]
  2. Customer detail page shows header with customer name and location
  3. Customer detail page shows summary stats (total orders, active bins, recent activity count)
  4. User can click order in history and navigate to orders page with that order selected
  5. Implementation matches customer-detail.pen design file
**Plans:** TBD
**UI hint:** yes

### Phase 14: Activity Timeline
**Goal:** Users can see unified chronological activity across orders, deliveries, and bin alerts
**Depends on:** Phase 13 (requires detail page infrastructure)
**Requirements:** TMLN-01, TMLN-02, TMLN-03
**Success Criteria** (what must be TRUE):
  1. Timeline displays events from orders, deliveries, and bin alerts merged chronologically
  2. User can click collapsed timeline event to expand and see full details
  3. User can click expanded timeline event to collapse back to summary view
  4. Expanded order event shows inline summary with link to full order details
  5. Timeline handles 100+ events without performance degradation or memory leaks
  6. Implementation matches customer-detail.pen timeline section design
**Plans:** TBD
**UI hint:** yes

### Phase 15: Bin Visualization
**Goal:** Users can see bin fill levels with visual thresholds
**Depends on:** Phase 13 (requires detail page layout)
**Requirements:** BIN-01, BIN-02, BIN-03
**Success Criteria** (what must be TRUE):
  1. Each bin displays horizontal fill level bar showing percentage filled
  2. Bin bar color changes based on threshold (green normal, yellow low, red critical)
  3. Customer detail page displays all customer bins in card layout
  4. Bin card shows metadata (location code, capacity, current level, feed type)
  5. Implementation matches customer-detail.pen bin visualization design
**Plans:** TBD
**UI hint:** yes

</details>

## Progress

| Milestone | Phases | Plans | Status | Shipped |
|-----------|--------|-------|--------|---------|
| v1.0 MVP | 0-5 | 12 | Complete | 2026-04-29 |
| v1.1 Mill Production Dashboard | 6-9 | 5 | Complete | 2026-04-29 |
| v1.2 Customers Page | 10-15 | 4/? (Phase 10: 1/1 ✓, Phase 11: 1/3) | In progress | - |

---
*Roadmap created: 2026-03-11*
*v1.0 shipped: 2026-04-29*
*v1.1 shipped: 2026-04-29*
*v1.2 started: 2026-05-01*
