# Phase 34: Production Dashboard UI and Homepage Promotion - Context

**Gathered:** 2026-05-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace the Coming Soon homepage at `/` with the live, DB-backed mill production dashboard — first production feature shipped to authenticated users. Consume the Phase 33 query layer (`getProductionOrders`, `getOrderById`, `getOrderEvents`) and the four transition + two import server actions; wire them to a 3-column board, a right-side details drawer, a top-of-board blocked alert band, a header strip with last-updated chip + manual refresh, a dedicated `/import` route, and a context-aware sidebar that swaps the existing "Coming Soon" placeholder for `Dashboard` + `Import`. Filter pills and search box URL-sync via `nuqs`. The 30-second polling loop is the canonical freshness mechanism alongside `revalidateTag('production-orders')` invalidation.

**In scope:**
- Production homepage at `/` — async RSC with `export const dynamic = 'force-dynamic'` (PROD-01).
- `src/app/page.tsx` rewritten to call `getProductionOrders` and (when `?order=` is present) `getOrderById` + `getOrderEvents` in parallel, then render the new `ProductionDashboard` client wrapper inside `DashboardLayout`.
- **NEW** `src/components/ProductionDashboard.tsx` (or similar) — client component typed on the Drizzle `ProductionOrder` shape; owns nuqs URL state, polling hook, filter pills, search input, details drawer trigger, blocked alert band, last-updated chip, manual refresh control.
- **NEW** `src/components/ProductionDrawer.tsx` (server component) — renders order fields + `order_events` timeline + blocker note + transition action buttons. Closes on drawer-X / outside-click / ESC, all of which clear `?order=` from the URL.
- **NEW** `src/components/BlockReasonModal.tsx` (client) — modal dialog wrapping a required textarea + Confirm/Cancel; on Confirm calls `blockOrder(orderId, version, reason)`.
- Transition button wiring inside the drawer for `transitionToMixing`, `completeOrder`, `blockOrder`, `resumeFromBlocked`. Each binds to the Phase 33 server action and consumes the discriminated-union return shape per Phase 33 D-01..D-04.
- Polling hook (`useProductionPolling` or inline) — `setInterval(() => router.refresh(), 30_000)` in a client component, with a named constant for the interval. Cleans up on unmount.
- **NEW** `/import` route — full-page bulk XLSX import flow. Drop zone + file picker on the entry view; preview table with per-row Skip/Overwrite radios (Phase 33 D-12); Commit button calls `commitImportAction`. Import history table (file_name / row_count / imported_by / imported_at) lives at the bottom of the same page.
- `src/app/import/page.tsx` — async RSC, calls a Phase 34 NEW `getImportBatches()` query (top N most recent batches) plus renders the client import wrapper.
- **NEW** `src/db/queries/imports.ts` — `getImportBatches({ limit })` typed query, cached with tag `'import-batches'`. `commitImportAction` (Phase 33) must `revalidateTag('import-batches')` in addition to `'production-orders'` so the history table refreshes after commit. **Phase 33 does NOT call this tag today** — Phase 34 must amend `src/actions/import.ts` or add the tag invalidation as part of the import-history wiring task. Note this is a Phase-33 → Phase-34 contract gap; the planner decides whether to patch import.ts directly or fold the tag into a wrapper.
- `src/components/Sidebar.tsx` — production branch (`!pathname.startsWith('/demo')`) now lists `Dashboard` (`/`) + `Import` (`/import`); the "Coming Soon" placeholder item is removed. Demo branch unchanged.
- `src/components/MillReadOnlyStub.tsx` — **deleted** along with its references in `src/app/page.tsx`.
- Loading states — each `MillColumn` wrapped in `<Suspense fallback={<ColumnSkeleton />}>` so per-column streaming is independent (PROD-10).
- URL state via `nuqs`: `?status=Pending,Mixing` (comma-separated array literal), `?q=acme` (plain string, trimmed + lowercased before applying), `?order=<id>` (single string, opens drawer). All three survive a hard reload.
- Last-updated chip + manual refresh control in the top-right of the board header strip (PROD-11). Relative time ticking client-side every 5s; click refresh icon → `router.refresh()` with spinner overlay until the response lands.
- Sticky top-of-board blocked alert band (PROD-06) — hidden when zero blocked orders, otherwise lists every blocked order across all mill lines with click → opens that order's drawer (sets `?order=`).
- Next-up indicator on the topmost Pending order per column (PROD-07). In-progress badge on every Mixing order (PROD-08).
- **Inherited UAT (GAP-02)** — Phase 34 must explicitly UAT the end-to-end `revalidateTag` flow per `.planning/phases/33-server-actions-queries-and-bulk-import/34-INHERITED-UAT.md`. Two-tab test, recorded in Phase 34's HUMAN-UAT.md as a dedicated entry.

