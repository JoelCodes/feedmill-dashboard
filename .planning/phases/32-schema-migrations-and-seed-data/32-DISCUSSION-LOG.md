# Phase 32: Schema, Migrations, and Seed Data - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-13
**Phase:** 32-schema-migrations-and-seed-data
**Areas discussed:** Schema file layout, Column primitives & state encoding, Seed source & idempotency, Indexes in migration #1

---

## Schema file layout

### Q1 — Single file or per-table directory?

| Option | Description | Selected |
|--------|-------------|----------|
| Split into directory | `src/db/schema/{orders,events,imports,users,index}.ts`. Matches research/v2.0/ARCHITECTURE.md Decision 1. Each table owns its pgTable + inferred types + table-local enums. | ✓ |
| Keep single src/db/schema.ts | All 4 tables in one file. ~150–250 lines combined. Refactor cost later. | |
| Split but flat (no /schema dir) | `src/db/orders.ts` etc directly under src/db/. Avoids nesting; less consistent with research. | |

**User's choice:** Split into directory.
**Notes:** Matches research recommendation; minor cost of updating the drizzle.config.ts schema path.

### Q2 — Where do InferSelect/InferInsert types live?

| Option | Description | Selected |
|--------|-------------|----------|
| Co-located with each table | Each table file exports both pgTable and inferred types. Standard Drizzle pattern. | ✓ |
| Centralized in src/db/types.ts | All inferred types in one file. Cleaner imports for consumers; second source of truth. | |
| Mirror onto src/types/ | Re-export from existing src/types/millProduction.ts. Risk: name collision with existing ProductionOrder. | |

**User's choice:** Co-located.

### Q3 — `ProductionOrder` collision with src/types/millProduction.ts?

