# Roadmap: CGM Dashboard

## Milestones

- ✅ **v1.0 MVP** — Phases 0-5 (shipped 2026-04-28)
- ✅ **v1.1 Mill Production Dashboard** — Phases 6-9 (shipped 2026-04-29)
- ✅ **v1.2 Customers Page** — Phases 10-15 (shipped 2026-05-06)
- ✅ **v1.3 Design Hardening** — Phases 16-19 (shipped 2026-05-09)
- ✅ **v1.4 Auth with Clerk** — Phases 20-24 (shipped 2026-05-10)
- ✅ **v1.5 Production Transition** — Phases 25-30 (shipped 2026-05-12)
- 🔄 **v2.0 Mill Production MVP** — Phases 31-35 (in progress)

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
<summary>🔄 v2.0 Mill Production MVP (Phases 31-35) — IN PROGRESS</summary>

- [ ] **Phase 31: Role Expansion and DB Infrastructure** — Add `mill_operator` role, provision Neon Postgres, establish server-only Drizzle client
- [ ] **Phase 32: Schema, Migrations, and Seed Data** — Define all four tables, generate and apply migrations, load Book1.xlsx fixtures
- [ ] **Phase 33: Server Actions, Queries, and Bulk Import** — Write query functions and all server actions (transitions + XLSX import)
- [ ] **Phase 34: Production Dashboard UI and Homepage Promotion** — Replace Coming Soon with live DB-backed mill dashboard at `/`
- [ ] **Phase 35: KPI Sections and Role-Specific Metrics** — Operator column stats, supervisor exception views, manager throughput KPIs

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
**Plans**: 7 plans
- [x] 34-01-PLAN.md — Foundation: install nuqs+Radix Dialog, NuqsAdapter wiring, search-params lib, StatusBadge extension, Sidebar/Header production nav, D-21 commitImportAction patch, MillReadOnlyStub deletion + transitional page.tsx (PROD-01, PROD-03..06)
- [x] 34-02-PLAN.md — useProductionPolling hook (TDD red/green 30s + cleanup, exports REFRESH_INTERVAL_MS) — PROD-09
- [x] 34-03-PLAN.md — getImportBatches cached query + ColumnSkeleton + DrawerSkeleton + LastUpdatedChip + BlockedAlertBand (PROD-06, PROD-10, PROD-11)
- [x] 34-04-PLAN.md — production-derivations pure helpers (TDD) + ProductionCard + MillColumn (PROD-02, PROD-07, PROD-08)
- [x] 34-05-PLAN.md — ProductionDashboard client wrapper composing filters/search/polling/blocked band/columns (PROD-02, PROD-03, PROD-04, PROD-06, PROD-09, PROD-10, PROD-11)
- [x] 34-06-PLAN.md — ProductionDrawer + TransitionButtons + BlockReasonModal + DrawerCloseHandlers + dashboard drawer wiring (PROD-05)
- [ ] 34-07-PLAN.md — Page rewrites (/, /import) + ImportFlow + ImportHistoryTable + manual UAT incl. Inherited GAP-02 (PROD-01, PROD-02, PROD-05, PROD-10)
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
**Plans**: TBD
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
| 34. Production Dashboard UI and Homepage Promotion | v2.0 | 6/7 | In Progress|  |
| 35. KPI Sections and Role-Specific Metrics | v2.0 | 0/? | Not started | - |

_Phases 0-24 archived to their respective milestone files in [`milestones/`](./milestones/)._

---
*Last updated: 2026-05-14 — Phase 34 plans created (7 plans across 4 waves)*
