---
gsd_state_version: 1.0
milestone: v2.0
milestone_name: Mill Production MVP
status: executing
last_updated: "2026-05-15T04:01:17.945Z"
last_activity: 2026-05-14
progress:
  total_phases: 5
  completed_phases: 4
  total_plans: 35
  completed_plans: 35
  percent: 80
---

# Project State: v2.0 Mill Production MVP

**Milestone:** v2.0 Mill Production MVP
**Last shipped:** v1.5 Production Transition (2026-05-12)
**Last updated:** 2026-05-12

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-05-12)

**Core value:** Operations staff can see and manage feed orders in real-time, from pending through delivery.

**Current focus:** Phase 34 — production-dashboard-ui-and-homepage-promotion

## Current Position

Phase: 34 (production-dashboard-ui-and-homepage-promotion) — EXECUTING
Plan: 1 of 12
**Phase:** 34
**Plan:** Not started
**Status:** Executing Phase 34
**Last activity:** 2026-05-14

### Progress Bar

```
v2.0 Progress: [░░░░░░░░░░] 0/5 phases complete
Phase 31 ░  Phase 32 ░  Phase 33 ░  Phase 34 ░  Phase 35 ░
```

## Performance Metrics

**Milestone v1.5 (just shipped):**

- **Phases:** 6 phases (25-30)
- **Plans:** 24 plans, 28 tasks
- **Requirements:** 8/8 satisfied
- **Timeline:** 3 days (2026-05-10 → 2026-05-12)
- **Audit:** passed (re-audit #3, all gaps closed)

**Cumulative across milestones:** see `.planning/MILESTONES.md`

## Accumulated Context

### Open Blockers

**Manual Clerk Dashboard cutover pending (from quick task 260512-kfy):**

The `roles[]` refactor is code-complete but the Clerk Dashboard JWT template and demo user `publicMetadata` have not been migrated yet. Until this is done, `/demo/*` redirects all users to `/` (including the demo user). This is a one-time operator action — not a phase requirement.

**Runbook** (from `260512-kfy-01-SUMMARY.md`):

1. `Sessions → Customize session token` → replace body: `{"metadata": {"roles": "{{user.public_metadata.roles}}"}}`
2. Users → demo user → Edit publicMetadata → `{"roles": ["demo"]}`
3. If admin user exists: `{"roles": ["admin"]}`
4. Leave norole user untouched (no `publicMetadata.roles` field — do NOT write empty array)
5. Sign out of active dev sessions. Sign back in as demo user.
6. Navigate to `/demo/orders` — confirm page renders (no redirect)
7. Decode `__session` cookie at `jwt.io` — confirm `"metadata": {"roles": ["demo"]}`
8. Sign out, sign in as norole user, navigate to `/demo/orders` — confirm redirect to `/`

**Resume signal:** Type "dashboard migrated" to confirm cutover complete.

### Carried Deferred Items

- Production E2E automation requires custom domain to disable Clerk 2FA (carried from v1.4)
- KPI Cards display computed values + click-to-filter (carried from v1.0 — closes in Phase 35)
- 14 pre-existing ClerkProvider test failures in `src/app/settings/__tests__/page.test.tsx` (D-04 deferred from Phase 27)

### Key Implementation Notes (v2.0 decisions pre-loaded)

**Role shape:** `roles: Role[]` (plural array) is the canonical shape after quick task 260512-kfy. All v2.0 auth work uses `roles.includes('mill_operator')` — no singular `role` field.

**DB driver:** Use `@neondatabase/serverless` with `drizzle-orm/neon-http`. `import 'server-only'` in `src/db/index.ts` is mandatory — prevents Edge-runtime contamination. `DATABASE_URL` = pooled endpoint; `DATABASE_URL_UNPOOLED` = direct (migrations only).

**Migration discipline:** `drizzle-kit generate` + `drizzle-kit migrate` from day 1. `drizzle-kit push` is banned after initial schema is created.

**Mutation invariant:** Every server action that mutates data must call `revalidateTag('production-orders')` before returning. This is a definition-of-done checklist item for every action in Phase 33.

**Concurrency control:** `version INTEGER DEFAULT 1` must be in the initial `production_orders` schema. Adding it retroactively cascades into all action signatures.

**URL state:** Use `nuqs` 2.8.9 with `createSearchParamsCache` for async `searchParams` unwrapping in RSC (required by Next.js 16 — `searchParams` is a Promise).

**XLSX import library:** `read-excel-file` 9.0.9 only. `xlsx`/SheetJS npm version has unpatched CVE-2023-30533.

**Polling:** 30-second interval via `setInterval(() => router.refresh(), 30_000)`. Named constant `REFRESH_INTERVAL_MS = 30_000`. No SSE or Pusher for v2.0.

**Sidebar nav:** Production nav condition is `!pathname.startsWith('/demo/')` — not a `/production/` prefix check.

**force-dynamic:** Apply `export const dynamic = 'force-dynamic'` only to live-data pages (`/`). Do not apply to settings or static pages.

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260512-kfy | Refactor user role to roles | 2026-05-12 | cd32cd4 | [260512-kfy-refactor-user-role-to-roles](./quick/260512-kfy-refactor-user-role-to-roles/) |

## Session Continuity

**Context for next session:**

v2.0 roadmap is defined with 5 phases (31-35) following the dependency-layer build order from ARCHITECTURE.md: role infrastructure → schema → server actions/import → production UI → KPI sections. All 38 v2.0 requirements are mapped.

The Clerk Dashboard manual cutover (quick task 260512-kfy Task 3) is still pending and must be completed before Phase 31 work can be fully validated.

**Next step:** Run `/gsd-plan-phase 31` to plan Phase 31 (Role Expansion and DB Infrastructure).

---
*State updated: 2026-05-12 — v2.0 roadmap created (Phases 31-35)*
*Auto-updated by GSD workflow*
