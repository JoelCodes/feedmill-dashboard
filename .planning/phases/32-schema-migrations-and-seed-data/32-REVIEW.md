---
phase: 32-schema-migrations-and-seed-data
reviewed: 2026-05-13T00:00:00Z
depth: deep
files_reviewed: 24
files_reviewed_list:
  - src/db/schema/orders.ts
  - src/db/schema/events.ts
  - src/db/schema/imports.ts
  - src/db/schema/users.ts
  - src/db/schema/index.ts
  - src/db/schema/__tests__/orders.test.ts
  - src/db/schema/__tests__/events.test.ts
  - src/db/schema/__tests__/imports.test.ts
  - src/db/schema/__tests__/users.test.ts
  - src/types/millProduction.ts
  - src/services/millProduction.ts
  - src/components/MillProductionUI.tsx
  - src/components/__tests__/MillProductionUI.test.tsx
  - src/app/demo/mill-production/__tests__/page.test.tsx
  - drizzle/0000_aromatic_stone_men.sql
  - drizzle/meta/_journal.json
  - drizzle/meta/0000_snapshot.json
  - src/db/__tests__/migration.test.ts
  - scripts/export-seed.ts
  - src/db/seed-data.json
  - src/db/__tests__/seed-data.test.ts
  - src/db/seed.ts
  - src/__tests__/no-bad-tailwind-literals.test.ts
  - src/app/globals.css
findings:
  critical: 3
  blocker: 3
  warning: 9
  info: 6
  total: 18
status: issues_found
---

# Phase 32: Code Review Report (Deep Depth — Full Phase)

**Reviewed:** 2026-05-13
**Depth:** deep
**Files Reviewed:** 24
**Status:** issues_found

## Summary

Phase 32 introduces the database layer: Drizzle ORM schemas for four tables,
a generated SQL migration with snapshot/journal metadata, an exporter that
flattens the existing mock-orders fixture into a snake_case seed JSON, a
runtime seed loader, plus an unrelated Tailwind v4 `@source` regression fix
with a Jest enforcement gate. The schema files themselves are clean and the
Drizzle-generated migration faithfully mirrors them.

However, deep cross-file analysis surfaces several substantive correctness
problems that the schema-isolated unit tests and structural migration test
do not catch:

1. A **type-system fork between the canonical `DemoOrder` interface
   (`weightLbs: number`) and the canonical Drizzle-inferred `ProductionOrder`
   (`weightLbs: string`)**. Per the schema comment, `ProductionOrder` is now
   "canonical project-wide" (D-04), but `DemoOrder` — the shape every UI and
   service file consumes — still uses `number`. The exporter papers over this
   with `String(o.weightLbs)`. As soon as Phase 33 routes a real DB query
   into the UI, every `order.weightLbs.toLocaleString()` call in
   `MillProductionUI.tsx` will be calling `String.prototype.toLocaleString`
   (no comma grouping) instead of `Number.prototype.toLocaleString`, with no
   compile-time failure. This is a silent production bug seeded into Phase 32
   that will surface in Phase 33.

2. **The seed script's TRUNCATE + INSERT pair is not transactional and
   cannot be**, because it runs over the Neon HTTP driver
   (`drizzle-orm/neon-http`). Each `.execute()` / `.insert()` call is an
   independent HTTP POST that auto-commits. If the bulk INSERT errors out
   after TRUNCATE has succeeded, the production database is left empty with
   no rollback path — exactly the data-loss scenario the phase comments
   claim is guarded against.

3. **All four schema unit tests are tautological.** They assert
   `expect(table).toBeDefined()` and `expect(true).toBe(true)` for type
   exports — they would pass against any non-null Drizzle table object,
   regardless of whether the columns, NOT NULL constraints, default values,
   FK references, or indexes match the contract documented in CONTEXT.md.
   The same anti-pattern flagged in the previous standard-depth review of
   `no-bad-tailwind-literals.test.ts` (WR-01) recurs here in a more severe
   form, across four files.

4. **The migration structural test (`migration.test.ts`) uses pure
   `.toContain(substring)` assertions** that confirm strings appear *somewhere*
   in the file but cannot tell whether the substrings appear together or in
   the right table/column. For example, the `'DEFAULT 1'` assertion (line
   95-97) would still pass if some unrelated column gained `DEFAULT 1` while
   the `version` column lost it. This means the test cannot detect the very
   schema-drift regressions it is sold as protecting against.

5. **The Tailwind enforcement gate's `.planning/**/*.md` test (re-flagged
   from the prior standard-depth review)** is still tautological — the prior
   review's WR-01 finding has not been addressed in any of the 24 files in
   this PR.

The schema, migration SQL, and snapshot JSON are themselves self-consistent;
no drift was found between `orders.ts` ↔ `0000_aromatic_stone_men.sql` ↔
`0000_snapshot.json`. The `MillProductionUI.tsx` filter-strip behavior, the
RSC page redirect-guard ordering, and the export-seed transform contract
are all sound at the local level. The problems are at module boundaries.

No injection vulnerabilities or hardcoded secrets were found. The single
raw-SQL fragment (`sql\`TRUNCATE …\``) uses static identifiers that are
authored, not user-supplied, so it is safe; the data-loss risk is in the
*sequencing*, not the SQL itself.

---

## Critical Issues

### CR-01: `DemoOrder.weightLbs: number` vs `ProductionOrder.weightLbs: string` — silent type-fork at the schema/UI boundary

**Files:**
- `src/types/millProduction.ts:12` — `weightLbs: number`
- `src/db/schema/orders.ts:36, 58` — `numeric('weight_lbs', …)`, `ProductionOrder = $inferSelect`
- `src/components/MillProductionUI.tsx:91, 109, 142` — `order.weightLbs.toLocaleString()` / `sum + o.weightLbs`
- `scripts/export-seed.ts:29` — `String(o.weightLbs)`
- `src/db/seed.ts:46, 56` — `weight_lbs: string` / `weightLbs: r.weight_lbs`

