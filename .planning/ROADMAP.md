# Roadmap: CGM Dashboard

## Milestones

- v1.0 MVP — Phases 0-5 ([archived](./milestones/v1.0-ROADMAP.md)) — shipped 2026-04-29
- v1.1 Mill Production Dashboard — Phases 6-9 ([archived](./milestones/v1.1-ROADMAP.md)) — shipped 2026-04-29
- v1.2 Customers Page — Phases 10-15 ([archived](./milestones/v1.2-ROADMAP.md)) — shipped 2026-05-06
- **v1.3 Design Hardening** — Phases 16-19 (see details below) — in progress

## v1.3 Design Hardening (Phases 16-19)

**Goal:** Establish a unified design system with tokens, components, and theming — then migrate existing pages to use it.

**Started:** 2026-05-07
**Status:** In progress

### Phases

- [x] **Phase 16: Foundation & Design System Setup** - Establish token system, theming infrastructure, and design file organization
- [x] **Phase 17: Component Library** - Build reusable primitives (Button, Input, Card, Badge, Theme Toggle)
- [ ] **Phase 18: Page Migration** - Migrate all pages to design system and eliminate hardcoded values
- [ ] **Phase 19: Documentation & Accessibility** - Document usage patterns and verify WCAG compliance

## Phase Details

### Phase 16: Foundation & Design System Setup
**Goal**: Design token system and theme infrastructure ready for component development
**Depends on**: Nothing (first phase of v1.3)
**Requirements**: FOUND-01, FOUND-02, FOUND-03, FOUND-04, DES-01, DES-02, DES-03
**Success Criteria** (what must be TRUE):
  1. Semantic token system defines all colors, typography, spacing, and shadows using two-tier naming
  2. Light and dark themes switch without flash, with theme preference persisted across sessions
  3. CVA and utility functions (cn) available for all component development
  4. ESLint blocks any new hardcoded color or spacing values in code
  5. Component library .pen file exists as single source of truth for design tokens
**Plans**: 5 plans

Plans:
**Wave 1** (parallel)
- [x] 16-01-PLAN.md — Expand token system with interactive states and spacing scale (FOUND-01)
- [x] 16-02-PLAN.md — Install CVA + tailwind-merge + clsx and create cn() utility (FOUND-03)
- [x] 16-03-PLAN.md — Integrate next-themes for dark mode with flash prevention (FOUND-02)

**Wave 2** (depends on Wave 1)
- [x] 16-04-PLAN.md — Create ESLint rule blocking hardcoded hex/px values (FOUND-04)
- [x] 16-05-PLAN.md — Create component-library.pen and token documentation (DES-01, DES-02, DES-03)

### Phase 17: Component Library
**Goal**: Reusable component primitives available for page migration
**Depends on**: Phase 16
**Requirements**: COMP-01, COMP-02, COMP-03, COMP-04, COMP-05
**Success Criteria** (what must be TRUE):
  1. Button component supports all variants (primary/secondary/ghost/destructive) and sizes (sm/md/lg)
  2. Form inputs (text, number, select, textarea) show validation states and have proper ARIA attributes
  3. Card/Panel component uses compound pattern (Card.Header, Card.Content, Card.Footer) for flexibility
  4. Theme toggle allows users to switch between light and dark modes from any page
  5. StatusBadge component refactored to use design system primitives while maintaining existing API
**Plans**: 5 plans
**UI hint**: yes

Plans:
**Wave 1** (parallel)
- [x] 17-01-PLAN.md — Button component with CVA variants (COMP-01)
- [x] 17-02-PLAN.md — ThemeToggle component with useTheme() hook (COMP-04)

**Wave 2** (depends on Wave 1)
- [x] 17-03-PLAN.md — Input/Select/Textarea components with validation states (COMP-02)
- [x] 17-04-PLAN.md — Card compound component with dot notation pattern (COMP-03)

**Wave 3** (depends on Wave 2)
- [x] 17-05-PLAN.md — StatusBadge refactor to use design tokens (COMP-05)

### Phase 18: Page Migration
**Goal**: All existing pages migrated to design system with zero hardcoded values
**Depends on**: Phase 17
**Requirements**: MIG-01, MIG-02, MIG-03, MIG-04, MIG-05
**Success Criteria** (what must be TRUE):
  1. Orders page (table, filter pills, status badges, cards) uses only design system tokens and components
  2. Customers page (list, detail header, timeline, bin gauges) uses only design system tokens and components
  3. Mill Production page (production cards, filter pills, columns) uses only design system tokens and components
  4. Settings page integrated with theme toggle and uses design system components
  5. ESLint reports zero violations for hardcoded colors or spacing across all migrated pages
**Plans**: 7 plans
**UI hint**: yes

Plans:
**Wave 1** (parallel)
- [x] 18-01-PLAN.md — Migrate Settings page to design system components (MIG-04)
- [x] 18-02-PLAN.md — Extract FilterPill to ui/ with token-based styling (MIG-01, MIG-03)

**Wave 2** (depends on Wave 1)
- [ ] 18-03-PLAN.md — Migrate Mill Production page and update KPICard, Sidebar, Header (MIG-03)
- [ ] 18-04-PLAN.md — Extract BinGauge and ActivityTimeline to ui/ as Gauge and Timeline (MIG-02)

**Wave 3** (depends on Wave 2)
- [ ] 18-05-PLAN.md — Migrate Orders page (OrdersTable, OrderDetails) (MIG-01)

**Wave 4** (depends on Wave 3)
- [ ] 18-06-PLAN.md — Migrate Customers page (list, detail, bin gauges, timeline) (MIG-02)

**Wave 5** (depends on all)
- [ ] 18-07-PLAN.md — Final ESLint validation and dark mode verification (MIG-05)

