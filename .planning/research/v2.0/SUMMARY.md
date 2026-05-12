# Research Summary: v2.0 Mill Production MVP

**Project:** CGM Dashboard — Mill Production MVP
**Domain:** Feed mill operations — multi-role production dashboard
**Researched:** 2026-05-12
**Confidence:** HIGH (stack, pitfalls), MEDIUM-HIGH (features, architecture)

---

## Executive Summary

v2.0 is the first milestone that ships real stateful functionality: replacing the Coming Soon homepage at `/` with a DB-backed mill production dashboard used by operators, supervisors, and managers. The research is unusually specific because the existing codebase, domain data (Book1.xlsx), and user populations are already known. The recommended approach follows four dependency layers: role infrastructure first (blocks everything), Postgres schema second (blocks queries), server actions and query functions third (block UI), then the promotion of `/` to the production dashboard. This layered dependency structure is the single most important finding and should drive phase boundaries.

The technology additions are small and well-justified: Neon (via `@neondatabase/serverless`) for serverless-safe Postgres, Drizzle ORM with drizzle-kit for TypeScript-native schema management, `read-excel-file` for XLSX parsing (SheetJS has an unpatched CVE on the npm registry), `nuqs` for async-searchParams-safe URL state, and Zod for server-action validation. All four research dimensions independently converge on polling over SSE for real-time updates, with a 30-second interval as the correct default for an operations dashboard where mixing cycles run 5 to 15 minutes. STACK and PITFALLS also independently agree on `import 'server-only'` as mandatory discipline for the DB client module.

The primary risks concentrate at the DB infrastructure layer, not the UI: wrong Postgres driver in the Edge runtime, connection exhaustion without the Neon pooled endpoint, and stale RSC data after mutations without `revalidateTag`. All three are preventable with decisions made in the first phase and a "Looks Done But Isn't" checklist that PITFALLS.md provides in full. Feature scope is well-validated for the operator section; supervisor and manager KPI targets (daily lbs goal, shift definitions) need user confirmation before requirements are finalized.

---

## 1. Stack Additions (Locked)

These packages are confirmed additions. The existing stack (Next.js 16.1.6, React 19.2.3, Tailwind CSS 4, Clerk v7, TypeScript 5) is unchanged.

### Full Install Command

```bash
# Production dependencies
npm install drizzle-orm @neondatabase/serverless nuqs zod read-excel-file

# Dev dependencies
npm install -D drizzle-kit
```

### Package Table

| Package | Version | Purpose | Decision Basis |
|---|---|---|---|
| `@neondatabase/serverless` | 1.1.0 | Neon HTTP driver — works in Node.js and Edge runtimes | Vercel Postgres deprecated; Neon is the successor; HTTP driver avoids TCP connection exhaustion |
| `drizzle-orm` | 0.45.2 | ORM + query builder | TypeScript-native; Edge-compatible; thin SQL layer; same async interface as existing mock services |
| `drizzle-kit` | 0.31.10 | Schema migration CLI (dev dep) | Generates inspectable SQL diff files; mandatory for migration discipline |
| `read-excel-file` | 9.0.9 | XLSX parsing (server-side) | Published 2026-05-02; actively maintained; SheetJS npm version (0.18.5) has unpatched CVE-2023-30533 |
| `nuqs` | 2.8.9 | Type-safe URL state for Next.js App Router | Handles async `searchParams` (Next.js 16 requirement); `createSearchParamsCache` for RSC |
| `zod` | 4.4.3 | Runtime validation in server actions | Validates state-transition legality, import row shapes, and Postgres boundaries |

### Providers Chosen

| Decision | Choice | Rationale |
|---|---|---|
| Postgres provider | Neon (direct, not via `@vercel/postgres` wrapper) | Vercel Postgres is now a thin Neon wrapper; use Neon directly for control and Preview branch integration |
| ORM | Drizzle ORM | Edge-compatible; no binary query engine; TypeScript schema matches project conventions |
| Real-time | Polling at 30s interval | All 4 research dimensions agree; operator cadence is minutes not seconds |
| Form handling | React 19 `useActionState` (no library) | Status transitions are 1-2 field state machines; integrates directly with server actions |

