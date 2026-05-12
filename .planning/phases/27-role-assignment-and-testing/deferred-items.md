# Phase 27 — Deferred Items

Out-of-scope discoveries logged during plan execution. Per SCOPE BOUNDARY rule,
these are NOT fixed inside this plan because they pre-date the changes here.

## Pre-existing TypeScript errors (logged by Plan 27-02)

`npx tsc --noEmit` from worktree-agent-a9c3652c9e3f037a3 on a78167a (Plan 27-02 baseline)
reports several errors in files unrelated to Plan 27-02's `src/middleware.ts` /
`src/middleware.test.ts` changes:

- `src/__tests__/design-system/theme.test.tsx` — `'capturedProps' is possibly 'null'` (TS18047) on 7 lines.
- `src/__tests__/design-system/tokens.test.ts` — regex flag requires `target: es2018+` (TS1501) on 3 lines.
- `src/app/demo/customers/[id]/page.test.tsx` — `() => never` to `Mock` cast issue (TS2352).
- `src/app/demo/customers/page.test.tsx` — `CustomerStats.activeBins` missing on 3 fixtures (TS2741).
- `src/app/demo/orders/__tests__/page.test.tsx` — `Order.customerId` missing on 2 fixtures (TS2741).
- `src/components/__tests__/OrderDetails.test.tsx` — `Order.customerId` missing (TS2741).
- `src/components/__tests__/OrdersTable.test.tsx` — `Order.customerId` missing on 3 fixtures (TS2741).
- `src/utils/customerSort.test.ts` — `CustomerStats.activeBins` missing (TS2741).

These errors exist on `main@a78167a` and are unrelated to the middleware migration.
Plan 27-02 does not touch any of these files. They should be addressed by a dedicated
cleanup plan (likely outside Phase 27, since Phase 27 scope is role assignment, not type-fixture hygiene).
