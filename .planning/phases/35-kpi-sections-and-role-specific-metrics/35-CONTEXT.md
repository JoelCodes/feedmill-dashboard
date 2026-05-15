# Phase 35: KPI Sections and Role-Specific Metrics - Context

**Gathered:** 2026-05-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Compute and surface eight KPI requirements (KPI-01..KPI-08) as DB-driven, server-aggregated sections wired into the existing `ProductionDashboard` shell from Phase 34. Closes the v1.0 KPI deferral and the eight unsatisfied requirements blocking v2.0 milestone completion. No new top-level route — the dashboard at `/` gains a top KPI strip, per-column header strips inside each `MillColumn`, and a full-width section below the columns for the 7-day trend chart and the cross-column exception list. No client-side business math: all percentages, sums, and dwell-time comparisons run in SQL.

**In scope:**
- **NEW** `src/db/queries/kpis.ts` (or co-located in `orders.ts`) — server-only aggregation queries returning the KPI payloads. All queries `unstable_cache`-wrapped with tag `'production-orders'` so the existing `revalidateTag` invariant from Phase 33 invalidates KPIs alongside the order list. Browser timezone passed in as an IANA string parameter (see D-01 / D-02).
- **NEW** `src/components/KpiCard.tsx` — fresh primitive built on the existing `Card` component. Generic shape (`label`, `value`, `unit`, optional `subValue`/`footnote`). Replaces the demo-era `src/components/KPICard.tsx` (deleted in this phase — verify no other imports first via `grep -rn KPICard src/`).
- **NEW** `src/components/KpiStrip.tsx` — top-of-dashboard horizontal strip rendering KPI-01, KPI-02 (per-line breakdowns inline within or adjacent to KPI-01), KPI-04 pending backlog, and KPI-05 formula mix. Slots into `ProductionDashboard.tsx` ABOVE the filter pills.
- **EDIT** `src/components/MillColumn.tsx` — extend the column header to include KPI-03's per-column summary (order count + completed-lbs / total-lbs ratio). The MillColumn header today renders the column name and a count badge — the strip augments rather than replaces. Server passes the aggregates as props alongside the existing orders array.
- **NEW** `src/components/SevenDayTrendChart.tsx` — hand-rolled SVG bar chart (no chart library installed). 7 bars sized by daily completed-lbs, with axis labels. Empty-state when fewer than 7 days of data exist ("Not enough data yet" — locked by KPI-06 spec).
- **NEW** `src/components/BlockedExceptionList.tsx` — cross-column exception list of blocked orders, sortable by dwell time. Distinct from Phase 34's `BlockedAlertBand` (sticky at the top, terse) — this is a richer table at the bottom of the dashboard. Click row → opens the drawer via `?order=` (reuses Phase 34's nuqs URL state pattern).
- **NEW** `src/components/KpiSection.tsx` (or inline) — full-width container below the 3 columns hosting `SevenDayTrendChart` + `BlockedExceptionList` side-by-side or stacked (UI-SPEC decides exact arrangement).
- **EDIT** `src/db/schema/orders.ts` — add `earlyDeliveryDate: date('early_delivery_date')` nullable column. Generate Drizzle migration via `drizzle-kit generate`. Apply via `drizzle-kit migrate` against dev Neon DB.
- **EDIT** `src/actions/import.ts` + `src/lib/import-schema.ts` (productionOrderImportSchema) — extend Zod schema and import parser to map a new Book1.xlsx column to `early_delivery_date`. Planner confirms the exact source column name and date format during research (likely "Early Delivery Date" or similar; planner reads `example-data/Book1.xlsx` to verify).
- **EDIT** `src/db/seed.ts` + `src/db/seed-data.json` — backfill synthetic `early_delivery_date` values for the existing 33 seeded rows so KPI-08 has visible data in dev/demo environments. Spread across `today ±5 days` so some rows trigger the overdue badge and some don't.
- **NEW** `src/lib/formula-mix.ts` (or in `production-derivations.ts`) — pure mapping function `bucketTexture(raw: string | null): 'Pellet' | 'Mash' | 'Crumble' | null` implementing the locked bucket rules in D-08. Used SERVER-SIDE inside the aggregation query — not in the UI.
- **NEW** `src/lib/timezone.ts` (or extend existing utility) — server-side reader that returns the operator's IANA timezone for the current request. Source: a `tz` cookie set by a client-side bootstrap on first render (planner picks the bootstrap mechanism — likely a tiny client component that reads `Intl.DateTimeFormat().resolvedOptions().timeZone` and writes the cookie). Default fallback: `'America/Chicago'`.
- **EDIT** `src/components/ProductionDashboard.tsx` — slot the new `KpiStrip` above the filter pills, and the new `KpiSection` below the columns. Server-aggregated KPI props flow in from `src/app/page.tsx` and refresh on every `router.refresh()` via the existing `useProductionPolling` hook (no separate KPI polling).
- **EDIT** `src/app/page.tsx` — extend the parallel `Promise.all` to call the new KPI queries alongside `getProductionOrders` / `getOrderById` / `getOrderEvents`. Reads the `tz` cookie and passes the IANA string into each KPI query.

