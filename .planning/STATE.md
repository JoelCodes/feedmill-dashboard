---
gsd_state_version: 1.0
milestone: v2.0
milestone_name: Mill Production MVP
status: shipped
last_updated: "2026-05-16T15:30:00.000Z"
last_activity: 2026-05-16 — Milestone v2.0 shipped and archived
progress:
  total_phases: 7
  completed_phases: 7
  total_plans: 52
  completed_plans: 52
  percent: 100
---

# Project State: Awaiting Next Milestone

**Last shipped:** v2.0 Mill Production MVP (2026-05-16)
**Last updated:** 2026-05-16

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-05-16 after v2.0 milestone)

**Core value:** Operations staff can see and manage feed orders in real-time, from pending through delivery.

**Current focus:** Planning next milestone (run `/gsd-new-milestone`).

## Current Position

Phase: —
Plan: —
Status: Awaiting next milestone
Last activity: 2026-05-16 — Milestone v2.0 shipped and archived

## Performance Metrics

**Milestone v2.0 (just shipped):**

- **Phases:** 7 phases (31-37)
- **Plans:** 52 plans, 74 tasks
- **Requirements:** 45/45 satisfied across 3 sources (VERIFICATION ⨯ SUMMARY-FM ⨯ traceability)
- **Timeline:** 3 days (2026-05-13 → 2026-05-16)
- **Audit:** passed (re-audit #4, all hygiene warnings closed by Phase 37 Wave 1)
- **LOC delta:** ~14,673 src/ insertions (TypeScript)

**Cumulative across milestones:** see `.planning/MILESTONES.md`

## Accumulated Context

### Open Blockers

None.

### Carried Deferred Items

- Production E2E automation requires custom domain to disable Clerk 2FA (carried from v1.4)
- 14 pre-existing ClerkProvider test failures in `src/app/settings/__tests__/page.test.tsx` (D-04 carried from Phase 27)
- Pre-existing Drizzle `IndexedColumn` TS errors in `src/db/schema/__tests__/{events,orders}.test.ts` (test-file only)
- KPI SQL integration smoke tests — backlog candidate for v2.1 (mock DB unit tests didn't catch the 5 `getSevenDayTrend` SQL fix commits)
- `/api/revalidate?tag=production-orders` POST endpoint so `npm run db:seed` auto-invalidates dev `unstable_cache` (drawer-loads-orders gotcha)
- Click KPI card to filter table to relevant orders (deferred from v1.0; not in v2.0 scope)
- v2.0 Phase 35 UAT chain-delegation transparency note (operator-confirmed rather than executor-witnessed)

### Key Implementation Notes (v2.0 — load-bearing for next milestone)

**Role shape:** `roles: Role[]` (plural array) post quick task 260512-kfy. All access checks via `roles.includes(...)` — no singular `role` field.

**DB driver:** `@neondatabase/serverless` + `drizzle-orm/neon-http`. `import 'server-only'` on `src/db/index.ts` line 1 is mandatory. `DATABASE_URL` = pooled; `DATABASE_URL_UNPOOLED` = direct (migrations).

**Migration discipline:** `drizzle-kit generate` + `drizzle-kit migrate` only. `drizzle-kit push` is banned.

**Mutation invariant:** Every server action that mutates data calls `revalidateTag('production-orders')` before returning.

**Concurrency control:** `version INTEGER DEFAULT 1` + `UPDATE ... WHERE version = $v RETURNING id`. User-facing locked-conflict message: "Order was modified by another user. Please refresh."

**URL state:** `nuqs` 2.8.9 with `createSearchParamsCache` for async `searchParams` (Next.js 16). Use shallow:true for filter/search; shallow:false for keys that need RSC re-fetch (drawer).

**XLSX library:** `read-excel-file` 9.0.9 only. `xlsx`/SheetJS is banned (CVE-2023-30533).

**Polling:** `setInterval(() => router.refresh(), REFRESH_INTERVAL_MS)` where `REFRESH_INTERVAL_MS = 30_000`. No SSE/Pusher.

**force-dynamic:** Apply `export const dynamic = 'force-dynamic'` only to live-data pages (`/`). Do not apply to settings or static pages.

**Sidebar nav:** Production nav condition is `!pathname.startsWith('/demo/')`.

### Dev Gotcha (recurrent)

After `npm run db:seed`, restart `npm run dev` or the drawer shows "Order not found" — stale UUIDs in `unstable_cache`. Captured in `memory/cgm_seed_dev_cache_gotcha.md`. v2.1 backlog: `/api/revalidate?tag=production-orders` POST endpoint.

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260512-kfy | Refactor user role to roles | 2026-05-12 | cd32cd4 | [260512-kfy-refactor-user-role-to-roles](./quick/260512-kfy-refactor-user-role-to-roles/) |

## Session Continuity

**Context for next session:** v2.0 is shipped and tagged. The codebase has a live mill production dashboard at `/`, Postgres + Drizzle persistence, role-based access control, bulk XLSX import, and 8 KPI sections. All v2.0 phase artifacts are archived under `.planning/milestones/v2.0-*`.

**Next step:** Run `/gsd-new-milestone` to scope and plan v2.1.

---
*State updated: 2026-05-16 — v2.0 Mill Production MVP shipped*
*Auto-updated by GSD workflow*

## Operator Next Steps

- Start the next milestone with `/gsd-new-milestone`
- (Optional) Review v2.1 backlog candidates captured in PROJECT.md → Deferred section
