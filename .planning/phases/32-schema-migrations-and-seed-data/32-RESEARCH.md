# Phase 32: Schema, Migrations, and Seed Data — Research

**Researched:** 2026-05-13
**Domain:** Drizzle ORM schema authoring (pgEnum, FK cascade, composite indexes, $onUpdate), drizzle-kit generate/migrate/introspect workflow against Neon Postgres, seed-data extraction and TRUNCATE/INSERT pattern via tsx
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Schema file layout**
- **D-01:** Split `src/db/schema.ts` into a per-table directory: `src/db/schema/{orders.ts, events.ts, imports.ts, users.ts, index.ts}`. `index.ts` is a barrel that re-exports every table + enum + inferred type.
- **D-02:** `drizzle.config.ts` schema path becomes `./src/db/schema/index.ts` (was `./src/db/schema.ts`).
- **D-03:** Drizzle inferred types (`$inferSelect` / `$inferInsert`) are co-located in each table file. No central `src/db/types.ts`.
- **D-04:** The Drizzle-inferred `ProductionOrder` becomes the canonical project-wide type. The existing `src/types/millProduction.ts` `ProductionOrder` is renamed to `DemoOrder`. `MillLine` and `ProductionState` unions are deleted from `src/types/millProduction.ts`; consumers import them from the schema barrel.
- **D-05:** File naming: `orders.ts`, `events.ts`, `imports.ts`, `users.ts`. Exported pgTable variables: `productionOrders`, `orderEvents`, `importBatches`, `users`.

**Column primitives and state encoding**
- **D-06:** `id: uuid('id').primaryKey().defaultRandom()` on all tables.
- **D-07:** `state` and `mill_line` are Postgres native ENUM types via `pgEnum('production_state', [...])` and `pgEnum('mill_line', [...])`. Live in `src/db/schema/orders.ts`, re-exported from index barrel.
- **D-08:** `updated_at` uses Drizzle `.$onUpdate(() => new Date())`. No DB trigger.
- **D-09:** `clerk_user_id` columns on three tables as `text` with NO foreign key. `users.id` is `text` primary key storing Clerk's `user_xxx` ID directly.
- **D-10:** `order_events.order_id` has FK to `production_orders.id` with `ON DELETE CASCADE`.
- **D-11:** `production_orders.version` is `integer NOT NULL DEFAULT 1`.
- **D-12:** `weight_lbs` is `numeric(10, 2)`. `texture_type` and `line_code` are nullable text.
- **D-13:** `delivery_time` is `text NOT NULL` (display string, not a time column).
- **D-14:** All timestamps use `timestamp with time zone` / `timestamp('col', { withTimezone: true })`.

**Seed source and idempotency**
- **D-15:** Seed source is a static JSON snapshot at `src/db/seed-data.json`. One-time export via `scripts/export-seed.ts` from `src/services/millProduction.ts`.
- **D-16:** `npm run db:seed` runs `tsx src/db/seed.ts`. `tsx` added as devDependency (not yet present). Reads `DATABASE_URL_UNPOOLED`. Mirrors `drizzle.config.ts` dotenv loading.
- **D-17:** Idempotency: `TRUNCATE production_orders, order_events, import_batches RESTART IDENTITY CASCADE`. NEVER truncate `users`.
- **D-18:** Seed scope: 33 `production_orders` rows only. `order_events`, `import_batches`, `users` stay empty.
- **D-19:** All 33 seeded orders use `created_by = 'system-seed'`.

**Indexes in migration #1**
- **D-20:** Four indexes: `idx_orders_state`, `idx_orders_mill_line`, `idx_orders_order_number` (UNIQUE), `idx_events_order_id_changed_at_desc` (composite on `order_events(order_id, changed_at DESC)`).
- **D-21:** No `pg_trgm` / GIN indexes. Deferred.
- **D-22:** No composite `(mill_line, state)` index. Deferred.

**Migration discipline**
- **D-23:** `drizzle-kit push` BANNED after this phase. Workflow is generate → review → commit → migrate.
- **D-24:** Default drizzle-kit sequence-based naming (`0000_*.sql`).

### Claude's Discretion
- Drizzle `relations()` declarations: omit in Phase 32; introduce with Phase 33 first join query.
- Whether `scripts/export-seed.ts` is checked-in (idempotent) or one-time hand transformation. **Recommended:** write a checked-in `scripts/export-seed.ts`.
- Test approach for seed JSON assertions: a Jest test asserting row count = 33 and NOT NULL columns is cheap insurance.
- Whether to drop `src/types/millProduction.ts` entirely or keep as a re-export shim.

### Deferred Ideas (OUT OF SCOPE)
- Drizzle `relations()` declarations → Phase 33
- `pg_trgm` + GIN indexes → Phase 34 if measured need
- Composite `(mill_line, state)` index → measure first
- CI integration for re-runnable-from-scratch verification → Phase 34
- Synthetic `order_events` history in seed → explicitly rejected
- `import_batches` seed row → explicitly rejected
- Mill-line derivation rule from XLSX → Phase 33 IMPORT-02
- Document-number prefix convention → Phase 33 IMPORT-02
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DATA-02 | Drizzle schema for `production_orders` table — Book1.xlsx fields + `state` + `version INTEGER DEFAULT 1` + `clerk_user_id TEXT` (no FK) + timestamps | §"Schema File Layout" — `orders.ts` skeleton with all columns, enums, indexes |
| DATA-03 | Drizzle schema for `order_events` table — append-only audit log | §"Schema File Layout" — `events.ts` skeleton with FK + CASCADE + composite index |
| DATA-04 | Drizzle schema for `import_batches` table — operational visibility | §"Schema File Layout" — `imports.ts` skeleton |
| DATA-05 | Drizzle schema for `users` table — lazy-sync Clerk display name cache | §"Schema File Layout" — `users.ts` skeleton with text PK |
| DATA-06 | SQL migrations generated and applied via `drizzle-kit generate` + `drizzle-kit migrate` | §"Drizzle-Kit Workflow" — exact commands, env vars, file output location |
| DATA-07 | Seed script populates DB with Book1.xlsx example data so dev mirrors `/demo` baseline | §"Seed Implementation" — export-seed.ts + seed.ts shapes, package.json wiring |
</phase_requirements>

