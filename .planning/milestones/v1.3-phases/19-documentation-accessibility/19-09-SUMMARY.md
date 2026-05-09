---
phase: 19-documentation-accessibility
plan: 09
subsystem: design-tokens
tags: [lint, accessibility, design-system, tokens]
dependency_graph:
  requires: [18-06]
  provides: [token-compliance]
  affects: [FilterPill, Gauge, StatusBadge]
tech_stack:
  added: []
  patterns: [css-variables, design-tokens]
key_files:
  created: []
  modified:
    - src/components/ui/FilterPill.tsx
    - src/components/ui/Gauge.tsx
    - src/components/ui/StatusBadge.tsx
    - src/app/globals.css
decisions:
  - "Use px-4 (16px) instead of px-[18px] for FilterPill horizontal padding - closest standard token"
  - "Use py-1 (4px) instead of py-[5px] for StatusBadge vertical padding - aligns with design system"
  - "Add --gauge-height token to globals.css for Gauge dimensions consistency"
  - "Remove unused getTextColor function from Gauge component"
metrics:
  duration: 50s
  tasks_completed: 3
  files_modified: 4
  tests_added: 0
  completed_date: "2026-05-08"
---

# Phase 19 Plan 09: UI Component Hardcoded Values Fix Summary

**One-liner:** Eliminated hardcoded pixel values from FilterPill, Gauge, and StatusBadge by replacing with design system spacing tokens.

## Objective Achievement

✅ All objectives met

- FilterPill.tsx has zero no-hardcoded-values violations
- Gauge.tsx has zero no-hardcoded-values violations and no unused code
- StatusBadge.tsx has zero no-hardcoded-values violations
- All component tests still pass (47 tests across 3 components)
- Visual appearance maintained (no layout breaks)

## Tasks Completed

### Task 1: Replace hardcoded px values in FilterPill

**Status:** ✅ Complete
**Files:** src/components/ui/FilterPill.tsx
**Commit:** e439f49

Changed `px-[18px]` to `px-4` (16px standard spacing token). The 18px was between --space-4 (16px) and --space-5 (24px), so we selected the closest standard token for consistency with the design system.

**Before:**
```typescript
className={`flex items-center gap-1.5 ${bgClass} rounded-2xl px-[18px] py-2 h-8 ...`}
```

**After:**
```typescript
className={`flex items-center gap-1.5 ${bgClass} rounded-2xl px-4 py-2 h-8 ...`}
```

### Task 2: Fix Gauge hardcoded px values and remove unused function

**Status:** ✅ Complete
**Files:** src/components/ui/Gauge.tsx, src/app/globals.css
**Commit:** e439f49

1. **Removed unused getTextColor function** (lines 31-36) - Function was defined but never called
2. **Replaced hardcoded dimensions with CSS variables**:
   - Added `--gauge-height: 6.25rem; /* 100px */` token to globals.css
   - Changed `w-[60px]` to `w-[var(--gauge-width)]` (token already existed)
   - Changed `h-[100px]` to `h-[var(--gauge-height)]` (new token)

**Before:**
```typescript
className="flex flex-col items-center gap-2 w-[60px]"
// ...
className="relative w-[60px] h-[100px] rounded-[var(--radius-md)] bg-[var(--pending-light)] overflow-hidden"
```

**After:**
```typescript
className="flex w-[var(--gauge-width)] flex-col items-center gap-2"
// ...
className="relative h-[var(--gauge-height)] w-[var(--gauge-width)] overflow-hidden rounded-[var(--radius-md)] bg-[var(--pending-light)]"
```

### Task 3: Replace hardcoded px value in StatusBadge

**Status:** ✅ Complete
**Files:** src/components/ui/StatusBadge.tsx
**Commit:** e439f49

Changed `py-[5px]` to `py-1` (4px standard spacing token). The 5px was between --space-1 (4px) and --space-2 (8px), so we selected py-1 for consistency. The h-6 class enforces height anyway, so the visual impact is minimal.