**Out of scope (deferred to later phases or future iterations):**
- KPI cards and metrics (KPI-01..KPI-08) — Phase 35.
- Optimistic UI updates on transitions (PROD-FUT-01) — v2.1+.
- Undo last transition (TRANS-FUT-01) — v2.1+.
- Server-side search (DB `ILIKE`) — client-side substring matching is sufficient at v2.0 row volumes (≤33 seeded + low daily import volume). Reconsider if row count grows.
- Mill line reassignment UI — v2.1+ (carried from Phase 33 D-16; imported orders cluster in Premix).
- Pixel-level visual specifics from `designs/mill-production.pen` — to be locked via `/gsd-ui-phase 34` before planning.
- "New orders available" banner triggered by polling diff (PROD-FUT-02) — v2.1+.
- Column-mapping UI for non-Book1.xlsx imports (IMPORT-FUT-01) — v2.1+.
- Batch "set all duplicates to X" toggle in import preview — v2.1+.
- Production E2E automation gated on Clerk 2FA / custom domain — carried known gap.
- 14 pre-existing ClerkProvider test failures in `src/app/settings/__tests__/page.test.tsx` (D-04 deferred from Phase 27) — not Phase 34's problem.

</domain>

<decisions>
## Implementation Decisions

### Component reuse strategy

- **D-01:** **Build a new `ProductionDashboard` for `/`; leave `/demo/mill-production` and its `MillProductionUI.tsx` untouched.** `MillProductionUI` is typed on `DemoOrder` with client-side `useState<Set<ProductionState>>` filtering; Phase 34 needs the Drizzle `ProductionOrder` type and `nuqs` URL-synced filtering. Adapting one component to serve both routes (or extracting shared primitives) trades complexity now for negligible reuse later — the demo is a frozen v1.1 design artifact, not a living surface. Intentional divergence: `/demo/mill-production` stays as a v1.1 polish demo with mock data; `/` is the production board. If the demo is ever retired, its component goes with it.
- **D-02:** Phase 34 still studies `MillProductionUI.tsx` as visual prior art for column structure, state ordering, card layout, and pill behavior. The look-and-feel should match (same colors, same column ordering, same FilterPill component). Code is not shared; visual contract is shared. UI-SPEC.md (next step) locks the exact visual mapping.
- **D-03:** **`FilterPill` and `StatusBadge` are reusable as-is** (already in `src/components/ui/`) — Phase 34 imports them, does NOT clone them. The card itself (`ProductionCard`) is rebuilt for the DB shape because field names differ (`weight_lbs` is `string` in the DB type, `delivery_time` is plain text) and the card needs a click handler that the demo's never had.

### URL state contract

- **D-04:** **`?status=Pending,Mixing` — comma-separated array literal.** Uses `nuqs` `parseAsArrayOf(parseAsStringLiteral(STATE_ORDER))`. Empty / missing key = show all four states (matches existing demo UX). Multi-select pill behavior is preserved end-to-end (PROD-03). The four valid literals are `Pending | Mixing | Completed | Blocked`; unknown values get silently dropped during parsing.
- **D-05:** **`?q=acme` — plain string.** Empty / missing = no search. The dashboard trims and lowercases the value before applying. URL keeps the original casing (so back/forward feels natural) but matching is case-insensitive.
- **D-06:** **`?order=<id>` — single string.** Presence opens the right-side drawer for that order. Cleared on close (drawer-X / outside-click / ESC) so back/forward behaves predictably. Unknown / stale IDs render an empty-state inside the drawer ("Order not found"); does NOT throw.
- **D-07:** Search is **client-side substring matching on customer name + product**, applied to the already-fetched orders array after the status filter. No server-side `ILIKE` query in v2.0; reconsider once row count justifies the server cost. Defended by v2.0 row counts (≤33 seeded + low daily import volume) and by the latency win (no extra round-trip per keystroke).

### Order details drawer

- **D-08:** **Right-side slide-over drawer.** Board stays visible to the left at full layout width minus the drawer. Drawer width: planner picks a width consistent with the design (likely 420–520px); UI-SPEC.md locks it. Outside-click / ESC / drawer-X all close the drawer and clear `?order=` from the URL. The board does NOT shrink — the drawer overlays the right edge of the board (semi-transparent backdrop behind the drawer is acceptable; planner decides on backdrop vs no-backdrop based on .pen design).
- **D-09:** **Drawer data is fetched in the page RSC when `?order=` is present.** `src/app/page.tsx` reads `searchParams.order`; if set, calls `getOrderById(id)` and `getOrderEvents(id)` in `Promise.all` alongside the orders list. The drawer renders as a server component nested inside the layout, receiving `{ order, events }` as props. Deep-link to `/?order=ord_123` renders the drawer open on first paint with data already there — no client-side loading state on hard navigation. `revalidateTag('production-orders')` invalidates both the list and the open order on every transition because `getOrderEvents` is wrapped in `unstable_cache` with the same tag.
- **D-10:** **All four transition action buttons (Start Mixing / Complete / Block / Resume) live inside the drawer ONLY.** Cards on the board are click-targets only — they open the drawer; they do NOT host inline transition controls. Two-click cost is intentional: the operator reads context in the drawer before changing irreversible state. Matches Phase 33 D-04 (one named export per transition — UI buttons bind 1:1 to discrete actions).