### What NOT to Add

| Package | Reason |
|---|---|
| `@vercel/postgres` | Deprecated; wraps `@neondatabase/serverless`; use Neon directly |
| `xlsx` (SheetJS, npm registry) | CVE-2023-30533 unpatched in npm version 0.18.5 |
| `exceljs` | Last stable release 2023; treat as unmaintained |
| `prisma` | Edge-runtime incompatible; binary query engine fails on Vercel |
| `react-hook-form` | Overkill for status-transition forms; `useActionState` is sufficient |
| `pusher-js` / `ably` | Premature; polling covers v2.0 scale |
| `socket.io` / `ws` | Not supported on Vercel serverless functions |
| `papaparse` | Defer until CSV is an explicit requirement; current data is .xlsx |
| `supabase-js` | Clerk handles auth; polling handles real-time; full BaaS is unnecessary overhead |

### Environment Variables to Add

```bash
DATABASE_URL=postgres://...@ep-...-pooler.neon.tech/neondb?sslmode=require   # pooled (app queries)
DATABASE_URL_UNPOOLED=postgres://...@ep-....neon.tech/neondb?sslmode=require  # direct (drizzle-kit migrate only)
```

---

## 2. Feature Table

Features organized by audience, with category label, complexity (S/M/L), and v2.0 recommendation.

### Operator

| Feature | Category | Complexity | v2.0 |
|---|---|---|---|
| Current queue with status (DB-backed) | Table stakes | S | Include |
| Status transition buttons (Pending → Mixing → Completed + Blocked with reason) | Table stakes | M | Include |
| Status audit trail (`order_events` table) | Table stakes | M | Include |
| Blocked order alert band | Table stakes | S | Include |
| In-progress indicator (active badge on Mixing orders) | Table stakes | S | Include |
| Next-up order highlight | Table stakes | S | Include |
| Order details on tap/click | Table stakes | S | Include |
| Per-column order count + completed lbs/total lbs | Table stakes | S | Include |
| Filter by status pill (URL-synced) | Table stakes | S | Include |
| Real-time data freshness indicator (last updated + manual refresh) | Table stakes | S | Include |
| Loading skeleton | Table stakes | S | Include |
| Empty state per status | Table stakes | S | Include |
| Formula change alert flag (`hasChanges` field) | Differentiator | S | Include |
| Undo last transition (5-minute window) | Table stakes | M | Include if time permits |
| Batch sequence number / run order | Differentiator | M | Defer v2.1 |
| Blocking reason tag (why blocked) | Differentiator | M | Defer v2.1 |
| Mill line capacity bar | Differentiator | M | Defer v2.1 |
| Estimated completion time | Differentiator | L | Defer v2.1 |
| Drag-drop card reordering | Anti-feature | — | Never (bypasses formula sequencing constraints) |
| Inline card field editing | Anti-feature | — | Never (bypasses QC audit trail) |
| Status dropdown (arbitrary state assignment) | Anti-feature | — | Never (breaks directed state machine) |
| Auto-reload full page on update | Anti-feature | — | Never (resets scroll, kills in-flight transitions) |

### Supervisor / Shift Lead

| Feature | Category | Complexity | v2.0 |
|---|---|---|---|
| Daily throughput KPI card (tons completed today) | Table stakes | S | Include |
| Exception list (cross-column Blocked orders) | Table stakes | M | Include |
| Orders past early delivery date | Table stakes | M | Include |
| Active orders count by status | Table stakes | S | Include |
| Shift handoff notes (free-text, per shift) | Table stakes | M | Include |
| Filter to own shift | Table stakes | M | Include if OQ-2 (shift definition) resolved |
| Scheduled vs. actual variance | Differentiator | M | Defer (requires OQ-1: daily target config) |
| Top blocker by frequency | Differentiator | M | Defer v2.1 |
| One-click escalation flag → manager exception inbox | Differentiator | M | Defer v2.1 |
| Shift-over-shift comparison | Differentiator | L | Defer v2.1 |
| Full OEE score | Anti-feature | — | Never for v2.x (requires PLC telemetry) |
| Automated shift assignment by time-of-day | Anti-feature | — | Never (DST/overtime/split-shift edge cases) |
| Crew performance scoring | Anti-feature | — | Never (labor relations risk without formal process) |
| Push / SMS notifications | Anti-feature | — | Defer to v3+ at minimum |

