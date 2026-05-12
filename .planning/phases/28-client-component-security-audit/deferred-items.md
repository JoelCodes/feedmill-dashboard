# Phase 28 — Deferred / Out-of-Scope Items

These items were discovered during plan execution but fall outside the
Scope Boundary (Rule "only auto-fix issues DIRECTLY caused by the current
task's changes"). They predate this phase and are logged for visibility,
not fixed.

## Logged 2026-05-12 during plan 28-05

### 1. `src/app/settings/__tests__/page.test.tsx` — 14 failing tests

- **Status at base commit `87d92f1`:** 14 of 14 tests fail (verified by
  checking out the base `src/app/settings/` tree and re-running
  `npm test -- --runInBand src/app/settings`).
- **Diagnosis:** Failures appear to be React render-pipeline errors
  inside the test harness; unrelated to the mill-production refactor.
- **Why deferred:** Pre-existing on plan-28 base; Scope Boundary
  applies. No file touched by plan 28-05 references settings.

### 2. Playwright e2e tests routed into jest

Files: `e2e/route-protection.spec.ts`, `e2e/demo-route-protection.spec.ts`,
`e2e/demo-route-protection-unauth.spec.ts`, `e2e/production-smoke.spec.ts`

- **Status:** All four files throw "Playwright Test did not expect
  test.describe() to be called here" when jest runs the project default
  `npm test`. They import `@playwright/test` and are intended for the
  separate Playwright runner.
- **Root cause:** `jest.config.ts` lacks a `testPathIgnorePatterns: ['<rootDir>/e2e/']`
  entry. Pre-existing on base.
- **Why deferred:** Pre-existing config-level issue; Scope Boundary
  applies. The targeted suites that plan 28-05 owns
  (`src/app/demo/mill-production` and `src/components/__tests__/MillProductionUI.test.tsx`)
  pass cleanly when invoked directly. The phase-complete verifier or a
  future config-fix plan should add the ignore pattern.
