---
phase: 29
plan: 01
subsystem: ui-components
tags:
  - cleanup
  - href-migration
  - tdd
  - route-fix
dependency_graph:
  requires: []
  provides:
    - Timeline order-event Link pointing to /demo/orders (live route)
    - Component test locking href shape against regression
  affects:
    - src/components/ui/Timeline.tsx
    - src/components/ui/Timeline.test.tsx
tech_stack:
  added: []
  patterns:
    - TDD RED/GREEN cycle for href fix
    - Jest component test with next/link mock for href assertion
key_files:
  modified:
    - src/components/ui/Timeline.tsx
    - src/components/ui/Timeline.test.tsx
decisions:
  - "D-05: href changed from /orders to /demo/orders in Timeline.tsx line 123"
  - "D-06: existing Timeline.test.tsx assertion updated to /demo/orders (not a new file)"
metrics:
  duration: 59s
  completed: 2026-05-12T18:38:37Z
  tasks_completed: 2
  tasks_total: 2
  files_modified: 2
---

# Phase 29 Plan 01: Timeline href fix (TDD RED/GREEN) Summary

**One-liner:** Fixed Timeline.tsx Link href from `/orders` to `/demo/orders` via TDD cycle, closing INT-01/FLOW-01 blocker with a component test locking the route shape.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | RED — update Timeline href assertion to /demo/orders | c4f9ac8 | src/components/ui/Timeline.test.tsx |
| 2 | GREEN — change Timeline.tsx href to /demo/orders | 963bd1a | src/components/ui/Timeline.tsx |

## What Was Built

### Task 1 (RED)
Updated the existing assertion on line 82 of `src/components/ui/Timeline.test.tsx` from:
```
expect(link).toHaveAttribute('href', '/orders?selected=order-1');
```
to:
```
expect(link).toHaveAttribute('href', '/demo/orders?selected=order-1');
```
The test immediately failed against the stale Timeline.tsx href, confirming the RED state was exercising the correct code path.

### Task 2 (GREEN)
Changed the href template literal on line 123 of `src/components/ui/Timeline.tsx` from:
```
href={`/orders?selected=${event.orderId}`}
```
to:
```
href={`/demo/orders?selected=${event.orderId}`}
```
All 18 Timeline tests passed after this fix, confirming GREEN state.

## Verification Results

- `npm test -- --testPathPatterns=Timeline`: 18 passed, 0 failed
- `grep -c "/demo/orders?selected=" src/components/ui/Timeline.tsx`: 1
- `grep -c "'/demo/orders?selected=order-1'" src/components/ui/Timeline.test.tsx`: 1
- Bare `/orders?selected=` in either file: 0 matches

## TDD Gate Compliance

| Gate | Commit | Status |
|------|--------|--------|
| RED (test commit) | c4f9ac8 | PASSED — test(29-01) commit confirmed failing |
| GREEN (implementation commit) | 963bd1a | PASSED — fix(29-01) commit confirmed passing |

## Decisions Made

- **D-05 applied:** Changed Timeline.tsx line 123 href from `/orders` to `/demo/orders` (one-line fix)
- **D-06 applied:** Updated existing Timeline.test.tsx assertion (did NOT create a new file — per Pitfall 1 in RESEARCH.md)

## Deviations from Plan

None — plan executed exactly as written. The existing `Timeline.test.tsx` was updated (not recreated), consistent with the RESEARCH.md Pitfall 1 warning.

## Known Stubs

None. The href now points to the live `/demo/orders` route; the component test asserts the full path including `?selected=order-1`.

## Threat Flags

None. This change only fixes a broken internal navigation href. No new network endpoints, auth paths, or security-relevant surface introduced.

## Self-Check: PASSED

- `src/components/ui/Timeline.tsx` exists: FOUND
- `src/components/ui/Timeline.test.tsx` exists: FOUND
- Commit c4f9ac8 (RED): FOUND
- Commit 963bd1a (GREEN): FOUND
- All 18 Timeline tests pass: CONFIRMED