**Issue:**
The schema's `weightLbs` column is `numeric(10, 2)`, which Drizzle infers as
**`string`** in `ProductionOrder = typeof productionOrders.$inferSelect`
(this is the canonical type per D-04 and the schema's own inline comment on
line 36: "TS infers as string"). The legacy `DemoOrder` interface in
`src/types/millProduction.ts:12` keeps `weightLbs: number`, and every UI
consumer relies on the number-typed value:

```ts
// MillProductionUI.tsx:91
{order.weightLbs.toLocaleString()} lbs

// MillProductionUI.tsx:109, 142
orders.reduce((sum, o) => sum + o.weightLbs, 0)

// services/millProduction.ts mock data
weightLbs: 6000,  // 33 occurrences
```

When Phase 33 swaps `getProductionOrders()` from "return mockOrders" to
"return await db.select(...)", the returned objects will be
`ProductionOrder[]` (strings) but typed as `DemoOrder[]` (numbers) if any
adapter casts. Two distinct silent-failure modes:

1. If the page receives raw `ProductionOrder[]` and assigns to
   `DemoOrder[]`, TypeScript will catch it at compile time *only* if the
   types diverge fully. But because `MillProductionUIProps.orders:
   DemoOrder[]` and the query result is typed `ProductionOrder[]`, a
   helpful contributor will write `as DemoOrder[]` to silence the error,
   and **runtime behavior becomes:**
   - `sum + o.weightLbs` → JavaScript string concatenation:
     `0 + "6000" + "9000" = "060009000"`. The total-weight banner in
     `MillColumn` (line 142, 157) will display `"NaNK / NaNK lbs"` or
     `"6000900012000K / 6000900012000K lbs"`.
   - `o.weightLbs.toLocaleString()` returns the unformatted string
     `"6000"` instead of `"6,000"` — silent UX regression, no error.
2. If someone adds a runtime adapter like
   `{ ...row, weightLbs: Number(row.weightLbs) }`, the bug is masked but
   `numeric(10, 2)` returns trailing-zero strings like `"6000.00"`, which
   `Number()` handles, but loses the precision contract the column
   advertises.

The schema's own comment ("replaces hand-written MillLine / ProductionState
in src/types/millProduction.ts (D-04)") indicates the intent was to retire
`DemoOrder` in favor of `ProductionOrder` — but only the enum union types
were migrated; the structural type still diverges. No test in this phase
exercises the schema-to-UI type boundary, so this defect is invisible to
the entire test suite.

**Fix:**
Pick one of two paths and stick to it. The phase plans suggest Path A:

**Path A (preferred — finish the D-04 migration):**

```ts
// src/types/millProduction.ts — derive DemoOrder from ProductionOrder, not redefine it
export type { MillLine, ProductionState, ProductionOrder } from '@/db/schema/orders';
import type { ProductionOrder } from '@/db/schema/orders';

// Optional: alias for transition period
export type DemoOrder = ProductionOrder;
```

Then update every UI consumer (`MillProductionUI.tsx`, `MillColumn`, etc.)
to read `weightLbs` as a string and parse explicitly:

```ts
const lbs = Number(order.weightLbs);
{lbs.toLocaleString()} lbs
```

…and add an adapter at the service boundary in Phase 33 that does the
`Number(...)` cast once, centrally.

**Path B (if Path A is too invasive for this PR):**

Change the schema column type to `bigint` (or `integer`, since seed values
are whole numbers) so `$inferSelect.weightLbs: number`. This requires
regenerating the migration and snapshot but eliminates the type fork.

Either way, **add a regression test** that imports both `DemoOrder` and
`ProductionOrder` and asserts type-equivalence at the `weightLbs` field
(e.g. via a `expectAssignable<DemoOrder>({} as ProductionOrder)` tsd-style
type assertion, or simply use the same type everywhere).

---

### CR-02: Seed script TRUNCATE + INSERT is not transactional — data-loss risk on partial failure

**File:** `src/db/seed.ts:24-66` (especially 33, 66)

**Issue:**
The seed script uses `drizzle-orm/neon-http` (line 4) and the Neon HTTP
driver (line 24). The two write operations:

```ts
// Line 32-34
await db.execute(
  sql`TRUNCATE production_orders, order_events, import_batches RESTART IDENTITY CASCADE`
);
// …
// Line 66
await db.insert(productionOrders).values(rows);
```

…are **two independent HTTP requests**, each auto-committed by Postgres on
the receiving side. Neon's HTTP driver does not support multi-statement
transactions across separate `.execute()`/`.insert()` calls because each
call is a fresh `POST /sql` (the driver explicitly throws if you try to
call `db.transaction(...)` on the HTTP client — that API is reserved for
the WebSocket / TCP drivers).

Failure modes that result in **production data wiped with no rollback**:

1. The TRUNCATE succeeds, then the network drops before the bulk INSERT
   hits the server → empty `production_orders` table, no error message
   captured beyond what the catch on line 72 prints to stderr.
2. The INSERT fails server-side (constraint violation, value out of range
   for the `numeric(10, 2)` column, type mismatch for the enum) → empty
   table; the operator sees an error but the previous data is gone.
3. The script is interrupted (Ctrl-C, container kill, OOM) between the two
   awaits → empty table.

The phase's own seed-runtime comment (line 28-30) calls out the orphan-row
threat for the `users` table but does not surface this larger threat: the
three core data tables can be silently emptied.

The blast radius depends on environment policy, but `npm run db:seed`
reads `DATABASE_URL_UNPOOLED` from `.env.local`, which a developer might
trivially point at any Neon environment, including a shared staging DB or,
in the worst case, production. There is no environment check (e.g.
`if (process.env.NODE_ENV === 'production') throw`).

