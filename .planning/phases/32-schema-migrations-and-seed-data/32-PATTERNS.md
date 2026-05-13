# Phase 32: Schema, Migrations, and Seed Data - Pattern Map

**Mapped:** 2026-05-13
**Files analyzed:** 17 (11 create, 5 modify, 1 delete)
**Analogs found:** 14 / 17

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/db/schema/orders.ts` | schema/model | transform | `src/db/schema.ts` (placeholder) + RESEARCH.md skeleton | research-match |
| `src/db/schema/events.ts` | schema/model | transform | `src/db/schema/orders.ts` (sibling, same phase) | sibling-match |
| `src/db/schema/imports.ts` | schema/model | transform | `src/db/schema/orders.ts` (sibling, same phase) | sibling-match |
| `src/db/schema/users.ts` | schema/model | transform | `src/db/schema/orders.ts` (sibling, same phase) | sibling-match |
| `src/db/schema/index.ts` | barrel/config | transform | `src/services/mockData.ts` (barrel-style named exports) | role-match |
| `src/db/seed-data.json` | config/fixture | batch | `src/services/millProduction.ts` (mock data source) | data-match |
| `src/db/seed.ts` | utility/script | batch | `drizzle.config.ts` (dotenv + `__dirname` + env guard) | exact dotenv-match |
| `scripts/export-seed.ts` | utility/script | transform | `src/services/millProduction.ts` + `drizzle.config.ts` | role-match |
| `drizzle/0000_*.sql` | migration | batch | none in repo yet (first migration) | no analog |
| `src/db/schema/__tests__/orders.test.ts` | test | request-response | `src/db/__tests__/index.test.ts` | exact |
| `src/db/schema/__tests__/events.test.ts` | test | request-response | `src/db/__tests__/index.test.ts` | exact |
| `src/db/schema/__tests__/imports.test.ts` | test | request-response | `src/db/__tests__/index.test.ts` | exact |
| `src/db/schema/__tests__/users.test.ts` | test | request-response | `src/db/__tests__/index.test.ts` | exact |
| `src/db/__tests__/seed-data.test.ts` | test | request-response | `src/services/bins.test.ts` | role-match |
| `src/db/__tests__/migration.test.ts` | test | request-response | `src/db/__tests__/index.test.ts` | exact |
| `drizzle.config.ts` | config | request-response | self (one-line edit) | exact |
| `src/types/millProduction.ts` | model/type | transform | self (rewrite) | exact |
| `src/services/millProduction.ts` | service | request-response | self (minor edit) | exact |
| `src/app/demo/mill-production/page.tsx` | component/page | request-response | self (no change needed — no direct `ProductionOrder` import) | exact |
| `package.json` | config | n/a | self (additive) | exact |

---

## Pattern Assignments

### `src/db/schema/orders.ts` (schema, transform)

**Analog:** `drizzle.config.ts` for import discipline; RESEARCH.md skeleton for schema shape. No existing pgTable analog in the codebase — this is the first real table.

**Imports pattern** — drizzle-orm/pg-core only; no `@/db` import, no `'server-only'` directive:
```typescript
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
```

**Enum declaration pattern** (enums must be declared before the table that uses them; they are module-level exports):
```typescript
export const productionStateEnum = pgEnum('production_state', [
  'Pending',
  'Mixing',
  'Completed',
  'Blocked',
]);

export const millLineEnum = pgEnum('mill_line', ['Premix', 'Excel', 'CGM']);