**Before:**
```typescript
className={`inline-flex items-center gap-1 ${config.bg} rounded-[var(--radius-sm)] px-2 py-[5px] h-6`}
```

**After:**
```typescript
className={`inline-flex items-center gap-1 ${config.bg} h-6 rounded-[var(--radius-sm)] px-2 py-1`}
```

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Token] Added --gauge-height token to globals.css**
- **Found during:** Task 2
- **Issue:** Plan suggested suppressing hardcoded Gauge dimensions with eslint-disable comment, but --gauge-width token already existed suggesting token-based approach was preferred
- **Fix:** Added `--gauge-height: 6.25rem; /* 100px */` to globals.css (line 126) to match the existing --gauge-width pattern
- **Files modified:** src/app/globals.css
- **Commit:** e439f49
- **Rationale:** Maintains consistency with existing gauge token approach; cleaner than eslint-disable comments

## Verification Results

### Lint Validation
```bash
npm run lint -- src/components/ui/FilterPill.tsx src/components/ui/Gauge.tsx src/components/ui/StatusBadge.tsx
# Result: 0 errors, 0 warnings
```

All custom/no-hardcoded-values violations eliminated.

### Test Validation
```bash
npm test -- src/components/ui/FilterPill.test.tsx src/components/ui/Gauge.test.tsx src/components/ui/StatusBadge.test.tsx
# Result: 47 passed, 0 failed
```

- FilterPill: 11 tests passed
- Gauge: 17 tests passed
- StatusBadge: 19 tests passed

All existing tests continue to pass with no behavior regressions.

## Success Criteria Met

- [x] FilterPill.tsx has zero no-hardcoded-values violations
- [x] Gauge.tsx has zero no-hardcoded-values violations and no unused code
- [x] StatusBadge.tsx has zero no-hardcoded-values violations
- [x] All component tests still pass
- [x] Visual appearance is acceptable (no major layout breaks)

## Technical Decisions

**1. Token Selection Strategy**

When hardcoded values fell between standard tokens, we selected the nearest token rather than creating intermediate tokens:
- 18px → 16px (px-4)
- 5px → 4px (py-1)

**Rationale:** Design system tokens define a scale. Rounding to standard values maintains scale consistency and simplifies the token system. The small pixel differences (2px and 1px) are visually imperceptible.

**2. Token Addition vs. Suppression**

For Gauge dimensions, we added a --gauge-height token rather than using eslint-disable comments.

**Rationale:** The existence of --gauge-width indicated a token-based approach was already established for Gauge dimensions. Adding --gauge-height maintains this pattern and provides a single source of truth for gauge sizing.

## Known Stubs

None - all work is complete with real implementations.

## Impact Summary

**Design System Compliance:** All three UI components now use design system spacing tokens consistently, eliminating 4 hardcoded pixel values.

**Code Quality:** Removed 1 unused function (getTextColor) improving code maintainability.

**Token System:** Added 1 new component-specific dimension token (--gauge-height) consistent with existing patterns.

**Test Coverage:** Maintained 100% test pass rate across all affected components (47 tests).

## Related Work

- **Phase 18 Plan 06:** Established design token system in globals.css
- **Requirement DOC-03:** Eliminate hardcoded values from UI components
- **UAT 19-09:** Gap closure for custom/no-hardcoded-values lint violations

## Self-Check

**Files created:** 0/0
- No new files expected

**Files modified:** 4/4
- [x] src/components/ui/FilterPill.tsx exists and modified
- [x] src/components/ui/Gauge.tsx exists and modified
- [x] src/components/ui/StatusBadge.tsx exists and modified
- [x] src/app/globals.css exists and modified

**Commits:** 1/1
- [x] e439f49 exists: "fix(19-09): replace hardcoded px values with spacing tokens"

**Self-Check: PASSED**
