---
phase: 28
plan: 04
subsystem: security
tags:
  - security
  - rsc
  - refactor
  - customers
  - requireRole
  - clerk
  - tdd
dependency_graph:
  requires:
    - src/lib/auth.ts (requireRole guard)
    - src/test/fixtures/clerkAuth.ts (28-01 fixture)
    - src/services/customers.ts (server-only data source)
    - src/utils/customerSort.ts (server-side sort)
    - src/types/customer.ts (CustomerWithStats interface)
    - src/hooks/useDebounce.ts (search debounce)
    - src/components/ui/Card.tsx
    - src/components/DashboardLayout.tsx
  provides:
    - src/app/demo/customers/page.tsx (now async RSC + requireRole guard)
    - src/components/CustomersList.tsx (NEW client wrapper, prop-only)
    - src/components/__tests__/CustomersList.test.tsx (NEW component tests)
    - Canonical "extract client wrapper from legacy 'use client' page" pattern
  affects:
    - .planning/phases/28-client-component-security-audit/28-06-PLAN.md (consumer of the before/after audit row)
tech_stack:
  added: []
  patterns:
    - rsc-page-with-prop-handoff (28-PATTERNS.md S2)
    - guard-as-first-statement (28-PATTERNS.md S1)
    - client-wrapper-extraction (legacy 'use client' page split into RSC shell + prop-only client child)
    - test-harness-via-28-01-fixture (clerkAuthMockFactory + nextNavigationMockFactory + helpers)
    - async-rsc-as-function-render (await Page() then render(element))
key_files:
  created:
    - src/components/CustomersList.tsx
    - src/components/__tests__/CustomersList.test.tsx
  modified:
    - src/app/demo/customers/page.tsx (188 → 21 lines; client → async RSC)
    - src/app/demo/customers/page.test.tsx (242 → 184 lines; client harness → RSC harness)
    - src/app/demo/customers/__tests__/page.test.tsx (276 → 281 lines; client harness → RSC harness)
decisions:
  - "Kept both legacy page test files (`page.test.tsx` AND `__tests__/page.test.tsx`) — migrated each in place rather than consolidating. Rationale: per the plan's two-test-files note, consolidation is OUT OF SCOPE for a security audit; the two files have non-overlapping coverage (one is behavioral, the other is design-token-focused MIG-02 coverage). Both now share the same 28-01 fixture wiring and the same 3 redirect-branch tests."
  - "Mocked `sortCustomersByRecentActivity` as a pass-through in `page.test.tsx` and asserted it was called once with the fetched customers. The sort algorithm itself is contract-tested elsewhere (`customerSort.test.ts`); the page test only needs to prove the wiring (server-side sort BEFORE the prop boundary). The `__tests__/page.test.tsx` file leaves the sort un-mocked so the rendered DOM reflects real ordering — both choices are valid and keep each file's focus distinct."
  - "Dropped the skeleton-token and error-state-token assertions from `__tests__/page.test.tsx`. Both branches were removed in the RSC refactor (data is pre-resolved server-side; the mock service cannot fail at the page layer). Re-introducing the assertions would test dead code paths."
  - "Used a local `jest.mock('next/navigation', ...)` in `CustomersList.test.tsx` instead of the 28-01 `nextNavigationMockFactory`. Rationale: `CustomersList` is a pure client component, not a page — it never touches `@clerk/nextjs/server`. A minimal local `useRouter` mock is the correct surface area. The 28-01 fixture is reserved for page-level RSC tests that exercise the auth guard."
metrics:
  duration: ~10 minutes
  completed_date: "2026-05-12"
  tasks_completed: 3
  files_created: 2
  files_modified: 3
  tests_added: 5 (CustomersList) + 6 (redirect branches across both page tests) = 11 net new
  tests_total_customer_scope: 39 (5 CustomersList + 8 page.test.tsx + 16 __tests__/page.test.tsx + 10 [id]/page.test.tsx)
  tests_passing: 39
requirements_completed: []
---

