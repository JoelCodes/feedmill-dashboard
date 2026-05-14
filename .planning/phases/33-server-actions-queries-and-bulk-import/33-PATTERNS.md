# Phase 33: Server Actions, Queries, and Bulk Import - Pattern Map

**Mapped:** 2026-05-13
**Files analyzed:** 12 (9 create, 3 modify)
**Analogs found:** 11 / 12

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/db/queries/orders.ts` | query | request-response | `src/db/index.ts` (server-only discipline) + RESEARCH.md `unstable_cache` shape | research-match |
| `src/db/queries/events.ts` | query | request-response | `src/db/queries/orders.ts` (sibling, same phase) | sibling-match |
| `src/actions/transitions.ts` | action | request-response | `src/lib/auth.ts` (requireRole pattern) + `src/db/seed.ts` (db.insert/db.update shape) | cousin-match |
| `src/actions/import.ts` | action | file-I/O | `src/lib/auth.ts` (requireRole) + `src/db/seed.ts` (per-row insert loop) | cousin-match |
| `src/actions/import-schema.ts` (optional) | schema/validator | transform | `src/db/schema/orders.ts` (co-located type pattern) | role-match |
| `src/actions/__tests__/transitions.test.ts` | test | request-response | `src/lib/auth.test.ts` (jest.mock + sentinel-throw pattern) | exact |
| `src/actions/__tests__/import.test.ts` | test | request-response | `src/lib/auth.test.ts` + `src/db/__tests__/seed-data.test.ts` | exact |
| `src/db/queries/__tests__/orders.test.ts` | test | request-response | `src/db/__tests__/index.test.ts` + `src/services/bins.test.ts` | exact |
| `src/db/queries/__tests__/events.test.ts` | test | request-response | `src/db/__tests__/index.test.ts` | exact |
| `next.config.ts` | config | build-time | self (additive — current file is 6 lines) | exact |
| `package.json` | dep-manifest | build-time | self (additive) | exact |
| `src/db/schema/orders.ts` | schema/model | transform | self (optional `relations()` addition — planner's call) | exact |

---

## Pattern Assignments

### `src/db/queries/orders.ts` (query, request-response)

**Analog:** No existing query layer file (Phase 32 skipped `src/db/queries/` entirely — the directory does not exist). Nearest cousin for the `server-only` + `db.*` discipline is `src/db/index.ts`. The `unstable_cache` shape comes from RESEARCH.md §6. The Drizzle select idiom comes from `src/db/seed.ts` (same driver/client, same `db` import).

**NOTE FOR PLANNER:** This is a new pattern in the codebase. Server actions are brand new; there is no prior route handler or service layer using Drizzle to copy from. The closest cousin for the Drizzle query shape is `src/db/seed.ts` which uses `db.insert(productionOrders).values(rows)` — the select counterpart mirrors the same `db` import and client.

**Imports pattern** — `server-only` instead of `'use server'`; `unstable_cache` from `next/cache`; `db` from `@/db`; schema tables from `@/db/schema`:
```typescript
import 'server-only';
import { unstable_cache } from 'next/cache';
import { db } from '@/db';
import { productionOrders } from '@/db/schema/orders';
import { and, eq, inArray } from 'drizzle-orm';
import type { ProductionState, MillLine } from '@/db/schema/orders';
```

**`unstable_cache` wrapper pattern** (RESEARCH.md §6, verified against Next.js 16.1.6):
```typescript
// Tag string 'production-orders' MUST match revalidateTag() in every action.
// No `revalidate` integer — rely on tag-only invalidation (no TTL polling needed).
export const getProductionOrders = unstable_cache(
  async (filters?: { millLine?: MillLine; states?: ProductionState[] }) => {
    const conditions = [];
    if (filters?.millLine) conditions.push(eq(productionOrders.millLine, filters.millLine));
    if (filters?.states?.length) conditions.push(inArray(productionOrders.state, filters.states));
    return db
      .select()
      .from(productionOrders)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(productionOrders.deliveryTime);
  },
  ['production-orders'],           // cache key
  { tags: ['production-orders'] }  // invalidated by revalidateTag('production-orders')
);
```

**`getOrderById` pattern** (simple single-row select; no cache — called from action state guards):
```typescript
export async function getOrderById(id: string) {
  const [order] = await db
    .select()
    .from(productionOrders)
    .where(eq(productionOrders.id, id));
  return order ?? null;
}
```

**Key notes:**
- No `'use server'` directive — query files are server-only by transitive import of `src/db/index.ts` which has `import 'server-only'` on line 1 (see `src/db/index.ts` line 1). NO `requireRole` on query functions (CONTEXT.md specifics: "Read queries do NOT call requireRole — page-level RSC guard handles it").
- `db` import from `@/db` brings the neon-http singleton (see `src/db/index.ts` lines 26-27: `const sql = neon(process.env.DATABASE_URL); export const db = drizzle({ client: sql })`).

---

### `src/db/queries/events.ts` (query, request-response)

**Analog:** `src/db/queries/orders.ts` (sibling, same phase). Use plain `db.select()` without `relations()` — see RESEARCH.md §2 recommendation and Open Question 1: plain SELECT works without modifying `src/db/index.ts`.

**Imports pattern** — mirrors orders.ts sibling; adds `desc` for ORDER BY:
```typescript
import 'server-only';
import { unstable_cache } from 'next/cache';
import { db } from '@/db';
import { orderEvents } from '@/db/schema/events';
import { eq, desc } from 'drizzle-orm';
```

**Core query pattern** (plain SELECT, no `db.query` relational API — avoids `schema` registration in `src/db/index.ts`):
```typescript
export const getOrderEvents = unstable_cache(
  async (orderId: string) => {
    return db
      .select()
      .from(orderEvents)
      .where(eq(orderEvents.orderId, orderId))
      .orderBy(desc(orderEvents.changedAt));
  },
  ['production-orders'],
  { tags: ['production-orders'] }
);
```

**Key column reference** from `src/db/schema/events.ts` lines 9-23:
- `orderEvents.orderId` — uuid FK to `productionOrders.id`
- `orderEvents.fromState` — nullable (initial import event has no from-state)
- `orderEvents.toState` — NOT NULL
- `orderEvents.changedBy` — text (Clerk user ID)
- `orderEvents.changedAt` — timestamp with timezone (indexed DESC, see `idx_events_order_id_changed_at_desc`)

---

### `src/actions/transitions.ts` (action, request-response)

**Analog:** Server actions are brand-new to this codebase. No `src/actions/` directory exists yet. The nearest cousins are:
1. `src/lib/auth.ts` — the `requireRole('mill_operator')` call that EVERY action must make as its first line after `'use server'`
2. `src/db/seed.ts` — the `db.insert(...)` / `db.execute(...)` pattern using the same neon-http client
3. `src/db/schema/orders.ts` + `src/db/schema/events.ts` — the table and type references

**`'use server'` directive** — must be line 1 (before any imports):
```typescript
'use server';
import { db } from '@/db';
import { productionOrders } from '@/db/schema/orders';
import { orderEvents } from '@/db/schema/events';
import { eq, and } from 'drizzle-orm';
import { revalidateTag } from 'next/cache';
import { requireRole } from '@/lib/auth';
import { auth } from '@clerk/nextjs/server';
```

**Exported return type** (D-01, D-02 — must be exported so Phase 34 components can import it):
```typescript
export type TransitionResult =
  | { ok: true }
  | { ok: false; code: 'conflict' | 'unauthorized' | 'validation' | 'not_found' | 'server'; message: string };
