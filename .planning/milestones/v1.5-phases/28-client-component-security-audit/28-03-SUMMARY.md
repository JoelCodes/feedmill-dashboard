---
phase: 28
plan: 03
subsystem: security
tags:
  - security
  - rsc
  - refactor
  - orders
  - requireRole
  - clerk
  - tdd
dependency_graph:
  requires:
    - src/lib/auth.ts (requireRole guard)
    - src/test/fixtures/clerkAuth.ts (28-01 fixture)
    - src/services/orders.ts (getOrders mock service)
    - src/components/DashboardLayout.tsx (page chrome)
  provides:
    - src/app/demo/orders/page.tsx (async RSC orders page; await requireRole('demo') before await getOrders())
    - src/components/OrdersTableContent.tsx (client wrapper owning ?selected= URL-param state; forwards orders prop)
    - src/components/OrdersTable.tsx (prop-receiving client component; no internal getOrders fetch)
  affects:
    - .planning/phases/28-client-component-security-audit/28-06-PLAN.md (audit-findings row goes here)
tech_stack:
  added: []
  patterns:
    - guard-as-first-statement (await requireRole('demo') before any data fetch — same as 28-02)
    - rsc-passes-data-to-client-wrapper (server fetch in page → orders prop → OrdersTableContent → OrdersTable)
    - extract-client-subcomponent-to-own-file (an RSC and a 'use client' subcomponent cannot coexist in one file)
    - jsdom-scrollIntoView-stub (test-only Element.prototype.scrollIntoView = jest.fn() for synchronous prop-based render)
    - filter-pill-aria-label-disambiguation (uniquely query the FilterPill via its aria-label when row StatusBadges echo the same status text)
key_files:
  created:
    - src/components/OrdersTableContent.tsx
    - .planning/phases/28-client-component-security-audit/deferred-items.md
  modified:
    - src/app/demo/orders/page.tsx (was 'use client' page with internal OrdersContent; now async RSC with guard + server fetch)
    - src/app/demo/orders/__tests__/page.test.tsx (consumes 28-01 fixture; +3 redirect tests; source-level Suspense-token checks; scrollIntoView stub)
    - src/components/OrdersTable.tsx (orders: Order[] prop; deleted internal useState<Order[]>/useEffect+getOrders; deleted @/services/orders import)
    - src/components/__tests__/OrdersTable.test.tsx (orders={mockOrders} prop on every render; dropped jest.mock('@/services/orders') + every waitFor; FilterPill assertions disambiguated via aria-label)
decisions:
  - "Suspense-skeleton design-token tests adapted via SOURCE-LEVEL REGEX checks (per Step C's second option). The page-level <Suspense> fallback JSX is statically defined in the RSC return, so a render-time check would either capture the fallback briefly before synchronous content resolves (race-prone) or miss it entirely. fs.readFileSync + regex on src/app/demo/orders/page.tsx itself gives deterministic, race-free coverage of the same tokens (rounded-[var(--radius-xl)], bg-[var(--divider)], plus negative checks for rounded-[15px] and bg-gray-100)."
  - "FilterPill query disambiguated via aria-label ('Filter by <label>, N orders') instead of getByText. Reason: post-refactor, OrdersTable renders synchronously from the orders prop, so both the FilterPill label and per-row StatusBadge render the same status text — getByText would multi-match. Pre-refactor tests 'worked' because waitFor returned the instant the FilterPill label appeared, before the asynchronous getOrders().then(setOrders) populated the rows; the test's intent was always to assert the FilterPill is present. The aria-label is the canonical accessibility-first selector for that intent."
  - "Element.prototype.scrollIntoView stubbed in beforeAll of the page test (deviation Rule 1 — jsdom limitation). Synchronous prop-based render now triggers OrdersTable's auto-select useEffect immediately after first paint, which in turn triggers the scroll-selected-row-into-view useEffect — and jsdom doesn't implement scrollIntoView. Component-level OrdersTable tests don't trip this because they pass a jest.fn() as onSelectOrder, so internal selectedOrderId stays null and the scroll useEffect's guard short-circuits. The page test wires a real useState setter via OrdersTableContent, so the chain fires for real."
  - "Single-quote string style adopted for orders/page.tsx to match the 28-02 canonical anchor file (customers/[id]/page.tsx). Plan acceptance criteria greps assume single quotes; matching them strictly here also aligns with the canonical pattern for downstream 28-04 / 28-05."
