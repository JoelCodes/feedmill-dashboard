---
phase: 34-production-dashboard-ui-and-homepage-promotion
verified: 2026-05-14T22:00:00Z
status: human_needed
score: 11/11 automated truths verified
overrides_applied: 0
human_verification:
  - test: "T1-T12 manual UAT in 34-HUMAN-UAT.md: auth gate, live dashboard, URL-synced filters, drawer open/close, blocked band, polling, skeletons, sidebar nav, bulk import, transitions, read-only mode, and Inherited GAP-02 two-tab revalidateTag observation"
    expected: "All 12 tests recorded as pass by the operator, including T12 which requires observing Tab A refresh within ≤30s after Tab B transitions an order"
    why_human: "34-HUMAN-UAT.md frontmatter is status: pending with all 12 observed results showing [pending]. UAT requires a running server against the live Neon DB and Clerk auth, plus two browser tabs for GAP-02. No automated test can substitute for live network/DB observation."
---

# Phase 34: Production Dashboard UI and Homepage Promotion — Verification Report

**Phase Goal:** The Coming Soon homepage at `/` is replaced by a live, DB-backed mill production dashboard; filter and search state are URL-synced; the 30-second polling loop keeps data fresh; and the sidebar shows production navigation for the `/` route.

**Verified:** 2026-05-14T22:00:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | D-04/D-05/D-06: Dashboard URL state survives a hard reload (status filter pills, search query, drawer-open order id preserved) | ✓ VERIFIED | `src/lib/search-params.ts` exports `searchParamsCache` via `createSearchParamsCache` with `parseAsArrayOf(parseAsStringLiteral(STATE_ORDER))` for status, `parseAsString` for q and order. `NuqsAdapter` mounted in `src/app/layout.tsx`. 6 TDD unit tests GREEN covering round-trip parsing. |
| 2 | D-24: Sidebar lists Dashboard and Import as the only two production destinations — no "Coming Soon" placeholder | ✓ VERIFIED | `grep -c "Coming Soon" src/components/Sidebar.tsx` = 0. `/import` entry with `href: "/import"` present. Exact-match guard `pathname === "/"` preserved (Pitfall 5). Sidebar tests include Tests 5-7 covering both items and active-state discrimination. |
| 3 | Header page title reads "Dashboard" on `/` and "Import" on `/import` | ✓ VERIFIED | `src/components/Header.tsx`: `if (path === '/') return 'Dashboard'` and `if (path.startsWith('/import')) return 'Import'`. Header tests 8-10 GREEN. |
| 4 | D-21: commitImportAction invalidates both `production-orders` and `import-batches` on success AND degraded-success paths | ✓ VERIFIED | `grep -c "revalidateTag.*import-batches" src/actions/import.ts` = 2 (both paths). TDD RED/GREEN commits `0de5f2c` → `9e7fd8b` with 3 D-21 unit tests GREEN. |
| 5 | D-19: Dashboard auto-refreshes every 30 seconds — `REFRESH_INTERVAL_MS = 30_000` exported; `useProductionPolling()` called in `ProductionDashboard` | ✓ VERIFIED | `src/hooks/useProductionPolling.ts` exports `REFRESH_INTERVAL_MS = 30_000` with `setInterval` + `clearInterval` cleanup. TDD RED commit `59951d8` → GREEN `9f57689`. `ProductionDashboard.tsx` line 137: `useProductionPolling()`. Dashboard test 8 asserts mockRefresh called after `jest.advanceTimersByTime(30_000)`. |
| 6 | D-07/D-03: Status filter pills and search are URL-synced; client-side substring filtering via `filterOrders`; StatusBadge extended for ProductionState | ✓ VERIFIED | `ProductionDashboard.tsx`: `useQueryStates`, `parseAsArrayOf(parseAsStringLiteral(STATE_ORDER))`, `useDebounce(searchInput, 150)`, `filterOrders(orders, status, q)`. `StatusBadge.tsx`: `BadgeStatus = OrderStatus | ProductionState` union — Mixing/Completed/Blocked/Pending all handled. 4 StatusBadge TDD tests GREEN. |
| 7 | PROD-01: `/` route is an async RSC with `force-dynamic` rendering live DB-backed orders | ✓ VERIFIED | `src/app/page.tsx`: `export const dynamic = 'force-dynamic'`, `await auth()`, `searchParamsCache.parse(searchParams)` (Pitfall 2 safe), `Promise.all([getProductionOrders(), ...])`, `<ProductionDashboard>`. No "Dashboard placeholder" text. TDD RED `e95ab73` → GREEN `08a26d0`. 8 RSC unit tests GREEN. |
| 8 | PROD-05: Order details drawer opens on card click with URL-synced `?order=` param; shows fields + timeline; transition buttons conditional on canEdit; "Order not found" empty state for stale IDs | ✓ VERIFIED | `ProductionDrawer.tsx`: `w-[480px]`, `Order not found` null-branch (Pitfall 7), `parseFloat(order.weightLbs)` (Pitfall 6), `Intl.DateTimeFormat` for timeline, `canEdit &&` guards `<TransitionButtons>`. `TransitionButtons.tsx`: 4 `useActionState` hooks, conflict banner with verbatim locked message. `BlockReasonModal.tsx`: Radix Dialog, trim guard. `DrawerCloseHandlers.tsx`: ESC gated by `modalOpen` (Pitfall 4). |
| 9 | D-15/D-16/D-17/D-18: `/import` route provides bulk import with 2 MB guard, Skip default for duplicates, import history at limit=10 | ✓ VERIFIED | `src/app/import/page.tsx`: `force-dynamic`, `getImportBatches({ limit: 10 })`, `redirect('/sign-in')`. `ImportFlow.tsx`: `MAX_IMPORT_BYTES`, "File exceeds 2 MB limit. Please upload a smaller file." locked text, `previewImportAction`, `commitImportAction`, `accept=".xlsx"`, `'skip'` default. `ImportHistoryTable.tsx`: "No imports yet", "Recent Imports", `Intl.DateTimeFormat`. 15 unit tests GREEN. |
| 10 | PROD-02/PROD-07/PROD-08: Three-column board (Premix/Excel/CGM) with next-up indicator and in-progress badge | ✓ VERIFIED | `MillColumn.tsx`: `COLUMN_STATE_ORDER = ['Completed','Mixing','Blocked','Pending']` visual order, `isNextUp`, `isInProgress`, "No orders" empty state. `ProductionCard.tsx`: `role="button"`, `tabIndex={0}`, `onKeyDown`, `parseFloat(order.weightLbs)`, "Next Up" badge, `aria-label="In progress"` pulsing dot. 33 TDD tests GREEN (16 pure + 9 card + 8 column). |
| 11 | PROD-10/PROD-11/PROD-06: Per-column Suspense skeletons; last-updated chip with 5s tick and manual refresh; blocked alert band with sticky chip format | ✓ VERIFIED | `ColumnSkeleton.tsx`: 3 `h-20 animate-pulse` card skeletons. `DrawerSkeleton.tsx`: `w-[480px]`. `LastUpdatedChip.tsx`: 5s `setInterval`, `RotateCcw` refresh icon, `router.refresh()`. `BlockedAlertBand.tsx`: `return null` when zero blocked, `sticky`, `BLOCKED:` chip format, `useQueryStates` for `?order=` on click. All 22 plan-03 tests GREEN. |