### Operations Manager

| Feature | Category | Complexity | v2.0 |
|---|---|---|---|
| Throughput KPI cards (today + this week) | Table stakes | M | Include |
| Tons per mill line breakdown | Table stakes | M | Include |
| Order volume trend (7-day bar/sparkline) | Table stakes | M | Include |
| Pending order backlog (count + weight) | Table stakes | S | Include |
| Formula mix breakdown (Pellet/Mash/Crumble %) | Table stakes | M | Include |
| Blocked order history (count + avg dwell time) | Table stakes | L | Defer (needs accumulated audit trail data) |
| Delivery date compliance rate | Differentiator | M | Defer (needs completed order history) |
| Customer concentration view | Differentiator | M | Defer v2.1 |
| Week-over-week throughput delta | Differentiator | M | Defer (needs 7+ days of production data) |
| Bottleneck heatmap by mill + day | Differentiator | L | Defer v2.1 (needs 30+ days data) |
| Manager exception inbox | Differentiator | M | Defer v2.1 (pairs with supervisor escalation flag) |
| Full OEE dashboard | Anti-feature | — | Never without PLC integration |
| Downtime tracking | Anti-feature | — | Use blocked-order dwell time as proxy; call it "blocked time" |
| Predictive analytics / ML forecasting | Anti-feature | — | Defer to v3+ (insufficient data volume) |
| Custom report builder | Anti-feature | — | Fixed date ranges cover 90% of needs |
| Multi-mill comparison | Anti-feature | — | Explicit non-goal per PROJECT.md |

### Cross-Cutting

| Feature | Category | Complexity | v2.0 |
|---|---|---|---|
| Bulk import: file upload (drag-drop + picker) | Table stakes | S | Include |
| Bulk import: XLSX parsing (server-side, `read-excel-file`) | Table stakes | M | Include |
| Bulk import: row-count + weight preview before confirm | Table stakes | S | Include |
| Bulk import: row-level error display + partial import | Table stakes | M | Include |
| Bulk import: duplicate detection (document number) | Table stakes | M | Include |
| Bulk import: import confirmation modal | Table stakes | S | Include |
| Import history log (`import_batches` table) | Differentiator | M | Include (cheap with initial schema; operational trust) |
| URL-shareable filter state (status, mill line, search) | Table stakes | S | Include |
| Deep links survive page reload (server-side searchParams parse) | Table stakes | S | Include |
| Polling auto-refresh at 30s | Table stakes | S | Include |
| Optimistic status update (immediate card move, revert on error) | Differentiator | M | Defer v2.1 |
| "New orders available" banner (count-change detection) | Differentiator | M | Defer v2.1 |
| Bulk status transition (multi-select) | Differentiator | M | Defer v2.1 |
| Column mapping UI for non-standard XLSX headers | Differentiator | L | Defer v2.1 (pending OQ-3 answer) |
| WebSocket / SSE real-time push | Anti-feature for v2.0 | L | Defer v3+ |
| Named saved filter views | Anti-feature for v2.0 | L | Defer (URL sharing is sufficient) |
| Toast auto-dismiss for critical alerts | Anti-feature | — | Never — use persistent inline banners for ops alerts |

---

## 3. Architecture Decisions

In dependency order.

**Data Layer**
- `src/db/index.ts` is the Drizzle singleton with `import 'server-only'` as line 1 — build error if imported in client components or middleware
- Two env vars required: `DATABASE_URL` (pooled, `-pooler.neon.tech`) for app queries; `DATABASE_URL_UNPOOLED` (direct) for `drizzle-kit migrate` only
- Schema in `src/db/schema/` (orders, events, import_batches); query functions in `src/db/queries/`; mutations in `src/actions/`
- `drizzle-kit generate` + `drizzle-kit migrate` workflow mandatory from day 1; `drizzle-kit push` banned after initial schema is created

