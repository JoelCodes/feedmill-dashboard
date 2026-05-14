---
phase: 33-server-actions-queries-and-bulk-import
plan: "06"
subsystem: server-actions/import
tags:
  - server-actions
  - xlsx-import
  - commit
  - mutation
  - tdd
  - auth
dependency_graph:
  requires:
    - 33-05  # previewImportAction, parseAndValidate, detectIntraFileDuplicates, detectDbDuplicates helpers
    - 33-02  # production-orders cache tag contract
    - 33-04  # revalidateTag('production-orders', 'max') project convention
  provides:
    - commitImportAction (FormData + ImportDecisions -> CommitResult)
    - ImportDecisions type export
    - CommitRowResult type export
    - CommitResult type export
  affects:
    - src/actions/import.ts (extended — commitImportAction appended)
    - src/actions/__tests__/import-commit.test.ts (created)
    - src/actions/__tests__/import-preview.test.ts (Test 15 updated: source-assert to behavioral)
    - docs/security-patterns.md (§1 audit row updated to include commitImportAction)
tech_stack:
  added: []
  patterns:
    - D-05: stateless server re-parse on commit (no server-side state between preview/commit)
    - D-08: per-row sequential Neon HTTP inserts (no multi-statement transactions)
    - D-10/D-11/D-13: overwrite path preserves state, bumps version via sql`version+1`, writes [OVERWRITE] event
    - D-07: import_batches row only on committedCount > 0
    - RESEARCH.md Open Question 2 YES: initial-insert orderEvents with fromState=null, toState='Pending'
    - TDD: RED (67c4120) -> GREEN (8418486) -> REFACTOR (0d454c6)
key_files:
  created:
    - src/actions/__tests__/import-commit.test.ts
  modified:
    - src/actions/import.ts
    - src/actions/__tests__/import-preview.test.ts
    - docs/security-patterns.md
decisions:
  - "formulaType not in productionOrders schema — removed from INSERT and UPDATE calls (deviation from plan spec which assumed the column existed; schema has no formula_type column)"
  - "revalidateTag uses ('production-orders', 'max') per project convention established in transitions.ts — plan spec showed single-arg form but TypeScript and project patterns require the second arg"
  - "Test 15 in import-preview.test.ts changed from source-assert (file has no revalidateTag) to behavioral assert (previewImportAction does not call revalidateTag) — source-assert was invalidated once commitImportAction added revalidateTag to the same file"
  - "processRow helper extraction skipped — continue semantics in the for-loop make extraction non-trivial; JSDoc documents the same contracts clearly in-place"
metrics:
  duration: "~35 minutes"
  completed_date: "2026-05-13"
  tasks_completed: 3
  files_created: 1
  files_modified: 3
---

# Phase 33 Plan 06: commitImportAction — XLSX Import Commit Summary

## One-liner

`commitImportAction(FormData, ImportDecisions) -> CommitResult` with D-05 stateless re-parse, per-row insert/overwrite/skip loop, `[OVERWRITE] batch_id=` audit events, partial-import semantics (D-08), and `import_batches` row on success (D-07).

## What Was Built

### src/actions/import.ts (598 lines, extended from 337)

**New exports added (appended to previewImportAction file):**
- `ImportDecisions` — `{ skipRows: number[]; overwriteRows: number[] }`
- `CommitRowResult` — discriminated union per-row result
- `CommitResult` — discriminated union overall result
- `commitImportAction(formData: FormData, decisions: ImportDecisions): Promise<CommitResult>`

**New imports added:**
- `{ orderEvents } from '@/db/schema/events'`
- `{ importBatches } from '@/db/schema/imports'`
- `{ sql, eq } from 'drizzle-orm'` (sql for `version + 1` literal; eq for WHERE clauses)
- `{ auth } from '@clerk/nextjs/server'` (userId for createdBy/changedBy/importedBy)
- `{ revalidateTag } from 'next/cache'`

**commitImportAction flow:**
1. `await requireRole('mill_operator')` (AUTH-02 — first line)
2. `await auth()` to get userId
3. Extract file from FormData; validate size (same 3-layer defense as preview)
4. Re-parse via `parseAndValidate(buffer)` — D-05: server is stateless, identical pipeline to preview
5. Re-run `detectIntraFileDuplicates` + `detectDbDuplicates` (Pitfall 7)
6. Pre-generate `batchId = crypto.randomUUID()` — stable reference for `[OVERWRITE]` notes
7. Per-row loop:
   - **Skip** (`decisions.skipRows`): push `{ ok: true, action: 'skipped' }` (skip wins over overwrite)
   - **Zod error**: push `{ ok: false, action: 'insert', error: ... }` — no DB call
   - **Overwrite** (`decisions.overwriteRows`): SELECT existing → UPDATE (preserves state, bumps version) → INSERT orderEvents with `[OVERWRITE] batch_id=${batchId}` note
   - **Insert**: INSERT productionOrders + INSERT orderEvents with `fromState: null, toState: 'Pending', note: 'Imported from XLSX'`
   - Each path wrapped in try/catch (partial-import per D-08)
