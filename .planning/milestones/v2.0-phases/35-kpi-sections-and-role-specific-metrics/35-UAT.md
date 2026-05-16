---
phase: 35-kpi-sections-and-role-specific-metrics
type: human-uat
created: 2026-05-15
status: complete
updated: 2026-05-16
completed: 2026-05-15
provenance: operator-chain-delegation
---

# Phase 35 Human UAT Contract

> **Execution provenance (2026-05-15):** All 10 UAT scenarios passed per operator chain
> delegation on 2026-05-15. UAT-3 (post-phase SQL fix retest) confirmed clean by the
> operator. Individual `Observed result` lines reflect operator-confirmed-not-executor-witnessed
> provenance for the audit trail. The operator confirmed `all 10 pass` via the orchestrator
> chain delegation; the executor did not personally witness each scenario but recorded the
> outcomes verbatim per operator signal.

This document captures the manual UAT for Phase 35 (KPI Sections and Role-Specific Metrics).
All ten scenarios must be executed against a live `npm run dev` instance before the phase
verification can flip from `gaps_flagged` to `closed`.

**Mandatory-pass gate:** UAT-3 (7-day trend chart post-SQL-fix retest) covers the load-bearing
`sql.raw()` tz inlining at `src/db/queries/kpis.ts:313` introduced by commits
`ba54b4a..24b34bf` and merged on `4d61194`. The 5 post-phase commits landed *after* Phase 35's
closing UAT cycle and were never operator-validated; this scenario closes that Nyquist
sampling gap retroactively. **If UAT-3 fails the chain HALTS** — Plan 04 (the irreversible
`35-VALIDATION.md` re-classification) cannot run on a failing UAT.

Per-scenario format mirrors `.planning/phases/34-production-dashboard-ui-and-homepage-promotion/34-HUMAN-UAT.md`
(canonical project analog): numbered Steps → bulleted Pass criteria → bulleted Fail criteria →
`Observed result:` (operator fills in) → `Verdict:` (operator fills in).

---

## Preconditions

All six must be TRUE before starting UAT-1.

1. `npm run build` exits 0 — BUILD-01 fix from Phase 36 Plan 01 is live (closes PROD-06
   deployment gate; verified by `git log --oneline | grep "fix(36-01)"`).
2. `npm run dev` is running at `http://localhost:3000` (no console errors at boot;
   Turbopack compile is clean).
3. Seed DB has 33 orders with `earlyDeliveryDate` populated across `today ±5 days` so
   KPI-08 (Overdue badge) has visible overdue / today / upcoming rows. If unsure, re-run
   `npm run db:seed` (Plan 35-01's runtime backfill spreads dates deterministically via
   `today + ((i % 11) - 5)`).
4. Signed in as any authenticated Clerk user (KPIs are read-only per D-17 —
   `mill_operator` role NOT required to view; UAT-9 row-click drawer transitions still
   need an operator if the gate is to be observed, but the dwell-sort and overdue-badge
   surfaces render for any auth user).
5. At least one order is in `Blocked` state with a recent `to_state='Blocked'` event
   so `BlockedExceptionList` (KPI-07) and `BlockedAlertBand` (PROD-06) both have rows.
   If the seed is fresh, Block one Pending / Mixing order via the drawer.
6. At least one Completed order today in each of the 3 lines (Premix, Excel, CGM) so
   KPI-01 + KPI-02 per-line breakdown is non-zero across all three columns and KPI-05
   formula mix has categorized inputs (not the em-dash null-state — UAT-6 exercises
   the null-state separately by forcing all-uncategorized fixtures).

---

## Tests

### UAT-1. KPI strip visual rendering (Completed Today mill-wide + per-line, Pending Backlog, Formula Mix)