**Score:** 11/11 automated truths verified

---

### Deferred Items

No items are deferred to later milestone phases. All 11 truths correspond to Phase 34 deliverables.

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/search-params.ts` | STATE_ORDER + searchParamsCache | ✓ VERIFIED | `STATE_ORDER` and `searchParamsCache` exported; 6 unit tests GREEN |
| `src/app/layout.tsx` | NuqsAdapter wrapping children | ✓ VERIFIED | `grep -c "NuqsAdapter" = 2` (import + JSX usage) |
| `src/hooks/useProductionPolling.ts` | 30s polling hook + REFRESH_INTERVAL_MS | ✓ VERIFIED | `REFRESH_INTERVAL_MS = 30_000`, `setInterval`, `clearInterval`, `useRouter().refresh` |
| `src/lib/production-derivations.ts` | 4 pure helpers (groupOrdersByState, computeColumnWeights, filterOrders, isOrderNextUp) | ✓ VERIFIED | All 4 functions exported; `parseFloat` (×5), `toLowerCase`, `trim`; no React/Next imports |
| `src/components/ProductionCard.tsx` | DB-shape clickable card with a11y | ✓ VERIFIED | `role="button"`, `tabIndex={0}`, `onKeyDown`, `parseFloat`, "Next Up", `aria-label="In progress"` |
| `src/components/MillColumn.tsx` | Per-line composition, visual state order | ✓ VERIFIED | Imports 3 helpers from production-derivations, renders ProductionCard, "No orders" empty state |
| `src/components/ProductionDashboard.tsx` | Client wrapper: header + filter + search + polling + columns | ✓ VERIFIED | `useProductionPolling()`, `useQueryStates`, `filterOrders`, `useDebounce(150)`, 3 `<Suspense>`, `<BlockedAlertBand>`, `<LastUpdatedChip>`, `<ProductionDrawer>` |
| `src/components/ProductionDrawer.tsx` | Order details + timeline + transition buttons | ✓ VERIFIED | `w-[480px]`, `bg-black/30`, `Order not found`, `canEdit &&`, `Intl.DateTimeFormat`, `parseFloat` |
| `src/components/TransitionButtons.tsx` | 4 useActionState-bound transition buttons + conflict banner | ✓ VERIFIED | 6 `useActionState` calls, verbatim locked conflict message, D-14 `router.refresh()` on conflict |
| `src/components/BlockReasonModal.tsx` | Radix Dialog with required textarea + trim guard | ✓ VERIFIED | All 5 Radix Dialog primitives, `reason.trim()` guard, `blockOrder` wired |
| `src/components/DrawerCloseHandlers.tsx` | ESC + backdrop click → clear ?order=, gated by modalOpen | ✓ VERIFIED | `addEventListener('keydown')`, `if (modalOpen) return` guard |
| `src/app/page.tsx` | Async RSC, force-dynamic, live ProductionDashboard | ✓ VERIFIED | `force-dynamic`, `Promise.all`, `searchParamsCache.parse`, `<ProductionDashboard>`, auth redirect |
| `src/app/import/page.tsx` | Bulk import RSC at /import | ✓ VERIFIED | `force-dynamic`, `getImportBatches({ limit: 10 })`, `<ImportFlow>`, auth redirect |
| `src/components/ImportFlow.tsx` | Three-phase import wrapper | ✓ VERIFIED | `MAX_IMPORT_BYTES`, locked error text, `previewImportAction`, `commitImportAction`, `'skip'` default |
| `src/components/ImportHistoryTable.tsx` | Import batch history table | ✓ VERIFIED | "No imports yet", "Recent Imports", `Intl.DateTimeFormat` |
| `.planning/phases/34-production-dashboard-ui-and-homepage-promotion/34-HUMAN-UAT.md` | UAT contract with Inherited GAP-02 entry | ✓ VERIFIED (file present, status: pending) | T1-T12 present, "Inherited: GAP-02 revalidateTag end-to-end (from Phase 33)" present, Tab A/Tab B/≤30s in body. All 12 observed results are `[pending]` — UAT not yet executed. |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/app/layout.tsx` | `nuqs/adapters/next/app` | `<NuqsAdapter>{children}</NuqsAdapter>` | ✓ WIRED | grep count = 2 (import + tag) |
| `src/lib/search-params.ts` | `@/db/schema/orders` | `import type { ProductionState }` | ✓ WIRED | STATE_ORDER typed as `readonly ProductionState[]` |
| `src/actions/import.ts` | `next/cache` | `revalidateTag('import-batches', 'max')` | ✓ WIRED | 2 sites (success + degraded-success) |
| `src/db/queries/imports.ts` | `next/cache` | `unstable_cache` with tag `'import-batches'` | ✓ WIRED | Cache key and tag both `'import-batches'` — D-21 contract |
| `src/components/ProductionDashboard.tsx` | `@/hooks/useProductionPolling` | `useProductionPolling()` | ✓ WIRED | Line 137: called unconditionally at hook mount |
| `src/components/ProductionDashboard.tsx` | `@/lib/production-derivations` | `filterOrders(orders, status, q)` | ✓ WIRED | `useMemo` with orders/status/q deps |
| `src/components/ProductionDashboard.tsx` | `nuqs` | `useQueryStates({ status, q, order })` | ✓ WIRED | `parseAsArrayOf(parseAsStringLiteral(STATE_ORDER))` for status |
| `src/components/ProductionDashboard.tsx` | `@/components/ProductionDrawer` | `{order && <Suspense fallback={<DrawerSkeleton />}><ProductionDrawer /></Suspense>}` | ✓ WIRED | Conditional on `order` URL state; plan-05 TODO removed |
| `src/components/TransitionButtons.tsx` | `@/actions/transitions` | `useActionState` closure wrappers | ✓ WIRED | `transitionToMixing`, `completeOrder`, `resumeFromBlocked` all bound |
| `src/components/BlockReasonModal.tsx` | `@radix-ui/react-dialog` | `Dialog.Root/Portal/Overlay/Content/Title` | ✓ WIRED | All 5 Radix primitives present |
| `src/app/page.tsx` | `src/lib/search-params.ts` | `await searchParamsCache.parse(searchParams)` | ✓ WIRED | Awaited correctly (Pitfall 2) |
| `src/app/page.tsx` | `src/db/queries/orders.ts` + `events.ts` | `Promise.all([getProductionOrders(), getOrderById(order), getOrderEvents(order)])` | ✓ WIRED | Parallel fan-out; conditional on `order !== ''` |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `src/components/ProductionDashboard.tsx` | `orders: ProductionOrder[]` | `getProductionOrders()` in page RSC → prop | DB-backed `unstable_cache` Drizzle query | ✓ FLOWING |
| `src/components/ProductionDrawer.tsx` | `order: ProductionOrder \| null`, `events: OrderEvent[]` | `getOrderById(order)` + `getOrderEvents(order)` in page RSC → props | DB-backed Drizzle queries; null-safe | ✓ FLOWING |
| `src/components/ImportHistoryTable.tsx` | `batches: ImportBatch[]` | `getImportBatches({ limit: 10 })` in import page RSC → prop | DB-backed `unstable_cache` query with `desc(importedAt)` | ✓ FLOWING |
| `src/components/LastUpdatedChip.tsx` | `lastUpdated: Date` | `useState(() => new Date())` reset on `[orders]` dep in ProductionDashboard | Resets on every `router.refresh()` cycle (orders prop reference changes) | ✓ FLOWING |
| `src/components/BlockedAlertBand.tsx` | `orders: ProductionOrder[]` | Same `orders` prop from page RSC | Filters `state === 'Blocked'` client-side over live DB data | ✓ FLOWING |

