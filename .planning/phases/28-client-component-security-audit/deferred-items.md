# Phase 28 — Deferred / Out-of-Scope Items

Out-of-scope items discovered during execution. Per the executor Scope
Boundary rule, these are logged here for later attention but NOT
auto-fixed in the current plans (they are not directly caused by the
plan's task changes). Confirmed pre-existing on the phase-28 base commit
`87d92f1`.

## 1. `src/app/settings/__tests__/page.test.tsx` — 14/14 tests failing

- **Discovered during:** full-suite regression checks in plans 28-03 and 28-05.
- **Status at base commit `87d92f1`:** all 14 tests fail (verified by checking
  out the base `src/app/settings/` tree and re-running `npm test -- --runInBand
  src/app/settings`).
- **Diagnosis:** React render-pipeline errors inside the test harness;
  unrelated to any `/demo/*` work.
- **Why deferred:** Pre-existing on plan-28 base; Scope Boundary applies. No
  file touched by Phase 28 references settings.

## 2. Playwright e2e tests routed into Jest

Files:
- `e2e/route-protection.spec.ts`
- `e2e/demo-route-protection.spec.ts`
- `e2e/demo-route-protection-unauth.spec.ts`
- `e2e/production-smoke.spec.ts`

- **Status:** All four files throw `Playwright Test did not expect
  test.describe() to be called here` when Jest runs the project default
  `npm test`. They import `@playwright/test` and are intended for the
  separate Playwright runner.
- **Root cause:** `jest.config.ts` lacks a
  `testPathIgnorePatterns: ['<rootDir>/e2e/']` entry. Pre-existing on base.
- **Why deferred:** Pre-existing config-level issue. The targeted suites that
  plans 28-03 and 28-05 own pass cleanly when invoked directly. A future
  config-fix plan should add the ignore pattern.
