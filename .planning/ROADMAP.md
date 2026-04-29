# Roadmap: CGM Dashboard

## Milestones

- ✅ **v1.0 MVP** - Phases 0-5 (shipped 2026-04-29)
- 🚧 **v1.1 Mill Production Dashboard** - Phases 6-9 (in progress)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 0-5) - SHIPPED 2026-04-29</summary>

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
**Status**: Deferred to v1.1+

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

## 🚧 v1.1 Mill Production Dashboard (In Progress)

**Milestone Goal:** Transform mill production view into a polished, data-driven production dashboard with filtering capabilities.

- [ ] **Phase 6: Design** - Status filter pills designed and approved
- [ ] **Phase 7: Data Infrastructure** - Production orders mock service
- [ ] **Phase 8: Filter Implementation** - Interactive filter pills
- [ ] **Phase 9: Polish** - Pixel-perfect design matching

## Phase Details

### Phase 6: Design
**Goal**: Status filter pills designed and approved in mill-production.pen
**Depends on**: Nothing (first phase of v1.1)
**Requirements**: DESGN-01, DESGN-02
**Success Criteria** (what must be TRUE):
  1. User can see status filter pills design in mill-production.pen file
  2. User can approve design (colors, spacing, typography) before implementation begins
**Plans**: 1 plan

Plans:
- [ ] 06-01-PLAN.md — Design filter pills with interaction states in mill-production.pen

**UI hint**: yes

### Phase 7: Data Infrastructure
**Goal**: Production orders mock service derived from Book1.xlsx example data
**Depends on**: Phase 6
**Requirements**: DATA-01, DATA-02
**Success Criteria** (what must be TRUE):
  1. Mock service returns production orders with all required fields (orderNumber, customer, product, state, millLine, etc.)
  2. Orders distributed realistically across mill lines (Premix, Excel, CGM) and states (Completed, Mixing, Blocked, Pending)
  3. Mock data structure matches Book1.xlsx column format
**Plans**: TBD

Plans:
- [ ] 07-01: TBD

### Phase 8: Filter Implementation
**Goal**: Interactive status filter pills with toggle behavior
**Depends on**: Phase 7
**Requirements**: FILTR-01, FILTR-02, FILTR-03, FILTR-04, FILTR-05
**Success Criteria** (what must be TRUE):
  1. User can see status filter pills (Completed, Mixing, Blocked, Pending) above mill columns
  2. User can click a filter pill to toggle that status on/off
  3. User can select multiple pills to show combined statuses
  4. User can see count badges showing total orders per status (not filtered count)
  5. User sees all cards when no filters selected (default state)
  6. Cards matching selected states remain visible, non-matching cards hidden
**Plans**: TBD

Plans:
- [ ] 08-01: TBD

**UI hint**: yes

### Phase 9: Polish
**Goal**: Mill production view matches .pen design pixel-perfect
**Depends on**: Phase 8
**Requirements**: POLSH-01, POLSH-02, POLSH-03
**Success Criteria** (what must be TRUE):
  1. Mill production layout spacing and typography match .pen design exactly
  2. Filter pill colors and styling match .pen design (active=blue, inactive=gray)
  3. No hardcoded hex colors or spacing values (all use design tokens)
**Plans**: TBD

Plans:
- [ ] 09-01: TBD

**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 6 → 7 → 8 → 9

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 6. Design | 0/1 | Not started | - |
| 7. Data Infrastructure | 0/0 | Not started | - |
| 8. Filter Implementation | 0/0 | Not started | - |
| 9. Polish | 0/0 | Not started | - |

---
*Roadmap created: 2026-03-11*
*v1.0 shipped: 2026-04-29*
*v1.1 roadmap updated: 2026-04-28*
