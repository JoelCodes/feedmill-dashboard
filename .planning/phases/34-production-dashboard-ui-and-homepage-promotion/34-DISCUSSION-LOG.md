# Phase 34: Production Dashboard UI and Homepage Promotion - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-14
**Phase:** 34-production-dashboard-ui-and-homepage-promotion
**Areas discussed:** Component reuse vs new dashboard, Order details panel UX, Transition + block flow UX, Bulk import surface + import history, Wrap-up (blocked band / refresh chip / sidebar / suspense / search)

---

## Area Selection

| Option | Description | Selected |
|--------|-------------|----------|
| Component reuse vs new dashboard | Refactor existing MillProductionUI vs build new vs share primitives | ✓ |
| Order details panel UX | Drawer vs modal vs route vs in-place expansion | ✓ |
| Transition + block flow UX | Button placement and block reason capture | ✓ |
| Bulk import surface + import history | /import route vs modal vs inline | ✓ |

**User's choice:** All four areas selected.
**Notes:** Phase carries forward a large amount of Phase 31–33 context; gray areas focused on UX decisions only.

---

## Area 1: Component reuse vs new dashboard

### Q1: How should we handle the existing MillProductionUI component when building the production dashboard at /?

| Option | Description | Selected |
|--------|-------------|----------|
| Build a new ProductionDashboard, leave demo alone | /demo/mill-production keeps mock-backed MillProductionUI as frozen v1.1 design demo. Phase 34 creates fresh ProductionDashboard.tsx typed on DB ProductionOrder, with nuqs filters, transition buttons, details panel, polling. Intentional divergence. | ✓ |
| Refactor MillProductionUI to accept DB type, share between routes | One component renders both; bridge DemoOrder ↔ ProductionOrder. /demo/mill-production becomes thinner. Filter logic still needs nuqs (asymmetric or both routes URL-sync). | |
| Extract shared primitives (Column, Card, StateSection), build separate top-level components | Keep MillProductionUI for demo, build ProductionDashboard for /. Pull primitives into ui/ as type-generic. Top-level orchestration per route. | |

**User's choice:** Build new ProductionDashboard, leave demo alone.
**Notes:** Decision captured as D-01. Visual contract is shared (via mill-production.pen + UI-SPEC.md); code is intentionally diverged. FilterPill and StatusBadge are still reused as-is (D-03).

### Q2: URL parameter shape for filters and search — what's the right contract for shareable URLs?

| Option | Description | Selected |
|--------|-------------|----------|
| Comma-separated for status, plain string for q | ?status=Pending,Mixing&q=acme — short, readable. Empty = all visible. nuqs parseAsArrayOf(parseAsStringLiteral). | ✓ |
| Repeated keys for status, plain string for q | ?status=Pending&status=Mixing&q=acme — closer to HTML form encoding but uglier URLs. | |
| Single status per URL (no multi-select), plain string for q | Conflicts with PROD-03 multi-select. NOT recommended. | |

**User's choice:** Comma-separated for status, plain string for q.
**Notes:** Decision captured as D-04, D-05. Trim + lowercase q before applying. Case-insensitive match.

---

## Area 2: Order details panel UX

### Q1: How should the order details panel surface when an operator clicks a card?

| Option | Description | Selected |
|--------|-------------|----------|
| Right-side drawer / slide-over | Slides in from right, board stays visible. Click outside or X to close. Order ID synced to URL via nuqs (?order=ord_123). Matches Linear/Notion patterns. | ✓ |
| Modal overlay (centered dialog) | Full-attention modal blocks the board. Better for focus, worse for browsing while inspecting. | |
| Dedicated route /orders/[id] | Full-page detail view. Cleanest deep-linking but context shift loses board glance. | |
| Inline expanding card (in-column) | Card expands in place to show fields + timeline. Awkward with long timelines in dense board. | |

**User's choice:** Right-side drawer / slide-over.
**Notes:** Decision captured as D-08. Outside-click / ESC / drawer-X all clear ?order= from URL.

### Q2: Where should the drawer's data fetching happen?

| Option | Description | Selected |
|--------|-------------|----------|
| RSC fetches both list + drawer data when ?order= is present | Page RSC reads searchParams.order, calls getOrderById + getOrderEvents in parallel. Drawer renders as server component. Deep-link works on first paint. revalidateTag invalidates both. | ✓ |
| Drawer is client-side, fetches via server action on open | Click handler triggers fetchOrderDetails action. Loading skeleton inside drawer. Simpler RSC but adds latency. | |
| Hybrid: RSC pre-fetches list with embedded events | getProductionOrders returns orders WITH events array. Large payload on every poll — wasteful. | |