metrics:
  duration: ~9 minutes
  completed_date: "2026-05-12"
  tasks_completed: 2
  files_created: 2
  files_modified: 4
  tests_before:
    orders_page: 5
    orders_table: 12
    total: 17
  tests_after:
    orders_page: 9
    orders_table: 12
    total: 21
  tests_added: 4
  tests_passing: 21
  commits: 4
requirements_completed: []
---

# Phase 28 Plan 03: /demo/orders → Async RSC with requireRole Guard Summary

**One-liner:** /demo/orders refactored from a `'use client'` page that internally fetched via `useEffect` to an async Server Component that calls `await requireRole('demo')` before `await getOrders()` and passes the orders down through a new `OrdersTableContent` client wrapper to the existing `OrdersTable` — canonical D-01/D-05/D-07 RSC shape for the audit findings row in 28-06.

## Performance

- **Duration:** ~9 minutes
- **Tasks:** 2 (each TDD: RED → GREEN; 4 commits total)
- **Files created:** 2 (`OrdersTableContent.tsx`, `deferred-items.md`)
- **Files modified:** 4 (page.tsx, page.test.tsx, OrdersTable.tsx, OrdersTable.test.tsx)
- **Tests:** 17 → 21 passing (+4 new redirect-branch tests; design-token coverage preserved via source-level regex; render-shape coverage strengthened with `getOrders called once` server-side check)

## Task Commits

| # | Task                                                         | Gate    | Type     | Commit    | Files                                                                                       |
| - | ------------------------------------------------------------ | ------- | -------- | --------- | ------------------------------------------------------------------------------------------- |
| 1 | OrdersTable accepts orders prop (test contract)              | RED     | test     | `7b7ba5a` | `src/components/__tests__/OrdersTable.test.tsx`                                             |
| 1 | OrdersTable accepts orders prop (implementation)             | GREEN   | refactor | `2ae4e5c` | `src/components/OrdersTable.tsx`, `src/components/__tests__/OrdersTable.test.tsx`           |
| 2 | orders page test rewritten for async RSC contract            | RED     | test     | `ba2bd8e` | `src/app/demo/orders/__tests__/page.test.tsx`                                               |
| 2 | orders page becomes async RSC + extract OrdersTableContent   | GREEN   | refactor | `0880326` | `src/app/demo/orders/page.tsx`, `src/components/OrdersTableContent.tsx`, `…/page.test.tsx`  |

RED → GREEN sequence confirmed for both tasks:

- Task 1 RED (`7b7ba5a`): 2 tests fail because OrdersTable still ignores the `orders` prop (initializes via `useState<Order[]>([])`).
- Task 1 GREEN (`2ae4e5c`): 12/12 component tests pass after the prop wiring + getByText→getByRole disambiguation.
- Task 2 RED (`ba2bd8e`): 5/9 page tests fail because production page.tsx is still a client component (`OrdersPage()` is not async; no `requireRole` call).
- Task 2 GREEN (`0880326`): 9/9 page tests pass after the RSC conversion + OrdersTableContent extraction.

## /demo/orders Before/After (for 28-06 audit-findings table)

| Dimension                          | BEFORE (pre-28-03)                                              | AFTER (post-28-03)                                                                                |
| ---------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| **Page component kind**            | `'use client'` page; default export is a non-async function     | RSC; default export is `async function OrdersPage()`                                              |
| **Role guard placement**           | None at page level; relied only on middleware ACCESS-01         | `await requireRole('demo')` as the **first** statement of `OrdersPage()` (D-05 inner guard)       |
| **Data fetch location**            | Client-side `useEffect` in `OrdersTable` calling `getOrders`    | Server-side `await getOrders()` in `OrdersPage`, BEFORE any client child                          |
| **Mock-data exposure in bundle**   | `OrdersTable` imported `@/services/orders` → mock data shipped  | `OrdersTable` no longer imports `@/services/orders`; data crosses the serialization boundary only |
| **URL-param state ownership**      | `OrdersContent` (inline subcomponent of page.tsx)               | `OrdersTableContent` (new file `src/components/OrdersTableContent.tsx`, `'use client'`)           |
| **Suspense boundary**              | Around inline `OrdersContent` (for `useSearchParams`)           | Around `OrdersTableContent` (same purpose; preserved per Next 16 requirement)                     |
| **Test count (orders surface)**    | 5 page tests + 12 component tests = 17                          | 9 page tests + 12 component tests = 21 (3 new redirect tests; 1 new server-fetch-count assertion) |