---

### Behavioral Spot-Checks

Skipped — requires running server with live Neon DB and Clerk credentials. These checks are delegated to the human UAT (34-HUMAN-UAT.md T1-T12).

---

### Probe Execution

No probe scripts found for Phase 34. This phase uses the `checkpoint:human-verify` gate (plan 34-07 Task 3) as the runtime verification mechanism, captured in `34-HUMAN-UAT.md`.

---

### Requirements Coverage

| Requirement | Source Plan(s) | Description | Status | Evidence |
|-------------|---------------|-------------|--------|----------|
| PROD-01 | 34-01, 34-07 | `/` replaces Coming Soon with async RSC + force-dynamic | ✓ SATISFIED | `src/app/page.tsx` rewritten; `export const dynamic = 'force-dynamic'`; no placeholder text |
| PROD-02 | 34-04, 34-05, 34-07 | Three-column board (Premix/Excel/CGM) from DB | ✓ SATISFIED | `MillColumn` × 3 in `ProductionDashboard`; data from `getProductionOrders()` |
| PROD-03 | 34-01, 34-05 | Status filter pills URL-synced via nuqs | ✓ SATISFIED | `parseAsArrayOf(parseAsStringLiteral(STATE_ORDER))` in `useQueryStates` |
| PROD-04 | 34-01, 34-05 | Search URL-synced, 150ms debounced | ✓ SATISFIED | `useDebounce(searchInput, 150)` + nuqs `q` param |
| PROD-05 | 34-06 | Order details panel with transition history and transition buttons | ✓ SATISFIED | `ProductionDrawer` + `TransitionButtons` + `BlockReasonModal` + `DrawerCloseHandlers` |
| PROD-06 | 34-03, 34-05 | Blocked alert band aggregates blocked orders | ✓ SATISFIED | `BlockedAlertBand`: sticky, null guard, chip format, nuqs click handler |
| PROD-07 | 34-04 | Next-up indicator on topmost Pending order in each column | ✓ SATISFIED | `isOrderNextUp` pure function + `isNextUp` prop in `ProductionCard` |
| PROD-08 | 34-04 | In-progress badge on every Mixing order | ✓ SATISFIED | `isInProgress={order.state === 'Mixing'}` + pulsing dot with `aria-label="In progress"` |
| PROD-09 | 34-02, 34-05 | 30s polling via named constant | ✓ SATISFIED | `useProductionPolling` with `REFRESH_INTERVAL_MS = 30_000`; mounted in `ProductionDashboard` |
| PROD-10 | 34-03, 34-05, 34-07 | Loading skeleton per column; empty state | ✓ SATISFIED | `ColumnSkeleton` (3 cards) in `<Suspense>` per MillColumn; "No orders" in empty column |
| PROD-11 | 34-03, 34-05 | Last-updated timestamp + manual refresh in header strip | ✓ SATISFIED | `LastUpdatedChip` with 5s tick, `RotateCcw` refresh button, `isRefreshing` spinner |