| Option | Description | Selected |
|--------|-------------|----------|
| DB type wins, alias old as DemoOrder | Drizzle-inferred type becomes canonical. Existing renamed to DemoOrder. /demo/* imports updated. Long-term cleanest. | ✓ |
| DB type uses a different name | Drizzle exports DbProductionOrder/OrderRow. Existing untouched. Two types describing same entity; merge debt. | |
| Defer to Phase 33 | Phase 32 only exports pgTable; no inferred types. Phase 33 names them. | |

**User's choice:** DB type wins.
**Notes:** Demo continues on `DemoOrder` because its shape matches existing TS structure 1:1.

### Q4 — File and identifier naming?

| Option | Description | Selected |
|--------|-------------|----------|
| orders.ts → productionOrders | Short filename, descriptive variable. Matches research naming. | ✓ |
| production-orders.ts → productionOrders | Filename mirrors DB table name 1:1; longer imports. | |
| orders.ts → orders | Both file and var as `orders`. Risk: clashes with future order-domain tables. | |

**User's choice:** orders.ts → productionOrders.

---

## Column primitives & state encoding

### Q1 — Primary key strategy for production_orders.id?

| Option | Description | Selected |
|--------|-------------|----------|
| uuid + defaultRandom() | `uuid primary key default gen_random_uuid()`. Opaque, no collision risk on bulk import, no count leakage. | ✓ |
| serial / bigserial | Auto-incrementing int. Smaller and sequential but leaks count to URLs. | |
| Natural key (order_number as PK) | ERP document number as PK. Risk: ERP can reuse numbers; duplicate detection harder to surface. | |

**User's choice:** uuid + defaultRandom().
**Notes:** ERP `order_number` stored separately with UNIQUE index for duplicate detection.

### Q2 — DB encoding for state and mill_line?

| Option | Description | Selected |
|--------|-------------|----------|
| Postgres native ENUM | `CREATE TYPE production_state AS ENUM (...)`. Strictest enforcement; TS infers literal union. | ✓ |
| TEXT + CHECK constraint | Inline check; same strictness; constraint visible on table. | |
| TEXT only, enforced in TS | Plain text; TS union is the only guard. Cheapest to evolve; weakest. | |

**User's choice:** Postgres native ENUM.

### Q3 — updated_at maintenance strategy on production_orders?

| Option | Description | Selected |
|--------|-------------|----------|
| Drizzle $onUpdate callback | `.$onUpdate(() => new Date())`. JS-level guarantee; visible in TS; works for all server actions. | ✓ |
| Postgres trigger | DB-level guarantee via moddatetime or hand-rolled trigger. Survives ad-hoc UPDATEs but lives in migration SQL. | |
| Manual in server actions | Explicit `.set({ updatedAt: new Date() })` at every call site. Cheap; forgettable. | |

**User's choice:** Drizzle $onUpdate.

### Q4 — Which tables get clerk_user_id columns, nullability?

| Option | Description | Selected |
|--------|-------------|----------|
| created_by + changed_by + users.id | production_orders.created_by NOT NULL; order_events.changed_by NOT NULL; users.id is Clerk's user_xxx as PK. All text, no FK. | ✓ |
| Also nullable updated_by on production_orders | Adds row-level updated_by. Duplicates info already in latest order_events row. | |
| Defer created_by/changed_by until Phase 33 | Phase 32 only declares clerk_user_id on users.id. Risk: backfill needed. | |

**User's choice:** created_by + changed_by + users.id.

---

## Seed source & idempotency

### Q1 — Where does the 33-order seed data come from?

| Option | Description | Selected |
|--------|-------------|----------|
| Hand-coded mock at src/services/millProduction.ts | Adapt the existing 33 mock orders into a fixture. Direct match for ROADMAP SC#4 wording. Demo + seed stay in sync. | |
| Parse example-data/Book1.xlsx at seed runtime | Exercise the XLSX pathway one phase early. Book1.xlsx lacks mill_line + state. Adds read-excel-file to Phase 32. | |
| Static JSON snapshot at src/db/seed-data.json | Pre-export to JSON. Decouples seed from TS module evolution. Fourth representation of the same 33 orders. | ✓ |

**User's choice:** Static JSON snapshot.
**Notes:** Lowest seed-time complexity; decoupled from mock service evolution. CONTEXT.md captures that the JSON is generated by a one-time export from the mock service (Claude's discretion: script or hand-transform).

### Q2 — Where does the seed script live and how is it executed?

| Option | Description | Selected |
|--------|-------------|----------|
| src/db/seed.ts + tsx runner, npm script | `"db:seed": "tsx src/db/seed.ts"`. Matches Drizzle community tutorials. | ✓ |
| scripts/seed.ts + tsx runner | Top-level scripts/ dir. Introduces a new dir pattern. | |
| src/db/seed.ts + drizzle-kit seed | Built-in seed command. Designed for faker/randomized data; doesn't fit deterministic 33-row fixture. | |

**User's choice:** src/db/seed.ts + tsx.

### Q3 — Idempotency strategy?

| Option | Description | Selected |
|--------|-------------|----------|
| TRUNCATE + insert | Clean slate every run. users table NOT touched. Ideal for dev iteration. | ✓ |
| Upsert on order_number unique index | INSERT ... ON CONFLICT DO UPDATE. Silently overwrites manual edits. | |
| Skip-if-populated | Count check; exit if rows exist. Friction for schema iteration. | |

**User's choice:** TRUNCATE + insert.
**Notes:** Critical guard: users table is never touched.

### Q4 — Beyond production_orders, what else does the seed populate?

| Option | Description | Selected |
|--------|-------------|----------|
| Orders only — events + import_batches stay empty | Cleanest day-zero baseline. Audit log starts when Phase 33 transitions land. | ✓ |
| Orders + one import_batches row representing Book1.xlsx baseline | Provides non-empty import history surface. Semantic stretch — it's not a real import. | |
| Orders + synthetic order_events history | Each order gets a 'Created' synthetic event. Pollutes audit log. | |

**User's choice:** Orders only.

### Q5 — `created_by` value on the 33 seeded orders?

| Option | Description | Selected |
|--------|-------------|----------|
| Literal string 'system-seed' | Non-Clerk; distinguishable from real user-created. No coupling to specific user. | ✓ |
| The e2e-mill-operator Clerk user_id | More realistic visually. Hard-codes a specific Clerk user. | |
| JSON 'created_by' field per row | Mixed per-row values. Not justified for 33-row baseline. | |

**User's choice:** 'system-seed'.

---

## Indexes in migration #1

### Q1 — Which indexes ship with migration #1?

| Option | Description | Selected |
|--------|-------------|----------|
| Read-path indexes for Phase 34 dashboard | state, mill_line, order_number UNIQUE, events(order_id). Negligible cost at 33 rows; saves Phase 33 ALTER. | ✓ |
| Bare minimum — only unique constraints | Only order_number UNIQUE; others deferred. Future ALTER on populated table needs CONCURRENTLY. | |
| Read-path + composite for filter+search | Adds composite (mill_line, state). Over-indexing for 33 rows. | |

**User's choice:** Read-path indexes.

### Q2 — Search across customer + product (PROD-04)?

| Option | Description | Selected |
|--------|-------------|----------|
| Defer until Phase 34 — ILIKE on text is fine at this scale | Sequential scan on a few hundred rows is fast. Add pg_trgm if measurement justifies. | ✓ |
| Ship pg_trgm GIN indexes now | Substring/typo-tolerant search ready for Phase 34. Extension enablement migration. | |
| Plain B-tree on customer + product | Doesn't help ILIKE substring search. Skip. | |

**User's choice:** Defer.

### Q3 — Timestamp index on order_events.changed_at?

| Option | Description | Selected |
|--------|-------------|----------|
| Composite (order_id, changed_at DESC) | Single composite supports the canonical "history per order" query. Replaces the plain order_id index. | ✓ |
| order_id + separate changed_at | Two single-column indexes. Slightly more flexible. | |
| No changed_at index | Per-order event volume is tiny. Sequential scan within filter is acceptable. | |

**User's choice:** Composite (order_id, changed_at DESC).

---

## Claude's Discretion

- Drizzle `relations()` declarations — likely defer to Phase 33 with the first join.
- Whether the JSON export of mock data is generated by a checked-in `scripts/export-seed.ts` (idempotent, re-runnable) vs a one-time hand transformation. Recommended: script.
- Test approach for the seed (row-count assertion + NOT NULL coverage) — left to planner.
- Whether to drop `src/types/millProduction.ts` entirely or keep as a re-export shim for the demo.

## Deferred Ideas

- pg_trgm + GIN indexes for substring search — defer to Phase 34 if needed.
- Composite (mill_line, state) index — defer; rely on bitmap-AND until EXPLAIN says otherwise.
- CI integration for "re-runnable from scratch" migration verification — defer until CI Neon branch is provisioned.
- Synthetic order_events seed history — rejected this phase; re-openable later.
- import_batches seed row — rejected this phase; populated by real Phase 33 imports.
- Mill-line derivation rule from imported XLSX species column — Phase 33 IMPORT-02 concern.
- Document-number prefix convention (`ORD-255154` vs `255154`) — Phase 33 IMPORT-02 concern.
- `numeric` → TS `string` parsing convention — Phase 33 query consumers handle this.
