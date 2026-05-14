---
phase: 34-production-dashboard-ui-and-homepage-promotion
type: human-uat
created: 2026-05-14
status: diagnosed
inherited_from: 33-server-actions-queries-and-bulk-import (GAP-02)
updated: 2026-05-14
---

# Phase 34 Human UAT Contract

This document captures the manual UAT for Phase 34 (Production Dashboard UI and Homepage Promotion). All tests must be executed against `npm run dev` before the phase is marked complete.

## Preconditions

1. Run `npm run dev` — server must be running at `http://localhost:3000`.
2. Seed data must be present in the Neon dev DB (use Phase 32 seed or Phase 33 harness).
3. A `mill_operator` test user must exist in Clerk Dashboard with `publicMetadata: { roles: ['mill_operator'] }`.
4. Sign in as the `mill_operator` test user before running tests T2–T12.

---

## Tests

### T1. Auth gate on `/` (unauthenticated → /sign-in)

**Steps:**
1. Sign out (or open an incognito window with no active session).
2. Navigate to `http://localhost:3000/`.

**Pass criteria:** Browser redirects to `/sign-in`. No production data is visible before auth.

**Fail criteria:** Page loads or shows any production data without authentication.

**Observed result:** `pass`

---

### T2. Three-column live dashboard render (PROD-01, PROD-02)

**Steps:**
1. Sign in as `mill_operator`.
2. Navigate to `http://localhost:3000/`.
3. Observe the production dashboard.

**Pass criteria:**
- Page renders with three columns: Premix / Excel / CGM.
- Orders from the live database are displayed in each column.
- `export const dynamic = 'force-dynamic'` ensures fresh data per request.

**Fail criteria:** Page shows a placeholder, blank state without orders, or build/render error.

**Observed result:** `pass`

---

### T3. URL-synced filter + search survives reload (PROD-03, PROD-04)

**Steps:**
1. On the dashboard, click a filter pill (e.g., "Pending").
2. Observe URL becomes `?status=Pending`.
3. Reload the page.
4. Observe that the Pending filter is still active after reload.
5. Type a customer name fragment in the search box.
6. Observe URL gets `?q=...`.
7. Reload — filter and search survive.

**Pass criteria:** Filter pills and search state persist across hard reloads via URL params.

**Fail criteria:** State resets on reload (nuqs URL sync broken).

**Observed result:** `issue`
**Severity:** `major`
**Reported:** Filter pill works (URL updates to `?status=…` and survives reload). Search input does NOT write `?q=…` to the URL when typing — debounce → `setQuery({ q })` path at `src/components/ProductionDashboard.tsx:150-155` is not landing in dev despite unit test (Test 7 in `ProductionDashboard.test.tsx:246`) being green. Reload behavior for search is moot until the URL writes.

**Note:** A prior blocker on this test — Turbopack build error `Module not found: '@aws-sdk/client-s3'` (in `unzipper/lib/Open/index.js:98`, pulled transitively via `read-excel-file`) — was resolved inline by adding `serverExternalPackages: ['unzipper', 'read-excel-file']` to `next.config.ts`. Recorded as gap #2 below for traceability.

---

### T4. Drawer opens on card click; shows fields + timeline (PROD-05)

**Steps:**
1. On the dashboard, click an order card.
2. Observe URL gets `?order=<order_id>`.
3. Observe the right-side drawer opens with order details and event timeline.
4. Close the drawer via ESC key, X button, or backdrop click.
5. Observe URL clears the `?order=` param.

**Pass criteria:**
- Drawer shows order fields (Document Number, Customer, Product, Weight, Delivery, Mill Line, State).
- Drawer shows event timeline with transition history.
- All three close methods clear the URL param.

**Fail criteria:** Drawer does not open; fields missing; close doesn't clear URL.

**Observed result:** `pass`

---

### T5. Blocked alert band + next-up indicator + in-progress badge (PROD-06, PROD-07, PROD-08)

**Steps:**
1. Ensure at least one Blocked order exists in the DB (transition or seed one).
2. Observe the sticky blocked alert band at the top of the dashboard.
3. Click a BLOCKED entry in the band — drawer should open for that order.
4. Observe next-up indicator on the first Pending order in each column.
5. Observe in-progress badge on the currently Mixing order.

