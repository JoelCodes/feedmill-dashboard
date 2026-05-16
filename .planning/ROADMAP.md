# Roadmap: CGM Dashboard

## Milestones

- ✅ **v1.0 MVP** — Phases 0-5 (shipped 2026-04-28)
- ✅ **v1.1 Mill Production Dashboard** — Phases 6-9 (shipped 2026-04-29)
- ✅ **v1.2 Customers Page** — Phases 10-15 (shipped 2026-05-06)
- ✅ **v1.3 Design Hardening** — Phases 16-19 (shipped 2026-05-09)
- ✅ **v1.4 Auth with Clerk** — Phases 20-24 (shipped 2026-05-10)
- ✅ **v1.5 Production Transition** — Phases 25-30 (shipped 2026-05-12)
- 🔄 **v2.0 Mill Production MVP** — Phases 31-37 (audit re-run passed_with_warnings 2026-05-16; ship gated on Phase 37 hygiene cleanup)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 0-5) — SHIPPED 2026-04-28</summary>

See [`milestones/v1.0-ROADMAP.md`](./milestones/v1.0-ROADMAP.md) for phase-level details.

</details>

<details>
<summary>✅ v1.1 Mill Production Dashboard (Phases 6-9) — SHIPPED 2026-04-29</summary>

See [`milestones/v1.1-ROADMAP.md`](./milestones/v1.1-ROADMAP.md) for phase-level details.

</details>

<details>
<summary>✅ v1.2 Customers Page (Phases 10-15) — SHIPPED 2026-05-06</summary>

See [`milestones/v1.2-ROADMAP.md`](./milestones/v1.2-ROADMAP.md) for phase-level details.

</details>

<details>
<summary>✅ v1.3 Design Hardening (Phases 16-19) — SHIPPED 2026-05-09</summary>

See [`milestones/v1.3-ROADMAP.md`](./milestones/v1.3-ROADMAP.md) for phase-level details.

</details>

<details>
<summary>✅ v1.4 Auth with Clerk (Phases 20-24) — SHIPPED 2026-05-10</summary>

See [`milestones/v1.4-ROADMAP.md`](./milestones/v1.4-ROADMAP.md) for phase-level details.

</details>

<details>
<summary>✅ v1.5 Production Transition (Phases 25-30) — SHIPPED 2026-05-12</summary>

- [x] Phase 25: Foundation and Middleware Configuration (2/2 plans) — completed 2026-05-11
- [x] Phase 26: Route Restructuring and Migration (3/3 plans) — completed 2026-05-11
- [x] Phase 27: Role Assignment and Testing (5/5 plans) — completed 2026-05-12
- [x] Phase 28: Client Component Security Audit (6/6 plans) — completed 2026-05-12
- [x] Phase 29: Close gap — ROUTE-01 cleanup (6/6 plans) — completed 2026-05-12
- [x] Phase 30: Close gap — INT-07 + SUMMARY frontmatter backfill (2/2 plans) — completed 2026-05-12

See [`milestones/v1.5-ROADMAP.md`](./milestones/v1.5-ROADMAP.md) for phase-level details.

</details>

<details open>
<summary>🔄 v2.0 Mill Production MVP (Phases 31-37) — AUDIT RE-RUN PASSED_WITH_WARNINGS; SHIP GATED ON PHASE 37</summary>

- [x] **Phase 31: Role Expansion and DB Infrastructure** — Add `mill_operator` role, provision Neon Postgres, establish server-only Drizzle client
- [x] **Phase 32: Schema, Migrations, and Seed Data** — Define all four tables, generate and apply migrations, load Book1.xlsx fixtures
- [x] **Phase 33: Server Actions, Queries, and Bulk Import** — Write query functions and all server actions (transitions + XLSX import)
- [x] **Phase 34: Production Dashboard UI and Homepage Promotion** — Replace Coming Soon with live DB-backed mill dashboard at `/`
- [x] **Phase 35: KPI Sections and Role-Specific Metrics** — Operator column stats, supervisor exception views, manager throughput KPIs
- [x] **Phase 36: Close gap — BUILD-01 void cast + Phase 35 verification** — Closed BUILD-01 (`npm run build` 0); authored 35-VERIFICATION.md + 35-UAT.md; re-classified 35-VALIDATION.md to complete

</details>

## Phase Details

### Phase 31: Role Expansion and DB Infrastructure

