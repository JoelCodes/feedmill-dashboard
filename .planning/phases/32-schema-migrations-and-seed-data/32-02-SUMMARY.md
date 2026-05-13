---
phase: 32-schema-migrations-and-seed-data
plan: "02"
subsystem: types
tags: [type-rename, demo-namespace, refactor, D-04]
dependency_graph:
  requires: [32-01]
  provides: [DemoOrder, re-export-shim, mockOrders-export]
  affects: [32-05-export-seed, MillProductionUI, demo-tests]
tech_stack:
  added: []
  patterns: [type-only-re-export, drizzle-inferred-canonical]
key_files:
  created: []
  modified:
    - src/types/millProduction.ts
    - src/services/millProduction.ts
    - src/components/MillProductionUI.tsx
    - src/components/__tests__/MillProductionUI.test.tsx
    - src/app/demo/mill-production/__tests__/page.test.tsx
decisions:
  - "D-04: ProductionOrder (hand-written) → DemoOrder; MillLine + ProductionState re-exported from @/db/schema/orders"
  - "Kept src/types/millProduction.ts as re-export shim (per CONTEXT.md Claude's Discretion)"
  - "export const mockOrders added to services for Plan 05 scripts/export-seed.ts consumption"
metrics:
  duration: "~10 minutes"
  completed: "2026-05-13"
  tasks_completed: 3
  tasks_total: 3
  files_modified: 5
---

# Phase 32 Plan 02: Demo Type Rename (D-04) Summary

**One-liner:** Renamed hand-written `ProductionOrder` to `DemoOrder` with `MillLine`/`ProductionState` becoming type-only re-exports from `@/db/schema/orders`, making Drizzle-inferred `ProductionOrder` the canonical project-wide type.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Rewrite src/types/millProduction.ts | ef38fe1 | src/types/millProduction.ts |
| 2 | Update src/services/millProduction.ts | df2fc67 | src/services/millProduction.ts |
| 3 | Update three demo consumers + verify TS build | 0187c43 | MillProductionUI.tsx, MillProductionUI.test.tsx, page.test.tsx |

## What Was Built

### Task 1 — src/types/millProduction.ts rewrite

Rewrote the file as a re-export shim per D-04:
- Removed hand-written `MillLine = "Premix" | "Excel" | "CGM"` union
- Removed hand-written `ProductionState = "Completed" | ...` union
- Added `export type { MillLine, ProductionState } from '@/db/schema/orders'` (now derived from Drizzle enum, single source of truth)
- Renamed `ProductionOrder` interface → `DemoOrder` (same 9 fields: id, orderNumber, customer, product, weightLbs, deliveryTime, state, millLine, textureType?, lineCode?)
- Removed `ProductionOrder` export entirely

### Task 2 — src/services/millProduction.ts edits

Three mechanical changes (type-only, array contents preserved byte-identical):
- Import: `ProductionOrder, MillLine` → `DemoOrder, MillLine`
- `const mockOrders: ProductionOrder[]` → `export const mockOrders: DemoOrder[]` (added `export` for Plan 05)
- Both function return types: `Promise<ProductionOrder[]>` → `Promise<DemoOrder[]>`

### Task 3 — Three demo consumer updates

Renamed `ProductionOrder` → `DemoOrder` in all three consumer files:
- `src/components/MillProductionUI.tsx`: import + 6 type annotations updated
- `src/components/__tests__/MillProductionUI.test.tsx`: import + fixture type updated
- `src/app/demo/mill-production/__tests__/page.test.tsx`: import + fixture type updated (function name `getProductionOrders` preserved)

## Verification Results

- `npx tsc --noEmit`: exits 0 (full project type-clean)
- `npm test -- --testPathPatterns="(MillProductionUI|demo/mill-production|src/db/schema)" --watchAll=false`: 26/26 tests pass across 6 suites
- Project-wide `ProductionOrder` type references: now ONLY in `src/db/schema/orders.ts` (canonical Drizzle-inferred type) and `src/db/schema/__tests__/orders.test.ts` (schema tests)
- All imports from `@/types/millProduction` now use `DemoOrder` — zero remaining `ProductionOrder` type imports outside the schema barrel

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] replace_all accidentally renamed function name `getProductionOrders` → `getDemoOrders`**
- **Found during:** Task 3 consumer update of page.test.tsx
- **Issue:** Using `replace_all` on string `ProductionOrder` matched the function name `getProductionOrders` (substring match), incorrectly renaming it to `getDemoOrders`
- **Fix:** Immediately ran a second `replace_all` to revert `getDemoOrders` → `getProductionOrders` in page.test.tsx
- **Files modified:** src/app/demo/mill-production/__tests__/page.test.tsx
- **Commit:** 0187c43 (same task commit — fixed before staging)

**2. [Rule 3 - Blocking] Worktree base commit mismatch**
- **Found during:** Startup — Plan 01 schema files not present in worktree
- **Issue:** Worktree was initialized at commit `9ef9781` (pre-Phase-32), missing `src/db/schema/orders.ts` and sibling files needed for the `@/db/schema/orders` re-export
- **Fix:** Per `<worktree_branch_check>` protocol, ran `git reset --hard 170846187a6ad7f60eec3425d79d99a88c75ca97` to align worktree base with main (which already has Plan 01 merged)
- **Files modified:** All Plan 01 schema files became available after reset
- **Impact:** None — reset only advanced the worktree HEAD to the expected base; no prior work lost

## Known Stubs

None. All five modified files are complete and functional. The `mockOrders` array is fully populated (33 orders, all fields present). `DemoOrder` interface mirrors the prior `ProductionOrder` shape 1:1. Demo continues to function identically.

## Threat Flags

None. This plan is a pure TypeScript type rename — no new network endpoints, no auth paths, no schema changes, no file I/O. Security surface unchanged.

## Self-Check: PASSED

- src/types/millProduction.ts: FOUND (exports DemoOrder, re-exports MillLine/ProductionState)
- src/services/millProduction.ts: FOUND (exports mockOrders as DemoOrder[])
- src/components/MillProductionUI.tsx: FOUND (imports DemoOrder, no ProductionOrder type refs)
- src/components/__tests__/MillProductionUI.test.tsx: FOUND (imports DemoOrder)
- src/app/demo/mill-production/__tests__/page.test.tsx: FOUND (imports DemoOrder)
- Commits ef38fe1, df2fc67, 0187c43: all present in git log
- TypeScript build: PASSED (tsc --noEmit exits 0)
- Tests: PASSED (26/26 across 6 suites)