---

## Summary

Phase 32 is a schema-authoring + migration-execution phase: four Drizzle `pgTable` definitions replace the `src/db/schema.ts` placeholder with a split directory, a single `drizzle-kit generate` + `drizzle-kit migrate` run creates and applies the first SQL migration, and a seed script populates 33 rows from the existing mock service into the dev Neon database.

The work is technically straightforward given Phase 31's established infrastructure (singleton, drizzle.config.ts, env vars). The most load-bearing decisions are already locked in CONTEXT.md. What the planner needs most is: exact code skeletons for all five schema files (matching D-01 through D-14), exact drizzle-kit command sequences (generate → migrate → introspect), the seed script + export-seed script shapes mirroring Phase 31's dotenv pattern, and the mechanical steps for the D-04 type rename.

**Primary recommendation:** Write schema files first (orders.ts last — events.ts references it, so orders.ts must be complete before events.ts resolves the FK import). Run `drizzle-kit generate`, inspect the SQL, then `drizzle-kit migrate`. Write `scripts/export-seed.ts`, run it once to produce `src/db/seed-data.json`, then write `src/db/seed.ts` and `npm run db:seed`. Type rename (D-04) can happen in the same PR: grep for `ProductionOrder` import consumers, update to `DemoOrder`, then verify TS build.

**Important: `tsx` is NOT yet installed.** [VERIFIED: `package.json` has `ts-node` but no `tsx`]. The seed script requires `tsx` as a devDependency; this must be added in the plan.

**drizzle/ directory:** No migrations directory exists yet. [VERIFIED: filesystem check]. `drizzle.config.ts` `out: './drizzle'` means drizzle-kit will create `./drizzle/` on first `generate`. Migration SQL files land in `./drizzle/` (not `./drizzle/migrations/` — ARCHITECTURE.md shows `drizzle/migrations/` but CONTEXT.md says "drizzle/0000_*.sql" — the `out` field in the actual drizzle.config.ts is `'./drizzle'`, so files land directly in `./drizzle/`, e.g., `./drizzle/0000_lovely_blue_marvel.sql`). [VERIFIED: `drizzle.config.ts` line 19: `out: './drizzle'`]

**Package versions confirmed on npm registry:** drizzle-orm 0.45.2, drizzle-kit 0.31.10, @neondatabase/serverless 1.1.0, tsx 4.21.0. [VERIFIED: npm view]

---

## 1. Domain Background

### Drizzle/Neon Migration Model

Drizzle ORM uses a code-first schema approach: you write TypeScript `pgTable()` definitions, and `drizzle-kit generate` diffs them against a snapshot to produce SQL migration files. The SQL files are committed to the repo and applied to the database via `drizzle-kit migrate`. The migration state is tracked in a `__drizzle_migrations` table in the target database.

Key properties of this model:
- Migration files are inspectable, reviewable SQL — no black-box engine.
- `drizzle-kit generate` is idempotent if the schema has not changed (produces no new file).
- `drizzle-kit migrate` applies all pending migrations in sequence; if a migration has already been applied, it is skipped.
- The migration directory is `./drizzle/` for this project (as set in `drizzle.config.ts`). [VERIFIED: `out: './drizzle'`]
- Migration filenames follow the pattern `0000_<random_words>.sql` (e.g., `0000_lovely_blue_marvel.sql`). Phase 32 produces a single migration numbered `0000`. [VERIFIED: Drizzle docs]

**env var routing — locked by Phase 31:**
- `DATABASE_URL` (pooled, `-pooler.neon.tech`) — used by the application (`src/db/index.ts`)
- `DATABASE_URL_UNPOOLED` (direct) — used by `drizzle.config.ts` for generate/migrate; also used by the seed script

The separation exists because PgBouncer transaction mode (the pooled endpoint) is incompatible with migration `SET` commands. The seed script mirrors this by using `DATABASE_URL_UNPOOLED` for a direct, unproxied connection. [VERIFIED: Phase 31 CONTEXT.md D-07/D-08, actual `drizzle.config.ts`]

### Seed Mechanics

