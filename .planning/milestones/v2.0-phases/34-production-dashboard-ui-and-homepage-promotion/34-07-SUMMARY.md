---
phase: 34-production-dashboard-ui-and-homepage-promotion
plan: "07"
subsystem: production-dashboard
tags: [page-rsc, import-flow, integration, uat, inherited-gap-02, tdd]
dependency_graph:
  requires:
    - src/lib/search-params.ts (searchParamsCache — 34-01)
    - src/components/ProductionDashboard.tsx (full prop contract — 34-05, 34-06)
    - src/db/queries/orders.ts (getProductionOrders, getOrderById — Phase 33)
    - src/db/queries/events.ts (getOrderEvents — Phase 33)
    - src/db/queries/imports.ts (getImportBatches — 34-03)
    - src/actions/import.ts (previewImportAction, commitImportAction — Phase 33)
    - src/lib/import-constants.ts (MAX_IMPORT_BYTES — Phase 33)
    - src/components/DashboardLayout.tsx
    - src/lib/auth.ts (checkRole)
  provides:
    - src/app/page.tsx (rewritten: async RSC with live ProductionDashboard data, PROD-01)
    - src/app/import/page.tsx (NEW: /import RSC, D-15)
    - src/components/ImportFlow.tsx (NEW: three-phase import client wrapper)
    - src/components/ImportHistoryTable.tsx (NEW: import batch history table)
    - .planning/phases/34-production-dashboard-ui-and-homepage-promotion/34-HUMAN-UAT.md (NEW: Phase 34 UAT contract + Inherited GAP-02)
  affects:
    - All Phase 34 PROD-* requirements (assembled at page level here)
tech_stack:
  added: []
  patterns:
    - "async RSC page with Promise.all fan-out for parallel query execution (D-09)"
    - "searchParamsCache.parse(searchParams) — await the Promise<SearchParams> (Pitfall 2)"
    - "Three-phase local state machine: 'entry' | 'preview' | 'committed' in ImportFlow"
    - "ImportDecisions type-level cross-phase compile-time contract assertion in test"
    - "Intl.DateTimeFormat locked format for ImportHistoryTable date column (UI-SPEC §8)"
key_files:
  created:
    - src/app/import/page.tsx
    - src/components/ImportFlow.tsx
    - src/components/ImportHistoryTable.tsx
    - src/app/import/__tests__/page.test.tsx
    - src/components/ImportFlow.test.tsx
    - src/components/ImportHistoryTable.test.tsx
    - .planning/phases/34-production-dashboard-ui-and-homepage-promotion/34-HUMAN-UAT.md
  modified:
    - src/app/page.tsx (rewritten from transitional stub to live RSC)
    - src/app/page.test.tsx (rewritten with 8 full RSC tests)
key_decisions:
  - "page.tsx Promise.all fan-out avoids serial DB round-trips when ?order= is set; null/[] are resolved synchronously when absent."
  - "ImportFlow uses a local file reference (currentFile) for commit re-submission — server is stateless (D-05) so the file must be re-sent on every commit call."
  - "ImportHistoryTable does NOT slice the batches array — slicing is the query's job (getImportBatches limit). Test 4 verifies this."
  - "The ImportDecisions type assertion in ImportFlow.test.tsx is a compile-time contract — it doesn't execute at runtime but forces tsc to check the shape against the Phase 33 export."
requirements-completed: [PROD-01, PROD-02, PROD-05, PROD-10]
duration: ~35 minutes
completed: "2026-05-14T21:00:00Z"
---

# Phase 34 Plan 07: Page RSC Layer and Bulk Import Surface Summary

**Async RSC layer assembled: `/` composing ProductionDashboard with live data; `/import` composing ImportFlow + ImportHistoryTable; 34-HUMAN-UAT.md with Inherited GAP-02 step written; 15 automated tests green; tsc clean in new files**

## Performance

- **Duration:** ~35 minutes
- **Started:** 2026-05-14T20:18:46Z
- **Completed:** 2026-05-14T21:00:00Z
- **Tasks:** 2 autonomous (TDD RED + GREEN each) + 1 checkpoint
- **Files modified:** 9 (2 rewritten, 7 created)

## Accomplishments

### Task 1: src/app/page.tsx — Async RSC with Live ProductionDashboard

- `export const dynamic = 'force-dynamic'` — PROD-01 satisfied
- Auth gate (`const { userId } = await auth(); if (!userId) redirect('/sign-in')`) — D-02
- `const canEdit = await checkRole('mill_operator')` — D-03 server-side boolean
- `await searchParamsCache.parse(searchParams)` — Pitfall 2 awaiting Promise<SearchParams>
- `Promise.all([getProductionOrders(), order ? getOrderById(order) : null, order ? getOrderEvents(order) : []])` — D-09 parallel fan-out
- `drawerOrder={drawerOrder}` passed through even when null (Pitfall 7 empty drawer state)
- 8 RSC unit tests GREEN; transitional "Dashboard placeholder" text removed