**User's choice:** RSC fetches both list + drawer data when ?order= is present.
**Notes:** Decision captured as D-09. Two-tier server-then-client pattern: drawer is a server component that renders a client `<TransitionButtons />` child (planner picks server-vs-client split inside drawer).

---

## Area 3: Transition + block flow UX

### Q1: Where should the transition action buttons (Start Mixing / Complete / Block / Resume) live?

| Option | Description | Selected |
|--------|-------------|----------|
| Inside the drawer only | Operator clicks card → drawer opens → sees full context + transition buttons. Forces deliberate flow. Two-click cost. | ✓ |
| On the card AND in the drawer | Quick transitions from card (one click); drawer for deeper context. Risk: busy card, accidental Complete. | |
| On the card only | All transitions inline on card; drawer is read-only context. Fastest but most error-prone. | |

**User's choice:** Inside the drawer only.
**Notes:** Decision captured as D-10. Two-click cost is intentional — read context before changing irreversible state.

### Q2: How should the required block reason be captured?

| Option | Description | Selected |
|--------|-------------|----------|
| Modal dialog with required textarea | Click Block → modal opens → operator must type → Confirm calls blockOrder. Empty disables Confirm. Matches Phase 33 D-X recommendation. | ✓ |
| Inline form inside the drawer (no modal) | Block button reveals textarea + Confirm/Cancel inline. No modal stacking. Drawback: inconsistent with card-only flow if buttons exist on cards. | |
| Two-step: Block button → inline reason field with explicit Confirm | Same as inline but works in-card if buttons are on cards too. Awkward when reason is multi-line. | |

**User's choice:** Modal dialog with required textarea.
**Notes:** Decision captured as D-13. Modal stacks on top of drawer; modal close does NOT close drawer.

### Q3: How should resume-from-Blocked target state and Complete-confirmation work?

| Option | Description | Selected |
|--------|-------------|----------|
| Resume = split button (Mixing | Pending); Complete = single click, no confirm | Primary resumes to Mixing; secondary action / dropdown chevron offers Resume to Pending. Complete single-click because audit trail captures it. | ✓ |
| Resume = always Mixing (single button); Complete = confirm modal | Loses functionality: no path to Blocked→Pending. | |
| Both transitions show a confirm modal | Maximum safety; slower workflow. Defensible for early users. | |

**User's choice:** Resume = split button; Complete = single click, no confirm.
**Notes:** Decisions captured as D-11 (Complete) and D-12 (Resume).

---

## Area 4: Bulk import surface + import history

### Q1: Where should the bulk import flow be initiated?

| Option | Description | Selected |
|--------|-------------|----------|
| Dedicated /import route, linked from header button + sidebar | Header button navigates to /import. Sidebar adds 'Import' under PRODUCTION. Full-page experience. Deep-linkable, share-able, easy to bookmark. | ✓ |
| Modal/drawer triggered from a header button | 'Import Orders' opens a wide modal. Stays in dashboard context. Cramped for preview tables; browser back doesn't dismiss. | |
| Inline on the dashboard | Dropdown reveals drop zone, preview appears below board. Competes with board for real estate. | |

**User's choice:** Dedicated /import route, linked from header button + sidebar.
**Notes:** Decision captured as D-15.

### Q2: Where should the import history log surface live?

| Option | Description | Selected |
|--------|-------------|----------|
| On the /import page (sidebar or bottom-of-page table) | Tightly coupled to import flow. Updates in place after commit. Columns: file_name, row_count, imported_by, imported_at. No dashboard pollution. | ✓ |
| Footer of production dashboard | 'Recent imports' chip with link to /import. Trade-off: low-info chip + click-through. | |
| Tab in /settings | Hides from operational view. Lower visibility. | |

**User's choice:** On the /import page.
**Notes:** Decision captured as D-16. Cross-action revalidateTag('import-batches') patch required in src/actions/import.ts (D-21).

---

## Wrap-up: Blocked band, refresh chip, sidebar nav, plus three extras

### Q1: Where should the blocked alert band live, and what's its click behavior (PROD-06)?

| Option | Description | Selected |
|--------|-------------|----------|
| Sticky top-of-board band, always visible if any blocked orders exist | Pinned above 3 columns. Lists every blocked order. Click entry → opens that order's drawer. Hidden when zero blocked. Persists on scroll. | ✓ |
| Top of each column (per-mill-line blocked) | Per-column band. Misses cross-mill aggregation; conflicts with PROD-06 "aggregates all" wording. | |
| Bottom-of-page fixed bar | Sticky bottom, less visible. | |

