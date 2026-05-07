---
phase: 18-page-migration
plan: 03
subsystem: pages/mill-production
tags: [token-migration, component-refactor, bug-fix]
dependency_graph:
  requires:
    - 18-02 (FilterPill extraction)
  provides:
    - Mill Production page with token-based styling
    - KPICard using Card compound component
    - Sidebar with corrected token syntax
    - Header with token-based shadow
  affects:
    - src/app/mill-production/page.tsx
    - src/components/KPICard.tsx
    - src/components/Sidebar.tsx
    - src/components/Header.tsx
tech_stack:
  added: []
  patterns:
    - Card compound component usage
    - CSS variable token syntax
key_files:
  created: []
  modified:
    - src/app/mill-production/page.tsx
    - src/components/KPICard.tsx
    - src/components/Sidebar.tsx
    - src/components/Header.tsx
decisions:
  - Use Card.Content for KPICard layout (simplified structure)
  - Fix typo text-[--primary] to text-[var(--primary)] (bug fix)
metrics:
  duration: ~5 minutes
  completed: 2026-05-07T22:52:51Z
  tasks_completed: 4
  files_modified: 4
---

# Phase 18 Plan 03: Mill Production Page and Layout Components Migration Summary

Migrated Mill Production page to use FilterPill from ui/ directory and converted KPICard, Sidebar, and Header to use design tokens, fixing a typo bug in Sidebar.

## Commits

| Task | Commit | Message |
|------|--------|---------|
| 1 | 305d3fd | feat(18-03): update Mill Production page to use FilterPill from ui/ |
| 2 | fbbc459 | feat(18-03): refactor KPICard to use Card compound component |
| 3 | c9cda9d | fix(18-03): fix Sidebar token usage and text-[--primary] typo |
| 4 | 9bb1858 | feat(18-03): update Header to use token-based shadow and background |

## Changes Made

### Task 1: Mill Production Page FilterPill Import
- Updated import from `@/components/FilterPill` to `@/components/ui/FilterPill`
- Replaced 3 instances of `bg-gray-200` with `bg-[var(--divider)]` in LoadingSkeleton

### Task 2: KPICard Card Compound Component Refactor
- Added import for Card from `@/components/ui/Card`
- Wrapped KPICard content in `<Card>` and `<Card.Content>` components
- Replaced hardcoded values:
  - `rounded-[15px]` -> Card provides via `--radius-xl`
  - `bg-white` -> Card provides via `--bg-card`
  - `shadow-[0_3.5px_5px_rgba(0,0,0,0.02)]` -> Card provides via `--shadow-card`
  - `text-success` -> `text-[var(--success)]`
  - `text-error` -> `text-[var(--error)]`
  - `bg-primary` -> `bg-[var(--primary)]`
- Added `shadow-[var(--shadow-card)]` to icon container

### Task 3: Sidebar Token Fixes and Bug Fix
- **Bug Fix:** Corrected typo `text-[--primary]` to `text-[var(--primary)]` (line 112)
- Replaced `rounded-[15px]` with `rounded-[var(--radius-xl)]`
- Replaced `rounded-xl` with `rounded-[var(--radius-lg)]` on icon container
- Replaced `shadow-[0_3.5px_5px_rgba(0,0,0,0.03)]` with `shadow-[var(--shadow-card)]` (2 occurrences)

### Task 4: Header Shadow Token
- Replaced `bg-white` with `bg-[var(--bg-card)]` for dark mode support
- Replaced `shadow-[0_3.5px_5px_rgba(0,0,0,0.02)]` with `shadow-[var(--shadow-sm)]`

## Token Replacements Summary

| Component | Old Value | New Token |
|-----------|-----------|-----------|
| Mill Production | `bg-gray-200` | `bg-[var(--divider)]` |
| KPICard | `rounded-[15px]` | Card `--radius-xl` |
| KPICard | `bg-white` | Card `--bg-card` |
| KPICard | `shadow-[0_3.5px...0.02)]` | Card `--shadow-card` |
| Sidebar | `rounded-[15px]` | `rounded-[var(--radius-xl)]` |
| Sidebar | `rounded-xl` | `rounded-[var(--radius-lg)]` |
| Sidebar | `shadow-[0_3.5px...0.03)]` | `shadow-[var(--shadow-card)]` |
| Sidebar | `text-[--primary]` | `text-[var(--primary)]` (typo fix) |
| Header | `bg-white` | `bg-[var(--bg-card)]` |
| Header | `shadow-[0_3.5px...0.02)]` | `shadow-[var(--shadow-sm)]` |

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

- ESLint: No new errors introduced (pre-existing hardcoded px values in Sidebar/Header are out of scope for this plan)
- Tests: 209 passed, 0 failed
- All acceptance criteria met

## Self-Check: PASSED

- [x] src/app/mill-production/page.tsx modified - FOUND
- [x] src/components/KPICard.tsx modified - FOUND
- [x] src/components/Sidebar.tsx modified - FOUND
- [x] src/components/Header.tsx modified - FOUND
- [x] Commit 305d3fd exists - FOUND
- [x] Commit fbbc459 exists - FOUND
- [x] Commit c9cda9d exists - FOUND
- [x] Commit 9bb1858 exists - FOUND