**Pass criteria:**
- Blocked band visible only when blocked orders exist; hidden when none.
- Clicking band entry opens the correct order's drawer.
- Next-up and in-progress badges appear on the correct cards.

**Fail criteria:** Band always visible; band not clickable; badges missing.

**Observed result:** `pass`

---

### T6. 30s polling + last-updated chip + manual refresh (PROD-09, PROD-11)

**Steps:**
1. On the dashboard, observe the "Updated 0s ago" chip in the header.
2. Wait approximately 35 seconds without interacting.
3. Watch the chip count up; at ~30s observe a network request in DevTools Network tab (RSC payload reload).
4. Observe the chip reset to "Updated 0s ago" after the poll completes.
5. Click the manual refresh icon (RotateCcw).
6. Observe the chip immediately resets to "Updated 0s ago" + a spinner appears briefly during refresh.

**Pass criteria:**
- Chip counts up in real time (5s tick).
- Auto-poll fires at ~30s and resets the chip.
- Manual refresh also resets the chip and shows spinner.

**Fail criteria:** Chip stuck at "Updated 0s ago"; no polling; manual refresh broken.

**Observed result:** `pass`

---

### T7. Loading skeletons per column (PROD-10)

**Steps:**
1. Trigger a `router.refresh()` by clicking the manual refresh icon.
2. Observe the brief flash of loading skeletons in each column before data re-renders.

**Pass criteria:** Each column shows a skeleton (pulsing cards) during the refresh RSC cycle.

**Fail criteria:** No skeleton shown; immediate re-render with no loading state.

**Observed result:** `pass`

---

### T8. Sidebar production nav (D-24)

**Steps:**
1. On the dashboard (`/`), observe the Sidebar.
2. Verify "Dashboard" nav item is active (highlighted).
3. Click "Import" nav item — navigates to `/import`.
4. Verify "Import" nav item is active on the import page.
5. Navigate back to `/` — "Dashboard" nav item is active again.

**Pass criteria:** Sidebar shows "Dashboard" and "Import" items; active state follows current route.

**Fail criteria:** Sidebar shows old nav items ("Coming Soon"); active state wrong.

**Observed result:** `pass`

---

### T9. Bulk import end-to-end (entry → preview → commit → history)

**Steps:**
1. Navigate to `/import`.
2. Observe the bulk import drop zone with text "Drop your Excel file here".
3. Try drag-dropping a file > 2MB — expect error "File exceeds 2 MB limit. Please upload a smaller file."
4. Use a valid Book1.xlsx fixture (from Phase 33 plan 33-07 harness).
5. Drop or click-to-browse the valid file.
6. Observe the preview phase: summary bar, preview table with rows, per-row Skip/Overwrite controls for duplicates.
7. Verify duplicate rows default to "Skip".
8. Toggle one Skip → Overwrite.
9. Click "Commit Import".
10. Observe the committed phase confirmation: "Import complete!".
11. Observe the ImportHistoryTable at the bottom — the new batch appears at the top.

**Pass criteria:** Full three-phase flow works; D-17 size guard shows locked message; D-18 Skip default; history updates after commit.

**Fail criteria:** Size guard missing; preview doesn't appear; commit fails; history doesn't update.

**Observed result:** `issue`
**Severity:** `blocker`
**Reported:** Two failures on T9:
1. **History table did not update after commit** — `ImportHistoryTable` still shows the prior state. Likely `revalidateTag` is not firing for the import-batches cache, or the page's `getImportBatches()` call isn't tagged with the same key.
2. **`RangeError: Invalid time value` at `ImportHistoryTable.tsx:27` after page refresh** — `ImportFlow` is `'use client'` (`src/components/ImportFlow.tsx:1`), so the `batches` prop crosses the RSC → client boundary and `Date` is serialized to an ISO string. `formatBatchDate` receives a string at runtime despite the `Date` type annotation, and `Intl.DateTimeFormat.format(string)` throws.

---

### T10. Transition flow (Pending → Mixing → Completed; Block + Resume)

