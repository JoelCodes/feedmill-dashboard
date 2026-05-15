# Phase 35: KPI Sections and Role-Specific Metrics - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-14
**Phase:** 35-kpi-sections-and-role-specific-metrics
**Areas discussed:** Daily window & dwell time math, earlyDeliveryDate data source (KPI-08), KPI layout & per-column header strip, Formula mix bucketing (KPI-05), Chart implementation (KPI-06)

---

## Daily window & dwell time math

### Q1: What defines "today" for the daily KPIs (KPI-01/02/05 and per-column 'completed today' counts)?

| Option | Description | Selected |
|--------|-------------|----------|
| Mill local time (America/Chicago) | Hard-coded TZ; safe for a single mill; SQL: `date_trunc('day', now() AT TIME ZONE 'America/Chicago')` | |
| UTC | Simpler queries, no timezone library; risks operator confusion at evening shift hours | |
| Operator's browser timezone | Computed client-side, ISO range passed to server; adapts per-viewer | ✓ |

**User's choice:** Operator's browser timezone
**Notes:** Implementation note added to CONTEXT.md (D-02) — browser TZ propagated server-side via a `tz` cookie; SQL composes `date_trunc('day', updated_at AT TIME ZONE $tz)`. Default fallback `'America/Chicago'` when cookie absent.

### Q2: How is "dwell time" computed for the blocked-order exception list (KPI-07)?

| Option | Description | Selected |
|--------|-------------|----------|
| Time since most-recent Block event | `Now − MAX(changed_at)` from `order_events` where `to_state='Blocked'`; resets on Resume→re-Block | ✓ |
| Time since first-ever Block event | `Now − MIN(changed_at)`; counts cumulative blocked history; inflates after Resume cycles | |
| Total accumulated blocked time across all cycles | Sum of all (Resume−Block) intervals plus current open block | |

**User's choice:** Time since most-recent Block event
**Notes:** Matches operator mental model "how long has it been blocked this time?" Cheap indexed query (D-03).

---

## earlyDeliveryDate data source (KPI-08)

### Q3: How should KPI-08 'orders past earlyDeliveryDate' be handled given the schema has no such column today?

| Option | Description | Selected |
|--------|-------------|----------|
| Add early_delivery_date column via migration | Drizzle migration + import parser update + seed backfill; KPI-08: `WHERE early_delivery_date < CURRENT_DATE`; clean semantics | ✓ |
| Parse existing delivery_time text into a date | Best-effort regex; fragile (handles "ASAP", "8am next Tue", empty strings poorly) | |
| Derive a synthetic 'overdue' rule from createdAt + N days | Deterministic but a proxy, not the source of truth | |
| Defer KPI-08 to v2.1 | Ships milestone at 7/8 KPIs instead of 8/8 | |

**User's choice:** Add early_delivery_date column via migration
**Notes:** Migration + import parser + seed backfill all in Phase 35 scope (D-04).

### Q4: Where does the early_delivery_date value come from when an order is created/imported?

| Option | Description | Selected |
|--------|-------------|----------|
| From a Book1.xlsx column we add to the importer | Operator owns the date upstream via spreadsheet | ✓ |
| Operator enters it manually in the drawer | Adds UI surface + a new server action | |
| Derive from createdAt + standard lead time | Auto-set on insert; not really an "early delivery date" | |

**User's choice:** From a Book1.xlsx column we add to the importer
**Notes:** Planner reads `example-data/Book1.xlsx` during research to confirm exact column header name and date format (D-05).

### Q5: How should existing seeded orders (33 rows in src/db/seed-data.json) be handled for the new early_delivery_date column?

| Option | Description | Selected |
|--------|-------------|----------|
| Backfill with synthetic dates so KPI-08 has data to show | Spread across today±5 days; column stays nullable | ✓ |
| Leave seeded orders with NULL early_delivery_date | Cleaner data semantics but KPI-08 looks "broken" in dev/demo | |
| Treat the column as NOT NULL and re-seed with required dates | Strictest data integrity but blocks future imports without the column | |

**User's choice:** Backfill with synthetic dates so KPI-08 has data to show
**Notes:** Spread across today±5 days deterministically (e.g., row-index modulo offset) so some seeds are overdue, some today, some upcoming. Column remains nullable in schema (D-06).

---

## KPI layout & per-column header strip

### Q6: Where do the top-level KPI cards (KPI-01, KPI-02, KPI-04, KPI-05) sit in the dashboard?

| Option | Description | Selected |
|--------|-------------|----------|
| Horizontal strip at top, above the filter pills | Summary-on-top hierarchy; manager-friendly | ✓ |
| Collapsible section between filter pills and columns | Operator-first; KPIs expand on demand | |
| Sidebar / right-rail panel alongside the columns | Always visible; squeezes column space; needs 4th layout region | |

**User's choice:** Horizontal strip at top, above the filter pills
**Notes:** D-07 zone 1.

### Q7: Where does the KPI-03 per-column header strip live?

| Option | Description | Selected |
|--------|-------------|----------|
| Inside each MillColumn header, replacing/augmenting the current header | Co-locates summary with detail; edits MillColumn header | ✓ |
| Separate row above the three columns, with 3 sub-strips lined up | Visually heavier header zone; keeps MillColumn unchanged | |
| Inside each card's column-header section but as a small expandable detail line | Hides info behind interaction; wrong fit for at-a-glance KPI | |

**User's choice:** Inside each MillColumn header, replacing/augmenting the current header
**Notes:** D-09; new `summary` prop into MillColumn alongside existing orders.

### Q8: What do we do with the existing static src/components/KPICard.tsx?

