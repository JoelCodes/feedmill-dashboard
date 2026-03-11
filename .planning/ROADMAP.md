# Roadmap: CGM Dashboard

## Overview

Transform the existing feed mill operations dashboard from a static visual prototype into a fully interactive application. Starting with foundational infrastructure (types, services, shared components), each phase brings one part of the dashboard to life following the Design -> Infrastructure -> Build pattern. The journey progresses from table interactivity through order details, KPIs, navigation, and finally header features.

## Phases

**Phase Numbering:**
- Integer phases (0, 1, 2, ...): Planned milestone work
- Decimal phases (1.1, 1.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 0: Infrastructure** - Service layer, types, and shared components
- [x] **Phase 1: Orders Table** - Filtering, searching, selection interactivity (completed 2026-03-11)
- [ ] **Phase 2: Order Details** - Panel display with timeline and change history
- [ ] **Phase 3: KPI Cards** - Dynamic values and drill-down filtering
- [ ] **Phase 4: Navigation** - Functional sidebar routing between views
- [ ] **Phase 5: Header** - Global search, notifications, and settings

## Phase Details

### Phase 0: Infrastructure
**Goal**: Establish data layer foundation and shared components that enable all subsequent interactive features
**Depends on**: Nothing (first phase)
**Requirements**: INFRA-01, INFRA-02, INFRA-03, INFRA-04
**Success Criteria** (what must be TRUE):
  1. TypeScript types exist for Order data structure with all fields from data spec
  2. Mock orders service returns data through async interface (same interface future API will use)
  3. StatusBadge component is extracted and reusable across table and details
  4. Loading skeleton components render appropriately during data fetching states
**Plans**: 2 plans

Plans:
- [x] 00-01-PLAN.md — Types and mock orders service (INFRA-01, INFRA-02) — 2m, 2 tasks, 3 files
- [x] 00-02-PLAN.md — StatusBadge extraction and skeleton components (INFRA-03, INFRA-04) — 2m, 3 tasks, 4 files

### Phase 1: Orders Table
**Goal**: Users can filter, search, and select orders in the orders table
**Depends on**: Phase 0
**Requirements**: TABLE-01, TABLE-02, TABLE-03, TABLE-04, TABLE-05, TABLE-06, TABLE-07, TABLE-08, TABLE-09
**Success Criteria** (what must be TRUE):
  1. User sees order lines with all columns: Document #, Customer, Product (Texture + Formula), Quantity, Location, Delivery Date, Status
  2. User can click status pills to filter table to specific statuses
  3. User can toggle "has changes" filter to see only orders with changes (red dot indicator)
  4. User can type in search bar and table filters by customer name or product
  5. User can click a row and it highlights as selected
  6. User sees appropriate empty state when no orders match current filters
**Plans**: 3 plans

Plans:
- [x] 01-01-PLAN.md — Wire data service and update columns (TABLE-01, TABLE-02, TABLE-03, TABLE-04) — 2m, 2 tasks, 2 files
- [ ] 01-02-PLAN.md — Multi-select status filtering and has changes toggle (TABLE-05, TABLE-06)
- [ ] 01-03-PLAN.md — Search, row selection, keyboard navigation, empty state (TABLE-07, TABLE-08, TABLE-09)

### Phase 2: Order Details
**Goal**: Users can view detailed order information, timeline, and change history in a panel
**Depends on**: Phase 1
**Requirements**: DETAIL-01, DETAIL-02, DETAIL-03, DETAIL-04, DETAIL-05
**Success Criteria** (what must be TRUE):
  1. User clicks a table row and the order details panel opens showing that order
  2. User sees full order information in the details panel
  3. User sees timeline visualization of order lifecycle events
  4. User sees change history for the order (if any changes exist)
  5. User can close the panel via back button or close control and return to table-only view
**Plans**: TBD

Plans:
- [ ] 02-01: Panel open/close wiring (row click, close controls)
- [ ] 02-02: Details content (full order info, timeline, change history)

### Phase 3: KPI Cards
**Goal**: KPI cards display computed values and enable drill-down to filtered table views
**Depends on**: Phase 1
**Requirements**: KPI-01, KPI-02
**Success Criteria** (what must be TRUE):
  1. KPI card values are computed from actual order data (not hardcoded)
  2. User clicks a KPI card and the orders table filters to show relevant orders
**Plans**: TBD

Plans:
- [ ] 03-01: KPI computation and card click filtering

### Phase 4: Navigation
**Goal**: Users can navigate between different views using the sidebar
**Depends on**: Phase 1
**Requirements**: NAV-01, NAV-02
**Success Criteria** (what must be TRUE):
  1. User clicks sidebar links and navigates to different views/pages
  2. Current view is visually indicated in sidebar (active state)
**Plans**: TBD

Plans:
- [ ] 04-01: Sidebar routing and active state

### Phase 5: Header
**Goal**: Header features (global search, notifications, settings) are functional
**Depends on**: Phase 4
**Requirements**: HEADER-01, HEADER-02, HEADER-03
**Success Criteria** (what must be TRUE):
  1. User can search across all orders using header search box
  2. User sees notifications area with indicator
  3. User can click settings link and navigate to settings page
**Plans**: TBD

Plans:
- [ ] 05-01: Header functionality (search, notifications, settings)

## Progress

**Execution Order:**
Phases execute in numeric order: 0 -> 1 -> 2 -> 3 -> 4 -> 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 0. Infrastructure | 2/2 | Complete | - |
| 1. Orders Table | 3/3 | Complete   | 2026-03-11 |
| 2. Order Details | 0/2 | Not started | - |
| 3. KPI Cards | 0/1 | Not started | - |
| 4. Navigation | 0/1 | Not started | - |
| 5. Header | 0/1 | Not started | - |

---
*Roadmap created: 2026-03-11*
*Total phases: 6*
*Total requirements: 25*
*Coverage: 25/25 mapped*