**Steps:**
1. Open an order drawer for a Pending order (canEdit=true as mill_operator).
2. Click "Start Mixing" — order should move to Mixing column.
3. Reopen the drawer for the same order (now Mixing).
4. Click "Block Order" — modal appears with required reason textarea.
5. Type a reason and click "Confirm Block" — order should move to Blocked.
6. Reopen drawer for the Blocked order.
7. Click "Resume to Mixing" — order moves back to Mixing.
8. Click "Complete Order" — order moves to Completed column.
9. Verify completed order's drawer shows no transition buttons.

**Pass criteria:** All state transitions work; conflict messages appear on concurrent conflict; Completed state has no buttons.

**Fail criteria:** Transitions don't update the board; buttons missing; block modal broken.

**Observed result:** `issue`
**Severity:** `blocker`
**Reported:** Two issues on T10:
1. **Missing transition: Pending → Blocked is not possible.** `TransitionButtons.tsx:188-191` only renders "Start Mixing" for `state: 'Pending'`. The block path requires going through Mixing first, per D-11. User wants Block available directly from Pending. Spec gap — not a code bug per the current design contract. Needs an ADR-level decision before changing the state machine.
2. **Drawer load is painful (>5s, sometimes feels stuck).** Mixing → Block → Resume → Complete itself worked correctly, but the drawer fetch on card click is too slow for an operator's flow. Likely root cause: drawer fetches order detail + event timeline server-side without parallelization, or the timeline query lacks an index, or the RSC suspense boundary isn't streaming. Needs profiling.

---

### T11. Read-only mode — non-operator sees no edit affordances (D-25)

**Steps:**
1. Sign out and sign in as a non-mill_operator user (or a demo user without the role).
2. Navigate to `/`.
3. Observe the dashboard renders (no redirect — D-02).
4. Click an order card — drawer opens.
5. Observe: NO transition buttons in the drawer.
6. Navigate to `/import`.
7. Observe: drop zone is hidden; a notice "Read-only mode — sign in as mill_operator to import" appears.
8. Observe: ImportHistoryTable is still visible (read-only users can see history).

**Pass criteria:** Non-operators see dashboard + history but no edit affordances anywhere.

**Fail criteria:** Non-operators see transition buttons or can access the upload flow.

**Observed result:** `needs_retest`
**Severity:** `n/a (procedural)` + `blocker` (inherited /import crash)
**Reported (initial):** Transition buttons visible for `e2e-demo` user; `/import` crashed with the T9b RangeError.

**Diagnosis (post-debug):** The fixture choice was wrong, not the code. `e2e-demo+clerk_test@example.com` is **dual-role** (`['demo', 'mill_operator']`) per Phase 31 D-13 (`docs/clerk-setup.md:37,54-58`) — the buttons rendered legitimately. The `canEdit` chain is fully intact and unit-tested. To validate D-25, T11 must be re-run with `e2e-norole+clerk_test@example.com`. The `/import` crash IS a real bug but is identical to the T9b RangeError already tracked — no separate gap needed.

**Action:** T11 will be re-run after the T9b fix lands, using the no-role fixture. Tracked as a UAT-procedure gap, not a code gap.

---

### T12. Inherited: GAP-02 revalidateTag end-to-end (from Phase 33)

**Source:** `.planning/phases/33-server-actions-queries-and-bulk-import/34-INHERITED-UAT.md` — GAP-02 closure step. This test is MANDATORY for phase completion.

**Preconditions:**
- Phase 34 dashboard at `/` is implemented (PROD-01) and renders against live DB via `getProductionOrders`.
- At least one `production_orders` row exists in `state: 'Pending'` (use the seed data from Phase 32 or the harness from Phase 33 plan 33-07).
- Operator is signed in as `mill_operator`.

**Steps:**
1. Open Tab A: navigate to `/`. Note the state of one specific Pending order (record `orderNumber` and `version` for reference).
2. Open Tab B: navigate to `/` in a SECOND tab/window (same browser session, same user).
3. In Tab B: click the per-order Mixing transition button (Phase 34's UI element). Observe the optimistic UI response (the card moves to the Mixing column — or, in v2.0 without optimistic UI per PROD-FUT-01 deferral, the card updates after the action returns).
4. In Tab A: WITHOUT pressing the browser refresh button, observe the order card. Within one render cycle, the card should reflect the new state.
   - **If polling is the only refresh mechanism (v2.0 design per PROD-09):** the card updates within the 30-second polling interval (`REFRESH_INTERVAL_MS = 30_000`). Time the update.
   - **If `router.refresh()` is wired into the action button's onSuccess handler (recommended):** the card updates near-instantly (within ~1s of the action's RSC response landing).