**Fix:**
Two changes are required to make this safe:

1. **Use the WebSocket / TCP driver for the seed script**, which supports
   transactions:

```ts
// Replace lines 3-4
import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';

// Replace lines 24-25
const pool = new Pool({ connectionString: process.env.DATABASE_URL_UNPOOLED });
const db = drizzle({ client: pool });

// Wrap both writes in a transaction
await db.transaction(async (tx) => {
  await tx.execute(
    sql`TRUNCATE production_orders, order_events, import_batches RESTART IDENTITY CASCADE`
  );
  await tx.insert(productionOrders).values(rows);
});
await pool.end();
```

If `tx.insert(...)` throws, the transaction rolls back and the data is
preserved.

2. **Add an environment guard** to prevent accidental production wipes:

```ts
if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_SEED_IN_PRODUCTION) {
  throw new Error(
    'Refusing to seed in production. Set ALLOW_SEED_IN_PRODUCTION=1 to override.'
  );
}
```

Or, more defensively, parse `DATABASE_URL_UNPOOLED` and reject any
hostname containing `prod`.

---

### CR-03: Schema-to-DB column type drift between Drizzle `numeric` and seed JSON values — silent precision loss

**Files:**
- `src/db/schema/orders.ts:36` — `numeric('weight_lbs', { precision: 10, scale: 2 })`
- `src/db/seed-data.json` — `"weight_lbs": "6000"` (no decimal)
- `scripts/export-seed.ts:29` — `String(o.weightLbs)` (no formatting)
- `drizzle/0000_aromatic_stone_men.sql:8` — `numeric(10, 2) NOT NULL`

**Issue:**
The column is declared `numeric(10, 2)` (10 total digits, 2 after the
decimal). The seed exporter writes integer-string values like `"6000"`
(no decimal). Postgres will accept these because numeric coerces, but it
stores them as `6000.00` and returns them on `SELECT` as `"6000.00"`.

This means:

1. The seed-data shape test (`seed-data.test.ts:72-76`) asserts
   `typeof weight_lbs === 'string'` — which it is — but does not assert any
   format. A future refactor that switches `String(6000)` to
   `(6000).toFixed(2)` ("6000.00") would still pass the test but would
   silently change the JSON wire format.
2. After seed → DB round-trip, the values returned are `"6000.00"`. Any UI
   code that does `parseInt(order.weightLbs)` will get `6000` (works), but
   `parseFloat` is needed if anything ever stores `6500.50`. There is no
   test asserting which parsing function the consumers use.
3. The exporter uses `String(o.weightLbs)` which means
   `String(6000) === "6000"` but `String(6000.5) === "6000.5"` — the seed
   JSON format depends entirely on the JS number's `Number.prototype.toString`
   output, which is not guaranteed to match `numeric(10, 2)`'s storage
   format.

Combined with CR-01, this means three distinct representations of the same
value coexist (`number`, `"6000"`, `"6000.00"`) with no tests pinning down
which lives where.

**Fix:**
Either:

1. **Drop the decimal scale** — change to `integer` or `numeric(10, 0)` if
   sub-pound quantities are never expected. This matches the existing seed
   values and removes one of the three representations. Simpler.
2. **Normalize the exporter output** — change line 29 to
   `weight_lbs: Number(o.weightLbs).toFixed(2)` so seed JSON always
   contains canonical 2-decimal strings. And add an assertion to
   `seed-data.test.ts`:

```ts
it('weight_lbs matches numeric(10,2) format', () => {
  for (const row of seedData) {
    expect((row as any).weight_lbs).toMatch(/^\d+\.\d{2}$/);
  }
});
```

---

## Blockers

### BL-01: All four schema unit tests are tautological — they cannot detect column, constraint, default, FK, or index drift

**Files:**
- `src/db/schema/__tests__/orders.test.ts` (entire file, especially lines 5-7, 22-28)
- `src/db/schema/__tests__/events.test.ts` (entire file, especially lines 5-7, 9-15, 17-22)
- `src/db/schema/__tests__/imports.test.ts` (entire file, especially lines 5-7, 9-14)
- `src/db/schema/__tests__/users.test.ts` (entire file, especially lines 5-7, 9-11, 13-18)

**Issue:**
Every "schema export" test boils down to either:

```ts
expect(productionOrders).toBeDefined();        // line 6, orders.test.ts
expect(orderEvents.orderId).toBeDefined();      // line 10, events.test.ts
```

…or a pure type-level check:

```ts
const _selectCheck: ProductionOrder | undefined = undefined;
const _insertCheck: NewProductionOrder | undefined = undefined;
expect(true).toBe(true);                        // lines 25-27, orders.test.ts
```

`expect(table).toBeDefined()` is **true for any non-null Drizzle table
object** — it would pass if someone replaced the entire `productionOrders`
table with `pgTable('production_orders', { id: uuid('id').primaryKey() })`,
removing every other column. `expect(true).toBe(true)` is the canonical
tautology — it has no information content whatsoever. The
`_selectCheck: ProductionOrder | undefined = undefined` pattern is a
compile-time check that the type is exported, but since the test file
imports `ProductionOrder` on line 2 of `orders.test.ts`, the type's
existence is already enforced by `tsc` — the runtime assertion adds
nothing.

These tests provide **zero protection** against the kinds of changes the
prior phase claims to guard:

- A column rename (e.g. `customer` → `client_name`) — passes.
- A NOT NULL → NULL change on `customer` — passes.
- A FK `onDelete: 'cascade'` → `'restrict'` change in `events.ts` — passes.
- Adding a unique index removal on `order_number` (D-20 / IMPORT-05) — passes.
- An enum-value reorder (`['Pending', 'Mixing', 'Completed', 'Blocked']` →
  `['Mixing', 'Pending', …]`) — passes (only orders.test.ts:10-16 covers
  enum ordering; events.test.ts and users.test.ts do not).

