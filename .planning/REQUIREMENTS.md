# Requirements: CGM Dashboard

**Defined:** 2026-05-01
**Core Value:** Operations staff can see and manage feed orders in real-time, from pending through delivery.

## v1.2 Requirements

Requirements for Customers Page milestone. Each maps to roadmap phases.

### Data Layer

- [ ] **DATA-01**: Customer TypeScript types defined (Customer, CustomerStats)
- [ ] **DATA-02**: Bin TypeScript types defined (Bin, BinAlert, BinThreshold)
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
| DATA-01 | TBD | Pending |
| DATA-02 | TBD | Pending |
| DATA-03 | TBD | Pending |
| DATA-04 | TBD | Pending |
| CUST-01 | TBD | Pending |
| CUST-02 | TBD | Pending |
| CUST-03 | TBD | Pending |
| CUST-04 | TBD | Pending |
| CDET-01 | TBD | Pending |
| CDET-02 | TBD | Pending |
| CDET-03 | TBD | Pending |
| TMLN-01 | TBD | Pending |
| TMLN-02 | TBD | Pending |
| TMLN-03 | TBD | Pending |
| BIN-01 | TBD | Pending |
| BIN-02 | TBD | Pending |
| BIN-03 | TBD | Pending |

**Coverage:**
- v1.2 requirements: 17 total
- Mapped to phases: 0
- Unmapped: 17

---
*Requirements defined: 2026-05-01*
*Last updated: 2026-05-01 after initial definition*