All 11 PROD-* requirements (PROD-01 through PROD-11) are accounted for. No orphaned requirements found.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/components/ProductionDrawer.tsx` | 216 | `label="Formula Type"` wired to `order.textureType` — wrong field label (WR-01 from code review) | ⚠️ Warning | Display correctness: operators see texture data labeled as Formula Type. Schema has no `formula_type` column. Label should be "Texture Type". Not a crash; not a blocker for code correctness but misleads operators. |
| `src/actions/import.ts` | 706, 734, 745, 786 | `userId!` non-null assertions inside per-row try/catch after `requireRole` redirect (WR-02 from code review) | ⚠️ Warning | Latent crash risk if Clerk session shape drifts. The `requireRole` redirect path is framework-dependent; non-null assertions bypass TypeScript safety. Current happy path is safe. |
| `src/components/Sidebar.tsx` | 34 | `pathname.startsWith(href)` for `/import` could over-match `/imports` or `/import-history` (WR-03 from code review) | ⚠️ Warning | Latent nav bug — no such routes currently exist, so harmless today. |
| `src/components/BlockReasonModal.tsx` | 54-57 | `onClose()` called before `setReason('')` — potential stale-text flash on re-open (WR-04 from code review) | ⚠️ Warning | Minor UX defect on re-open of the block modal. React v18 auto-batching may suppress the symptom. Not a crash. |
| `src/components/ProductionDashboard.tsx` | 73 | `void STATE_COLORS;` — `STATE_COLORS` defined (lines 49-70) but immediately voided (IN-04) | ℹ️ Info | 18 lines of unused style data shipped to client bundle. Phase 35 may consume it; remove if not. |

No `TBD`, `FIXME`, or `XXX` debt markers found in any phase-34 source files.

---

### TDD Gate Compliance

Plans 34-02 (type: tdd) and 34-04 (type: tdd) are verified to have proper RED→GREEN commit pairs:

| Plan | RED Commit | GREEN Commit | Tests |
|------|-----------|-------------|-------|
| 34-02 | `59951d8` test(34-02): RED useProductionPolling cadence + cleanup | `9f57689` feat(34-02): GREEN useProductionPolling — 30s router.refresh polling hook | 4/4 |
| 34-04 (derivations) | `589ed82` test(34-04): add failing tests for production-derivations | `ff12f51` feat(34-04): implement production-derivations pure helpers | 16/16 |
| 34-04 (ProductionCard) | `41319d6` test(34-04): add failing RTL tests for ProductionCard | `ff01662` feat(34-04): implement ProductionCard | 9/9 |
| 34-04 (MillColumn) | `4df64eb` test(34-04): add failing RTL tests for MillColumn | `37658fb` feat(34-04): implement MillColumn | 8/8 |

All TDD commit pairs confirmed present in git history.

---

### Human Verification Required

#### 1. Full Manual UAT (T1-T12 in 34-HUMAN-UAT.md)

**Test:** Run `npm run dev` against the live Neon DB with a signed-in `mill_operator` user. Execute all 12 tests in `.planning/phases/34-production-dashboard-ui-and-homepage-promotion/34-HUMAN-UAT.md` in order:

- **T1:** Unauthenticated `/` → redirects to `/sign-in`
- **T2:** Authenticated mill_operator sees three-column live dashboard (PROD-01, PROD-02)
- **T3:** Click filter pill → URL gets `?status=Pending`; reload preserves filter (PROD-03, PROD-04)
- **T4:** Click order card → drawer opens with fields + timeline; ESC/X/backdrop each close and clear `?order=` (PROD-05)
- **T5:** Blocked alert band appears when blocked orders exist; clicking a chip opens the correct order's drawer; next-up and in-progress badges visible (PROD-06, PROD-07, PROD-08)
- **T6:** LastUpdatedChip counts up; at ~30s DevTools shows RSC payload reload; chip resets; manual refresh resets chip + shows spinner (PROD-09, PROD-11)
- **T7:** Column skeletons appear briefly during `router.refresh()` (PROD-10)
- **T8:** Sidebar shows Dashboard + Import; active state follows current route (D-24)
- **T9:** Bulk import end-to-end — drop zone, 2 MB guard (locked error message), preview, Skip default, Overwrite toggle, Commit, ImportHistoryTable updates (D-15, D-16, D-17, D-18)
- **T10:** Transition flow — Pending→Mixing via "Start Mixing"; Block Order modal with required reason; Resume from Blocked; Complete Order; Completed shows no buttons
- **T11:** Non-operator sees dashboard but no transition buttons; `/import` drop zone hidden with read-only notice (D-25)
- **T12 (Inherited GAP-02):** Two-tab observation — Tab B transitions an order; Tab A reflects the new state within ≤30s without a manual refresh (D-26, Phase 33 GAP-02 closure)

**Expected:** All 12 tests recorded `pass` with operator initials + date. After T12 passes, amend `33-HUMAN-UAT.md` Test #2 from `deferred_to_phase_34` to `closed_in_phase_34 (pass, <date>, <commit>)`.

**Why human:** Requires a running Next.js dev server connected to the live Neon Postgres database with seeded production_orders data, Clerk authentication with a `mill_operator` role test user, and two simultaneous browser tabs to observe the revalidateTag propagation window. The T12 GAP-02 test inherently requires observing real network behavior over a ≤30s polling window. No automated test can substitute for this end-to-end scenario.

---

### Gaps Summary

No automated gaps. All 11 observable truths are VERIFIED by codebase evidence. The 4 code-review warnings (WR-01 through WR-04) are present and documented:

- **WR-01** (Formula Type label shows textureType) is a display correctness defect — notable but not a goal-blocker; the drawer renders, the field is populated, the label is wrong. Recommend fixing in a follow-up PR: `<FieldRow label="Texture Type" value={order.textureType ?? '—'} />`.
- **WR-02**, **WR-03**, **WR-04** are latent defects with no current runtime impact.

The sole path to `passed` is completion of the human UAT and recording all 12 tests as `pass` in `34-HUMAN-UAT.md` (with the `33-HUMAN-UAT.md` GAP-02 amendment committed alongside).

---

_Verified: 2026-05-14T22:00:00Z_
_Verifier: Claude (gsd-verifier)_