**Goal**: The `mill_operator` role is defined and enforced; a server-only Drizzle/Neon DB client exists and passes a clean build with no Edge-runtime contamination.
**Depends on**: Phase 30 (v1.5 complete); quick task 260512-kfy `roles[]` refactor already merged
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, DATA-01, DATA-08
**Success Criteria** (what must be TRUE):

  1. `'mill_operator'` is a member of the `Role` union; TypeScript compiles clean with `tsc --noEmit`
  2. An authenticated user without `mill_operator` sees `/` in read-only mode (edit affordances hidden); mutating server actions (Phase 33) reject without `mill_operator`.
  3. `src/db/index.ts` exists with `import 'server-only'` as line 1; `next build` completes with no Edge-bundle errors
  4. `DATABASE_URL` (pooled) and `DATABASE_URL_UNPOOLED` (direct) set in `.env.local`; `drizzle.config.ts` references `DATABASE_URL_UNPOOLED` for migrations. Vercel env-var provisioning deferred to Phase 34 first deploy.
  5. `docs/clerk-setup.md` runbook updated with `mill_operator` test user assignment and JWT template verification

**Plans**: 5 plans

- [x] 31-01-PLAN.md — Role union + `checkRole` helper + test fixtures + REQUIREMENTS/ROADMAP edits (per D-15/D-16/D-17)
- [x] 31-02-PLAN.md — Drizzle/Neon install + `drizzle.config.ts` + `src/db/{index,schema}.ts` + `.env.example`
- [x] 31-03-PLAN.md — Playwright auth-mill-operator project + smoke spec + `docs/clerk-setup.md` runbook
- [x] 31-04-PLAN.md — `src/app/page.tsx` async RSC rewrite + `<MillReadOnlyStub>` + page tests
- [x] 31-05-PLAN.md — Operator runbook execution (Neon + Clerk Dashboard) + canonical verification gate

---

### Phase 32: Schema, Migrations, and Seed Data

**Goal**: All four Drizzle tables are defined in code, their migrations are generated and applied to the development database, and the database is pre-populated with Book1.xlsx example data so development mirrors the demo baseline.
**Depends on**: Phase 31
**Requirements**: DATA-02, DATA-03, DATA-04, DATA-05, DATA-06, DATA-07
**Success Criteria** (what must be TRUE):

  1. `production_orders`, `order_events`, `import_batches`, and `users` tables exist in the development Postgres database as verified by `drizzle-kit introspect` or a direct SQL query
  2. `version INTEGER DEFAULT 1` column is present on `production_orders`; `clerk_user_id TEXT` has no foreign key constraint
  3. SQL migration files exist under `drizzle/migrations/` and `drizzle-kit migrate` can be re-run from scratch against an empty DB to reproduce the same schema
  4. Running the seed script populates the database with the 33 Book1.xlsx example orders, matching the row count and field values from the existing mock service
  5. `drizzle-kit push` is not used; the migration discipline (generate + migrate) is in place

**Plans**: 6 plans

- [x] 32-01-PLAN.md — Four Drizzle pgTable modules (orders, events, imports, users) + barrel + Wave-0 schema tests (DATA-02..05)
- [x] 32-02-PLAN.md — D-04 type rewrite: rename ProductionOrder → DemoOrder, export mockOrders, update all demo consumers
- [x] 32-03-PLAN.md — Update drizzle.config.ts schema path to barrel + delete src/db/schema.ts placeholder
- [x] 32-04-PLAN.md — drizzle-kit generate + operator review + drizzle-kit migrate against Neon dev DB (DATA-06, BLOCKING)
- [x] 32-05-PLAN.md — scripts/export-seed.ts + src/db/seed-data.json (33-row JSON snapshot, TDD)
- [x] 32-06-PLAN.md — tsx devDep + db:seed script + src/db/seed.ts runtime with TRUNCATE protecting users (DATA-07)

---

### Phase 33: Server Actions, Queries, and Bulk Import