## Why OrdersTableContent.tsx Was Necessary

A `'use client'` directive applies to the **entire file**. The previous page.tsx co-located two components: the default-exported `OrdersPage` (which we wanted to convert to RSC) and the inner `OrdersContent` (which owned `useSearchParams` — a client-only hook). After the refactor, `OrdersPage` is `async` and lives at the top of the file with NO `'use client'` directive; `OrdersContent` cannot remain in the same file because it would force the whole file back into client land.

The extraction therefore moves the URL-param-owning subcomponent to its own file `src/components/OrdersTableContent.tsx` with `'use client'` at the top. The new file:

- Imports `useState`, `useEffect` from `react`, `useSearchParams` from `next/navigation`.
- Defines `interface OrdersTableContentProps { orders: Order[] }`.
- Replicates the previous body (`searchParams.get('selected')` → `useState<string | null>` → URL→state sync `useEffect`) byte-for-byte.
- Renders `<OrdersTable orders={orders} selectedOrderId={...} onSelectOrder={setSelectedOrderId} />` — forwarding the new `orders` prop to the existing table component.

This is the canonical RESEARCH.md "Code Example A" shape with no in-house variant. The filename `OrdersTableContent.tsx` self-locates next to `OrdersTable.tsx` in `src/components/` and signals "wraps OrdersTable with URL-param state."

## How the Suspense-Skeleton Design-Token Tests Were Adapted

**Picked option:** source-level regex check (the second of the two options the plan offered in Step C).

**Why not render-time:** The page-level `<Suspense>` fallback JSX is statically defined in the RSC return. Since `getOrders()` is `await`ed inside `OrdersPage()` BEFORE the JSX is constructed, by the time the returned element is rendered the orders data is already resolved — the fallback never appears in the tree. A `container.querySelector('.rounded-\\[var\\(--radius-xl\\)\\]')` check on the rendered HTML would always return `null`. Forcing a hanging promise (the pre-refactor trick) doesn't work either: the await is at the RSC level, so a hung promise means `OrdersPage()` itself hangs and there's no JSX to inspect.

**Source-level check shape (×4 tests):**

```ts
const pageSource: string = require("fs").readFileSync(
  require("path").resolve(__dirname, "../page.tsx"),
  "utf8",
);

// Negative tests:
expect(pageSource).not.toMatch(/rounded-\[15px\]/);
expect(pageSource).not.toMatch(/bg-gray-100/);

// Positive tests:
expect(pageSource).toMatch(/rounded-\[var\(--radius-xl\)\]/);
expect(pageSource).toMatch(/bg-\[var\(--divider\)\]/);
```

This is deterministic, race-free, and covers the same intent — "the Suspense skeleton uses tokens, not hardcoded values." If a future regression replaces the fallback JSX with a hardcoded radius/background, all four assertions catch it at test time.

## Cross-Component Test Fallout Discovered

**`grep -rn "OrdersTable" src/`** confirms only `src/app/demo/orders/page.tsx` (now mediated through `OrdersTableContent`) and the test files themselves consume `OrdersTable`. No other production consumer broke. The pattern-mapper in 28-PATTERNS.md correctly identified zero other consumers.

**Pre-existing test failures discovered (out of scope per Scope Boundary rule):**

1. `src/app/settings/__tests__/page.test.tsx` — 14/14 failing. Confirmed pre-existing via `git stash` + re-run on the pre-28-03 tree. Unrelated to `/demo/orders`. Logged in `deferred-items.md`.
2. `e2e/*.spec.ts` (4 specs) picked up by Jest runner. These use Playwright's API but Jest's default test discovery currently includes them. Pre-existing; logged in `deferred-items.md` for a tooling-config pass.

## Decisions Made