```

**`requireRole` pattern** from `src/lib/auth.ts` lines 41-49 — note: `requireRole` calls `redirect()` internally which throws `NEXT_REDIRECT`; callers do NOT need to `return` after it:
```typescript
// src/lib/auth.ts lines 41-49 — the canonical guard:
export async function requireRole(role: Role): Promise<void> {
  const { userId, sessionClaims } = await auth();
  if (!userId) { redirect('/sign-in'); }
  if (!sessionClaims?.metadata?.roles?.includes(role)) { redirect('/'); }
}
```

**`auth()` for userId** from `@clerk/nextjs/server` — same import as `src/lib/auth.ts` line 13. After `requireRole` resolves, call `auth()` again to get `userId` for the audit trail:
```typescript
await requireRole('mill_operator');       // line 1 after 'use server'
const { userId } = await auth();          // safe: requireRole already verified session
```

**Optimistic-concurrency UPDATE pattern** (RESEARCH.md §1, verified from `drizzle-orm/neon-http/session.d.ts`):
```typescript
// CRITICAL: use .returning() NOT .rowsAffected — neon-http has no rowsAffected property
const updated = await db
  .update(productionOrders)
  .set({ state: 'Mixing', version: version + 1 })
  // updatedAt fires automatically via $onUpdate(() => new Date()) — do NOT include it in .set()
  // (src/db/schema/orders.ts line 48: .$onUpdate(() => new Date()))
  .where(and(eq(productionOrders.id, orderId), eq(productionOrders.version, version)))
  .returning({ id: productionOrders.id });

