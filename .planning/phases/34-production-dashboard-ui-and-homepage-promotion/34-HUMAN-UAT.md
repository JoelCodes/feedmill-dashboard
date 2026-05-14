---
phase: 34-production-dashboard-ui-and-homepage-promotion
type: human-uat
created: 2026-05-14
status: complete
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

**Observed result:** `issue`
**Severity:** `blocker`
**Reported:** Two failures on T11:
1. **RBAC leak on the drawer:** transition buttons (`Start Mixing` / `Block Order` / `Resume to Mixing` / etc.) ARE visible to non-mill_operator users. D-25 (and the read-only-mode contract) says read-only users should see the dashboard + drawer but NO edit affordances. The `canEdit` gate is either missing or not wired into `TransitionButtons` when rendered inside the drawer for a non-operator. Security-relevant — a demo user could attempt transitions even if the server action rejects them.
2. `/import` portion (steps 6–8) is blocked by the same `RangeError: Invalid time value` already logged on T9 (`src/components/ImportHistoryTable.tsx:27`). The read-only notice and history-table-visible-but-no-uploader requirements could not be verified because the page crashes for all users before render completes. Fixing the T9 Date-serialization gap unblocks this test.

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
issues: 5
pending: 0
skipped: 0
blocked: 0
deferred: 0

### Pass / Issue Breakdown

| Test | Result | Severity | Notes |
|------|--------|----------|-------|
| T1   | pass   | —        | Auth gate on `/` works |
| T2   | pass   | —        | Three-column dashboard renders |
| T3   | issue  | major    | Filter pill works; search input does not write `?q=` to URL |
| T4   | pass   | —        | Drawer open + 3 close methods clear URL |
| T5   | pass   | —        | Blocked band + next-up + in-progress badges |
| T6   | pass   | —        | 30s polling + last-updated chip + manual refresh |
| T7   | pass   | —        | Loading skeletons per column |
| T8   | pass   | —        | Sidebar nav + active state |
| T9   | issue  | blocker  | History didn't update after commit + `RangeError` on refresh |
| T10  | issue  | blocker  | Pending → Blocked not allowed + drawer load >5s |
| T11  | issue  | blocker  | Transition buttons leak to non-operators + `/import` crashes (same as T9) |
| T12  | pass   | minor    | Polls (~15s); router.refresh not wired (enhancement) |

## Gaps

<!-- Populated if any test fails — format: gap per failing test -->

- truth: "Search input writes `?q=…` to URL when typing (PROD-04 / D-05)."
  status: failed
  reason: "Filter pill works but search does not. Debounce → `setQuery({ q })` at `src/components/ProductionDashboard.tsx:150-155` is not landing in dev despite Test 7 in `ProductionDashboard.test.tsx:246` being green. Need to diagnose divergence between RTL/NuqsTestingAdapter and Next/NuqsAdapter."
  severity: major
  test: 3
  artifacts:
    - src/components/ProductionDashboard.tsx
    - src/components/ProductionDashboard.test.tsx
  missing: []

- truth: "Dev server boots without module-resolution errors when dashboard graph is loaded."
  status: resolved
  reason: "Turbopack failed to resolve `@aws-sdk/client-s3` (conditional require inside `unzipper/lib/Open/index.js:98`, pulled in via `src/actions/import.ts` → `read-excel-file` → `unzipper`). Fixed inline by adding `serverExternalPackages: ['unzipper', 'read-excel-file']` to `next.config.ts:13`. Recorded for traceability — no further action required."
  severity: blocker
  test: 3
  artifacts:
    - next.config.ts
  missing: []

- truth: "`ImportHistoryTable` refreshes after a successful bulk-import commit."
  status: failed
  reason: "After `Commit Import` succeeds and the 'Import complete!' confirmation renders, the history table at the bottom of `/import` still shows the prior state. Either `revalidateTag` is not being called from `src/actions/import.ts` on commit, or `getImportBatches()` is not wrapped in `unstable_cache` with the matching tag, or the import page is not configured to re-render on tag invalidation."
  severity: major
  test: 9
  artifacts:
    - src/actions/import.ts
    - src/app/import/page.tsx
    - src/db/queries/imports.ts
  missing: []

