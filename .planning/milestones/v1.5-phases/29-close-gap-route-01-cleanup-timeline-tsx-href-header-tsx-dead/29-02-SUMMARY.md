---
phase: 29-close-gap-route-01-cleanup-timeline-tsx-href-header-tsx-dead
plan: "02"
subsystem: ui
tags: [header, dead-code, tdd, cleanup, react, jest, testing-library]

# Dependency graph
requires:
  - phase: 26-route-migration
    provides: demo-prefixed route branches that replaced the legacy /orders /customers /mill-production paths
provides:
  - "Header.getPageTitle without 3 legacy startsWith fallback branches (D-11)"
  - "Component test locking /orders -> Dashboard behavior against regression"
affects:
  - 29-close-gap-route-01-cleanup-timeline-tsx-href-header-tsx-dead

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "TDD RED/GREEN cycle for dead-code deletion: write failing test first, then delete dead branch"

key-files:
  created: []
  modified:
    - src/components/Header.tsx
    - src/components/__tests__/Header.test.tsx

key-decisions:
  - "D-11: delete 3 legacy startsWith branches (/orders, /mill-production, /customers) from getPageTitle; /orders now returns Dashboard via default fallback"
  - "Reuse existing usePathname: () => '/orders' mock in Header.test.tsx without modification; no new jest.mock needed"

patterns-established:
  - "Dead-code deletion via TDD: add assertion for post-deletion behavior (RED), then delete the dead branch (GREEN)"

requirements-completed:
  - ROUTE-01

# Metrics
duration: 8min
completed: 2026-05-12
---

# Phase 29 Plan 02: Header Dead Branch Cleanup Summary

**Deleted 3 unreachable legacy `startsWith` branches from `Header.getPageTitle` and locked the new `/orders` -> `'Dashboard'` behavior with a TDD regression test**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-05-12T00:00:00Z
- **Completed:** 2026-05-12T00:08:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Added failing RED test asserting `screen.getByRole('heading', { name: 'Dashboard' })` for the `/orders` mock pathname
- Deleted 4 lines from `Header.tsx`: the `// Legacy routes (404 fallback)` comment and 3 `startsWith` branches for `/orders`, `/mill-production`, `/customers`
- All 18 Header tests now pass; the new test guards against accidental reintroduction of legacy title logic

## Task Commits

Each task was committed atomically:

1. **Task 1: RED — add Header test asserting 'Dashboard' for /orders pathname** - `3b6f8e7` (test)
2. **Task 2: GREEN — delete 3 legacy fallback branches from Header.tsx::getPageTitle** - `2a943ab` (fix)

**Plan metadata:** (docs commit follows)

_Note: TDD plan — test commit precedes fix commit per RED/GREEN cycle_

## Files Created/Modified
- `src/components/__tests__/Header.test.tsx` - Added new `it(...)` asserting heading `'Dashboard'` when pathname is `/orders`; reuses existing mock without modification
- `src/components/Header.tsx` - Deleted `// Legacy routes (404 fallback)` comment and 3 `startsWith` branches; `getPageTitle` now has 5 explicit branches plus 1 default

## Decisions Made
- Reused the existing `usePathname: () => '/orders'` mock at lines 51-56 without modification, per RESEARCH.md guidance
- No replacement fallback added for the deleted branches — unmatched paths intentionally fall through to `return 'Dashboard'` (D-11)

## Deviations from Plan

None - plan executed exactly as written.

## TDD Gate Compliance

- RED gate: `test(29-02)` commit `3b6f8e7` — test added and confirmed FAILING (header showed `'Orders'`, not `'Dashboard'`)
- GREEN gate: `fix(29-02)` commit `2a943ab` — legacy branches deleted, test now PASSES (all 18 tests green)
- REFACTOR gate: not needed (deletion is already minimal)

## Issues Encountered
- Jest CLI warning: `--testPathPattern` was replaced by `--testPathPatterns` in this version. Used correct flag; no impact on test execution.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- INT-06 closed: `Header.getPageTitle` no longer contains the 3 unreachable legacy branches
- `getPageTitle` now has exactly 5 explicit branches (3 demo + `/` + `/settings`) and 1 default return
- Ready for remaining Phase 29 plans in the wave

---
*Phase: 29-close-gap-route-01-cleanup-timeline-tsx-href-header-tsx-dead*
*Completed: 2026-05-12*