**Out of scope (deferred to later phases or future iterations):**
- Drill-down from a KPI card into the order list (e.g., "click KPI-04 pending backlog → filter board to Pending") — KPI-FUT-09 (new deferred item; this phase ships read-only displays).
- Week-over-week throughput delta (KPI-FUT-04) — requires sustained data accumulation.
- Bottleneck heatmap (KPI-FUT-05).
- Manager exception inbox / supervisor escalation flag (KPI-FUT-08).
- Custom date-range KPI views — fixed windows (today, 7-day) cover the spec; custom ranges are explicit Out of Scope in REQUIREMENTS.md.
- Tooltips/animations on the 7-day trend chart — hand-rolled SVG ships static; visual polish deferred until operator feedback demands it.
- Replacing or merging Phase 34's `BlockedAlertBand` with KPI-07's exception list — they serve different roles (sticky top alert vs. sortable bottom table). Both remain.
- Pixel-level visual specifics — locked separately via `/gsd:ui-phase 35` from `designs/mill-production.pen`.

</domain>

<decisions>
## Implementation Decisions

### Daily window & time math

- **D-01: "Today" = operator's browser timezone.** All daily aggregates (KPI-01 mill-wide tons today, KPI-02 per-line tons today, KPI-05 formula mix today) use the calendar day in the operator's IANA timezone, not UTC and not a hard-coded `America/Chicago`. Operators in different timezones (e.g., a remote manager checking from outside the mill's region) each see their own local "today" — consistent with browser-local-time conventions in modern web apps.
- **D-02: Browser TZ propagated to the server via a `tz` cookie set on first render.** Pattern: a tiny client component in the layout (or in `ProductionDashboard.tsx`) reads `Intl.DateTimeFormat().resolvedOptions().timeZone` and writes the value to a non-HTTPOnly cookie. The RSC page reads `cookies().get('tz')?.value` and passes the IANA string into each KPI query. Default fallback when cookie absent: `'America/Chicago'` (matches the mill's physical location). KPI queries compose this into SQL as `date_trunc('day', updated_at AT TIME ZONE $tz)`. Planner picks the exact bootstrap component (or fold into an existing client provider if one exists at the layout level).
- **D-03: Dwell time = `now() − MAX(changed_at)` for the most-recent Block event.** SQL skeleton: `SELECT order_id, NOW() - MAX(changed_at) AS dwell FROM order_events WHERE to_state = 'Blocked' GROUP BY order_id`. Resets on Resume → re-Block (intentional — the operator's mental model is "how long has this order been blocked THIS time"). Indexed read; cheap. Display formatting (e.g., "2h 14m") is a UI concern, locked via UI-SPEC.

### early_delivery_date schema + sourcing

- **D-04: Add a real `early_delivery_date date` (nullable) column** to `production_orders` via a Drizzle migration. Nullable so future imports without the column don't fail; nullable so existing pre-migration rows survive. KPI-08 query: `WHERE early_delivery_date IS NOT NULL AND early_delivery_date < CURRENT_DATE AND state != 'Completed'`. The badge renders only when `early_delivery_date` is populated and the order is overdue and active.
- **D-05: Date source = a new Book1.xlsx column** mapped through the import parser. Planner reads `example-data/Book1.xlsx` during research to confirm the exact column header name (likely "Early Delivery Date" or operator-domain equivalent) and date format. The import parser (Zod schema in `productionOrderImportSchema`) gains a new optional field; row-level validation rejects malformed dates with a clear message. Manual-entry UI in the drawer is deferred to v2.1+ if operators want to edit the date post-import.
- **D-06: Backfill synthetic dates for the 33 existing seeded orders** in `src/db/seed-data.json` + the `seed.ts` runtime. Spread the dates across `today ±5 days` deterministically (e.g., based on row index modulo 11 offset) so some seeded orders are overdue, some are today, and some are upcoming. This guarantees KPI-08 has visible data in dev/demo environments and lets the badge visually validate in the UI without manual data entry. Column stays **nullable in schema** (D-04) even though all seed rows are populated; future real imports may have rows without the column.

### KPI layout & component reuse

- **D-07: Three-zone layout** within `ProductionDashboard.tsx`:
  1. **Top** — `KpiStrip` row above the filter pills: KPI-01 (mill-wide tons today), KPI-02 (per-line tons today, rendered as 3 sub-cards or inline under KPI-01), KPI-04 (pending backlog count + total weight), KPI-05 (formula mix percentages).
  2. **Per-column** — each `MillColumn` header is extended with KPI-03 (order count + completed-lbs / total-lbs). The existing column-name header stays; the KPI-03 strip lives inline with or just below it.
  3. **Bottom** — a `KpiSection` full-width container below the 3 columns hosting `SevenDayTrendChart` (KPI-06) on one side and `BlockedExceptionList` (KPI-07) on the other (or stacked — UI-SPEC decides).
- **D-08: Delete `src/components/KPICard.tsx`** (the demo-era static component with hard-coded mock data). Build a fresh `KpiCard.tsx` primitive on the existing `Card` component with a generic prop shape (`label`, `value`, `unit?`, `subValue?`, `footnote?`). Cleanest path — the old component is tied to mock data shape and isn't used by `ProductionDashboard.tsx`. Verify no other files import it before delete (`grep -rn 'KPICard' src/` — expect zero matches outside the file itself).
- **D-09: KPI-03 per-column strip extends MillColumn's existing header** rather than introducing a new row above the columns. Co-locates summary with detail. Server passes a `{ orderCount, completedLbs, totalLbs }` aggregate as props to each column alongside the existing orders array. Planner decides exact prop shape (single `summary` object vs. flat props).
- **D-10: `BlockedExceptionList` (KPI-07) is distinct from Phase 34's `BlockedAlertBand`** and coexists with it. The alert band stays sticky at the top of the board (terse, click-to-jump). The exception list is a richer sortable table at the bottom that adds dwell-time sorting and (when KPI-08 fires) the early-delivery warning badge. Both surfaces are read-only; clicking a row in either opens the drawer via `?order=<id>`.

### Formula mix bucketing (KPI-05)

- **D-11: Texture-type bucketing rule** (lives in a pure helper, `src/lib/formula-mix.ts` or `production-derivations.ts`):
  - `'PELLET' | 'SH PELLET' → 'Pellet'`
  - `'MASH' → 'Mash'`
  - `'FINE CR' | 'C. CRUMBLE' → 'Crumble'`
  - `NULL` or unrecognized → `null` (excluded — see D-12)
  - Comparisons are **case-sensitive on the canonical uppercase form** the DB stores. Any future raw value not in this list is treated as `null` until the mapping is updated explicitly.
- **D-12: NULL (and unrecognized) `texture_type` excluded from numerator AND denominator** in KPI-05 percentages. The displayed percentages always sum to 100% over the categorized population. If `NULL` count is non-zero, the card surfaces a small footnote ("N orders uncategorized") so the operator knows the denominator excludes some orders. SQL: `COUNT(*) FILTER (WHERE bucket = 'Pellet') * 100.0 / NULLIF(COUNT(*) FILTER (WHERE bucket IS NOT NULL), 0)` with `bucket` derived via a CASE expression mirroring D-11.

### KPI-06 7-day trend chart implementation

- **D-13: Hand-rolled inline SVG** for the 7-day trend chart. No new chart-library dependency. Component: `SevenDayTrendChart.tsx` receives an array of `{ date: string; completedLbs: number }` (length 0..7) and renders an SVG of bars + axis labels. Empty state ("Not enough data yet") when array length < 7. Matches the lean-deps posture from `.planning/research/v2.0/STACK.md` ("What NOT to Add"). Tooltips/animation deferred — if operator feedback later demands richer interactivity, swap in `recharts` or `visx` in a v2.1+ phase.

### Caching, polling, and freshness

- **D-14: KPI queries share the `'production-orders'` cache tag** with `getProductionOrders` / `getOrderEvents` (Phase 33/34). Every mutating action (`transitionToMixing`, `completeOrder`, `blockOrder`, `resumeFromBlocked`, `commitImportAction`) already calls `revalidateTag('production-orders')` — KPIs invalidate alongside the order list automatically, with no new tag and no additions to action invalidation lists. Reduces cross-phase contract risk (parallels the D-21 patch from Phase 34 — but in the opposite direction: Phase 35 adopts the existing tag rather than introducing a new one).
- **D-15: KPI data refresh piggybacks on the existing `useProductionPolling` hook** (30s `router.refresh()` from Phase 34 D-19). KPI props flow through the RSC render path; on every `router.refresh()` the page re-runs the parallel KPI query batch and re-renders the strip + column headers + bottom section. No separate KPI polling, no client-side aggregation. KPI Suspense boundaries (D-16) handle the per-section streaming.
- **D-16: Per-zone `<Suspense>` boundaries.** The top KPI strip is wrapped in a single `<Suspense fallback={<KpiStripSkeleton />}>`. The bottom `KpiSection` is wrapped in `<Suspense fallback={<KpiSectionSkeleton />}>`. Per-column KPI-03 reuses the existing per-column `<Suspense>` boundary from Phase 34 D-23 (the column-level skeleton extends to include the header strip placeholder). This keeps streaming independent — a slow KPI query doesn't block the order columns from rendering.

### Auth & read-only mode

- **D-17: All KPI surfaces are read-only and visible to any authenticated user.** No `canEdit` gating — the KPIs display state, not actions. Carries forward Phase 31 D-02 (`/` is auth-only, no page-level `mill_operator` gate) and Phase 34 D-25 (read-only viewers see the full board). Click-through from `BlockedExceptionList` to the drawer follows the same `canEdit` pattern as the rest of the dashboard — non-operators see the drawer with transition buttons hidden.

### Claude's Discretion

- **Exact source column name in Book1.xlsx for `early_delivery_date`** — planner reads `example-data/Book1.xlsx` during research and locks the column header. Likely "Early Delivery Date" or a domain-equivalent header.
- **Date format in the spreadsheet** — planner inspects (likely `YYYY-MM-DD` or `M/D/YY` Excel date serial); Zod schema in `productionOrderImportSchema` uses `read-excel-file`'s date-cell handling.
- **Exact arrangement of `SevenDayTrendChart` and `BlockedExceptionList` within the bottom `KpiSection`** (side-by-side vs. stacked, widths, ordering) — UI-SPEC decides.
- **Visual treatment of the overdue badge for KPI-08** — UI-SPEC decides; reuse existing `StatusBadge` variant or introduce a new "warning" badge.
- **Exact bootstrap mechanism for the `tz` cookie** — planner picks: (a) a tiny `<TzBootstrap />` client component in the root layout, (b) a `useEffect` in the existing client provider, or (c) reading the cookie on the API side and falling back gracefully. Recommend (a).
- **Whether KPI-02 per-line tons render as 3 separate sub-cards or as inline values inside the KPI-01 mill-wide card** — UI-SPEC decides based on `mill-production.pen` and visual hierarchy.
- **Whether the KPI-03 column-header strip wraps to two lines on narrow viewports** — UI-SPEC + responsiveness testing.
- **Footnote text for "N orders uncategorized" in KPI-05** — UI-SPEC picks the exact copy; recommend "N uncategorized" or "Excludes N uncategorized orders".
- **Whether `BlockedExceptionList` ships with sortable headers in v2.0 or only with default sort-by-dwell-time** — KPI-07 says "sortable by dwell time" specifically; planner can ship single-sort default and defer column-header click-to-sort UX if it adds complexity.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project planning (LOCKED requirements + roadmap)
- `.planning/ROADMAP.md` — Phase 35 entry: goal (computed KPI cards aggregated server-side) + 5 success criteria. SC#1 (mill-wide + per-line tons today), SC#2 (per-column header strip with order count + lbs ratio), SC#3 (pending backlog card + formula mix breakdown), SC#4 (7-day trend with empty-state below 7 days), SC#5 (cross-column exception list sortable by dwell time + early-delivery warning badge).
- `.planning/REQUIREMENTS.md` — v2.0 requirements KPI-01..KPI-08 are this phase's scope. AUTH-*, DATA-*, TRANS-*, IMPORT-*, PROD-* are Phases 31–34 (referenced for type shapes, action signatures, and read patterns).
- `.planning/PROJECT.md` — v2.0 milestone context and Out of Scope list (no custom report builder, no predictive analytics, no multi-mill comparison).
- `.planning/STATE.md` — v2.0 implementation notes (cache tag `'production-orders'` invariant, polling cadence locked at 30s).
- `.planning/v2.0-MILESTONE-AUDIT.md` — section "What Phase 35 Needs" explicitly enumerates the server-side aggregation discipline and the component list driving D-07.

### Phase carry-forward (do not relitigate)
- `.planning/phases/34-production-dashboard-ui-and-homepage-promotion/34-CONTEXT.md` — Phase 34 decisions D-01..D-26. KEY for Phase 35: D-19 (30s polling cadence — reused by D-15); D-21 (cache-tag invariant `'production-orders'` — reused by D-14); D-23 (per-column `<Suspense>` boundaries — extended by D-16); D-25 (read-only mode — extended by D-17).
- `.planning/phases/33-server-actions-queries-and-bulk-import/33-CONTEXT.md` — Phase 33 D-01..D-21. KEY for Phase 35: action signatures + `revalidateTag('production-orders')` invariant + the import-parser surface that Phase 35 extends to handle `early_delivery_date`.
- `.planning/phases/32-schema-migrations-and-seed-data/32-CONTEXT.md` — Phase 32 schema decisions. KEY for Phase 35: D-04 (canonical `ProductionOrder` type from Drizzle `$inferSelect`), D-11 (`version` column for optimistic concurrency — irrelevant here, KPIs don't write), D-12 (`numeric(10,2)` for weight returns TS `string` — sum in SQL not JS; `texture_type`/`line_code` are NULLABLE — drives D-12 bucketing rule).
- `.planning/phases/31-role-expansion-and-db-infrastructure/31-CONTEXT.md` — Phase 31 auth pattern. KEY for Phase 35: D-02 (`/` is auth-only, no page-level role gate — reused by D-17), D-03 (server-computed `canEdit` flag — reused for drawer behavior on KPI-07 click-through).

### Research (drives v2.0 implementation decisions)
- `.planning/research/v2.0/ARCHITECTURE.md` — server-side aggregation discipline; cache-tag pattern; URL state via `nuqs`.
- `.planning/research/v2.0/STACK.md` — "What NOT to Add" list (no `xlsx`, no `@vercel/postgres`, no chart library by default). Drives D-13 (hand-rolled SVG).
- `.planning/research/v2.0/PITFALLS.md` — Edge driver leak rules; Phase 35 pages/RSC must NOT use `export const runtime = 'edge'`.
- `.planning/research/v2.0/FEATURES.md` — KPI-FUT-* deferred items (week-over-week delta, bottleneck heatmap, exception inbox, etc.). Phase 35 must NOT bake in shapes that block these.

### Code (existing patterns Phase 35 must align with)
- `src/app/page.tsx` — Phase 34 RSC. **Extends** in Phase 35 to fetch KPI payloads in parallel via `Promise.all` and pass them into `<ProductionDashboard kpis={...} ... />`. Reads the `tz` cookie via `cookies()` and passes the IANA string into each KPI query.
- `src/components/ProductionDashboard.tsx` — Phase 34 client wrapper. **Extends** to slot `<KpiStrip kpis={...} />` above the filter pills and `<KpiSection trendData={...} exceptions={...} />` below the columns. No state changes — KPIs are pass-through props.
- `src/components/MillColumn.tsx` — Phase 34 component. **Extends** the header to render the KPI-03 column-summary strip. Receives a `summary={{ orderCount, completedLbs, totalLbs }}` prop alongside the existing orders.
- `src/components/BlockedAlertBand.tsx` — Phase 34. Unchanged by Phase 35; coexists with `BlockedExceptionList` (D-10).
- `src/components/ui/Card.tsx` — design system primitive. Used by the new `KpiCard.tsx` (D-08).
- `src/components/KPICard.tsx` — **DELETE** (D-08). Demo-era static component; verify no other imports via `grep -rn 'KPICard' src/` before delete.
- `src/components/ColumnSkeleton.tsx`, `src/components/DrawerSkeleton.tsx` — Phase 34 skeletons. Phase 35 adds `KpiStripSkeleton` and `KpiSectionSkeleton` siblings (or co-locates inside the new components).
- `src/db/queries/orders.ts` — Phase 33 query layer with `unstable_cache` + tag `'production-orders'`. New KPI queries follow the SAME pattern (D-14).
- `src/db/queries/events.ts` — Phase 33. KPI-07 dwell-time query reads `order_events` (D-03).
- `src/db/schema/orders.ts` — **EDIT** in Phase 35 to add `earlyDeliveryDate: date('early_delivery_date')` nullable column (D-04). Drizzle migration generated and applied via the project's existing `drizzle-kit generate` + `drizzle-kit migrate` discipline (Phase 32 D-06).
- `src/db/seed-data.json` + `src/db/seed.ts` — **EDIT** in Phase 35 to backfill synthetic `early_delivery_date` values for the 33 seeded orders (D-06).
- `src/actions/import.ts` + `src/lib/import-schema.ts` — **EDIT** in Phase 35 to parse the new Book1.xlsx column for `early_delivery_date` (D-05). Zod schema gains an optional `early_delivery_date` field; preview + commit paths persist it. Cache invalidation already in place via existing `revalidateTag('production-orders')` (D-14).
- `src/lib/production-derivations.ts` — Phase 34 pure helpers. **Extends or new sibling file `src/lib/formula-mix.ts`** for the texture bucketing function (D-11). Pure, TDD-friendly.
- `src/hooks/useProductionPolling.ts` — Phase 34 polling hook. **Reused as-is** by Phase 35 (D-15). KPI refresh piggybacks on the existing 30s cadence.
- `src/lib/auth.ts` — `requireRole` / `checkRole` utilities from Phase 31. KPIs are read-only; no role gating needed (D-17).
- `next.config.ts` — `serverActions.bodySizeLimit` from Phase 33. Unchanged by Phase 35.
- `package.json` — no new dependencies (D-13). Chart is hand-rolled SVG.

### Security and discipline (LOCKED, do not relitigate)
- `docs/security-patterns.md` — §2 inner-guard pattern: server actions enforce `requireRole`; pages enforce auth-only via `auth()` + redirect. Phase 35 has no actions (KPIs are read-only); the page-level auth-only gate already in place from Phase 31/34 carries forward.
- `docs/clerk-setup.md` — `mill_operator` runbook. No Phase 35 changes — KPI surfaces are visible to any authenticated user.

### External docs (referenced during planning/implementation)
- Postgres `AT TIME ZONE` semantics: https://www.postgresql.org/docs/current/functions-datetime.html — confirm `date_trunc('day', updated_at AT TIME ZONE 'America/Chicago')` returns a TZ-aware boundary suitable for `WHERE` predicates.
- Drizzle `date()` column type: https://orm.drizzle.team/docs/column-types/pg#date — verify the inferred TS type for the nullable date column (likely `Date | null` or `string | null` depending on `mode` config).
- `read-excel-file` schema typing for date cells: https://www.npmjs.com/package/read-excel-file — confirm date-cell parsing behavior for the new `early_delivery_date` column.
- Next.js 16 `cookies()` for reading the `tz` cookie in RSC: https://nextjs.org/docs/app/api-reference/functions/cookies — confirm the `cookies()` API shape and any caveats around `force-dynamic`.

### Design source of truth
- `designs/mill-production.pen` — visual contract for the KPI strip, column-header strip, trend chart, and exception list. UI-SPEC.md (via `/gsd:ui-phase 35`) locks pixel-level placement and component styling.
- `example-data/Book1.xlsx` — source of truth for the new `early_delivery_date` column header name and date format. Planner reads during research (D-05).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`Card` primitive** (`src/components/ui/Card.tsx`) — base for the new `KpiCard.tsx` (D-08).
- **`StatusBadge`** (`src/components/ui/StatusBadge.tsx`) — reusable for the KPI-08 overdue badge if its variant set covers a "warning" treatment; otherwise the planner extends it.
- **`useProductionPolling`** (`src/hooks/useProductionPolling.ts`) — Phase 34 30s polling hook. Phase 35 KPI data refreshes through the same `router.refresh()` cadence (D-15) without any new hook.
- **`getProductionOrders` / `getOrderEvents`** (`src/db/queries/`) — Phase 33 query layer with `unstable_cache` + tag `'production-orders'`. New KPI queries follow the same pattern (D-14).
- **Phase 34 layout shell** (`src/components/ProductionDashboard.tsx`) — host for the new top strip and bottom section (D-07).
- **`MillColumn`** (`src/components/MillColumn.tsx`) — column wrapper with existing header that Phase 35 extends with KPI-03 (D-09).
- **`BlockedAlertBand`** (`src/components/BlockedAlertBand.tsx`) — Phase 34 sticky alert. Coexists with KPI-07 `BlockedExceptionList` (D-10).
- **`production-derivations`** (`src/lib/production-derivations.ts`) — Phase 34 pure helpers. Natural home (or sibling) for the formula-mix bucketing function (D-11).

### Established Patterns
- **Server-side aggregation, no client-side business math** — REQUIREMENTS.md / ROADMAP SC + Phase 31–34 discipline. All sums, percentages, and dwell-time comparisons run in SQL with `unstable_cache` wrappers.
- **Cache tag invariant `'production-orders'`** — mutating actions invalidate; queries piggyback. Phase 35 adopts the existing tag for all KPI queries (D-14) instead of introducing a new tag.
- **Async RSC + extracted client wrapper** — `src/app/page.tsx` (RSC) fetches data and renders `<ProductionDashboard ...>` (client). Phase 35 extends both ends — adds KPI queries server-side, adds KPI components client-side.
- **`<Suspense>` boundaries for streaming** — per-column (Phase 34 D-23), per-drawer. Phase 35 adds per-zone boundaries for the top strip and bottom section (D-16).
- **Optimistic-concurrency NOT applicable** — KPI surfaces are read-only; the optimistic-concurrency invariant from Phase 33 doesn't apply.
- **`numeric` → TS `string` boundary** — weight aggregation must happen in SQL (`SUM(weight_lbs)`) not in JS. UI receives the aggregate as a number from a SQL CAST or as a string that the UI parses for display.
- **Pure derivations in `src/lib/`** — bucketing function lives in a pure helper for testability (TDD wave). No DB access in the helper itself; SQL-side bucketing uses a CASE expression that mirrors the helper.

### Integration Points
- `src/app/page.tsx` — extend the parallel `Promise.all` to call new KPI queries; read the `tz` cookie via `cookies()`; pass `kpis` and `tz` into `<ProductionDashboard>`.
- `src/components/ProductionDashboard.tsx` — slot `<KpiStrip kpis={kpis} />` above filter pills; slot `<KpiSection trend={...} exceptions={...} />` below the columns.
- `src/components/MillColumn.tsx` — extend header with KPI-03 strip; accept a new `summary` prop.
- `src/db/queries/kpis.ts` — NEW module hosting all KPI aggregation queries (or co-locate in `orders.ts` and `events.ts`; planner picks).
- `src/db/schema/orders.ts` — add `earlyDeliveryDate` nullable column; regenerate migration.
- `src/actions/import.ts` + `src/lib/import-schema.ts` — extend parser and Zod schema for the new column.
- `src/db/seed.ts` + `src/db/seed-data.json` — backfill synthetic dates for KPI-08 visibility.
- `src/components/KPICard.tsx` — DELETE (D-08).
- `package.json` — NO new dependencies (D-13).

### Build-time risks Phase 35 must surface
- **Timezone correctness with `force-dynamic`** — `cookies()` in an RSC forces dynamic rendering, which `src/app/page.tsx` already declares (`export const dynamic = 'force-dynamic'` from Phase 34 D-01). No new risk; the planner verifies the cookie read interacts cleanly with the existing dynamic mode.
- **Cookie missing on first render** — until the `<TzBootstrap />` client component runs, the cookie is absent and the server falls back to `'America/Chicago'`. First-paint KPIs render against the fallback; on the next polling tick after the cookie is set, KPIs re-render against the operator's actual timezone. Acceptable for v2.0; document the behavior so it's not a UAT surprise.
- **Drizzle migration with a NULLABLE column on an existing table with data** — adding `early_delivery_date date` nullable is non-destructive (Postgres `ALTER TABLE ... ADD COLUMN ... NULL`). Verify no migration-tool surprises in `drizzle-kit generate` output.
- **Seed `truncate` discipline** — Phase 32 D-07 `users`-table TRUNCATE-protection rule MUST be preserved. The Phase 35 seed update adds `early_delivery_date` to `production_orders` seed rows only; the seed script's TRUNCATE behavior for `production_orders` stays as-is.
- **Existing demo `KPICard.tsx` deletion** — verify with `grep -rn 'KPICard' src/` that no other file imports it. The Phase 34 audit listed `KPICard.tsx` as a candidate cleanup item (warning-level). Deletion is on-scope; planner adds it as an explicit task, not a silent side-effect.
- **SQL-side bucketing CASE expression vs. JS-side `bucketTexture`** — the pure helper exists for unit-test fidelity, but KPI-05 SQL must not call it. The CASE expression in SQL and the helper in TS must agree. Plan adds a test that asserts agreement (e.g., a Jest test that runs every known texture value through both paths and asserts identical bucket assignment).
- **Hand-rolled SVG and React 19 stripe-mode rendering** — verify the SVG renders consistently on server and client (no hydration warnings). Use deterministic geometry; avoid `Math.random()`-based jitter in the chart.
- **KPI Suspense + polling interplay** — when `router.refresh()` fires, the per-zone Suspense fallbacks re-show briefly. Operator UX may want a "stale-while-revalidate" feel where old values stay visible during refresh. Plan verifies with a Wave-N smoke test; if jarring, switch to `useTransition` + isPending dimming pattern (Phase 34 D-23 references it).
- **Cross-action invariant for KPI-08 import column** — when `commitImportAction` writes the new `early_delivery_date`, the existing `revalidateTag('production-orders')` invalidates KPIs alongside the order list. No new tag needed (D-14).

</code_context>

<specifics>
## Specific Ideas

- **"Today" follows the operator's browser timezone** — not UTC, not a hard-coded `America/Chicago`. A remote manager checking from Pacific Time sees their local "today"; a mill operator on-site sees the mill-local "today". The IANA string flows server-side via a `tz` cookie (D-01 / D-02). Fallback `'America/Chicago'` applies only when the cookie is absent on first render.
- **Dwell time is "this-block" time, not "ever-blocked" time.** Resume → re-Block resets the clock. Matches the operator's mental model: "how long has this order been blocked right now?"
- **`early_delivery_date` is a real DB column.** Schema migration, import parser update, seed backfill — all in Phase 35's scope. Not derived from existing fields, not parsed from `delivery_time` text. The source-of-truth column comes from Book1.xlsx (or future ERP exports); planner confirms exact column header during research.
- **KPI-05 buckets are locked: `Pellet`, `Mash`, `Crumble`** — three buckets, no more. SH PELLET maps to Pellet; FINE CR + C. CRUMBLE map to Crumble. NULL textures excluded from both numerator and denominator with a "N uncategorized" footnote (D-11 / D-12).
- **No new chart library.** KPI-06's 7-day trend ships as hand-rolled inline SVG. Empty state ("Not enough data yet") locked by the KPI-06 spec.
- **KPIs share the `'production-orders'` cache tag** — no new tag, no new action invalidations. Phase 35 inherits Phase 33's cache invariant rather than introducing a parallel one (D-14).
- **KPI surfaces are read-only.** No transition buttons on KPI cards, no edit affordances, no role gate. KPI-07's `BlockedExceptionList` row click opens the drawer (where the existing Phase 34 read-only / `canEdit` pattern takes over).
- **The demo-era `src/components/KPICard.tsx` is DELETED in this phase** — not refactored, not kept alongside a new component. Verify no remaining imports before delete; if any are found, those imports are also Phase 35's responsibility to update.
- **`BlockedAlertBand` and `BlockedExceptionList` coexist.** Same domain (blocked orders), different role. The band is the sticky-top quick alert; the list is the sortable bottom table with dwell time and (when applicable) the overdue badge.

</specifics>

<deferred>
## Deferred Ideas

- **Drill-down from a KPI card to a filtered order view** (e.g., click KPI-04 pending backlog → board auto-filters to Pending) — v2.1+ (`KPI-FUT-09`, newly captured).
- **Manual entry / edit of `early_delivery_date` in the drawer** — v2.1+. Phase 35 ships the column + import path only; operator-editable UI is deferred. Sets up the data shape for an easy future addition.
- **Tooltips and animation on the 7-day trend chart** — v2.1+. Hand-rolled SVG ships static; richer interactivity (hover values, drill-down to that day's orders) is deferred. If operator feedback demands it, swap in `recharts` or `visx` then.
- **Sortable column headers on `BlockedExceptionList`** — KPI-07 says "sortable by dwell time" specifically; default sort is dwell time descending. Click-to-sort by other columns (customer, mill line, blocked-at) is v2.1+ if operator demands.
- **Week-over-week throughput delta** (`KPI-FUT-04`) — requires sustained accumulated data.
- **Bottleneck heatmap by mill line × day** (`KPI-FUT-05`) — requires 30+ days of data.
- **Customer concentration view** (`KPI-FUT-06`).
- **Delivery date compliance rate** (`KPI-FUT-07`) — extends KPI-08 with historical aggregation; requires completed-order history depth.
- **Manager exception inbox + supervisor escalation flag** (`KPI-FUT-08`).
- **Custom date-range KPI views** — explicit Out of Scope in REQUIREMENTS.md. Fixed windows (today, 7-day) only.
- **Replacing `BlockedAlertBand` with `BlockedExceptionList`** — kept as separate surfaces (D-10). A future iteration may consolidate them based on operator feedback.
- **Manual-refresh button specifically for KPIs** — KPI refresh piggybacks on the existing dashboard-wide refresh chip from Phase 34 D-20. A separate KPI refresh is deferred indefinitely.
- **KPI export / CSV download** — explicit non-goal for v2.0 (carries over PROJECT.md "no custom report builder").
- **Drill-down into a specific day from the 7-day chart** — deferred.

### Reviewed Todos (not folded)
None — no matching pending todos for Phase 35 (no cross_reference_todos matches; pending-todos scanner returned 0).

</deferred>

---

*Phase: 35-kpi-sections-and-role-specific-metrics*
*Context gathered: 2026-05-14*
