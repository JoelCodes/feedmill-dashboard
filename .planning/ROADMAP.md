# Roadmap: CGM Dashboard

## Milestones

- ✅ **v1.0 MVP** — Phases 0-5 ([archived](./milestones/v1.0-ROADMAP.md)) — shipped 2026-04-29
- ✅ **v1.1 Mill Production Dashboard** — Phases 6-9 ([archived](./milestones/v1.1-ROADMAP.md)) — shipped 2026-04-29

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

## Progress

| Milestone | Phases | Plans | Status | Shipped |
|-----------|--------|-------|--------|---------|
| v1.0 MVP | 0-5 | 12 | Complete | 2026-04-29 |
| v1.1 Mill Production Dashboard | 6-9 | 5 | Complete | 2026-04-29 |

---
*Roadmap created: 2026-03-11*
*v1.0 shipped: 2026-04-29*
*v1.1 shipped: 2026-04-29*