if (updated.length === 0) {
  // Locked message text (D-02 / ROADMAP SC#2):
  return { ok: false, code: 'conflict' as const, message: 'Order was modified by another user. Please refresh.' };
}
```

**State guard pattern** (read current order before UPDATE; state enum values from `src/db/schema/orders.ts` lines 16-21):
```typescript
const [order] = await db
  .select({ state: productionOrders.state, version: productionOrders.version })
  .from(productionOrders)
  .where(eq(productionOrders.id, orderId));

if (!order) return { ok: false, code: 'not_found' as const, message: 'Order not found.' };
if (order.state !== 'Pending') {
  return { ok: false, code: 'validation' as const, message: `Cannot transition from ${order.state} to Mixing.` };
}
```

**Audit trail INSERT pattern** — `orderEvents` columns from `src/db/schema/events.ts` lines 9-23:
```typescript
await db.insert(orderEvents).values({
  orderId,
  fromState: 'Pending',   // nullable column — matches fromState?: productionStateEnum
  toState: 'Mixing',
  changedBy: userId!,
  note: null,             // nullable column
  // changedAt defaults to now() via .defaultNow() in schema
});
```

**`revalidateTag` pattern** (MANDATORY — STATE.md mutation invariant; call BEFORE returning):
```typescript
revalidateTag('production-orders');  // tag string must match unstable_cache tags in queries/orders.ts
return { ok: true };
```

**`blockOrder` specifics** — D-04: `reason: string` is REQUIRED; D-15: valid from-states are `['Pending', 'Mixing']` only:
```typescript
export async function blockOrder(
  orderId: string,
  version: number,
  reason: string  // REQUIRED — TypeScript-level enforcement of TRANS-03
): Promise<TransitionResult> {
  await requireRole('mill_operator');
  // state guard: if (!['Pending', 'Mixing'].includes(order.state)) → validation error
}
```

**`resumeFromBlocked` specifics** — D-04: `toState: 'Mixing' | 'Pending'` parameter:
```typescript
export async function resumeFromBlocked(
  orderId: string,
  version: number,
  toState: 'Mixing' | 'Pending'  // constrained union — not arbitrary ProductionState
): Promise<TransitionResult>
```

**No transactions warning** (from `src/db/seed.ts` line 38-44 + RESEARCH.md §1): The neon-http driver does NOT support `db.transaction()` — each `db.update()` and `db.insert()` is an independent HTTP call that auto-commits. The UPDATE + INSERT(events) pair is two sequential HTTP calls. Accept residual risk; document in code comment.

---

### `src/actions/import.ts` (action, file-I/O)

**Analog:** Brand-new pattern in the codebase. Nearest cousins:
1. `src/lib/auth.ts` — `requireRole` call pattern
2. `src/db/seed.ts` lines 76-155 — per-row insert loop with error collection, `db.insert()` pattern
3. `src/db/schema/imports.ts` — `importBatches` table reference for the commit step

**`'use server'` directive** — must be line 1:
```typescript
'use server';
import readXlsxFile from 'read-excel-file/node';  // /node subpath — NOT the root export
import type { Schema } from 'read-excel-file/node';
import { z } from 'zod';
import { db } from '@/db';
import { productionOrders } from '@/db/schema/orders';
import { orderEvents } from '@/db/schema/events';
import { importBatches } from '@/db/schema/imports';
import { eq } from 'drizzle-orm';
import { revalidateTag } from 'next/cache';
import { requireRole } from '@/lib/auth';
import { auth } from '@clerk/nextjs/server';
```

**`MAX_IMPORT_BYTES` constant** (D-09 — exported for client-side guard in Phase 34 forms):
```typescript
export const MAX_IMPORT_BYTES = 2 * 1024 * 1024; // 2MB
```

**`read-excel-file` schema definition** (RESEARCH.md §3 — `/node` subpath only in server actions):
```typescript
const xlsxSchema: Schema = {
  'Document Number': { prop: 'orderNumber', type: String, required: true },
  'Customer':        { prop: 'customer',    type: String, required: true },
  'Product':         { prop: 'product',     type: String, required: true },
  'Weight':          { prop: 'weightLbs',   type: Number, required: true },
  'Early Delivery Date': { prop: 'deliveryDate', type: Date }, // read-excel-file returns JS Date
  'Formula Type':    { prop: 'formulaType', type: String, required: true },
  'Texture Type':    { prop: 'textureType', type: String }, // nullable — D-15
  'Line Code':       { prop: 'lineCode',    type: String }, // nullable — D-15
  // Mill Line NOT in Book1.xlsx — defaults to 'Premix' in action logic (D-16)
};
```

**File → Buffer conversion pattern** (RESEARCH.md §3 — `File` is a Web API object; `read-excel-file/node` needs `Buffer`):
```typescript
export async function previewImportAction(formData: FormData) {
  await requireRole('mill_operator');
  const file = formData.get('file') as File | null;
  if (!file) return { ok: false, code: 'validation' as const, message: 'No file provided.' };
  if (file.size > MAX_IMPORT_BYTES) {
    return { ok: false, code: 'validation' as const, message: 'File exceeds 2MB limit.' };
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const { rows, errors } = await readXlsxFile(buffer, { schema: xlsxSchema });
  // ... Zod safeParse each row, intra-file duplicate detection, DB duplicate query, assemble preview
}
```

**Date → ISO string conversion** (RESEARCH.md §3 Assumption A1):
```typescript
// read-excel-file returns JS Date for `type: Date` columns
const deliveryTimeStr = row.deliveryDate instanceof Date
  ? row.deliveryDate.toISOString().split('T')[0]  // '2025-08-15' NOT '2025-08-15T00:00:00.000Z'
  : null;
```

**Per-row insert loop pattern** (D-08; mirrors `src/db/seed.ts` lines 128-142 but with error collection):
```typescript
// commitImportAction per-row loop — partial-import semantics (IMPORT-04)
// No transaction — neon-http does not support db.transaction() (same constraint as seed.ts)
const rowResults: Array<{ rowIndex: number; ok: boolean; error?: string }> = [];
for (const [i, validRow] of rowsToCommit.entries()) {
  try {
    await db.insert(productionOrders).values({
      ...validRow,
      weightLbs: validRow.weightLbs.toString(), // CR-01: number → string for numeric column
      millLine: 'Premix' as const,              // D-16: Book1.xlsx has no Mill Line column
      state: 'Pending' as const,
      version: 1,
      createdBy: userId!,
    });
    rowResults.push({ rowIndex: i, ok: true });
  } catch (err) {
    rowResults.push({ rowIndex: i, ok: false, error: String(err) });
  }
}
```

**Overwrite (UPDATE) pattern for duplicates** (D-10 — UPDATE preserves `id`, bumps `version`; D-11):
```typescript
// Overwrite = db.update() NOT db.insert() — preserves order id + event history
await db.update(productionOrders)
  .set({
    customer: validRow.customer,
    product: validRow.product,
    weightLbs: validRow.weightLbs.toString(),
    deliveryTime: validRow.deliveryTime,
    formulaType: validRow.formulaType,
    // state is NOT overwritten (D-13)
    version: sql`version + 1`,  // bump version for concurrent-transition conflict detection
    // updatedAt fires via $onUpdate() — do NOT set it manually
  })
  .where(eq(productionOrders.orderNumber, validRow.orderNumber));
```

**Overwrite event row pattern** (D-11 — `[OVERWRITE]` prefix in note is canonical):
```typescript
await db.insert(orderEvents).values({
  orderId: existingOrder.id,
  fromState: existingOrder.state,  // from_state === to_state for overwrite events
  toState: existingOrder.state,
  changedBy: userId!,
  note: `[OVERWRITE] batch_id=${batchId}`,  // [OVERWRITE] prefix is canonical marker (D-11)
});
```

**`import_batches` insert** (D-07 — written ONLY after successful commit, not on preview):
```typescript
// importBatches columns from src/db/schema/imports.ts lines 4-10
const [batch] = await db.insert(importBatches).values({
  fileName: file.name,
  rowCount: committedCount,    // committed rows only (not previewed rows) per D-07
  importedBy: userId!,
  // importedAt defaults to now() via .defaultNow() in schema
}).returning({ id: importBatches.id });
```

**`revalidateTag` call** (MANDATORY — same as transitions.ts; BEFORE return):
```typescript
revalidateTag('production-orders');
return { ok: true, results: rowResults };
```

---

### `src/actions/import-schema.ts` or co-located in `import.ts` (schema/validator, transform)

**Analog:** `src/db/schema/orders.ts` co-located type pattern (D-03); Zod is already installed at v4.3.6 (verified from `node_modules/zod/package.json`; default `import { z } from 'zod'` gives v4 classic API).

**Zod schema pattern** (RESEARCH.md §4):
```typescript
import { z } from 'zod';

// CR-01 bridge: read-excel-file returns number for `type: Number` cells.
// Zod validates as number (positive); insert layer converts to string via .toString().
export const productionOrderImportSchema = z.object({
  orderNumber:  z.string().min(1, 'Document Number is required'),
  customer:     z.string().min(1, 'Customer is required'),
  product:      z.string().min(1, 'Product is required'),
  weightLbs:    z.number().positive('Weight must be positive'),
  deliveryTime: z.string().min(1, 'Early Delivery Date is required'),  // ISO date string after Date→string
  formulaType:  z.string().min(1, 'Formula Type is required'),
  // D-15: nullable columns — use .nullish() (accepts null | undefined) not .nullable()
  // because read-excel-file returns undefined for absent cells (RESEARCH.md §4 Pitfall 8)
  textureType:  z.string().nullish(),
  lineCode:     z.string().nullish(),
  // millLine is NOT from XLSX — default 'Premix' applied at insert time (D-16)
});

export type ProductionOrderImportRow = z.infer<typeof productionOrderImportSchema>;
```

---

### `src/actions/__tests__/transitions.test.ts` (test, request-response)

**Analog:** `src/lib/auth.test.ts` — the canonical `jest.mock` pattern with sentinel-throw for `redirect()`. ALL Phase 33 action tests follow this same mock structure.

**Mock setup pattern** from `src/lib/auth.test.ts` lines 1-18 (adapted for action tests):
```typescript
// Mocks MUST be declared before any imports of the module under test.
// jest.mock is hoisted to the top of the file by Jest's transform.

jest.mock('@/db', () => ({
  db: {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockResolvedValue([{ state: 'Pending', id: 'order-1', version: 1 }]),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    returning: jest.fn().mockResolvedValue([{ id: 'order-1' }]),  // non-empty = success
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockResolvedValue([]),
    and: jest.fn(),
  },
}));

jest.mock('@/lib/auth', () => ({
  requireRole: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn().mockResolvedValue({ userId: 'u1' }),
}));

jest.mock('next/cache', () => ({
  revalidateTag: jest.fn(),
}));
```

**Conflict test override** — override `returning` to empty for conflict path:
```typescript
// In the conflict test case, reset the mock to return empty:
(db.update(productionOrders).set({}).where({}).returning as jest.Mock)
  .mockResolvedValueOnce([]);  // empty = conflict
```

**Auth test pattern** from `src/lib/auth.test.ts` lines 24-38 — sentinel-throw for redirect:
```typescript
// src/lib/auth.test.ts lines 9-16 — the exact pattern to copy:
jest.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw Object.assign(new Error('NEXT_REDIRECT'), { url });
  },
}));
// Action tests assert unauthorized path via .rejects.toMatchObject({ url: '/sign-in' })
```

**Available fixture** — `src/test/fixtures/clerkAuth.ts` exports `mockMillOperatorSession()` (lines 204-209) and `clerkAuthMockFactory()` (lines 56-60). Use these in action tests instead of inline mock values:
```typescript
import { mockAuth, clerkAuthMockFactory } from '@/test/fixtures/clerkAuth';
jest.mock('@clerk/nextjs/server', clerkAuthMockFactory);
beforeEach(() => mockAuth.mockReset());
// Then: mockMillOperatorSession() in each test's arrange phase
```

**Locked conflict message test** (ROADMAP SC#2 — exact string):
```typescript
it('returns conflict code with locked message when version is stale', async () => {
  // Override returning to empty (simulate stale version)
  jest.mocked(db.update(productionOrders).set({}).where({}).returning)
    .mockResolvedValueOnce([]);
  const result = await transitionToMixing('order-1', 1);
  expect(result).toEqual({
    ok: false,
    code: 'conflict',
    message: 'Order was modified by another user. Please refresh.',  // LOCKED — D-02
  });
});
```

**`revalidateTag` called-on-success test**:
```typescript
import { revalidateTag } from 'next/cache';
it('calls revalidateTag("production-orders") on success (TRANS-07)', async () => {
  await transitionToMixing('order-1', 1);
  expect(revalidateTag).toHaveBeenCalledWith('production-orders');
});
```

---

### `src/actions/__tests__/import.test.ts` (test, request-response + file-I/O)

**Analog:** `src/lib/auth.test.ts` (mock pattern) + `src/db/__tests__/seed-data.test.ts` (array/shape assertion pattern).

**Zod schema test pattern** (pure unit — no mocks needed for schema tests):
```typescript
import { productionOrderImportSchema } from '../import';  // or '../import-schema'