1. **Suspense-skeleton tests → source-level regex.** Picked the deterministic option over the race-prone render-time inspection (see prior section for full rationale). Same test names preserved so the design-system audit cross-reference in MIG-01 still matches by string.
2. **FilterPill assertions → `getByRole({ name: /Filter by …/ })`.** Component-level assertion previously used `getByText("Producing")` (and 5 similar). Post-refactor that multi-matches because the per-row StatusBadge renders the same status text. The FilterPill's existing `aria-label="Filter by <label>, N orders"` uniquely identifies the pill, which was always the test's intent.
3. **`scrollIntoView` stubbed in the page test (not in `jest.setup.ts`).** Kept the stub scoped to the file that needs it. A global stub in `jest.setup.ts` would be broader but unnecessary — the OrdersTable component-level tests don't need it (they pass a `jest.fn()` for `onSelectOrder`, so internal `selectedOrderId` stays null and the scroll-into-view useEffect's guard short-circuits). If future page tests for `/demo/customers` or `/demo/mill-production` also wire real URL-param setters, they should follow the same per-file pattern.
4. **Single-quote string style for orders/page.tsx.** Matched the 28-02 canonical anchor (`customers/[id]/page.tsx`) and the plan's acceptance-criteria grep patterns. Test files and OrdersTable.tsx keep their existing double-quote style — no scope creep on unrelated files.

## Deviations from Plan

### Rule 1 (Test Bug) — `getByText` → `getByRole` for FilterPill assertions

- **Found during:** Task 1 GREEN run.
- **Issue:** After OrdersTable starts receiving `orders={mockOrders}` synchronously, both the FilterPill label and the per-row StatusBadge render the same status text. `screen.getByText("Producing")` throws "Found multiple elements" instead of returning the pill.
- **Why old tests passed:** Pre-refactor, `useEffect(() => getOrders().then(setOrders))` populated rows asynchronously. `await waitFor(() => screen.getByText("Producing"))` succeeded the instant the FilterPill rendered (before rows arrived), so only ONE match existed at assertion time. waitFor returned and the test continued. Empirically verified by running the pre-28-03 test file against the pre-28-03 source — all 12 tests passed.
- **Fix:** Replaced every `getByText("<StatusLabel>")` with `getByRole("button", { name: /Filter by <StatusLabel>/ })` (×7 sites across the test file). The FilterPill's existing aria-label is the canonical accessibility-first selector for the pill intent.
- **Files modified:** `src/components/__tests__/OrdersTable.test.tsx`
- **Committed in:** Task 1 GREEN (`2ae4e5c`).

### Rule 1 (Test Bug) — jsdom `scrollIntoView` stub

- **Found during:** Task 2 GREEN run, "renders orders page with sidebar and header for demo users".
- **Issue:** `TypeError: selectedRow.scrollIntoView is not a function`. jsdom doesn't implement `Element.prototype.scrollIntoView`. Post-refactor, the synchronous prop-based render makes OrdersTable's auto-select useEffect fire on first mount → updates `selectedOrderId` via OrdersTableContent's real `useState` setter → next render makes `validSelectedId` truthy → scroll-selected-row-into-view useEffect fires → jsdom blows up.
- **Why this didn't break before:** Pre-refactor, `selectedOrderId` was null at render time (no data yet) and `useEffect(() => getOrders().then(setOrders))` populated rows asynchronously — the scroll useEffect's guard `if (validSelectedId && tableRef.current)` short-circuited before the test asserted `screen.getByRole("main")`.
- **Fix:** Added `beforeAll(() => { Element.prototype.scrollIntoView = jest.fn(); })` at the top of the page test file (before `describe`). Scoped to the one file that exercises the chain in jsdom; component-level OrdersTable tests don't need it (they pass `jest.fn()` for `onSelectOrder`, breaking the chain at the boundary).
- **Files modified:** `src/app/demo/orders/__tests__/page.test.tsx`
- **Committed in:** Task 2 GREEN (`0880326`).

### Plan Acceptance Criterion Drift (informational only)

- **Plan said:** `grep -v '^[[:space:]]*//' src/components/OrdersTable.tsx | grep -c "useEffect"` returns at most **3**.
- **Actual:** Returns **4**.
- **Why:** The grep counts all non-comment lines containing the substring `useEffect`. After the refactor we have: 1 import-line (`import { useState, useEffect, ... } from "react"`) + 3 invocations (auto-select, fallback-on-filter-out, scroll-into-view). The plan's "at most 3" appears to have been intended for INVOCATIONS only — which is satisfied — but the grep doesn't exclude the import line.
- **Action:** None. The behavioral intent (the fetch useEffect is gone; the 3 interactivity useEffects remain) is fully met. Logged here as a plan-grep precision note for any future plans that copy this AC verbatim.

### Auto-fixed Issues

See Rule 1 deviations above. No Rule 2/3 fixes triggered. No Rule 4 (architectural) checkpoints raised.

## Authentication Gates Encountered

