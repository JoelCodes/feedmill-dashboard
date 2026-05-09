---
phase: 18-page-migration
plan: 06
subsystem: customers
tags: [page-migration, design-tokens, ui-components]
dependency_graph:
  requires:
    - 18-04 (Gauge/Timeline extraction to ui/)
    - 18-05 (Orders page migration)
  provides:
    - Customers pages using design system
  affects:
    - src/app/customers/page.tsx
    - src/app/customers/[id]/page.tsx
    - src/components/CustomerDetailTabs.tsx
    - src/components/BinGaugeRow.tsx
tech_stack:
  added: []
  patterns:
    - Card component for page sections
    - CSS variable tokens for colors
    - ui/ component imports
key_files:
  created: []
  modified:
    - src/app/customers/page.tsx
    - src/components/CustomerDetailTabs.tsx
    - src/components/BinGaugeRow.tsx
    - src/app/customers/[id]/page.test.tsx
  deleted:
    - src/components/BinGauge.tsx
    - src/components/BinGauge.test.tsx
    - src/components/ActivityTimeline.tsx
    - src/components/ActivityTimeline.test.tsx
decisions: []
metrics:
  duration: 160s
  completed: 2026-05-07T23:05:50Z
---

# Phase 18 Plan 06: Customers Page Migration Summary

**One-liner:** Customers pages migrated to Card component and design tokens; old BinGauge/ActivityTimeline files deleted

## What Was Built

Migrated all customer-related pages and components to use the design system:

1. **Customers list page** (`src/app/customers/page.tsx`):
   - Added Card component import from ui/
   - Replaced hardcoded wrapper with Card/Card.Content
   - Replaced all hardcoded gray classes with CSS variable tokens:
     - `bg-gray-200` -> `bg-[var(--divider)]`
     - `text-gray-300/400` -> `text-[var(--text-secondary)]`
     - `hover:bg-gray-50` -> `hover:bg-[var(--bg-page)]`
   - Updated input border/focus states to use tokens

2. **Customer detail tabs** (`src/components/CustomerDetailTabs.tsx`):
   - Updated ActivityTimeline import from `@/components/ui/Timeline`

3. **BinGaugeRow** (`src/components/BinGaugeRow.tsx`):
   - Updated import from `./BinGauge` to `@/components/ui/Gauge`
   - Mapped props: `locationCode` -> `label`, `feedType` -> `sublabel`

4. **Old files deleted**:
   - `src/components/BinGauge.tsx` (replaced by ui/Gauge)
   - `src/components/BinGauge.test.tsx` (tests in ui/Gauge.test.tsx)
   - `src/components/ActivityTimeline.tsx` (replaced by ui/Timeline)
   - `src/components/ActivityTimeline.test.tsx` (tests in ui/Timeline.test.tsx)

## Task Completion

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Migrate customers list page | 557f665 | src/app/customers/page.tsx |
| 2 | Update detail page imports | 97a9886 | CustomerDetailTabs.tsx, page.test.tsx |
| 3 | Update BinGaugeRow | 3370fdd | BinGaugeRow.tsx |
| 4 | Delete old files | e2fda07 | 4 files deleted |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Test file import update**
- **Found during:** Task 2
- **Issue:** Test file `page.test.tsx` also mocked old `@/components/ActivityTimeline` path
- **Fix:** Updated mock and import to `@/components/ui/Timeline`
- **Files modified:** src/app/customers/[id]/page.test.tsx
- **Commit:** 97a9886

**2. [Rule 3 - Blocking] Additional test file deletion**
- **Found during:** Task 4
- **Issue:** `ActivityTimeline.test.tsx` still referenced deleted component, blocking tests
- **Fix:** Deleted old test file (tests exist in ui/Timeline.test.tsx)
- **Files modified:** src/components/ActivityTimeline.test.tsx (deleted)
- **Commit:** e2fda07

## Verification Results

- All 192 tests pass
- ESLint reports 0 errors (5 pre-existing classnames-order warnings)
- No hardcoded gray-* classes remain in customer pages
- No imports reference old BinGauge or ActivityTimeline paths

## Self-Check: PASSED

- [x] src/app/customers/page.tsx exists and contains Card import
- [x] src/components/CustomerDetailTabs.tsx imports from ui/Timeline
- [x] src/components/BinGaugeRow.tsx imports from ui/Gauge
- [x] src/components/BinGauge.tsx does NOT exist
- [x] src/components/ActivityTimeline.tsx does NOT exist
- [x] All commits exist: 557f665, 97a9886, 3370fdd, e2fda07
