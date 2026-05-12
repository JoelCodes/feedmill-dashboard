---
phase: 29
plan: "06"
subsystem: test-pipeline
tags:
  - tech-debt
  - test-pipeline
  - config
dependency_graph:
  requires: []
  provides:
    - clean-jest-e2e-isolation
    - tsc-exit-zero
    - tailwind-planning-exclude
  affects:
    - jest.config.ts
    - src/__tests__/design-system/tokens.test.ts
    - src/__tests__/design-system/theme.test.tsx
    - src/components/__tests__/OrderDetails.test.tsx
    - src/utils/customerSort.test.ts
    - src/app/globals.css
tech_stack:
  added: []
  patterns:
    - "Jest testPathIgnorePatterns with explicit /node_modules/ to preserve default"
    - "ES2017-compatible regex using [\s\S] instead of /s dotAll flag"
    - "TypeScript non-null assertion (!) for null-typed variables with runtime guards"
key_files:
  created: []
  modified:
    - jest.config.ts
    - src/__tests__/design-system/tokens.test.ts
    - src/__tests__/design-system/theme.test.tsx
    - src/components/__tests__/OrderDetails.test.tsx
    - src/utils/customerSort.test.ts
decisions:
  - "D-14: testPathIgnorePatterns explicitly includes /node_modules/ alongside <rootDir>/e2e/ to preserve Jest's default behavior when overriding the array"
  - "D-15: regex /s flag removed by rewriting to [\s\S]+? (ES2017 compatible); tsconfig.json target unchanged at ES2017 per user constraint"
  - "D-15: non-null assertion (!) applied to 7 capturedProps accesses in theme.test.tsx; runtime safety preserved by existing expect(capturedProps).toBeTruthy() guards"
  - "D-17: Tailwind @source not directive left unchanged — bare directory form '../../.planning' is canonical Tailwind v4 recursive-exclude syntax per docs; no dev-server scanning warnings observed"
metrics:
  duration: "~8 minutes"
  completed: "2026-05-12"
  tasks_completed: 5
  files_modified: 5
  tsc_errors_before: 12
  tsc_errors_after: 0
---

# Phase 29 Plan 06: Test Pipeline Tech Debt Cleanup Summary

Resolved all 12 pre-existing TypeScript errors in test fixtures and isolated Jest from Playwright e2e specs — `npx tsc --noEmit` now exits 0, `npm test` no longer scans `e2e/`, and the Tailwind `@source not` directive is verified correct.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add testPathIgnorePatterns to jest.config.ts | ba70547 | jest.config.ts |
| 2 | Rewrite tokens.test.ts regexes to remove /s flag | 2f14fcd | src/__tests__/design-system/tokens.test.ts |
| 3 | Add non-null assertions to capturedProps in theme.test.tsx | 15b3e85 | src/__tests__/design-system/theme.test.tsx |
| 4 | Add missing customerId/activeBins fixture fields | aca3764 | src/components/__tests__/OrderDetails.test.tsx, src/utils/customerSort.test.ts |
| 5 | Verify Tailwind @source not directive | (no commit needed) | src/app/globals.css |

## Decisions Made

### D-14: Jest e2e isolation
Added `testPathIgnorePatterns: ['/node_modules/', '<rootDir>/e2e/']` to `jest.config.ts`. Including `/node_modules/` explicitly is required — setting `testPathIgnorePatterns` replaces Jest's default rather than merging. Verification: `npm test -- --listTests` shows 37 src tests, 0 e2e tests.

### D-15: TypeScript fixture errors (12 fixed)
Three categories of fixes, all touching fixture files only:

1. **tokens.test.ts (3 errors):** Replaced `/\.dark\s*\{[^}]+\}/s` (ES2018 `/s` dotAll flag) with `/\.dark\s*\{[\s\S]+?\}/` (ES2017-compatible). `[\s\S]` matches any character including newlines; lazy `+?` prevents over-matching.

2. **theme.test.tsx (7 errors):** Added `!` non-null assertion to all 7 `capturedProps.property` accesses. Safe because each is guarded by `expect(capturedProps).toBeTruthy()` immediately prior.

3. **OrderDetails.test.tsx (1 error):** Added `customerId: "CUST-001"` to `mockOrder` object literal — required by `Order` type.

4. **customerSort.test.ts (1 error):** Added `activeBins: 0` to `stats` object in `createCustomer` helper — required by `CustomerStats` type.

`tsconfig.json` was NOT modified (preserved ES2017 target per D-15 constraint).

### D-17: Tailwind @source not directive
Current value: `@source not "../../.planning";` (bare directory form, line 4 of globals.css).

**Decision: No edit made.** Per Tailwind v4 documentation, bare directory paths in `@source not` directives recursively exclude all contents — this is the canonical syntax. The audit's note about potential non-recursive exclusion was likely a stale dev-server cache artifact. The directive is verified correct as-is. No dev-server scanning warnings observed.

## Deviations from Plan

### Minor: Jest CLI flag update
The plan's acceptance criteria referenced `--testPathPattern` (singular) but this was replaced by `--testPathPatterns` (plural) in the installed Jest version. Used the correct flag in verification commands. No impact on plan outcomes.

None beyond the above — plan executed exactly as written.

## Final Verification

- `npm test -- --listTests 2>&1 | grep -c "e2e/"` = **0** (Task 1)
- `npx tsc --noEmit 2>&1 | grep tokens.test.ts | wc -l` = **0** (Task 2)
- `npx tsc --noEmit 2>&1 | grep theme.test.tsx | wc -l` = **0** (Task 3)
- `npx tsc --noEmit 2>&1 | grep -E "(OrderDetails|customerSort)" | wc -l` = **0** (Task 4)
- `grep -E "@source not" src/app/globals.css` = `@source not "../../.planning";` (Task 5)
- `npx tsc --noEmit` = **exit 0** (all 12 errors resolved)
- `git diff --name-only HEAD tsconfig.json` = **empty** (tsconfig unchanged)

## Known Stubs

None.

## Threat Flags

None. All changes are test fixtures and config files — no production code, no new network endpoints, no auth paths, no schema changes.

## Self-Check: PASSED

- jest.config.ts modified: FOUND
- tokens.test.ts modified: FOUND
- theme.test.tsx modified: FOUND
- OrderDetails.test.tsx modified: FOUND
- customerSort.test.ts modified: FOUND
- Commits ba70547, 2f14fcd, 15b3e85, aca3764: FOUND
- npx tsc --noEmit exit 0: VERIFIED
