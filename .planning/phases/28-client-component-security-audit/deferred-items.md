# Phase 28 — Deferred Items

Out-of-scope items discovered during execution. Per the executor Scope
Boundary rule, these are logged here for later attention but NOT
auto-fixed in the current plans (they are not directly caused by the
plan's task changes).

## From Plan 28-03

### 1. `src/app/settings/__tests__/page.test.tsx` — 14/14 tests failing

- **Discovered during:** full-suite regression check at end of Task 2.
- **Confirmed pre-existing:** Verified via `git stash` + re-run on the
  pre-28-03 working tree — same 14 failures.
- **Owner:** Settings page test file (unrelated to /demo/orders).
- **Scope:** Out of scope for Phase 28 (`/demo/*` security audit). Log
  here for a future stabilization pass.

### 2. `e2e/*.spec.ts` (4 specs) picked up by Jest runner

- **Discovered during:** full-suite regression check at end of Task 2.
- **Confirmed pre-existing:** These specs use Playwright's `test.describe`
  but Jest's `testMatch` is currently broad enough to discover them under
  `e2e/`. Pre-existing — also fails on the pre-28-03 tree.
- **Failing specs:**
  - `e2e/route-protection.spec.ts`
  - `e2e/production-smoke.spec.ts`
  - `e2e/demo-route-protection-unauth.spec.ts`
  - `e2e/demo-route-protection.spec.ts`
- **Scope:** Out of scope for Phase 28. Owners should either move `e2e/`
  outside Jest's discovery glob or add an `e2e/` exclusion to
  `jest.config.ts`.