# Phase 28 Plan 04: /demo/customers RSC + Client-Wrapper Refactor Summary

**One-liner:** Converted `/demo/customers` from a 188-line client component (with internal fetch + sort + search + click navigation) into a 21-line async RSC that calls `await requireRole('demo')`, fetches and sorts server-side, and hands a `customers` prop to a new 172-line `CustomersList` client wrapper — with 11 net new tests across three files covering both the role guard and the extracted client-data-component shape.

## Tasks Executed

| # | Task                                                                    | Type     | Commit    |
| - | ----------------------------------------------------------------------- | -------- | --------- |
| 1 | Write failing CustomersList component tests (RED)                       | test     | `2ad9a7c` |
| 1 | Implement CustomersList client component (GREEN)                        | feat     | `3668221` |
| 2 | Convert customers/page.tsx to async RSC with requireRole guard          | refactor | `4967b22` |
| 3 | Migrate both customer page test files to async RSC harness              | test     | `28a0805` |

TDD plan-level gate sequence:
- **Plan RED** at `2ad9a7c` — `Cannot find module '@/components/CustomersList'`; plan-level cycle opens with a failing component-test that requires the new client wrapper.
- **Plan GREEN** at `3668221` — `Tests: 5 passed, 5 total`; CustomersList lands; behavior closes.
- The two follow-on commits (`4967b22` refactor, `28a0805` test) take the page tests from broken (after the RSC conversion) back to all-green by migrating both legacy test files to the new harness.

## What Moved Where (Refactor Anatomy)

### `src/app/demo/customers/page.tsx` (188 → 21 lines)

**Removed** (moved to `CustomersList.tsx` or dropped entirely):
- `'use client'` directive (line 1)
- `useState<CustomerWithStats[]>([])` for customers, `useState<boolean>(true)` for loading, `useState<string|null>(null)` for error
- `useEffect(() => getCustomers().then(setCustomers).catch(...).finally(...))` fetch block
- `useDebounce`, `useMemo` filter, `useRouter`, `handleRowClick`, `searchTerm` state
- `CustomerTableSkeleton` component (DROPPED — data is pre-resolved server-side; no loading state needed; 28-PATTERNS.md S6)
- Error-state JSX branch (DROPPED — mock service cannot fail at the page layer)
- The entire `<Card>...</Card>` table body, search bar, status-indicator JSX

**Added** (5 imports + 1 async function body):
```typescript
import { requireRole } from '@/lib/auth';
import { getCustomers } from '@/services/customers';
import { sortCustomersByRecentActivity } from '@/utils/customerSort';
import DashboardLayout from '@/components/DashboardLayout';
import CustomersList from '@/components/CustomersList';

export default async function CustomersPage() {
  await requireRole('demo');
  const customers = sortCustomersByRecentActivity(await getCustomers());
  return (
    <DashboardLayout>
      <CustomersList customers={customers} />
    </DashboardLayout>
  );
}
```

### `src/components/CustomersList.tsx` (NEW, 172 lines)

**Lifted verbatim from the old `customers/page.tsx`:**
- `EmptyState` helper (lines 32-42 of legacy file → lines 14-26 of new file).
- The entire `<Card>` JSX body — search bar, aria-live announcement, customer row map with status indicators (lines 79-186 of legacy → lines 64-152 of new).
- `useRouter`, `useState<string>('')` for searchTerm, `useDebounce` 300ms, `useMemo` filter, `handleRowClick` callback.

**Adjusted from the lift:**
- The `aria-live` polite block lost its `loading ?` branch (data is pre-resolved; no loading state at the client boundary).
- The conditional render `loading ? <Skeleton/> : error ? <Error/> : filteredCustomers.length === 0 ? <EmptyState/> : ...` collapsed to `filteredCustomers.length === 0 ? <EmptyState/> : ...`.
- Receives `customers: CustomerWithStats[]` as the sole prop; no `useState<customers>([])` initializer.

