---
phase: 28
plan: 05
subsystem: security
tags:
  - security
  - rsc
  - refactor
  - mill-production
  - requireRole
  - clerk
  - tdd
dependency_graph:
  requires:
    - src/lib/auth.ts (requireRole guard)
    - src/test/fixtures/clerkAuth.ts (28-01 fixture)
    - src/services/millProduction.ts (server-side data source)
    - src/components/ui/FilterPill.tsx (lifted into client wrapper)
    - src/types/millProduction.ts (ProductionOrder shape)
  provides:
    - src/app/demo/mill-production/page.tsx (now an async RSC with await requireRole('demo'))
    - src/components/MillProductionUI.tsx (NEW client wrapper owning filter strip + columns)
    - Fourth and final demo-route consumer of the 28-01 fixture
  affects:
    - .planning/phases/28-client-component-security-audit/28-06-PLAN.md (audit table consumer)
tech_stack:
  added: []
  patterns:
    - guard-as-first-statement (await requireRole('demo') before await getProductionOrders — D-01/RESEARCH §Pitfall 4)
    - client-data-component (NEW MillProductionUI.tsx receives orders prop, never imports the service)
    - lift-helpers-verbatim (STATE_ORDER, STATE_COLORS, PRODUCTION_STATE_PILL_CONFIG, formatWeight, ProductionCard, StateSection, MillColumn migrated unchanged)
    - drop-loading-skeleton (server-side fetch means client never sees loading state)
    - redirect-sentinel-throw assertion in async-RSC unit tests (consumed via nextNavigationMockFactory)
    - mockDemoSession-default-in-beforeEach (green-path session is the default; redirect tests override per-case)
key_files:
  created:
    - src/components/MillProductionUI.tsx
    - src/components/__tests__/MillProductionUI.test.tsx
    - .planning/phases/28-client-component-security-audit/deferred-items.md
  modified:
    - src/app/demo/mill-production/page.tsx (273-line client → 15-line async RSC)
    - src/app/demo/mill-production/__tests__/page.test.tsx (migrated to 28-01 fixture, +3 redirect-branch tests)
decisions:
  - "Lift helpers verbatim into MillProductionUI.tsx (vs. re-exporting from a separate helpers module). The original page co-located STATE_ORDER/STATE_COLORS/PRODUCTION_STATE_PILL_CONFIG with ProductionCard/StateSection/MillColumn, and none of these are reused elsewhere — keeping them as private module-level helpers inside MillProductionUI.tsx preserves the original locality without spawning a third file."
  - "Drop LoadingSkeleton entirely (vs. preserving it for a future Suspense boundary). The RSC pattern resolves data before the client ever runs, so the loading state is unreachable in this page's runtime. Confirmed no cross-file importer via grep -rn 'LoadingSkeleton' src/."
  - "Relocate the design-token regression test to the component level (vs. duplicating it on both page and component). Task 1 Test 6 asserts ProductionCard borders use var(--status-*-border) tokens via inline style; the old page-level 'LoadingSkeleton uses design tokens' test is removed because LoadingSkeleton no longer renders. The STATE_COLORS map (lifted verbatim into MillProductionUI.tsx) is the single source of truth for these token values."
  - "Default mockDemoSession() in beforeEach (mirrors 28-02 idiom). Keeps the four green-path render tests free of per-test session setup; the three redirect-branch tests override locally via mockUnauthenticatedSession() / mockNonDemoSession(role)."
  - "Use the role-aware getByRole('button', { name: /Filter by .../i }) selector for filter-pill tests (vs. text-content selectors). The FilterPill renders the state name in a span AND the count in an adjacent span — text-based queries return ambiguous matches when multiple state-name strings appear (e.g., the StateSection header also renders 'Mixing' text). The aria-label = 'Filter by Mixing, N orders' makes the pill unambiguously addressable and ties the assertion to the accessibility contract."
metrics:
  duration: ~6 minutes
  completed_date: "2026-05-12"
  tasks_completed: 2
  files_created: 3
  files_modified: 2
  tests_added_component: 6
  tests_added_page_redirects: 3
  tests_added_page_fetch_assertion: 1
  tests_passing_targeted: 13
