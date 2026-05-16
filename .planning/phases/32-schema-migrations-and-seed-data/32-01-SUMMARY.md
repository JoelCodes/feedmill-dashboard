---
phase: 32-schema-migrations-and-seed-data
plan: "01"
subsystem: db-schema
tags: [drizzle, schema, pgenum, postgres, typescript]
requirements-completed: [DATA-02, DATA-03, DATA-04, DATA-05]

dependency_graph:
  requires: []
  provides:
    - src/db/schema/orders.ts
    - src/db/schema/events.ts
    - src/db/schema/imports.ts
    - src/db/schema/users.ts
    - src/db/schema/index.ts
  affects:
    - drizzle.config.ts (schema path updated in Plan 03)
    - src/db/schema.ts (placeholder — deleted in Plan 03)

tech_stack:
  added: []
  patterns:
    - Drizzle pgTable + pgEnum schema authoring (drizzle-orm/pg-core)
    - Co-located $inferSelect / $inferInsert inferred types (D-03)
    - Postgres native ENUM types via pgEnum
    - Array form for indexes (second arg of pgTable)
    - FK with onDelete: cascade via .references()
    - Composite DESC index via .changedAt.desc()

key_files:
  created:
    - src/db/schema/orders.ts
    - src/db/schema/events.ts
    - src/db/schema/imports.ts
    - src/db/schema/users.ts
    - src/db/schema/index.ts
    - src/db/schema/__tests__/orders.test.ts
    - src/db/schema/__tests__/events.test.ts
    - src/db/schema/__tests__/imports.test.ts
    - src/db/schema/__tests__/users.test.ts
  modified: []

decisions:
  - D-01: Schema split into per-table directory; index.ts barrel re-exports all
  - D-03: Inferred types co-located in each table file (no central types file)
  - D-04: ProductionOrder from $inferSelect is the canonical type (DemoOrder rename deferred to Plan that touches types)
  - D-07: Postgres native ENUMs via pgEnum in orders.ts; re-exported from barrel
  - D-08: updatedAt uses $onUpdate(() => new Date()) — no DB trigger
  - D-09: created_by / changed_by / imported_by are text NOT NULL, no FK; users.id is text PK
  - D-10: order_events.orderId FK to production_orders.id with onDelete: cascade
  - D-20: Four indexes shipped; NO pg_trgm (D-21); NO composite mill_line+state (D-22)
  - D-23: drizzle-kit push NOT used — generate/migrate workflow only

metrics:
  duration: "3m 49s"
  completed_date: "2026-05-13"
  tasks_completed: 4
  tasks_total: 4
  files_created: 9
  files_modified: 0
---

# Phase 32 Plan 01: Schema Table Definitions Summary

Four Drizzle pgTable modules (`production_orders`, `order_events`, `import_batches`, `users`) defined with Postgres native ENUMs, FK CASCADE, co-located inferred types, and Wave-0 test stubs, establishing the complete schema surface consumed by drizzle-kit generate in Plan 04.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Wave-0 test stubs (RED gate) | d854572 | 4 test files under src/db/schema/__tests__/ |
| 2 | orders.ts — cornerstone module with enums + indexes | 4fe1077 | src/db/schema/orders.ts |
| 3 | events.ts, imports.ts, users.ts — sibling modules | 2442061 | src/db/schema/events.ts, imports.ts, users.ts |
| 4 | Schema barrel index.ts | f3994da | src/db/schema/index.ts |

## Verification Results

- **All 13 schema tests pass** (`npm test -- --testPathPatterns="src/db/schema" --watchAll=false`)
- **TypeScript build clean** (`npx tsc --noEmit` exits 0)
- **D-21 honored**: No `pg_trgm`, no GIN indexes
- **D-22 honored**: No composite `(mill_line, state)` index
- **D-23 honored**: No `drizzle-kit push` invocations anywhere
- **T-32-06 mitigated**: No `import 'server-only'` in any schema file

## Schema Summary

### `production_orders` (13 columns)
- `id` uuid PK defaultRandom() (D-06)
- `orderNumber` text notNull
- `customer` text notNull
- `product` text notNull
- `weightLbs` numeric(10,2) notNull (D-12; TypeScript infers as `string`)
- `deliveryTime` text notNull (D-13 — display string, not a time type)
- `state` productionStateEnum notNull (Pending/Mixing/Completed/Blocked)
- `millLine` millLineEnum notNull (Premix/Excel/CGM)
- `textureType` text nullable (D-12)
- `lineCode` text nullable (D-12)
- `version` integer notNull default(1) (D-11 — optimistic concurrency)
- `createdBy` text notNull, NO FK (D-09 / ROADMAP SC#2)
- `createdAt` timestamp withTimezone notNull defaultNow() (D-14)
- `updatedAt` timestamp withTimezone notNull defaultNow() $onUpdate(() => new Date()) (D-08)

Indexes: `idx_orders_state`, `idx_orders_mill_line`, `idx_orders_order_number` (UNIQUE)

### `order_events` (7 columns)
- FK: `orderId` uuid → `production_orders.id` onDelete: cascade (D-10)
- `fromState` productionStateEnum nullable (initial event has no from-state)
- `toState` productionStateEnum notNull
- `changedBy` text notNull, NO FK (D-09)
- `changedAt` timestamp withTimezone notNull defaultNow()
- `note` text nullable

Composite index: `idx_events_order_id_changed_at_desc` on (orderId, changedAt.desc())

### `import_batches` (5 columns)
- `fileName`, `rowCount`, `importedBy` (text notNull, no FK per D-09), `importedAt`

### `users` (5 columns)
- `id` text PRIMARY KEY — stores Clerk `user_xxx` directly (D-09)
- `displayName`, `email` nullable; `lastSeenAt`, `createdAt` timestamps

### Barrel (`index.ts`)
- Four star re-exports: `./orders`, `./events`, `./imports`, `./users`
- drizzle.config.ts schema path will point here after Plan 03 (D-02)

## Deviations from Plan

None — plan executed exactly as written. All four TDD cycles (RED → GREEN) completed per the test stubs in Task 1. The existing `src/db/schema.ts` placeholder was NOT deleted (scope locked: Plan 03 handles that per D-02 notes).

## TDD Gate Compliance

- RED gate (Task 1): All 4 test files failed with `Cannot find module` before source modules existed
- GREEN gate (Task 2): `orders.test.ts` (4 tests) passed after `orders.ts` created
- GREEN gate (Task 3): `events.test.ts`, `imports.test.ts`, `users.test.ts` (9 tests) passed after sibling modules created
- All gates confirmed with automated test runs before each commit

## Known Stubs

None — all schema definitions are complete and complete the plan's goal. No placeholder data or unconnected wiring.

## Threat Flags

No new security-relevant surface beyond what the plan's threat model covers. Schema files contain no credentials, connection strings, or server-only imports (T-32-06 mitigated).

## Self-Check: PASSED

Files exist:
- src/db/schema/orders.ts: FOUND
- src/db/schema/events.ts: FOUND
- src/db/schema/imports.ts: FOUND
- src/db/schema/users.ts: FOUND
- src/db/schema/index.ts: FOUND
- src/db/schema/__tests__/orders.test.ts: FOUND
- src/db/schema/__tests__/events.test.ts: FOUND
- src/db/schema/__tests__/imports.test.ts: FOUND
- src/db/schema/__tests__/users.test.ts: FOUND

Commits exist:
- d854572 (test stubs): FOUND
- 4fe1077 (orders.ts): FOUND
- 2442061 (sibling modules): FOUND
- f3994da (index.ts barrel): FOUND