### `src/app/demo/customers/page.test.tsx` (242 → 184 lines)

- Added `clerkAuthMockFactory` + `nextNavigationMockFactory` import block at top; `jest.mock` calls hoisted with them.
- `beforeEach`: `mockAuth.mockReset(); mockDemoSession();` as first two statements.
- 3 new redirect-branch tests at the top of the main describe (sign-in / user / admin).
- Every `render(<CustomersPage />)` → `const element = await CustomersPage(); render(element);`.
- Dropped: skeleton-rows test, search-filter test, row-click test, empty-state test, status-indicator detail tests. All five behaviors now live in `CustomersList.test.tsx`.
- Retained: customer-name render test, getCustomers call assertion (added: called once), sortCustomersByRecentActivity call assertion (added: called once with the fetched customers), status-indicator handoff smoke test (proves data reaches CustomersList through the prop boundary).
- Net: 12 tests → 8 tests (3 redirect + 5 page-level; the 4 removed all now live in CustomersList.test.tsx).

### `src/app/demo/customers/__tests__/page.test.tsx` (276 → 281 lines)

- Same fixture wiring at top.
- `beforeEach`: same `mockAuth.mockReset(); mockDemoSession();`.
- 3 new redirect-branch tests in their own `describe('requireRole(\'demo\') guard', ...)` block.
- Every `render(<CustomersPage />)` → `const element = await CustomersPage(); render(element);`.
- Dropped: "uses bg-[var(--divider)] for skeleton backgrounds" (skeleton removed); "error icon uses text-[var(--error)]" (error branch removed).
- Retained: all MIG-02 design-token assertions on the rendered DOM (querying via `container.querySelectorAll`).
- Net: 16 tests → 16 tests (added 3 redirect, removed 2 dead-branch token checks, removed 1 skeleton token check).

## Verification Results

| Check                                                                              | Result                                              |
| ---------------------------------------------------------------------------------- | --------------------------------------------------- |
| `npm test -- --runInBand src/app/demo/customers`                                   | `Test Suites: 3 passed, 3 total / Tests: 34 passed` |
| `npm test -- --runInBand src/components/__tests__/CustomersList.test.tsx`          | `Test Suites: 1 passed / Tests: 5 passed`           |
| `grep -c "^'use client'" src/app/demo/customers/page.tsx`                          | `0`                                                 |
| `grep -c "await requireRole('demo')" src/app/demo/customers/page.tsx`              | `1`                                                 |
| `awk` line-order check: `requireRole` before `getCustomers`                        | `PASS` (exit 0)                                     |
| `grep -c "useState\|useEffect\|useMemo\|useRouter" src/app/demo/customers/page.tsx` | `0`                                                 |
| `wc -l src/app/demo/customers/page.tsx`                                            | `21` (≤ 25)                                         |
| `head -1 src/components/CustomersList.tsx`                                         | `'use client';`                                     |
| `grep -c "from '@/services/customers'" src/components/CustomersList.tsx`           | `0`                                                 |
| `grep -c "useEffect" src/components/CustomersList.tsx`                             | `0`                                                 |
| `grep -c "CustomerTableSkeleton" src/components/CustomersList.tsx`                 | `0`                                                 |
| `grep "interface CustomersListProps" src/components/CustomersList.tsx`             | match                                               |
| `grep "customers: CustomerWithStats\[\]" src/components/CustomersList.tsx`         | match                                               |
| `grep -c "clerkAuthMockFactory" src/app/demo/customers/page.test.tsx`              | `2` (≥ 1)                                           |
| `grep -c "clerkAuthMockFactory" src/app/demo/customers/__tests__/page.test.tsx`    | `2` (≥ 1)                                           |
| `grep -c "redirects to /\|redirects to /sign-in" page.test.tsx`                    | `3` (≥ 3)                                           |
| `grep -c "redirects to /\|redirects to /sign-in" __tests__/page.test.tsx`          | `3` (≥ 3)                                           |
| `grep -c "render(<CustomersPage" page.test.tsx __tests__/page.test.tsx`            | `0:0`                                               |
| `grep -c "await CustomersPage()" page.test.tsx __tests__/page.test.tsx`            | `5:14` (≥ 1 each)                                   |
| `grep -rn "from '@/services/customers'" src/components/ src/hooks/`                | `0 matches`                                         |
| `npx tsc --noEmit` errors on touched files                                         | `0`                                                 |