**User's choice:** Sticky top-of-board band.
**Notes:** Decision captured as D-22.

### Q2: Where should the last-updated timestamp and manual refresh control live (PROD-11)?

| Option | Description | Selected |
|--------|-------------|----------|
| Top-right of board header strip, above the columns | 'Updated 12s ago' relative timestamp + refresh icon. Click → router.refresh() + spinner. Updates client-side every 5s. | ✓ |
| Footer status bar | Bottom of page, less visible. Frees header. | |
| Inside each column header | All columns refresh together — per-column timestamps lie. | |

**User's choice:** Top-right of board header strip.
**Notes:** Decision captured as D-20.

### Q3: What should the production sidebar nav show beyond 'Dashboard' and 'Import' (PROD criteria §5)?

| Option | Description | Selected |
|--------|-------------|----------|
| Dashboard (/) + Import (/import) only | Two items under PRODUCTION. Matches v2.0 scope. KPI items land in Phase 35. | ✓ |
| Dashboard + Import + 'Import History' as separate item | Conflicts with bundling history on /import. | |
| Just Dashboard for now; Import via header button only | Tighter sidebar; reduces discoverability. | |

**User's choice:** Dashboard + Import only.
**Notes:** Decision captured as D-24. 'Coming Soon' item removed from production branch.

### Q4: Anything else to lock for Phase 34? (multi-select)

| Option | Description | Selected |
|--------|-------------|----------|
| Run /gsd-ui-phase 34 to lock visual specifics from mill-production.pen | UI-SPEC.md captures component placement, spacing, typography, etc. | ✓ |
| Lock loading-skeleton strategy: <Suspense> per column, not whole-page | Wrap each MillColumn in <Suspense fallback={<ColumnSkeleton/>}> so per-column streaming is independent. | ✓ |
| Lock search: case-insensitive substring on customer + product, client-side post-fetch | Avoids server-side ILIKE complexity, instant feel, fine at v2.0 row volumes. | ✓ |
| Nothing else — write CONTEXT.md now | | |

**User's choice:** All three additional locks (UI-phase next, Suspense per column, client-side search).
**Notes:** Decisions captured as D-23 (Suspense per column) and D-07 (client-side search). UI-phase noted as next step in confirm_creation.

---

## Claude's Discretion

Items where Phase 34's planner has flexibility (captured in CONTEXT.md `<decisions> ### Claude's Discretion`):

- Drawer width and exact visual placement of transition buttons inside the drawer (UI-SPEC.md decides).
- Exact location of the "Import Orders" header button on the dashboard (UI-SPEC.md decides).
- Number of import-history rows shown on /import (recommend 10 most recent).
- Whether the import drop zone supports drag-drop in addition to file picker (recommend both).
- Visual treatment for next-up indicator and in-progress badge (UI-SPEC.md decides).
- Search debounce window (recommend 150ms client-side).
- Whether to bundle the cross-action `revalidateTag('import-batches')` patch into `src/actions/import.ts` as part of Phase 34's plan (recommended yes).
- Whether `MillReadOnlyStub.tsx` is deleted now or only the import is removed (recommend full delete after grep verification).
- `users` table lazy-sync (DATA-05 deferred from Phase 33) — recommend rendering Clerk user ID for v2.0; defer display-name lookup until visually required.

---

## Deferred Ideas

(All captured in CONTEXT.md `<deferred>`)

- Optimistic UI on transitions (PROD-FUT-01) — v2.1+
- "New orders available" banner triggered by polling diff (PROD-FUT-02) — v2.1+
- Server-side search via DB ILIKE — defer until row count justifies it
- Batch "set all duplicates to X" toggle in import preview — v2.1+
- `users` table lazy-sync (DATA-05) — Phase 34 renders Clerk user ID directly
- Mill line reassignment UI (carried from Phase 33 D-16) — v2.1+
- Drill-down into a batch's row-level outcomes from import history — v2.1+
- i18n / translation of locked strings — deferred indefinitely
- KPI cards and metrics (KPI-01..KPI-08) — Phase 35
- Drawer keyboard shortcuts (arrow keys) — ESC locked, arrows deferred
- Undo last transition (TRANS-FUT-01) — v2.1+

---

*Phase: 34-production-dashboard-ui-and-homepage-promotion*
*Discussion logged: 2026-05-14*