### Transition action UX

- **D-11:** **Complete is single-click, no confirm modal.** Mistakes are recoverable via Block + Resume; the audit trail captures every transition. Friction-free Complete keeps the operator workflow tight.
- **D-12:** **Resume is a split button: primary = Resume to Mixing; secondary = Resume to Pending.** The split-button chevron (or a dropdown) exposes the Pending option for use-cases like "needs quality re-test." `resumeFromBlocked(orderId, version, toState)` takes `toState` as a parameter — the UI binds the primary action to `'Mixing'` and the secondary to `'Pending'`.
- **D-13:** **Block reason is captured via a modal dialog with a required textarea.** Click Block in the drawer → modal opens (stacks over the drawer + backdrop) → operator types a reason → Confirm calls `blockOrder(orderId, version, reason)`. Empty textarea disables Confirm client-side; server still validates and returns `{ code: 'validation' }` if empty slips through. Cancel returns the operator to the drawer without invoking the action. Modal closes on action success; the drawer refreshes to show the new Blocked state and the new event in the timeline.
- **D-14:** **Conflict UX** (TRANS-06): when an action returns `{ code: 'conflict' }` (locked message: `"Order was modified by another user. Please refresh."`), the drawer shows an inline red banner with the message AND auto-calls `router.refresh()` to re-fetch fresh state. After refresh, the drawer re-renders with the new version; the operator can retry from updated state. No modal, no toast-only. This is the Phase 33 D-03 pattern, ported from card-level to drawer-level since transition buttons live in the drawer in Phase 34.

### Bulk import surface

- **D-15:** **Bulk import lives at a dedicated `/import` route** (NOT a modal). Drop zone + file picker on entry; preview table with per-row Skip/Overwrite radios; Commit button at the bottom. The route is full-page because the preview table can have many rows and per-row controls. Linked from a header button on the dashboard ("Import Orders" or similar) AND from the production sidebar nav. Browser back from `/import` returns to the dashboard with filter state preserved (URL state intact).
- **D-16:** **Import history surfaces on the same `/import` page** — a table at the bottom (or in a side column; UI-SPEC.md decides) listing recent batches with columns `file_name`, `row_count`, `imported_by`, `imported_at`. Limit to ~10 most recent (planner picks the exact N); "View all" deferred. Drill-down into a batch's row-level outcomes is deferred to a future iteration. The history table refreshes after a successful commit via the `revalidateTag('import-batches')` invalidation (see D-21 below).
- **D-17:** **Client-side file-size guard** (≤ 2MB, matching Phase 33 D-09 `MAX_IMPORT_BYTES`) on the input handler. Rejects oversized files before submit with a user-friendly error toast/inline message. Server-side guard already in place in Phase 33; this is defense-in-depth UX.
- **D-18:** **Per-row Skip/Overwrite radios default to Skip** (Phase 33 D-12, carried forward). No batch "set all" toggle in v2.0.

### Polling, refresh, and freshness

- **D-19:** **30-second polling loop** (PROD-09) — `setInterval(() => router.refresh(), 30_000)` in a client component. Constant: `const REFRESH_INTERVAL_MS = 30_000;` exported and named so future tuning is one-edit. Cleans up on unmount (`clearInterval` in `useEffect` return). Pauses during in-flight refreshes is NOT required for v2.0 (router.refresh dedupes internally).
- **D-20:** **Last-updated chip + manual refresh in the top-right of the board header strip** (PROD-11). Relative time format (e.g., "Updated 12s ago"), updating client-side every 5 seconds. Refresh icon button next to the chip; on click → `router.refresh()` + show spinner overlay on the icon until the next render. Resets the relative-time anchor to "now" after each successful refresh.
- **D-21:** **Phase-33 → Phase-34 contract gap on `revalidateTag('import-batches')`:** Phase 33's `commitImportAction` currently calls `revalidateTag('production-orders')` only. Phase 34 introduces the cached `getImportBatches` query with tag `'import-batches'`; that tag MUST be added to `commitImportAction`'s invalidation list so the import history table refreshes after commit. Planner decides whether to (a) patch `src/actions/import.ts` directly with the additional `revalidateTag('import-batches')` call (recommended — keeps actions as the single source of cache invalidation) or (b) wrap the action in a Phase-34 layer that adds the tag. Option (a) is cleaner; planner should call out the cross-phase edit in the plan.