**Schema Decisions**
- `production_orders` table includes `version INTEGER DEFAULT 1` for optimistic concurrency — must be in initial schema, not added later
- `order_events` table is append-only: `id, order_id, from_state, to_state, changed_by (Clerk userId TEXT), changed_at, note`
- `import_batches` table: `id, file_name, row_count, imported_by, imported_at` (operational visibility)
- `clerk_user_id TEXT` stored on orders with NO foreign key constraint (prevents webhook-timing race conditions)
- `users` table as lazy-sync Clerk display name cache; upserted on each authenticated session; never used for auth decisions

**Mutation Pattern**
- Server actions (`'use server'` in `src/actions/`) for all status transitions and bulk import
- Every server action that mutates data calls `revalidateTag('production-orders')` before returning
- Production orders page: `export const dynamic = 'force-dynamic'` for live DB data on every request
- Optimistic concurrency: `UPDATE ... WHERE id = $id AND version = $version`; zero rows returned = concurrent edit; surface user-facing error
- Bulk import: server action path (not route handler) with `next.config.ts` `serverActions.bodySizeLimit: '2mb'` and matching `proxyClientMaxBodySize: '2mb'`

**Real-Time**
- Polling at 30s: `setInterval(() => router.refresh(), 30_000)` in `MillProductionProUI` `useEffect` — zero new infrastructure
- `router.refresh()` triggers full RSC re-render with fresh DB data
- SSE explicitly deferred; upgrade path: add `src/app/api/mill-production/events/route.ts` with `export const dynamic = 'force-dynamic'`

**URL State**
- `nuqs` 2.8.9 with `createSearchParamsCache` for async `searchParams` unwrapping in RSC (required by Next.js 16)
- `NuqsAdapter` added to root layout; `useQueryState` in client components for filter mutations
- Filter state in URL: `?status=Blocked&mill=CGM&q=Westbridge`

**Role Gating**
- New role string: `'mill_operator'` added to `Role` union in `src/types/clerk.d.ts`
- Page-level `requireRole('mill_operator')` in `src/app/page.tsx` is the canonical enforcement point
- Optional middleware coarse gate for `/` as defense-in-depth only
- Demo namespace (`/demo/*`) and mock services are untouched

**Component Boundaries**
- `src/app/page.tsx`: async RSC, `requireRole`, nuqs searchParams cache, Drizzle query, renders `MillProductionProUI`
- `MillProductionProUI`: client component; owns polling hook, filter mutations, status transition buttons
- Sidebar production nav condition: `!pathname.startsWith('/demo/')` (not a `/production/` prefix check)

---

## 4. Watch Out For

Top 5 pitfalls the build phases must address.

### 1. Wrong Postgres Driver Leaks into Edge Runtime

**Risk:** If `src/db/index.ts` is transitively imported by anything touching the middleware bundle, the Node.js TCP driver throws `Module not found: Can't resolve 'fs'` at build time or cold-start.

**Prevention:** `import 'server-only'` as line 1 of `src/db/index.ts`. Run `next build` after Phase A to confirm no Edge-bundle contamination before writing any queries.

### 2. Connection Exhaustion Without the Pooled Endpoint

**Risk:** Using the Neon direct connection string in app code exhausts connection limits during concurrent requests (`FATAL: sorry, too many clients already`).

**Prevention:** `DATABASE_URL` must point to the Neon pooled endpoint (hostname ending `-pooler.neon.tech`). `DATABASE_URL_UNPOOLED` used exclusively in `drizzle.config.ts`. Set both before writing the first query. PgBouncer transaction mode is incompatible with migration `SET` commands — this is why two separate env vars are required.

### 3. Mutations Without `revalidateTag` Leave Stale UI

**Risk:** Status transition writes to DB and returns success. Operator sees the card still in its old state. They click again. Double-transition. KPI counts diverge.

**Prevention:** `revalidateTag('production-orders')` in every server action that mutates — non-negotiable. Add to the definition-of-done checklist for every action. Production page also needs `export const dynamic = 'force-dynamic'` as belt-and-suspenders.

### 4. Concurrent Operators Race on the Same Order

**Risk:** Two operators click "Start Mixing" within milliseconds. Both read `version = 1`, both write `version = 2`. Audit trail shows duplicate transitions; KPIs are wrong; undo logic fails.