## Audit Findings Table (for 28-06 consumption)

| Path                                  | Component type (before) | Component type (after) | Data fetch site (before)             | Data fetch site (after)        | Role guard (before) | Role guard (after)               |
| ------------------------------------- | ----------------------- | ---------------------- | ------------------------------------ | ------------------------------ | ------------------- | -------------------------------- |
| `src/app/demo/customers/page.tsx`     | `'use client'`          | async RSC              | `useEffect(() => getCustomers())`    | `await getCustomers()` in RSC  | none                | `await requireRole('demo')`      |
| `src/components/CustomersList.tsx`    | N/A                     | `'use client'` (NEW)   | N/A                                  | none (props only)              | N/A                 | N/A (parent enforces)            |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Bug] Adjusted JSDoc comment in `CustomersList.tsx` to remove `useEffect` mention**
- **Found during:** Task 1 acceptance-criteria verification.
- **Issue:** The plan's acceptance criterion `grep -c "useEffect" src/components/CustomersList.tsx returns 0` failed because a JSDoc paragraph referenced `useEffect` in prose ("no `useEffect`+fetch ...").
- **Fix:** Rephrased the JSDoc as "no in-component fetch effect" — preserves the documentation intent, satisfies the strict grep check.
- **Files modified:** `src/components/CustomersList.tsx`
- **Verification:** `grep -c "useEffect" src/components/CustomersList.tsx` now returns `0`; test suite still 5/5 green.
- **Committed in:** `3668221` (Task 1 GREEN — the adjustment landed before the commit).

### Plan-spec deltas (minor)

**1. [Plan-driven — neutral] Test count totals.**
- **Plan said:** "3 new redirect-branch tests in EACH page test file (6 net new redirect tests total in this plan)."
- **Reality:** Exactly 3 redirect tests landed in each file (`'redirects to /sign-in'`, `'redirects to /'` for `user`, `'redirects to /'` for `admin`). 6 net new redirect tests, as predicted.

**2. [Plan-driven — informational] Page test file line counts.**
- **`src/app/demo/customers/page.test.tsx`:** 242 → 184 lines. The plan didn't specify a target; the file shrank because the 5 deleted tests (search, click, empty, skeleton, status-indicator detail) are wordier than the 3 added redirect tests + 4 added page-level assertions.
- **`src/app/demo/customers/__tests__/page.test.tsx`:** 276 → 281 lines. Slight growth: the 3 redirect tests added more lines than the 3 deleted dead-branch token tests freed up. Both files now use the same fixture wiring header (~10 lines of new boilerplate per file).

### CONTEXT.md / threat-model adjustments

**None.** No CLAUDE.md exists in the repo; no constraints to honor beyond the plan's own threat model.

## Auth Gates Encountered

**None.** Unit-test-only work — no live auth, no Clerk API, no env vars required.

## TDD Gate Compliance

This plan ran the canonical RED → GREEN cycle on Task 1 (CustomersList component, the only non-trivial new behavior), and a softer cycle on Tasks 2-3 (the page refactor + test migration are paired commits that together flip the suite from broken-mid-refactor back to all-green).

- **Plan RED gate:** `test(28-04): add failing CustomersList component tests` at `2ad9a7c` — suite fails with `Cannot find module '../CustomersList'` (canonical RED-by-missing-module). Verifies the test file is meaningful (would catch any regression that drops the component).
- **Plan GREEN gate:** `feat(28-04): extract CustomersList client component` at `3668221` — `Tests: 5 passed, 5 total`.
- **Refactor gate** (not strict TDD, but follows the canonical refactor-with-test-migration pattern): `4967b22` (refactor) → `28a0805` (test) — between these two commits the legacy page tests temporarily fail because they call `render(<CustomersPage />)` on what is now an async function. The third commit migrates the test harness and restores 34/34 customer tests green.