8. Count `committedCount` vs `failedCount`
9. If `committedCount === 0`: return without import_batches insert or revalidateTag
10. Insert `import_batches` row with `rowCount: committedCount` (D-07 exact wording)
11. `revalidateTag('production-orders', 'max')` — TRANS-07 mutation invariant
12. Return `{ ok: true, batchId, committedCount, failedCount, results }`

### src/actions/__tests__/import-commit.test.ts (894 lines, created)

23 contract tests covering:
- Test 1: re-parse (D-05) — readXlsxFile called once per commit
- Test 2: happy path insert — 2 rows, committedCount=2, db.insert(orders) × 2 + events × 2 + batches × 1
- Test 3: skip filter (D-12)
- Test 4: overwrite path calls db.update (not db.insert for orders)
- Test 5: overwrite event row — fromState === toState === existing.state (D-11)
- Test 6: overwrite version bump via sql literal (not plain number)
- Test 7: initial-insert event row — fromState=null, toState='Pending', note='Imported from XLSX'
- Test 8: partial-import — failed row does not abort batch; committedCount=2 failedCount=1
- Test 9: import_batches values — correct fileName, rowCount=committedCount, importedBy=userId
- Test 10: import_batches NOT inserted when committedCount=0 (D-07)
- Test 11: revalidateTag called on successful commit
- Test 12: revalidateTag NOT called when committedCount=0
- Test 13: AUTH-02 — requireRole('mill_operator') called first
- Test 14: weightLbs as string (CR-01 numeric boundary)
- Test 15: millLine='Premix' (D-16)
- Test 16: createdBy=userId
- Test 17: state='Pending' for new inserts
- Test 18: version=1 for new inserts
- Test 19: deliveryTime conversion (Date → 'YYYY-MM-DD')
- Test 20: Zod-failed rows not committed
- Test 21: skipRows wins over overwriteRows for same rowIndex
- Test 22: source-assert — revalidateTag('production-orders') in file
- Test 23: source-assert — `[OVERWRITE] batch_id=` in file

## TDD Commits

| Phase | Commit | Description |
|-------|--------|-------------|
| RED   | `67c4120` | 23 failing contract tests |
| GREEN | `8418486` | commitImportAction implementation + test fixes = 39/39 pass |
| REFACTOR | `0d454c6` | security-patterns.md row updated |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] formulaType not in productionOrders schema**
- **Found during:** Task 2 (GREEN TypeScript check)
- **Issue:** Plan spec's `<interfaces>` included `formulaType` in both INSERT and UPDATE payloads. The actual `productionOrders` schema has no `formula_type` column (schema has: orderNumber, customer, product, weightLbs, deliveryTime, state, millLine, textureType, lineCode, version, createdBy, createdAt, updatedAt).
- **Fix:** Removed `formulaType` from both the UPDATE `.set()` and INSERT `.values()` calls. Added comment noting the absence: "formulaType omitted — not in productionOrders schema".
- **Files modified:** `src/actions/import.ts`
- **Commit:** `8418486`

**2. [Rule 1 - Bug] revalidateTag TypeScript signature requires second argument**
- **Found during:** Task 2 (GREEN TypeScript check)
- **Issue:** Plan spec showed `revalidateTag('production-orders')` with one argument. The TypeScript type definition for `revalidateTag` in this Next.js 16.1.6 project requires 2 arguments. All existing calls in `transitions.ts` use `('production-orders', 'max')`.
- **Fix:** Changed to `revalidateTag('production-orders', 'max')` to match project convention. Updated Test 11 assertion and Test 22 source-assert regex to match.
- **Files modified:** `src/actions/import.ts`, `src/actions/__tests__/import-commit.test.ts`
- **Commit:** `8418486`

**3. [Rule 1 - Bug] Test 15 in import-preview.test.ts invalidated by plan 33-06**
- **Found during:** Task 2 (GREEN — import-preview tests would fail when running both suites)
- **Issue:** Test 15 in `import-preview.test.ts` source-asserted `expect(source).not.toMatch(/revalidateTag\(/)` — i.e., the file contains no `revalidateTag`. Plan 33-06 adds `revalidateTag` to the same file. The test was written in plan 33-05 with a note "plan 33-06 adds it for commitImportAction" — meaning it was always expected to become invalid.
- **Fix:** Changed Test 15 from source-assert to behavioral assert: `expect(jest.mocked(revalidateTag)).not.toHaveBeenCalled()` after calling `previewImportAction`. The behavioral check is the stronger guarantee anyway.
- **Files modified:** `src/actions/__tests__/import-preview.test.ts`
- **Commit:** `8418486`