requirements_completed: []
---

# Phase 28 Plan 05: Mill-Production Async-RSC Refactor Summary

**One-liner:** Converted `/demo/mill-production` from a 273-line client component (internal `useEffect` fetch + filter state + LoadingSkeleton) into a 15-line async Server Component that calls `await requireRole('demo')` before `await getProductionOrders()` and passes data into a new `MillProductionUI` client wrapper — closing the fourth and final D-01/D-05 hole in `/demo/*`.

## Performance

- **Duration:** ~6 minutes
- **Tasks:** 2 (each TDD: RED → GREEN)
- **Files created:** 3 (component, component test, deferred-items log)
- **Files modified:** 2 (page.tsx, page.test.tsx)

## Tasks Executed

| # | Task                                                              | Type     | Commit    |
| - | ----------------------------------------------------------------- | -------- | --------- |
| 1 RED   | Failing tests for MillProductionUI client wrapper           | test     | `fdc6708` |
| 1 GREEN | Extract MillProductionUI client component                   | feat     | `d3918d2` |
| 2 RED   | Migrate mill-production page test to async-RSC harness      | test     | `6c1cc23` |
| 2 GREEN | mill-production page becomes async RSC with requireRole     | refactor | `8fbbfc4` |

RED → GREEN gates per task:

- **Task 1 RED:** suite failed with `Cannot find module '../MillProductionUI'` — proving the component did not yet exist.
- **Task 1 GREEN:** `Tests: 6 passed, 6 total` after the lift.
- **Task 2 RED:** `7 of 7` tests failed against the still-client page with `TypeError: Cannot read properties of null (reading 'useState')` — proving the production code path was incompatible with the async-RSC test pattern.
- **Task 2 GREEN:** `Tests: 7 passed, 7 total` after the RSC rewrite.

## Refactor Scope — What Moved Where

### `src/components/MillProductionUI.tsx` (NEW, 243 lines)

`'use client';` directive. Module-level helpers lifted **verbatim** from the old `mill-production/page.tsx`:

| Lifted From `page.tsx` lines | Item                                                                |
| ---------------------------- | ------------------------------------------------------------------- |
| 13-18                        | `STATE_ORDER` constant                                              |
| 20-40                        | `STATE_COLORS` constant (var(--status-*-border / -header) tokens)   |
| 42-67                        | `PRODUCTION_STATE_PILL_CONFIG` constant                             |
| 69-74                        | `formatWeight` helper                                               |
| 76-101                       | `ProductionCard` component                                          |
| 103-132                      | `StateSection` component                                            |
| 134-173                      | `MillColumn` component                                              |
| 201, 203-225, 241-272        | `useState<Set<ProductionState>>`, `toggleState`, `stateCounts` memo, `filteredOrders` memo, `ordersByMill` reduction, filter-strip + column-flex JSX |

### `src/app/demo/mill-production/page.tsx` (REWRITTEN, 273 → 15 lines)

```tsx
import { requireRole } from '@/lib/auth';
import { getProductionOrders } from '@/services/millProduction';
import DashboardLayout from '@/components/DashboardLayout';
import MillProductionUI from '@/components/MillProductionUI';

export default async function MillProductionPage() {
  await requireRole('demo');
  const orders = await getProductionOrders();

  return (
    <DashboardLayout>
      <MillProductionUI orders={orders} />
    </DashboardLayout>
  );
}
```

No `'use client'`. No hooks. Guard precedes data fetch (line 7 < line 8 — verified by `awk` in acceptance criteria).

### What Was Dropped — Not Lifted