**Pass criteria:**
- Tab A's order card reflects the new state without a manual hard refresh (no F5, no Ctrl+R, no clicking the page's manual refresh control — that control exists per PROD-11 but is not what GAP-02 tests).
- The state update lands within ≤30s (the polling interval upper bound).

**Fail criteria:**
- Tab A's card remains in the old state indefinitely (requires manual refresh) — `revalidateTag` is not firing OR the `unstable_cache` tag does not match OR the page is not re-rendering on tag invalidation.
- The state update relies on a hard refresh — same diagnosis.

**Diagnostic hints if the test fails:**
- Run `grep -rn "'production-orders'" src/` — confirm the tag string appears in BOTH the action invocations and the query `unstable_cache` wrappers. A typo in either site silently breaks invalidation.
- Confirm `getProductionOrders` is called from the page RSC (not from a client component that bypasses the cache layer).
- Confirm `export const dynamic = 'force-dynamic'` is on the page (PROD-01) so the RSC re-renders on each request.
- Confirm `revalidateTag('production-orders', 'max')` (two-arg form for Next.js 16.1.6) is called in EVERY mutating action path.

**Observed result:** `pass`
**Observation:** Tab A updated without a manual hard refresh, within the ≤30s polling bound (~15s observed). Test passes per spec. Note: the 15s latency indicates the update is arriving via polling rather than `router.refresh()` — see gap on T12 for enhancement opportunity.

---

## Summary

total: 12
passed: 7
issues: 4 (code-level) + 1 (UAT-procedure)
pending: 1 (T11 re-test with correct fixture)
skipped: 0
blocked: 0
deferred: 0

### Pass / Issue Breakdown (post-diagnosis)

| Test | Result | Severity | Root Cause |
|------|--------|----------|------------|
| T1   | pass   | —        | Auth gate on `/` works |
| T2   | pass   | —        | Three-column dashboard renders |
| T3   | diagnosed | major | Two search inputs on `/`; user typed in Header's dead decorative one (onSearch never wired) |
| T4   | pass   | —        | Drawer open + 3 close methods clear URL |
| T5   | pass   | —        | Blocked band + next-up + in-progress badges |
| T6   | pass   | —        | 30s polling + last-updated chip + manual refresh |
| T7   | pass   | —        | Loading skeletons per column |
| T8   | pass   | —        | Sidebar nav + active state |
| T9a  | diagnosed | major | `ImportFlow.handleCommit` missing `router.refresh()` after commit |
| T9b  | diagnosed | blocker | Date serialized to string across RSC→client boundary in ImportFlow |
| T10a | needs_decision | major | Pending → Blocked transition is a spec/ADR question, not a code bug |
| T10b | diagnosed | blocker | `setQuery({ order })` uses nuqs `shallow: true` default → no RSC fetch → drawer waits for 30s poll |
| T11  | needs_retest | n/a | `e2e-demo` is dual-role per Phase 31 D-13; code is correct, fixture was wrong |
| T12  | pass   | minor    | Polls (~15s); router.refresh enhancement opportunity |

## Routing Decisions (2026-05-14)

Captured before /gsd-plan-phase 34 --gaps:

| Gap | Decision | Rationale |
|-----|----------|-----------|
| T3 (search divergence) | Plan code fix | Two-input UX bug — remove dead Header search OR wire it to URL state |
| T9a (history no refresh) | Plan code fix | One-line `router.refresh()` add |
| T9b (RangeError Date) | Plan code fix | Hydrate `importedAt` in ImportFlow before passing down + regression test |
| T10a (Pending → Blocked) | **Plan code fix (D-11 amendment)** | User wants Block from Pending; amend design contract |
| T10b (drawer slow) | Plan code fix | Split nuqs `order` key with `shallow: false` + startTransition |
| T11 (RBAC leak) | **Re-test only, no code change** | Not a bug — fixture mis-specified; re-run with `e2e-norole` after T9b lands |
| T12 (router.refresh enhancement) | Plan code fix | Same pattern as T9a; brings latency from 15s → ~1s |
| T3 build error | Already resolved inline | `serverExternalPackages` added to next.config.ts |