The schema layer is the single source of truth that the migration, the
seed, and Phase 33 queries all depend on. A change here that breaks
downstream code should produce a red test in this file — currently it
does not.

This is the same class of defect flagged in WR-01 of the prior 32-07
review (`expect.arrayContaining([])` tautology); it now recurs in four
new test files, in a worse form.

**Fix:**
Replace the body of each test file with **structural assertions on the
Drizzle table object**. Drizzle exposes `getTableConfig` and similar
helpers for this, but a minimal version works against the column shape:

```ts
// src/db/schema/__tests__/orders.test.ts
import { getTableConfig } from 'drizzle-orm/pg-core';
import { productionOrders, productionStateEnum, millLineEnum } from '../orders';

describe('productionOrders table contract', () => {
  const cfg = getTableConfig(productionOrders);
  const cols = Object.fromEntries(cfg.columns.map((c) => [c.name, c]));

  it('has all 14 required columns', () => {
    expect(Object.keys(cols).sort()).toEqual(
      [
        'id', 'order_number', 'customer', 'product', 'weight_lbs',
        'delivery_time', 'state', 'mill_line', 'texture_type', 'line_code',
        'version', 'created_by', 'created_at', 'updated_at',
      ].sort()
    );
  });

  it('order_number, customer, product, weight_lbs, delivery_time, state, mill_line, version, created_by, created_at, updated_at are NOT NULL', () => {
    for (const name of [
      'order_number', 'customer', 'product', 'weight_lbs',
      'delivery_time', 'state', 'mill_line', 'version',
      'created_by', 'created_at', 'updated_at',
    ]) {
      expect(cols[name].notNull).toBe(true);
    }
  });

  it('texture_type and line_code are nullable', () => {
    expect(cols.texture_type.notNull).toBe(false);
    expect(cols.line_code.notNull).toBe(false);
  });

  it('version defaults to 1', () => {
    expect(cols.version.default).toBe(1);
  });

  it('order_number index is unique (D-20 / IMPORT-05 duplicate detection)', () => {
    const ix = cfg.indexes.find((i) => i.config.name === 'idx_orders_order_number');
    expect(ix?.config.unique).toBe(true);
  });

  it('productionStateEnum values are exactly [Pending, Mixing, Completed, Blocked] in order', () => {
    expect(productionStateEnum.enumValues).toEqual(['Pending', 'Mixing', 'Completed', 'Blocked']);
  });
});
```

Repeat for `events.test.ts` (FK on `order_id` → `production_orders.id` with
`onDelete: 'cascade'` is the high-value assertion), `imports.test.ts`, and
`users.test.ts` (id is text primary key, no surrogate UUID).

---

### BL-02: `migration.test.ts` uses unanchored `.toContain` — assertions are too loose to detect column/table drift

**File:** `src/db/__tests__/migration.test.ts:38-127`

**Issue:**
Every assertion in this file is a substring-anywhere check:

```ts
expect(sqlContent).toContain('DEFAULT 1');                                // line 96
expect(sqlContent).toContain("DEFAULT gen_random_uuid()");                 // line 101
expect(sqlContent).toContain('CREATE TABLE "production_orders"');          // line 60
expect(sqlContent).toContain('ON DELETE cascade');                         // line 91
```

These pass as long as the substring appears **anywhere** in the SQL file.
They cannot detect:

1. **Column-default drift:** If someone changes `version: integer('version').notNull().default(1)` to remove `.default(1)` on the version column but adds `default(1)` on, say, a new audit column, the test still passes — `DEFAULT 1` still appears in the file.
2. **Table-column drift:** If `production_orders` loses its `weight_lbs` column but `order_events` gains a `weight_lbs` column, the assertion on line 60 (`CREATE TABLE "production_orders"`) still passes — it only checks the table name appears.
3. **FK drift:** `'ON DELETE cascade'` (line 91) passes as long as **any** FK in the file has cascade delete. If `order_events.order_id` ever loses its FK and a new unrelated table gains one with cascade, the assertion is satisfied but the contract is broken.
4. **Enum ordering:** No assertion checks that `production_state` enum values are in `[Pending, Mixing, Completed, Blocked]` order — only that the `CREATE TYPE` line exists (line 80).
5. **Index column:** Assertion 14 (line 110-112) confirms `CREATE UNIQUE INDEX "idx_orders_order_number"` exists but does not check which column it indexes. The index could target `customer` and the assertion still passes.

The file header (lines 1-16) sells this as a "structural contract test"
that "catches missing-migration regressions". For "missing migration" it
works (the `beforeAll` will throw with a clear ENOENT). For "drift" it does
not.

**Fix:**
Replace each substring match with a regex that anchors to the table /
column / constraint context:

```ts
// Instead of:
expect(sqlContent).toContain('DEFAULT 1');

// Use:
expect(sqlContent).toMatch(/"version"\s+integer\s+DEFAULT\s+1\s+NOT NULL/);

// Instead of:
expect(sqlContent).toContain('ON DELETE cascade');

// Use:
expect(sqlContent).toMatch(
  /CONSTRAINT\s+"order_events_order_id_production_orders_id_fk"[\s\S]+?ON DELETE cascade/
);

// Instead of:
expect(sqlContent).toContain('CREATE UNIQUE INDEX "idx_orders_order_number"');

// Use:
expect(sqlContent).toMatch(
  /CREATE UNIQUE INDEX "idx_orders_order_number" ON "production_orders" USING btree \("order_number"\)/
);
```

Alternatively, parse the `0000_snapshot.json` (which IS structured) and
assert against that — the snapshot is generated from the same source-of-
truth as the SQL, so any drift there propagates to a structured assertion
target. Example:

```ts
import snapshot from '../../../drizzle/meta/0000_snapshot.json';
const orders = snapshot.tables['public.production_orders'];
expect(orders.columns.version.default).toBe(1);
expect(orders.columns.weight_lbs.type).toBe('numeric(10, 2)');
expect(orders.indexes.idx_orders_order_number.isUnique).toBe(true);
```

This gives structured, column-scoped assertions that are immune to
sequence/whitespace drift in the SQL.

---

### BL-03: Tautological `.planning/**/*.md` test (carry-over from prior review WR-01) is still unaddressed in this phase

**File:** `src/__tests__/no-bad-tailwind-literals.test.ts:127-141`

**Issue:**
The previous standard-depth review (32-REVIEW.md @ commit caa9ecd) raised
WR-01 against this exact block:

```ts
expect(violations).toEqual(
  /* eslint-disable-next-line jest/no-conditional-expect */
  expect.arrayContaining([]),
  // Produce a useful failure message if violations exist
);

if (violations.length > 0) {
  throw new Error(`Found ${violations.length} dangerous Tailwind literal(s)...`);
}
```

`expect.arrayContaining([])` is a tautology — it matches every array. The
guard is the `throw` block, not the `expect`. A future refactor that
removes the `throw` because it "looks redundant next to the expect" would
silently disable the gate.

This was flagged but has not been fixed in the current PR. The file
header (lines 16-21) still promises "ACTIVE enforcement gate" while the
first test's actual assertion is dead code. Re-classifying from WR to BL
because:

1. It blocks the phase's own stated "Layer 3" guarantee.
2. It is identical in shape to the new defects in CR-01 (schema unit
   tests) — leaving it in place validates the tautology pattern for the
   project, which encouraged the same anti-pattern in the four schema
   tests.

**Fix:**
Apply the fix proposed in the prior review verbatim:

```ts
test('no dangerous-form token in .planning/**/*.md', () => {
  const mdFiles = walkFiles(PLANNING_DIR).filter((f) => f.endsWith('.md'));
  const violations: Array<{ file: string; line: number; text: string }> = [];

  for (const file of mdFiles) {
    for (const match of scanFile(file)) {
      violations.push({ file, line: match.line, text: match.text });
    }
  }

  if (violations.length > 0) {
    throw new Error(
      `Found ${violations.length} dangerous Tailwind literal(s) in .planning/**/*.md:` +
        formatViolations(violations) +
        '\n\nFix: replace the literal asterisk with &ast; inside the token.\n' +
        'See .planning/debug/css-text-var-text-star-parse-fail.md for context.',
    );
  }

  expect(violations).toHaveLength(0);
});
```

Drop the stale `eslint-disable-next-line jest/no-conditional-expect`.

---

## Warnings

### WR-01: Seed loader has no environment / DB-URL allowlist — `npm run db:seed` against production wipes the DB

**File:** `src/db/seed.ts:14-25, 27-70`

**Issue:**
The script reads `DATABASE_URL_UNPOOLED` from `.env.local` (line 14) and
proceeds to TRUNCATE three tables (line 33). There is no environment
check, no hostname check, no interactive confirmation. A developer who has
both staging and production credentials in their dev environment
(common — e.g. for debugging) can wipe production with a typo in their
shell history.

The blast radius is bounded only by the developer's care with `.env.local`.