// Derive TS union types from the enum arrays — replaces hand-written unions in src/types/millProduction.ts
export type ProductionState = (typeof productionStateEnum.enumValues)[number];
export type MillLine = (typeof millLineEnum.enumValues)[number];
```

**pgTable pattern with second-arg index array** (Drizzle 0.30+ array form):
```typescript
export const productionOrders = pgTable(
  'production_orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderNumber: text('order_number').notNull(),
    // ... all columns
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('idx_orders_state').on(table.state),
    index('idx_orders_mill_line').on(table.millLine),
    uniqueIndex('idx_orders_order_number').on(table.orderNumber),
  ]
);
```

**Co-located inferred types pattern** (D-03 — no central types file):
```typescript
export type ProductionOrder = typeof productionOrders.$inferSelect;
export type NewProductionOrder = typeof productionOrders.$inferInsert;
```

**Key column notes:**
- `weightLbs: numeric('weight_lbs', { precision: 10, scale: 2 }).notNull()` — Drizzle infers `string` in TS; Phase 33 consumers need `Number(row.weightLbs)`
- `deliveryTime: text('delivery_time').notNull()` — display string, NOT a `time` type
- `createdBy: text('created_by').notNull()` — Clerk user ID, no FK (D-09)
- `version: integer('version').notNull().default(1)` — optimistic concurrency counter (D-11)
- All timestamps: `timestamp('col', { withTimezone: true })` (D-14)

---

### `src/db/schema/events.ts` (schema, transform)

**Analog:** `src/db/schema/orders.ts` (sibling written first in same phase)

**Imports pattern** — imports from sibling orders.ts for FK reference and enum reuse:
```typescript
import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core';
import { productionOrders, productionStateEnum } from './orders';
```

**FK with CASCADE pattern:**
```typescript
orderId: uuid('order_id')
  .notNull()
  .references(() => productionOrders.id, { onDelete: 'cascade' }),
```

**Composite index with DESC ordering:**
```typescript
(table) => [
  index('idx_events_order_id_changed_at_desc').on(
    table.orderId,
    table.changedAt.desc()
  ),
]
```

**Co-located inferred types:**
```typescript
export type OrderEvent = typeof orderEvents.$inferSelect;
export type NewOrderEvent = typeof orderEvents.$inferInsert;
```

---

### `src/db/schema/imports.ts` (schema, transform)

**Analog:** `src/db/schema/orders.ts` (same phase sibling — simpler table, no enums, no indexes)

**Pattern:** Minimal pgTable without second arg (no custom indexes needed — all access is chronological):
```typescript
import { pgTable, uuid, text, integer, timestamp } from 'drizzle-orm/pg-core';

export const importBatches = pgTable('import_batches', {
  id: uuid('id').primaryKey().defaultRandom(),
  fileName: text('file_name').notNull(),
  rowCount: integer('row_count').notNull(),
  importedBy: text('imported_by').notNull(),
  importedAt: timestamp('imported_at', { withTimezone: true }).notNull().defaultNow(),
});

export type ImportBatch = typeof importBatches.$inferSelect;
export type NewImportBatch = typeof importBatches.$inferInsert;
```

---

### `src/db/schema/users.ts` (schema, transform)

**Analog:** `src/db/schema/orders.ts` (same phase sibling — special case: text PK, not uuid PK)

**Text primary key pattern** (D-09 — stores Clerk `user_xxx` string directly):
```typescript
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey(),   // Clerk user_xxx ID as PK — no surrogate UUID
  displayName: text('display_name'),
  email: text('email'),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