## Gaps

<!-- Populated if any test fails — format: gap per failing test -->

- truth: "Search input writes `?q=…` to URL when typing (PROD-04 / D-05)."
  status: diagnosed
  reason: "Filter pill works but search does not."
  severity: major
  test: 3
  root_cause: "TWO search inputs render on `/`. `DashboardLayout.tsx:25` mounts `<Header />` unconditionally, and `Header.tsx:107-114` defines its OWN search input (placeholder `Type here...`, lucide `<Search />` icon, top-right `site search` position) whose `onChange` writes to local state and invokes `onSearch?.(...)` — but NO caller passes `onSearch` to `<Header />` in the entire codebase. That input is a permanently-dead decorative control. The actually URL-synced search input is `ProductionDashboard.tsx:217-223` (placeholder `Search orders...`, type `search`) and is wired correctly. The user typed in the dead one. Test 7 passes legitimately because the test renders `<ProductionDashboard>` standalone — no `<DashboardLayout>`, no `<Header>` — so only the functional input is in the test DOM."
  artifacts:
    - path: src/components/DashboardLayout.tsx
      issue: "Mounts `<Header />` unconditionally without `onSearch` prop, surfacing the dead control on `/`."
    - path: src/components/Header.tsx
      issue: "Defines a search input + `onSearch?` callback never wired by any caller (lines 14, 61-65, 107-114)."
    - path: src/components/ProductionDashboard.test.tsx
      issue: "Test 7 renders ProductionDashboard standalone, so the duplicate-input UX bug is invisible to the suite."
  missing:
    - "Decision: remove dead search from Header OR wire it to the same URL state"
    - "Regression test: full /-route render asserts exactly one URL-syncing search input"
  debug_session: .planning/debug/t3-search-not-url-syncing.md

- truth: "Dev server boots without module-resolution errors when dashboard graph is loaded."
  status: resolved
  reason: "Turbopack failed to resolve `@aws-sdk/client-s3` (conditional require inside `unzipper/lib/Open/index.js:98`, pulled in via `src/actions/import.ts` → `read-excel-file` → `unzipper`). Fixed inline by adding `serverExternalPackages: ['unzipper', 'read-excel-file']` to `next.config.ts:13`. Recorded for traceability — no further action required."
  severity: blocker
  test: 3
  artifacts:
    - next.config.ts
  missing: []

- truth: "`ImportHistoryTable` refreshes after a successful bulk-import commit."
  status: diagnosed
  reason: "After `Commit Import` succeeds the history table stays stale."
  severity: major
  test: 9
  root_cause: "`ImportFlow.handleCommit` (`src/components/ImportFlow.tsx:115-142`) never calls `router.refresh()` after `commitImportAction` returns. The server-side cache contract is fully wired: `src/actions/import.ts:799,815` correctly call `revalidateTag('import-batches', 'max')`, `src/db/queries/imports.ts:21-31` wraps `getImportBatches` in `unstable_cache(..., ['import-batches'], { tags: ['import-batches'] })`, and `src/app/import/page.tsx:8` is `force-dynamic`. The gap is that a plain `await commitImportAction(...)` from a client handler does not auto-refetch the route in Next.js 16 — the client component keeps rendering its captured `batches` prop. `TransitionButtons.tsx:69,102,149` already follows the correct pattern; `ImportFlow` is the only mutating client component missing it."
  artifacts:
    - path: src/components/ImportFlow.tsx
      issue: "`handleCommit` lines 115-142 missing `router.refresh()` after the successful await."
  missing:
    - "Import `useRouter` and call `router.refresh()` immediately after successful commit; mirror TransitionButtons.tsx:69"
    - "Must land alongside T9b fix (batches will still arrive as ISO strings post-refresh)"
  debug_session: .planning/debug/t9a-import-history-no-refresh.md