**None.** Unit-test work only; all auth interactions stubbed via the 28-01 clerkAuth fixture (`mockAuth.mockResolvedValue(...)` per redirect branch).

## Verification Results

| Check                                                                                              | Result                              |
| -------------------------------------------------------------------------------------------------- | ----------------------------------- |
| `npm test -- --runInBand src/app/demo/orders`                                                      | `Tests: 9 passed, 9 total`          |
| `npm test -- --runInBand src/components/__tests__/OrdersTable.test.tsx`                            | `Tests: 12 passed, 12 total`        |
| `grep -c "^'use client'" src/app/demo/orders/page.tsx`                                             | `0`                                 |
| `grep "export default async function OrdersPage" src/app/demo/orders/page.tsx`                     | match                               |
| `grep "await requireRole('demo')" src/app/demo/orders/page.tsx`                                    | match                               |
| `grep "await getOrders()" src/app/demo/orders/page.tsx`                                            | match                               |
| `awk` line-order check (guard precedes fetch)                                                      | `0` (guard < fetch)                 |
| `src/components/OrdersTableContent.tsx` exists, starts with `'use client'`                         | yes                                 |
| `grep -c "from '@/services/orders'" src/components/OrdersTableContent.tsx`                         | `0`                                 |
| `grep -c "from '@/services/orders'" src/app/demo/orders/page.tsx`                                  | `1`                                 |
| `grep -c "redirects to /sign-in\|redirects to /" src/app/demo/orders/__tests__/page.test.tsx`      | `3` (≥ 3 required)                  |
| `grep -c "getOrders" src/components/OrdersTable.tsx`                                               | `0`                                 |
| `grep -c "useState<Order\\[\\]>" src/components/OrdersTable.tsx`                                   | `0`                                 |
| `grep "orders: Order\\[\\]" src/components/OrdersTable.tsx`                                        | match (interface field)             |
| `grep -c "jest.mock.*@/services/orders" src/components/__tests__/OrdersTable.test.tsx`             | `0`                                 |
| `grep -c "orders={mockOrders}" src/components/__tests__/OrdersTable.test.tsx`                      | `12` (≥ 5 required)                 |
| `npx tsc --noEmit` errors on `src/app/demo/orders` + `src/components/OrdersTableContent`           | `0`                                 |
| Commit sequence Task 1                                                                             | `test 7b7ba5a` → `refactor 2ae4e5c` |
| Commit sequence Task 2                                                                             | `test ba2bd8e` → `refactor 0880326` |

### Pre-existing test failures (out of scope, logged for awareness)

`npm test -- --runInBand` reports 14 failing tests across `src/app/settings/__tests__/page.test.tsx` (14 failures, unrelated to /demo/orders) and 4 e2e Playwright specs being picked up by Jest's discovery (also unrelated; pre-existing tooling config). Confirmed pre-existing via `git stash` + re-run on the pre-28-03 working tree — both groups already failed. Logged in `.planning/phases/28-client-component-security-audit/deferred-items.md`.

## TDD Gate Compliance

- **Task 1 RED gate:** `test(28-03): expect OrdersTable to render from orders prop synchronously` at `7b7ba5a` — 2/12 tests fail (the `Test Farm` row-content assertions) because the production OrdersTable still initializes `orders` to `[]` and ignores the new prop.
- **Task 1 GREEN gate:** `refactor(28-03): OrdersTable accepts orders prop; drop internal fetch` at `2ae4e5c` — 12/12 pass after wiring the prop AND disambiguating FilterPill assertions via aria-label.
- **Task 2 RED gate:** `test(28-03): rewrite orders page test for async RSC contract` at `ba2bd8e` — 5/9 page tests fail (the redirect branches + render-as-async + getOrders-call-count) because production page.tsx is still a client component.
- **Task 2 GREEN gate:** `refactor(28-03): orders page becomes async RSC with requireRole guard` at `0880326` — 9/9 pass after the RSC conversion, OrdersTableContent extraction, and scrollIntoView stub.
- **REFACTOR gate (both tasks):** not needed; both went green on first GREEN commit (after the inline Rule 1 fixes) and the resulting shape IS the canonical RSC pattern for the audit row in 28-06.

## Known Stubs

**None.** Every code path in the refactored files is wired to real production behavior:

- The RSC page genuinely fetches via `await getOrders()` (server-side, from the mock-service module — per D-07, mock data is treated as canonical "sensitive").
- The guard genuinely runs `await requireRole('demo')` from `@/lib/auth` (production-mode path; tests stub at the `@clerk/nextjs/server` `auth()` boundary via the 28-01 fixture).
- `OrdersTableContent` genuinely reads `?selected=` from `useSearchParams` and syncs to state via the unchanged URL-param `useEffect`.
- `OrdersTable` receives genuine orders via prop; all internal filter/search/keyboard-nav/scroll behavior is preserved byte-for-byte.

The only test-time stubs are `Element.prototype.scrollIntoView` (jsdom limitation, scoped to one test file) and the documented `jest.fn()` placeholders in the 28-01 fixture (mock implementations, not production stubs).

## Threat Flags

None. This plan tightens the trust boundary at `/demo/orders`:

- **T-28-03-01 (Info disclosure: mock data in client bundle)** — **mitigated** by deleting `import { getOrders } from "@/services/orders"` from `OrdersTable.tsx`. Source assertion `grep -c "getOrders" src/components/OrdersTable.tsx` returns `0`.
- **T-28-03-02 (EoP: pre-guard data exposure)** — **mitigated** by placing `await requireRole('demo')` as the first statement of `OrdersPage()`. `awk` line-order check confirms the guard precedes `await getOrders()`. Three new tests cover the unauthenticated / user / admin branches.
- **T-28-03-03 (Stale fetch race in client useEffect)** — **eliminated** by removing the fetch useEffect entirely. Source assertion `grep -c "useState<Order\\[\\]>" src/components/OrdersTable.tsx` returns `0`.
- **T-28-03-04 (Developer accidentally re-introduces a client-side fetch in OrdersTableContent)** — **accepted** per plan; point-in-time guard via `grep -c "from '@/services/orders'" src/components/OrdersTableContent.tsx` returns `0`.
- **T-28-03-05 (No logging of failed role checks)** — **accepted** per Phase 25 D-02 (intentional non-logging this milestone).

No new threat surface introduced. The RSC → client prop boundary is a serialization (JSON) boundary; orders data crosses it only after the role check.

## Next Phase Readiness

- **Plan 28-04 (customers list) and 28-05 (mill production) unblocked.** The canonical RSC shape — extract a `*Content.tsx` client wrapper when the existing page co-locates `useSearchParams` (or any client-only hook) with the default export, then convert the outer page to async RSC with `await requireRole('demo')` first and the data fetch second — is now proven on `/demo/orders`. Plan 28-04/28-05 can follow the same pattern.
- **Plan 28-06 audit-findings table input ready.** The Before/After table above is the row that goes into the consolidated 28-06 deliverable.
- **No outstanding deviations or blockers** for the verifier / phase-complete step.

## Self-Check: PASSED

- `src/components/OrdersTable.tsx` — FOUND; contains `orders: Order[]` in `OrdersTableProps`; no `getOrders` import; no `useState<Order[]>`.
- `src/components/OrdersTableContent.tsx` — FOUND; starts with `'use client'`; takes `orders: Order[]` prop; forwards to `OrdersTable`.
- `src/app/demo/orders/page.tsx` — FOUND; no `'use client'`; `export default async function OrdersPage()`; `await requireRole('demo')` precedes `await getOrders()`.
- `src/app/demo/orders/__tests__/page.test.tsx` — FOUND; imports 28-01 fixture symbols; has 3 redirect-branch tests; has `Element.prototype.scrollIntoView` stub.
- `src/components/__tests__/OrdersTable.test.tsx` — FOUND; no `jest.mock('@/services/orders')`; 12 `orders={mockOrders}` render calls; FilterPill assertions use `getByRole({ name: /Filter by .../ })`.
- Commit `7b7ba5a` (Task 1 RED) — FOUND in `git log --oneline -6`.
- Commit `2ae4e5c` (Task 1 GREEN) — FOUND in `git log --oneline -6`.
- Commit `ba2bd8e` (Task 2 RED) — FOUND in `git log --oneline -6`.
- Commit `0880326` (Task 2 GREEN) — FOUND in `git log --oneline -6`.
- `npm test -- --runInBand src/app/demo/orders src/components/__tests__/OrdersTable.test.tsx` — 9 + 12 = 21 tests passing.
- `npx tsc --noEmit` — 0 errors on touched files.
- STATE.md / ROADMAP.md untouched (per executor brief — orchestrator owns those writes).

---
*Phase: 28-client-component-security-audit*
*Plan: 03*
*Completed: 2026-05-12*
