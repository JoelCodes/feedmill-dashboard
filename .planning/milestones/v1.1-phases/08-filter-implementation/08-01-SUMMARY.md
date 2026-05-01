---
phase: 08-filter-implementation
plan: 01
subsystem: filter-pills
tags: [component-extraction, shared-components, tdd, accessibility]
dependency_graph:
  requires: [STATUS_CONFIG from StatusBadge]
  provides: [FilterPill shared component]
  affects: [OrdersTable, future mill production page]
tech_stack:
  added: [Jest, React Testing Library, @testing-library/jest-dom]
  patterns: [TDD RED-GREEN cycle, generic prop pattern, color config objects]
key_files:
  created:
    - src/components/FilterPill.tsx
    - src/components/FilterPill.test.tsx
    - jest.config.ts
    - jest.setup.ts
  modified:
    - src/components/OrdersTable.tsx
    - package.json
decisions:
  - "Used generic color config object instead of status-specific props for reusability"
  - "Installed Jest and React Testing Library for TDD workflow"
  - "Followed TDD RED-GREEN cycle: failing tests first, then implementation"
  - "Kept accessibility attributes (aria-pressed, aria-label) from original implementation"
  - "Created STATUS_PILL_CONFIG mapping in OrdersTable to bridge StatusConfig to FilterPillColorConfig"
metrics:
  duration: 182s
  tasks_completed: 2
  tests_added: 11
  commits: 4
  completed_date: 2026-04-29
---

# Phase 08 Plan 01: FilterPill Shared Component

**One-liner:** Extracted FilterPill from OrdersTable into reusable component with generic color props and full test coverage.

## Objective

Extract FilterPill from OrdersTable.tsx into a shared component with generic props to enable reuse across both orders page and mill production page.

## What Was Built

### FilterPill Component
- **Generic props interface**: Replaced status-specific prop with generic color config object
- **Color configuration**: Accepts optional `FilterPillColorConfig` with bg, text, dot, countBg properties
- **Active/inactive states**: Applies `bg-primary` and `text-white` when active, falls back to color config or gray defaults when inactive
- **Dot visibility**: Shows dot only when `isActive=true` AND (`showDot=true` OR `color.dot` exists)
- **Accessibility**: Includes `aria-pressed` and `aria-label` attributes for screen readers
- **Test coverage**: 11 unit tests covering rendering, colors, states, interactions, and accessibility

### Test Infrastructure
- **Jest configuration**: Installed and configured Jest with Next.js integration
- **React Testing Library**: Installed @testing-library/react and @testing-library/jest-dom
- **Test scripts**: Added `npm test` and `npm test:watch` to package.json
- **jsdom environment**: Configured for React component testing

### OrdersTable Refactoring
- **Import shared component**: Added import for FilterPill and FilterPillColorConfig
- **STATUS_PILL_CONFIG mapping**: Created mapping from OrderStatus to FilterPillColorConfig format
- **Updated usages**: Replaced `status` prop with `color={STATUS_PILL_CONFIG[status]}` for all status pills
- **Removed inline definition**: Deleted 38 lines of duplicate FilterPill component code
- **Preserved behavior**: Has Changes pill continues to use `showDot` and `dotColor` props

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Missing test infrastructure**
- **Found during:** Task 1 TDD RED phase
- **Issue:** Project had no test framework installed, blocking TDD execution
- **Fix:** Installed Jest, React Testing Library, @testing-library/jest-dom, configured Jest for Next.js
- **Files modified:** package.json, jest.config.ts (created), jest.setup.ts (created)
- **Commit:** 4a49bf2

## Tasks Completed

| Task | Name | Commit | Files | Duration |
|------|------|--------|-------|----------|
| 1 | Create FilterPill with tests (TDD) | 4ca7369, 359cddb, 4a49bf2 | FilterPill.tsx, FilterPill.test.tsx, jest config | ~140s |
| 2 | Refactor OrdersTable | de3d0db | OrdersTable.tsx | ~42s |

### Task 1: Create FilterPill Component with Tests (TDD)

**Commits:**
- `4ca7369` - RED phase: Created failing tests for FilterPill component
- `4a49bf2` - Infrastructure: Added Jest test framework
- `359cddb` - GREEN phase: Implemented FilterPill component (all tests pass)