- truth: "Bulk-import history page renders without runtime errors after refresh."
  status: diagnosed
  reason: "`RangeError: Invalid time value` thrown at `ImportHistoryTable.tsx:27`."
  severity: blocker
  test: 9
  root_cause: "`ImportFlow` is a client component (`'use client'` at `src/components/ImportFlow.tsx:1`). `src/app/import/page.tsx:32` passes `batches: ImportBatch[]` (with genuine `Date` instances on the server) into `ImportFlow`; Next.js serializes the prop across the RSC→client boundary and `Date` becomes an ISO string. `ImportFlow` forwards `batches` to `ImportHistoryTable.tsx:74`, where `formatBatchDate(batch.importedAt)` calls `Intl.DateTimeFormat.format()` with a string — that API does not coerce strings, so it throws. The TS type `ImportBatch.importedAt: Date` (inferred by drizzle `$inferSelect`) is honest at the DB return point but lies on the client side. `ImportHistoryTable`'s 'Server component' docstring describes intent but is contradicted by being rendered inside a client tree. `ImportHistoryTable.test.tsx` only ever passes hand-constructed `Date` instances, so the existing suite cannot reproduce this."
  artifacts:
    - path: src/components/ImportFlow.tsx
      issue: "Client component receiving serialized batches; needs to hydrate `importedAt` back to Date before rendering ImportHistoryTable."
    - path: src/components/ImportHistoryTable.tsx
      issue: "`formatBatchDate(d: Date)` lies about runtime shape in the current architecture."
    - path: src/components/ImportHistoryTable.test.tsx
      issue: "Test gap — no fixture exercises the serialized-string post-RSC shape."
  missing:
    - "Hydrate batches in ImportFlow (Option B from debug session — lowest blast radius)"
    - "Regression test that passes string `importedAt` OR renders /import end-to-end with serialized props"
  debug_session: .planning/debug/t9b-rangeerror-date-serialization.md

- truth: "Operator can transition a Pending order directly to Blocked."
  status: diagnosed
  reason: "Current state machine (`TransitionButtons.tsx:188-191`, D-11) only exposes 'Start Mixing' for Pending orders. User wants this capability."
  severity: major
  test: 10
  root_cause: "Deliberate design choice in D-11 ('Pending → Start Mixing only'). User decision (2026-05-14): amend D-11 to allow Block directly from Pending."
  artifacts:
    - path: src/components/TransitionButtons.tsx
      issue: "Pending case (lines 188-191) renders only 'Start Mixing' — needs Block button added."
    - path: src/actions/transitions.ts
      issue: "Verify `transitionToBlocked` accepts fromState='Pending'. If not, extend the allowed-fromState list."
    - path: src/components/BlockReasonModal.tsx
      issue: "Modal already accepts a reason; reusable from the Pending entrypoint."
    - path: .planning/phases/34-production-dashboard-ui-and-homepage-promotion/34-PATTERNS.md
      issue: "D-11 design contract needs amendment to 'Pending → Start Mixing OR Block Order'."
  missing:
    - "Add Block button to Pending case in TransitionButtons.tsx (mirror Mixing-case wiring)"
    - "Verify/extend server-side validation in transitions.ts to allow Pending → Blocked"
    - "Update D-11 in PATTERNS.md (or wherever the design contract lives)"
    - "Test coverage: TransitionButtons.test.tsx must assert Block button visible on Pending"
  routing_decision: "User chose to plan as code fix on 2026-05-14"