### Task 2: ImportHistoryTable + ImportFlow + /import Page RSC

- `ImportHistoryTable.tsx`: server component, `Intl.DateTimeFormat` locked format, "No imports yet" empty state, "Recent Imports" heading, 4 column headers, no internal slicing
- `ImportFlow.tsx`: `'use client'`, 3-phase state machine, D-17 size guard (locked error), drag-drop + file picker, D-18 Skip default for duplicates, ImportHistoryTable always visible below
- `src/app/import/page.tsx`: `force-dynamic`, auth redirect, `getImportBatches({ limit: 10 })`, `canEdit` threaded to ImportFlow
- 15 tests GREEN across 3 test files (4 + 8 + 3)
- Test 16: `ImportDecisions` type-level compile-time assertion in ImportFlow.test.tsx

### Task 3 (CHECKPOINT): 34-HUMAN-UAT.md Written (awaiting human UAT execution)

- 12 tests: T1-T11 covering all Phase 34 must-haves + T12 Inherited GAP-02
- T12 verbatim body from `34-INHERITED-UAT.md`: Tab A / Tab B two-tab observation, ≤30s pass criterion
- Frontmatter: `type: human-uat`, `status: pending`, `inherited_from: 33-server-actions-queries-and-bulk-import (GAP-02)`
- All mandatory source assertions satisfied (title, Tab A/B, ≤30s)

## Test Counts

| Suite | Tests | TDD Phase |
|-------|-------|-----------|
| src/app/page.test.tsx | 8 | RED `e95ab73` → GREEN `08a26d0` |
| src/components/ImportHistoryTable.test.tsx | 4 | RED `0b721d7` → GREEN `32771ee` |
| src/components/ImportFlow.test.tsx | 8 | RED `0b721d7` → GREEN `32771ee` |
| src/app/import/__tests__/page.test.tsx | 3 | RED `0b721d7` → GREEN `32771ee` |
| **Automated total** | **23** | |
| 34-HUMAN-UAT.md | 12 | Pending (human UAT) |

## Acceptance Criteria Verification

### page.tsx

- [x] `export const dynamic = 'force-dynamic'` count: 1
- [x] `searchParamsCache.parse` count: 1 (awaited)
- [x] `Promise.all` count: 1
- [x] `getProductionOrders()` count: 1
- [x] `getOrderById(order)` count: ≥ 1
- [x] `getOrderEvents(order)` count: ≥ 1
- [x] `<ProductionDashboard` count: 1
- [x] `redirect('/sign-in')` count: 1
- [x] "Dashboard placeholder" count: 0 (removed)
- [x] `MillReadOnlyStub` count: 0
- [x] All 8 RSC tests green

### ImportHistoryTable.tsx

- [x] "No imports yet" count: ≥ 1
- [x] "Recent Imports" count: ≥ 1
- [x] `Intl.DateTimeFormat` count: ≥ 1

### ImportFlow.tsx

- [x] `MAX_IMPORT_BYTES` count: ≥ 1
- [x] "File exceeds 2 MB limit. Please upload a smaller file." count: ≥ 1
- [x] "Drop your Excel file here" count: ≥ 1
- [x] `previewImportAction` count: ≥ 1
- [x] `commitImportAction` count: ≥ 1
- [x] `accept=".xlsx"` count: ≥ 1
- [x] `'skip'` count: ≥ 1 (D-18 default)

### /import page.tsx

- [x] `force-dynamic` count: 1
- [x] `getImportBatches({ limit: 10 })` count: ≥ 1
- [x] `redirect('/sign-in')` count: 1
- [x] `<ImportFlow` count: 1
- [x] `<DashboardLayout` count: ≥ 1

### 34-HUMAN-UAT.md

- [x] `Inherited: GAP-02 revalidateTag end-to-end (from Phase 33)` count: 1
- [x] "Tab A" count: ≥ 1
- [x] "Tab B" count: ≥ 1
- [x] "≤30s" count: ≥ 1
- [x] 12 numbered test entries (T1..T12)
- [x] Frontmatter: `type: human-uat`, `status: pending`, `inherited_from`

## Task Commits