This compounds with CR-02 (TRUNCATE is auto-committed before INSERT, so
the wipe can't be undone by failing fast).

**Fix:**
Add a guard at the top of `seed()`:

```ts
const url = process.env.DATABASE_URL_UNPOOLED!;
const FORBIDDEN_HOST_PATTERNS = [/prod/i, /production/i];
const host = new URL(url).hostname;
if (FORBIDDEN_HOST_PATTERNS.some((rx) => rx.test(host))) {
  throw new Error(
    `Refusing to seed against host "${host}". Set DATABASE_URL_UNPOOLED to a non-production endpoint.`
  );
}

if (process.env.NODE_ENV === 'production' && process.env.ALLOW_SEED_IN_PRODUCTION !== '1') {
  throw new Error('Refusing to seed in production. Set ALLOW_SEED_IN_PRODUCTION=1 to override.');
}
```

---

### WR-02: `seed.ts` `process.exit(0)` inside `seed()` short-circuits any awaited cleanup

**File:** `src/db/seed.ts:69, 72-75`

**Issue:**
The success path ends with:

```ts
console.log('Seed complete.');
process.exit(0);   // line 69
```

`process.exit(0)` is invoked **inside** the `seed()` async function. If
the `.catch()` on line 72 ever needed to `await` cleanup (closing a pool,
flushing stderr), it would never run because `process.exit` terminates
synchronously. With the current HTTP driver this is harmless — there is no
pool to close — but if the fix in CR-02 is applied (switching to the
WebSocket driver with `pool.end()`), this pattern will cut off the pool
shutdown.

Additionally, `process.exit(0)` immediately after the `.then` is
**unnecessary** — Node will exit naturally once the event loop drains.
Calling it explicitly is a code smell that suggests "I have a dangling
handle I don't understand."

**Fix:**

```ts
async function seed() {
  // ... transactional work ...
  console.log('Seed complete.');
}

seed()
  .then(() => process.exit(0))    // or just let Node exit naturally
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
```

Or, if a pool is added in CR-02:

```ts
seed()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
```

---

### WR-03: `seed.ts` SnakeRow type duplicates schema enum unions instead of importing them — drift risk

**File:** `src/db/seed.ts:39-51`

**Issue:**

```ts
type SnakeRow = {
  // ...
  state: 'Pending' | 'Mixing' | 'Completed' | 'Blocked';
  mill_line: 'Premix' | 'Excel' | 'CGM';
  // ...
};
```

These literal unions are hand-typed copies of the enum values defined in
`src/db/schema/orders.ts:16-23`. If anyone adds a fifth `ProductionState`
to the enum (the schema's `D-07` already anticipates this), the schema
will update, the migration will update, the seed JSON could carry the new
state — but `seed.ts:45` will narrow it back out, causing the `.values()`
call on line 66 to either reject valid data or, worse, silently coerce
through `as` casts.

The whole point of the schema barrel (`src/db/schema/index.ts`) and the
co-located `MillLine` / `ProductionState` exports (D-04) is to avoid
exactly this kind of drift.

**Fix:**

```ts
import type { MillLine, ProductionState } from './schema/orders';

type SnakeRow = {
  order_number: string;
  customer: string;
  product: string;
  weight_lbs: string;
  delivery_time: string;
  state: ProductionState;
  mill_line: MillLine;
  texture_type: string | null;
  line_code: string | null;
  created_by: string;
  version: number;
};
```

---

### WR-04: `seed.ts` casts seed data via `as SnakeRow[]` without runtime validation — accepts malformed JSON silently

**File:** `src/db/seed.ts:52`

**Issue:**

```ts
const rows = (seedData as SnakeRow[]).map((r) => ({ ... }));
```

The `as SnakeRow[]` cast is a TypeScript-only assertion. If
`seed-data.json` is hand-edited and a row is missing `mill_line` or has
`state: "Cancelled"` (not in the enum), no runtime check fires here —
the bad data flows straight into `db.insert()`. Postgres will reject it
(enum check on the column), but the error message is "invalid input value
for enum production_state", which is far less actionable than "row 17 has
invalid state 'Cancelled'".

`seed-data.test.ts` already covers shape — but the seed loader doesn't
**run** the test before insert. The test is a CI artifact; production
seed runs do not gate on it.

**Fix:**
Add a quick shape check at the top of `seed()`:

```ts
const VALID_STATES = ['Pending', 'Mixing', 'Completed', 'Blocked'] as const;
const VALID_MILL_LINES = ['Premix', 'Excel', 'CGM'] as const;

for (const [i, r] of (seedData as SnakeRow[]).entries()) {
  if (!VALID_STATES.includes(r.state)) {
    throw new Error(`Row ${i}: invalid state "${r.state}"`);
  }
  if (!VALID_MILL_LINES.includes(r.mill_line)) {
    throw new Error(`Row ${i}: invalid mill_line "${r.mill_line}"`);
  }
}
```

Or use Zod / a schema validator. The Drizzle ecosystem provides
`drizzle-zod` for this — `createInsertSchema(productionOrders).parse(r)`
would give the strongest guarantee.

---

### WR-05: `MillProductionUI.tsx` `ordersByState` reduce mutates accumulator with empty-object assertion — TS-correct but fragile

**File:** `src/components/MillProductionUI.tsx:144-150, 200-208, 215-222`

**Issue:**

```ts
const ordersByState = STATE_ORDER.reduce(
  (acc, state) => {
    acc[state] = orders.filter((o) => o.state === state);
    return acc;
  },
  {} as Record<ProductionState, DemoOrder[]>,   // ← cast at initial value
);
```

The cast `{} as Record<ProductionState, DemoOrder[]>` tells TypeScript that
the accumulator starts with all four states populated, which is false. If
`STATE_ORDER` is ever changed to omit a state (e.g. someone removes
`Blocked`), TypeScript will still allow `ordersByState["Blocked"]` reads
at line 165 (`StateSection` rendering), and the reads will return
`undefined` at runtime, causing `orders.reduce(...)` and `orders.map(...)`
inside `StateSection` to throw `TypeError: Cannot read properties of
undefined`.

The same anti-pattern repeats at:
- Line 200-208 (`stateCounts`)
- Line 215-222 (`ordersByMill` — this one is correct because all three
  mill lines are listed explicitly).

This isn't a bug today (all four states are in `STATE_ORDER`), but it's a
landmine for future contributors.

**Fix:**
Initialize all keys explicitly:

```ts
const ordersByState = STATE_ORDER.reduce(
  (acc, state) => {
    acc[state] = orders.filter((o) => o.state === state);
    return acc;
  },
  {
    Completed: [],
    Mixing: [],
    Blocked: [],
    Pending: [],
  } as Record<ProductionState, DemoOrder[]>,
);
```

Or use a type assertion on each access (`ordersByState[state] ?? []`).

---

### WR-06: `MillProductionUI` `formatWeight` rounds before display — silent precision loss for total banner

**File:** `src/components/MillProductionUI.tsx:67-72, 120, 157`

**Issue:**

```ts
function formatWeight(lbs: number): string {
  if (lbs >= 1000) {
    return `${Math.round(lbs / 1000)}K`;
  }
  return lbs.toLocaleString();
}
```

This is used for two distinct purposes:

1. Per-state section header (line 120): shows the sum of weights for that
   state.
2. Per-mill column header (line 157): shows "completed / total" weight.

The "K" suffix with `Math.round` collapses `6499` and `6500` to both
display as `"6K"` / `"7K"`. For the per-column "X / Y lbs" header at line
157, this means **the displayed completed/total ratio can lose accuracy
by up to 999 lbs in each direction**. For a state header showing `15000`,
the user sees "15K" — that's fine for a UI summary, but in this codebase
the same function is used for the "X completed / Y total lbs" prominent
metric, where 49,500/50,500 looks identical to "50K / 51K" or even "49K /
51K" depending on rounding direction.

Not a bug per se, but the function should distinguish "summary glance" vs
"precise count" use cases, or the column header should not abbreviate.

**Fix:**
Either:

1. Use `Math.floor` / `Math.ceil` explicitly for one of the two uses with
   a clear semantic, **or**
2. Format with one decimal place (`(lbs / 1000).toFixed(1)`), **or**
3. Show full `toLocaleString()` for the column header and only abbreviate
   the per-state summary.

Lowest-impact fix: just change line 157 to use `.toLocaleString()`:

```tsx
{completedWeight.toLocaleString()} / {totalWeight.toLocaleString()} lbs
```

---

### WR-07: `seed-data.test.ts` `expect(row).toHaveProperty(field)` plus follow-up null/undefined checks are redundant

**File:** `src/db/__tests__/seed-data.test.ts:44-52`

**Issue:**

```ts
it('every row has required NOT NULL fields', () => {
  for (const row of seedData) {
    for (const field of REQUIRED_FIELDS) {
      expect(row).toHaveProperty(field);
      expect((row as Record<string, unknown>)[field]).not.toBeNull();
      expect((row as Record<string, unknown>)[field]).not.toBeUndefined();
    }
  }
});
```

`toHaveProperty` returns true even when the property's value is `undefined`
(it checks for key presence, not defined-ness). The follow-up
`not.toBeUndefined` saves it, but the first assertion is dead — any case
where it would fail is also caught by the second. More importantly: the
test does **not** assert non-empty strings. A row with `"customer": ""`
passes — but inserting empty string into a NOT NULL `text` column is a
common bug class (CSV imports that yield empty cells).

The other side: this test runs over every required field, but the field
list (line 21-30) omits `version`. The "every row has required NOT NULL
fields" loop therefore does not verify version's presence; only the
dedicated `version === 1` test on line 78 covers it. That's fine for
version but the asymmetry is a code smell.

**Fix:**
Tighten and dedupe:

```ts
it('every row has all required NOT NULL fields as non-empty strings/numbers', () => {
  for (const row of seedData) {
    for (const field of REQUIRED_FIELDS) {
      const val = (row as Record<string, unknown>)[field];
      expect(val).toBeDefined();
      expect(val).not.toBeNull();
      // Reject empty-string sentinels that would pass NOT NULL but break callers
      if (typeof val === 'string') {
        expect(val.length).toBeGreaterThan(0);
      }
    }
  }
});
```

Add `version` to `REQUIRED_FIELDS` while you're at it.

---

### WR-08: `migration.test.ts` `beforeAll` throws synchronously — `sqlContent` is potentially `undefined` for `it()` block ordering

**File:** `src/db/__tests__/migration.test.ts:23-37`

**Issue:**

```ts
let sqlContent: string;

beforeAll(() => {
  const files = readdirSync(drizzleDir);
  const sqlFile = files.find((f) => f.startsWith('0000_') && f.endsWith('.sql'));
  if (!sqlFile) {
    throw new Error('No 0000_*.sql file found in ./drizzle/. Run `npm run db:generate` first.');
  }
  sqlContent = readFileSync(path.join(drizzleDir, sqlFile), 'utf-8');
});
```

`sqlContent` is declared but not initialized. If `readdirSync` throws
ENOENT before reaching the find call (no `drizzle/` directory at all),
the `beforeAll` rejects, Jest marks all subsequent `it()` blocks as
failed, but the error message ("ENOENT, scandir") is less helpful than
the intended message on line 32-34. The first three `it()` assertions
(lines 40-56) also re-run `readdirSync(drizzleDir)` directly without
catching, so they too will explode with cryptic ENOENT.

The file header (lines 5-8) sells "fresh checkout without running
`drizzle-kit generate` fails RED — a deliberate signal". The signal is
buried under a confusing stack trace.

**Fix:**
Wrap `readdirSync` in a try/catch with a clear message at the
`beforeAll` boundary:

```ts
beforeAll(() => {
  let files: string[];
  try {
    files = readdirSync(drizzleDir);
  } catch {
    throw new Error(
      `drizzle/ directory not found at ${drizzleDir}. Run \`npm run db:generate\` first.`
    );
  }
  const sqlFile = files.find((f) => f.startsWith('0000_') && f.endsWith('.sql'));
  if (!sqlFile) {
    throw new Error(
      'No 0000_*.sql file found in ./drizzle/. Run `npm run db:generate` first.'
    );
  }
  sqlContent = readFileSync(path.join(drizzleDir, sqlFile), 'utf-8');
});
```

And use `sqlContent` in the structural-existence assertions instead of
re-reading the directory each time.

---

### WR-09: `walkFiles` symlink-recursion risk (carry-over from prior review WR-02) unaddressed

**File:** `src/__tests__/no-bad-tailwind-literals.test.ts:47-71`

**Issue:**
Same as prior review's WR-02 — `entry.isDirectory()` follows symlinks; a
symlink loop inside `.planning/` or `src/` causes infinite recursion. The
risk is low (no symlinks expected in the project today) but the failure
mode (CI hang) is worse than the bug class the test catches. Flagging
again because no fix landed in this PR.

**Fix:**
Skip symlinks:

```ts
for (const entry of entries) {
  if (entry.isSymbolicLink()) continue;
  if (entry.isDirectory()) { /* ... */ }
}
```

---

## Info

### IN-01: `src/db/seed.ts` log messages disclose internal table list — fine for dev, but log lines persist in CI artifacts

**File:** `src/db/seed.ts:31-34`

**Issue:**

```ts
console.log('Truncating production_orders, order_events, import_batches...');
```

Routine logging. Not a security issue (the table names are in this file's
own source). Mentioning only because if anyone wires this script into a
production CI/CD pipeline, the log line ends up in build artifacts. Low
priority.

**Fix:**
Optional. If concerned, gate behind `if (process.env.VERBOSE)`.

---

### IN-02: `productionStateEnum` value ordering differs between schema (`Pending, Mixing, Completed, Blocked`) and UI display (`Completed, Mixing, Blocked, Pending`)

**Files:**
- `src/db/schema/orders.ts:16-21` — enum order `[Pending, Mixing, Completed, Blocked]`
- `src/components/MillProductionUI.tsx:11-16` — `STATE_ORDER = [Completed, Mixing, Blocked, Pending]`

**Issue:**
These are intentionally different — the DB enum order matches "lifecycle"
(Pending → Mixing → Completed, with Blocked as off-path), while the UI
order matches "visual priority" (Completed first because it's the largest
group on a typical mill day). There's no bug.

It's worth a one-line comment in either file explicitly calling out the
discrepancy, because a future contributor will look at one ordering, then
the other, and assume the second is a typo of the first.

**Fix:**
Add a comment to `STATE_ORDER`:

```ts
// NOTE: This UI display order intentionally differs from
// `productionStateEnum.enumValues` in src/db/schema/orders.ts. The DB
// enum is in lifecycle order (Pending → Mixing → Completed, Blocked
// off-path); the UI shows largest groups first.
const STATE_ORDER: ProductionState[] = ['Completed', 'Mixing', 'Blocked', 'Pending'];
```

---

### IN-03: `page.test.tsx` redirect-after-fetch assertion is a negative check that's hard to falsify

**File:** `src/app/demo/mill-production/__tests__/page.test.tsx:80-102`

**Issue:**

```ts
it('redirects to /sign-in when userId is missing (unauthenticated)', async () => {
  mockUnauthenticatedSession();
  await expect(MillProductionPage()).rejects.toMatchObject({ url: "/sign-in" });
  expect(getProductionOrders).not.toHaveBeenCalled();   // ← negative assertion
});
```

The comment on lines 84-86 says this catches a regression where
"`await getProductionOrders()` is reordered above `await
requireRole('demo')`". But the assertion `not.toHaveBeenCalled()` is
only meaningful if the test is the only one that runs. With
`jest.clearAllMocks()` in `beforeEach` (line 70) this is fine, but the
order of the three `await` statements inside `MillProductionPage` is
not actually exercised — the test only proves "if `requireRole` throws,
nothing else runs," which is a property of synchronous JS control flow,
not a meaningful test of the page's source.

If a future refactor wraps the fetch in `Promise.allSettled([
  requireRole('demo'), getProductionOrders() ])`, both run concurrently,
and the redirect-then-fetch invariant breaks — but the
`not.toHaveBeenCalled` test would still **pass**, because the
`MillProductionPage` rejection still happens before the test inspects
the mock.

The intent is good; the assertion shape is weak.

**Fix:**
If the invariant matters, assert it via spy-call-order using
`mock.calls.length` snapshotting or `jest.spyOn(...).mock.calls[0]` with
a sentinel. Or simply trust the unit-test of `requireRole` and drop the
negative-assertion bookkeeping. As written, this assertion is more
documentation than enforcement.

---

### IN-04: `MillProductionUI.test.tsx` "no `bg-gray-200`" assertion is overly specific and brittle

**File:** `src/components/__tests__/MillProductionUI.test.tsx:174-189`

**Issue:**

```ts
expect(container.querySelectorAll(".bg-gray-200").length).toBe(0);
```

This asserts the absence of a specific Tailwind class. The intent is to
prove the design tokens (`var(--status-*-border)`) are used instead of
hardcoded grays. But `bg-gray-200` is one specific class — `bg-slate-200`,
`bg-zinc-300`, etc. would all pass this check while violating the intent.
The positive assertion on lines 181-186 (`backgroundColor` contains
`var(--status-`) is the real test; the negative assertion adds noise.

**Fix:**
Drop the negative assertion or generalize:

```ts
// Generalized: any class matching /^bg-(gray|slate|zinc|neutral|stone)-\d+$/
const hardcoded = Array.from(container.querySelectorAll<HTMLElement>('[class*="bg-"]'))
  .flatMap((el) => Array.from(el.classList))
  .filter((c) => /^bg-(gray|slate|zinc|neutral|stone)-\d+$/.test(c));
expect(hardcoded).toEqual([]);
```

Or just remove the line.

---

### IN-05: `--purple-dark` token missing dark-mode override (carry-over from prior review IN-02)

**File:** `src/app/globals.css:54-55, 196-198`

**Issue:**
`:root` defines `--purple-dark: #7e22ce` (line 55) and exposes
`--color-purple-dark` in `@theme inline` (line 247). The `.dark` block
defines `--purple` (line 197) and `--purple-light` (line 198) but not
`--purple-dark`. Same finding as the prior review's IN-02 — pre-existing,
not introduced by Phase 32, but flagging again because this PR was a
chance to fix it.

**Fix:**
See prior review's IN-02. Either add `--purple-dark: <dark-mode-value>;`
to the `.dark` block (consistent with all other status families), or add
an inline comment confirming intentional inheritance.

---

### IN-06: `export-seed.ts` `npx --yes tsx@4.21.0 scripts/export-seed.ts` usage comment is brittle — package.json already pins tsx

**File:** `scripts/export-seed.ts:12-13`

**Issue:**

```ts
 * Usage:
 *   npx --yes tsx@4.21.0 scripts/export-seed.ts
```

The version pin `tsx@4.21.0` is hardcoded in the comment but tsx is
already in `devDependencies` at version `^4.21.0` (package.json:54). The
intended invocation is `npx tsx scripts/export-seed.ts` — `npx` will
resolve from the local `node_modules` first. The `--yes tsx@4.21.0` form
fetches a fresh copy from the registry every time, defeating the lockfile.

There's no `package.json` script for this either; future contributors will
copy-paste from the comment and slow down their local runs.

**Fix:**
Update the comment:

```ts
 * Usage:
 *   npx tsx scripts/export-seed.ts
```

And optionally add a script to `package.json`:

```json
"db:export-seed": "tsx scripts/export-seed.ts",
```

---

_Reviewed: 2026-05-13_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: deep_