### Blocked alert band

- **D-22:** **Sticky top-of-board band, always visible if any blocked orders exist.** Pinned above the 3 columns. Lists every blocked order across all mill lines, formatted as a row of clickable chips or list items: `"BLOCKED: ORD-123 (Premix) — missing premix corn"`. Click an entry → sets `?order=<id>` and opens the drawer for that order. Hidden entirely (component returns `null`) when zero blocked orders. Persists during column scroll (the band is sticky relative to the board container, not the page).

### Loading states

- **D-23:** **`<Suspense>` boundaries per `MillColumn`, not whole-page.** Wrap each `MillColumn` in `<Suspense fallback={<ColumnSkeleton />}>` so per-column streaming is independent — empty/slow columns don't block the whole board. The skeletons appear on hard navigation streaming and on `router.refresh()` re-renders; on initial SSR, the page server-renders with data already present and skeletons are not visible. The drawer also gets its own `<Suspense>` boundary when `?order=` is present, with a drawer-shaped skeleton.

### Sidebar production nav

- **D-24:** **Production sidebar lists `Dashboard` (`/`) + `Import` (`/import`) only** under the `PRODUCTION` section label. The existing "Coming Soon" item is removed. Demo branch (when `pathname.startsWith('/demo')`) is unchanged. Active-state logic stays as-is (`isActive` helper with prefix matching). Future production routes (KPI page in Phase 35, etc.) extend this list — minimal surface area now, easy to extend.

### Page-level auth and read-only mode

- **D-25:** **The `/` page is auth-only** (matches AUTH-02..AUTH-03): any signed-in user reads the dashboard; only `mill_operator` users can write (the server actions themselves enforce the role gate). The drawer ALWAYS renders the transition buttons; clicking a transition button when the user lacks `mill_operator` returns `{ code: 'unauthorized' }` from the action, which surfaces as a redirect to `/sign-in` (Phase 33 D-02). For a cleaner UX, the drawer MAY hide transition buttons entirely when the page-level `canEdit` flag is false. **Recommendation: hide buttons in read-only mode** — `MillReadOnlyStub` already passes a `canEdit` prop computed via `checkRole('mill_operator')`; carry that pattern forward by passing `canEdit` into the drawer. Planner picks final shape.

### Inherited UAT (GAP-02 closure)

- **D-26:** **Phase 34's plan MUST add an explicit UAT entry for `GAP-02` end-to-end `revalidateTag` observation** per `.planning/phases/33-server-actions-queries-and-bulk-import/34-INHERITED-UAT.md`. The two-tab test (Tab A views, Tab B transitions, Tab A reflects within ≤30s without manual refresh) is recorded in Phase 34's `34-HUMAN-UAT.md` as a dedicated test entry titled `Inherited: GAP-02 revalidateTag end-to-end (from Phase 33)`. After UAT runs, amend `33-HUMAN-UAT.md` Test #2 to mark GAP-02 closed.

### Claude's Discretion