describe('productionOrderImportSchema', () => {
  it('accepts a valid row', () => {
    const result = productionOrderImportSchema.safeParse({
      orderNumber: 'ORD-001', customer: 'Farm Co', product: 'Feed A',
      weightLbs: 6000, deliveryTime: '2025-08-15', formulaType: 'BRD',
    });
    expect(result.success).toBe(true);
  });
  it('rejects missing required fields', () => {
    const result = productionOrderImportSchema.safeParse({ orderNumber: 'ORD-001' });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some(i => i.path.includes('customer'))).toBe(true);
  });
  it('accepts null textureType and lineCode (D-15)', () => {
    const result = productionOrderImportSchema.safeParse({
      orderNumber: 'ORD-001', customer: 'Farm', product: 'Feed', weightLbs: 1000,
      deliveryTime: '2025-08-15', formulaType: 'LAY', textureType: null, lineCode: null,
    });
    expect(result.success).toBe(true);
  });
  it('accepts undefined textureType and lineCode (nullish — read-excel-file absent cells)', () => {
    const result = productionOrderImportSchema.safeParse({
      orderNumber: 'ORD-001', customer: 'Farm', product: 'Feed', weightLbs: 1000,
      deliveryTime: '2025-08-15', formulaType: 'LAY',
      // textureType and lineCode intentionally absent
    });
    expect(result.success).toBe(true);
  });
  it('rejects weight <= 0', () => {
    const result = productionOrderImportSchema.safeParse({
      orderNumber: 'ORD-001', customer: 'Farm', product: 'Feed', weightLbs: -100,
      deliveryTime: '2025-08-15', formulaType: 'LAY',
    });
    expect(result.success).toBe(false);
  });
});
```

**File size guard test** (pure unit — `MAX_IMPORT_BYTES` is exported constant):
```typescript
import { MAX_IMPORT_BYTES } from '../import';