**Goal**: All data mutations and reads are implemented as typed server functions; status transitions are enforced by the directed state machine with optimistic concurrency; bulk XLSX import parses, validates, and persists data with row-level error reporting.
**Depends on**: Phase 32
**Requirements**: TRANS-01, TRANS-02, TRANS-03, TRANS-04, TRANS-05, TRANS-06, TRANS-07, IMPORT-01, IMPORT-02, IMPORT-03, IMPORT-04, IMPORT-05, IMPORT-06, IMPORT-07
**Success Criteria** (what must be TRUE):

  1. An operator can transition an order through Pending → Mixing → Completed and each transition writes an `order_events` row with `from_state`, `to_state`, `changed_by`, and `changed_at`
  2. When two operators attempt the same transition simultaneously, exactly one succeeds and the other receives the "Order was modified by another user. Please refresh." error (optimistic concurrency via `version` column)
  3. An operator can mark any active order Blocked (with a required free-text reason) and resume it to Mixing or Pending
  4. Every server action that mutates data calls `revalidateTag('production-orders')` before returning; the UI reflects the new state without a manual hard refresh
  5. An operator can upload a Book1.xlsx-format file; the preview screen shows row count, total weight, and any duplicates before commit; confirmed imports appear in the `import_batches` log; files above 2 MB are rejected client-side with a clear error message

**Plans**: 11 plans (6 in-scope + 5 gap-closure)

- [x] 33-01-PLAN.md — Install read-excel-file@9.0.9 + lock zod in dependencies + add experimental.serverActions.bodySizeLimit (IMPORT-07)
- [x] 33-02-PLAN.md — src/db/queries/{orders,events}.ts with unstable_cache wrappers tagged production-orders (read-layer for transitions + Phase 34)
- [x] 33-03-PLAN.md — productionOrderImportSchema (Zod) covering D-14/D-15/D-16 row contract (IMPORT-02 validator surface)
- [x] 33-04-PLAN.md — Four transition server actions (transitionToMixing/completeOrder/blockOrder/resumeFromBlocked) with optimistic-concurrency + audit-trail + revalidateTag (TRANS-01..07)
- [x] 33-05-PLAN.md — previewImportAction with 3-layer file-size guard + read-excel-file/node parse + Zod validate + intra-file + DB duplicate detection (IMPORT-01, 02, 03, 07)
- [x] 33-06-PLAN.md — commitImportAction with re-parse + per-row insert/overwrite loop + [OVERWRITE] event note + import_batches row on success (IMPORT-04, 05, 06)
- [x] 33-07-PLAN.md — Gap closure: live-DB XLSX import harness against Book1.xlsx + npm script test:xlsx-import (closes GAP-03)
- [x] 33-08-PLAN.md — Gap closure: concurrent-transition race harness asserting exactly-one-winner + locked conflict message (closes GAP-01)
- [x] 33-09-PLAN.md — Gap closure: GAP-02 deferred to Phase 34 with concrete inherited UAT step + 34-INHERITED-UAT.md hand-off file
- [x] 33-10-PLAN.md — Gap closure: guard parserErrors iteration in parseAndValidate when read-excel-file v9.0.9 returns errors:undefined (closes GAP-04)
- [x] 33-11-PLAN.md — Gap closure: migrate readXlsxFile→readSheet to match read-excel-file v9.0.9 schema-aware API; closes GAP-05 and unblocks GAP-03 Task 3

---

### Phase 34: Production Dashboard UI and Homepage Promotion

**Goal**: The Coming Soon homepage at `/` is replaced by a live, DB-backed mill production dashboard; filter and search state are URL-synced; the 30-second polling loop keeps data fresh; and the sidebar shows production navigation for the `/` route.
**Depends on**: Phase 33
**Requirements**: PROD-01, PROD-02, PROD-03, PROD-04, PROD-05, PROD-06, PROD-07, PROD-08, PROD-09, PROD-10, PROD-11
**Success Criteria** (what must be TRUE):

  1. An authenticated `mill_operator` visiting `/` sees the three-column mill production dashboard (Premix / Excel / CGM) populated from live database data, not mock data; unauthenticated users are redirected to `/sign-in`
  2. Status filter pills (Pending, Mixing, Completed, Blocked) and the search box update the URL (`?status=`, `?q=`) and survive a hard page reload with the same filter state applied
  3. Clicking an order card opens the order details panel showing all order fields and the full transition history from `order_events`; the blocked alert band lists all currently-blocked orders; each column shows a "next-up" highlight on the topmost Pending order and an in-progress badge on every Mixing order
  4. The dashboard auto-refreshes every 30 seconds; a last-updated timestamp and manual refresh control are visible in the header strip; loading skeletons appear while data is fetching
  5. The sidebar shows production navigation (not "Coming Soon") when the current route is `/`; the demo namespace at `/demo/*` is unchanged

**Plans**: 12 plans (7 in-scope + 5 gap-closure)