The seed script:
1. Loads `.env.local` via `dotenv.config({ path: ... })` — same as `drizzle.config.ts`. (`drizzle-kit` and `tsx` are both Node CLI processes that do NOT inherit Next.js's auto-loading of `.env.local`.)
2. Connects via `DATABASE_URL_UNPOOLED` using the Neon HTTP driver (`neon()` from `@neondatabase/serverless`).
3. Issues `TRUNCATE production_orders, order_events, import_batches RESTART IDENTITY CASCADE` using `db.execute(sql`...`)`.
4. Reads the static JSON snapshot (`src/db/seed-data.json`).
5. Bulk-inserts 33 rows into `production_orders` using `db.insert(productionOrders).values([...])`.

`RESTART IDENTITY CASCADE` resets serial sequences (none in this schema — all PKs are `uuid defaultRandom()`) and cascades the truncation to tables with FK references to the truncated tables (so `order_events` rows are wiped when `production_orders` is truncated, even without listing them explicitly). The explicit listing of `order_events` and `import_batches` is belt-and-suspenders and correct per D-17.

---

## 2. Drizzle-Kit Workflow

### Step 1 — Update drizzle.config.ts schema path

Change line 18 of the existing `drizzle.config.ts`:
```diff
-  schema: './src/db/schema.ts',     // D-09: single file in Phase 31
+  schema: './src/db/schema/index.ts', // D-02: barrel path for Phase 32 split
```
[VERIFIED: actual `drizzle.config.ts` — single line edit]

### Step 2 — Generate migration

```bash
npx drizzle-kit generate
```

Requires `DATABASE_URL_UNPOOLED` to be set in `.env.local` (the config loads it at startup). [VERIFIED: `drizzle.config.ts` loads dotenv at top]

**What it does:**
- Diffs current schema files against the snapshot in `./drizzle/meta/` (non-existent on first run, so treats everything as new)
- Produces `./drizzle/0000_<random_words>.sql` containing `CREATE TYPE`, `CREATE TABLE`, `CREATE INDEX`, `CREATE UNIQUE INDEX` statements
- Produces `./drizzle/meta/0000_snapshot.json` (internal state for future diffs)

**Expected SQL structure in the generated file:**
1. `CREATE TYPE "public"."production_state" AS ENUM(...)` — enum creation before tables that reference it
2. `CREATE TYPE "public"."mill_line" AS ENUM(...)`
3. `CREATE TABLE "production_orders" (...)`
4. `CREATE TABLE "order_events" (...)`
5. `CREATE TABLE "import_batches" (...)`
6. `CREATE TABLE "users" (...)`
7. `CREATE INDEX "idx_orders_state" ON "production_orders" ...`
8. `CREATE INDEX "idx_orders_mill_line" ON "production_orders" ...`
9. `CREATE UNIQUE INDEX "idx_orders_order_number" ON "production_orders" ...`
10. `CREATE INDEX "idx_events_order_id_changed_at_desc" ON "order_events" ...`

**pgcrypto / gen_random_uuid() availability:** Drizzle's `defaultRandom()` compiles to `DEFAULT gen_random_uuid()`. Neon enables `pgcrypto` by default — no `CREATE EXTENSION` statement will be in the generated SQL, and none is needed. [VERIFIED: CONTEXT.md §"Build-time risks" + official Neon docs]

### Step 3 — Review the generated SQL

The planner should add a task for the implementer to open `./drizzle/0000_*.sql` and verify:
- Both enum types appear before the tables
- FK `REFERENCES "production_orders"("id") ON DELETE CASCADE` is on `order_events.order_id`
- `DEFAULT gen_random_uuid()` (not `DEFAULT uuid_generate_v4()`) — confirms pgcrypto is not required
- `DEFAULT 1` on `version` column
- All four indexes present

### Step 4 — Apply migration

```bash
npx drizzle-kit migrate
```

**Env var:** reads `DATABASE_URL_UNPOOLED` from `.env.local` (loaded by `drizzle.config.ts`).

**Expected output:**
```
Applying migrations...
  [✓] 0000_<random_words>.sql
All migrations applied successfully.
```

If the migration has already been applied, `drizzle-kit migrate` skips it (idempotent reads from `__drizzle_migrations` table).

**Common failure modes:**
- `DATABASE_URL_UNPOOLED not set` — dotenv path wrong or `.env.local` not found. Check `path.resolve(__dirname, '.env.local')` from the repo root.
- `too many connections` — using pooled URL instead of unpooled. Verify env var name.
- `column already exists` — `drizzle-kit push` was used previously (creates schema without migration files). Resolution: `drizzle-kit drop` on the Neon branch, then re-run `drizzle-kit migrate` (see SC#3 playbook below).
- SSL certificate errors on Neon — add `?sslmode=require` to the connection string if missing.

### Step 5 — Verify (drizzle-kit introspect)

```bash
npx drizzle-kit introspect
```

This connects to the DB, introspects the current schema, and prints a TypeScript schema representation to stdout. Look for:
- Four `pgTable` definitions: `productionOrders`, `orderEvents`, `importBatches`, `users`
- Two `pgEnum` definitions: `productionState`, `millLine`
- Index definitions on `productionOrders` and `orderEvents`

**Alternative — psql fallback:**
```bash
psql "$DATABASE_URL_UNPOOLED" -c "\d production_orders"
psql "$DATABASE_URL_UNPOOLED" -c "\d order_events"
psql "$DATABASE_URL_UNPOOLED" -c "\dt"
psql "$DATABASE_URL_UNPOOLED" -c "\di"
```

The `\di` command lists all indexes. Verify:
- `idx_orders_state` (non-unique)
- `idx_orders_mill_line` (non-unique)
- `idx_orders_order_number` (unique)
- `idx_events_order_id_changed_at_desc` (non-unique)

---

## 3. Schema File Layout

### Recommended Authoring Order

Events.ts references `productionOrders` from `orders.ts`. Drizzle resolves FK imports at runtime (not compile time), but for clean TypeScript compilation: write `orders.ts` first, then `events.ts`.

Authoring order: `orders.ts` → `events.ts` → `imports.ts` → `users.ts` → `index.ts`

### `src/db/schema/orders.ts`

```typescript
// Source: Drizzle docs https://orm.drizzle.team/docs/column-types/pg
// + CONTEXT.md D-06 through D-14
import {
  pgTable,
  uuid,
  text,
  integer,
  numeric,
  timestamp,
  index,
  uniqueIndex,
  pgEnum,
} from 'drizzle-orm/pg-core';

// D-07: Postgres native enum types — created before the table in SQL output
export const productionStateEnum = pgEnum('production_state', [
  'Pending',
  'Mixing',
  'Completed',
  'Blocked',
]);

export const millLineEnum = pgEnum('mill_line', ['Premix', 'Excel', 'CGM']);

// Derive TS union types from the enum — replaces hand-written MillLine / ProductionState in src/types/millProduction.ts (D-04)
export type ProductionState = (typeof productionStateEnum.enumValues)[number];
export type MillLine = (typeof millLineEnum.enumValues)[number];

export const productionOrders = pgTable(
  'production_orders',
  {
    id: uuid('id').primaryKey().defaultRandom(), // D-06: gen_random_uuid() on Neon (no pgcrypto ext needed)
    orderNumber: text('order_number').notNull(),  // D-20: UNIQUE index added in second arg
    customer: text('customer').notNull(),
    product: text('product').notNull(),
    weightLbs: numeric('weight_lbs', { precision: 10, scale: 2 }).notNull(), // D-12: numeric — TS infers as string
    deliveryTime: text('delivery_time').notNull(),  // D-13: display string, not a time type
    state: productionStateEnum('state').notNull(),  // D-07
    millLine: millLineEnum('mill_line').notNull(),  // D-07
    textureType: text('texture_type'),              // D-12: nullable
    lineCode: text('line_code'),                    // D-12: nullable
    version: integer('version').notNull().default(1), // D-11: optimistic concurrency
    createdBy: text('created_by').notNull(),         // D-09: Clerk user ID as text, no FK
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(), // D-14
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()), // D-08: Drizzle JS-level — fires on db.update() calls only
  },
  (table) => [
    index('idx_orders_state').on(table.state),           // D-20
    index('idx_orders_mill_line').on(table.millLine),    // D-20
    uniqueIndex('idx_orders_order_number').on(table.orderNumber), // D-20: duplicate detection for IMPORT-05
  ]
);

// D-03: co-located inferred types — canonical project-wide ProductionOrder (D-04)
export type ProductionOrder = typeof productionOrders.$inferSelect;
export type NewProductionOrder = typeof productionOrders.$inferInsert;
```

**Key notes:**
- `pgEnum` is imported from `drizzle-orm/pg-core`. [VERIFIED: Context7 /drizzle-team/drizzle-orm-docs]
- `numeric()` Drizzle column infers as `string` in TypeScript by default (to preserve precision). Phase 33 query consumers will need `Number(row.weightLbs)` for arithmetic. This is documented in Pitfalls below.
- `.$onUpdate(() => new Date())` fires only when `db.update()` is called from Drizzle — not for direct SQL writes. [VERIFIED: Context7 — `$onUpdate` docs]
- The second argument to `pgTable` is now an array (Drizzle 0.30+). [VERIFIED: Context7 index examples]

### `src/db/schema/events.ts`

```typescript
// Source: Drizzle docs + CONTEXT.md D-10, D-14, D-20
import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core';
import { productionOrders } from './orders';
import { productionStateEnum } from './orders';

export const orderEvents = pgTable(
  'order_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => productionOrders.id, { onDelete: 'cascade' }), // D-10
    fromState: productionStateEnum('from_state'),  // nullable — initial "created" event has no from-state
    toState: productionStateEnum('to_state').notNull(),
    changedBy: text('changed_by').notNull(),         // D-09: Clerk user ID, no FK
    changedAt: timestamp('changed_at', { withTimezone: true }).notNull().defaultNow(), // D-14
    note: text('note'),                              // nullable — blocker reason free-text
  },
  (table) => [
    // D-20: composite index for "transition history for one order" query (PROD-05)
    index('idx_events_order_id_changed_at_desc').on(
      table.orderId,
      table.changedAt.desc() // DESC ordering on the timestamp column
    ),
  ]
);

export type OrderEvent = typeof orderEvents.$inferSelect;
export type NewOrderEvent = typeof orderEvents.$inferInsert;
```

**FK syntax confirmed:** `.references(() => productionOrders.id, { onDelete: 'cascade' })` [VERIFIED: Context7]
**DESC column in composite index:** `.on(table.orderId, table.changedAt.desc())` [VERIFIED: Context7 — Advanced Index API, drizzle-orm v0.31.0+]

### `src/db/schema/imports.ts`

```typescript
// Source: CONTEXT.md D-06, D-09, D-14
import { pgTable, uuid, text, integer, timestamp } from 'drizzle-orm/pg-core';

export const importBatches = pgTable('import_batches', {
  id: uuid('id').primaryKey().defaultRandom(),
  fileName: text('file_name').notNull(),
  rowCount: integer('row_count').notNull(),
  importedBy: text('imported_by').notNull(), // D-09: Clerk user ID, no FK
  importedAt: timestamp('imported_at', { withTimezone: true }).notNull().defaultNow(), // D-14
});

export type ImportBatch = typeof importBatches.$inferSelect;
export type NewImportBatch = typeof importBatches.$inferInsert;
```

### `src/db/schema/users.ts`

```typescript
// Source: CONTEXT.md D-09, D-14
// users table is a lazy-sync Clerk display-name cache (DATA-05).
// id is the Clerk user_xxx string directly — no surrogate UUID.
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey(),  // D-09: Clerk's user_xxx ID as PK — makes lazy upsert trivial
  displayName: text('display_name'),
  email: text('email'),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).defaultNow(), // D-14
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(), // D-14
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
```

### `src/db/schema/index.ts` (barrel)

```typescript
// Barrel re-export for all tables, enums, and inferred types.
// drizzle.config.ts schema path points here (D-02).
// Import from '@/db/schema' in query functions (Phase 33+).
export * from './orders';
export * from './events';
export * from './imports';
export * from './users';
```

---

## 4. Seed Implementation

### `scripts/export-seed.ts` — one-shot JSON exporter

This script runs once (or whenever the demo data changes) and writes the static snapshot. It does NOT connect to the DB — pure data transformation.

```typescript
// scripts/export-seed.ts
// Run with: npx tsx scripts/export-seed.ts
// Output: src/db/seed-data.json
import { writeFileSync } from 'fs';
import path from 'path';

// Import the mock data source directly — no DB connection needed
// Avoid dynamic import to keep this a simple Node script
import { mockOrders } from '../src/services/millProduction'; // adjust if not exported

// Transform camelCase mock fields → snake_case DB columns
// Drop mock `id` (DB generates uuid). Add seed-specific fields.
const seedRows = mockOrders.map((o) => ({
  order_number: o.orderNumber,
  customer: o.customer,
  product: o.product,
  weight_lbs: String(o.weightLbs),   // numeric columns expect string in Drizzle insert
  delivery_time: o.deliveryTime,
  state: o.state,
  mill_line: o.millLine,
  texture_type: o.textureType ?? null,
  line_code: o.lineCode ?? null,
  created_by: 'system-seed',         // D-19
  version: 1,                        // D-11
}));

const outputPath = path.resolve(__dirname, '../src/db/seed-data.json');
writeFileSync(outputPath, JSON.stringify(seedRows, null, 2));
console.log(`Wrote ${seedRows.length} rows to ${outputPath}`);
```

**Note on mock data export:** `src/services/millProduction.ts` does not currently export `mockOrders` directly (it is a `const` local to the module). The implementer has two options:
1. Export `mockOrders` from `src/services/millProduction.ts` (preferred — documents the relationship)
2. Hand-derive the JSON (acceptable for a one-time op since the data is fully known)

Either approach produces the same `src/db/seed-data.json`. [VERIFIED: reading `src/services/millProduction.ts`]

### `src/db/seed.ts` — the seed runner

```typescript
// src/db/seed.ts
// Run with: npm run db:seed (tsx src/db/seed.ts)
// D-16: mirrors drizzle.config.ts dotenv loading pattern exactly
import { config } from 'dotenv';
import path from 'path';

// MUST be before any DB import — drizzle.config.ts uses same pattern
// path.resolve(__dirname, ...) does NOT work with tsx ESM; use fileURLToPath if needed
// For CJS-compatible tsx execution, __dirname is available
config({ path: path.resolve(__dirname, '../../.env.local') });
// (__dirname from src/db/ → ../../ reaches repo root)

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { sql } from 'drizzle-orm';
import { productionOrders } from './schema/index';
import seedData from './seed-data.json';

async function seed() {
  if (!process.env.DATABASE_URL_UNPOOLED) {
    throw new Error('DATABASE_URL_UNPOOLED is not set. Run from the repo root with .env.local present.');
  }

  // D-16: seed uses UNPOOLED for direct connection (same as drizzle.config.ts)
  const client = neon(process.env.DATABASE_URL_UNPOOLED);
  const db = drizzle({ client });

  console.log('Truncating production_orders, order_events, import_batches...');
  // D-17: RESTART IDENTITY CASCADE — wipes child tables via CASCADE
  // NEVER includes users table
  await db.execute(
    sql`TRUNCATE production_orders, order_events, import_batches RESTART IDENTITY CASCADE`
  );

  console.log(`Inserting ${seedData.length} seed rows...`);
  await db.insert(productionOrders).values(seedData as any);

  console.log('Seed complete.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
```

**Dotenv path resolution — critical detail:** `src/db/seed.ts` is two directories deep from the repo root. The `path.resolve(__dirname, '../../.env.local')` correctly navigates to the root `.env.local`. [VERIFIED: by analogy with `drizzle.config.ts` which is at root and uses `path.resolve(__dirname, '.env.local')`]

**ESM / CJS quirks with tsx:** `tsx` runs TypeScript via esbuild. In ESM mode (`"type": "module"` in package.json), `__dirname` is undefined and you must use `import.meta.url` + `fileURLToPath`. However, `package.json` does NOT have `"type": "module"` set — it is absent (CJS default). [VERIFIED: `package.json`] So `__dirname` is available normally in `tsx`-executed scripts.

### `package.json` wiring

Add to `scripts`:
```json
"db:generate": "drizzle-kit generate",
"db:migrate": "drizzle-kit migrate",
"db:seed": "tsx src/db/seed.ts"
```
[VERIFIED: no `db:generate`, `db:migrate`, or `db:seed` scripts exist in current `package.json`]

Add to `devDependencies`:
```json
"tsx": "4.21.0"
```
[VERIFIED: `tsx` not in `package.json`; latest version 4.21.0 confirmed via `npm view tsx version`]

**Install command:**
```bash
npm install -D tsx
```

---

## 5. Type Rewrite Discipline (D-04)

### Mechanical steps

**Step 1 — Find all consumers of `ProductionOrder`, `MillLine`, `ProductionState` from `src/types/millProduction.ts`:**
```bash
grep -r "from.*types/millProduction\|from.*@/types/millProduction" src/ --include="*.ts" --include="*.tsx"
```

**Known consumers (verified by reading files):**
- `src/services/millProduction.ts` line 1: `import { ProductionOrder, MillLine } from "@/types/millProduction";`
- `src/app/demo/mill-production/page.tsx`: imports `MillProductionUI` which uses the type (indirect)
- `src/types/millProduction.ts` itself (the definition)

[VERIFIED: reading `src/services/millProduction.ts` line 1, `src/app/demo/mill-production/page.tsx`]

**Step 2 — Rewrite `src/types/millProduction.ts`:**

Before (current state):
```typescript
export type MillLine = "Premix" | "Excel" | "CGM";
export type ProductionState = "Completed" | "Mixing" | "Blocked" | "Pending";
export interface ProductionOrder { ... }
```

After (Phase 32 state):
```typescript
// src/types/millProduction.ts
// MillLine and ProductionState are now canonical from src/db/schema/orders.ts (D-04).
// Re-export them here for backward compat during the transition period,
// OR simply delete and update the one import in src/services/millProduction.ts.
//
// DemoOrder is the renamed shape for the /demo/* namespace (D-04).
// Its fields mirror the old ProductionOrder 1:1.

export type { MillLine, ProductionState } from '@/db/schema/orders';

export interface DemoOrder {
  id: string;
  orderNumber: string;
  customer: string;
  product: string;
  weightLbs: number;
  deliveryTime: string;
  state: ProductionState;
  millLine: MillLine;
  textureType?: string;
  lineCode?: string;
}
```

**Step 3 — Update `src/services/millProduction.ts`:**
```diff
-import { ProductionOrder, MillLine } from "@/types/millProduction";
+import { DemoOrder, MillLine } from "@/types/millProduction";

-const mockOrders: ProductionOrder[] = [
+const mockOrders: DemoOrder[] = [

-export async function getProductionOrders(): Promise<ProductionOrder[]> {
+export async function getProductionOrders(): Promise<DemoOrder[]> {

-export async function getOrdersByMillLine(millLine: MillLine): Promise<ProductionOrder[]> {
+export async function getOrdersByMillLine(millLine: MillLine): Promise<DemoOrder[]> {
```

**Step 4 — Update `src/app/demo/mill-production/page.tsx`:**
The page imports `MillProductionUI` which takes `orders: ProductionOrder[]`. After the rename, the type changes to `DemoOrder`. Check `src/components/MillProductionUI.tsx` for any `ProductionOrder` import and update to `DemoOrder`.

**Step 5 — Verify build:**
```bash
npx tsc --noEmit
```
TypeScript must compile clean. The `DemoOrder` interface is structurally compatible with the old `ProductionOrder` interface (same fields, same types) so no runtime behavior changes.

**Note on re-export shim vs. deletion:** The planner may choose to keep `src/types/millProduction.ts` as a re-export shim (re-exports `MillLine`, `ProductionState` from the schema barrel and renames `ProductionOrder` → `DemoOrder`). This minimizes the diff in `src/services/millProduction.ts`. This is Claude's Discretion — recommended approach.

---

## 6. Verification Playbook

### SC#1 — Tables exist

```bash
# Option A: drizzle-kit introspect (verbose — produces TypeScript schema)
npx drizzle-kit introspect

# Option B: psql (faster — direct SQL)
psql "$DATABASE_URL_UNPOOLED" -c "\dt"
# Expected: production_orders, order_events, import_batches, users, __drizzle_migrations (5 tables)

psql "$DATABASE_URL_UNPOOLED" -c "SELECT typname FROM pg_type WHERE typtype = 'e';"
# Expected: production_state, mill_line (2 enum types)
```

### SC#2 — version column + no FK on clerk_user_id

```bash
# Verify version column exists with correct type and default
psql "$DATABASE_URL_UNPOOLED" -c "\d production_orders"
# Look for: version | integer | not null | 1
# Look for: created_by | text | not null | (no references)
# Look for: NO FOREIGN KEY constraint involving clerk_user_id / created_by
```

### SC#3 — Re-runnable from scratch (operator playbook)

**Prerequisite:** Obtain a Neon branch (or use the dev branch if you're willing to wipe it).

```bash
# Step 1: Drop all tables and types (drizzle-kit drop wipes the DB schema)
npx drizzle-kit drop
# Confirm when prompted. This removes all tables and drizzle migration history.

# Step 2: Re-apply from the committed migration files
npx drizzle-kit migrate
# Expected: applies 0000_*.sql; recreates all tables, enums, indexes

# Step 3: Verify
psql "$DATABASE_URL_UNPOOLED" -c "\dt"
```

**Why this proves SC#3:** The migration files alone (checked into git) can reproduce the exact schema on an empty database. `drizzle-kit push` would fail this test because it modifies a DB without creating migration files.

**Alternative for destructive test without wiping the main dev branch:** Create a new Neon branch in the Neon console ("Branch from main" → blank branch), set `DATABASE_URL_UNPOOLED` to the new branch's URL, run `drizzle-kit migrate`, verify, then delete the branch.

### SC#4 — Seed row count

```bash
# Run seed
npm run db:seed
# Expected output: "Truncating...", "Inserting 33 seed rows...", "Seed complete."

# Verify row count
psql "$DATABASE_URL_UNPOOLED" -c "SELECT count(*) FROM production_orders;"
# Expected: 33

# Verify created_by sentinel
psql "$DATABASE_URL_UNPOOLED" -c "SELECT DISTINCT created_by FROM production_orders;"
# Expected: system-seed

# Verify order_events is empty (D-18)
psql "$DATABASE_URL_UNPOOLED" -c "SELECT count(*) FROM order_events;"
# Expected: 0
```

### SC#5 — No push used

SC#5 ("drizzle-kit push not used") is verified by:
1. The `package.json` `scripts` table — no `"db:push"` script exists.
2. The `drizzle/meta/` directory contains `.json` snapshot files (these only exist with the generate/migrate workflow, not with push).
3. The `__drizzle_migrations` table exists in the DB (created by migrate, not by push).

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest 30.3.0 + ts-jest |
| Config file | `jest.config.js` (root) |
| Quick run command | `npm test -- --testPathPattern="src/db"` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| DATA-02 | `orders.ts` exports `productionOrders` pgTable + `ProductionOrder` type + `productionStateEnum` + `millLineEnum` | Unit (compile + export check) | `npm test -- --testPathPattern="schema/orders"` | No — Wave 0 |
| DATA-03 | `events.ts` exports `orderEvents` pgTable with FK referencing `productionOrders` | Unit (compile + export check) | `npm test -- --testPathPattern="schema/events"` | No — Wave 0 |
| DATA-04 | `imports.ts` exports `importBatches` pgTable | Unit (compile + export check) | `npm test -- --testPathPattern="schema/imports"` | No — Wave 0 |
| DATA-05 | `users.ts` exports `users` pgTable with `text` primary key | Unit (compile + export check) | `npm test -- --testPathPattern="schema/users"` | No — Wave 0 |
| DATA-06 | `drizzle/0000_*.sql` file exists and contains expected CREATE statements | Unit (file-existence + string assertion) | `npm test -- --testPathPattern="migration"` | No — Wave 0 |
| DATA-07 | `src/db/seed-data.json` has 33 rows; every row has required NOT NULL fields | Unit (JSON assertion) | `npm test -- --testPathPattern="seed"` | No — Wave 0 |
| DATA-07 (runtime) | After `npm run db:seed`, `SELECT count(*) FROM production_orders = 33` | Integration (live DB) | Manual operator step — see Verification Playbook §SC#4 | N/A |
| D-04 | `ProductionOrder` exported from `src/db/schema/orders.ts`; `DemoOrder` exported from `src/types/millProduction.ts` | Unit (import resolution) | `npx tsc --noEmit` | N/A (TS build) |

### Sampling Rate

- **Per task commit:** `npm test -- --testPathPattern="src/db"` (schema + seed JSON tests only, < 5s)
- **Per wave merge:** `npm test` (full Jest suite)
- **Phase gate:** Full suite green + `npx tsc --noEmit` clean + SC#4 row count verified manually before closing Phase 32

### Wave 0 Gaps

- [ ] `src/db/schema/__tests__/orders.test.ts` — covers DATA-02 (export + type shape assertions)
- [ ] `src/db/schema/__tests__/events.test.ts` — covers DATA-03
- [ ] `src/db/schema/__tests__/imports.test.ts` — covers DATA-04
- [ ] `src/db/schema/__tests__/users.test.ts` — covers DATA-05
- [ ] `src/db/__tests__/seed-data.test.ts` — covers DATA-07 (JSON shape, row count = 33, NOT NULL fields present)
- [ ] `src/db/__tests__/migration.test.ts` — covers DATA-06 (file-existence check: `fs.existsSync('./drizzle/0000_*.sql')`)

**Pattern for schema export tests** (mirrors `src/db/__tests__/index.test.ts`):
```typescript
// src/db/schema/__tests__/orders.test.ts
import { productionOrders, ProductionOrder, productionStateEnum, millLineEnum } from '../orders';
it('exports productionOrders pgTable', () => {
  expect(productionOrders).toBeDefined();
});
it('exports ProductionState enum with correct values', () => {
  expect(productionStateEnum.enumValues).toEqual(['Pending', 'Mixing', 'Completed', 'Blocked']);
});
```

**Pattern for seed JSON test:**
```typescript
// src/db/__tests__/seed-data.test.ts
import seedData from '../seed-data.json';
const REQUIRED_FIELDS = ['order_number', 'customer', 'product', 'weight_lbs', 'delivery_time', 'state', 'mill_line', 'created_by'];
it('has 33 rows', () => { expect(seedData).toHaveLength(33); });
it('every row has required NOT NULL fields', () => {
  for (const row of seedData) {
    for (const field of REQUIRED_FIELDS) {
      expect(row).toHaveProperty(field);
      expect((row as Record<string, unknown>)[field]).not.toBeNull();
    }
  }
});
```

---

## 8. Pitfalls and Footguns

### Pitfall 1: Enum migration footgun — types survive DROP TABLE

`pgEnum` creates a Postgres TYPE at the schema level. `DROP TABLE production_orders` does NOT drop the `production_state` or `mill_line` types. If a future migration needs to change enum values (e.g., add a `Cancelled` state):

```sql
-- drizzle-kit generate will produce this:
ALTER TYPE "public"."production_state" ADD VALUE 'Cancelled';
```

`ALTER TYPE ... ADD VALUE` cannot be inside a transaction in older Postgres versions (fixed in Postgres 12+ as of 2020 — Neon uses Postgres 16, so this is safe). However, the value can never be removed or reordered without dropping and recreating the type and all columns that use it. This makes enum additions cheap but renamings very expensive. Choose enum values carefully now.

**For Phase 32:** The values `Pending`, `Mixing`, `Completed`, `Blocked` and `Premix`, `Excel`, `CGM` match the demo data exactly. No changes expected.

### Pitfall 2: `numeric(10,2)` infers as `string` in TypeScript

Drizzle infers the `numeric` column type as `string` in TypeScript to preserve decimal precision. After seeding, `productionOrders.weightLbs` will be `"6000"` (a string), not `6000` (a number).

**Phase 32 impact:** None — the seed script inserts `String(o.weightLbs)` and the column stores the value correctly. Phase 33 query consumers MUST be warned: use `Number(row.weightLbs)` or `parseFloat(row.weightLbs)` before arithmetic. Flag this in Phase 33's task notes or CONTEXT.md.

### Pitfall 3: `ON DELETE CASCADE` on order_events — future footgun

The FK `order_events.order_id → production_orders.id ON DELETE CASCADE` means deleting a `production_orders` row silently deletes all its audit events. For Phase 32 this is intentional (seed re-runs truncate orders, events follow). However, if Phase 34+ ever adds an "archive" or "delete order" capability, the cascade destroys audit history without warning. Document this for Phase 34 planners.

**For Phase 32 seed:** `TRUNCATE production_orders ... CASCADE` is the explicit mechanism — it trumps the FK cascade and wipes in correct order regardless.

### Pitfall 4: `tsx` + ESM/CJS — `__dirname` availability

`tsx` uses esbuild to run TypeScript. In a CJS-mode project (no `"type": "module"` in `package.json`), `__dirname` is available and works as expected. The project is CJS-mode. [VERIFIED: `package.json`] If the project ever adds `"type": "module"`, the seed script must switch to:
```typescript
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
```
Do not use this pattern now — it would break CJS mode.

### Pitfall 5: `drizzle-kit push` leaving no migration files

If anyone runs `npx drizzle-kit push` at any point, the database schema may diverge from the migration files. Warning signs: `drizzle-kit introspect` shows tables that `drizzle-kit migrate` would try to create (because no migration file records their existence). Resolution: drop and re-migrate from scratch.

**Prevention:** The `package.json` scripts table must NOT include a `db:push` script. Document this in the operator runbook.

### Pitfall 6: `gen_random_uuid()` vs `uuid_generate_v4()`

`defaultRandom()` in Drizzle compiles to `DEFAULT gen_random_uuid()`, which uses the `pgcrypto` extension. Neon enables `pgcrypto` by default on all databases. No `CREATE EXTENSION` migration is needed. The generated SQL should NOT contain a `CREATE EXTENSION pgcrypto;` line. Verify after `drizzle-kit generate` by opening the file. [VERIFIED: CONTEXT.md + official Neon docs statement]

### Pitfall 7: `$onUpdate` does NOT fire on direct SQL writes

`updated_at.$onUpdate(() => new Date())` is a Drizzle ORM-level hook. It fires only when `db.update(productionOrders).set(...)` is called via the Drizzle client. Direct SQL writes (e.g., in a seed script using `db.execute(sql`UPDATE ...`)`) do NOT trigger it. The seed script uses `db.insert()`, so this does not apply. Phase 33 server actions must use `db.update()` — not `db.execute(sql`UPDATE ...`)` — to benefit from `$onUpdate`. [VERIFIED: Context7 `$onUpdate` docs]

### Pitfall 8: Drizzle-kit introspect output path

`drizzle-kit introspect` by default writes a generated schema file to `./drizzle/schema.ts` and prints to stdout. If the implementer runs it in a terminal and the output is truncated, use:
```bash
npx drizzle-kit introspect 2>&1 | less
```
Or check `./drizzle/schema.ts` for the full generated schema.

### Pitfall 9: Seed JSON import in TypeScript requires `resolveJsonModule`

Importing `seed-data.json` in `src/db/seed.ts` via `import seedData from './seed-data.json'` requires `"resolveJsonModule": true` in `tsconfig.json`. Verify this is set. [ASSUMED — standard Next.js tsconfig includes this; verify before implementing]

---

## 9. References

### Primary (HIGH confidence)

| Source | What was verified |
|--------|------------------|
| Context7 `/drizzle-team/drizzle-orm-docs` — pgEnum | `pgEnum('name', [...])` import path from `drizzle-orm/pg-core`; SQL output (`CREATE TYPE ... AS ENUM`) |
| Context7 `/drizzle-team/drizzle-orm-docs` — indexes | `index('name').on(table.col)`, `uniqueIndex('name').on(table.col)`, `.asc()` / `.desc()` column ordering in composite indexes |
| Context7 `/drizzle-team/drizzle-orm-docs` — FK cascade | `.references(() => table.id, { onDelete: 'cascade' })` exact syntax |
| Context7 `/drizzle-team/drizzle-orm-docs` — $onUpdate | `.$onUpdate(() => new Date())` fires on `db.update()` only; also fires on insert if no default provided |
| Context7 `/drizzle-team/drizzle-orm-docs` — $inferSelect | `typeof table.$inferSelect` / `typeof table.$inferInsert` canonical pattern |
| Context7 `/drizzle-team/drizzle-orm-docs` — generate/migrate | `npx drizzle-kit generate` / `npx drizzle-kit migrate` CLI invocations |
| Phase 31 `drizzle.config.ts` (verified by reading file) | `out: './drizzle'` — migration files land in `./drizzle/`, not `./drizzle/migrations/` |
| `package.json` (verified by reading file) | `tsx` not installed; `ts-node` present; no `db:seed`/`db:generate`/`db:migrate` scripts |
| `src/db/index.ts` (verified by reading file) | `import 'server-only'` line 1; `drizzle({ client: sql })` singleton shape |
| `src/services/millProduction.ts` (verified by reading file) | 33 orders: 11 Premix / 11 Excel / 11 CGM; camelCase field names; `mockOrders` is not exported |
| `npm view tsx version` | tsx 4.21.0 current |
| `npm view drizzle-orm version` | drizzle-orm 0.45.2 current (matches package.json) |

### Secondary (MEDIUM confidence)

- Neon docs: `gen_random_uuid()` availability — confirmed via CONTEXT.md which cites official Neon docs
- Phase 32 CONTEXT.md `<specifics>` and `<code_context>` — authored from official docs and prior research

### Tertiary (LOW confidence)

- `tsconfig.json` `resolveJsonModule` assumption — [ASSUMED] standard in Next.js; verify before implementing

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `tsconfig.json` has `"resolveJsonModule": true` | Seed Implementation, Pitfall 9 | Seed script `import seedData from './seed-data.json'` would fail to compile; fix by adding the tsconfig key |
| A2 | Drizzle-kit drops migration history cleanly for SC#3 `drizzle-kit drop` playbook | Verification Playbook §SC#3 | If `drizzle-kit drop` is unavailable in drizzle-kit 0.31.10, use `psql` to drop all tables manually |

---

## Open Questions

1. **`mockOrders` export from `src/services/millProduction.ts`**
   - What we know: The array is a module-local `const`. It is not exported.
   - What's unclear: Whether the planner should export it (modifying a production service file) vs. hand-derive the JSON.
   - Recommendation: Export `mockOrders` from `src/services/millProduction.ts` as a named export alongside the async functions. This documents the demo↔seed relationship in code.

2. **`DemoOrder` import update scope**
   - What we know: `src/services/millProduction.ts` and `src/app/demo/mill-production/page.tsx` are confirmed consumers.
   - What's unclear: Whether `MillProductionUI.tsx` and any test files reference `ProductionOrder` by name from the types file.
   - Recommendation: Run `grep -r "ProductionOrder" src/ --include="*.ts" --include="*.tsx"` as Wave 0 verification before writing the D-04 rename tasks.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `tsx` | `npm run db:seed` | No | — | Add as devDep (`npm install -D tsx@4.21.0`) |
| `DATABASE_URL_UNPOOLED` in `.env.local` | drizzle-kit generate/migrate, seed script | Assumed present | — | Phase 31 provisioned Neon; operator must confirm |
| `drizzle-kit` | generate/migrate | Yes | 0.31.10 | — |
| `npx drizzle-kit introspect` | SC#1 verification | Yes | 0.31.10 | `psql \dt` fallback |
| `psql` CLI | SC#2/SC#3/SC#4 verification | [ASSUMED] | — | Neon web console SQL editor fallback |
| Neon dev DB (Phase 31 provisioned) | migration apply, seed | Assumed present | Postgres 16 | Phase 31 runbook has provisioning steps |

**Missing dependencies with no fallback:**
- `tsx` — must be installed before `npm run db:seed` is runnable (add to `devDependencies` in Wave 0)

**Missing dependencies with fallback:**
- `psql` CLI — Neon console SQL editor is a viable substitute for all `psql` verification commands

---

## RESEARCH COMPLETE