| Item                                          | Old location           | Why dropped                                                                                                                         |
| --------------------------------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `useState<ProductionOrder[]>([])`             | `page.tsx:199`         | Data is now a prop; client component receives a stable array from the RSC.                                                          |
| `useState<loading>(true)`                     | `page.tsx:200`         | Server-side fetch resolves before render — there is no loading state on the client.                                                 |
| `useEffect(() => getProductionOrders()...)`   | `page.tsx:227-239`     | Direct service call from the client was the exact pattern Phase 28 forbids (T-28-05-01 information-disclosure mitigation).          |
| `LoadingSkeleton` component                   | `page.tsx:175-196`     | Unreachable in the new pattern (no client loading state). Cross-file `grep -rn LoadingSkeleton src/` confirmed no other importers.   |
| `loading ? <LoadingSkeleton /> : (...)`       | `page.tsx:262-270`     | Ternary collapsed — render the column flex directly.                                                                                |
| `<DashboardLayout>` wrapper inside client     | `page.tsx:248-271`     | Layout wraps the RSC page now; `MillProductionUI` renders a fragment, not the layout shell.                                         |

### `src/app/demo/mill-production/__tests__/page.test.tsx` (MIGRATED)

Replaced the inline `jest.mock('next/navigation', () => ({ useRouter, usePathname }))` block with the 28-01 fixture factories. New `beforeEach` seeds `mockAuth.mockReset(); mockDemoSession();` so the four green-path render tests run with the demo-role default. Removed the `LoadingSkeleton uses design tokens` test (LoadingSkeleton no longer renders); kept the FilterPill-import test in adapted form on the page (it still proves the filter strip reaches DOM); added three redirect-branch tests; converted every render call to the async-RSC invocation `const element = await MillProductionPage(); render(element);`.

Final page-test inventory:

| Test Group                       | Before | After | Notes                                                                  |
| -------------------------------- | ------ | ----- | ---------------------------------------------------------------------- |
| Filter-pill imports / strip      | 1      | 1     | Reframed to role-based pill selector                                   |
| Loading-skeleton design tokens   | 1      | 0     | LoadingSkeleton dropped; coverage moved to component (Task 1 Test 6)   |
| ProductionCard design tokens     | 1      | 0     | Same as above — moved to component                                     |
| State-based filtering (pills)    | 1      | 1     | Survives                                                               |
| Display orders by mill line      | 1      | 1     | Heading-based selectors                                                |
| Data rendering                   | 1      | 1     | Survives                                                               |
| **Redirect branches (NEW)**      | 0      | 3     | /sign-in, user → /, admin → /                                          |
| **Server-side fetch count (NEW)**| 0      | 1     | Asserts `getProductionOrders` invoked exactly once                     |
| **Total**                        | **6**  | **7** | +3 redirect, +1 fetch-count, −1 LoadingSkeleton, −1 redundant card test, +1 reframed filter-pill |

## Audit-Table Row for 28-06

