# Requirements: CGM Dashboard

**Defined:** 2026-03-11
**Core Value:** Operations staff can see and manage feed orders in real-time, from pending through delivery.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Infrastructure

- [x] **INFRA-01**: TypeScript types defined for Order data structure
- [x] **INFRA-02**: Mock orders service with async interface
- [x] **INFRA-03**: StatusBadge component extracted with shared constants
- [x] **INFRA-04**: Loading skeleton components for table and details

### Orders Table

- [x] **TABLE-01**: Display order lines with: Document #, Customer, Product, Quantity, Location, Delivery Date, Status
- [x] **TABLE-02**: Product column combines Texture Type + Formula Type
- [x] **TABLE-03**: Status badges: Pending, Producing, Ready, In Transit, Complete
- [x] **TABLE-04**: Red dot indicator for orders with changes flag
- [x] **TABLE-05**: Filter by status (clickable pills)
- [x] **TABLE-06**: Filter by "has changes"
- [x] **TABLE-07**: Search bar filters by customer name and product
- [x] **TABLE-08**: Row selection with visual highlight
- [x] **TABLE-09**: Empty state when no results match filters

### Order Details

- [x] **DETAIL-01**: Click row to open order details panel
- [ ] **DETAIL-02**: Order details panel shows full order information
- [ ] **DETAIL-03**: Timeline visualization of order lifecycle events
- [ ] **DETAIL-04**: Order change history display
- [x] **DETAIL-05**: Panel closes via back button or close control

### KPI Cards

- [ ] **KPI-01**: KPI cards display computed values from order data
- [ ] **KPI-02**: Click KPI card to filter table to relevant orders

### Navigation

- [ ] **NAV-01**: Sidebar links route to different views
- [ ] **NAV-02**: Current view indicated in sidebar

### Header

- [ ] **HEADER-01**: Search box searches across all orders
- [ ] **HEADER-02**: Notifications area with indicator
- [ ] **HEADER-03**: Settings link to settings page

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Advanced Table Features

- **ADV-01**: Multi-column sorting (status + delivery date)
- **ADV-02**: Column visibility toggle
- **ADV-03**: Keyboard navigation (arrow keys, Enter)
- **ADV-04**: Export to Excel
- **ADV-05**: Saved filter presets

### Real-time Features

- **REAL-01**: Auto-refresh order data on interval
- **REAL-02**: Visual indicator when data is stale
- **REAL-03**: Push notifications for order status changes

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Real-time WebSocket updates | Polling/manual refresh sufficient for v1 |
| Inline editing of orders | Dedicated forms provide better UX |
| Drag-and-drop reordering | No operational use case identified |
| Advanced query builder | Simple filters cover 90% of use cases |
| Mobile native app | Web-first, responsive later |
| Multi-tenant / multi-mill | Single mill focus initially |
| User authentication | Defer until Navigation milestone or later |
| Database integration | Mock data until explicitly requested |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFRA-01 | Phase 0 | Complete |
| INFRA-02 | Phase 0 | Complete |
| INFRA-03 | Phase 0 | Complete |
| INFRA-04 | Phase 0 | Complete |
| TABLE-01 | Phase 1 | Complete |
| TABLE-02 | Phase 1 | Complete |
| TABLE-03 | Phase 1 | Complete |
| TABLE-04 | Phase 1 | Complete |
| TABLE-05 | Phase 1 | Complete |
| TABLE-06 | Phase 1 | Complete |
| TABLE-07 | Phase 1 | Complete |
| TABLE-08 | Phase 1 | Complete |
| TABLE-09 | Phase 1 | Complete |
| DETAIL-01 | Phase 2 | Complete |
| DETAIL-02 | Phase 2 | Pending |
| DETAIL-03 | Phase 2 | Pending |
| DETAIL-04 | Phase 2 | Pending |
| DETAIL-05 | Phase 2 | Complete |
| KPI-01 | Phase 3 | Pending |
| KPI-02 | Phase 3 | Pending |
| NAV-01 | Phase 4 | Pending |
| NAV-02 | Phase 4 | Pending |
| HEADER-01 | Phase 5 | Pending |
| HEADER-02 | Phase 5 | Pending |
| HEADER-03 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 25 total
- Mapped to phases: 25
- Unmapped: 0

---
*Requirements defined: 2026-03-11*
*Last updated: 2026-03-11 after initial definition*