**Prevention:** `version INTEGER DEFAULT 1` must be in the initial schema — cannot be added retroactively without cascading migration and action signature changes. Use `UPDATE ... WHERE id = $id AND version = $version`; zero rows returned surfaces a user-facing "Order was modified by another user. Please refresh." error instead of silent corruption.

### 5. XLSX Body Size Limit Silently Truncates Large Imports

**Risk:** Next.js 15.5+ `proxyClientMaxBodySize` defaults to 1 MB. Binary XLSX data above 1 MB is silently truncated before reaching the server action, producing a corrupt parse with 0 imported rows and no error.

**Prevention:** Set in `next.config.ts`:
```typescript
experimental: { serverActions: { bodySizeLimit: '2mb' } },
proxyClientMaxBodySize: '2mb',
```
Also add client-side file size validation before submission. For v2.0 daily mill imports, realistic files are under 500 KB — this configuration is defensive but costs nothing.

---

## 5. Open Questions to Resolve in Requirements Scoping

Consolidated from all 4 research documents.

### Must Answer Before Writing Requirements

| # | Question | Impact | Source |
|---|---|---|---|
| OQ-1 | **What is the daily throughput target in lbs?** Is there a configured target per mill line, a mill-wide target, or no formal target? | Blocks supervisor "scheduled vs. actual variance" feature and all KPI denominator displays | FEATURES.md |
| OQ-2 | **Does this mill run multiple shifts per day?** If yes, what are the shift boundaries? | Blocks shift handoff notes feature, shift progress filtering, "filter to own shift" | FEATURES.md |
| OQ-3 | **Will bulk imports always follow Book1.xlsx column structure?** Or do different ERP exports produce different headers? | Determines whether column-mapping UI is in scope for v2.0 or safely deferred | FEATURES.md |
| OQ-4 | **Confirm role string: `'mill_operator'`** or use a single role for operators + supervisors + managers? | Blocks all auth work; determines whether role-specific sections need separate gates | ARCHITECTURE.md |
| OQ-5 | **Blocking reasons: pre-set list or free-text?** Pre-set list enables aggregation for "top blocker" reporting | Determines `blocker_reason` column type and UI component design | FEATURES.md |

### Can Resolve During Implementation

| # | Question | Source |
|---|---|---|
| OQ-6 | Is `earlyDeliveryDate` a hard SLA or a target? Affects exception label (warning vs. breach) | FEATURES.md |
| OQ-7 | Confirm `serverActions.bodySizeLimit` config key path has not changed in Next.js 16.1.6 | PITFALLS.md |
| OQ-8 | Confirm Clerk JWT template requires no change when adding `'mill_operator'` to TypeScript union | ARCHITECTURE.md |
| OQ-9 | Confirm `import_batches` table inclusion — cheap with initial schema but confirm if wanted | ARCHITECTURE.md |
| OQ-10 | Confirm Neon plan (free tier has ~10 connection limit; Launch tier raises this) | PITFALLS.md |

---

## 6. Suggested Phase Shape

Four architecture dependency layers expanded into 5 buildable phases.

### Phase A: Role Infrastructure and DB Setup

**Rationale:** `'mill_operator'` role type and Neon connection configuration are the two hardest blockers. Everything else imports from them. Completes without touching any UI.

**Delivers:**
- `'mill_operator'` added to `Role` union in `src/types/clerk.d.ts`; test user assigned role in Clerk Dashboard
- Neon project created; both `DATABASE_URL` (pooled) and `DATABASE_URL_UNPOOLED` in Vercel env
- `drizzle.config.ts` at repo root; `src/db/index.ts` with `import 'server-only'`
- `next build` passes with no Edge-bundle errors

**Pitfalls addressed:** Wrong driver in Edge runtime (server-only discipline), connection exhaustion (pooled URL from day 1), migration drift (generate+migrate workflow established)

**Research flag:** Standard patterns — no phase research needed.

---

### Phase B: Schema, Migrations, and Seed Data

**Rationale:** Schema decisions (`version` column, Clerk identity pattern) are hard to migrate later. Get the full schema right before any query functions are written.