### Phase 19: Documentation & Accessibility
**Goal**: Design system documented and accessible to all users
**Depends on**: Phase 18
**Requirements**: DOC-01, DOC-02, DOC-03
**Success Criteria** (what must be TRUE):
  1. Token usage documentation clearly explains when to use each semantic token
  2. Component guidelines provide usage examples with do/don't patterns for all components
  3. All components pass WCAG 2.1 AA automated testing and manual screen reader verification
**Plans**: TBD

## Progress

| Milestone | Phases | Plans | Status | Shipped |
|-----------|--------|-------|--------|---------|
| v1.0 MVP | 0-5 | 12 | Complete | 2026-04-29 |
| v1.1 Mill Production Dashboard | 6-9 | 5 | Complete | 2026-04-29 |
| v1.2 Customers Page | 10-15 | 15 | Complete | 2026-05-06 |
| v1.3 Design Hardening | 16-19 | 17 | In progress | - |

---

<details>
<summary>v1.0 MVP (Phases 0-5) — SHIPPED 2026-04-29</summary>

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
<summary>v1.1 Mill Production Dashboard (Phases 6-9) — SHIPPED 2026-04-29</summary>

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

<details>
<summary>v1.2 Customers Page (Phases 10-15) — SHIPPED 2026-05-06</summary>

- [x] **Phase 10: Design** - Create Pencil.dev design files for customers page components (COMPLETED 2026-05-02)
- [x] **Phase 11: Foundation (Data Layer)** - Type definitions and mock services for customers and bins (COMPLETED 2026-05-05)
- [x] **Phase 12: Customer List Page** - Searchable customer table with status indicators (COMPLETED 2026-05-05)
- [x] **Phase 13: Customer Detail Infrastructure** - Customer detail page with header and summary stats (COMPLETED 2026-05-05)
- [x] **Phase 14: Activity Timeline** - Unified chronological timeline across orders, deliveries, and bin alerts (COMPLETED 2026-05-05)
- [x] **Phase 15: Bin Visualization** - Bin fill level bars with threshold-based color coding (COMPLETED 2026-05-05)

### Phase 10: Design COMPLETED
**Goal:** Customers page UI designed and approved in Pencil.dev
**Depends on:** Nothing (first phase of v1.2)
**Requirements:** DSGN-01, DSGN-02, DSGN-03
**Success Criteria** (what must be TRUE):
  1. customers.pen file created with customer list view design
  2. customer-detail.pen file created with detail page layout (header, timeline, bins)
  3. Bin visualization component designed with fill bars and alert states
  4. Design reviewed and approved before implementation begins
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
- [x] 11-02-PLAN.md — Customer service with stats aggregation (TDD)
- [x] 11-03-PLAN.md — Bin service with customer filtering (TDD)

### Phase 12: Customer List Page COMPLETED
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
**Plans:** 3 plans (completed)

Plans:
**Wave 1**
- [x] 12-01-PLAN.md — Sort customers by recent activity (TDD)
- [x] 12-03-PLAN.md — Gap closure: Add numeric order count badge

**Wave 2**
- [x] 12-02-PLAN.md — Customer list page with search and status indicators

### Phase 13: Customer Detail Infrastructure COMPLETED
**Goal:** Customer detail page displays header and summary information
**Depends on:** Phase 12 (requires customer routing established)
**Requirements:** CDET-01, CDET-02, CDET-03
**Success Criteria** (what must be TRUE):
  1. User can click customer row and navigate to detail page at /customers/[id]
  2. Customer detail page shows header with customer name and location
  3. Customer detail page shows summary stats (total orders, active bins, recent activity count)
  4. User can click order in history and navigate to orders page with that order selected
  5. Implementation matches customer-detail.pen design file
**Plans:** 3 plans (completed)

Plans:
**Wave 1**
- [x] 13-01-PLAN.md — Extend Customer/CustomerStats types with deliveryPreferences and activeBins fields
- [x] 13-02-PLAN.md — CustomerDetailHeader component (TDD) (2 tasks, 103s)

**Wave 2**
- [x] 13-03-PLAN.md — Customer detail page route with Server Component data fetching

### Phase 14: Activity Timeline COMPLETED
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
**Plans:** 3 plans (completed)

Plans:
**Wave 1**
- [x] 14-01-PLAN.md — ActivityEvent type and activity service (TDD)
- [x] 14-02-PLAN.md — ActivityTimeline component with expand/collapse (TDD) (1 task, 206s)

**Wave 2**
- [x] 14-03-PLAN.md — Integrate ActivityTimeline into customer detail page

### Phase 15: Bin Visualization COMPLETED
**Goal:** Users can see bin fill levels with visual thresholds
**Depends on:** Phase 13 (requires detail page layout)
**Requirements:** BIN-01, BIN-02, BIN-03
**Success Criteria** (what must be TRUE):
  1. Each bin displays vertical fill level bar showing percentage filled
  2. Bin bar color changes based on threshold (green normal, yellow low, red critical)
  3. Customer detail page displays all customer bins in horizontal row layout
  4. Bin gauge shows metadata (location code, feed type) below gauge
  5. Implementation matches customer-detail.pen bin visualization design
**Plans:** 2 plans (completed)

Plans:
**Wave 1**
- [x] 15-01-PLAN.md — BinGauge component with TDD (threshold-based coloring) (1 task, 180s)

**Wave 2**
- [x] 15-02-PLAN.md — BinGaugeRow component and customer detail integration (2 tasks, 131s)

</details>

---
*Roadmap created: 2026-03-11*
*v1.0 shipped: 2026-04-29*
*v1.1 shipped: 2026-04-29*
*v1.2 shipped: 2026-05-06*
*v1.3 started: 2026-05-07*
