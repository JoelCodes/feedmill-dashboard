# CGM Dashboard

## What This Is

A feed mill operations dashboard that displays and manages feed orders in real-time. Built with Next.js, React, and Tailwind CSS following a Design → Infrastructure → Build pattern. The v1.0 MVP provides interactive order management including filtering, search, selection, order details with timeline visualization, and functional navigation. The v1.1 update adds a polished mill production dashboard with multi-select status filtering and design token system. The v1.2 release adds a customer management system with customer list, detail pages, unified activity timeline, and bin visualization with fill level indicators. The v1.3 release establishes a unified design system with 200+ semantic tokens, a CVA-based component library, and WCAG 2.1 AA accessibility compliance. The v1.4 release adds user authentication with Clerk. The v1.5 release separates demo content from production-ready pages via a `/demo/*` namespace gated by role-based access control. The v2.0 release replaces the Coming Soon homepage with the first live production feature: a DB-backed mill production dashboard at `/` with status transitions, optimistic concurrency, bulk XLSX import, and 8 server-aggregated KPI sections — backed by Postgres (Neon) + Drizzle, role-gated by Clerk `mill_operator`, and refreshed via 30-second polling.

## Core Value

Operations staff can see and manage feed orders in real-time, from pending through delivery.

## Current State

**Shipped:** v2.0 Mill Production MVP (2026-05-16)
**Next milestone:** TBD — run `/gsd-new-milestone`
**Codebase:** ~26,570 LOC TypeScript (src/) | **Tests:** unit + E2E suite green | **Build:** `npm run build` exits 0
**Tech stack:** Next.js 16, React 19, Tailwind CSS 4, Clerk v7, Drizzle ORM, Neon (Postgres HTTP), nuqs 2.8.9, read-excel-file 9.0.9
**Milestone audit:** passed (re-audit #4, all 45 v2.0 requirements satisfied across 3 sources)

**What's working (v2.0 production features):**
- **Live mill production dashboard at `/`** — three-column DB-backed view (Premix / Excel / CGM) replacing Coming Soon; role-aware read-only/edit modes
- **Status transitions with optimistic concurrency** — Pending → Mixing → Completed + Block/Resume; `version`-column race protection; conflict message "Order was modified by another user. Please refresh."
- **Append-only audit trail** — every transition writes an `order_events` row with from/to states, changed_by, changed_at, free-text note
- **Bulk XLSX import** — preview → commit flow with row-level errors, duplicate detection by Document Number, partial-import semantics, import_batches log, 2 MB body-size cap
- **8 KPI sections** — mill-wide tons-today + per-line breakdowns, pending backlog, Pellet/Mash/Crumble formula mix, 7-day order-volume sparkline, cross-column blocked exception list with dwell sort, overdue badges
- **URL-synced filter/search/drawer state** — `nuqs` shallow for snappy status/q updates, non-shallow for drawer key
- **30-second polling** — `useProductionPolling` hook (`REFRESH_INTERVAL_MS = 30_000`) + last-updated chip + manual refresh

**What's working (carried forward from earlier milestones):**
- **Postgres + Drizzle persistence** — Neon HTTP driver, server-only client, 4 tables (production_orders, order_events, import_batches, users), migration discipline (no `drizzle-kit push`)
- **Demo namespace** — `/demo/orders`, `/demo/customers`, `/demo/mill-production` unchanged
- **Role-based access control** — Clerk session JWT custom template with `roles: Role[]` (plural array, post quick task 260512-kfy); `mill_operator` enforced on mutating server actions
- **Server-only role utilities** — `checkRole(role)`, `requireRole(role)` reading claims directly (no Clerk Backend API in hot path)
- **Authentication** — Clerk SDK, themed sign-in page, UserButton, route-protection middleware
- **Customer management** — list + detail pages with unified activity timeline and bin visualization
- **Design system** — 200+ semantic tokens, CVA component library, WCAG 2.1 AA compliance, light/dark theme

**Known gaps (deferred to v2.1+):**
- KPI SQL integration smoke tests — mock-DB unit tests didn't catch the 5 `getSevenDayTrend` SQL fix commits; backlog candidate
- `/api/revalidate?tag=production-orders` POST endpoint so `npm run db:seed` auto-invalidates dev `unstable_cache` (drawer-loads-orders gotcha)
- Production E2E automation blocked by Clerk 2FA (custom domain needed) — carried from v1.4
- 14 pre-existing ClerkProvider test failures in `src/app/settings/__tests__/page.test.tsx` (D-04 carried from Phase 27)
- Pre-existing Drizzle `IndexedColumn` TS errors in `src/db/schema/__tests__/{events,orders}.test.ts` (test-file only)

## Requirements

### Validated

<!-- Shipped and confirmed working -->

**v1.0:**
- ✓ TypeScript types defined for Order data structure — v1.0
- ✓ Mock orders service with async interface — v1.0
- ✓ StatusBadge component extracted with shared constants — v1.0
- ✓ Loading skeleton components for table and details — v1.0
- ✓ Display order lines with all required columns — v1.0
- ✓ Product column combines Texture Type + Formula Type — v1.0
- ✓ Status badges: Pending, Producing, Ready, In Transit, Complete — v1.0
- ✓ Red dot indicator for orders with changes flag — v1.0
- ✓ Filter by status (clickable pills) — v1.0
- ✓ Filter by "has changes" — v1.0
- ✓ Search bar filters by customer name and product — v1.0
- ✓ Row selection with visual highlight — v1.0
- ✓ Empty state when no results match filters — v1.0
- ✓ Click row to open order details panel — v1.0
- ✓ Order details panel shows full order information — v1.0
- ✓ Timeline visualization of order lifecycle events — v1.0
- ✓ Order change history display — v1.0
- ✓ Panel always visible (design decision) — v1.0
- ✓ Sidebar links route to different views — v1.0
- ✓ Current view indicated in sidebar — v1.0
- ✓ Search box searches across all orders — v1.0
- ✓ Notifications area with indicator — v1.0
- ✓ Settings link to settings page — v1.0

**v1.1:**
- ✓ Filter pills UI designed in mill-production.pen with 4 interaction states — v1.1
- ✓ Mill production view polished to match .pen design exactly — v1.1
- ✓ Mock service expanded to 33 orders from Book1.xlsx example data — v1.1
- ✓ Status filter pills with multi-select toggle behavior — v1.1
- ✓ Design tokens for status colors, typography, and shadows — v1.1
- ✓ Reusable FilterPill component with TDD (11 tests) — v1.1

**v1.2:**
- ✓ Customer list page with search and sort by recent activity — v1.2
- ✓ Customer row shows order count, change flag, and bin alert indicator — v1.2
- ✓ Customer detail page with header (contact info, summary stats) — v1.2
- ✓ Unified activity timeline (orders, deliveries, bin alerts) with expand/collapse — v1.2
- ✓ Order timeline events link to orders page with that order selected — v1.2
- ✓ Bin visualization with vertical tank gauges and fill percentage — v1.2
- ✓ Threshold-based coloring (green >25%, yellow 10-25%, red <10%) — v1.2
- ✓ Mock customer service with stats aggregation (18 customers) — v1.2
- ✓ Mock bin service with fill percentages and alert levels (38 bins) — v1.2

**v1.3:**
- ✓ Semantic token system with two-tier naming (primitives → semantic) — v1.3
- ✓ Light/dark theme infrastructure with next-themes and CSS variable overrides — v1.3
- ✓ CVA and utility setup (class-variance-authority, tailwind-merge, cn() helper) — v1.3
- ✓ ESLint rules blocking hardcoded color and spacing values — v1.3
- ✓ Button component with CVA variants and sizes — v1.3
- ✓ Input components (text, number, select, textarea) with validation states — v1.3
- ✓ Card/Panel compound component (Header, Content, Footer) — v1.3
- ✓ Theme toggle allowing light/dark/system switching — v1.3
- ✓ StatusBadge refactored to use design tokens — v1.3
- ✓ All pages migrated to design system tokens — v1.3
- ✓ Token usage documentation and component guidelines — v1.3
- ✓ WCAG 2.1 AA accessibility compliance verified — v1.3
- ✓ Component library .pen file as single source of truth — v1.3

**v1.4:**
- ✓ Clerk SDK integration with ClerkProvider and middleware — v1.4
- ✓ Themed sign-in page with CSS variable mapping (79 references) — v1.4
- ✓ Route protection for all dashboard pages via clerkMiddleware — v1.4
- ✓ Playwright E2E tests verifying unauthenticated redirect — v1.4
- ✓ UserButton in header with sign-out action and loading skeleton — v1.4
- ✓ Auth UI respects light/dark theme via CSS variables — v1.4
- ✓ Production deployment with Vercel/Clerk configuration — v1.4

**v1.5:**
- ✓ ROUTE-01: Existing pages (orders, customers, mill-production) moved to `/demo/*` subdirectory — v1.5
- ✓ ROUTE-02: New homepage at `/` displays "Coming Soon" message with full layout (header + sidebar) — v1.5
- ✓ ROLE-01: Clerk publicMetadata configured with `role` field, included in session token claims — v1.5
- ✓ ROLE-02: TypeScript `CustomJwtSessionClaims` interface extended for type-safe role checking — v1.5
- ✓ ACCESS-01: Middleware protects `/demo/*` routes, redirecting users without `demo` role to root — v1.5
- ✓ ACCESS-02: Role utility functions (`requireRole()`, `checkRole()`) available for server components — v1.5
- ✓ NAV-01: Sidebar displays different navigation based on route context (demo vs production) — v1.5
- ✓ NAV-02: DashboardLayout component wraps all pages, eliminating layout duplication — v1.5

**v2.0 — AUTH (Role expansion for production access):**
- ✓ AUTH-01: `mill_operator` added to `Role` union — v2.0
- ✓ AUTH-02: Mutating server actions enforce `requireRole('mill_operator')`; `/` page-level enforcement intentionally NOT used — v2.0
- ✓ AUTH-03: Middleware adds `/` to `auth.protect()` flow (no coarse-gate `/mill_operator` matcher) — v2.0
- ✓ AUTH-04: `docs/clerk-setup.md` runbook updated with `mill_operator` test-user assignment + JWT template verification — v2.0

**v2.0 — DATA (Postgres + Drizzle persistence):**
- ✓ DATA-01: Neon Postgres provisioned; `DATABASE_URL` (pooled) + `DATABASE_URL_UNPOOLED` (direct) in env — v2.0
- ✓ DATA-02: `production_orders` schema — Book1.xlsx fields + state union + `version INTEGER DEFAULT 1` + `clerk_user_id TEXT` (no FK) — v2.0
- ✓ DATA-03: `order_events` schema — append-only audit log (from/to states, changed_by, changed_at, note) — v2.0
- ✓ DATA-04: `import_batches` schema — operational visibility for bulk imports — v2.0
- ✓ DATA-05: `users` schema — lazy Clerk display-name cache; upserted on session; never used for auth decisions — v2.0
- ✓ DATA-06: SQL migrations via `drizzle-kit generate` + `migrate`; `drizzle-kit push` banned after initial schema — v2.0
- ✓ DATA-07: Seed script populates dev DB with 33 Book1.xlsx fixture rows (mirrors `/demo` baseline) — v2.0
- ✓ DATA-08: `src/db/index.ts` enforces `import 'server-only'` on line 1 (no Edge-runtime driver leak) — v2.0

**v2.0 — PROD (Production dashboard UI):**
- ✓ PROD-01: `/` route serves production mill dashboard as async RSC with `export const dynamic = 'force-dynamic'` — v2.0
- ✓ PROD-02: Three-column layout (Premix / Excel / CGM) populated from DB-backed orders — v2.0
- ✓ PROD-03: Status filter pills (Pending/Mixing/Completed/Blocked) with multi-select; URL-synced via `nuqs` — v2.0
- ✓ PROD-04: Search across customer + product fields; URL-synced via `nuqs` — v2.0
- ✓ PROD-05: Order details drawer opens on row click; shows full transition history from `order_events` — v2.0
- ✓ PROD-06: Blocked alert band aggregates all currently-blocked orders across columns — v2.0
- ✓ PROD-07: "Next-up" indicator highlights topmost Pending order in each column — v2.0
- ✓ PROD-08: In-progress badge appears on every Mixing order — v2.0
- ✓ PROD-09: 30-second polling via `useProductionPolling` hook (`REFRESH_INTERVAL_MS = 30_000`) — v2.0
- ✓ PROD-10: Loading skeleton + empty-state UI per status column — v2.0
- ✓ PROD-11: Last-updated chip + manual refresh control surfaced in header strip — v2.0

**v2.0 — TRANS (Status transitions):**
- ✓ TRANS-01..04: Pending → Mixing → Completed + Block + Resume server actions — v2.0
- ✓ TRANS-05: Every transition writes an `order_events` row (from/to, changed_by, changed_at, note) — v2.0
- ✓ TRANS-06: Optimistic concurrency via `UPDATE ... WHERE version = $v RETURNING id`; user-facing locked-conflict message — v2.0
- ✓ TRANS-07: All transitions are React 19 server actions; each calls `revalidateTag('production-orders')` before returning — v2.0

**v2.0 — IMPORT (Bulk XLSX import):**
- ✓ IMPORT-01..06: Upload → preview (row count, total weight, duplicates) → commit; row-level errors; partial-import semantics; import_batches log — v2.0
- ✓ IMPORT-07: 2 MB body-size cap via `experimental.serverActions.bodySizeLimit` + client validation; `read-excel-file` 9.0.9 (SheetJS CVE avoided) — v2.0

**v2.0 — KPI (Operations metrics):**
- ✓ KPI-01..03: Mill-wide tons-today + per-line breakdowns + per-column header strip (orders + lbs ratio) — v2.0
- ✓ KPI-04..05: Pending-backlog card + Pellet/Mash/Crumble formula-mix breakdown for today's completions — v2.0
- ✓ KPI-06: 7-day order volume sparkline with "not enough data yet" empty state — v2.0
- ✓ KPI-07..08: Cross-column blocked exception list sortable by dwell time + overdue-badge warnings for `earlyDeliveryDate` — v2.0
- ✓ Closes v1.0 deferred KPI ask (KPI cards display computed values from order data)

### Active

<!-- Requirements for next milestone — populated by /gsd-new-milestone -->

_Next milestone TBD. Run `/gsd-new-milestone` to scope and enumerate v2.1+ requirements._

### Deferred

<!-- Acknowledged but not in current scope -->

- KPI SQL integration smoke tests — mock-DB unit tests didn't catch the 5 `getSevenDayTrend` SQL fix commits; backlog for v2.1
- `/api/revalidate?tag=production-orders` POST endpoint so `npm run db:seed` auto-invalidates dev `unstable_cache` (drawer-loads-orders gotcha)
- Click KPI card to filter table to relevant orders (deferred from v1.0; not in v2.0 scope)
- v2.0 transparency note: Phase 35 UAT scenarios recorded as operator-confirmed (chain delegation) rather than executor-witnessed

### Out of Scope

<!-- Explicit boundaries with reasoning -->

- Mobile app — web-first, responsive later
- Real-time push updates (SSE / Pusher) — 30s polling sufficient; carried from v2.0 OQ deferral
- Multi-tenant / multi-mill — single mill focus initially
- Inline editing of orders — drawer + transition actions provide better UX
- Advanced query builder — simple filters cover 90% of use cases
- Fine-grained permissions — premature optimization; simple role flags sufficient
- Client-side role checking for security — security theater; always enforce server-side
- Organization-based RBAC — over-engineering for single-tenant app
- Nested role hierarchies — flat roles sufficient
- `drizzle-kit push` after initial schema — generate + migrate is the only discipline
- `xlsx` / SheetJS npm package — unpatched CVE-2023-30533; use `read-excel-file` instead

## Context

**Domain:** Feed mill operations (poultry/livestock feed production and delivery)

**Data structure** (from example-data/Book1.xlsx):
- Document Number — order identifier
- Line Code — formula code
- Texture Type — PELLET, MASH, SH PELLET, FINE CR, C. CRUMBLE
- Customer Name — farm/business name
- Ordered Quantity — amount in pounds
- Farm Location Code — delivery bin (BIN 5, BIN 4A, etc.)
- Early Delivery Date — target delivery date
- Formula Type — NON MEDICATED, MED ALBAC Z, MED ALBAC A, etc.

**Development approach:** Outside-in. Visual prototype exists. Each milestone:
1. **Design** — Pencil.dev files for components and use cases
2. **Infrastructure** — Real service OR mock data/functions (ask first)
3. **Build** — Implement interactivity

**Architecture:** See `.planning/codebase/` for architecture, conventions, and concerns.

## Constraints

- **Design-first**: Each milestone starts with Pencil.dev design files before implementation
- **Ask before infrastructure**: Propose databases, auth, APIs — implement only if approved, otherwise mock
- **Preserve patterns**: Follow existing Next.js/React/Tailwind conventions from codebase map

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Outside-in development | Start with working UI, add real functionality incrementally | ✓ Good |
| Design → Infrastructure → Build | Ensures visual/UX consideration before coding | ✓ Good |
| Milestone order: Table → Details → KPIs → Nav → Header | Logical dependency chain, core functionality first | ✓ Good |
| Each order line = separate row | Lines are individual deliveries to specific bins | ✓ Good |
| Product = Texture Type + Formula Type | Simplifies display, keeps related info together | ✓ Good |
| Changes = flag in data | Simple implementation, can evolve to change tracking later | ✓ Good |
| Derived state pattern for selection | Avoids setState in useEffect, React best practice | ✓ Good |
| Auto-detecting active nav state | usePathname() with prefix matching for nested routes | ✓ Good |
| localStorage for read notification state | Single source of truth for badge and indicators | ✓ Good |
| Phase 3 deferred | KPI functionality can ship in v1.1 without blocking core features | — Pending |
| Generic FilterPill with color props | Enables reuse across orders and mill-production with different status types | ✓ Good |
| Design tokens in globals.css | Centralized styling, eliminates hardcoded hex values, enables theme consistency | ✓ Good |
| TDD for FilterPill component | 11 tests ensure correctness, documents behavior for future maintainers | ✓ Good |
| Vertical tank gauge for bin visualization | More literal representation of fill levels, matches customer-detail.pen design | ✓ Good |
| Stacked status indicators on customer row | Shows all customer states at once - orders + changes + alerts | ✓ Good |
| Bins inside CustomerDetailHeader | Per design: bins below contact/stats in header card, not separate section | ✓ Good |
| Shared mockData.ts singleton | Prevents stale data inconsistency across pages (orders, customers, bins) | ✓ Good |
| TDD for services and components | 104 tests total ensure correctness and document behavior | ✓ Good |
| Multiple timeline events can expand | No accordion behavior - users often compare multiple events | ✓ Good |
| Promise.all for parallel data fetching | Customer detail fetches customer, events, bins concurrently | ✓ Good |
| CVA for type-safe component variants | Class-variance-authority enables exhaustive variant typing with IntelliSense | ✓ Good |
| Two-tier token naming (primitive → semantic) | Primitives in :root, semantics reference via var(), enables theme swapping | ✓ Good |
| next-themes for dark mode | Handles SSR flash prevention, system preference sync, localStorage persistence | ✓ Good |
| jsx-a11y rules approach over plugin | Avoids conflict with eslint-config-next, enables granular rule control | ✓ Good |
| jest-axe for automated a11y testing | Catches WCAG violations during development, enforces compliance | ✓ Good |
| Clerk for authentication | Prebuilt components reduce security risk, CSS variables for theme integration | ✓ Good |
| ClerkLoading + ClerkLoaded pattern | Handles loading states without flash of unauthenticated content | ✓ Good |
| Playwright for E2E testing | Parameterized tests for route protection, webServer integration | ✓ Good |
| afterSignOutUrl on ClerkProvider | Centralizes redirect config (UserButton prop not supported in v7) | ✓ Good |
| clerkClient for role checking | Fetch user.publicMetadata directly instead of relying on JWT template config | ✓ Good (superseded in v1.5 by session-claim approach) |
| Demo namespace via regular folder, not route group | URL-based middleware matching simpler than route-group prefixes | ✓ Good |
| Clean break — old paths return 404 instead of redirect | No legacy URL contract to maintain; simpler middleware (D-01) | ✓ Good |
| Roles in Clerk publicMetadata, not organizations | Simpler than organization-based RBAC for single-tenant app | ✓ Good |
| Session JWT custom template for role claim | Eliminates per-request Clerk Backend API calls in middleware/utilities | ✓ Good |
| TypeScript CustomJwtSessionClaims interface | Compile-time role-string safety eliminates literal-string checks | ✓ Good |
| Manual Clerk Dashboard role assignment for v1.5 | Defer admin UI; manual assignment sufficient at this scale | ✓ Good |
| Shared DashboardLayout instead of route group layouts | Single layout component composes cleanly across `/`, `/demo/*`, `/settings` | ✓ Good |
| Async RSC + extracted client list components | Server-side data fetching keeps sensitive logic off the client | ✓ Good |
| Server-only role utilities reading session claims directly | No Clerk Backend API round-trip in hot path; 8-case TDD suite | ✓ Good |
| Localhost-pinned authenticated Playwright projects | Prevents env leak between local and remote test runs | ✓ Good |
| Two integration-closure phases (29, 30) | Cross-phase drift surfaced by milestone audit; targeted closure cleaner than carrying tech debt | ✓ Good |
| Neon HTTP driver + `drizzle-orm/neon-http` (v2.0) | Edge-compatible, no connection-pool overhead in serverless; works with Vercel + Next.js 16 | ✓ Good |
| `import 'server-only'` on `src/db/index.ts` line 1 (v2.0) | Prevents DB driver leak into Edge bundle; verified by source-string TDD | ✓ Good |
| `version INTEGER DEFAULT 1` optimistic concurrency (v2.0) | `UPDATE ... WHERE version = $v RETURNING id` gives exactly-one-winner without table locks; user-facing message guides retry | ✓ Good |
| `revalidateTag('production-orders')` as mutation invariant (v2.0) | Every mutating action calls it before returning; consistent cache invariant across transitions + import | ✓ Good |
| `nuqs` 2.8.9 for URL state (v2.0) | `createSearchParamsCache` for async `searchParams` (Next.js 16); shallow:true for snappy filter/search, shallow:false for drawer key | ✓ Good |
| 30-second polling via `setInterval(() => router.refresh(), 30_000)` (v2.0) | Simple primitive; named `REFRESH_INTERVAL_MS` constant; no SSE/Pusher complexity for v2.0 | ✓ Good |
| `read-excel-file` 9.0.9, not `xlsx`/SheetJS (v2.0) | SheetJS npm has unpatched CVE-2023-30533; switch is non-negotiable for v2.0 | ✓ Good |
| `roles: Role[]` plural array session claim (v2.0, quick task 260512-kfy) | Future-proofs multi-role users; canonical access via `roles.includes(...)` | ✓ Good |
| Three-source requirement traceability (v2.0) | VERIFICATION ⨯ SUMMARY-FM ⨯ traceability cells must all agree; surfaces drift mechanically | ✓ Good |
| Two closure phases (36, 37) for v2.0 | Phase 36 closed BUILD-01 + Phase 35 verification; Phase 37 mechanically closed 4 hygiene warnings — mirrors v1.5 INT-07 pattern | ✓ Good |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-16 after v2.0 Mill Production MVP milestone*