**4. [Rule 1 - Bug] db.select mock consumed by detectDbDuplicates before overwrite path**
- **Found during:** Task 1 RED → Task 2 GREEN first run
- **Issue:** Tests 4, 5, 6 set `mockSelectWhere.mockResolvedValueOnce([{ id: 'existing-id', state: 'Mixing' }])` but `commitImportAction` calls `db.select` TWICE: once in `detectDbDuplicates` and once in the overwrite-path existing-row lookup. The first `mockResolvedValueOnce` was consumed by `detectDbDuplicates`, leaving the overwrite lookup with the default `[]` response.
- **Fix:** Updated Tests 4, 5, 6 to chain two `mockResolvedValueOnce` calls: first returns `[]` (detectDbDuplicates), second returns the existing row (overwrite lookup).
- **Files modified:** `src/actions/__tests__/import-commit.test.ts`
- **Commit:** `8418486`

**5. [Rule 1 - Bug] makeFile uses Blob instead of File — fileName lost in FormData**
- **Found during:** Task 2 GREEN (Test 9 failure: fileName='blob' instead of 'my-orders.xlsx')
- **Issue:** jsdom's `FormData.set(key, blob)` with a Blob sets filename to "blob". The action reads `fileObj.name` to get the original filename. Preview tests used `blob as unknown as File` but that pattern loses the name in FormData.
- **Fix:** Updated `makeFile` helper in commit tests to use `new File([...], name, { type })` which preserves the filename through FormData. File constructor is available in jsdom.
- **Files modified:** `src/actions/__tests__/import-commit.test.ts`
- **Commit:** `8418486`

## Requirements Closed

| Requirement | Description | Closed By |
|-------------|-------------|-----------|
| IMPORT-04 | Partial-import semantics with row-level error reporting | Per-row try/catch; CommitResult.results[] per row |
| IMPORT-05 | Duplicate detection + skip/overwrite per row | decisions.skipRows/overwriteRows; re-runs detectDbDuplicates |
| IMPORT-06 | import_batches row on successful commit | db.insert(importBatches).values({ rowCount: committedCount }) |

## Phase 33 Requirements Status

All 14 Phase 33 requirements (TRANS-01..07 + IMPORT-01..07) are now satisfied:

| Req | Description | Plan |
|-----|-------------|------|
| TRANS-01 | transitionToMixing action | 33-04 |
| TRANS-02 | completeOrder action | 33-04 |
| TRANS-03 | blockOrder action | 33-04 |
| TRANS-04 | resumeFromBlocked action | 33-04 |
| TRANS-05 | Version-based optimistic concurrency | 33-04 |
| TRANS-06 | orderEvents audit trail | 33-04 |
| TRANS-07 | revalidateTag('production-orders') after mutations | 33-04, 33-06 |
| IMPORT-01 | Upload via FormData | 33-05 |
| IMPORT-02 | Server-side parse with read-excel-file | 33-05 |
| IMPORT-03 | Preview shows row count, total weight, duplicates | 33-05 |
| IMPORT-04 | Partial-import semantics | 33-06 |
| IMPORT-05 | Duplicate detection + skip/overwrite | 33-06 |
| IMPORT-06 | import_batches log on success | 33-06 |
| IMPORT-07 | Server-side 2MB size validation | 33-05 |

ROADMAP SC#5 seam: Phase 33 delivers server-side guard (`MAX_IMPORT_BYTES` constant + action-body check + framework `bodySizeLimit`). Phase 34 wires the client-side `<input>` size check using `MAX_IMPORT_BYTES`. The `import_batches` log and operator preview+confirm flow are fully implemented at the action layer.

## Known Stubs

None — all data sources are wired. `commitImportAction` writes real data to real tables; `previewImportAction` reads real data from real tables. Phase 34 wires the UI form.

## Threat Surface

No new threat surface beyond what the plan's `<threat_model>` anticipated.

| Threat ID | Mitigation Status |
|-----------|-------------------|
| T-33-AuthZ | CLOSED — requireRole('mill_operator') first line, Test 13 |
| T-33-Audit | CLOSED — overwrite event with [OVERWRITE] note (Test 4, 5); initial-insert event (Test 7) |
| T-33-Stale | CLOSED — overwrite bumps version via sql`version+1` (Test 6) |
| T-33-DoS | CLOSED — file.size guard re-checked on commit (separate upload) |
| T-33-PartialFailure | ACCEPTED — per-row try/catch; no multi-statement transaction (CR-02, D-08); documented in JSDoc |
| T-33-CacheTagDrift | CLOSED — revalidateTag('production-orders', 'max') verified by Test 11 + Test 22 |

## Self-Check: PASSED

| Check | Result |
|-------|--------|
| `src/actions/import.ts` exists and has commitImportAction | FOUND |
| `src/actions/__tests__/import-commit.test.ts` exists | FOUND |
| `docs/security-patterns.md` updated | FOUND |
| Commit `67c4120` (RED) exists | FOUND |
| Commit `8418486` (GREEN) exists | FOUND |
| Commit `0d454c6` (REFACTOR) exists | FOUND |
| 39/39 tests pass (preview + commit) | PASS |
| `npx tsc --noEmit` clean for actions/import.ts | PASS |
| previewImportAction still exported (no regression) | PASS |
| MAX_IMPORT_BYTES still exported (no regression) | PASS |
