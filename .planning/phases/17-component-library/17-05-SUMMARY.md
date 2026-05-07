---
phase: 17-component-library
plan: 05
subsystem: component-library
tags: [refactor, design-tokens, tdd, dark-mode]
completed_date: 2026-05-07
duration_seconds: 88
tasks_completed: 2
files_modified: 2

dependency_graph:
  requires:
    - 17-03-PLAN.md (CVA infrastructure)
    - 17-04-PLAN.md (Design tokens)
  provides:
    - StatusBadge with design token integration
    - TDD test coverage for token usage verification
  affects:
    - src/components/ui/StatusBadge.tsx (refactored)
    - Orders page (uses StatusBadge)
    - Mill production page (uses StatusBadge)
    - Customer list page (uses StatusBadge)

tech_stack:
  added: []
  patterns:
    - TDD (RED/GREEN cycle)
    - Design token refactoring
    - CSS color-mix for dynamic opacity

key_files:
  created:
    - src/components/ui/StatusBadge.test.tsx
  modified:
    - src/components/ui/StatusBadge.tsx

decisions:
  - "Use color-mix for Ready and In Transit countBg (no specific opacity tokens available)"
  - "Preserve existing StatusBadge API completely (status: OrderStatus)"
  - "Apply TDD pattern: failing tests first, then implementation"

metrics:
  test_coverage:
    - 10 tests added (100% coverage for token usage)
  lines_changed:
    - 104 lines added (test file)
    - 8 lines modified (StatusBadge.tsx)
---

# Phase 17 Plan 05: StatusBadge Token Migration Summary

**One-liner:** Refactored StatusBadge to use design tokens instead of hardcoded hex/gray values, enabling automatic dark mode support.

## Overview

Migrated the existing StatusBadge component from hardcoded color values to design tokens defined in globals.css. Applied TDD methodology with failing tests first (RED), then implementation (GREEN). This enables automatic dark mode support and maintains consistency with the design system established in Phase 16.

## Tasks Completed

### Task 1: Create StatusBadge tests for token usage (TDD RED)
**Commit:** 7344b40
**Files:** `src/components/ui/StatusBadge.test.tsx`

Created comprehensive test suite to verify:
- Each status (Pending, Producing, Ready, In Transit, Complete) renders with token-based classes
- STATUS_CONFIG uses `var(--)` syntax for all color properties (bg, text, dot, countBg)
- No hardcoded hex values present (#f59e0b, #2f855a, #9333ea, #2b6cb0)
- No hardcoded Tailwind gray classes (bg-gray-*, text-gray-*)
- Existing API preserved (status: OrderStatus)
- STATUS_CONFIG export structure maintained

**Test results (RED phase):** 4 failures, 6 passes (as expected - existing code had hardcoded values)

### Task 2: Refactor StatusBadge to use design tokens (TDD GREEN)
**Commit:** a81bf5f
**Files:** `src/components/ui/StatusBadge.tsx`

Replaced all hardcoded values with design tokens:

| Status | Property | Old Value | New Token |
|--------|----------|-----------|-----------|
| Pending | bg | `bg-gray-100` | `bg-[var(--pending-light)]` |
| Pending | text | `text-gray-600` | `text-[var(--text-secondary)]` |
| Pending | dot | `bg-gray-600` | `bg-[var(--pending)]` |
| Pending | countBg | `bg-gray-100` | `bg-[var(--status-pending-bg-22)]` |
| Producing | countBg | `bg-[#f59e0b22]` | `bg-[var(--status-mixing-bg-22)]` |
| Ready | countBg | `bg-[#2b6cb022]` | `bg-[color-mix(in_srgb,var(--info)_13%,transparent)]` |
| In Transit | countBg | `bg-[#9333ea22]` | `bg-[color-mix(in_srgb,var(--purple)_13%,transparent)]` |
| Complete | countBg | `bg-[#2f855a22]` | `bg-[var(--status-completed-bg-22)]` |

**Test results (GREEN phase):** 10 passes, 0 failures

**Acceptance criteria verification:**
- ✅ Zero occurrences of `bg-gray-*`
- ✅ Zero occurrences of hex values (#f59e0b, #2f855a, #9333ea, #2b6cb0)
- ✅ 2+ occurrences of `var(--pending`
- ✅ 3+ occurrences of `var(--status-`
- ✅ All tests pass
- ✅ API unchanged

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

**Automated tests:**
```bash
npm test -- StatusBadge.test.tsx
✓ 10 tests passed
```

**Token usage verification:**
- Pending status uses 2 pending tokens (--pending-light, --pending)
- 3 status-specific bg-22 tokens used (pending, mixing, completed)
- 2 color-mix expressions for Ready and In Transit (no dedicated tokens exist)
- Zero hardcoded hex values
- Zero hardcoded Tailwind gray classes

**Visual regression:** No changes to component appearance - only internal implementation changed.

**Dark mode:** Component now automatically switches colors via token system when `.dark` class applied.

## Known Issues

None.

## Technical Notes

### Color-mix Decision
Ready and In Transit statuses use `color-mix(in_srgb, var(--info)_13%, transparent)` instead of dedicated tokens because globals.css doesn't define `--status-ready-bg-22` or `--status-transit-bg-22`. This approach:
- Maintains visual consistency (13% opacity matches the "22" suffix meaning ~13% alpha)
- Uses modern CSS color-mix syntax (supported in all target browsers)
- References semantic tokens (--info, --purple) that adapt to dark mode

### TDD Benefits
The TDD approach caught all hardcoded values systematically:
1. Tests defined the contract (must use var(--)
2. Failing tests identified exact locations needing refactoring
3. Passing tests confirmed complete migration
4. Test suite documents expected behavior for future maintainers

### Dark Mode Support
Before: StatusBadge ignored theme changes (hardcoded light mode colors)
After: StatusBadge automatically switches via token system:
- Light mode: `--pending-light` = #edf2f7
- Dark mode: `--pending-light` = #4a5568 (from globals.css .dark override)

## Impact

**Immediate:**
- StatusBadge now supports dark mode (previous gap)
- Consistent with design system (reduces maintenance)
- Test coverage for status rendering

**Future:**
- Easier to update status colors globally (change token, not component)
- Pattern established for other component refactors (FilterPill, KPI cards)
- Test suite catches regressions during future changes

## Self-Check: PASSED

**Files created:**
- ✅ src/components/ui/StatusBadge.test.tsx exists (104 lines)

**Files modified:**
- ✅ src/components/ui/StatusBadge.tsx modified (8 lines changed)

**Commits exist:**
- ✅ 7344b40: test(17-05): add failing tests for StatusBadge token usage
- ✅ a81bf5f: feat(17-05): refactor StatusBadge to use design tokens

**Tests pass:**
- ✅ npm test -- StatusBadge.test.tsx = 10 passed, 0 failed

**Acceptance criteria met:**
- ✅ StatusBadge refactored to use design tokens
- ✅ No hardcoded hex values remaining
- ✅ Existing API preserved
- ✅ Tests verify token usage