- [x] 34-01-PLAN.md — Foundation: install nuqs+Radix Dialog, NuqsAdapter wiring, search-params lib, StatusBadge extension, Sidebar/Header production nav, D-21 commitImportAction patch, MillReadOnlyStub deletion + transitional page.tsx (PROD-01, PROD-03..06)
- [x] 34-02-PLAN.md — useProductionPolling hook (TDD red/green 30s + cleanup, exports REFRESH_INTERVAL_MS) — PROD-09
- [x] 34-03-PLAN.md — getImportBatches cached query + ColumnSkeleton + DrawerSkeleton + LastUpdatedChip + BlockedAlertBand (PROD-06, PROD-10, PROD-11)
- [x] 34-04-PLAN.md — production-derivations pure helpers (TDD) + ProductionCard + MillColumn (PROD-02, PROD-07, PROD-08)
- [x] 34-05-PLAN.md — ProductionDashboard client wrapper composing filters/search/polling/blocked band/columns (PROD-02, PROD-03, PROD-04, PROD-06, PROD-09, PROD-10, PROD-11)
- [x] 34-06-PLAN.md — ProductionDrawer + TransitionButtons + BlockReasonModal + DrawerCloseHandlers + dashboard drawer wiring (PROD-05)
- [x] 34-07-PLAN.md — Page rewrites (/, /import) + ImportFlow + ImportHistoryTable + manual UAT incl. Inherited GAP-02 (PROD-01, PROD-02, PROD-05, PROD-10)
- [x] 34-08-PLAN.md — Gap closure T3: remove Header dead search input + full-route regression test (PROD-03, PROD-04)
- [x] 34-09-PLAN.md — Gap closure T9a + T9b: hydrate batches.importedAt in ImportFlow + router.refresh on commit success + regression tests (IMPORT-04..06)
- [x] 34-10-PLAN.md — Gap closure T10a (D-11 amendment): TransitionButtons Pending case adds Block Order trigger + PATTERNS.md/CONTEXT.md D-11 amendment + tests (PROD-05, TRANS-03)
- [x] 34-11-PLAN.md — Gap closure T10b: split nuqs `order` key with shallow:false + history:'push' + startTransition wrapping; preserves shallow status/q for snappy filter/search (PROD-05, PROD-10)
- [x] 34-12-PLAN.md — Gap closure T12: wire router.refresh() on transition action success paths + BlockReasonModal success path; reduces cross-tab latency 15s → ~1s (PROD-05, TRANS-07)

**UI hint**: yes

---

### Phase 35: KPI Sections and Role-Specific Metrics

**Goal**: Computed KPI cards and metric sections are visible in the dashboard, all aggregated server-side from real database data, closing the KPI deferral carried since v1.0.
**Depends on**: Phase 34
**Requirements**: KPI-01, KPI-02, KPI-03, KPI-04, KPI-05, KPI-06, KPI-07, KPI-08
**Success Criteria** (what must be TRUE):

  1. A mill-wide "tons completed today" KPI card displays the correct aggregate from the database; per-line (Premix / Excel / CGM) ton breakdowns are shown alongside it
  2. Each column header strip shows the current order count and the ratio of completed weight to total weight (e.g., "4 of 12 orders — 18,400 / 52,000 lbs")
  3. A pending backlog KPI card shows the count and total weight of all Pending orders; a formula mix breakdown shows Pellet / Mash / Crumble percentages for today's completed orders
  4. A 7-day order volume trend (bar or sparkline) is rendered from DB data; if fewer than 7 days of data exist, the component shows a "Not enough data yet" empty state rather than a broken chart
  5. A cross-column exception list surfaces every currently-blocked order sortable by dwell time; orders past their `earlyDeliveryDate` carry a warning badge in list view

**Plans**: 7 plans

- [ ] 35-01-PLAN.md — Schema column + Drizzle migration + seed backfill + makeOrder fixture propagation (D-04, D-06) [BLOCKING migrate gate]
- [ ] 35-02-PLAN.md — Import path extension: productionOrderImportSchema + commitImportAction insert/overwrite (D-05, Pitfall 7)
- [ ] 35-03-PLAN.md — TDD pure helpers: bucketTexture (D-11/D-12) + formatDwell (UI-SPEC dwell format)
- [ ] 35-04-PLAN.md — TDD KPI query layer: getKpiStrip + getSevenDayTrend + getBlockedWithDwell + sanitizeIanaTimezone (D-14, Pitfall 2)
- [ ] 35-05-PLAN.md — Presentational primitives: KpiCard + KpiStrip + TzBootstrap; DELETE legacy KPICard.tsx (D-07 zone 1, D-08)
- [ ] 35-06-PLAN.md — SevenDayTrendChart + BlockedExceptionList + KpiSection layout (D-07 zone 3, D-10, D-13)
- [ ] 35-07-PLAN.md — RSC integration: page.tsx tz cookie + KPI fan-out + ProductionDashboard zone wiring + MillColumn summary prop + Manual UAT (D-02, D-07, Pitfall 6) [checkpoint]