| Task | Phase | Hash | Message |
|------|-------|------|---------|
| 1 | RED | `e95ab73` | `test(34-07): add failing tests for page.tsx RSC rewrite (TDD red)` |
| 1 | GREEN | `08a26d0` | `feat(34-07): rewrite src/app/page.tsx as async RSC with live ProductionDashboard data` |
| 2 | RED | `0b721d7` | `test(34-07): add failing tests for ImportHistoryTable, ImportFlow, import page RSC (TDD red)` |
| 2 | GREEN | `32771ee` | `feat(34-07): implement ImportHistoryTable, ImportFlow, and /import page RSC` |

## Inherited GAP-02 Closure Status

- **Status:** `pending` — UAT contract written and committed; awaiting human execution
- **UAT file:** `.planning/phases/34-production-dashboard-ui-and-homepage-promotion/34-HUMAN-UAT.md`
- **Test:** T12 "Inherited: GAP-02 revalidateTag end-to-end (from Phase 33)"
- **33-HUMAN-UAT.md amendment:** Pending — will be committed alongside 34-HUMAN-UAT.md test results after UAT runs

## Build Notes

- `npx tsc --noEmit`: clean in all files created/modified by plan 34-07 (pre-existing errors in src/db/schema/__tests__ and src/components/ProductionDashboard.test.tsx are out of scope)
- `npm run build` (Turbopack): fails due to pre-existing `@aws-sdk/client-s3` missing in `unzipper` (via `read-excel-file/node` → `src/actions/import.ts`). This is a pre-existing infrastructure issue present at base commit `85c6e3e` — NOT introduced by plan 34-07. Logged in `deferred-items.md`.
- `npm test`: 729 tests, 715 passed. 14 failures in `src/app/settings/__tests__/page.test.tsx` (pre-existing Clerk ClerkProvider setup issue — NOT introduced by this plan).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Comment in page.tsx contained "await searchParamsCache.parse" substring**
- **Found during:** Task 1 GREEN phase — Test 7 source assertion
- **Issue:** JSDoc comment contained the exact string `searchParamsCache.parse()` and the inline comment `// await searchParamsCache.parse(searchParams)`, causing `grep -c` to return 2 instead of 1.
- **Fix:** Rewrote both comments to describe the concept without repeating the exact grep string.
- **Files modified:** `src/app/page.tsx`
- **Commit:** Included in `08a26d0`

---

**Total deviations:** 1 auto-fixed (Rule 1 — test source assertion mismatch)
**Impact on plan:** Trivial comment wording adjustment. No behavior change.

## Known Stubs

None — all plan-07 goals fully implemented (Tasks 1 and 2). Task 3 is a human checkpoint (UAT execution) — not a code stub.

## Threat Flags

None — all new surface is covered by the plan's STRIDE threat register (T-34-07-01 through T-34-07-10):
- `/` and `/import` auth gates: `auth()` redirect before any DB call
- ImportFlow client-side size guard: layer 1 of 3 (D-17, T-34-07-07)
- canEdit=false hides drop zone: layer 1 of 2 authorization (T-34-07-08)
- React text interpolation for all user data: no dangerouslySetInnerHTML anywhere

## Self-Check: PASSED

### Created files:
- [x] src/app/page.tsx (rewritten) — FOUND
- [x] src/app/page.test.tsx (rewritten) — FOUND
- [x] src/app/import/page.tsx — FOUND
- [x] src/app/import/__tests__/page.test.tsx — FOUND
- [x] src/components/ImportHistoryTable.tsx — FOUND
- [x] src/components/ImportHistoryTable.test.tsx — FOUND
- [x] src/components/ImportFlow.tsx — FOUND
- [x] src/components/ImportFlow.test.tsx — FOUND
- [x] .planning/phases/34-production-dashboard-ui-and-homepage-promotion/34-HUMAN-UAT.md — FOUND

### Commits verified:
- [x] e95ab73 — test(34-07): add failing tests for page.tsx RSC rewrite (TDD red)
- [x] 08a26d0 — feat(34-07): rewrite src/app/page.tsx as async RSC with live ProductionDashboard data
- [x] 0b721d7 — test(34-07): add failing tests for ImportHistoryTable, ImportFlow, import page RSC (TDD red)
- [x] 32771ee — feat(34-07): implement ImportHistoryTable, ImportFlow, and /import page RSC

## TDD Gate Compliance

**Task 1 (page.tsx):**
1. RED: `e95ab73` — 8 tests fail (page signature missing searchParams, no ProductionDashboard, no force-dynamic)
2. GREEN: `08a26d0` — all 8 tests pass

**Task 2 (ImportHistoryTable + ImportFlow + /import page):**
1. RED: `0b721d7` — 15 tests fail ("Cannot find module './ImportHistoryTable'", etc.)
2. GREEN: `32771ee` — all 15 tests pass

No REFACTOR commits needed — implementations were clean on first pass after the inline deviation fix.
