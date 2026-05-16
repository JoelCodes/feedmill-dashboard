# Milestones

## v2.0 Mill Production MVP (Shipped: 2026-05-16)

**Phases completed:** 7 phases (31-37), 52 plans, 74 tasks
**Requirements:** 45/45 satisfied (AUTH × DATA × TRANS × IMPORT × PROD × KPI)
**Timeline:** 3 days (2026-05-13 → 2026-05-16) | **Codebase:** ~26,570 LOC TypeScript (+14,673 in src/)
**Audit:** passed (re-audit #4, all hygiene warnings closed by Phase 37 Wave 1)

**Key accomplishments:**

- **Coming Soon → live mill production dashboard at `/`** — three-column (Premix / Excel / CGM) DB-backed dashboard with role-aware read-only/edit modes, status filter pills + customer/product search URL-synced via `nuqs`, click-to-open order drawer with full transition history, blocked alert band aggregating all blocked orders, next-up + in-progress highlights, 30-second polling via `useProductionPolling` hook (`REFRESH_INTERVAL_MS = 30_000`), last-updated chip + manual refresh, async-RSC + Suspense skeletons throughout (PROD-01..11, AUTH-01..04)
- **Postgres + Drizzle persistence layer on Neon HTTP** — `production_orders`, `order_events`, `import_batches`, `users` tables with `version INTEGER DEFAULT 1` optimistic-concurrency column; server-only `src/db/index.ts` enforced with `import 'server-only'` on line 1; migration discipline via `drizzle-kit generate` + `drizzle-kit migrate` (push banned); seed script populating dev DB with 33 Book1.xlsx fixture rows (DATA-01..08)
- **Status transitions with optimistic concurrency + audit trail** — four server actions (Pending→Mixing→Completed + Block + Resume) using `UPDATE ... WHERE version = $v RETURNING id` for exactly-one-winner semantics with user-facing "Order was modified by another user. Please refresh." conflict message; every transition writes an `order_events` row and calls `revalidateTag('production-orders')`; verified by live-DB concurrent-transition harness (TRANS-01..07)
- **Bulk XLSX import with `read-excel-file` 9.0.9** — drag-drop or file-picker upload, server-side parse + Zod validation, preview screen with row count + total weight + intra-file/DB duplicate detection, partial-import semantics with row-level errors, commit writes `import_batches` log entry, 2 MB body-size limit (`experimental.serverActions.bodySizeLimit`) — SheetJS CVE-2023-30533 avoided (IMPORT-01..07)
- **8 server-aggregated KPI sections closing the v1.0 deferred KPI ask** — mill-wide tons-today + per-line (Premix/Excel/CGM) breakdowns, per-column header strip (orders + lbs ratio), pending-backlog card, Pellet/Mash/Crumble formula-mix breakdown for today's completions, 7-day order-volume sparkline with "not enough data yet" empty state, cross-column blocked-exception list sortable by dwell time, overdue-badge warnings for orders past `earlyDeliveryDate` (KPI-01..08)
- **Three-source requirement traceability with zero orphans** — all 45 v2.0 REQ-IDs satisfied via independent confirmation across `VERIFICATION.md` SATISFIED tables (45/45), `SUMMARY.md` `requirements-completed:` frontmatter (45/45), and `REQUIREMENTS.md` traceability cells (45/45 `[x]` + 45/45 `Complete`); Phase 37 hygiene phase mechanically closed 4 actionable audit warnings (SUMMARY-FM backfill, traceability flip, INT-02 closure note, stale `missing_artifacts` clear)
- **Two integration-closure phases** — Phase 36 closed BUILD-01 (TypeScript void-cast on `nuqs` `setQuery` inside `startTransition`) so `npm run build` exits 0 and authored Phase 35's `VERIFICATION.md` + `UAT.md` to re-classify `VALIDATION.md` to `complete`; Phase 37 (docs-only) closed five hygiene warnings flagged by the post-Phase-36 audit so the final audit returned `passed` with zero warnings

**Tech debt at close:** 4 items (none blocking) — pre-existing 14 ClerkProvider test failures in `src/app/settings/__tests__/page.test.tsx` (carried from Phase 18); pre-existing Drizzle `IndexedColumn` TS errors in `src/db/schema/__tests__/{events,orders}.test.ts` (test-file-only); 3 strict-yaml `decisions:` array parse failures in `32-01-SUMMARY.md`, `33-02-SUMMARY.md`, `34-01-SUMMARY.md` (forgiving parser handles them); Phase 35 UAT chain-delegation provenance transparency note (operator-confirmed rather than executor-witnessed)

**Deferred items at close:** 2 v2.1 backlog candidates — KPI SQL integration smoke tests (closes the gap the mock-DB unit tests couldn't catch on the 5 `getSevenDayTrend` SQL fix commits); `/api/revalidate?tag=production-orders` POST endpoint so `npm run db:seed` can auto-invalidate dev `unstable_cache`

**Archive:** [v2.0-ROADMAP.md](./milestones/v2.0-ROADMAP.md), [v2.0-REQUIREMENTS.md](./milestones/v2.0-REQUIREMENTS.md), [v2.0-MILESTONE-AUDIT.md](./milestones/v2.0-MILESTONE-AUDIT.md)

---

## v1.5 Production Transition (Shipped: 2026-05-12)

**Phases completed:** 6 phases (25-30), 24 plans, 28 tasks
**Requirements:** 8/8 satisfied | **Timeline:** 3 days (2026-05-10 → 2026-05-12)
**Codebase:** ~11,650 LOC TypeScript | Audit: passed (re-audit #3, all gaps closed)

**Key accomplishments:**

- `/demo/*` namespace migration: orders, customers, and mill-production pages relocated with 404s on legacy paths; new Coming Soon homepage at `/` with full DashboardLayout
- Role-based access control end-to-end: Clerk `publicMetadata.role` wired into session JWT via custom template, type-safe `CustomJwtSessionClaims`, middleware enforces `demo` role on `/demo/*` with redirect to root
- Server-only role utilities (`checkRole`, `requireRole`) reading session claims without Clerk Backend API calls — fully TDD with 8-case Jest suite
- Client-component security audit: `/demo/orders`, `/demo/customers`, `/demo/mill-production` refactored to async RSCs with extracted client list components; `docs/security-patterns.md` captures canonical guard pattern
- Context-aware Sidebar showing demo vs production navigation; `DashboardLayout` adopted across all pages (including `/settings`), eliminating inline Sidebar+Header duplication
- Playwright E2E expansion: parameterized role-asymmetric route-protection coverage with Clerk auth fixtures, JWT template scenarios, and localhost-pinned authenticated projects
- Two integration-closure phases (29, 30) resolved post-audit cross-phase drift: Timeline + CustomerOrdersTab hrefs repointed to `/demo/orders`, Header dead branches deleted, `checkRole` orphan removed, stale E2E specs cleaned, all REQ-IDs traceable via SUMMARY frontmatter

**Tech debt at close:** 2 items (non-blocking) — pre-existing 14 ClerkProvider test failures in `settings/__tests__/page.test.tsx` (D-04 deferred); Phase 30 VALIDATION.md frontmatter promoted to nyquist_compliant during audit

**Deferred items at close:** 0

**Archive:** [v1.5-ROADMAP.md](./milestones/v1.5-ROADMAP.md), [v1.5-REQUIREMENTS.md](./milestones/v1.5-REQUIREMENTS.md), [v1.5-MILESTONE-AUDIT.md](./milestones/v1.5-MILESTONE-AUDIT.md)

---

## v1.4 Auth with Clerk (Shipped: 2026-05-10)

**Phases completed:** 5 phases (20-24), 9 plans
**Tests:** 304 passing + 5 E2E tests | **Requirements:** 9/9 satisfied
**Timeline:** 2 days (2026-05-09 → 2026-05-10)

**Key accomplishments:**

- Clerk SDK integration with 79 CSS variable references for automatic light/dark theme switching
- Playwright E2E testing infrastructure with 5 parameterized route protection tests
- Header UserButton displaying user avatar/name with sign-out action and loading skeleton
- Themed sign-in page with CGM Dashboard branding and ThemeToggle
- Production deployment with Vercel/Clerk configuration (Clerk 2FA blocks full E2E automation)

**Deferred items at close:** 1 (production E2E automation requires custom domain to disable Clerk 2FA)

**Archive:** [v1.4-ROADMAP.md](./milestones/v1.4-ROADMAP.md), [v1.4-REQUIREMENTS.md](./milestones/v1.4-REQUIREMENTS.md), [v1.4-MILESTONE-AUDIT.md](./milestones/v1.4-MILESTONE-AUDIT.md)

---

## v1.3 Design Hardening (Shipped: 2026-05-09)

**Phases completed:** 4 phases (16-19), 27 plans
**Tests:** 304 passing | **ESLint:** 0 errors
**Timeline:** 3 days (2026-05-07 → 2026-05-09)

**Key accomplishments:**

- Semantic token system with 200+ CSS variables (colors, spacing, typography, shadows) supporting light/dark themes
- CVA-based component library: Button (4 variants, 3 sizes), Card (compound pattern), Input/Select/Textarea, ThemeToggle
- All pages migrated to design tokens (Orders, Customers, Mill Production, Settings) with zero hardcoded values
- Accessibility infrastructure with jest-axe, eslint-plugin-jsx-a11y, and WCAG 2.1 AA compliance
- Comprehensive design system documentation: 148 token definitions, 10 component API guides
- VoiceOver manual verification and keyboard navigation across all interactive elements

**Deferred items at close:** 0

**Archive:** [v1.3-ROADMAP.md](./milestones/v1.3-ROADMAP.md), [v1.3-REQUIREMENTS.md](./milestones/v1.3-REQUIREMENTS.md)

---

## v1.2 Customers Page (Shipped: 2026-05-06)

**Phases completed:** 6 phases (10-15), 15 plans
**Files modified:** 128 | **Lines of code:** 6,426 TypeScript
**Timeline:** 5 days (2026-05-01 → 2026-05-05)

**Key accomplishments:**

- Customer list page with search, sort by recent activity, and status indicators (order counts, change flags, bin alerts)
- Customer detail page with header (contact info, summary stats) and navigation from list view
- Unified activity timeline merging orders, deliveries, and bin alerts with expand/collapse behavior
- Bin visualization with vertical tank gauges showing fill percentage and threshold-based coloring (green/yellow/red)
- Data layer foundation with type-safe Customer and Bin interfaces, mock services, and stats aggregation

**Deferred items at close:** 2 verification gaps (Phase 10 & 12 design sign-off - human_needed)

**Archive:** [v1.2-ROADMAP.md](./milestones/v1.2-ROADMAP.md), [v1.2-REQUIREMENTS.md](./milestones/v1.2-REQUIREMENTS.md)

---

## v1.1 Mill Production Dashboard (Shipped: 2026-04-29)

**Phases completed:** 4 phases (6-9), 5 plans, 10 tasks
**Timeline:** 2 days (2026-04-28 → 2026-04-29)

**Key accomplishments:**

- Status filter pill design with 4 interaction states (hover, active, multi-select, filtered)
- Expanded mock production orders from 12 to 33 with realistic Book1.xlsx data
- Extracted reusable FilterPill component with TDD (11 tests) and generic color props
- Integrated filter pills into mill-production page with multi-select toggle behavior
- Added design tokens (12 status colors, typography) and eliminated all hardcoded hex values

**Deferred items at close:** 11 items (see STATE.md Deferred Items)

**Archive:** [v1.1-ROADMAP.md](./milestones/v1.1-ROADMAP.md), [v1.1-REQUIREMENTS.md](./milestones/v1.1-REQUIREMENTS.md)

---

## v1.0 MVP (Shipped: 2026-04-29)

**Phases completed:** 5 phases (0-5, excluding Phase 3), 12 plans, ~24 tasks
**Files modified:** 121 | **Lines of code:** 2,699 TypeScript
**Timeline:** 49 days (2026-03-10 → 2026-04-28)

**Key accomplishments:**

- Infrastructure layer established: TypeScript types, mock orders service, StatusBadge component, loading skeletons
- Interactive orders table: Multi-status filtering, debounced search with text highlighting, keyboard navigation, row selection
- Order details panel: Dynamic data display, timeline visualization with status events, inline change history, sort persistence
- Functional navigation: Auto-detecting active state sidebar using usePathname() with prefix matching for nested routes
- Complete header system: Global search wiring to table, notification dropdown with localStorage-backed read state, settings page

**Known gaps (deferred to v1.1):**

- KPI-01: KPI cards display computed values from order data (Phase 3 not started)
- KPI-02: Click KPI card to filter table to relevant orders (Phase 3 not started)

**Deferred items at close:** 10 items (see STATE.md Deferred Items)

**Archive:** [v1.0-ROADMAP.md](./milestones/v1.0-ROADMAP.md), [v1.0-REQUIREMENTS.md](./milestones/v1.0-REQUIREMENTS.md)

---
