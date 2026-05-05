# Requirements: CGM Dashboard

**Defined:** 2026-05-01
**Core Value:** Operations staff can see and manage feed orders in real-time, from pending through delivery.

## v1.2 Requirements

Requirements for Customers Page milestone. Each maps to roadmap phases.

### Design

- [x] **DSGN-01**: Customer list view designed in customers.pen (completed 2026-05-02, Phase 10)
- [x] **DSGN-02**: Customer detail page layout designed in customer-detail.pen (completed 2026-05-02, Phase 10)
- [x] **DSGN-03**: Bin visualization component designed with fill bars and alert states (completed 2026-05-02, Phase 10)

### Data Layer

- [x] **DATA-01**: Customer TypeScript types defined (Customer, CustomerStats) (completed 2026-05-05, Phase 11)
- [x] **DATA-02**: Bin TypeScript types defined (Bin, BinAlertLevel) (completed 2026-05-05, Phase 11)
- [ ] **DATA-03**: Mock customer service with async interface
- [ ] **DATA-04**: Mock bin service with fill percentage and alert status

### Customer List

- [ ] **CUST-01**: User can search customers by name
- [ ] **CUST-02**: Customer row shows order count and changes flag
- [ ] **CUST-03**: Customer row shows bin alert indicator (low/critical)
- [ ] **CUST-04**: Customers sorted by recent activity

### Customer Detail

- [ ] **CDET-01**: Customer detail page shows header with customer info
- [ ] **CDET-02**: Customer detail shows summary stats (orders, bins)
- [ ] **CDET-03**: Order in history links to orders page with that order selected

### Activity Timeline

- [ ] **TMLN-01**: Unified timeline shows orders, deliveries, and bin alerts chronologically
- [ ] **TMLN-02**: User can expand timeline event to see details
- [ ] **TMLN-03**: Expanded order shows inline summary with link to full details

### Bin Visualization

- [ ] **BIN-01**: Bin shows fill level as horizontal percentage bar
- [ ] **BIN-02**: Bin bar uses color thresholds (green normal, yellow low, red critical)
- [ ] **BIN-03**: Customer detail shows all bins in card layout

## Future Requirements

Deferred to future releases. Tracked but not in current roadmap.

### Predictions

- **PRED-01**: Days-until-empty prediction based on consumption rate

### Timeline Enhancements

- **TMLN-04**: Filter timeline by event type (orders/deliveries/alerts)

### Customer Health

- **HLTH-01**: Customer health indicator combining bin levels + order status
- **HLTH-02**: Customer health displayed in list view

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Real-time bin updates | Polling or manual refresh sufficient for slow-changing feed levels |
| Real BinSentry API integration | Mock data until explicitly requested |
| Customer grouping/hierarchy | Scope creep into territory management |
| Trend graphs per bin | Visual clutter; days-until-empty more actionable (deferred) |
| Inline customer editing | Use dedicated forms for better UX |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| DSGN-01 | Phase 10 | ✅ Complete (2026-05-02) |
| DSGN-02 | Phase 10 | ✅ Complete (2026-05-02) |
| DSGN-03 | Phase 10 | ✅ Complete (2026-05-02) |
| DATA-01 | Phase 11 | ✅ Complete (2026-05-05) |
| DATA-02 | Phase 11 | ✅ Complete (2026-05-05) |
| DATA-03 | Phase 11 | Pending |
| DATA-04 | Phase 11 | Pending |
| CUST-01 | Phase 12 | Pending |
| CUST-02 | Phase 12 | Pending |
| CUST-03 | Phase 12 | Pending |
| CUST-04 | Phase 12 | Pending |
| CDET-01 | Phase 13 | Pending |
| CDET-02 | Phase 13 | Pending |
| CDET-03 | Phase 13 | Pending |
| TMLN-01 | Phase 14 | Pending |
| TMLN-02 | Phase 14 | Pending |
| TMLN-03 | Phase 14 | Pending |
| BIN-01 | Phase 15 | Pending |
| BIN-02 | Phase 15 | Pending |
| BIN-03 | Phase 15 | Pending |

**Coverage:**
- v1.2 requirements: 20 total
- Mapped to phases: 20
- Unmapped: 0

---
*Requirements defined: 2026-05-01*
*Last updated: 2026-05-01 after roadmap creation*