- **Drawer width and visual placement of transition buttons inside the drawer** — UI-SPEC.md (next step) locks these from `designs/mill-production.pen`. Planner does not need to guess.
- **Exact location of the "Import Orders" header button on the dashboard** (top-right of the board header strip alongside the refresh chip, or in the page header at the layout level) — UI-SPEC.md decides.
- **Number of import-history rows shown on `/import`** — recommend 10 most recent; planner picks based on visual density.
- **Whether the import drop zone supports drag-drop in addition to file picker** — IMPORT-01 says drag-drop OR file picker. Recommend supporting both for UX (drag-drop is the modern default). Planner / UI-SPEC decides.
- **Whether to add a `next-up` highlight visual treatment (e.g., glow, badge, position-only)** — PROD-07 says "Next-up indicator highlights the topmost Pending order in each column." Visual treatment specifics → UI-SPEC.md.
- **In-progress badge styling** (PROD-08) — visual specifics → UI-SPEC.md.
- **Search debounce window** — recommend 150ms client-side debounce so URL updates don't fire on every keystroke; planner picks based on testing feel.
- **Whether to bundle the cross-action `revalidateTag('import-batches')` patch into `src/actions/import.ts` as part of Phase 34's plan** — recommended yes (option a in D-21); planner finalizes.
- **Whether `MillReadOnlyStub.tsx` is deleted now or only the import is removed** — recommend full delete since no other file imports it (verify with grep before delete). If anything imports it, deletion is part of the cleanup task.
- **`users` table lazy-sync** (DATA-05, deferred from Phase 33) — if the drawer renders `changed_by` as a display name, Phase 34 needs to either query the `users` table (and ensure it's populated) or render the Clerk user ID directly. Recommend: render Clerk user ID for v2.0 (simplest), add a follow-up todo to wire `users` lookup when display names are visually required. Planner can choose to bundle DATA-05 if low-cost.

### Folded Todos
None — `gsd-sdk query todo.match-phase 34` returned 0 matches.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project planning (LOCKED requirements + roadmap)
- `.planning/ROADMAP.md` — Phase 34 entry: goal + 5 success criteria. SC#1 (3-column dashboard from live DB), SC#2 (URL-synced filter + search survive reload), SC#3 (drawer + blocked band + next-up + in-progress badge), SC#4 (30s polling + last-updated + manual refresh + skeletons), SC#5 (sidebar production nav, `/demo/*` unchanged).
- `.planning/REQUIREMENTS.md` — v2.0 requirements PROD-01..PROD-11 are this phase's scope. AUTH-* and TRANS-* / IMPORT-* are Phase 31/33 (referenced for action signatures + role gating).
- `.planning/PROJECT.md` — v2.0 milestone context, deferred items, Out of Scope list (no optimistic UI, no drag-drop card reordering, no inline editing, no status dropdown, etc.).
- `.planning/STATE.md` — pre-loaded v2.0 implementation notes (cache tag `'production-orders'` mandatory, `revalidateTag` invariant, polling cadence locked at 30s).

### Phase carry-forward (do not relitigate)
- `.planning/phases/33-server-actions-queries-and-bulk-import/33-CONTEXT.md` — Phase 33 locked all action signatures and return shapes. D-01..D-04 (discriminated-union return + tagged error codes + inline-banner conflict UX + named-export-per-transition). D-05..D-09 (XLSX preview/commit shape + `MAX_IMPORT_BYTES = 2MB`). D-10..D-13 (duplicate handling). D-14..D-16 (Zod validation + Premix-default mill line + nullable columns).
- `.planning/phases/33-server-actions-queries-and-bulk-import/34-INHERITED-UAT.md` — **MANDATORY:** inherited UAT step for GAP-02 (end-to-end revalidateTag observation). Phase 34's HUMAN-UAT.md MUST add a dedicated entry titled `Inherited: GAP-02 revalidateTag end-to-end (from Phase 33)`.
- `.planning/phases/32-schema-migrations-and-seed-data/32-CONTEXT.md` — locked schema decisions. D-04 (canonical `ProductionOrder` = Drizzle `$inferSelect`), D-11 (`version int DEFAULT 1`), D-12 (`numeric(10,2)` for weight returns TS `string`; `texture_type`/`line_code` NULLABLE).
- `.planning/phases/31-role-expansion-and-db-infrastructure/31-CONTEXT.md` — locked auth pattern. `mill_operator` role + `requireRole` / `checkRole` utilities. D-02 (`/` is auth-only, no page-level role gate). D-03 (server-computed `canEdit` flag pattern).

### Research (drives v2.0 implementation decisions)
- `.planning/research/v2.0/ARCHITECTURE.md` — Decision 5 (URL state via `nuqs`), Decision 7 (audit trail = `order_events` table, append-only).
- `.planning/research/v2.0/STACK.md` — `nuqs` install + rationale; "what NOT to add" list (no `xlsx`, no `@vercel/postgres`, etc.).
- `.planning/research/v2.0/PITFALLS.md` — Edge driver leak rules; the Phase 34 pages must NOT use `export const runtime = 'edge'`.
- `.planning/research/v2.0/FEATURES.md` — PROD-FUT-* and TRANS-FUT-* deferred features; Phase 34's UI must leave room for them (e.g., not bake-in an undo-incompatible shape).

### Code (existing patterns Phase 34 must align with)
- `src/app/page.tsx` — current Phase 31 stub. **Will be rewritten** in Phase 34 to fetch live data and render the new `ProductionDashboard`.
- `src/components/MillReadOnlyStub.tsx` — **will be deleted** (verify no other imports first with `grep -rn MillReadOnlyStub src/`).
- `src/components/MillProductionUI.tsx` — visual prior art only. Not modified by Phase 34. Used by `/demo/mill-production` (unchanged).
- `src/components/Sidebar.tsx` — production branch updated: replace "Coming Soon" item with `Dashboard` (`/`) + `Import` (`/import`). Demo branch unchanged.
- `src/components/DashboardLayout.tsx` — composed by both `/` and `/import` pages. No changes required.
- `src/components/ui/FilterPill.tsx` — reused as-is for the status filter strip.
- `src/components/ui/StatusBadge.tsx` — reused as-is for state indicators inside cards and the drawer timeline.
- `src/db/queries/orders.ts` — `getProductionOrders(filters?)` cached with tag `'production-orders'`; `getOrderById(id)` NOT cached (state-guard read). Phase 34 consumes both from RSC.
- `src/db/queries/events.ts` — `getOrderEvents(orderId)` cached with tag `'production-orders'` (Phase 33 D-X). Drawer consumes this in the RSC.
- `src/actions/transitions.ts` — four named exports: `transitionToMixing(orderId, version)`, `completeOrder(orderId, version)`, `blockOrder(orderId, version, reason)`, `resumeFromBlocked(orderId, version, toState)`. Drawer transition buttons bind to these.
- `src/actions/import.ts` — `previewImportAction`, `commitImportAction`, `MAX_IMPORT_BYTES`. `/import` page consumes these. **Phase 34 must add `revalidateTag('import-batches')` to `commitImportAction`** (D-21).
- `src/db/schema/orders.ts` — `productionOrders` pgTable + `ProductionOrder` / `NewProductionOrder` / `MillLine` / `ProductionState` types. Source of truth for prop shapes. `weight_lbs` is TS `string` (Drizzle `numeric` precision quirk); UI must `parseFloat` or render directly with locale formatting.
- `src/db/schema/events.ts` — `orderEvents` pgTable. Timeline shape: `{ id, order_id, from_state, to_state, changed_by, changed_at, note }`. Phase 34 drawer renders these chronologically.
- `src/db/schema/imports.ts` — `importBatches` pgTable. `/import` history table consumes this via new `getImportBatches()` query.
- `src/lib/auth.ts` — `requireRole('mill_operator')` and `checkRole('mill_operator')`. `/` and `/import` pages use `checkRole` to compute the `canEdit` flag and propagate it.
- `src/types/clerk.d.ts` — `Role` union including `'mill_operator'`. No Phase 34 changes.
- `next.config.ts` — already has `serverActions.bodySizeLimit: '2mb'` from Phase 33. No Phase 34 change.
- `package.json` — `nuqs` install required if not already present (verify during plan). `nuqs` v2.x is the current version on Next.js 16.
- `src/types/millProduction.ts` — demo-only types (`DemoOrder`, etc.). **Not used by Phase 34.** The DB type `ProductionOrder` from `src/db/schema/orders.ts` is the canonical Phase 34 input shape.

### Security and discipline (LOCKED, do not relitigate)
- `docs/security-patterns.md` — §2 inner-guard pattern: server actions enforce `requireRole`; pages enforce auth-only via `auth()` + redirect. Phase 34 follows both.
- `docs/clerk-setup.md` — `mill_operator` test user runbook. Reference for UAT setup.

### External docs (referenced during planning/implementation)
- `nuqs` v2 docs: https://nuqs.47ng.com/ — `parseAsArrayOf`, `parseAsStringLiteral`, `useQueryState` / `useQueryStates` hooks. Confirm Next.js 16 + React 19 compatibility.
- Next.js 16 `unstable_cache` + `revalidateTag`: https://nextjs.org/docs/app/api-reference/functions/unstable_cache — confirm the two-arg `revalidateTag(tag, 'max')` form referenced in 33-04-SUMMARY.md.
- Radix UI Dialog (for block-reason modal): https://www.radix-ui.com/primitives/docs/components/dialog — or Headless UI Dialog; planner picks based on existing UI library posture (none installed today, so this is a NEW dependency choice).
- React 19 `useActionState`: https://react.dev/reference/react/useActionState — pattern for binding transition action returns to drawer-local error state.

### Design source of truth
- `designs/mill-production.pen` — the canonical visual contract for the 3-column board. UI-SPEC.md (via `/gsd-ui-phase 34`) will lock placement of header strip, filter pills, blocked alert band, last-updated chip, refresh control, card styling, drawer shape, transition button placement.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`FilterPill`** (`src/components/ui/FilterPill.tsx`) — already supports the multi-select toggle UX with state-color configs for Pending/Mixing/Completed/Blocked. Phase 34 imports and reuses; no changes needed.
- **`StatusBadge`** (`src/components/ui/StatusBadge.tsx`) — reused inside cards and the drawer's `order_events` timeline for state pills.
- **`DashboardLayout`** (`src/components/DashboardLayout.tsx`) — both `/` and `/import` wrap their content in this; eliminates inline Sidebar+Header duplication.
- **`Sidebar`** (`src/components/Sidebar.tsx`) — already context-aware (`isDemoContext`). Phase 34 edits the `productionNavItems` array to replace "Coming Soon" with `Dashboard` + `Import`.
- **Query layer (`src/db/queries/orders.ts`, `src/db/queries/events.ts`)** — Phase 33 shipped both. `getProductionOrders` is `unstable_cache`-wrapped with tag `'production-orders'`; `getOrderById` is NOT cached (intentional — state-guard read). Phase 34 RSC pages consume directly.
- **Server actions (`src/actions/transitions.ts`, `src/actions/import.ts`)** — Phase 33 shipped both. Each transition returns the discriminated-union `{ ok: true } | { ok: false, code, message }`. Drawer transition buttons bind 1:1 to actions; `useActionState` consumes the result.
- **State machine + types** — `productionStateEnum` (`Pending | Mixing | Completed | Blocked`) and `MillLine` (`Premix | Excel | CGM`) are exported from `src/db/schema/orders.ts`. Source of truth for UI literals; PRODUCTION_STATE_PILL_CONFIG in `MillProductionUI.tsx` can be referenced as visual prior art.

### Established Patterns
- **Async RSC + extracted client wrapper** (Phase 31 D-04, used at every page): page is an async server component that fetches data and renders a `<ClientWrapper data={...}>`. Phase 34 follows this for both `/` and `/import`.
- **`'use server'` action discipline** (Phase 33): every mutating action enforces `await requireRole('mill_operator')` first; reads do not. Drawer transition buttons trigger actions through `useActionState`; the resulting state-machine includes `pending` / `success` / `error` branches.
- **`revalidateTag('production-orders')` invariant**: every action that writes to `production_orders` or `order_events` calls this BEFORE returning. Phase 34 must NOT call `revalidateTag` directly from the dashboard — the action layer owns invalidation.
- **`checkRole('mill_operator')` for view-mode toggling** (Phase 31 D-03): pages compute a `canEdit` boolean server-side and pass it down as a serializable prop. Browser never re-checks the role.
- **URL state via `nuqs`** (newly adopted in Phase 34; first use in this codebase). Pattern: client component imports `useQueryState` / `useQueryStates`, provides a parser and serializer, and reads/writes the URL key.
- **`<Suspense>` boundaries for streaming**: Next.js 16 streaming with React 19; per-column boundaries let the page paint progressively. Phase 34 introduces per-column skeletons.

### Integration Points
- `src/app/page.tsx` — **rewritten** to fetch orders + (conditional on `?order=`) details + events, render `<ProductionDashboard orders={...} canEdit={...} {...optional drawer props} />`.
- `src/app/import/page.tsx` — **new** RSC. Renders `<ImportFlow batches={recentBatches} canEdit={canEdit} />`.
- `src/components/ProductionDashboard.tsx` — **new** client wrapper. Reads URL state via `nuqs`, manages polling, renders header strip (filter pills + search + last-updated chip + refresh + import button), blocked alert band, 3 columns of cards (with per-column `<Suspense>`), and the drawer (when `?order=` is present, rendered as a child server component).
- `src/components/ProductionDrawer.tsx` — **new** server component (rendered as a child of `ProductionDashboard` when `?order=` is set). Receives `{ order, events, canEdit }` props. Hosts transition buttons (when `canEdit`).
- `src/components/BlockReasonModal.tsx` — **new** client component. Modal dialog wrapping a required textarea; on Confirm calls `blockOrder` via `useActionState`.
- `src/components/ImportFlow.tsx` — **new** client wrapper for `/import`. Drop zone + preview + commit + history table. Two-step flow (entry → preview → result) managed with local React state.
- `src/components/Sidebar.tsx` — edit `productionNavItems` array.
- `src/components/MillReadOnlyStub.tsx` — **delete** (verify no other imports).
- `src/db/queries/imports.ts` — **new** query module. `getImportBatches({ limit })` cached with tag `'import-batches'`. Returns the N most recent rows.
- `src/actions/import.ts` — **edit:** add `revalidateTag('import-batches')` to `commitImportAction`'s post-commit invalidations (D-21).
- `package.json` — add `nuqs` (latest v2). Add dialog primitive (Radix or Headless UI; planner picks).
- Potential `src/hooks/useProductionPolling.ts` — **new** hook wrapping `setInterval(() => router.refresh(), REFRESH_INTERVAL_MS)`. Optional refactor; can also be inline in `ProductionDashboard`.

### Build-time risks Phase 34 must surface
- **`'use client'` discipline at the new `ProductionDrawer` boundary** — drawer is server-rendered (per D-09), but transition buttons must be client components. Two options: (a) `ProductionDrawer` is a server component that imports and renders a client `<TransitionButtons />` child; (b) `ProductionDrawer` is wholly client and receives serialized order + events as props from the parent. Option (a) is leaner — preserves server-rendering for the bulk of the drawer; planner picks.
- **`numeric` ↔ `number` rendering** — Phase 32 32-REVIEW-FIX.md CR-01 JSDoc documents Drizzle `numeric` returns TS `string`. Card weight rendering must `parseFloat` (or use `Intl.NumberFormat` with a `string` input via conversion). Verify locale formatting.
- **`nuqs` Next.js 16 + React 19 compatibility** — `nuqs` v2 supports both, but verify against the installed Next.js minor version during plan. Migration guide if any post-v2 breaking change applies.
- **`<Suspense>` + `force-dynamic` interaction** — `force-dynamic` ensures the page is not statically cached; per-column Suspense boundaries still work for streaming. Verify with a short dev-server smoke test in Wave 1.
- **Polling interval named constant** — `REFRESH_INTERVAL_MS = 30_000` must be exported (or commented with a TODO reference) so Phase 35 KPI cards can hook into the same polling cadence rather than running their own.
- **Cross-action tag invariant** — D-21's cross-phase patch: planner must explicitly add a test that confirms `commitImportAction` invalidates BOTH `'production-orders'` AND `'import-batches'`. Without the second tag, the history table doesn't refresh after commit.
- **Drawer outside-click close interacting with the block-reason modal** — when the modal is open ON TOP of the drawer, outside-click on the modal backdrop should close the modal, NOT the drawer. Z-index and event-stopping discipline matters; UI-SPEC + plan must call this out.
- **Sidebar prefix-match collision** — current `isActive('/', pathname)` requires `pathname === '/'`. `/import` will be active when `pathname === '/import'` (prefix match starts with `/import`). The `/` entry's exact-match is correct — verify the helper handles the `/` case AFTER the `/import` route ships (no regression).

</code_context>

<specifics>
## Specific Ideas

- **The drawer is THE place for transitions.** Cards on the board do not host inline transition buttons. The two-click cost (open drawer → transition) is intentional — operators read context before changing irreversible state. This is non-negotiable for v2.0 even if it adds friction; v2.1+ may revisit with PROD-FUT-01 optimistic UI patterns.
- **The conflict message is locked:** `"Order was modified by another user. Please refresh."` (Phase 33 D-02). Verbatim string. Drawer banner renders this exact text. Translation deferred (no i18n in v2.0).
- **Block-reason modal stacks ON TOP of the drawer.** The drawer stays in the DOM; the modal is a Radix/Headless UI Dialog with its own backdrop. On Confirm success, the modal closes and the drawer's timeline refreshes to show the new Blocked-state event.
- **Cross-phase `revalidateTag` patch (D-21):** Phase 34 plan MUST surface the `src/actions/import.ts` edit as an explicit task — not folded silently into another task. The cross-phase edit is the kind of drift that's caught by milestone audits if not surfaced now.
- **`MillProductionUI.tsx` is NOT shared.** Phase 34 builds fresh. The visual contract is shared via `mill-production.pen` (and the UI-SPEC.md that locks it); the code is intentionally diverged.
- **`/demo/mill-production` is frozen.** Demo is a v1.1 polish artifact, not a live surface. Phase 34 does not touch it. If a future phase retires the demo namespace, this component goes with it.
- **`mill_operator` only writes; everyone reads.** D-25's read-only mode hides transition buttons when `canEdit === false`. Read-only viewers still get the full board, blocked band, drawer (with timeline), polling, filters, search. The board itself does not change — only the drawer's action buttons disappear.
- **Sidebar production branch is the canonical surface for new production routes.** Phase 35 (KPI page) adds another item here; v2.1+ adds more. The pattern is set in Phase 34.

</specifics>

<deferred>
## Deferred Ideas

- **Optimistic UI on transitions** (PROD-FUT-01) — v2.1+. Card moves instantly on click; reverts on action error. Adds complexity (local state + revert logic) that doesn't pay back at v2.0 row volumes.
- **"New orders available" banner triggered by polling diff** (PROD-FUT-02) — v2.1+. When polling detects new orders since last render, show a "X new orders — click to refresh" banner.
- **Server-side search via DB `ILIKE`** — defer until row count justifies the round-trip cost. Client-side substring is fine at v2.0 volumes.
- **Search debouncing tuning** — start at 150ms; revisit based on operator feedback.
- **Batch "set all duplicates to X" toggle in import preview** — v2.1+ if operator feedback demands.
- **`users` table lazy-sync** (DATA-05) — Phase 34 renders Clerk user IDs directly for v2.0. Display-name lookup deferred until visually required (likely Phase 35 KPI surfaces where attribution matters more).
- **Mill line reassignment UI** (carried from Phase 33 D-16) — imported orders cluster in Premix. UI to move them between lines is v2.1+.
- **Drill-down into a batch's row-level outcomes from import history** — currently history shows file_name + row_count + imported_by + imported_at. Row-level success/failure detail per batch is deferred to v2.1+.
- **Production E2E automation** — blocked by Clerk 2FA / custom domain. Carried known gap; not Phase 34's problem.
- **i18n / translation of locked strings** (e.g., the conflict message) — deferred indefinitely.
- **KPI cards and metrics** (KPI-01..KPI-08) — Phase 35.
- **Drawer keyboard shortcuts** (e.g., arrow keys to navigate orders within the drawer, ESC to close) — ESC is locked in D-08; arrow-key navigation deferred.
- **Undo last transition within 5-minute window** (TRANS-FUT-01) — v2.1+.

### Reviewed Todos (not folded)
None — `gsd-sdk query todo.match-phase 34` returned 0 matches.

</deferred>

---

*Phase: 34-production-dashboard-ui-and-homepage-promotion*
*Context gathered: 2026-05-14*