it('server-side size guard: returns validation error for file > 2MB', async () => {
  // Simulate a File object with size > MAX_IMPORT_BYTES
  const largeFile = { size: MAX_IMPORT_BYTES + 1, name: 'big.xlsx', arrayBuffer: jest.fn() } as unknown as File;
  const formData = new FormData();
  formData.set('file', largeFile);
  const result = await previewImportAction(formData);
  expect(result).toEqual({ ok: false, code: 'validation', message: 'File exceeds 2MB limit.' });
});
```

---

### `src/db/queries/__tests__/orders.test.ts` (test, request-response)

**Analog:** `src/db/__tests__/index.test.ts` (source-string + export assertion pattern) + `src/services/bins.test.ts` (describe/it/expect shape). Since `getProductionOrders` is wrapped in `unstable_cache`, direct invocation in tests may require mocking `next/cache`.

**Mock pattern for `unstable_cache`**:
```typescript
jest.mock('next/cache', () => ({
  unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,  // identity — unwrap cache
  revalidateTag: jest.fn(),
}));

jest.mock('@/db', () => ({
  db: {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockResolvedValue([
      { id: 'order-1', orderNumber: 'ORD-001', state: 'Pending', millLine: 'Premix' },
    ]),
  },
}));
```

**Filter shape tests** (from RESEARCH.md Validation Architecture §Phase Requirements → Test Map):
```typescript
describe('getProductionOrders', () => {
  it('returns an array when called with no filters', async () => {
    const orders = await getProductionOrders();
    expect(Array.isArray(orders)).toBe(true);
  });
  it('accepts millLine filter without error', async () => {
    await expect(getProductionOrders({ millLine: 'Premix' })).resolves.toBeDefined();
  });
  it('accepts states filter without error', async () => {
    await expect(getProductionOrders({ states: ['Pending', 'Mixing'] })).resolves.toBeDefined();
  });
});
```

---

### `src/db/queries/__tests__/events.test.ts` (test, request-response)

**Analog:** `src/db/__tests__/index.test.ts` (pattern mirroring). Simpler than orders tests — single `orderId` parameter, ordering assertion.

**Ordering test pattern**:
```typescript
jest.mock('next/cache', () => ({
  unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
  revalidateTag: jest.fn(),
}));

