---
phase: 33-server-actions-queries-and-bulk-import
plan: "05"
subsystem: server-actions/import
tags:
  - server-actions
  - xlsx-import
  - preview
  - tdd
  - auth
dependency_graph:
  requires:
    - 33-01  # read-excel-file dependency installed
    - 33-03  # productionOrderImportSchema from import-schema.ts
  provides:
    - previewImportAction (FormData -> PreviewResult)
    - MAX_IMPORT_BYTES exported constant (Phase 34 client-side guard seam)
    - parseAndValidate / detectIntraFileDuplicates / detectDbDuplicates helpers (plan 33-06 seam)
  affects:
    - src/actions/import.ts (created)
    - src/actions/__tests__/import-preview.test.ts (test bug fixes)
    - docs/security-patterns.md (audit table row added)
tech_stack:
  added:
    - read-excel-file/node (prop-based schema format, RESEARCH.md §3)
    - drizzle-orm inArray (batch duplicate SELECT)
  patterns:
    - server action with 'use server' directive (line 1)
    - requireRole guard as first action body statement (AUTH-02)
    - TDD: RED (df258c6) -> GREEN (49f62d7) -> REFACTOR (6c0b67a)
key_files:
  created:
    - src/actions/import.ts
  modified:
    - src/actions/__tests__/import-preview.test.ts
    - docs/security-patterns.md
decisions:
  - "D-05: previewImportAction is mutation-free (no db.insert, no revalidateTag) — all writes are deferred to commitImportAction (plan 33-06)"
  - "D-16: Book1.xlsx has no Mill Line column; every imported row defaults to millLine='Premix' via hard-coded injection before Zod validation"
  - "Schema type: read-excel-file 9.x TypeScript types use new typed-Schema API; runtime uses legacy prop-based format — resolved via double-cast through unknown to avoid type mismatch while preserving correct runtime behavior"
  - "jsdom FormData fix: test's makeFile helper updated to create real Blob (new Uint8Array(size)) so .size property is accurate and FormData.set stores it properly in the test environment"
  - "TDZ fix: jest.mock @/db factory wrapped direct mock references in arrow functions to avoid temporal dead zone errors from SWC jest transform hoisting"
metrics:
  duration: "~45 minutes"
  completed_date: "2026-05-14"
  tasks_completed: 3
  files_created: 1
  files_modified: 2
requirements-completed:
  - IMPORT-01
  - IMPORT-02
  - IMPORT-03
  - IMPORT-07
---

# Phase 33 Plan 05: previewImportAction — Read-Only XLSX Import Preview Summary

## One-liner

`previewImportAction(FormData) -> PreviewResult` with 3-layer DoS guard, `read-excel-file/node` parse, per-row Zod validation, intra-file + DB duplicate detection, and exported `MAX_IMPORT_BYTES` constant for Phase 34 client-side guard seam.

## What Was Built

### src/actions/import.ts (337 lines, created)

**Exports:**
- `MAX_IMPORT_BYTES = 2 * 1024 * 1024` — layer 2 DoS guard constant (layer 1 = Phase 34 client, layer 3 = Next.js framework)
- `PreviewRow`, `PreviewSummary`, `PreviewResult` — type aliases per D-06 interface spec
- `previewImportAction(formData: FormData): Promise<PreviewResult>` — the server action

**Private helpers:**
- `dateToIsoString(d: unknown): string` — converts read-excel-file Date cells to YYYY-MM-DD (Assumption A1)
- `parseAndValidate(buffer: Buffer): Promise<PreviewRow[]>` — parse + Zod validate, side-effect free; called by BOTH preview and (plan 33-06) commit
- `detectIntraFileDuplicates(rows: PreviewRow[]): PreviewRow[]` — single-pass Set, Pitfall 7 documented
- `detectDbDuplicates(orderNumbers: string[]): Promise<Set<string>>` — batch SELECT with inArray, empty-array short-circuit

**Action flow:**
1. `await requireRole('mill_operator')` (AUTH-02 — first line)
2. Extract file from FormData; return validation error if null/string
3. Size guard: `file.size > MAX_IMPORT_BYTES` → `{ ok: false, code: 'validation', message: 'File exceeds 2MB limit.' }`
4. Convert to Buffer → `parseAndValidate` → `detectIntraFileDuplicates` → `detectDbDuplicates`
5. Flag DB duplicates that weren't already intra-file duplicates
6. Compute summary (rowCount, totalWeight, validCount, duplicateCount, errorCount)
7. Return `{ ok: true, summary, rows }` or `{ ok: false, code: 'server' }` on unexpected error

## TDD Commits

| Phase | Commit | Description |
|-------|--------|-------------|
| RED   | `df258c6` | 16 failing contract tests (prior agent) |
| GREEN | `49f62d7` | Implementation + test fixes = 16/16 pass |
| REFACTOR | `6c0b67a` | Duplicate comment cleanup, security-patterns.md row |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] jest.mock @/db factory TDZ error (SWC hoisting)**
- **Found during:** Task 2 (GREEN first run)
- **Issue:** `import-preview.test.ts` had `jest.mock('@/db', () => ({ db: { select: mockSelect, ... } }))` with direct const references. Next.js SWC jest transform hoists `jest.mock` above `const` declarations, causing "Cannot access 'mockSelect' before initialization" (temporal dead zone).
- **Fix:** Wrapped each direct reference in an arrow function: `select: (...args) => mockSelect(...args)`. Wrapper functions close over the variables by reference and resolve at call time (after declarations execute). This is the same pattern used by `src/db/queries/__tests__/orders.test.ts` which already works.
- **Files modified:** `src/actions/__tests__/import-preview.test.ts`
- **Commit:** `49f62d7`