| Option | Description | Selected |
|--------|-------------|----------|
| Delete it; build fresh KpiCard primitive for Phase 35 | Cleanest; new component on Card primitive, aligns with DB types | ✓ |
| Refactor it to accept live-data props | Reuses existing visuals; likely more rework than rebuild | |
| Leave it alone and add a separate ProductionKpiCard.tsx | Two coexisting components; naming confusion | |

**User's choice:** Delete it; build fresh KpiCard primitive for Phase 35
**Notes:** Verify with `grep -rn 'KPICard' src/` before delete (D-08).

### Q9: Where do KPI-06 (7-day trend chart) and KPI-07 (cross-column exception list) live?

| Option | Description | Selected |
|--------|-------------|----------|
| Dedicated section below the columns, full-width | Trend chart + exception list span full width below 3 columns; columns stay above the fold | ✓ |
| Trend at top alongside the KPI strip; exception list below the columns | Risks dense top row; chart squeezed | |
| Replace/merge with existing BlockedAlertBand; trend in its own row below | May conflict with BlockedAlertBand's sticky behavior | |

**User's choice:** Dedicated section below the columns, full-width
**Notes:** D-07 zone 3; `BlockedAlertBand` and `BlockedExceptionList` coexist (D-10).

---

## Formula mix bucketing (KPI-05)

### Q10: How should raw texture_type values map to the three KPI-05 buckets?

| Option | Description | Selected |
|--------|-------------|----------|
| PELLET + SH PELLET → Pellet, MASH → Mash, FINE CR + C. CRUMBLE → Crumble | Matches feed-milling domain conventions | ✓ |
| Show five buckets instead | Contradicts KPI-05 spec; scope creep | |
| PELLET → Pellet, SH PELLET → 'Other', etc. | Treats SH PELLET as unclassified; less domain-correct | |

**User's choice:** PELLET + SH PELLET → Pellet, MASH → Mash, FINE CR + C. CRUMBLE → Crumble
**Notes:** Pure helper in `src/lib/formula-mix.ts` (or `production-derivations.ts`); SQL CASE expression mirrors helper; tests assert agreement (D-11).

### Q11: How should NULL texture_type be handled in the KPI-05 percentage calculation?

| Option | Description | Selected |
|--------|-------------|----------|
| Exclude NULL from both numerator and denominator | Percentages sum to 100% over categorized population; optional "N uncategorized" footnote | ✓ |
| Include NULL as a 4th 'Unknown' bucket | Surfaces data-quality issues; possibly scope creep | |
| Treat NULL as Mash (most common default) | Lies about uncategorized data | |

**User's choice:** Exclude NULL from both numerator and denominator
**Notes:** SQL skeleton: `COUNT(*) FILTER (WHERE bucket = 'Pellet') * 100.0 / NULLIF(COUNT(*) FILTER (WHERE bucket IS NOT NULL), 0)` (D-12).

---

## Chart implementation (KPI-06)

### Q12: How should the KPI-06 7-day volume trend chart be rendered?

| Option | Description | Selected |
|--------|-------------|----------|
| Hand-rolled inline SVG / CSS bars | Zero new dependency; matches lean-deps posture from STACK.md | ✓ |
| Install recharts | ~120KB gzipped; overkill for one sparkline | |
| Install visx | Smaller than recharts; steeper API | |
| Defer the chart — ship KPI-06 as a numeric '7-day total' only | Partial fulfillment; loses trend signal | |

**User's choice:** Hand-rolled inline SVG / CSS bars
**Notes:** Tooltips/animation deferred to v2.1+ if operator feedback demands richer interactivity (D-13).

---

## Claude's Discretion

- Exact source column name in Book1.xlsx for `early_delivery_date` — planner reads the file during research and locks the column header.
- Date format in the spreadsheet (likely `YYYY-MM-DD` or Excel date serial) — planner inspects and configures `read-excel-file` accordingly.
- Exact arrangement of `SevenDayTrendChart` and `BlockedExceptionList` within the bottom `KpiSection` (side-by-side vs. stacked) — UI-SPEC decides.
- Visual treatment of the KPI-08 overdue badge — UI-SPEC decides; reuse `StatusBadge` variant or extend.
- Exact bootstrap mechanism for the `tz` cookie (dedicated `<TzBootstrap />` client component vs. integrate into existing provider) — planner picks; recommend dedicated component.
- KPI-02 per-line tons rendered as 3 sub-cards or inline under KPI-01 — UI-SPEC decides.
- Whether the KPI-03 column-header strip wraps on narrow viewports — UI-SPEC + responsive testing.
- Footnote text for "N orders uncategorized" in KPI-05 — UI-SPEC picks exact copy.
- Whether `BlockedExceptionList` ships with click-to-sort column headers in v2.0 or only default sort-by-dwell-time — planner can ship single-sort and defer the click-to-sort UX if it adds complexity.

## Deferred Ideas

- KPI-FUT-09 (newly captured): drill-down from a KPI card into a filtered order view (click KPI-04 pending backlog → board filters to Pending).
- Manual entry / edit of `early_delivery_date` in the drawer — v2.1+.
- Tooltips and animation on the 7-day trend chart — v2.1+.
- Click-to-sort column headers on `BlockedExceptionList` (beyond default dwell-time sort) — v2.1+.
- Week-over-week throughput delta (KPI-FUT-04).
- Bottleneck heatmap (KPI-FUT-05).
- Customer concentration view (KPI-FUT-06).
- Delivery date compliance rate (KPI-FUT-07).
- Manager exception inbox + supervisor escalation flag (KPI-FUT-08).
- Custom date-range KPI views (explicit Out of Scope in REQUIREMENTS.md).
- Consolidating `BlockedAlertBand` with `BlockedExceptionList` — kept separate in v2.0.
- KPI export / CSV download (carries over "no custom report builder" non-goal).
- Drill-down into a specific day from the 7-day chart.