describe('getOrderEvents', () => {
  it('returns events array for a given orderId', async () => {
    const events = await getOrderEvents('order-1');
    expect(Array.isArray(events)).toBe(true);
  });
});
```

---

### `next.config.ts` (config, modify)

**Analog:** Self. Current file is 6 lines (read above lines 1-7); add `experimental.serverActions.bodySizeLimit`.

**Current state** (`next.config.ts` lines 1-7):
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
```

**After Phase 33 modification** (IMPORT-07; key verified in `node_modules/next/dist/server/config-shared.d.ts` — `ExperimentalConfig.serverActions?.bodySizeLimit` at line 532, NOT a top-level `NextConfig` key):
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;
```

**WARNING:** Do NOT put `serverActions` at the top level of `NextConfig` — TypeScript will not error (loose object type) but the setting has no effect. Must be under `experimental:`. Verified from installed Next.js 16.1.6 type definitions.

---

### `package.json` (dep-manifest, modify)

**Analog:** Self (additive). Current `dependencies` block (lines 19-30) does not include `read-excel-file` or `zod`. `zod` IS present per RESEARCH.md §Standard Stack (installed at 4.3.6). Check current `dependencies`:

**Current state** (lines 19-30): `@clerk/nextjs`, `@neondatabase/serverless`, `class-variance-authority`, `clsx`, `drizzle-orm`, `lucide-react`, `next`, `next-themes`, `react`, `react-dom`, `tailwind-merge`. No `read-excel-file`. No `zod` in dependencies (may be in devDependencies — verify during implementation).

**Addition needed** — add to `dependencies`:
```json
"read-excel-file": "9.0.9",
"zod": "^4.3.6"
```

**Install command** (run as Wave 0 task before writing any import action code):
```bash
npm install read-excel-file
```

---

## Shared Patterns

### `'use server'` Directive Placement
**Source:** RESEARCH.md §Pitfall 2 (verified; no existing server action file to reference — this is a new pattern)
**Apply to:** `src/actions/transitions.ts`, `src/actions/import.ts` (both ONLY)
```typescript
'use server';    // MUST be first line — before all imports
// Query files (src/db/queries/*.ts) do NOT use 'use server'
// Query files get server-only scope transitively via src/db/index.ts line 1: import 'server-only'
```

### `requireRole('mill_operator')` Guard
**Source:** `src/lib/auth.ts` lines 41-49
**Apply to:** ALL mutating actions (`transitionToMixing`, `completeOrder`, `blockOrder`, `resumeFromBlocked`, `previewImportAction`, `commitImportAction`) — first line after imports
**Do NOT apply to:** `getProductionOrders`, `getOrderById`, `getOrderEvents` — read-only queries (page-level RSC guard handles auth)
```typescript
// src/lib/auth.ts lines 41-49 — actual implementation:
export async function requireRole(role: Role): Promise<void> {
  const { userId, sessionClaims } = await auth();
  if (!userId) { redirect('/sign-in'); }
  if (!sessionClaims?.metadata?.roles?.includes(role)) { redirect('/'); }
}
// Usage in action: await requireRole('mill_operator');
// requireRole throws NEXT_REDIRECT — callers do NOT need 'return' after this call
```

### `revalidateTag('production-orders')` Pattern
**Source:** RESEARCH.md §6 + STATE.md mutation invariant
**Apply to:** ALL action exports that write to `production_orders` or `order_events` (ALL six actions)
**Tag string must be identical** in actions (as argument to `revalidateTag`) and in query wrappers (as the `tags` array element in `unstable_cache`):
```typescript
revalidateTag('production-orders');   // in every mutating action — BEFORE return
// { tags: ['production-orders'] }    // in every unstable_cache wrapper in queries/
```
Pre-commit verification: `grep -rn "'production-orders'" src/` should show both usage sites.

### Drizzle `db.update().returning()` Conflict Check
**Source:** RESEARCH.md §1 (verified from `drizzle-orm/neon-http/session.d.ts`)
**Apply to:** All four transition actions + `commitImportAction` overwrite path
```typescript
const updated = await db.update(table).set({...}).where(and(...)).returning({ id: table.id });
if (updated.length === 0) { /* conflict or not-found */ }
// NEVER use .rowsAffected — property does not exist on neon-http results
```

### `$onUpdate` Fires Automatically — Do NOT Include `updatedAt` in `.set()`
**Source:** `src/db/schema/orders.ts` line 48: `.$onUpdate(() => new Date())`
**Apply to:** All `db.update(productionOrders)` calls in transition actions and import overwrite
```typescript
// CORRECT — updatedAt injected by $onUpdate:
db.update(productionOrders).set({ state: 'Mixing', version: version + 1 })
// WRONG — do not include updatedAt manually:
db.update(productionOrders).set({ state: 'Mixing', version: version + 1, updatedAt: new Date() })
```

### `weightLbs` Number → String Conversion at DB Insert Boundary
**Source:** `src/db/schema/orders.ts` lines 59-86 (CR-01 JSDoc) + `src/db/seed.ts` line 131 (`weightLbs: r.weight_lbs` — already a string from seed JSON)
**Apply to:** `commitImportAction` insert/update paths
```typescript
weightLbs: parsedRow.weightLbs.toString(),  // CR-01: numeric column expects string
// DB returns string → UI needs Number(row.weightLbs) for display (service layer adapter)
```

### Jest Mock Pattern for Server-Only Modules
**Source:** `src/lib/auth.test.ts` lines 1-18; `src/test/fixtures/clerkAuth.ts`
**Apply to:** ALL files in `src/actions/__tests__/` and `src/db/queries/__tests__/`
```typescript
// Standard mocks for every action test file:
jest.mock('@/db', () => ({ db: { /* chainable jest.fn() mocks */ } }));
jest.mock('@/lib/auth', () => ({ requireRole: jest.fn().mockResolvedValue(undefined) }));
jest.mock('@clerk/nextjs/server', () => ({ auth: jest.fn().mockResolvedValue({ userId: 'u1' }) }));
jest.mock('next/cache', () => ({ revalidateTag: jest.fn() }));
jest.mock('next/navigation', () => ({
  redirect: (url: string) => { throw Object.assign(new Error('NEXT_REDIRECT'), { url }); },
}));
// Preferred alternative: use src/test/fixtures/clerkAuth.ts exports directly
```

### Discriminated Union Return Type
**Source:** RESEARCH.md §7 + D-01 / D-02
**Apply to:** All six action exports
```typescript
// Always return the discriminated union — never throw, never Promise<void>
type ActionResult = { ok: true } | { ok: false; code: ErrorCode; message: string };
```

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/actions/transitions.ts` | action | request-response | Server actions are a new pattern in this codebase. No `src/actions/` directory exists. No route handlers (`route.ts`) exist in the project. Nearest cousin is `src/lib/auth.ts` (requireRole) + `src/db/seed.ts` (db.insert). |
| `src/actions/import.ts` | action | file-I/O | Same as above. Additionally: `read-excel-file` is not yet installed. The XLSX parse + Zod validate + per-row insert pipeline is entirely new. RESEARCH.md §3-4 code examples are the primary reference. |