**Delivers:**
- `production_orders`: all Book1.xlsx fields + `state`, `version INTEGER DEFAULT 1`, `clerk_user_id TEXT` (no FK), timestamps
- `order_events`: append-only audit log
- `import_batches`: file name, row count, importer, timestamp
- `users`: lazy-sync Clerk display name cache
- SQL migrations generated and applied; seed script loading Book1.xlsx example data

**Pitfalls addressed:** Missing `version` column (concurrency bugs locked in at schema time), wrong Clerk identity model (no FK on `clerk_user_id`), `drizzle-kit push` drift

**Open questions to resolve first:** OQ-4 (role string), OQ-5 (blocker reason type)

**Research flag:** Standard patterns — no phase research needed.

---

### Phase C: Query Functions, Server Actions, and Bulk Import

**Rationale:** UI binds to action signatures. Write actions before UI to avoid rework. Bulk import is a write path (server action), not a display concern — belongs here.

**Delivers:**
- `src/db/queries/orders.ts`: `getProductionOrders(filters?)`, throughput aggregates
- `src/db/queries/events.ts`: `insertEvent()`, `getEventsByOrderId()`
- `src/actions/transitions.ts`: `transitionOrderState()` with optimistic lock check and `revalidateTag`
- `src/actions/import.ts`: `read-excel-file` parse, batch insert, duplicate detection, row-level error accumulation, `revalidateTag`
- `next.config.ts` body size limits raised; server action unit tests written

**Pitfalls addressed:** Mutations without revalidation (every action calls `revalidateTag`), XLSX body limit (config), XLSX bundle on client (`server-only` on import utility), concurrent double-transition (`version` check in WHERE clause)

**Research flag:** Standard patterns — no phase research needed.

---

### Phase D: Production Dashboard UI and Homepage Promotion

**Rationale:** Depends on all three prior phases. The visible milestone: Coming Soon replaced with the real dashboard.

**Delivers:**
- `src/app/page.tsx` replaced: async RSC, `requireRole('mill_operator')`, nuqs searchParams cache, Drizzle query, `force-dynamic`
- `MillProductionProUI` client component: 30s polling hook, filter pills, status transition buttons, order cards, blocked alert band, next-up highlight
- Bulk import UI: file input, preview modal (row count + weight), row-level error display, confirm step
- URL-shareable filter state via nuqs: `?status=`, `?mill=`, `?q=`
- Sidebar updated: production nav on `!pathname.startsWith('/demo/')`; `NuqsAdapter` added to root layout

**Pitfalls addressed:** Async searchParams (nuqs `createSearchParamsCache`), sidebar navigation context, Coming Soon cache bust (new build auto-busts Full Route Cache)

**Research flag:** Standard patterns — no phase research needed.

---

### Phase E: KPI Sections and Role-Specific Views

**Rationale:** KPI aggregates require real DB data (closes the Phase 3 deferred from v1.0). Operator, supervisor, and manager sections built once production data exists from Phase D.

**Delivers:**
- Operator section: per-column order count + completed lbs/total lbs, data freshness indicator
- Supervisor section: daily throughput KPI card, Blocked exception list, orders past delivery date, status counts, shift handoff notes
- Manager section: throughput KPI cards (today + this week), tons per mill line, 7-day order volume trend (Recharts — already in ecosystem), pending backlog, formula mix breakdown
- All KPI aggregates computed server-side in RSC via Drizzle aggregate queries

**Pitfalls addressed:** `force-dynamic` scope (apply only to live-data pages, not settings/static), polling read amplification (30s default prevents DB overload)

**Open questions to resolve first:** OQ-1 (daily throughput target), OQ-2 (shift definition)

**Research flag:** Supervisor and manager KPI targets need user confirmation (OQ-1, OQ-2) before this phase is fully specifiable.

---

### Phase Ordering Rationale

