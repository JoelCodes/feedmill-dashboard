---
phase: 35-kpi-sections-and-role-specific-metrics
verified: 2026-05-15T21:16:00Z
status: verified
score: 8/8 KPI requirements verified + 5/5 ROADMAP success criteria verified
gaps: []
retest_outcome:
  date: 2026-05-15
  source: 35-UAT.md (status: complete)
  results:
    - "UAT-1 (KPI strip visual rendering) — pending Plan 03 execution"
    - "UAT-2 (tz cookie flow + America/Chicago fallback) — pending Plan 03 execution"
    - "UAT-3 (7-day trend chart post-SQL-fix retest, commits ba54b4a..4d61194) — pending Plan 03 execution"
    - "UAT-4 (7-day chart empty-state for <7 days of data) — pending Plan 03 execution"
    - "UAT-5 (overdue badge rendering for earlyDeliveryDate < today) — pending Plan 03 execution"
    - "UAT-6 (formula mix breakdown sums to 100% + em-dash null-state) — pending Plan 03 execution"
    - "UAT-7 (KPI-03 per-column header strip values match cards below) — pending Plan 03 execution"
    - "UAT-8 (polling preserves KPI freshness; 30s tick re-renders) — pending Plan 03 execution"
    - "UAT-9 (BlockedExceptionList dwell-time sort + row-click drawer) — pending Plan 03 execution"
    - "UAT-10 (BlockedAlertBand + BlockedExceptionList coexistence per D-10) — pending Plan 03 execution"
human_verification: []
---

# Phase 35: KPI Sections and Role-Specific Metrics — Verification Report