---

## D-86 Carryover: `relations()` Decision

Phase 32 D-86 deferred `relations()` declarations to Phase 33. RESEARCH.md Open Question 1 recommends deferring to Phase 34 (use plain `db.select()` in `getOrderEvents` to avoid modifying `src/db/index.ts`).

**Current `src/db/index.ts` line 27:** `export const db = drizzle({ client: sql });` — no `schema` argument.

**Planner recommendation:** Use plain `db.select().from(orderEvents).where(eq(...))` in `getOrderEvents`. Do NOT add `relations()` or update `src/db/index.ts` in Phase 33. Phase 34 can add them if `db.query` relational API is needed. This avoids a silent type bug where `db.query` without schema registration produces `never` types.

If planner overrides and ships `relations()`: `src/db/schema/orders.ts` gains a `relations()` export, `src/db/schema/events.ts` gains a matching `relations()` export, and `src/db/index.ts` line 27 becomes `drizzle({ client: sql, schema: { productionOrders, orderEvents, importBatches, users } })`.

---

## Metadata

**Analog search scope:** `src/db/`, `src/lib/`, `src/services/`, `src/test/fixtures/`, `src/actions/` (non-existent — confirmed), `src/db/queries/` (non-existent — confirmed), `next.config.ts`, `package.json`, `jest.config.ts`, `drizzle.config.ts`
**Files read:** 16 source files + 3 test files
**Pattern extraction date:** 2026-05-13

---

## PATTERN MAPPING COMPLETE