- truth: "Bulk-import history page renders without runtime errors after refresh."
  status: failed
  reason: "`Intl.DateTimeFormat.format(d)` at `src/components/ImportHistoryTable.tsx:27` throws `RangeError: Invalid time value`. Root cause: `ImportFlow` is a client component (`'use client'` at line 1) which receives `batches: ImportBatch[]` from the page RSC. Next.js JSON-serializes `Date` to an ISO string across the RSC→client boundary, so `batch.importedAt` is a string at runtime despite the `Date` type annotation. Fix options: (a) hydrate `importedAt` to `Date` in the client (`new Date(batch.importedAt)` before formatting), (b) coerce inside `formatBatchDate` (`format(new Date(d))`), or (c) move `ImportHistoryTable` rendering above the RSC boundary so it stays server-only."
  severity: blocker
  test: 9
  artifacts:
    - src/components/ImportHistoryTable.tsx
    - src/components/ImportFlow.tsx
  missing: []

- truth: "Operator can transition a Pending order directly to Blocked."
  status: failed
  reason: "Current state machine (`TransitionButtons.tsx:188-191`, D-11) only exposes 'Start Mixing' for Pending orders. Block is gated on first transitioning to Mixing. User reports this as a missing capability. Resolution requires an ADR-level decision: amend the state machine to allow Pending → Blocked, or document why the current design (block-only-from-mixing) is intentional. If amending: add a Block button to the Pending case in `TransitionButtons.tsx`, extend `transitionToBlocked()` to accept fromState ∈ ['Pending','Mixing'], and update server-side validation in `src/actions/transitions.ts` plus the `BlockReasonModal` reason-required gate."
  severity: major
  test: 10
  artifacts:
    - src/components/TransitionButtons.tsx
    - src/actions/transitions.ts
    - src/components/BlockReasonModal.tsx
  missing:
    - ADR or D-NN decision on Pending → Blocked semantics

- truth: "Drawer opens responsively when a card is clicked (target: <500ms perceived load)."
  status: failed
  reason: "Drawer load exceeds 5 seconds and sometimes feels stuck. Mixing → Block → Resume → Complete transitions themselves work, but the drawer's initial fetch is the slow path. Likely causes (to be confirmed by profiling): (a) drawer fetches order detail + event timeline serially rather than in parallel, (b) event timeline query (`getOrderEvents` or similar) is missing an index on `order_id`, (c) no suspense streaming boundary so the drawer blocks on the full payload, (d) Clerk role check on every drawer render. Needs Server Timing headers or DB EXPLAIN to localize."
  severity: blocker
  test: 10
  artifacts:
    - src/components/ProductionDrawer.tsx
    - src/db/queries/orders.ts
    - src/db/queries/events.ts
  missing: []

- truth: "Non-mill_operator users do not see transition affordances in the order drawer (D-25)."
  status: failed
  reason: "Transition buttons (Start Mixing / Block Order / Resume to Mixing / Resume to Pending / Complete Order) are visible to demo users who lack the `mill_operator` role. The drawer is rendering `TransitionButtons` unconditionally instead of gating on `canEdit`. Server actions will still reject the requests (defence-in-depth via the action's role check), but the UI affordance leak violates D-25 and lets non-operators attempt mutations. Fix: pass `canEdit` from the page RSC down through `ProductionDrawer` → `TransitionButtons` and skip rendering buttons when `canEdit === false`. Pattern already exists for `/import` (D-25), needs to be applied to the drawer."
  severity: blocker
  test: 11
  artifacts:
    - src/components/ProductionDrawer.tsx
    - src/components/TransitionButtons.tsx
    - src/app/page.tsx
  missing: []

- truth: "Cross-tab state updates land near-instantly (router.refresh on action onSuccess)."
  status: partial
  reason: "T12 passed within the 30s polling bound (~15s observed), so the test is technically green. However, 15s indicates the update is arriving via the 30s polling interval alone — `router.refresh()` is not wired into the transition action's `onSuccess` (or `revalidateTag` is not re-rendering the page within the same request cycle). Per the test guidance, recommended behavior is ~1s if router.refresh is wired. Enhancement opportunity rather than a blocker. Could be deferred to a follow-up if scope is tight."
  severity: minor
  test: 12
  artifacts:
    - src/components/TransitionButtons.tsx
    - src/actions/transitions.ts
  missing: []