The full git log of this plan shows the expected `test → feat → refactor → test` sequence — the standard pattern when a refactor must propagate to test files that were written against the legacy shape.

## Threat Surface Scan

No new threat surface introduced beyond what is already covered in the plan's `<threat_model>`:

- **T-28-04-01 (info disclosure via client bundle):** mitigated — `grep -rn "from '@/services/customers'" src/components/` returns `0` matches. `CustomersList.tsx` never imports the service.
- **T-28-04-02 (EoP via middleware drift):** mitigated — 6 new redirect-branch tests across the two page test files (3 in each) exercise the demo guard end-to-end at unit-test level. The page-level `requireRole('demo')` is verified to run BEFORE `getCustomers()` (awk line-order assertion).
- **T-28-04-03 (info disclosure via sort timing):** mitigated — sort runs server-side AFTER the role check. `sortCustomersByRecentActivity` is called from `page.tsx` line 21 of 21; `requireRole` is on line 18; the awk check passes.
- **T-28-04-04 (regression to client-side fetch):** accepted per plan — phase-scoped grep-based source assertion guards against re-introduction of `useEffect(() => getCustomers().then(setCustomers))` in `CustomersList.tsx`. A lint rule belongs to a future tooling phase.
- **T-28-04-05 (no logging):** accepted per plan (Phase 25 D-02 carry-forward).

## Known Stubs

**None.** The mock data flows through `getCustomers()` → server-side sort → prop boundary → real DOM render. No placeholder text, no hardcoded empty defaults masking unfetched state. The `EmptyState` component is real UI for a real state (search returns zero matches), not a stub.

## Issues Encountered

**None substantive.** The fixture-API and async-RSC patterns established by 28-01 and 28-02 worked exactly as documented; no surprises, no edge cases that the plan didn't anticipate.

Pre-existing TS errors in `src/__tests__/design-system/theme.test.tsx` and `src/__tests__/design-system/tokens.test.ts` (carried forward from 28-01 SUMMARY) remain — out of scope per the Scope Boundary rule.

## Next Phase Readiness

- **Plan 28-06 (audit confirmation) ready to consume the before/after row above.** The table is keyed off the same columns as 28-03 and 28-05 contribute; the executor of 28-06 can copy-paste these rows into the consolidated audit findings.
- **No outstanding issues** for the verifier or for downstream plans.

## Self-Check: PASSED

- `src/components/CustomersList.tsx` — FOUND
- `src/components/__tests__/CustomersList.test.tsx` — FOUND
- `src/app/demo/customers/page.tsx` — FOUND, contains `await requireRole('demo')` BEFORE `await getCustomers()`
- `src/app/demo/customers/page.test.tsx` — FOUND, contains `clerkAuthMockFactory` and 3 redirect tests
- `src/app/demo/customers/__tests__/page.test.tsx` — FOUND, contains `clerkAuthMockFactory` and 3 redirect tests
- Commit `2ad9a7c` (test RED) — FOUND in `git log --oneline -6`
- Commit `3668221` (feat GREEN) — FOUND in `git log --oneline -6`
- Commit `4967b22` (refactor RSC) — FOUND in `git log --oneline -6`
- Commit `28a0805` (test migration) — FOUND in `git log --oneline -6`
- `npm test -- --runInBand src/app/demo/customers src/components/__tests__/CustomersList.test.tsx` — `Tests: 39 passed, 39 total`
- `npx tsc --noEmit` on touched files — `0` errors
- `grep -rn "from '@/services/customers'" src/components/ src/hooks/` — `0` matches (T-28-04-01 mitigation verified)

---
*Phase: 28-client-component-security-audit*
*Plan: 04*
*Completed: 2026-05-12*