- truth: "Drawer opens responsively when a card is clicked (target: <500ms perceived load)."
  status: diagnosed
  reason: "Drawer load exceeds 5 seconds and sometimes feels stuck."
  severity: blocker
  test: 10
  root_cause: "`setQuery({ order: id })` in `ProductionDashboard.tsx:140-144,248,257,266` (and `BlockedAlertBand.tsx:28,40`) uses nuqs default `shallow: true`. Shallow updates only patch `history.replaceState` and do NOT trigger an App Router RSC re-fetch (confirmed in `nuqs/dist/impl.app-HXOL9k0k.js:45-55` — `router.replace` only fires when `!options.shallow`). The page RSC (`src/app/page.tsx:39-43`) is the only place `getOrderById` + `getOrderEvents` are called, so when it doesn't re-render the drawer props stay `null` / `[]` and the drawer renders the `order === null` 'Order not found' branch. Real drawer data only materializes when `useProductionPolling` (`src/hooks/useProductionPolling.ts:30-36`) fires `router.refresh()` on its 30s interval → wait time after a click is 0–30s, averaging ~15s. Notably: fetches are already parallel (`Promise.all`), the events table HAS the correct composite index, queries ARE cached — none of the original hypotheses applied. The bug is in URL-state propagation, not the data layer."
  artifacts:
    - path: src/components/ProductionDashboard.tsx
      issue: "useQueryStates batches `order` with `status`/`q` and inherits shallow=true; card-click handler `onOrderClick={(id) => setQuery({ order: id })}` doesn't pass `{ shallow: false }`."
    - path: src/components/BlockedAlertBand.tsx
      issue: "Same shallow-default issue when clicking a blocked-alert entry to open the drawer."
    - path: src/components/ProductionDrawer.tsx
      issue: "No loading skeleton when transitioning from `order === null` to populated; perceptually feels stuck."
  missing:
    - "Split `order` key into its own `useQueryStates` with `{ shallow: false, history: 'push' }`; wrap setter in React.startTransition so the existing Suspense fallback can render a DrawerSkeleton"
    - "Keep `status` and `q` shallow to avoid needless RSC fetches on pill/search interactions"
  debug_session: .planning/debug/t10b-drawer-slow-load.md

- truth: "Non-mill_operator users do not see transition affordances in the order drawer (D-25)."
  status: not_a_bug_test_misconfigured
  reason: "Initially reported as RBAC leak — debug agent investigation found the `canEdit` chain is fully intact and correct."
  severity: major
  test: 11
  root_cause: "The fixture user signed in for T11 (`e2e-demo+clerk_test@example.com`) was provisioned with `publicMetadata.roles: ['demo', 'mill_operator']` in Phase 31 D-13 — it is the canonical dual-role coverage user. So `checkRole('mill_operator')` correctly returns `true` and `canEdit=true` for that user; the drawer correctly renders the buttons; the server actions correctly accept the transitions. The `canEdit` prop chain `src/app/page.tsx:31,49` → `ProductionDashboard.tsx:125,132,279` → `ProductionDrawer.tsx:38-42,122,246` is intact and verified by three unit tests (`ProductionDrawer.test.tsx:196-201` Test 10 D-25, `page.test.tsx:149-160` Test 3, plus TransitionButtons coverage). The UAT step 1 framing of `e2e-demo` as a 'non-operator' is incorrect per `docs/clerk-setup.md:37,54-58`. No code change required."
  artifacts:
    - path: .planning/phases/34-production-dashboard-ui-and-homepage-promotion/34-HUMAN-UAT.md
      issue: "T11 step 1 names `e2e-demo` as a non-operator; the fixture is actually dual-role per Phase 31 D-13."
    - path: docs/clerk-setup.md
      issue: "Load-bearing context — defines dual-role demo user; T11 should reference this."
  missing:
    - "Re-run T11 with `e2e-norole+clerk_test@example.com` (the genuine no-role fixture from clerk-setup.md:38,72)"
    - "OR rewrite T11 as T11a (no-role: e2e-norole, asserts NO buttons) + T11b (dual-role: e2e-demo, asserts buttons present) for positive coverage of Phase 31 D-13"
  debug_session: .planning/debug/t11-rbac-drawer-button-leak.md

- truth: "Cross-tab state updates land near-instantly (router.refresh on action onSuccess)."
  status: diagnosed
  reason: "T12 passes (~15s within 30s polling bound) but updates arrive via polling alone."
  severity: minor
  test: 12
  root_cause: "Transition action handlers in `TransitionButtons.tsx` do not call `router.refresh()` after success; updates rely on the 30s polling tick. Same root cause pattern as T9a — every mutating client component needs `router.refresh()` after the server action returns."
  artifacts:
    - path: src/components/TransitionButtons.tsx
      issue: "useActionState handlers at lines 62-74, 95-108, 142-156 don't call router.refresh on success."
  missing:
    - "Add useRouter + router.refresh() to onSuccess paths of all four transition button handlers"
    - "Brings cross-tab latency from ~15s to ~1s; same pattern as T9a fix"
  routing_decision: "User chose to include in plan on 2026-05-14"
