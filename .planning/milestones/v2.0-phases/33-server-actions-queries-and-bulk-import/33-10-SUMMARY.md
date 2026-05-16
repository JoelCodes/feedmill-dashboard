---
phase: 33-server-actions-queries-and-bulk-import
plan: "10"
subsystem: api
tags: [read-excel-file, xlsx-import, bug-fix, type-safety, tdd, gap-closure]

# Dependency graph
requires:
  - phase: 33-server-actions-queries-and-bulk-import
    plan: "05"
    provides: previewImportAction + parseAndValidate helper baseline
  - phase: 33-server-actions-queries-and-bulk-import
    plan: "06"
    provides: commitImportAction + shared parseAndValidate helper used by both actions
provides:
  - parseAndValidate tolerates errors:undefined from read-excel-file v9.0.9 success overload
  - Regression tests for clean-file (zero parser errors) import path in both actions
  - Type cast aligned with v9.0.9 ParseSheetDataResultSuccess / ParseSheetDataResultError overloads
  - Inline documentation citing GAP-04 post-mortem at the bug-prone iteration site
affects:
  - 33-07 (harness re-run closes GAP-03 Task 3 — operator action)
  - Any future plan touching parseAndValidate in src/actions/import.ts

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Nullish-coalescing guard on third-party array returns: `for (const x of maybeArray ?? [])`"
    - "TDD RED/GREEN/REFACTOR gate sequence for bug-fix plans"

key-files:
  created: []
  modified:
    - src/actions/import.ts
    - src/actions/__tests__/import-preview.test.ts
    - src/actions/__tests__/import-commit.test.ts

key-decisions:
  - "Nullish coalescing (`?? []`) chosen over conditional guard (`if (parserErrors)`) — idiomatic, minimal diff, no behavior change for the error-case array"
  - "Single XlsxFn type cast updated to `errors: Array<...> | undefined` — aligns with v9.0.9 discriminated union, lets TypeScript surface any future API drift at compile time"
  - "One regression test per action file (Test 17 + Test 27) — not a shared helper — mirrors existing per-test mock topology already established in 33-05 and 33-06"

patterns-established:
  - "Reference the read-excel-file .d.ts overload contract in comments at the call site to document why ?? [] is required"
  - "GAP cross-references in inline comments: cite the verification gap ID at the bug-prone line for future readers"

requirements-completed: []

# Metrics
duration: 15min
completed: 2026-05-14
---

# Phase 33 Plan 10: GAP-04 Closure Summary

**Nullish-coalescing guard `parserErrors ?? []` patches TypeError-on-clean-XLSX crash in `parseAndValidate`; both `previewImportAction` and `commitImportAction` now handle `errors: undefined` per read-excel-file v9.0.9's `ParseSheetDataResultSuccess` overload**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-05-14T05:25:00Z
- **Completed:** 2026-05-14T05:40:14Z
- **Tasks:** 3 (RED, GREEN, REFACTOR)
- **Files modified:** 3

## Accomplishments

- Closed GAP-04 from `33-VERIFICATION.md`: `parseAndValidate` no longer throws `TypeError: parserErrors is not iterable` when read-excel-file v9.0.9 returns `{ errors: undefined }` on clean files
- Added regression tests (Test 17 in preview, Test 27 in commit) that mock `errors: undefined` and assert `ok: true` — pins the contract so any future regression fails a test, not production
- Updated `XlsxFn` type cast to `errors: Array<...> | undefined` — aligns TypeScript's view of the return shape with the library's two-overload `.d.ts` contract
- Added inline JSDoc citing `ParseSheetDataResultSuccess`, `ParseSheetDataResultError`, and GAP-04 at both the type cast and the for-loop — eliminates "why is `?? []` here?" confusion for future readers

## Task Commits

Each task was committed atomically:

1. **Task 1: RED — failing regression tests for errors:undefined** - `c22badb` (test)
2. **Task 2: GREEN — guard parserErrors iteration and update type cast** - `b8c02c8` (fix)
3. **Task 3: REFACTOR — document v9.0.9 return-shape contract in JSDoc** - `fa6f0c5` (docs)

## Files Created/Modified

- `src/actions/import.ts` — Added `| undefined` to `XlsxFn.errors` type; replaced bare `for (const pe of parserErrors)` with `for (const pe of parserErrors ?? [])`; added 10-line comment block citing v9.0.9 overloads and GAP-04 post-mortem
- `src/actions/__tests__/import-preview.test.ts` — Added Test 17 (GAP-04): mocks `errors: undefined`, asserts `{ ok: true, summary: { rowCount: 1, ... } }`
- `src/actions/__tests__/import-commit.test.ts` — Added Test 27 (GAP-04): mocks `errors: undefined`, asserts `{ ok: true, committedCount: 1, ... }`