**Tests created (11 total):**
- Renders label text
- Renders count in badge
- Applies bg-primary when active
- Applies color.bg when inactive with color
- Applies bg-gray-100 when inactive without color
- Applies text-white when active
- Shows dot when active and showDot=true
- Hides dot when inactive
- Calls onClick when clicked
- Has aria-pressed matching isActive
- Has descriptive aria-label

**Component features:**
- Exported `FilterPillColorConfig` interface with bg, text, dot, countBg properties
- Exported `FilterPillProps` interface with label, count, color, isActive, onClick, showDot, dotColor
- Default export `FilterPill` functional component
- Conditional dot rendering with `data-testid="filter-pill-dot"`
- Dynamic class application based on active state and color config
- Accessibility attributes: `aria-pressed={isActive}` and `aria-label="Filter by {label}, {count} orders"`

### Task 2: Refactor OrdersTable to Use Shared FilterPill

**Commit:** `de3d0db`

**Changes:**
- Added import: `import FilterPill, { FilterPillColorConfig } from "@/components/FilterPill";`
- Created `STATUS_PILL_CONFIG: Record<OrderStatus, FilterPillColorConfig>` mapping
- Updated 5 status pills to use `color={STATUS_PILL_CONFIG[status]}` instead of `status` prop
- Removed inline `FilterPillProps` interface (8 lines)
- Removed inline `FilterPill` function component (30 lines)
- Net reduction: 4 lines (43 removed, 39 added for config and import)

**Verification:**
- `npm run build` succeeded with no TypeScript errors
- Import verified present
- Inline definition verified removed
- All FilterPill usages verified using color prop

## Verification Results

### Automated Tests
- ✅ All 11 FilterPill unit tests pass
- ✅ TypeScript compilation succeeds (`npm run build`)
- ✅ No eslint errors

### Manual Verification (deferred to orchestrator)
- Orders page renders correctly with filter pills functional
- Clicking filter pills toggles active state (blue background)
- Filter counts update correctly
- Has Changes pill shows red dot

## Known Stubs

None - this plan extracts existing functionality without introducing new data dependencies.

## Technical Notes

### TDD Process
Followed strict RED-GREEN cycle:
1. **RED**: Created FilterPill.test.tsx with 11 tests, ran tests (all failed - module not found)
2. **GREEN**: Created FilterPill.tsx component, ran tests (all passed)
3. **REFACTOR**: Applied component to OrdersTable, removed duplication

### Design Decisions

**Generic color prop over status prop:**
- Decouples FilterPill from OrderStatus enum
- Enables reuse for mill production page with different status types (ProductionState)
- Maintains visual consistency across different filter contexts

**STATUS_PILL_CONFIG mapping:**
- Bridges existing STATUS_CONFIG (with label property) to FilterPillColorConfig (no label)
- Avoids modifying StatusBadge.tsx (out of plan scope)
- Localized to OrdersTable for minimal change surface

**Preserved props:**
- `showDot` and `dotColor` remain for Has Changes pill use case
- Supports override patterns without color config

### Accessibility
- `aria-pressed` attribute correctly reflects toggle state for screen readers
- `aria-label` provides descriptive context: "Filter by {label}, {count} orders"
- Interactive elements use semantic `<button>` element

## Self-Check: PASSED

**Created files exist:**
```bash
✅ FOUND: src/components/FilterPill.tsx
✅ FOUND: src/components/FilterPill.test.tsx
✅ FOUND: jest.config.ts
✅ FOUND: jest.setup.ts
```

**Modified files updated:**
```bash
✅ FOUND: FilterPill import in OrdersTable.tsx
✅ FOUND: STATUS_PILL_CONFIG in OrdersTable.tsx
✅ VERIFIED: No inline FilterPillProps interface
✅ VERIFIED: No inline FilterPill function
```

**Commits exist:**
```bash
✅ FOUND: 4ca7369 (test RED)
✅ FOUND: 359cddb (feat GREEN)
✅ FOUND: 4a49bf2 (chore infrastructure)
✅ FOUND: de3d0db (refactor OrdersTable)
```

**Tests pass:**
```bash
✅ 11/11 FilterPill tests passing
✅ Build succeeds with no TypeScript errors
```

## Next Steps

This plan completes FILTR-01. The shared FilterPill component is ready for:
- Plan 08-02: Mill production filter pills implementation
- Future filter pill use cases across the application

The generic prop design ensures FilterPill can adapt to any filter context with custom color schemes.
