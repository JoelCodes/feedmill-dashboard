# Requirements: CGM Dashboard

**Defined:** 2026-04-28
**Core Value:** Operations staff can see and manage feed orders in real-time, from pending through delivery.

## v1.1 Requirements

Requirements for Mill Production Dashboard milestone. Each maps to roadmap phases.

### Design

- [ ] **DESGN-01**: User can see status filter pills design in mill-production.pen
- [ ] **DESGN-02**: User can approve design before implementation begins

### Data

- [ ] **DATA-01**: Production orders mock data derived from Book1.xlsx structure
- [ ] **DATA-02**: Mock service returns orders with realistic mill line distribution

### Filters

- [ ] **FILTR-01**: User can see status filter pills (Completed, Mixing, Blocked, Pending) above columns
- [ ] **FILTR-02**: User can click a filter pill to show only cards with that status
- [ ] **FILTR-03**: User can click multiple pills to show combined statuses
- [ ] **FILTR-04**: User can see count badges showing orders per status
- [ ] **FILTR-05**: User sees all cards when no filters selected (default)

### Polish

- [ ] **POLSH-01**: Mill production view matches .pen design spacing and typography
- [ ] **POLSH-02**: Filter pills match .pen design colors and styling
- [ ] **POLSH-03**: Cards match .pen design shadow and border styling

## Future Requirements

Deferred to future releases. Tracked but not in current roadmap.

### KPI Dashboard (from v1.0)

- **KPI-01**: KPI cards display computed values from order data
- **KPI-02**: Click KPI card to filter table to relevant orders

### Production Enhancements (v1.2+)

- **FILTR-06**: User can search within mill production view
- **FILTR-07**: User can filter by mill line (Premix, Excel, CGM)
- **FILTR-08**: Filter state persists in URL

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Real-time push updates | Polling or manual refresh sufficient for v1 |
| Drag-and-drop state changes | Complex interaction, defer to v2 |
| Database integration | Mock data until explicitly requested |
| Order editing from production view | Use orders page for editing |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| DESGN-01 | TBD | Pending |
| DESGN-02 | TBD | Pending |
| DATA-01 | TBD | Pending |
| DATA-02 | TBD | Pending |
| FILTR-01 | TBD | Pending |
| FILTR-02 | TBD | Pending |
| FILTR-03 | TBD | Pending |
| FILTR-04 | TBD | Pending |
| FILTR-05 | TBD | Pending |
| POLSH-01 | TBD | Pending |
| POLSH-02 | TBD | Pending |
| POLSH-03 | TBD | Pending |

**Coverage:**
- v1.1 requirements: 12 total
- Mapped to phases: 0
- Unmapped: 12

---
*Requirements defined: 2026-04-28*
*Last updated: 2026-04-28 after initial definition*