## GAP-04 Closure

**Verification gap:** `previewImportAction` and `commitImportAction` crashed on any clean XLSX upload because `read-excel-file` v9.0.9 returns `errors: undefined` (not `errors: []`) on success, causing `for (const pe of undefined)` to throw `TypeError`, caught by the outer `try/catch`, surfaced as generic `{ ok: false, code: 'server', message: 'Failed to parse XLSX file.' }`.

**Root cause:** The `XlsxFn` type cast omitted `| undefined` from the `errors` field, masking the discrepancy at compile time. The bug only surfaced at runtime against the real library — discovered when 33-07's `scripts/test-xlsx-import.ts` ran against a clean `Book1.xlsx` fixture.

**Fix:** `for (const pe of parserErrors ?? [])` at line 136 of `parseAndValidate` (the single shared helper used by both actions). One fix closes both call sites.

**Source-of-truth .d.ts reference:**
- File: `node_modules/read-excel-file/types/parseSheetData/parseSheetData.d.ts`
- Line 5: `ParseSheetDataResultSuccess` — `errors: undefined` (success/clean-file case)
- Line 12: `ParseSheetDataResultError` — `errors: Error[]` (parse-failure case)

## Next Operator Action

After this plan commits, the operator should re-run the 33-07 live harness:

```bash
npm run test:xlsx-import
```

This closes **GAP-03 Task 3** in `33-VERIFICATION.md` (the harness Task 3 "parseAndValidate returns correct PreviewRow shape" was the live-DB path that surfaced GAP-04). That re-run is out of scope for this plan — it remains 33-07's checkpoint.

## Decisions Made

- Nullish coalescing (`?? []`) chosen over conditional guard — idiomatic, minimal diff, no behavior change for the real-errors case
- Single `XlsxFn` type cast updated to `errors: Array<...> | undefined` — aligns TypeScript with v9.0.9 discriminated union; lets TypeScript surface any future API drift at compile time
- One regression test per action file (Test 17 + Test 27) — mirrors existing per-test mock topology; additive only, no existing tests modified

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. The npm test command uses `--testPathPatterns` (not `--testPathPattern`) due to a Jest version update — addressed by using the correct flag name.

## TDD Gate Compliance

All three TDD gates observed:

1. RED commit `c22badb` — `test(33-10): RED — assert import actions tolerate readXlsxFile errors:undefined`
   - Both new tests failed at `toMatchObject({ ok: true, ... })` with actual `{ ok: false }` due to swallowed TypeError
2. GREEN commit `b8c02c8` — `fix(33-10): guard parser-error iteration when readXlsxFile returns errors:undefined`
   - All 48 tests pass (46 pre-existing + 2 new)
3. REFACTOR commit `fa6f0c5` — `docs(33-10): cite v9.0.9 .d.ts overloads above parser-error iteration`
   - Pure docs change; all 48 tests still pass

## Self-Check

- [x] `src/actions/import.ts` contains `for (const pe of parserErrors ?? [])` — confirmed line 145
- [x] `src/actions/import.ts` contains `errors: Array<...> | undefined` — confirmed in XlsxFn type cast
- [x] `src/actions/import.ts` contains `Return-shape contract (v9.0.9)` — confirmed line 123
- [x] `src/actions/import.ts` contains `ParseSheetDataResultSuccess` and `ParseSheetDataResultError` — confirmed lines 124-125, 139
- [x] `src/actions/import.ts` cites `GAP-04` twice — confirmed lines 126 and 140
- [x] `src/actions/__tests__/import-preview.test.ts` contains `Test 17 (GAP-04)` with `errors: undefined`
- [x] `src/actions/__tests__/import-commit.test.ts` contains `Test 27 (GAP-04)` with `errors: undefined`
- [x] `npm test -- --testPathPatterns=...` exits 0 with 48 tests passing
- [x] `npx tsc --noEmit | grep src/actions/import.ts` returns empty (zero type errors)
- [x] Three commits in git log: `c22badb`, `b8c02c8`, `fa6f0c5`
- [x] No files modified outside `src/actions/import.ts`, `src/actions/__tests__/import-preview.test.ts`, `src/actions/__tests__/import-commit.test.ts`

## Self-Check: PASSED

---
*Phase: 33-server-actions-queries-and-bulk-import*
*Completed: 2026-05-14*