- Phases A through D form an explicit dependency chain from ARCHITECTURE.md: role infra → schema → actions → UI. Violating this order forces rework.
- Phase E is separated from Phase D because supervisor/manager KPI displays require knowing the daily lbs target and shift definitions (OQ-1, OQ-2) which need user confirmation. The operator section (Phase D) can ship without that answer.
- Bulk import is in Phase C (with actions) rather than Phase D (with UI) because server-side parsing, validation, and DB logic must be correct before UI is built. UI rework is cheaper than action API rework.
- `version` column and Clerk identity pattern must both be in Phase B's initial schema — adding them retroactively requires migrations that cascade into all action signatures.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All packages verified on npm; SheetJS CVE confirmed via vendor issue tracker; Neon + Drizzle integration officially documented |
| Features (operator) | HIGH | Well-validated by Easy Automation, Livine, Tulip.co industry tools and existing /demo prototype |
| Features (supervisor/manager) | MEDIUM | KPI selection validated; daily lbs target and shift boundaries require user confirmation |
| Features (bulk import) | HIGH | 5-stage import framework is industry-established; Book1.xlsx format is known and fixed |
| Architecture | HIGH | Drizzle + Next.js 16 RSC patterns are officially documented; follows established project conventions |
| Pitfalls | HIGH | Driver compatibility, connection exhaustion, body limits, and async searchParams confirmed against official docs and GitHub issues |

**Overall confidence:** HIGH

### Conflicts Between Research Documents

**Conflict 1 — nuqs vs raw searchParams for URL state:**
ARCHITECTURE.md Decision 5 says "Do not use nuqs for v2.0." STACK.md and PITFALLS.md Pitfall 9 both recommend nuqs 2.8.9 specifically because Next.js 16 makes `searchParams` a Promise and nuqs's `createSearchParamsCache` handles the async unwrapping cleanly.

**Resolution: use nuqs.** The ARCHITECTURE recommendation was written before the async searchParams constraint was fully analyzed (it reflects a Next.js 15 assumption). The STACK and PITFALLS researchers both confirmed the Next.js 16 requirement independently. nuqs is the safer choice.

**Conflict 2 — Polling interval (10s vs 30s):**
STACK.md recommends 10 seconds. FEATURES.md and PITFALLS.md both independently recommend 30 seconds. PITFALLS.md explicitly warns against intervals below 10s for DB read amplification.

**Resolution: use 30 seconds as default.** The 10s figure in STACK.md reflects a technical minimum, not the operational recommendation. FEATURES.md and PITFALLS.md both arrive at 30s based on operator workflow (mixing cycles are 5-15 minutes). Use 30s as a named constant to allow later tuning.

### Gaps to Address

- OQ-1 (daily throughput target) and OQ-2 (shift definition) must be answered before Phase E supervisor/manager requirements can be finalized
- OQ-3 (XLSX column universality) determines whether column-mapping UI is in scope for v2.0
- OQ-10 (Neon plan level) affects connection limits; confirm before Phase A

---

## Sources

### Primary (HIGH confidence)

- Neon docs — Next.js integration, connection pooling: https://neon.com/docs/guides/nextjs
- Drizzle ORM docs — schema, migrations, Next.js tutorial: https://orm.drizzle.team/docs/tutorials/drizzle-nextjs-neon
- Vercel Functions Limits: https://vercel.com/docs/functions/limitations
- Next.js 16 release notes: https://nextjs.org/blog/next-16
- nuqs official docs: https://nuqs.dev/docs/adapters
- SheetJS CVE-2023-30533: https://git.sheetjs.com/sheetjs/sheetjs/issues/2961
- Next.js serverActions config: https://nextjs.org/docs/app/api-reference/config/next-config-js/serverActions

### Secondary (MEDIUM confidence)

- TeepTrak Dashboard Design Guide 2026 — KPI refresh rates, audience-specific metrics
- Tulip.co: 6 Manufacturing Dashboards — operator vs. supervisor vs. executive taxonomy
- Augmentir: Shift Handover Best Practices — shift handoff information categories
- Anitox: 6 KPIs for Feed Production Throughput — throughput rate and completion rate for feed mills
- Smart Interface Design Patterns: Bulk Import UX — 5-stage import framework
- Easy Automation Feed Mill, Livine Poultry Software, MTech Systems — industry feature benchmarks

### Tertiary (LOW confidence)

- Optimal polling interval — 30s derived from mixing cycle duration; should be operator-confirmed
- Daily throughput target exists — assumed from supervisor KPI patterns; may not apply to this mill

---

*Research completed: 2026-05-12*
*Ready for roadmap: yes*