| Route                       | Before                                                                                                                | After                                                                                                                                                              |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/demo/mill-production`     | `'use client'`; in-component `useEffect(() => getProductionOrders().then(setOrders))`; LoadingSkeleton; no role guard. | async RSC; `await requireRole('demo')` first; `await getProductionOrders()` server-side; `<MillProductionUI orders={orders} />` client wrapper; LoadingSkeleton dropped. |

## Cross-File Fallout Discovered

`grep -rn LoadingSkeleton src/` returns one match — `src/components/__tests__/MillProductionUI.test.tsx:144`, which is a **comment** in the empty-state test asserting LoadingSkeleton must NOT render. No production code references it; the deletion is safe.

## Deviations from Plan

### Auto-fixed Issues

**None.** Both tasks reached their done criteria on the first GREEN pass. No Rule 1/2/3 issues triggered.

### Plan-Spec Deltas (Documentation-Only)

**1. [Plan-driven, no scope change] Quote-style on the `requireRole` call.**
- **Initial implementation:** `await requireRole("demo");` (double quotes, matching the original file's house style of double quotes elsewhere).
- **Adjusted to:** `await requireRole('demo');` (single quotes).
- **Why:** The plan's acceptance criterion `grep "await requireRole('demo')"` is a literal-string match; the canonical 28-02 customer-detail page also uses single quotes (`src/app/demo/customers/[id]/page.tsx:16`). Aligned to the canonical pattern. Tests stayed green across the change.

**2. [Plan-driven] `MillProductionUI` renders a fragment, not a `<DashboardLayout>` shell.**
- **Plan said:** "drop the `<DashboardLayout>` wrapper from the old page body — the layout wraps the RSC page now, not this client component."
- **Implemented exactly as specified.** Listed here because it changes the visual layout invariant: any code that depended on the layout wrapper being inside the client tree would break. Verified safe: no such consumer exists; all visible UI structure is preserved because the RSC page wraps `<MillProductionUI>` in `<DashboardLayout>`.

**3. [Plan-driven] Three Filter-Pill assertions reframed to role-based selectors.**
- **Plan suggested:** "FilterPill renders state filters" test (existing lines 64-77) can either stay or be migrated. I kept it on the page test as `renders filter pills for all production states` and on the component as Test 2/3/5. Both layers now assert via `getByRole('button', { name: /Filter by Mixing/i })` rather than text — the FilterPill's `aria-label="Filter by Mixing, N orders"` is unambiguous; pure-text queries collided with the `StateSection` headers which also render state names.

## Auth Gates Encountered

**None.** Unit-test refactor; no live Clerk traffic.

## Verification Results

| Check                                                                                                | Result                              |
| ---------------------------------------------------------------------------------------------------- | ----------------------------------- |
| `npm test -- --runInBand src/components/__tests__/MillProductionUI.test.tsx`                         | `Tests: 6 passed, 6 total`          |
| `npm test -- --runInBand src/app/demo/mill-production`                                               | `Tests: 7 passed, 7 total`          |
| `npm test -- --runInBand <both targets above>`                                                       | `Tests: 13 passed, 13 total`        |
| `head -1 src/components/MillProductionUI.tsx`                                                        | `"use client";`                     |
| `grep -c "from '@/services/millProduction'" src/components/MillProductionUI.tsx`                     | `0`                                 |
| `grep -c "useEffect\|LoadingSkeleton\|useState<ProductionOrder\[\]>" src/components/MillProductionUI.tsx` | `0`                              |
| `grep "interface MillProductionUIProps" src/components/MillProductionUI.tsx`                         | match (exported)                    |
| `grep -c "STATE_ORDER\|ProductionCard\|StateSection\|MillColumn" src/components/MillProductionUI.tsx`| `13` (≥ 4 required)                 |
| `grep -c "^'use client'" src/app/demo/mill-production/page.tsx`                                      | `0`                                 |
| `grep "export default async function MillProductionPage" src/app/demo/mill-production/page.tsx`      | match                               |
| `grep "await requireRole('demo')" src/app/demo/mill-production/page.tsx`                             | match                               |
| `awk` (requireRole precedes getProductionOrders)                                                     | exit `0` — line 7 < line 8          |
| `wc -l src/app/demo/mill-production/page.tsx`                                                        | `15` (≤ 25 required)                |
| `grep -c "useState\|useEffect\|useMemo" src/app/demo/mill-production/page.tsx`                       | `0`                                 |
| `grep -c "redirects to /\|redirects to /sign-in" .../page.test.tsx`                                  | `3`                                 |
| `grep -c "clerkAuthMockFactory" .../page.test.tsx`                                                   | `2` (≥ 1 required)                  |
| `grep -c "render(<MillProductionPage" .../page.test.tsx`                                             | `0`                                 |
| `grep -c "await MillProductionPage()" .../page.test.tsx`                                             | `4` (≥ 1 required)                  |
| `npx tsc --noEmit` errors on the two touched src files                                               | `0`                                 |
| `grep -rn "from '@/services/millProduction'" src/components/ src/hooks/`                             | `0` (no client/hook leak)           |

### Pre-existing Out-of-Scope Failures (Scope Boundary applied)

The full-suite `npm test -- --runInBand` reports 14 failures across 5 suites. Verified at base commit `87d92f1` — all 14 failures predate plan 28-05:

- `src/app/settings/__tests__/page.test.tsx` (14 failures, unrelated render-pipeline issue)
- `e2e/route-protection.spec.ts`, `e2e/demo-route-protection.spec.ts`, `e2e/demo-route-protection-unauth.spec.ts`, `e2e/production-smoke.spec.ts` — Playwright `.spec.ts` files routed into jest because `jest.config.ts` is missing `testPathIgnorePatterns: ['<rootDir>/e2e/']`.

Logged to `.planning/phases/28-client-component-security-audit/deferred-items.md`. No file touched by plan 28-05 references settings or e2e routing; per Scope Boundary, not fixed here.

## TDD Gate Compliance

- **Task 1 RED gate:** `test(28-05): add failing component tests for MillProductionUI client wrapper` at `fdc6708` — `Cannot find module '../MillProductionUI'`.
- **Task 1 GREEN gate:** `feat(28-05): extract MillProductionUI client component` at `d3918d2` — `Tests: 6 passed, 6 total`.
- **Task 2 RED gate:** `test(28-05): migrate mill-production page test to async-RSC harness (RED)` at `6c1cc23` — `Tests: 7 failed, 7 total` (the still-client page raised `useState` outside a render context for every test).
- **Task 2 GREEN gate:** `refactor(28-05): mill-production page becomes async RSC with requireRole guard` at `8fbbfc4` — `Tests: 7 passed, 7 total`.
- **REFACTOR gate:** not needed on either task; both implementations were already minimal and matched the canonical 28-02 / OrdersTable shapes.

## Known Stubs

**None.** Every new line is wired production code. `MillProductionUI` receives a real prop, renders real ProductionCards, and toggles real filter state. `MillProductionPage` calls a real role guard and a real service. The mock data inside `getProductionOrders` is the existing fixture (per D-07, treated as canonical "sensitive" and unchanged when real data lands).

## Threat Flags

None. This plan tightens trust boundaries:

- **T-28-05-01** (info disclosure via client-side service import) — **mitigated.** `grep -c "from '@/services/millProduction'" src/components/MillProductionUI.tsx` returns 0. The client wrapper never reaches the service.
- **T-28-05-02** (EoP via middleware drift) — **mitigated.** Page-level `await requireRole('demo')` guard verified by three new redirect-branch tests; D-05 defense-in-depth pattern now lands the fourth `/demo/*` page.
- **T-28-05-03** (developer re-introduces `useEffect` fetch) — **accept** per plan; point-in-time guard via the Task 1 source assertion. A future lint-rule phase is out of scope.
- **T-28-05-04** (no logging) — **accept** per Phase 25 D-02.

## Next Phase Readiness

Plan 28-06 (audit table) can now mark `/demo/mill-production` ✅ across all three boundary checks:

| Check                                                              | Result |
| ------------------------------------------------------------------ | ------ |
| Page-level `await requireRole('demo')` before any data fetch       | ✅     |
| Client component does not import any `@/services/*` module         | ✅     |
| Page test covers `/sign-in` redirect + non-demo `/` redirect       | ✅     |

## Self-Check: PASSED

- `src/components/MillProductionUI.tsx` — FOUND
- `src/components/__tests__/MillProductionUI.test.tsx` — FOUND
- `src/app/demo/mill-production/page.tsx` — FOUND (rewritten to 15 lines, async RSC)
- `src/app/demo/mill-production/__tests__/page.test.tsx` — FOUND (migrated to 28-01 fixture)
- `.planning/phases/28-client-component-security-audit/deferred-items.md` — FOUND
- Commit `fdc6708` (test, Task 1 RED) — FOUND in `git log --oneline -6`
- Commit `d3918d2` (feat, Task 1 GREEN) — FOUND in `git log --oneline -6`
- Commit `6c1cc23` (test, Task 2 RED) — FOUND in `git log --oneline -6`
- Commit `8fbbfc4` (refactor, Task 2 GREEN) — FOUND in `git log --oneline -6`
- `npm test -- --runInBand src/app/demo/mill-production src/components/__tests__/MillProductionUI.test.tsx` — `Tests: 13 passed, 13 total`
- `npx tsc --noEmit` errors on the two touched src files — `0`

---
*Phase: 28-client-component-security-audit*
*Plan: 05*
*Completed: 2026-05-12*