**2. [Rule 1 - Bug] makeFile stub incompatible with jsdom FormData**
- **Found during:** Task 2 (GREEN first run)
- **Issue:** `makeFile()` returned a plain object `{ size, name, arrayBuffer: ... }` cast as `File`. jsdom's `FormData.set(key, value)` converts non-Blob values to their string representation (`[object Object]`), so `formData.get('file')` returned the string `"[object Object]"` not the stub. Additionally, jsdom's `Blob.prototype.arrayBuffer` is not implemented (returns undefined).
- **Fix:** Changed `makeFile` to create a real `Blob` with `new Uint8Array(size)` content so: (a) FormData stores it properly as a Blob object, (b) the natural `.size` property equals the requested size (important for Test 1: size > MAX_IMPORT_BYTES guard). Also updated `previewImportAction` to check `typeof file === 'string'` instead of `instanceof Blob` for broader compatibility, and to call `arrayBuffer?.()` defensively.
- **Files modified:** `src/actions/__tests__/import-preview.test.ts`, `src/actions/import.ts`
- **Commit:** `49f62d7`

**3. [Rule 1 - Bug] read-excel-file 9.x TypeScript Schema type mismatch**
- **Found during:** Task 2 TypeScript check
- **Issue:** `import readXlsxFile, { type Schema } from 'read-excel-file/node'` - the `Schema` type in 9.x uses the new typed-Schema API (`{ [outputKey]: { column: ..., type, required } }`), not the legacy prop-based format (`{ 'Column Title': { prop, type, required } }`). TypeScript errors: TS2707 (generic type requires arguments), TS2339 (`.rows`/`.errors` don't exist on return type), TS2353 (`schema` not in `Options`).
- **Fix:** Typed `xlsxSchema` as `Record<string, unknown>` and double-cast `readXlsxFile` through `unknown` to a local type alias (`XlsxFn`) that matches the runtime API. Runtime behavior is correct; the cast bypasses the TypeScript discrepancy without changing behavior.
- **Files modified:** `src/actions/import.ts`
- **Commit:** `49f62d7`

**4. [Rule 2 - Missing defensive check] revalidateTag in JSDoc comment triggered Test 15**
- **Found during:** Task 2 first run (Test 15 failure)
- **Issue:** Test 15 source-asserts that `import.ts` does not contain `revalidateTag(`. A JSDoc comment had `` * - No `revalidateTag()` `` which matched the regex.
- **Fix:** Rewrote JSDoc line to "No cache revalidation (revalidateTag not called)" — equivalent meaning, does not match the regex.
- **Files modified:** `src/actions/import.ts`
- **Commit:** `49f62d7`

## Requirements Closed

| Requirement | Description | Closed By |
|-------------|-------------|-----------|
| IMPORT-01 | Upload via FormData | previewImportAction accepts FormData with 'file' key |
| IMPORT-02 | Server-side parse with read-excel-file 9.0.9 | parseAndValidate uses read-excel-file/node |
| IMPORT-03 | Preview shows row count, total weight, duplicates | summary.{rowCount,totalWeight,duplicateCount} |
| IMPORT-07 | Server-side size validation (layer 2) | file.size > MAX_IMPORT_BYTES guard |

## Plan 33-06 Seams

These items are intentionally NOT in this plan — `commitImportAction` (plan 33-06) adds them to the same file:

- `db.insert(...)` calls for `production_orders`, `order_events`, `import_batches`
- `revalidateTag('production-orders')` after successful import
- Per-row overwrite decision handling (Pitfall 7 — intra-file duplicate behavior in commit path)

The `parseAndValidate`, `detectIntraFileDuplicates`, and `detectDbDuplicates` helpers are already in place for plan 33-06 to call without modification.

## Threat Surface

No new threat surface beyond what the plan's `<threat_model>` anticipated.

| Threat ID | Mitigation Status |
|-----------|-------------------|
| T-33-AuthZ | CLOSED — requireRole('mill_operator') first line, Test 12 |
| T-33-DoS | CLOSED — file.size > MAX_IMPORT_BYTES guard, Test 1 |
| T-33-XLSX | CLOSED — read-excel-file/node import, no xlsx/SheetJS |
| T-33-Input | CLOSED — productionOrderImportSchema.safeParse per row, Tests 4/5/6/7 |
| T-33-AuditPreviewBypass | CLOSED — no db.insert, no revalidateTag, Tests 8/15 |

## Self-Check: PASSED

| Check | Result |
|-------|--------|
| `src/actions/import.ts` exists | FOUND |
| `src/actions/__tests__/import-preview.test.ts` exists | FOUND |
| `docs/security-patterns.md` updated | FOUND |
| `33-05-SUMMARY.md` exists | FOUND |
| Commit `df258c6` (RED) exists | FOUND |
| Commit `49f62d7` (GREEN) exists | FOUND |
| Commit `6c0b67a` (REFACTOR) exists | FOUND |
| 16/16 tests pass | PASS |
| `npx tsc --noEmit` clean for import.ts | PASS |
