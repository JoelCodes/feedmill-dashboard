---
phase: 32-schema-migrations-and-seed-data
plan: "05"
subsystem: seed
tags: [seed, json-export, transform, tdd]

dependency_graph:
  requires:
    - 32-02  # DemoOrder type + mockOrders export
  provides:
    - src/db/seed-data.json (33-row validated JSON snapshot for Plan 06 seed runtime)
    - scripts/export-seed.ts (re-runnable exporter)
    - src/db/__tests__/seed-data.test.ts (shape contract test)
  affects:
    - src/db/seed.ts (Plan 06 — consumes seed-data.json)

tech_stack:
  added: []
  patterns:
    - "Pure data transform script (no DB connection, no dotenv)"
    - "TDD RED→GREEN: failing test committed before implementation"
    - "camelCase→snake_case field mapping via mockOrders.map()"
    - "Nullable coercion: undefined → JSON null via ?? null"
    - "Numeric string cast: String(o.weightLbs) for Drizzle numeric columns"

key_files:
  created:
    - scripts/export-seed.ts
    - src/db/seed-data.json
    - src/db/__tests__/seed-data.test.ts
  modified: []

decisions:
  - "Used npx --yes tsx@4.21.0 to run the export script without adding a devDependency (Plan 06 installs tsx permanently)"
  - "Script writes JSON with trailing newline for clean git diffs"
  - "All 33 source orders have textureType and lineCode present — no null values appear in this dataset, but null handling is correct and tested"

metrics:
  duration: "~2 minutes"
  completed: "2026-05-13"
  tasks_completed: 2
  tasks_total: 2
  files_created: 3
  files_modified: 0
requirements-completed:
  - DATA-07
---

# Phase 32 Plan 05: Seed JSON Exporter Summary

**One-liner:** Deterministic camelCase→snake_case transform of 33 mockOrders produces validated seed-data.json with TDD RED/GREEN discipline.

## Tasks Completed

| Task | Type | Name | Commit |
|------|------|------|--------|
| 1 | RED | TDD RED — write seed-data.test.ts asserting JSON shape contract | 0831254 |
| 2 | GREEN | TDD GREEN — scripts/export-seed.ts + seed-data.json | e301268 |

## What Was Built

### `scripts/export-seed.ts`
Re-runnable TypeScript script that:
- Imports `mockOrders` from `src/services/millProduction.ts`
- Maps each DemoOrder to snake_case with these field renames:
  - `orderNumber` → `order_number`
  - `weightLbs` → `weight_lbs` (cast to `String()`)
  - `deliveryTime` → `delivery_time`
  - `millLine` → `mill_line`
  - `textureType` → `texture_type` (`?? null`)
  - `lineCode` → `line_code` (`?? null`)
- Drops `id` (DB generates UUID via `defaultRandom()`)
- Injects `created_by: 'system-seed'` (D-19) and `version: 1` (D-11)
- Writes to `src/db/seed-data.json` with 2-space indent + trailing newline
- No DB connection, no dotenv — pure transform

### `src/db/seed-data.json`
33-row JSON array. All rows pass the shape contract:
- `order_number`, `customer`, `product`, `weight_lbs`, `delivery_time`, `state`, `mill_line`, `created_by` all non-null
- `weight_lbs` stored as string (Drizzle numeric requirement)
- `texture_type` and `line_code` stored as string (all 33 source orders have both fields)
- `created_by` = `"system-seed"` on every row
- `version` = `1` on every row
- State distribution: Blocked (3), Completed (15), Mixing (6), Pending (9)
- Mill line distribution: CGM (11), Excel (11), Premix (11)

### `src/db/__tests__/seed-data.test.ts`
10 assertions across 10 `it()` blocks:
1. is an array
2. has exactly 33 rows
3. every row has required NOT NULL fields
4. all `created_by` = 'system-seed'
5. state values are valid enum members
6. `mill_line` values are valid enum members
7. `weight_lbs` is string on every row
8. `version` is 1 on every row
9. `texture_type` is string|null (never undefined)
10. `line_code` is string|null (never undefined)

## TDD Gate Compliance

| Gate | Commit | Message |
|------|--------|---------|
| RED | 0831254 | `test(32-05): add failing seed-data.json shape contract` |
| GREEN | e301268 | `feat(32-05): implement seed JSON exporter — produces 33-row baseline` |

RED commit predates GREEN commit. `test(...)` commit exists before `feat(...)` commit.

## Verification Results

```
npm test -- --testPathPatterns="src/db/__tests__/seed-data" --watchAll=false
  Tests: 10 passed, 10 total

jq 'length' src/db/seed-data.json          → 33
jq '[.[] | .state] | unique | sort'        → ["Blocked","Completed","Mixing","Pending"]
jq '[.[] | .mill_line] | unique | sort'    → ["CGM","Excel","Premix"]
! grep -q "neon(" scripts/export-seed.ts   → PASS (no DB connection)
```

## Deviations from Plan

None — plan executed exactly as written.

- Task 1 (RED): Test written, confirmed failing with `Cannot find module '../seed-data.json'`, committed.
- Task 2 (GREEN): Script written, JSON generated with `npx --yes tsx@4.21.0 scripts/export-seed.ts`, tests turned GREEN, both artifacts committed.

## Known Stubs

None — all 33 rows are fully wired data from `mockOrders`. No placeholder values.

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns outside the plan's `<threat_model>` scope. T-32-01 (JSON tampering) and T-32-09 (no DB connection) both addressed as planned.

## Self-Check: PASSED

- [x] `scripts/export-seed.ts` exists
- [x] `src/db/seed-data.json` exists with 33 rows
- [x] `src/db/__tests__/seed-data.test.ts` exists
- [x] RED commit `0831254` exists: `git log --all --oneline | grep 0831254` → confirmed
- [x] GREEN commit `e301268` exists: `git log --all --oneline | grep e301268` → confirmed
- [x] RED commit precedes GREEN commit in git log
- [x] 10/10 tests pass
