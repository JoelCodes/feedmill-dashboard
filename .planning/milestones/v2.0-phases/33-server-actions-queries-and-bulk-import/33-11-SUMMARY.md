---
phase: 33-server-actions-queries-and-bulk-import
plan: 11
status: complete
completed: 2026-05-14T07:30:00Z
gap_closure: true
closes_gaps: [GAP-05, GAP-03]
type: tdd
wave: 7
requirements-completed: []
---

# Plan 33-11 — readSheet API Migration (GAP-05 + side-effect GAP-03 closure)

## Outcome

GAP-05 closed. GAP-03 Task 3 closed as a side effect. The Phase 33 XLSX import pipeline now uses the correct read-excel-file v9.0.9 API end-to-end.

## What was built

The plan was a 4-task TDD migration of the import actions from the deprecated v8.x `readXlsxFile(buf, {schema})` pattern to the v9.x `readSheet(buf, {schema})` pattern. While running the harness in Task 3, the executor surfaced a second migration issue (treated under Rule 1 auto-fix) and committed an additional source correction.

### Commits (5)

| # | SHA | Subject | Type |
|---|-----|---------|------|
| 1 | `d015697` | `test(33-11): RED — assert import actions use readSheet with {objects, errors} shape` | RED |
| 2 | `58f4f1a` | `fix(33-11): migrate readXlsxFile→readSheet to match read-excel-file v9.x API` | GREEN |
| 3 | `eb97785` | `fix(33-11): migrate harness to readSheet to match action and v9.x API` | GREEN |
| 4 | `44cfdb4` | `fix(33-11): remove required:true from xlsxSchema and add null-row guard` | Rule 1 auto-fix |
| 5 | `afbe118` | `docs(33-11): annotate readSheet migration and correct RESEARCH §3` | DOCS |
| 6 | `312f7d5` | `docs(33): mark GAP-03 and GAP-05 CLOSED by plan 33-11` | DOCS |

## Files modified

- `src/actions/import.ts` — readXlsxFile→readSheet migration; XlsxFn type updated to discriminated union; `objects: rawRows` destructure; `rawRows ?? []` guard; null-row guard; required:true removed from xlsxSchema
- `src/actions/__tests__/import-preview.test.ts` — mocks migrated from readXlsxFile to readSheet; success/error discriminated-union branches both covered
- `src/actions/__tests__/import-commit.test.ts` — same migration as preview tests
- `scripts/test-xlsx-import.ts` — harness mirrors action migration
- `.planning/phases/33-server-actions-queries-and-bulk-import/33-RESEARCH.md` — §3 correction note for GAP-05
- `.planning/phases/33-server-actions-queries-and-bulk-import/33-07-SUMMARY.md` — 2026-05-14 Addendum closing Task 3
- `.planning/phases/33-server-actions-queries-and-bulk-import/33-HUMAN-UAT.md` — Test #3 marked passed (harness, 2026-05-14)
- `.planning/phases/33-server-actions-queries-and-bulk-import/33-VERIFICATION.md` — GAP-03 and GAP-05 status entries

## Rule 1 finding (additional fix beyond planned scope)

During Task 3 harness execution, the executor discovered:

1. **`required: true` is incompatible with v9.x error-branch semantics.** When ANY row in an XLSX has a missing required field, readSheet returns the entire result via `ParseSheetDataResultError` (objects: undefined, errors: Error[]) — losing all valid rows. Solution: remove `required: true` from the column schema; let Zod (`productionOrderImportSchema`) handle required-field validation in the per-row safeParse loop. This matches D-15 — required-field semantics are owned by Zod, not the parser.

2. **Empty rows can be `null` in the rawRows array.** Added a null-row guard at the top of the per-row loop to skip them silently.

Both fixes committed in `44cfdb4` with the Rule 1 auto-fix justification.

## Verification

- **Unit tests:** 50/50 passing (`npm test -- --testPathPattern="src/actions/__tests__/import-(preview|commit)" --no-coverage` → exit 0).
- **TypeScript:** `npx tsc --noEmit` → exit 0.
- **Live-DB harness:** `npm run test:xlsx-import` ran end-to-end against the Neon dev DB: 31 rows committed, assertPostConditions PASSED, exit 0. Per the executor's commit message and 33-07-SUMMARY.md addendum.

## Gaps closed

| Gap | Truth | Closure |
|-----|-------|---------|
| GAP-05 | previewImportAction / commitImportAction successfully parse Book1.xlsx against read-excel-file v9.0.9 | readSheet API in use; harness PASS |
| GAP-03 | End-to-end XLSX import against live Neon dev DB | 33-07 harness re-ran and PASSED autonomously in Task 3 |

## Carry-forward

- GAP-01 (concurrent transition race) — still pending Wave 5 plan 33-08 execution.
- GAP-02 (revalidateTag E2E) — formally deferred to Phase 34 by plan 33-09 (already complete).
- GAP-04 — closed by 33-10; its `?? []` guard is preserved in the migrated code.

## Notes

The executor's foreground process hit a socket disconnect (API Error) at the very end of the session, after all five commits had landed and the VERIFICATION.md edit was staged. The orchestrator recovered by committing the staged VERIFICATION.md edit and authoring this SUMMARY.md from the commit log. No work was lost.
