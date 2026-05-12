# Phase 27 — Deferred Items

Out-of-scope issues discovered during plan execution. **Not** caused by the plans in this phase. Logged for later remediation.

## From 27-01 (checkRole + requireRole utility, TDD)

**Discovered:** 2026-05-12 during Task 3 (REFACTOR + full-suite regression check)

### 1. Jest picks up Playwright E2E specs (14 pre-existing test failures)

- **Files:**
  - `e2e/route-protection.spec.ts`
  - `e2e/demo-route-protection.spec.ts`
  - `e2e/production-smoke.spec.ts`
- **Symptom:** `npm test` reports 14 failures with `throwIfRunningInsideJest` from `node_modules/playwright/lib/common/testType.js:276:11`.
- **Root cause:** `jest.config.ts` has no `testPathIgnorePatterns` excluding `e2e/`. The Playwright test runner imports `@playwright/test`, which detects it's running under Jest and throws.
- **Pre-existence confirmed:** Reproduces identically at base commit `a78167a` when `src/lib/auth.*` files are temporarily removed (14 failures in 2 suites for the subset I ran; full suite count 14 across 3 e2e suites + 1 unrelated).
- **Scope:** This plan only created `src/lib/auth.ts` + `src/lib/auth.test.ts`; both pass under Jest. The e2e-under-jest issue is independent.
- **Remediation suggestion:** Add `testPathIgnorePatterns: ['<rootDir>/e2e/']` to `jest.config.ts` (out of scope for plan 27-01; could be folded into 27-03 or a separate hygiene plan).

### 2. Settings page test failure (pre-existing)

- **File:** `src/app/settings/__tests__/page.test.tsx`
- **Pre-existence confirmed:** Fails at base commit `a78167a` with the auth files removed.
- **Scope:** Not touched by plan 27-01.

### 3. Pre-existing tsc errors in test fixtures (21 errors)

- **Files affected** (all `*.test.tsx` / `*.test.ts` with mock data drift):
  - `src/app/demo/customers/page.test.tsx` (missing `activeBins` on `CustomerStats`)
  - `src/app/demo/orders/__tests__/page.test.tsx` (missing `customerId` on `Order`)
  - `src/components/__tests__/OrderDetails.test.tsx` (missing `customerId`)
  - `src/components/__tests__/OrdersTable.test.tsx` (missing `customerId`)
  - `src/utils/customerSort.test.ts` (missing `activeBins`)
- **Symptom:** `npx tsc --noEmit` reports 21 errors.
- **Pre-existence confirmed:** Identical count (21) at base commit `a78167a` with auth files removed. Zero errors in `src/lib/auth.ts` or `src/lib/auth.test.ts`.
- **Root cause:** Mock data shapes in test files drifted out of sync with their source types (`CustomerStats.activeBins` and `Order.customerId` were added without test mocks being updated).
- **Scope:** Mocks need updating; no production code touched. Out of scope for plan 27-01.

---

**Audit trail:** All three categories verified pre-existing by temporarily moving `src/lib/auth.ts` and `src/lib/auth.test.ts` out of the tree and re-running the failing commands — failures persisted identically.