```

---

### `src/db/schema/index.ts` (barrel, transform)

**Analog:** No direct barrel analog in the codebase. Pattern: simple star re-exports.

**Barrel pattern** — `drizzle.config.ts` schema path points here:
```typescript
// drizzle.config.ts schema path: './src/db/schema/index.ts' (D-02)
// Import from '@/db/schema' in Phase 33+ query functions.
export * from './orders';
export * from './events';
export * from './imports';
export * from './users';
```

---

### `src/db/seed-data.json` (fixture, batch)

**Analog:** `src/services/millProduction.ts` — the 33-order mock array is the data source.

**Field mapping** from `millProduction.ts` camelCase to JSON snake_case DB columns:

| Mock field (camelCase) | JSON field (snake_case) | Notes |
|---|---|---|
| `id` (string "1"–"33") | omitted | DB generates uuid |
| `orderNumber` | `order_number` | e.g. `"ORD-255154"` |
| `customer` | `customer` | verbatim |
| `product` | `product` | verbatim |
| `weightLbs` (number) | `weight_lbs` | stored as string `"6000"` for numeric column |
| `deliveryTime` | `delivery_time` | e.g. `"6:30 AM"` |
| `state` | `state` | enum value e.g. `"Completed"` |
| `millLine` | `mill_line` | enum value e.g. `"Premix"` |
| `textureType` (optional) | `texture_type` | nullable; `null` if absent |
| `lineCode` (optional) | `line_code` | nullable; `null` if absent |
| _(added)_ | `created_by` | hardcoded `"system-seed"` (D-19) |
| _(added)_ | `version` | hardcoded `1` (D-11) |

**Expected shape of each JSON record:**
```json
{
  "order_number": "ORD-255154",
  "customer": "Chick Magnet Farms",
  "product": "BROILER BRD 16% OS",
  "weight_lbs": "6000",
  "delivery_time": "6:30 AM",
  "state": "Completed",
  "mill_line": "Premix",
  "texture_type": "MASH",
  "line_code": "33161",
  "created_by": "system-seed",
  "version": 1
}
```

**All 33 orders confirmed** in `src/services/millProduction.ts`: 11 Premix (5 Completed, 3 Pending, 2 Mixing, 1 Blocked), 11 Excel (5 Completed, 3 Pending, 2 Mixing, 1 Blocked), 11 CGM (5 Completed, 3 Pending, 2 Mixing, 1 Blocked).

---

### `src/db/seed.ts` (utility/script, batch)

**Analog:** `drizzle.config.ts` — exact dotenv + `__dirname` + env guard pattern to copy.

**Dotenv loading pattern** from `drizzle.config.ts` lines 1-15:
```typescript
import { config } from 'dotenv';
import path from 'path';

// drizzle.config.ts is at repo root → path: path.resolve(__dirname, '.env.local')
// seed.ts is at src/db/ → two dirs deep → path: path.resolve(__dirname, '../../.env.local')
config({ path: path.resolve(__dirname, '../../.env.local') });

if (!process.env.DATABASE_URL_UNPOOLED) {
  throw new Error(
    'DATABASE_URL_UNPOOLED is not set. Use the Neon DIRECT (non-pooler) URL — ' +
    'PgBouncer transaction mode is incompatible with migration SET commands. ' +
    'See docs/clerk-setup.md or .env.example for the expected shape.'
  );
}
```

**DB client pattern** from `src/db/index.ts` lines 26-27 (adapted for seed — same driver, different env var):
```typescript
// seed.ts uses UNPOOLED (same as drizzle.config.ts), not DATABASE_URL (pooled)
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

const client = neon(process.env.DATABASE_URL_UNPOOLED!);
const db = drizzle({ client });
```

**TRUNCATE + INSERT pattern** (D-17 idempotency):
```typescript
import { sql } from 'drizzle-orm';
import { productionOrders } from './schema/index';
import seedData from './seed-data.json';

