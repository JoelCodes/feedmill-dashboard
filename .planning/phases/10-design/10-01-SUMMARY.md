---
phase: 10-design
plan: 01
subsystem: design
tags:
  - design
  - customers
  - pencil.dev
  - ui-spec
dependency_graph:
  requires: []
  provides:
    - customers.pen (customer list view design)
    - customer-detail.pen (customer detail page design)
  affects:
    - Phase 12 (implementation will reference these designs)
    - Phase 13 (components will match these specifications)
tech_stack:
  added:
    - Pencil.dev JSON format v2.8
  patterns:
    - Vertical tank gauge visualization for bin fill levels
    - Stacked status indicators (orders + changes + bin alerts)
    - Extended TimelineItem pattern for activity events
    - Full contact card header layout
key_files:
  created:
    - designs/customers.pen
    - designs/customer-detail.pen
  modified: []
decisions:
  - "D-01 applied: Table rows layout matches OrdersTable pattern"
  - "D-02 applied: Minimal columns (Name + Status only)"
  - "D-03 applied: Combined status indicator uses stacked icons"
  - "D-04 applied: Search box only at top, matching Header pattern"
  - "D-05 applied: Header + single scroll layout for detail page"
  - "D-06 applied: Full contact card header with all info"
  - "D-07 applied: Section order is Bins first, then Timeline"
  - "D-09 applied: Vertical tank gauge design"
  - "D-10 applied: Color fills threshold zones (green/yellow/red)"
  - "D-11 applied: Compact row of gauges layout"
  - "D-13 applied: All colors reference design tokens from globals.css"
  - "D-14 applied: All icons use lucide iconFontFamily"
  - "D-15 applied: Timeline extends TimelineItem pattern"
  - "D-16 applied: Search box matches Header styling"
metrics:
  duration: 302s
  tasks_completed: 2
  files_created: 2
  commits: 2
  completed_date: 2026-05-02
---

# Phase 10 Plan 01: Customer Page Designs Summary

**One-liner:** Pencil.dev designs for customer list view with stacked status indicators and customer detail page with vertical tank bin gauges and unified activity timeline.

## Overview

Created two Pencil.dev design files (customers.pen and customer-detail.pen) following established project patterns and design tokens. Designs establish visual contract for implementation phases 12-15.

**customers.pen** provides customer list view with:
- CustomerTable showing 6 sample customer rows
- Stacked status indicators (package icon for orders, red dot for changes, alert-triangle for bin alerts)
- Search box matching Header pattern
- Empty state with approved copywriting
- Hover state variant

**customer-detail.pen** provides customer detail page with:
- CustomerDetailHeader with full contact card and summary stats
- BinGaugeRow with 4 vertical tank gauges showing fill levels (75%, 62%, 22%, 8%)
- Color-coded bin thresholds: green (normal ≥30%), yellow (low 15-30%), red (critical <15%)
- ActivityTimeline with 10 events showing orders, deliveries, and bin alerts
- Expanded state shown on first timeline item

## Tasks Completed

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Create customers.pen (Customer List View) | 13dfbc5 | designs/customers.pen |
| 2 | Create customer-detail.pen (Customer Detail Page) | 543bd53 | designs/customer-detail.pen |

## Deviations from Plan

None - plan executed exactly as written. All decisions from 10-CONTEXT.md were applied successfully.

## Requirements Satisfied

- **DSGN-01:** Customer list view designed in customers.pen with CustomerTable (6 rows, search box, status indicators, empty state) matching order-dashboard.pen patterns
- **DSGN-02:** Customer detail page layout designed in customer-detail.pen with CustomerDetailHeader (contact card, summary stats)
- **DSGN-03:** Bin visualization with fill bars and alert states designed in BinGaugeRow (4 vertical tank gauges showing normal/low/critical thresholds) and ActivityTimeline (10+ events with expand/collapse)

## Design Validation

Both design files:
- Use Pencil.dev JSON format version 2.8 ✓
- Follow established page-layout.pen structure (280px sidebar + fill_container main content) ✓
- Reference only design tokens from globals.css (no arbitrary hex values) ✓
- Use lucide iconFontFamily for all icons ✓
- Match typography scale from 10-UI-SPEC.md (10/12/16/20px sizes) ✓
- Follow 4px-based spacing scale (xs=4, sm=8, md=16, lg=24, xl=32) ✓

### Component Inventory Delivered

**customers.pen:**
1. CustomerTable - table with header + 6 customer rows
2. CustomerSearchBox - search input matching Header pattern
3. StatusIndicator - stacked icons showing orders/changes/alerts
4. Empty State - centered message for no results

**customer-detail.pen:**
1. CustomerDetailHeader - contact card + summary stats
2. BinGaugeRow - 4 vertical tank gauges with fill levels
3. ActivityTimeline - 10 timeline items with expand/collapse
4. Timeline variants - expanded detail frame shown on item 1

### Color Token Compliance

All colors verified against globals.css:
- Page background: #f8f9faff ✓
- Card surfaces: #ffffffff ✓
- Primary/accent: #4fd1c5ff ✓
- Text primary: #2d3748ff ✓
- Text secondary: #a0aec0ff ✓
- Border/divider: #e2e8f0ff ✓
- Success (bin normal): #48bb78ff ✓
- Warning (bin low): #975a16ff ✓
- Error (bin critical): #e53e3eff ✓

## Pattern Reuse

Successfully reused patterns from existing designs:
- **Sidebar navigation**: Exact structure from page-layout.pen (logo, nav items, dividers)
- **Search box**: Copied from order-dashboard.pen lines 549-592 (40px height, 15px cornerRadius, lucide search icon)
- **Table structure**: Followed order-dashboard.pen table pattern (header row, divider, data rows)
- **Timeline**: Extended order-dashboard.pen timeline pattern (leftCol with icon+connector, rightCol with content)
- **Icon usage**: All icons follow lucide iconFontFamily pattern

## Known Stubs

None. All design elements are fully specified with complete metadata.

## Self-Check: PASSED

**Created files verified:**
- ✓ designs/customers.pen exists (26,911 bytes)
- ✓ designs/customer-detail.pen exists (73,914 bytes)

**Commits verified:**
- ✓ 13dfbc5 exists: feat(10-01): create customers.pen customer list view design
- ✓ 543bd53 exists: feat(10-01): create customer-detail.pen customer detail page design

**JSON validity verified:**
- ✓ customers.pen is valid JSON
- ✓ customer-detail.pen is valid JSON

**Component names verified:**
- ✓ CustomerTable found in customers.pen
- ✓ BinGaugeRow found in customer-detail.pen
- ✓ ActivityTimeline found in customer-detail.pen

**Icon library compliance verified:**
- ✓ All icons use lucide iconFontFamily (no other icon libraries)

## Next Steps

1. Design review and approval (required before Phase 12 implementation)
2. Phase 12: Implement customer list page components
3. Phase 13: Implement customer detail page components
4. Phase 14: Implement bin visualization and timeline
5. Phase 15: Integration and testing

---

**Execution time:** 302 seconds (5m 2s)
**Completed:** 2026-05-02
**Status:** ✅ Ready for design review
