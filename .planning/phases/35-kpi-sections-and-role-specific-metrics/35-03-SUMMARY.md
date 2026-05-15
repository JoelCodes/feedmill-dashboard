---
phase: 35
plan: "03"
subsystem: lib
tags: [tdd, pure-helper, formula-mix, dwell, lib]
dependency_graph:
  requires: []
  provides:
    - "bucketTexture(raw: string | null): FormulaBucket | null — D-11 texture bucketing"
    - "formatDwell(epochSeconds: number): string — UI-SPEC three-bucket dwell format"
  affects:
    - "Plan 35-04: kpis.ts imports bucketTexture for SQL CASE agreement test"
    - "Plan 35-06: BlockedExceptionList uses formatDwell for server-side dwell string formatting"
tech_stack:
  added: []
  patterns:
    - "Pure function with switch fall-through for case-sensitive string mapping"
    - "Three-branch if/else with Math.floor for integer truncation"
    - "TDD RED → GREEN cycle with module-not-found as RED signal"
key_files:
  created:
    - src/lib/formula-mix.ts
    - src/lib/__tests__/formula-mix.test.ts
    - src/lib/format-dwell.ts
    - src/lib/__tests__/format-dwell.test.ts
  modified: []
decisions:
  - "REFACTOR skipped for both helpers: switch and three-branch if/else are already idiomatic; no improvement possible without adding complexity"
  - "Acceptance criterion grep for Math.round and toUpperCase/toLowerCase/trim matches JSDoc comment text only — no normalization in implementation code"
metrics:
  duration: "3m"
  completed: "2026-05-15"
  tasks_completed: 2
  files_created: 4
  files_modified: 0
---

# Phase 35 Plan 03: Pure Lib Helpers (bucketTexture + formatDwell) Summary

**One-liner:** TDD-built pure helpers implementing D-11 texture bucketing (`bucketTexture`) and UI-SPEC dwell format (`formatDwell`) — 22 unit tests green across both modules.

---

## What Was Built

### `src/lib/formula-mix.ts`

Exports:
- `type FormulaBucket = 'Pellet' | 'Mash' | 'Crumble'` — locked union for downstream type-safety in `kpis.ts` and `BlockedExceptionList.tsx`
- `function bucketTexture(raw: string | null): FormulaBucket | null` — implements D-11's case-sensitive bucketing rule via a `switch` statement with fall-through cases

**D-11 mapping:**
- `'PELLET' | 'SH PELLET'` → `'Pellet'`
- `'MASH'` → `'Mash'`
- `'FINE CR' | 'C. CRUMBLE'` → `'Crumble'`
- `null` or any unrecognized string → `null` (D-12: excluded from KPI-05 denominator)

No imports, no directives. Safely importable from RSC, client, and Node test runner.

### `src/lib/format-dwell.ts`

Exports:
- `function formatDwell(epochSeconds: number): string` — formats Postgres `EXTRACT(EPOCH FROM interval)` output using Math.floor truncation (not rounding)

**UI-SPEC format:**
- `< 3600s` → `"{N}m"` (e.g., `"42m"`)
- `< 86400s` → `"{N}h {M}m"` (e.g., `"2h 14m"`)
- `≥ 86400s` → `"{N}d {M}h"` (e.g., `"1d 3h"`)

No imports, no directives. Safely importable from RSC, client, and Node test runner.

---

## TDD Gate Compliance

### Task 1: bucketTexture

| Gate | Commit | Result |
|------|--------|--------|
| RED | `241f29d` — `test(35-03): RED — assert bucketTexture maps 5 textures + NULL + unrecognized correctly` | All 11 tests failed (Cannot find module) |
| GREEN | `1956e62` — `feat(35-03): GREEN — implement bucketTexture with D-11 case-sensitive bucketing rules` | All 11 tests pass |
| REFACTOR | Skipped — switch with fall-through is already idiomatic; no improvement without complexity | — |

### Task 2: formatDwell

| Gate | Commit | Result |
|------|--------|--------|
| RED | `eab1c7c` — `test(35-03): RED — assert formatDwell formats <1h, 1-24h, 24h+ correctly` | All 11 tests failed (Cannot find module) |
| GREEN | `77e8fb5` — `feat(35-03): GREEN — implement formatDwell with UI-SPEC three-bucket format` | All 11 tests pass |
| REFACTOR | Skipped — three-branch if/else is minimal and correct; no improvement possible | — |

### TDD Gate Sequence: PASSED

RED gate (`test(35-03):` commits) exist BEFORE GREEN gate (`feat(35-03):` commits) for both helpers.

---

## Test Counts

| Suite | Tests | Status |
|-------|-------|--------|
| `src/lib/__tests__/formula-mix.test.ts` | 11 | All pass |
| `src/lib/__tests__/format-dwell.test.ts` | 11 | All pass |
| **Total** | **22** | **All pass** |

---

## Verification Results

- `npm test -- --testPathPatterns="lib/__tests__/(formula-mix|format-dwell)\.test"` — 22 tests green
- `npx tsc --noEmit` — zero errors in new files (`formula-mix.ts`, `format-dwell.ts`, and their test files); pre-existing errors in unrelated files are out of scope
- `grep -c '^import' src/lib/formula-mix.ts src/lib/format-dwell.ts` — both return 0 (pure helpers, no imports)

---

## Downstream Notes

- **Plan 35-04 (`kpis.ts`)** will import `bucketTexture` to drive the SQL CASE agreement test — the test that proves the SQL CASE expression in `kpis.ts` agrees with this helper for every known input. That test is NOT in this plan (per task action: "Do NOT add a CASE-expression-agreement test here").
- **Plan 35-04** will also call `formatDwell` server-side to pre-format the `BlockedExceptionList` dwell strings before passing them in the KPI payload.
- **Plan 35-06 (`BlockedExceptionList.tsx`)** receives the pre-formatted dwell strings — client component stays dumb (no formatting logic in the browser).

---

## Deviations from Plan

None — plan executed exactly as written.

The only minor note: `grep -c "toUpperCase\|toLowerCase\|\.trim"` and `grep -c "Math.round"` match JSDoc comment text in the implementations (the comments explicitly warn against using these functions). The implementation code itself contains no normalization or rounding — all acceptance criteria for the implementation code pass.

---

## Known Stubs

None — both helpers are complete, pure, and ready for downstream consumption.

---

## Threat Flags

No new security-relevant surface introduced. Both helpers are pure value transforms over primitive inputs with no I/O, no network access, and no authentication surface. The STRIDE threat register for this plan (T-35-03-01 through T-35-03-SC) is fully addressed: accepted threats only, no mitigations required.

## Self-Check: PASSED

Files created:
- `src/lib/formula-mix.ts` — FOUND
- `src/lib/__tests__/formula-mix.test.ts` — FOUND
- `src/lib/format-dwell.ts` — FOUND
- `src/lib/__tests__/format-dwell.test.ts` — FOUND

Commits verified:
- `241f29d` (RED formula-mix) — FOUND
- `1956e62` (GREEN formula-mix) — FOUND
- `eab1c7c` (RED format-dwell) — FOUND
- `77e8fb5` (GREEN format-dwell) — FOUND