async function seed() {
  // D-17: TRUNCATE with CASCADE — never includes users table
  await db.execute(
    sql`TRUNCATE production_orders, order_events, import_batches RESTART IDENTITY CASCADE`
  );

  await db.insert(productionOrders).values(seedData as any);
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
```

**Key notes:**
- `import 'server-only'` is NOT used here — this is a CLI script, not a Next.js module
- `__dirname` is available because `package.json` has no `"type": "module"` (CJS default, confirmed)
- `tsconfig.json` has `"resolveJsonModule": true` (confirmed) — `import seedData from './seed-data.json'` compiles cleanly

---

### `scripts/export-seed.ts` (utility/script, transform)

**Analog:** `drizzle.config.ts` dotenv pattern (for Node CLI discipline); `src/services/millProduction.ts` (data source).

**Key difference from seed.ts:** No DB connection — pure data transformation. No dotenv needed.

**Import pattern** — needs `mockOrders` export added to `src/services/millProduction.ts`:
```typescript
import { writeFileSync } from 'fs';
import path from 'path';
// After D-04 export is added to millProduction.ts:
import { mockOrders } from '../src/services/millProduction';
```

**Transform pattern** (camelCase → snake_case, per field mapping above):
```typescript
const seedRows = mockOrders.map((o) => ({
  order_number: o.orderNumber,
  customer: o.customer,
  product: o.product,
  weight_lbs: String(o.weightLbs),   // numeric column expects string in Drizzle insert
  delivery_time: o.deliveryTime,
  state: o.state,
  mill_line: o.millLine,
  texture_type: o.textureType ?? null,
  line_code: o.lineCode ?? null,
  created_by: 'system-seed',
  version: 1,
}));

const outputPath = path.resolve(__dirname, '../src/db/seed-data.json');
writeFileSync(outputPath, JSON.stringify(seedRows, null, 2));
console.log(`Wrote ${seedRows.length} rows to ${outputPath}`);
```

---

### `drizzle/0000_*.sql` (migration, batch)

**Analog:** No existing migration in the repo (`./drizzle/` does not exist yet — confirmed). This is the first migration; it is generated by `drizzle-kit generate`, not hand-authored.

**Expected SQL structure** (for reviewer checklist):
1. `CREATE TYPE "public"."production_state" AS ENUM('Pending', 'Mixing', 'Completed', 'Blocked');`
2. `CREATE TYPE "public"."mill_line" AS ENUM('Premix', 'Excel', 'CGM');`
3. `CREATE TABLE "production_orders" (...)`
4. `CREATE TABLE "order_events" (... REFERENCES "production_orders"("id") ON DELETE CASCADE ...)`
5. `CREATE TABLE "import_batches" (...)`
6. `CREATE TABLE "users" (...)`
7. `CREATE INDEX "idx_orders_state" ON "production_orders" ...`
8. `CREATE INDEX "idx_orders_mill_line" ON "production_orders" ...`
9. `CREATE UNIQUE INDEX "idx_orders_order_number" ON "production_orders" ...`
10. `CREATE INDEX "idx_events_order_id_changed_at_desc" ON "order_events" ...`

Verify: `DEFAULT gen_random_uuid()` appears (not `uuid_generate_v4()`). No `CREATE EXTENSION` line. `DEFAULT 1` on `version` column.

---

### `src/db/schema/__tests__/orders.test.ts` (test, request-response)

**Analog:** `src/db/__tests__/index.test.ts` — exact pattern: source-string contract tests using `fs.readFile` + `toContain`, combined with import/export assertions.

**Test structure from `src/db/__tests__/index.test.ts` lines 1-52:**
```typescript
import { promises as fs } from 'fs';
import path from 'path';

describe("src/db/index.ts source-string contract ...", () => {
  let content: string;
  let lines: string[];

  beforeAll(async () => {
    const filePath = path.resolve(__dirname, "..", "index.ts");
    content = await fs.readFile(filePath, "utf-8");
    lines = content.split("\n");
  });

  it("exports the Drizzle `db` singleton", () => {
    expect(content).toContain("export const db");
  });
  // ...
});
```

**Adapted for schema export tests:**
```typescript
// src/db/schema/__tests__/orders.test.ts
import { productionOrders, productionStateEnum, millLineEnum } from '../orders';
import type { ProductionOrder, NewProductionOrder } from '../orders';

describe('src/db/schema/orders.ts exports', () => {
  it('exports productionOrders pgTable', () => {
    expect(productionOrders).toBeDefined();
  });
  it('productionStateEnum has correct values', () => {
    expect(productionStateEnum.enumValues).toEqual(['Pending', 'Mixing', 'Completed', 'Blocked']);
  });
  it('millLineEnum has correct values', () => {
    expect(millLineEnum.enumValues).toEqual(['Premix', 'Excel', 'CGM']);
  });
});
```

---

### `src/db/schema/__tests__/events.test.ts`, `imports.test.ts`, `users.test.ts` (tests)

**Analog:** Same as `orders.test.ts` above — direct import + `toBeDefined()` export assertions.

**Pattern per file:**
```typescript
// events.test.ts
import { orderEvents } from '../events';
it('exports orderEvents pgTable', () => { expect(orderEvents).toBeDefined(); });
it('orderEvents has orderId column', () => {
  expect(orderEvents.orderId).toBeDefined();
});

// imports.test.ts
import { importBatches } from '../imports';
it('exports importBatches pgTable', () => { expect(importBatches).toBeDefined(); });

// users.test.ts
import { users } from '../users';
it('exports users pgTable', () => { expect(users).toBeDefined(); });
```

---

### `src/db/__tests__/seed-data.test.ts` (test, batch)

**Analog:** `src/services/bins.test.ts` — array-shape assertions (`toHaveLength`, per-item property checks with `toHaveProperty`).

**Test structure from `src/services/bins.test.ts` lines 1-49:**
```typescript
import { getBins } from "./bins";

describe("bins service", () => {
  it("returns an array with length > 0", async () => {
    const bins = await getBins();
    expect(bins.length).toBeGreaterThan(0);
  });
  it("each bin has id property", async () => {
    const bins = await getBins();
    bins.forEach((bin) => {
      expect(bin).toHaveProperty("id");
    });
  });
});
```

**Adapted for seed-data.json:**
```typescript
// src/db/__tests__/seed-data.test.ts
import seedData from '../seed-data.json';

const REQUIRED_FIELDS = [
  'order_number', 'customer', 'product', 'weight_lbs',
  'delivery_time', 'state', 'mill_line', 'created_by',
];

describe('src/db/seed-data.json shape', () => {
  it('has exactly 33 rows', () => {
    expect(seedData).toHaveLength(33);
  });
  it('every row has required NOT NULL fields', () => {
    for (const row of seedData) {
      for (const field of REQUIRED_FIELDS) {
        expect(row).toHaveProperty(field);
        expect((row as Record<string, unknown>)[field]).not.toBeNull();
      }
    }
  });
  it('all created_by values are system-seed', () => {
    for (const row of seedData) {
      expect((row as Record<string, unknown>).created_by).toBe('system-seed');
    }
  });
  it('state values are valid enum members', () => {
    const valid = ['Pending', 'Mixing', 'Completed', 'Blocked'];
    for (const row of seedData) {
      expect(valid).toContain((row as Record<string, unknown>).state);
    }
  });
  it('mill_line values are valid enum members', () => {
    const valid = ['Premix', 'Excel', 'CGM'];
    for (const row of seedData) {
      expect(valid).toContain((row as Record<string, unknown>).mill_line);
    }
  });
});
```

---

### `src/db/__tests__/migration.test.ts` (test, request-response)

**Analog:** `src/db/__tests__/index.test.ts` — `fs.readFile` + source-string assertions. Adapted to use `fs.existsSync` glob pattern.

**Pattern:**
```typescript
// src/db/__tests__/migration.test.ts
import { readdirSync } from 'fs';
import path from 'path';

describe('drizzle migration file contract', () => {
  const drizzleDir = path.resolve(__dirname, '../../../drizzle');

  it('drizzle/ directory exists after generate', () => {
    expect(() => readdirSync(drizzleDir)).not.toThrow();
  });
  it('contains at least one .sql migration file', () => {
    const files = readdirSync(drizzleDir);
    const sqlFiles = files.filter(f => f.endsWith('.sql'));
    expect(sqlFiles.length).toBeGreaterThan(0);
  });
  it('0000 migration file exists', () => {
    const files = readdirSync(drizzleDir);
    const has0000 = files.some(f => f.startsWith('0000_'));
    expect(has0000).toBe(true);
  });
});
```

Note: This test will fail until `drizzle-kit generate` is run. Run it as a post-generate verification step.

---

### `drizzle.config.ts` (config, modify)

**Analog:** Self — one-line edit only.

**Current line 18** (`src/db/index.ts` for reference of overall config structure):
```typescript
schema: './src/db/schema.ts',     // D-09: single file in Phase 31
```

**After edit (D-02):**
```typescript
schema: './src/db/schema/index.ts', // D-02: barrel path for Phase 32 split
```

No other changes to `drizzle.config.ts`. The dotenv pattern (lines 1-15), `out: './drizzle'`, `dialect: 'postgresql'`, and `DATABASE_URL_UNPOOLED` usage are unchanged.

---

### `src/types/millProduction.ts` (model/type, rewrite)

**Analog:** Self (current content fully read). Current file is 17 lines defining `MillLine`, `ProductionState`, and `ProductionOrder` interface.

**Current state** (lines 1-16):
```typescript
export type MillLine = "Premix" | "Excel" | "CGM";
export type ProductionState = "Completed" | "Mixing" | "Blocked" | "Pending";
export interface ProductionOrder { id: string; orderNumber: string; ... }
```

**After D-04 rewrite** — `MillLine` and `ProductionState` become re-exports from the schema barrel; `ProductionOrder` renamed to `DemoOrder`:
```typescript
// MillLine and ProductionState are now canonical from src/db/schema/orders.ts (D-04).
// Re-exported here for backward compat during transition.
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

---

### `src/services/millProduction.ts` (service, modify)

**Analog:** Self. Three changes:
1. Import rename: `ProductionOrder` → `DemoOrder`
2. All type annotations: `ProductionOrder[]` → `DemoOrder[]`
3. Add named export: `export const mockOrders` (needed by `scripts/export-seed.ts`)

**Current import line 1:**
```typescript
import { ProductionOrder, MillLine } from "@/types/millProduction";
```

**After D-04:**
```typescript
import { DemoOrder, MillLine } from "@/types/millProduction";
```

**Current mockOrders declaration (line 3):**
```typescript
const mockOrders: ProductionOrder[] = [
```

**After D-04 + export for export-seed.ts:**
```typescript
export const mockOrders: DemoOrder[] = [
```

**Current function signatures (lines 423, 428):**
```typescript
export async function getProductionOrders(): Promise<ProductionOrder[]>
export async function getOrdersByMillLine(millLine: MillLine): Promise<ProductionOrder[]>
```

**After D-04:**
```typescript
export async function getProductionOrders(): Promise<DemoOrder[]>
export async function getOrdersByMillLine(millLine: MillLine): Promise<DemoOrder[]>
```

---

### `src/app/demo/mill-production/page.tsx` (page, no change needed)

**Analog:** Self. The page does NOT directly import `ProductionOrder` — it imports `MillProductionUI` and `getProductionOrders`. No change required to this file.

**Confirmed:** Reading `src/app/demo/mill-production/page.tsx` — zero references to `ProductionOrder`, `MillLine`, or `ProductionState`. The page is insulated by the service and UI component layers.

**However:** `src/components/MillProductionUI.tsx` and its test DO import `ProductionOrder` directly from `@/types/millProduction`. These files must be updated as part of D-04. The `ProductionOrder` type exported from `@/types/millProduction` will become `DemoOrder` — `MillProductionUI.tsx` must rename its prop type.

---

### `package.json` (config, additive)

**Analog:** Self. Two additions only.

**Add to `scripts`:**
```json
"db:generate": "drizzle-kit generate",
"db:migrate": "drizzle-kit migrate",
"db:seed": "tsx src/db/seed.ts"
```

**Add to `devDependencies`:**
```json
"tsx": "4.21.0"
```

**Current devDependencies confirmed:** `tsx` is absent; `ts-node` is present at `^10.9.2`. The seed script uses `tsx` (faster, no tsconfig transformation needed), not `ts-node`.

---

### `src/db/schema.ts` (delete)

**Current content:** `export {};` placeholder (8 lines, confirmed by reading the file). Safe to delete once `src/db/schema/index.ts` is in place and `drizzle.config.ts` schema path is updated.

---

## Shared Patterns

### Dotenv + `__dirname` pattern
**Source:** `drizzle.config.ts` lines 1-15
**Apply to:** `src/db/seed.ts` (mirror exactly, adjusting path depth from `'.'env.local'` to `'../../.env.local'`)
```typescript
import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve(__dirname, '.env.local') }); // drizzle.config.ts (repo root)
// seed.ts uses: path.resolve(__dirname, '../../.env.local') (src/db/)

if (!process.env.DATABASE_URL_UNPOOLED) {
  throw new Error(
    'DATABASE_URL_UNPOOLED is not set. Use the Neon DIRECT (non-pooler) URL — ...'
  );
}
```

### `DATABASE_URL_UNPOOLED` vs `DATABASE_URL` routing
**Source:** `src/db/index.ts` comment lines 12-17 + `drizzle.config.ts` line 20
**Apply to:** `src/db/seed.ts` (uses `DATABASE_URL_UNPOOLED`), all schema files (no DB import — pure builders)
- Application queries (`src/db/index.ts`): `DATABASE_URL` (pooled, `-pooler.neon.tech`)
- Migrations + seed: `DATABASE_URL_UNPOOLED` (direct)
- Schema files: no connection at all — import only from `drizzle-orm/pg-core`

### `import 'server-only'` scope
**Source:** `src/db/index.ts` line 1
**Apply to:** Schema files do NOT need this. `src/db/seed.ts` does NOT need this (CLI script). The directive is inherited transitively by any Next.js module that imports `src/db/index.ts`.

### Co-located `$inferSelect` / `$inferInsert` types
**Source:** RESEARCH.md skeletons (D-03 decision)
**Apply to:** All four schema files (`orders.ts`, `events.ts`, `imports.ts`, `users.ts`)
```typescript
export type <Name> = typeof <table>.$inferSelect;
export type New<Name> = typeof <table>.$inferInsert;
```

### Test: `fs.readFile` + source-string assertion
**Source:** `src/db/__tests__/index.test.ts` lines 16-52
**Apply to:** `src/db/__tests__/migration.test.ts` (file-existence assertion pattern)
```typescript
import { promises as fs } from 'fs';
import path from 'path';
// ... beforeAll reads file, tests use toContain()
```

### Test: `describe` + `it` with `toHaveProperty` / `toContain`
**Source:** `src/services/bins.test.ts` lines 1-80
**Apply to:** `src/db/__tests__/seed-data.test.ts`

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `drizzle/0000_*.sql` | migration | batch | First migration in the repo — generated by drizzle-kit, not hand-authored. No prior migration file exists to reference. |

---

## D-04 Consumer Scope (additional files needing `ProductionOrder` → `DemoOrder` rename)

Grep confirms these additional files reference `ProductionOrder` from `@/types/millProduction`:

| File | Import | Required change |
|------|--------|-----------------|
| `src/components/MillProductionUI.tsx` | `import { ProductionOrder, ProductionState, MillLine } from "@/types/millProduction"` | Rename prop type `ProductionOrder` → `DemoOrder` |
| `src/components/__tests__/MillProductionUI.test.tsx` | `import { ProductionOrder } from "@/types/millProduction"` | Rename `mockOrders: ProductionOrder[]` → `mockOrders: DemoOrder[]` |
| `src/app/demo/mill-production/__tests__/page.test.tsx` | `import { ProductionOrder } from "@/types/millProduction"` | Rename `mockOrders: ProductionOrder[]` → `mockOrders: DemoOrder[]` |

These three files are NOT in the original phase file list but must be updated as part of D-04 or the TypeScript build will fail. The planner should include them as subtasks of the D-04 rename wave.

---

## Metadata

**Analog search scope:** `src/db/`, `src/services/`, `src/types/`, `src/components/`, `drizzle.config.ts`, `package.json`, `tsconfig.json`
**Files read:** 15 source files + 3 test files
**Pattern extraction date:** 2026-05-13
