---
phase: 32-schema-migrations-and-seed-data
plan: "04"
subsystem: database/migrations
status: checkpoint-pending
checkpoint_task: "Task 2: operator SQL review + Task 3: drizzle-kit migrate"
tags: [drizzle-kit, migration, generate, migrate, blocking, DATA-06]
dependency_graph:
  requires: [32-01, 32-03]
  provides: [drizzle/0000_aromatic_stone_men.sql, drizzle/meta/_journal.json, drizzle/meta/0000_snapshot.json]
  affects: [32-05, 32-06, 33-*, 34-*]
tech_stack:
  added: []
  patterns: [drizzle-kit generate, drizzle-kit migrate, Wave-0 contract testing]
key_files:
  created:
    - drizzle/0000_aromatic_stone_men.sql
    - drizzle/meta/_journal.json
    - drizzle/meta/0000_snapshot.json
    - src/db/__tests__/migration.test.ts
  modified:
    - package.json
decisions:
  - "DATABASE_URL_UNPOOLED is required by drizzle.config.ts even for generate (guard is unconditional); run with DATABASE_URL_UNPOOLED set to any non-empty value for generate since no DB connection is made"
  - "drizzle-kit generates lowercase 'ON DELETE cascade' not uppercase CASCADE; test assertion updated to match actual output"
  - "Migration filename: 0000_aromatic_stone_men.sql (drizzle-kit random word suffix per D-24)"
metrics:
  completed_date: "2026-05-13"
  tasks_completed: 1
  tasks_total: 3
  tasks_checkpoint: 2
---

# Phase 32 Plan 04: drizzle-kit Generate + Migrate Summary

**One-liner:** Initial schema migration generated (`0000_aromatic_stone_men.sql`) with Wave-0 Jest contract test (17 assertions GREEN); awaiting operator SQL review before `drizzle-kit migrate` applies to Neon dev DB.

## Status: CHECKPOINT REACHED (Task 2)

Tasks 1 (Wave-0 test + package.json scripts) and the generate portion of the flow are complete. The plan is paused at `checkpoint:human-action` Task 2 for operator SQL review before Task 3 (`drizzle-kit migrate`) runs.

## Completed Tasks

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Wave-0 migration test stub + package.json scripts | `cdb6b2e` | `src/db/__tests__/migration.test.ts`, `package.json` |
| 2 (generate) | Run drizzle-kit generate (autonomous part) | `b2c57a3` | `drizzle/0000_aromatic_stone_men.sql`, `drizzle/meta/_journal.json`, `drizzle/meta/0000_snapshot.json`, `src/db/__tests__/migration.test.ts` (test fix) |

## Pending Tasks

| Task | Name | Status | Gate |
|------|------|--------|------|
| 2 (review) | Operator SQL review of 0000_aromatic_stone_men.sql | AWAITING | `checkpoint:human-action` — operator types "approved" |
| 3 | drizzle-kit migrate (apply to Neon dev DB) | BLOCKED | Depends on Task 2 approval |

## Generated SQL Summary

**Migration file:** `drizzle/0000_aromatic_stone_men.sql`

**Contents verified:**
- `CREATE TYPE "public"."production_state" AS ENUM('Pending', 'Mixing', 'Completed', 'Blocked')` — line 2
- `CREATE TYPE "public"."mill_line" AS ENUM('Premix', 'Excel', 'CGM')` — line 1
- `CREATE TABLE "production_orders"` — 13 columns, `"version" integer DEFAULT 1 NOT NULL`
- `CREATE TABLE "order_events"` — FK: `REFERENCES "public"."production_orders"("id") ON DELETE cascade ON UPDATE no action`
- `CREATE TABLE "import_batches"` — 5 columns
- `CREATE TABLE "users"` — `"id" text PRIMARY KEY NOT NULL` (no UUID, no FK)
- `CREATE INDEX "idx_orders_state"` on production_orders(state)
- `CREATE INDEX "idx_orders_mill_line"` on production_orders(mill_line)
- `CREATE UNIQUE INDEX "idx_orders_order_number"` on production_orders(order_number)
- `CREATE INDEX "idx_events_order_id_changed_at_desc"` on order_events(order_id, changed_at DESC)
- `DEFAULT gen_random_uuid()` on uuid PK columns — no pgcrypto extension needed (Neon preinstalled)
- NO `CREATE EXTENSION pgcrypto` — D-23 Pitfall 6 satisfied
- NO FK on `created_by`, `changed_by`, `imported_by` — SC#2 satisfied

## Wave-0 Migration Test

**File:** `src/db/__tests__/migration.test.ts`

- 17 structural assertions against `0000_aromatic_stone_men.sql`
- All 17 assertions pass GREEN after `drizzle-kit generate`
- Would fail RED on fresh checkout (no `./drizzle/` dir) — regression guard confirmed

## package.json Scripts

```json
"db:generate": "drizzle-kit generate",
"db:migrate": "drizzle-kit migrate"
```

`db:push` is absent — D-23 / SC#5 ban verified by `! grep -q '"db:push"' package.json`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed ON DELETE cascade case in test assertion**
- **Found during:** Task 2 (generate + verify)
- **Issue:** Test asserted `ON DELETE CASCADE` (uppercase) but drizzle-kit generates `ON DELETE cascade` (lowercase)
- **Fix:** Updated assertion in `migration.test.ts` to match actual drizzle-kit output
- **Files modified:** `src/db/__tests__/migration.test.ts`
- **Commit:** `b2c57a3`

**2. [Rule 3 - Blocking] drizzle-kit generate requires DATABASE_URL_UNPOOLED env var**
- **Found during:** Task 2 (generate)
- **Issue:** `drizzle.config.ts` unconditionally throws if `DATABASE_URL_UNPOOLED` is unset — even for `generate` which needs no DB connection. `.env.local` exists in main repo but not in worktree (worktrees don't inherit env files).
- **Fix:** Set `DATABASE_URL_UNPOOLED` to a placeholder URL in the environment before running generate (generate does not connect to DB, only reads schema files)
- **Impact:** None on migration SQL output. `drizzle-kit migrate` (Task 3) requires the real URL from `.env.local` in the project root.
- **Downstream note:** For Task 3, ensure `.env.local` is accessible (run from project root or symlink to worktree root before migrate).

## Known Stubs

None — all SQL table definitions are fully specified; no placeholder content.

## Threat Flags

None — no new network endpoints or auth paths introduced. The generated SQL file is deterministic from schema sources and is committed for operator review before any apply.

## Self-Check

- [x] `drizzle/0000_aromatic_stone_men.sql` exists: FOUND
- [x] `drizzle/meta/_journal.json` exists: FOUND
- [x] `drizzle/meta/0000_snapshot.json` exists: FOUND
- [x] `src/db/__tests__/migration.test.ts` exists: FOUND
- [x] `package.json` has `db:generate` and `db:migrate`: VERIFIED
- [x] `package.json` does NOT have `db:push`: VERIFIED
- [x] Commits `cdb6b2e` and `b2c57a3` exist: VERIFIED
- [x] All 17 migration test assertions: GREEN

## Self-Check: PASSED