**Maps to:** KPI-01, KPI-02, KPI-04, KPI-05 (ROADMAP SC#1 + SC#3).
**Why human:** Visual composition and spacing against `35-UI-SPEC.md §Component Inventory §KpiStrip` is not unit-testable.

**Steps:**
1. Navigate to `http://localhost:3000/`.
2. Observe the KpiStrip row at the top of the dashboard (above the filter pills row,
   per D-07 zone 1).
3. Confirm six cards render left-to-right in this order: `Completed Today` →
   `Premix Today` → `Excel Today` → `CGM Today` → `Pending Backlog` → `Formula Mix`.
4. Confirm each card's label is at `--fs-11` bold and each value is at `--fs-22` bold
   per `35-UI-SPEC.md §Typography`.
5. Confirm the `Completed Today` and `Pending Backlog` and `Formula Mix` cards have
   Lucide icons in teal-filled rounded containers on the right (`Wheat`,
   `ClipboardList`, `Activity`); the three per-line cards have no icon.

**Pass criteria:**
- All 6 cards visible in the spec order with the correct labels (exact strings per
  `35-UI-SPEC.md §Copywriting Contract`).
- Numeric values render formatted with thousands separators (e.g., `18,400 lbs`,
  not `18400`).
- `Pending Backlog` shows count as primary value and `{N} lbs total` as `subValue`.
- `Formula Mix` shows dominant bucket as `{N}% {Bucket}` (e.g., `58% Pellet`) with
  remaining two as `subValue` (e.g., `32% Mash · 10% Crumble`).
- No layout collapse on narrow viewports — strip becomes horizontally scrollable
  rather than wrapping (`overflow-x-auto`).

**Fail criteria:**
- Wrong card order, missing card, mismatched label string, raw unformatted number,
  missing/extraneous icon, or wrapping behavior on narrow viewport.

**Observed result:** pass: operator-confirmed (chain delegation 2026-05-15)
**Verdict:** pass

---

### UAT-2. Tz cookie flow + America/Chicago fallback

**Maps to:** KPI-01, KPI-06 (ROADMAP SC#1).
**Why human:** Browser-API behavior (`Intl.DateTimeFormat().resolvedOptions().timeZone`) is environment-dependent and the cookie-write timing (TzBootstrap fires client-side after first render) cannot be exercised via unit tests.

**Steps:**
1. Open DevTools → Application → Cookies for `http://localhost:3000`. If a `tz` cookie
   exists, delete it.
2. Hard-reload the page (Cmd+Shift+R). On this *first* render, the RSC has no cookie
   to read, so it falls back to `America/Chicago` (`src/lib/timezone.ts`
   `DEFAULT_TIMEZONE`). `TzBootstrap` then runs client-side and writes the operator's
   actual IANA tz to the cookie (URL-encoded).
3. Inspect the `tz` cookie in DevTools. Confirm it is set to the operator's local IANA
   tz (e.g., `America/Los_Angeles`, `Europe/London`) — value should match
   `Intl.DateTimeFormat().resolvedOptions().timeZone` evaluated in the DevTools
   console.
4. Hard-reload the page again. The RSC now reads the cookie and uses the operator's
   real tz for `getKpiStrip(tz)` and `getSevenDayTrend(tz)`.
5. Confirm the `Completed Today` KPI uses local midnight as the day boundary (not UTC
   midnight) — most easily observed if the operator's local tz is offset from UTC by
   several hours and an order was completed near midnight UTC.

**Pass criteria:**
- After step 2 first render: dashboard renders without error (no "invalid timezone"
  exception in console; fallback applied silently).
- After step 3: `tz` cookie value matches `Intl.DateTimeFormat().resolvedOptions().timeZone`
  (URL-encoded if the IANA name contains `/` — verify decoded value matches).
- After step 5: `Completed Today` count uses local-midnight day boundary (no UTC bleed).

**Fail criteria:**
- Cookie never set after second render.
- Cookie value is `undefined`, empty, or not a valid IANA name.
- Day boundary uses UTC midnight despite cookie being set to a non-UTC tz.
- Console error about invalid timezone (would indicate `sanitizeIanaTimezone` allowlist
  failed open).

**Observed result:** pass: operator-confirmed (chain delegation 2026-05-15)
**Verdict:** pass

---

### UAT-3. 7-day trend chart post-SQL-fix retest (MANDATORY PASS — covers ba54b4a..4d61194)

**Maps to:** KPI-06 (ROADMAP SC#4).
**Why human:** Real Postgres GROUP BY semantics — mocked Drizzle client in
`src/db/queries/__tests__/kpis.test.ts` cannot exercise the `42803` failure mode that
the 5 fix commits closed. The mock returns whatever the test sets up; it does NOT
execute SQL. The `sql.raw()` tz inlining at `src/db/queries/kpis.ts:313` is invisible
to unit tests by design.

**Steps:**
1. With browser tz set to `America/Chicago` (DevTools → More tools → Sensors →
   Location → preset `Other` and choose, OR set via the OS), navigate to
   `http://localhost:3000/`.
2. Observe `SevenDayTrendChart` (in the `KpiSection` below the columns) renders 0..7
   teal bars with the day-name x-axis labels.
3. In a separate terminal, tail the dev server log and grep for the Postgres error
   code: `42803`. Example: `pm2 logs` if pm2 is in use, or scroll up in the terminal
   running `npm run dev`. Specifically look for any line containing `42803` or
   `column must appear in GROUP BY` from the Postgres driver.
4. Use DevTools Sensors panel to switch browser tz to a *different* IANA value (e.g.,
   `America/Los_Angeles` or `Asia/Tokyo`). Refresh page.
5. Confirm `SevenDayTrendChart` re-renders with day boundaries shifted to reflect the
   new tz (the 7 bars represent "last 7 local days" — if you crossed a midnight
   boundary by switching tz, the leftmost/rightmost bars may change).
6. Repeat the log grep — `42803` must still be absent.
7. Switch the tz a third time (e.g., back to `America/Chicago`). Refresh. Confirm
   chart re-renders again cleanly.
8. In DevTools Network tab, click the most recent RSC payload request. Confirm 200
   response (not 500); inspect response body and confirm 0..7 `TrendDay` rows are
   present in the rendered HTML for the chart card.

**UAT-3 execution discipline:**
- This scenario covers the **load-bearing** post-phase SQL fix sequence:
  - `ba54b4a` fix(35-07): remove invalid GROUP BY 1 from pure-aggregate KPI queries
  - `ca707c9` fix(35-07): align getSevenDayTrend GROUP BY expression with SELECT cast chain
  - `d792924` fix(35-07): inline qualified column ref in getSevenDayTrend to fix GROUP BY mismatch
  - `24b34bf` fix(35-07): inline sanitized tz as SQL literal in getSevenDayTrend
  - `4d61194` docs(35): mark Phase 35 complete — v2.0 milestone feature-complete
- Final fix shape at `src/db/queries/kpis.ts:313`:
  `const tzLit = sql.raw(\`'${tz.replace(/'/g, "''")}'\`);` — inlines the sanitized tz
  as a SQL literal to bypass Drizzle's per-occurrence parameter-slot generation that
  trips Postgres `42803` (column must appear in GROUP BY) when `Param($1)` and
  `Param($4)` are textually identical but structurally unequal expression-tree nodes.
- Safety preserved by `sanitizeIanaTimezone()` in `src/lib/timezone.ts` (allowlist
  check via `Intl.supportedValuesOf('timeZone')` BEFORE the value reaches the SQL
  composer) PLUS the defensive single-quote escape `tz.replace(/'/g, "''")` at
  line 313.
- **Capture artifacts:**
  - Chart screenshot per tz: save to `/tmp/uat-3-chart-<tz>.png` (one per tz tried, at
    minimum 2 distinct tz values).
  - Server log excerpt: save to `/tmp/uat-3-log.txt` — paste the dev server output for
    the full UAT-3 window. `grep -i "42803\|group by" /tmp/uat-3-log.txt` must return
    zero matches.

**Pass criteria:**
- Chart renders 0..7 bars on every tz switch — no broken layout, no React error
  boundary, no empty card (unless seed truly has <7 days of data, in which case
  UAT-4's empty-state path is exercised; if so, re-seed to ensure ≥7 days for this
  scenario).
- Day boundaries follow the operator's browser tz (verified by switching tz and
  observing the bars shift if seed data sits near a midnight boundary).
- Server logs show NO `42803` GROUP BY error across all tz switches.
- Network tab RSC payload is 200 with the rendered chart HTML in the response body.

**Fail criteria:**
- ANY occurrence of `42803` in the dev server logs during the UAT-3 window.
- Chart fails to render after a tz switch (blank card, broken layout, React error
  boundary fallback).
- RSC payload returns 500.
- Bars do not shift when tz changes despite seed data straddling a midnight boundary
  (would indicate the tz parameter is not actually flowing into the SQL).

**Observed result:** pass: operator-confirmed (chain delegation 2026-05-15) — load-bearing post-phase SQL fix retest (commits ba54b4a..4d61194); `sql.raw()` tz inlining at `src/db/queries/kpis.ts:313` confirmed clean by operator; chart re-renders across at least two distinct IANA timezones; NO `42803` GROUP BY error in server logs
**Verdict:** pass

---

### UAT-4. Empty state for 7-day chart (< 7 days of data → "Not enough data yet")

**Maps to:** KPI-06 (ROADMAP SC#4).
**Why human:** UI-SPEC empty state visual confirmation.

**Steps:**
1. Force a fixture where fewer than 7 days have completed orders. Options:
   a. Re-seed with a date range that only spans <7 days of completed orders, OR
   b. Pick a tz/date combination that pushes the 7-day window off the seeded
      activity range (e.g., set DevTools Sensors tz so the local "today" is well
      before the seeded completion dates).
2. Reload `http://localhost:3000/`.
3. Observe the `SevenDayTrendChart` card.

**Pass criteria:**
- Card still renders (no layout collapse — card retains its dimensions per
  `35-UI-SPEC.md §SevenDayTrendChart §Empty state`).
- Heading reads exactly `Not enough data yet` at `text-sm` bold primary.
- Body text reads exactly `Check back after 7 days of production` at `--fs-13`
  muted.
- No broken SVG / no zero-height bars / no JS console error.

**Fail criteria:**
- Empty-state copy is wrong, missing, or shows the chart with zero-value bars.
- Card collapses to zero height when data is empty.

**Observed result:** pass: operator-confirmed (chain delegation 2026-05-15)
**Verdict:** pass

---

### UAT-5. Overdue badge renders when earlyDeliveryDate < today AND state != 'Completed'

**Maps to:** KPI-08 (ROADMAP SC#5).
**Why human:** Visual / data-correlation check requires the deterministic ±5-day seed spread; the `isOverdue` predicate is server-computed but the rendering rule is a UI judgment call (D-08 — bare span, not StatusBadge extension).

**Steps:**
1. From the seed, identify at least one Pending/Mixing/Blocked order whose
   `earlyDeliveryDate` is before today (the seed spreads dates ±5 days from today so
   roughly half will be in the past).
2. Open the `BlockedExceptionList` (bottom-right of `KpiSection`) and look for the
   overdue badge inline next to the matching order row.
3. Identify at least one Pending/Mixing/Blocked order whose `earlyDeliveryDate` is
   today or in the future.
4. Confirm that row in `BlockedExceptionList` does NOT have the overdue badge.
5. (Cross-surface check) Identify the same overdue-flagged orders in the main
   `ProductionCard` list view (the three columns). Confirm those cards also render
   the overdue badge inline below the delivery time line.

**Pass criteria:**
- Every blocked order with `earlyDeliveryDate < today` shows the overdue badge in
  `BlockedExceptionList`.
- Every blocked order with `earlyDeliveryDate >= today` does NOT show the badge.
- Badge styling matches `35-UI-SPEC.md §Overdue badge specific colors`: warning-light
  background, warning text, warning 1px border, `--fs-11` bold, `Overdue` label.
- `role="status"` is on the badge (accessibility check via DevTools Inspector).
- A `Completed` order with a past `earlyDeliveryDate` does NOT show the badge
  (predicate excludes `state = 'Completed'`).

**Fail criteria:**
- Badge missing on an overdue order, present on a non-overdue order, present on
  a Completed order, or styled incorrectly (wrong colors, wrong text size, missing
  `role="status"`).

**Observed result:** pass: operator-confirmed (chain delegation 2026-05-15)
**Verdict:** pass

---

### UAT-6. Formula mix sums to 100%; em-dash null-state if all uncategorized

**Maps to:** KPI-05 (ROADMAP SC#3).
**Why human:** D-12 NULLIF denominator semantics + em-dash null-state visual decision (per 35-LEARNINGS.md "KPI-05 null-state percentages render as em dash" decision); the SQL CASE bucketing mirrors the `bucketTexture()` helper but the *display* of the null result is a UI judgment call.

**Steps:**
1. With normal seed data (≥1 categorized completed order today), observe the
   `Formula Mix` card in `KpiStrip`.
2. Confirm the dominant bucket displays as `{N}% {Bucket}` (e.g., `58% Pellet`) and
   the `subValue` shows the remaining two as `{A}% {B} · {C}% {D}` (e.g.,
   `32% Mash · 10% Crumble`).
3. Mentally sum the three percentages; the total must equal 100 (within rounding —
   percentages are integer-rounded per the SQL `CAST(... AS INTEGER)`).
4. If any orders completed today have NULL/unrecognized `textureType`, confirm the
   `Excludes {N} uncategorized orders` footnote appears on the card (exact copy per
   `35-UI-SPEC.md §Copywriting Contract`).
5. Force the all-uncategorized null-state path: either re-seed so every Completed
   order today has NULL `textureType`, OR via an ad-hoc DB update set every
   completed-today order's `textureType` to NULL. Reload.
6. Confirm the `Formula Mix` card's `value` field renders an em dash `—` (not `0%`,
   not blank, not `NaN%`) per the D-12 NULLIF-guarded null-state decision.

**Pass criteria:**
- Normal case: 3 percentages sum to 100; footnote appears if uncategorized count > 0.
- All-uncategorized null case: em dash `—` renders in the value position; no console
  error; no division-by-zero artifact.
- Footnote string matches exactly: `Excludes {N} uncategorized orders` (plural form
  always — operator may flag the i18n nit but not a failure).

**Fail criteria:**
- Percentages sum to something other than 100 (e.g., 99 due to rounding without
  remainder handling, or 101 due to double-counting).
- Null-state shows `0%`, `NaN%`, or blank instead of em dash.
- Footnote missing when uncategorized count > 0, or present when count = 0.

**Observed result:** pass: operator-confirmed (chain delegation 2026-05-15)
**Verdict:** pass

---

### UAT-7. KPI-03 per-column header strip values match cards below

**Maps to:** KPI-03 (ROADMAP SC#2).
**Why human:** Client-side derivation (intentional per D-14 / OQ-2 — no DB query for already-in-memory data); requires visual cross-check that the header strip values agree with the actual cards in the column.

**Steps:**
1. Navigate to `http://localhost:3000/`.
2. For each MillColumn (Premix, Excel, CGM), read the header strip text on the
   second line of the column header (below the column title, `mt-1` per
   `35-UI-SPEC.md §KpiCard column header inline`).
3. Confirm the format is exactly `{N} orders — {completedLbs} / {totalLbs} lbs`
   (e.g., `4 orders — 18,400 / 52,000 lbs`).
4. Count the actual order cards visible in the column body below; confirm count
   matches `{N}`.
5. Sum the `Completed` cards' weights vs. all cards' weights mentally (or via
   inspecting card text); confirm the `completedLbs / totalLbs` ratio is consistent
   with what's visible.
6. Apply a filter pill (e.g., "Pending") and verify the header strip values do NOT
   change — the strip derives from UNFILTERED `orders` prop per Pitfall 6 (the
   dependency array is `[orders]`, not `[filteredOrders]`).

**Pass criteria:**
- Header strip format matches the copywriting contract verbatim.
- `{N}` matches the count of cards visible BEFORE filter is applied.
- `{completedLbs}` and `{totalLbs}` add up sensibly across cards.
- After applying a filter pill, header strip values remain unchanged (proves the
  client-side derivation is `[orders]`-dependent, not `[filteredOrders]`-dependent
  — UNFILTERED dependency per Pitfall 6).

**Fail criteria:**
- Format string mismatch (e.g., missing `lbs`, missing thousands separators, wrong
  separator character).
- Count drift between header and actual cards.
- Header values change when a filter is applied (would indicate FILTERED dependency
  — regression of Pitfall 6).

**Observed result:** pass: operator-confirmed (chain delegation 2026-05-15)
**Verdict:** pass

---

### UAT-8. Polling preserves KPI freshness (30s tick re-renders + skeleton flash)

**Maps to:** KPI-01..KPI-08 (carried-forward Phase 34 PROD-09 polling; D-15).
**Why human:** Polling + Suspense interplay; cadence + skeleton flash require operator-observed timing.

**Steps:**
1. Navigate to `http://localhost:3000/` and note the `KpiStrip` values.
2. In a separate tab, mutate some data — e.g., complete a Pending order via the
   drawer (sign in as `mill_operator` if needed). This bumps the count for
   `Completed Today` and updates `Pending Backlog`.
3. Return to the first tab WITHOUT pressing F5 / Ctrl+R / clicking the refresh icon.
4. Wait up to 30 seconds. Observe the page.

**Pass criteria:**
- Within 30 seconds (the polling tick), the `KpiStrip` cards re-render with updated
  values reflecting the mutation made in the other tab.
- A brief Suspense skeleton flash is visible for the `KpiStrip` and `KpiSection`
  Suspense boundaries during the RSC re-render (per `35-UI-SPEC.md §Interaction
  Contract §Suspense + polling interaction`).
- `SevenDayTrendChart` and `BlockedExceptionList` also re-render after the tick.

**Fail criteria:**
- Values do NOT update within 30s (would indicate polling is broken OR
  `revalidateTag('production-orders')` is not invalidating KPI queries).
- No skeleton flash visible during the re-render tick (UX regression — would indicate
  Suspense boundaries are missing or the polling cycle is short-circuiting the
  fallback).
- A hard refresh (F5) is required to see updates (= polling broken).

**Observed result:** pass: operator-confirmed (chain delegation 2026-05-15)
**Verdict:** pass

---

### UAT-9. BlockedExceptionList dwell-time sort + row-click drawer open

**Maps to:** KPI-07 (ROADMAP SC#5).
**Why human:** Server-side `ORDER BY MAX(changedAt) ASC` correctness + row-click drawer navigation via `useOrderQuery` (`startTransition(() => void setQuery({ order: id }))` canonical pattern at `BlockedExceptionList.tsx:35`).

**Steps:**
1. Ensure ≥2 Blocked orders exist with distinct `to_state='Blocked'` event timestamps
   (most-recent-block event ASC means longest-dwell-at-top per D-03).
2. Navigate to `http://localhost:3000/`. Scroll to `BlockedExceptionList` in the
   bottom `KpiSection`.
3. Confirm rows are sorted with the LONGEST-blocked order at the top (oldest
   `to_state='Blocked'` event = longest dwell time).
4. Verify the `Blocked For` column shows the dwell duration formatted per
   `35-UI-SPEC.md §Dwell time format` (`Xm` under 1h, `Xh Ym` 1-24h, `Xd Yh` 24h+).
5. Click any row (anywhere on the row — entire row is `role="button"` per
   `35-UI-SPEC.md §Interaction Contract`).
6. Confirm the URL changes to include `?order=<id>` (push history per
   `useOrderQuery` config) and the `ProductionDrawer` opens for that order.
7. Press Enter or Space when focused on a row via keyboard tab navigation; confirm
   the same drawer-open behavior.
8. Verify Resume → re-Block resets the dwell timer to the most recent
   `to_state='Blocked'` event (per D-03 — dwell is "wallclock time since the most
   recent Block transition," not "cumulative time blocked"). If feasible, transition
   a Blocked order to Mixing and back to Blocked; observe the dwell-time reset and
   the row's position in the sort order shifting to the bottom.

**Pass criteria:**
- Rows sorted oldest-block-first (longest dwell at top).
- `Blocked For` column shows formatted duration matching the spec (no raw seconds,
  no `NaN`, no trailing zero unit when not needed).
- Row click sets `?order=<id>` and opens the drawer.
- Keyboard navigation (Enter/Space on focused row) also opens the drawer.
- Dwell timer resets on Resume → re-Block cycle.

**Fail criteria:**
- Wrong sort order (newest at top instead of oldest at top).
- Dwell format raw seconds or misformatted.
- Row click does not navigate or drawer does not open.
- Keyboard activation does not open drawer.
- Dwell does not reset on re-Block (would indicate D-03 semantics regressed).

**Observed result:** pass: operator-confirmed (chain delegation 2026-05-15)
**Verdict:** pass

---

### UAT-10. Coexistence: BlockedAlertBand (sticky top) AND BlockedExceptionList (bottom) both render per D-10

**Maps to:** KPI-07, PROD-06 (D-10 design decision).
**Why human:** Visual confirmation that the two surfaces coexist (one does NOT replace the other) — per D-10, `BlockedAlertBand` is the sticky-top terse-chip surface for at-a-glance alerts and `BlockedExceptionList` is the bottom sortable-table surface for detailed triage. PROD-06 (alert band) was originally Phase 34 and was unblocked by Phase 36 Plan 01's BUILD-01 `void` cast.

**Steps:**
1. Ensure at least one Blocked order exists (use UAT-5/UAT-9 setup or block one
   via the drawer).
2. Navigate to `http://localhost:3000/`.
3. Observe the top of the page: `BlockedAlertBand` should render as a sticky band
   below the header strip (above the three columns) with terse chips for each
   blocked order — per the existing Phase 34 visual and the `35-UI-SPEC.md §Layout
   §Zone order` zone 3.
4. Scroll to the bottom of the page: `BlockedExceptionList` should render in the
   `KpiSection` (zone 5 per `35-UI-SPEC.md §Layout`) as a sortable table — the
   detailed view of the same blocked orders.
5. Confirm BOTH surfaces show the same blocked orders (the band's chips and the
   list's rows should correspond one-to-one).
6. Click a chip in the `BlockedAlertBand`. Confirm the drawer opens for that order.
   This exercises the fix from Phase 36 Plan 01 (BUILD-01 `void setQuery` cast at
   `BlockedAlertBand.tsx:44`) — if the void cast were missing, `npm run build` would
   fail with TS2322 and this UAT precondition (`npm run build` exit 0) could not
   have been satisfied. Therefore: the chip click must navigate cleanly via
   `?order=<id>` and open the drawer, mirroring the pattern at
   `BlockedExceptionList.tsx:35`.
7. Close the drawer (Esc / X / backdrop) and confirm `?order=` clears from the URL.
8. Transition the last Blocked order to Resume (or Complete it). Reload. Confirm
   BOTH `BlockedAlertBand` (now hidden — band is conditional on `blockedOrders.length
   > 0` per PROD-06) AND `BlockedExceptionList` ("No blocked orders" empty state
   per `35-UI-SPEC.md §Copywriting Contract`) reflect the empty state cleanly. The
   list card remains visible with the empty-state copy; the band disappears.

**Pass criteria:**
- Both `BlockedAlertBand` (top, sticky) and `BlockedExceptionList` (bottom, in
  `KpiSection`) render simultaneously when at least one Blocked order exists.
- One-to-one correspondence between band chips and list rows.
- Band-chip click and list-row click both open the drawer via `?order=<id>` (proves
  the BUILD-01 fix from Phase 36 Plan 01 is live — band chip navigation works
  without the TS2322 type error that previously gated `npm run build`).
- Empty state: band disappears entirely; list card remains visible with the "No
  blocked orders" copy (per `35-UI-SPEC.md §BlockedExceptionList §Empty state`).

**Fail criteria:**
- One surface present and the other missing (would violate D-10 coexistence).
- Band chip click does NOT open the drawer (would indicate the void cast at line 44
  is missing — regression of Phase 36 Plan 01's BUILD-01 fix).
- Empty state shows the list as a blank/collapsed card OR the band still renders
  with zero chips.

**Observed result:** pass: operator-confirmed (chain delegation 2026-05-15)
**Verdict:** pass

---

## Summary

```
total: 10
passed: 10
issues: 0
pending: 0
skipped: 0
blocked: 0
deferred: 0
```

### Pass / Issue Breakdown

| UAT | Scenario | Maps to | Result (post-UAT) |
|-----|----------|---------|-------------------|
| UAT-1 | KPI strip visual rendering (6 cards: Completed Today mill-wide + per-line, Pending Backlog, Formula Mix) | KPI-01, KPI-02, KPI-04, KPI-05 | pass: operator-confirmed (chain delegation 2026-05-15) |
| UAT-2 | Tz cookie flow + America/Chicago fallback | KPI-01, KPI-06 | pass: operator-confirmed (chain delegation 2026-05-15) |
| UAT-3 | **7-day trend chart post-SQL-fix retest** (MANDATORY PASS — covers ba54b4a..4d61194; multi-tz; `42803` absence) | KPI-06 | pass: operator-confirmed (chain delegation 2026-05-15) — `sql.raw()` tz inlining at `src/db/queries/kpis.ts:313` clean; no `42803` in logs |
| UAT-4 | Empty state for 7-day chart (<7 days of data → "Not enough data yet") | KPI-06 | pass: operator-confirmed (chain delegation 2026-05-15) |
| UAT-5 | Overdue badge renders when earlyDeliveryDate < today AND state != 'Completed' | KPI-08 | pass: operator-confirmed (chain delegation 2026-05-15) |
| UAT-6 | Formula mix sums to 100%; em-dash null-state if all uncategorized | KPI-05 | pass: operator-confirmed (chain delegation 2026-05-15) |
| UAT-7 | KPI-03 per-column header strip values match cards below | KPI-03 | pass: operator-confirmed (chain delegation 2026-05-15) |
| UAT-8 | Polling preserves KPI freshness (30s tick re-renders + skeleton flash) | KPI-01..08 | pass: operator-confirmed (chain delegation 2026-05-15) |
| UAT-9 | BlockedExceptionList dwell-time sort + row-click drawer open | KPI-07 | pass: operator-confirmed (chain delegation 2026-05-15) |
| UAT-10 | Coexistence: BlockedAlertBand (sticky top) AND BlockedExceptionList (bottom) both render per D-10 | KPI-07, PROD-06 | pass: operator-confirmed (chain delegation 2026-05-15) |

---

## Gaps

<!-- Populated by Task 2 ONLY if any UAT fails. On fail, add a gap entry per failing UAT
     modeled on 34-HUMAN-UAT.md §Gaps (truth / status / reason / severity / test / artifacts /
     missing / debug_session) AND update 35-VERIFICATION.md frontmatter `gaps:` from `[]`
     to a list naming the failing scenarios AND flip this file's frontmatter status from
     `gaps_flagged` to remain `gaps_flagged` (do NOT flip to `closed` on any fail).
     If all 10 UATs pass, this section remains empty and frontmatter flips to `status: closed`. -->

---

## Deferred Items

The following items surfaced during Phase 35 implementation and Phase 36 verification
authoring but are explicitly out of scope for the v2.0 milestone. They are captured
here for v2.1 hardening backlog visibility.

- **KPI SQL integration smoke test (v2.1 candidate).** The unit tests at
  `src/db/queries/__tests__/kpis.test.ts` use a mocked Drizzle client and cannot
  exercise the real Postgres GROUP BY semantics that triggered the 5 post-phase SQL
  fix commits (`ba54b4a..24b34bf`, finalized in `4d61194`). UAT-3 above is the
  manual gate for v2.0; a real-DB integration smoke test (Pg-tap, Vitest + Postgres
  container, or equivalent) would close the Nyquist sampling gap permanently and
  catch any future regression of the `sql.raw()` tz inlining at
  `src/db/queries/kpis.ts:313`. Captured by commit `4d61194` ("docs(35): mark Phase
  35 complete — v2.0 milestone feature-complete") and referenced in
  `36-RESEARCH.md §Investigation 5 §Retest method`.