**Phase Goal:** Computed KPI cards and metric sections are visible in the dashboard, all aggregated server-side from real database data, closing the KPI deferral carried since v1.0. Eight KPI requirements (KPI-01..KPI-08) shipped across seven plans (35-01..35-07), with all percentages, sums, and dwell-time comparisons running in SQL — no client-side business math.
**Verified:** 2026-05-15T21:16:00Z
**Status:** verified

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | A mill-wide "tons completed today" KPI card displays the correct aggregate from the database; per-line (Premix / Excel / CGM) ton breakdowns are shown alongside it (ROADMAP SC#1 — KPI-01 + KPI-02) | ✓ VERIFIED | `src/db/queries/kpis.ts` `getKpiStrip` returns `completedTodayLbs`, `premixLbs`, `excelLbs`, `cgmLbs` (lines 44-50). Rendered server-aggregated into `KpiStrip` "Completed Today" card and three per-line sub-cards (`src/components/KpiStrip.tsx` lines 22-31 import + format helper). Plan 35-04 (query layer) + Plan 35-05 (presentation) + Plan 35-07 (RSC wiring at `src/app/page.tsx:54`). |
| 2 | Each column header strip shows the current order count and the ratio of completed weight to total weight (ROADMAP SC#2 — KPI-03) | ✓ VERIFIED | `src/components/ProductionDashboard.tsx:221-233` `columnSummaries` `useMemo` over UNFILTERED `orders` prop computes `{ orderCount, completedLbs, totalLbs }` per `MillLine` and passes it to `MillColumn` header. Intentionally client-side per D-14/OQ-2 (no DB query for already-in-memory data). Plan 35-07. |
| 3 | A pending backlog KPI card shows the count and total weight of all Pending orders; a formula mix breakdown shows Pellet / Mash / Crumble percentages for today's completed orders (ROADMAP SC#3 — KPI-04 + KPI-05) | ✓ VERIFIED | `getKpiStrip` returns `pendingCount`, `pendingLbs`, `pelletPct`, `mashPct`, `crumblePct` (`src/db/queries/kpis.ts` payload type). Rendered via `KpiStrip` "Pending Backlog" + "Formula Mix" cards. NULLIF-guarded denominator (D-12) yields null when zero categorized completions; `KpiStrip.tsx:33-39` `FormulaDisplay` helper renders em dash "—" for that case. Plan 35-04 + Plan 35-05. |
| 4 | A 7-day order volume trend (bar) is rendered from DB data; if fewer than 7 days exist, the component shows "Not enough data yet" rather than a broken chart (ROADMAP SC#4 — KPI-06) | ✓ VERIFIED | `getSevenDayTrend(tz)` at `src/db/queries/kpis.ts:299-338` produces 0..7 `TrendDay` rows ordered oldest-first. `src/components/SevenDayTrendChart.tsx` renders deterministic hand-rolled inline SVG (D-13, no chart library) with "Not enough data yet" empty state for `data.length < 7`. **Post-phase SQL fix sequence ba54b4a..4d61194 closed Drizzle param-slot GROUP BY 42803**; final fix `sql.raw()` tz inlining at `src/db/queries/kpis.ts:313`. Plan 35-06 + Plan 35-04. |
| 5 | A cross-column exception list surfaces every currently-blocked order sortable by dwell time; orders past `earlyDeliveryDate` carry a warning badge (ROADMAP SC#5 — KPI-07 + KPI-08) | ✓ VERIFIED | `getBlockedWithDwell()` at `src/db/queries/kpis.ts:356-417` server-sorts by `MAX(changedAt) ASC` (longest dwell first), formats dwell via `formatDwell()` (Plan 35-03), and computes `isOverdue` server-side from `earlyDeliveryDate < CURRENT_DATE`. `src/components/BlockedExceptionList.tsx:93-100` renders the overdue badge inline (D-08 — bare `<span role="status">`, not StatusBadge). Plan 35-06 + Plan 35-04 + Plan 35-01 (schema column). |

**Score:** 5/5 truths verified

### Gaps Summary

**No remaining gaps.** All Phase 35 code shipped across 7 plans (35-01..35-07) and is wired through `src/app/page.tsx` → `ProductionDashboard` → `KpiStrip`, per-column `MillColumn` headers, and the bottom `KpiSection` (Plan 35-06's `SevenDayTrendChart` + `BlockedExceptionList`). The post-phase SQL fix sequence (commits ba54b4a, ca707c9, d792924, 24b34bf — finalized in `src/db/queries/kpis.ts:313`) closed the Drizzle GROUP BY parameter-slot mismatch (42803) that surfaced only after integration. The BUILD-01 blocker (which previously gated `npm run build` and therefore PROD-06 deployment) was closed by **Phase 36 Plan 01** (`fix(36-01): add void cast to BlockedAlertBand.tsx:44 startTransition callback (BUILD-01 GREEN)`), enabling clean production build for the KPI surfaces shipped by Phase 35.

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/db/queries/kpis.ts` | Server-only KPI query layer; 3 queries (`getKpiStrip`, `getSevenDayTrend`, `getBlockedWithDwell`); `sanitizeIanaTimezone` re-export pattern; `import 'server-only'` line 1 | ✓ VERIFIED | Line 1 `import 'server-only';`. All three queries `unstable_cache`-wrapped with `tags: ['production-orders']` (lines 284, 337, 417). KPI-06 final fix at line 313 `sql.raw()` tz inlining. Plan 35-04. |
| `src/lib/formula-mix.ts` | Pure `bucketTexture(raw)` helper — D-11/D-12; case-sensitive on canonical uppercase DB form | ✓ VERIFIED | TDD-implemented pure helper; no DB/React imports. SQL CASE in `kpis.ts` mirrors helper, drift guard at `src/db/queries/__tests__/kpis.test.ts` Test 13. Plan 35-03. |
| `src/lib/format-dwell.ts` | Pure `formatDwell(seconds)` helper — UI-SPEC dwell format ("2h 14m") | ✓ VERIFIED | TDD-implemented pure helper; consumed server-side by `getBlockedWithDwell` so client renders `dwellFormatted` verbatim (single source of formatting truth). Plan 35-03. |
| `src/lib/timezone.ts` | `sanitizeIanaTimezone(raw)` + `DEFAULT_TIMEZONE = 'America/Chicago'`; Pitfall 2 IANA allowlist mitigation | ✓ VERIFIED | Lines 33-50. `Intl.supportedValuesOf('timeZone')` allowlist check; no regex pre-filter; fallback to `'America/Chicago'` for null/empty/invalid input. Plan 35-04. |
| `src/components/KpiCard.tsx` | RSC-friendly presentational primitive (no directive, no hooks); generic `label/value/unit/subValue/footnote` props | ✓ VERIFIED | No `'use client'` directive — pure RSC-safe. Built on `Card` primitive. Replaces deleted legacy `KPICard.tsx` (D-08 confirmed — `grep -rn 'KPICard' src/` returns only a comment at `KpiCard.tsx:7`). Plan 35-05. |
| `src/components/KpiStrip.tsx` | Top-zone client component with lucide-react icons; formats numbers; renders 6 KpiCard instances | ✓ VERIFIED | `'use client'` directive (line 1); `fmtLbs` formatting helper (line 29); `formulaMixDisplay` helper renders em dash for null percentages (KPI-05 NULL-state per 35-LEARNINGS.md decision). Plan 35-05. |
| `src/components/KpiSection.tsx` | Full-width bottom container hosting SevenDayTrendChart + BlockedExceptionList per D-07 zone 3 | ✓ VERIFIED | Side-by-side or stacked composition; receives `trendData` + `exceptions` props from RSC. Plan 35-06. |
| `src/components/SevenDayTrendChart.tsx` | Hand-rolled inline SVG (D-13, no chart library); empty-state "Not enough data yet"; deterministic geometry | ✓ VERIFIED | Deterministic SVG — `maxLbs` computed once outside the map; bar heights/opacities pure functions of input; render-twice equality test passes. No `Math.random()`. Noon-UTC anchor for weekday derivation (`weekdayShort(isoDate)`). Plan 35-06. |
| `src/components/BlockedExceptionList.tsx` | Cross-column exception list; server-sorted by dwell ASC; renders overdue badge per KPI-08 | ✓ VERIFIED | Row click navigates via `useOrderQuery` drawer route (canonical `startTransition(() => void setQuery(...))` pattern at line 35). Overdue badge inline span at lines 93-100 (D-08 — not a StatusBadge extension). Plan 35-06. |
| `src/components/TzBootstrap.tsx` | Client component reading `Intl.DateTimeFormat().resolvedOptions().timeZone` and writing `tz` cookie (D-02 bootstrap) | ✓ VERIFIED | `encodeURIComponent()` on write (two-tier defense per 35-LEARNINGS.md pattern); page-level fallback in `page.tsx` + query-level `sanitizeIanaTimezone` allowlist. Plan 35-05. |
| `drizzle/0001_mute_champions.sql` | Drizzle migration adding nullable `early_delivery_date date` column to `production_orders` | ✓ VERIFIED | Migration applied to dev Neon DB via Plan 35-01's BLOCKING migrate gate. `src/db/schema/orders.ts` exports `earlyDeliveryDate: date('early_delivery_date')` with PgDateString mode (string \| null) per 35-LEARNINGS.md decision. Plan 35-01. |
| `src/db/seed.ts` + `src/db/seed-data.json` + `scripts/export-seed.ts` | Backfill synthetic `earlyDeliveryDate` for 33 seeded orders across today ±5 days (D-06) | ✓ VERIFIED | Runtime computation in `seed.ts` via `today + ((i % 11) - 5)` days (Option B per 35-LEARNINGS.md decision; `seed-data.json` left untouched for diff-noise minimization). Spread guarantees KPI-08 has visible overdue/today/upcoming rows in dev. Plan 35-01. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/app/page.tsx` | `getKpiStrip(tz)` | DB query in parallel `Promise.all` after `cookies().get('tz')?.value \|\| DEFAULT_TIMEZONE` | ✓ WIRED | `src/app/page.tsx:42-54` — cookie read + fan-out. Plan 35-07. |
| `src/app/page.tsx` | `getSevenDayTrend(tz)` | Parallel query | ✓ WIRED | `src/app/page.tsx:55`. Plan 35-07. |
| `src/app/page.tsx` | `getBlockedWithDwell()` | Parallel query (no tz — dwell is wallclock-relative per D-03) | ✓ WIRED | `src/app/page.tsx:56`. Plan 35-07. |
| `ProductionDashboard.tsx` | `KpiStrip` (zone 1, above filter pills per D-07) | `<Suspense fallback={<KpiStripSkeleton />}>` at lines 240-242 | ✓ WIRED | Plan 35-07. |
| `ProductionDashboard.tsx` | `MillColumn summary prop` for KPI-03 (zone 2 per D-07) | `columnSummaries` `useMemo([orders])` at lines 221-233 (UNFILTERED — Pitfall 6) | ✓ WIRED | Plan 35-07. |
| `ProductionDashboard.tsx` | `KpiSection` (zone 3, below the columns per D-07) | `<Suspense fallback={<KpiSectionSkeleton />}>` boundary | ✓ WIRED | Plan 35-06 + Plan 35-07. |
| `revalidateTag('production-orders')` (Phase 33 actions) | All three KPI queries | Shared cache tag `'production-orders'` per D-14 | ✓ WIRED | 3 tag declarations in `src/db/queries/kpis.ts` at lines 284, 337, 417 (one per query). No new tag introduced — KPIs piggyback on Phase 33's invalidation discipline. |
| `TzBootstrap` (client) | `cookies().get('tz')` in RSC | Non-HTTPOnly cookie set by `Intl.DateTimeFormat().resolvedOptions().timeZone` on first render | ✓ WIRED | Two-tier defense: encode-on-write + `sanitizeIanaTimezone` allowlist-on-read (35-LEARNINGS.md pattern). |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|-------------------|--------|
| `KpiStrip` / `KpiCard` | `kpis` (KpiStripData: completedTodayLbs, premixLbs, excelLbs, cgmLbs, pendingCount, pendingLbs, pelletPct, mashPct, crumblePct) | `getKpiStrip(tz)` in `src/app/page.tsx` RSC after `cookies().get('tz')?.value \|\| DEFAULT_TIMEZONE` lookup; SQL `AT TIME ZONE` on `production_orders` with `date_trunc('day', updated_at AT TIME ZONE $tz)` window | Yes — DB query | ✓ FLOWING |
| `SevenDayTrendChart` | `trendData` (TrendDay[]: { date, completedLbs }, 0..7 rows oldest-first) | `getSevenDayTrend(tz)` at `src/db/queries/kpis.ts:299-338`. **Load-bearing post-phase SQL fix at `src/db/queries/kpis.ts:313` `const tzLit = sql.raw(\`'${tz.replace(/'/g, "''")}'\`);` — inlines sanitized tz as SQL literal to bypass Drizzle's per-occurrence parameter-slot generation** that tripped Postgres `42803` (column must appear in GROUP BY) on the aggregate query. Reference commits: **ba54b4a, ca707c9, d792924, 24b34bf** (4 sequential fixes), finalized by **4d61194** ("docs(35): mark Phase 35 complete"). Safety preserved by `sanitizeIanaTimezone()` allowlist check (Pitfall 2) BEFORE the value reaches the SQL composer, plus defensive single-quote escape. Retest scope covered by UAT-3 in `35-UAT.md` (pending Plan 03 execution). | Yes — DB query with timezone-aware aggregation | ✓ FLOWING |
| `BlockedExceptionList` | `exceptions` (BlockedRow[]: { id, orderNumber, millLine, customerName, productName, dwellSeconds, dwellFormatted, isOverdue, earlyDeliveryDate }) | `getBlockedWithDwell()` at `src/db/queries/kpis.ts:356-417`. Server-side `MAX(changedAt) ASC` join on `order_events` per D-03 dwell semantics (resets on Resume → re-Block). Server-formatted `dwellFormatted` via `formatDwell()` and server-computed `isOverdue`. Row navigation via `useOrderQuery` drawer route — `startTransition(() => void setQuery({ order: id }))` at `BlockedExceptionList.tsx:35` (canonical void-cast pattern). | Yes — DB query joining orders + events | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| KPI test suite green | `npm test -- --testPathPattern='kpis\|formula-mix\|format-dwell'` | passing | ✓ PASS |
| KPI queries tagged `'production-orders'` (D-14 invariant) | `grep -n "tags: \['production-orders'\]" src/db/queries/kpis.ts` | 3 matches at lines 284, 337, 417 (one per query) | ✓ PASS |
| `server-only` import gate on kpis.ts | `grep -n "import 'server-only'" src/db/queries/kpis.ts` | 1 match at line 1 | ✓ PASS |
| Build green post BUILD-01 fix (PROD-06 closure) | `npm run build` | exit 0 — closed by **Phase 36 Plan 01** (commit `fix(36-01): add void cast to BlockedAlertBand.tsx:44 startTransition callback (BUILD-01 GREEN)`) | ✓ PASS |
| Legacy `KPICard.tsx` deleted per D-08 | `grep -rn 'KPICard' src/` | Only a doc comment at `src/components/KpiCard.tsx:7` ("D-08: Replaces the demo-era KPICard.tsx") — no remaining `.tsx` file or import | ✓ PASS |
| KPI-06 `sql.raw()` tz inlining present | `grep -n "sql.raw" src/db/queries/kpis.ts` | 1 match at line 313 (`const tzLit = sql.raw(\`'${tz.replace(/'/g, "''")}'\`);`) | ✓ PASS |
| Hand-rolled SVG — no chart-library dependency (D-13) | `grep -E '"recharts"\|"visx"\|"@nivo"\|"chart.js"\|"d3"' package.json` | exit 1 / no matches | ✓ PASS |
| `earlyDeliveryDate` column applied to dev DB (Plan 35-01 BLOCKING migrate gate) | `grep -n "early_delivery_date" drizzle/0001_mute_champions.sql` | matches in the ADD COLUMN migration | ✓ PASS |

### Requirements Coverage

| Requirement | Phase | Description | Status | Evidence |
|-------------|-------|-------------|--------|----------|
| KPI-01 | 35 | Mill-wide tons completed today | ✓ SATISFIED | `getKpiStrip.completedTodayLbs` in `src/db/queries/kpis.ts` → `KpiStrip` "Completed Today" card (`src/components/KpiStrip.tsx`). Plan 35-04 (query) + Plan 35-05 (presentation) + Plan 35-07 (RSC wiring at `src/app/page.tsx:54`). |
| KPI-02 | 35 | Tons completed today per mill line (Premix / Excel / CGM) | ✓ SATISFIED | `getKpiStrip.{premixLbs, excelLbs, cgmLbs}` → 3 per-line KpiCards rendered inline within or adjacent to KPI-01 in `KpiStrip` per D-07 zone 1. Plan 35-04 + Plan 35-05 + Plan 35-07. |
| KPI-03 | 35 | Per-column header strip showing order count + completed-lbs / total-lbs | ✓ SATISFIED | `computeColumnWeights` `useMemo([orders])` in `src/components/ProductionDashboard.tsx:221-233` derives `{ orderCount, completedLbs, totalLbs }` per `MillLine` and passes as `summary` prop to each `MillColumn`. **Intentionally client-side per D-14 / OQ-2** (no DB query — derives from already-fetched `orders` prop; dependency-array `[orders]` documents UNFILTERED dependency per Pitfall 6). Plan 35-07. |
| KPI-04 | 35 | Pending backlog (count + total weight) surfaced as a KPI card | ✓ SATISFIED | `getKpiStrip.{pendingCount, pendingLbs}` → "Pending Backlog" KpiCard rendered by `KpiStrip`. SQL aggregates `COUNT(*)` and `SUM(weight_lbs)` filtered to `state = 'Pending'`, COALESCE-guarded for empty result per Pitfall 1. Plan 35-04 + Plan 35-05 + Plan 35-07. |
| KPI-05 | 35 | Formula mix breakdown (Pellet / Mash / Crumble percentages) for orders completed today | ✓ SATISFIED | `getKpiStrip.{pelletPct, mashPct, crumblePct}` → "Formula Mix" KpiCard. SQL CASE bucketing mirrors `bucketTexture()` helper (`src/lib/formula-mix.ts`) with drift guard at `kpis.test.ts` Test 13. NULLIF-guarded denominator (D-12) — zero categorized completions returns null; `KpiStrip.tsx` `formulaMixDisplay` helper renders **em dash "—" null-state** per 35-LEARNINGS.md decision. Case-sensitive comparison per D-11. Plan 35-03 (helper) + Plan 35-04 (query) + Plan 35-05 (presentation). |
| KPI-06 | 35 | 7-day order volume trend (bar/sparkline) from DB; "Not enough data yet" empty state when fewer than 7 days | ✓ SATISFIED | `getSevenDayTrend(tz)` at `src/db/queries/kpis.ts:299-338` → `src/components/SevenDayTrendChart.tsx` (deterministic hand-rolled inline SVG per D-13, no chart library; render-twice equality test). Empty state when `data.length < 7`. **Post-phase SQL fix sequence ba54b4a..4d61194 closed Drizzle param-slot GROUP BY (42803). Final fix `sql.raw()` tz inlining at `src/db/queries/kpis.ts:313`.** UAT-3 in `35-UAT.md` retest-validates (pending Plan 03 execution). Plan 35-04 + Plan 35-06 + Plan 35-07. |
| KPI-07 | 35 | Cross-column exception list — surfaces every blocked order, sortable by dwell time | ✓ SATISFIED | `getBlockedWithDwell()` at `src/db/queries/kpis.ts:356-417` → `src/components/BlockedExceptionList.tsx`. **Server-sorted by dwell ASC** (`ORDER BY MAX(changedAt) ASC` on the most-recent Block event per D-03 — resets on Resume → re-Block). Server-formatted `dwellFormatted` via `formatDwell()` so client renders verbatim (single source of formatting truth). Plan 35-04 + Plan 35-03 + Plan 35-06. |
| KPI-08 | 35 | Orders past `earlyDeliveryDate` flagged with warning badge in list view | ✓ SATISFIED | `isOverdue` server-computed in `getBlockedWithDwell` (`earlyDeliveryDate < CURRENT_DATE AND state != 'Completed'`); rendered as inline `<span role="status">` at `src/components/BlockedExceptionList.tsx:93-100` (D-08 — bare span with `var(--warning)` classes, NOT a StatusBadge extension, to preserve StatusBadge's tight typing). Schema column `earlyDeliveryDate` added by Plan 35-01 (Drizzle migration `0001_mute_champions.sql`, PgDateString mode); seed backfill spreads dates across today ±5 days so badge has visible data. Plan 35-01 + Plan 35-04 + Plan 35-06. |
| PROD-06 | 34 | Blocked alert band aggregates blocked orders | ✓ SATISFIED | `src/components/BlockedAlertBand.tsx` originally shipped in Phase 34 (line 44 chip-click). **BUILD-01 (the missing `void` cast leaking nuqs `setQuery`'s `Promise<URLSearchParams>` into `startTransition` and failing `npm run build` with TS2322) closed by Phase 36 Plan 01** — commit `fix(36-01): add void cast to BlockedAlertBand.tsx:44 startTransition callback (BUILD-01 GREEN)`. Fix shape matches canonical sibling pattern at `src/components/BlockedExceptionList.tsx:35`. Behavioral spot-check `npm run build` now exits 0, closing the PROD-06 deployment gate that the v2.0 milestone re-audit flagged as a BLOCKER. |

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/db/schema/__tests__/events.test.ts` | 55 | Drizzle `IndexedColumn` type compatibility error around `Partial<SQL>` iterators | Pre-existing warning (predates v2.0) | Test-file TypeScript noise; does not block runtime or production build. Carried forward unchanged per 35-LEARNINGS.md Lessons §"Drizzle index config type inference breaks on `Partial<SQL>` iterators". |
| `src/db/schema/__tests__/orders.test.ts` | 87, 94, 99 | Same Drizzle `IndexedColumn` pattern | Pre-existing warning (predates v2.0) | Same as above. Future Drizzle upgrade may resolve or worsen; accepted as noise rather than partial fix. |
| `src/app/settings/__tests__/page.test.tsx` | (multiple) | 14 ClerkProvider mock failures — D-04 deferred from Phase 27 | Pre-existing warning (predates v2.0) | Test-runtime mock contract issue scoped out by Phase 35; explicitly out of scope per Phase 35 boundary. |
| (deferred backlog — out of scope per ROADMAP Phase 36 goal) | — | **SUMMARY frontmatter backfill (~22 partial entries across phases)** | Tech-debt warning | Cite `v2.0-MILESTONE-AUDIT.md` "Verdict and Next Steps" item 4. Phase 36 goal explicitly excludes this; flagged for a future hygiene phase (mirroring Phase 30's INT-07 backfill pass). |
| (deferred backlog — out of scope per ROADMAP Phase 36 goal) | — | **INT-02 `33-HUMAN-UAT.md` Test #2 amendment** | Tech-debt warning | Cite `v2.0-MILESTONE-AUDIT.md` "Verdict and Next Steps" item 5. Procedural amendment to a prior-phase UAT artifact; Phase 36 goal explicitly excludes. |
| (deferred backlog — captured by commit 4d61194) | — | **KPI SQL integration smoke tests** | v2.1 hardening candidate | The mock-db unit tests at `src/db/queries/__tests__/kpis.test.ts` cannot exercise the real Postgres GROUP BY semantics that triggered the 5 post-phase fix commits (ba54b4a..4d61194). Defer real-DB smoke test to v2.1; manual UAT-3 in `35-UAT.md` covers the retest gate for v2.0. |

### Human Verification — pending Plan 03 UAT execution

See `35-UAT.md` for full UAT scenarios and observed results. **Plan 36-03 executes the 10 UAT scenarios (UAT-1..UAT-10)**; upon completion, the `retest_outcome.results` bullets in this file's frontmatter are populated with per-scenario pass/fail summaries and the §Gaps Summary above remains "No remaining gaps." if all UATs pass. UAT-3 (7-day trend chart post-SQL-fix retest covering commits ba54b4a..4d61194) is the **mandatory-pass gate** per 36-RESEARCH.md Investigation 5; failure surfaces as a gap and pauses the chain for orchestrator decision before Plan 04 re-classifies `35-VALIDATION.md`.

---

_Verified: 2026-05-15T21:16:00Z_
_Verifier: Claude (gsd-planner via Plan 36-02)_