**UI hint**: yes

---

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 25. Foundation and Middleware Configuration | v1.5 | 2/2 | Complete | 2026-05-11 |
| 26. Route Restructuring and Migration | v1.5 | 3/3 | Complete | 2026-05-11 |
| 27. Role Assignment and Testing | v1.5 | 5/5 | Complete | 2026-05-12 |
| 28. Client Component Security Audit | v1.5 | 6/6 | Complete | 2026-05-12 |
| 29. Close gap: ROUTE-01 cleanup | v1.5 | 6/6 | Complete | 2026-05-12 |
| 30. Close gap: INT-07 + SUMMARY backfill | v1.5 | 2/2 | Complete | 2026-05-12 |
| 31. Role Expansion and DB Infrastructure | v2.0 | 5/5 | Complete    | 2026-05-13 |
| 32. Schema, Migrations, and Seed Data | v2.0 | 7/7 | Complete    | 2026-05-13 |
| 33. Server Actions, Queries, and Bulk Import | v2.0 | 11/11 | Complete    | 2026-05-14 |
| 34. Production Dashboard UI and Homepage Promotion | v2.0 | 12/12 | Complete   | 2026-05-14 |
| 35. KPI Sections and Role-Specific Metrics | v2.0 | 7/7 | Complete    | 2026-05-15 |
| 36. Close gap: BUILD-01 void cast + Phase 35 verification | v2.0 | 5/5 | Complete   | 2026-05-16 |

_Phases 0-24 archived to their respective milestone files in [`milestones/`](./milestones/)._

### Phase 36: Close gap: BUILD-01 void cast + Phase 35 verification

**Goal:** Close the two blockers identified by the v2.0 milestone re-audit so v2.0 (Mill Production MVP) can ship: (1) fix the `npm run build` TypeScript error at `src/components/BlockedAlertBand.tsx:44` (missing `void` cast on `nuqs setQuery` inside `startTransition`), and (2) produce the Phase 35 verification artifacts (`35-VERIFICATION.md` + `35-UAT.md`) so KPI-01..KPI-08 reach satisfied status and `35-VALIDATION.md` can be re-classified from `draft` → `complete`.
**Depends on:** Phase 35
**Requirements**: KPI-01, KPI-02, KPI-03, KPI-04, KPI-05, KPI-06, KPI-07, KPI-08, PROD-06
**Success Criteria** (what must be TRUE):

  1. ✅ `npm run build` exits 0 — the `BlockedAlertBand.tsx:44` `startTransition` callback no longer leaks the `nuqs setQuery` `Promise<URLSearchParams>` return; the pattern matches `BlockedExceptionList.tsx:35`'s `void` cast.
  2. ✅ A regression test (or extended existing test in `BlockedAlertBand.test.tsx`) covers the void-cast path so the type/return-shape regression cannot silently re-land; `npm test -- BlockedAlertBand` exits 0.
  3. ✅ `35-VERIFICATION.md` exists at the phase root with goal-backward analysis covering all 7 plans (35-01..35-07) and all 8 KPI-* requirements; each KPI-* row has a `satisfied` verdict with code-evidence citations.
  4. ✅ `35-UAT.md` exists at the phase root with a written human-UAT pass record covering: KPI strip visual rendering, tz cookie flow (incl. fallback when cookie missing), 7-day trend chart post-SQL-fix retest (covers commits `ba54b4a..4d61194`), overdue badge rendering, and the formula-mix breakdown card.
  5. ✅ `35-VALIDATION.md` frontmatter is updated to `status: complete`, `nyquist_compliant: true`, `wave_0_complete: true` — re-classified after Wave-0 test confirmation (`npm test -- kpis`) and human UAT.
  6. ✅ STATE.md and ROADMAP.md reflect Phase 36 complete and v2.0 milestone shippable (gaps closed); `gsd-sdk query roadmap.get-phase 36 --pick goal` returns the canonical goal text, not `[To be planned]`. *(milestone ship indicator gated on operator audit re-run choice — Task 2)*

