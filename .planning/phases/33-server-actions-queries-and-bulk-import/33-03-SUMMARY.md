---
phase: 33-server-actions-queries-and-bulk-import
plan: "03"
subsystem: import-validation
tags:
  - validation
  - zod
  - import-schema
  - tdd
dependency_graph:
  requires: []
  provides:
    - productionOrderImportSchema (Zod validator for XLSX import rows)
    - ProductionOrderImportRow (TypeScript inferred type)
  affects:
    - src/actions/import.ts (plans 33-05, 33-06 import these symbols)
tech_stack:
  added: []
  patterns:
    - Zod z.object().safeParse() for pure row validation
    - z.string().nullish() for optional XLSX fields (null | undefined accepted)
    - z.enum().default() for millLine with 'Premix' fallback
key_files:
  created:
    - src/actions/import-schema.ts
    - src/actions/__tests__/import-schema.test.ts
  modified: []
decisions:
  - "D-14: Zod is canonical runtime validator; schema in dedicated file to avoid 'use server' co-location ambiguity"
  - "D-15: .nullish() used for textureType/lineCode to accept both null and undefined (absent XLSX cells)"
  - "D-16: millLine defaults to 'Premix' via Zod .default() since Book1.xlsx has no Mill Line column"
  - "CR-01: weightLbs validated as number here; string conversion deferred to action body (plans 33-05/33-06)"
metrics:
  duration: "~2 minutes"
  completed: "2026-05-13"
  tasks_completed: 3
  files_count: 2
---

# Phase 33 Plan 03: Zod Import Schema Summary

**One-liner:** Zod schema for Book1.xlsx row validation — 7 required fields with named error messages, 2 nullable optionals via `.nullish()`, millLine enum defaulting to Premix (D-16); number/string boundary deferred to action body.

## What Was Built

`src/actions/import-schema.ts` exports exactly two symbols:

1. **`productionOrderImportSchema`** — a `z.object({...})` validator with 9 fields:
   - `orderNumber`, `customer`, `product`, `deliveryTime`, `formulaType`: `z.string().min(1, '<message>')` — rejects empty or absent
   - `weightLbs`: `z.number().positive('Weight must be positive')` — rejects 0 and negative values
   - `millLine`: `z.enum(['Premix', 'Excel', 'CGM']).default('Premix')` — defaults when absent (D-16)
   - `textureType`, `lineCode`: `z.string().nullish()` — accepts null, undefined, and string (D-15 + Pitfall 8)

2. **`ProductionOrderImportRow`** — TypeScript type via `z.infer<typeof productionOrderImportSchema>`. Consumed by plans 33-05 and 33-06 for downstream insert payload typing.

**Number/string boundary:** `weightLbs` is validated as a JS `number` in this schema. The Drizzle `numeric(10,2)` column expects a string at insert time (CR-01 from `src/db/schema/orders.ts`). The conversion (`parsedRow.weightLbs.toString()`) belongs in the action body (plans 33-05/33-06), not in this schema — keeping the validator boundary clean and ensuring a contract violation from an upstream parser change is detectable.

`src/actions/__tests__/import-schema.test.ts` provides 16 unit tests (no mocks — pure Zod):
- Test 1: Happy path (valid row)
- Tests 2-7: Per-required-field rejection (path-named Zod issues)
- Tests 8-9: weightLbs ≤ 0 rejection with exact message
- Test 10: weightLbs 0.01 accepted (smallest positive)
- Test 11: explicit null for optional fields
- Test 12: absent (undefined) for optional fields — Pitfall 8 coverage
- Test 13: millLine defaults to 'Premix' when absent
- Test 14: millLine enum accepts all three values
- Test 15: invalid millLine rejected
- Test 16: type export compile-time check

## TDD Gate Compliance

| Gate | Commit | Status |
|------|--------|--------|
| RED (test) | `7b717c2` | PASS — 16 tests failing with module-not-found |
| GREEN (feat) | `76c5d34` | PASS — 16 tests passing |
| REFACTOR | `24acb61` | PASS — JSDoc added, tests still green |

## Commits

| Task | Type | Hash | Description |
|------|------|------|-------------|
| Task 1 (RED) | test | `7b717c2` | add failing Zod schema tests for productionOrderImportSchema |
| Task 2 (GREEN) | feat | `76c5d34` | export productionOrderImportSchema and ProductionOrderImportRow |
| Task 3 (REFACTOR) | refactor | `24acb61` | document D-14/D-15/D-16 contract and CR-01 number/string boundary |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. This plan defines a pure Zod schema with no UI rendering surface.

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes introduced. This file is a pure Zod validator with no I/O. All three STRIDE mitigations from the plan's threat model are encoded as tests:

| Mitigation | Test Coverage |
|-----------|---------------|
| T-33-Input: required fields + enum rejection | Tests 2-7, 15 |
| T-33-Coercion: CR-01 number boundary documented | Inline JSDoc + Test 10 |
| T-33-NullVsUndefined: .nullish() for absent cells | Tests 11, 12 |

## Self-Check: PASSED

| Item | Result |
|------|--------|
| src/actions/import-schema.ts exists | FOUND |
| src/actions/__tests__/import-schema.test.ts exists | FOUND |
| 33-03-SUMMARY.md exists | FOUND |
| Commit 7b717c2 (RED) exists | FOUND |
| Commit 76c5d34 (GREEN) exists | FOUND |
| Commit 24acb61 (REFACTOR) exists | FOUND |
