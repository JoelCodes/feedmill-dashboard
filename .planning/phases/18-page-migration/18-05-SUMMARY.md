---
phase: 18-page-migration
plan: 05
subsystem: orders-page
tags:
  - design-tokens
  - migration
  - ui-components
dependency_graph:
  requires:
    - 18-02 (FilterPill extraction)
    - 18-03 (Mill Production migration - pattern reference)
  provides:
    - Token-based OrdersTable with status pill config
    - Token-based OrderDetails with Card component
    - Orders page skeleton with tokens
  affects:
    - src/components/OrdersTable.tsx
    - src/components/OrderDetails.tsx
    - src/app/orders/page.tsx
tech_stack:
  added: []
  patterns:
    - CSS variables via var(--token) syntax
    - Card compound component usage
    - color-mix() for opacity variants
key_files:
  created: []
  modified:
    - src/components/OrdersTable.tsx
    - src/components/OrderDetails.tsx
    - src/app/orders/page.tsx
  deleted:
    - src/components/FilterPill.tsx
    - src/components/FilterPill.test.tsx
decisions:
  - Used color-mix(in_srgb,var(--token)_N%,transparent) for opacity variants without dedicated tokens
  - Deleted old FilterPill.tsx as ui/FilterPill.tsx contains the migrated version
metrics:
  duration: 4m
  completed: 2026-05-07T22:56:26Z
  tasks_completed: 4
  files_changed: 5
---

# Phase 18 Plan 05: Orders Page Token Migration Summary

Migrate Orders page components to design system tokens and ui/ components with zero hardcoded hex values.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | ded816b | feat(18-05): migrate OrdersTable to design tokens |
| 2 | cc036a3 | feat(18-05): migrate OrderDetails to Card component and tokens |
| 3 | 594fe82 | feat(18-05): update orders page skeleton with design tokens |
| 4 | f2ba466 | chore(18-05): delete old FilterPill.tsx from components/ root |

## Changes Made

### Task 1: OrdersTable Token Migration
- Updated FilterPill import from `@/components/FilterPill` to `@/components/ui/FilterPill`
- Replaced STATUS_PILL_CONFIG hardcoded hex values:
  - `bg-gray-100` -> `bg-[var(--pending-light)]`
  - `text-gray-600` -> `text-[var(--text-secondary)]`
  - `bg-gray-200` -> `bg-[var(--status-pending-bg-22)]`
  - `bg-[#f59e0b22]` -> `bg-[var(--status-mixing-bg-22)]`
  - `bg-[#2b6cb022]` -> `bg-[color-mix(in_srgb,var(--info)_13%,transparent)]`
  - `bg-[#9333ea22]` -> `bg-[color-mix(in_srgb,var(--purple)_13%,transparent)]`
  - `bg-[#2f855a22]` -> `bg-[var(--status-completed-bg-22)]`
- Updated search highlight from `bg-primary/20` to `color-mix()` approach
- Updated hover state from `hover:bg-gray-50` to `hover:bg-[var(--bg-page)]`
- Updated search icon and placeholder colors to use `var(--text-secondary)`

### Task 2: OrderDetails Card Migration
- Added Card import from `@/components/ui/Card`
- Replaced two container divs using `rounded-[15px] bg-white shadow-[...]` with `<Card>` + `<Card.Content>`
- Updated colorMap to use explicit `var(--token)` syntax for primary, success, error, pending
- Updated PendingBadge to use `bg-[var(--pending-light)]` and `text-[var(--text-secondary)]`
- Updated StatCard to use explicit token references
- Updated TimelineItem to use explicit token references

### Task 3: Orders Page Skeleton
- Replaced `rounded-[15px]` with `rounded-[var(--radius-xl)]`
- Replaced `bg-gray-100` with `bg-[var(--divider)]`

### Task 4: FilterPill Cleanup
- Deleted `src/components/FilterPill.tsx` (old location)
- Deleted `src/components/FilterPill.test.tsx` (ui/ version has comprehensive tests)
- Verified no imports reference old location

## Verification Results

- Build: PASSED (no type errors)
- ESLint: Pre-existing warnings only (no new issues from this plan)
- FilterPill tests: 16/16 PASSED
- All imports point to ui/FilterPill

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check: PASSED

- [x] src/components/OrdersTable.tsx modified with commits
- [x] src/components/OrderDetails.tsx modified with commits
- [x] src/app/orders/page.tsx modified with commits
- [x] src/components/FilterPill.tsx deleted
- [x] Commits ded816b, cc036a3, 594fe82, f2ba466 exist