**Plans:** 5/5 plans complete

Plans:
**Wave 1**

- [x] 36-01-PLAN.md — TDD void-cast fix at BlockedAlertBand.tsx:44 (BUILD-01 closure)
- [x] 36-02-PLAN.md — Author 35-VERIFICATION.md (goal-backward, 8/8 KPI satisfied)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 36-03-PLAN.md — Author 35-UAT.md skeleton + execute 10 UAT scenarios + sync VERIFICATION retest_outcome

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 36-04-PLAN.md — Re-classify 35-VALIDATION.md to complete (Nyquist gates green)

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 36-05-PLAN.md — STATE/ROADMAP hygiene + operator audit re-run gate

---

### Phase 37: v2.0.1 hygiene cleanup (close audit warnings before ship)

**Goal:** Close the 5 cross-phase hygiene items flagged by the v2.0 post-Phase-36 audit (`status: passed_with_warnings`) so the v2.0 ship indicator can flip to ✅ on a clean audit trail. All 45 v2.0 requirements are already SATISFIED per VERIFICATION.md tables; this phase is documentation/traceability hygiene only — no functional code changes expected.
**Depends on:** Phase 36
**Requirements**: (none — hygiene phase; touches metadata/docs not requirements)
**Success Criteria** (what must be TRUE):
  1. SUMMARY.md frontmatter `requirements-completed` field is populated for every plan in Phases 31-35 (~22 of 45 reqs currently untraced); each REQ-ID listed in a plan's frontmatter MUST appear in the corresponding VERIFICATION.md SATISFIED table.
  2. REQUIREMENTS.md traceability table — all 45 status cells reflect actual VERIFICATION.md outcomes (currently all read "Pending" despite SATISFIED status); use `[x]`/Done markers consistent with v1.5 INT-07 pattern.
  3. `33-HUMAN-UAT.md` Test #2 closure note amended per `34-INHERITED-UAT.md:62-65` protocol: `result: deferred_to_phase_34` → `result: closed_in_phase_34 (pass, 2026-05-14, Phase 34 T12)`; file-level frontmatter `status: resolved` → `status: gaps_closed` (closes INT-02).
  4. `35-LEARNINGS.md` frontmatter `missing_artifacts` field cleared (currently lists `35-VERIFICATION.md` + `35-UAT.md` — both authored by Phase 36 Plans 02-03 and now exist).
  5. v2.0-MILESTONE-AUDIT.md re-run after Phase 37 returns `passed` (no warnings); ship indicator flips to ✅ + `(shipped 2026-MM-DD)`.

**Plans:** 5 plans

Plans:
**Wave 1** *(parallel — 4 plans, zero file overlap)*

- [ ] 37-01-PLAN.md — Backfill `requirements-completed:` in 22 SUMMARYs across Phases 31-35 (W1; 7 RENAME + 15 ADD; atomic commit; mirrors v1.5 Plan 30-02)
- [ ] 37-02-PLAN.md — Flip 45 v2.0 requirement checkboxes + 45 traceability cells to `[x]` / `Complete` in REQUIREMENTS.md (W2; uses v1.5 INT-07 verbatim format)
- [ ] 37-03-PLAN.md — Amend 33-HUMAN-UAT.md Test #2 closure per 34-INHERITED-UAT.md:62-66 protocol (W3; closes INT-02)
- [ ] 37-04-PLAN.md — Clear stale `missing_artifacts:` in 35-LEARNINGS.md (W4; pre-flight `ls` confirms artifact existence)

**Wave 2** *(sequential — depends on Wave 1 commits landing first)*

- [ ] 37-05-PLAN.md — Audit re-run + ROADMAP/STATE ship-indicator flip (W5; `checkpoint:human-action` + `auto`; gated on `status: passed`)

---
*Last updated: 2026-05-16 — v2.0 audit re-run complete (passed_with_warnings). Both pre-Phase-36 blockers closed. Operator chose to defer ship indicator until Phase 37 closes the 5 hygiene warnings (mirrors v1.5 Phase 30 INT-07 pattern). 2 v2.1 backlog candidates captured: KPI SQL integration smoke tests; `/api/revalidate?tag=production-orders` POST endpoint for seed/dev-cache invalidation.*
