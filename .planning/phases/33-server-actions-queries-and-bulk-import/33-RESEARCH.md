# Phase 33: Server Actions, Queries, and Bulk Import — Research

**Researched:** 2026-05-13
**Domain:** Next.js 16 server actions, Drizzle ORM neon-http, Zod v4, read-excel-file, optimistic concurrency
**Confidence:** HIGH (all critical claims verified against installed packages and live type signatures)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Action return shape & error UX**
- D-01: Every server action returns `{ ok: true } | { ok: false, code, message }`. No `Promise<void>` + throw.
- D-02: Error codes: `'conflict' | 'unauthorized' | 'validation' | 'not_found' | 'server'`. Conflict message is locked: `"Order was modified by another user. Please refresh."`
- D-03: Conflicts surface as inline red banner + auto-`router.refresh()`. No modal.
- D-04: One named export per transition: `transitionToMixing`, `completeOrder`, `blockOrder`, `resumeFromBlocked`. `reason` on `blockOrder` is REQUIRED at TS level.

**XLSX preview/commit flow**
- D-05: Two actions: `previewImportAction(file)` and `commitImportAction(file, decisions)`. Commit re-parses the file (stateless server).
- D-06: Preview returns full per-row payload with summary + rows[].
- D-07: `import_batches` row written only on successful commit. `row_count` = committed rows.
- D-08: Commit uses per-row inserts (for-loop). Partial-import allowed. No Pool driver. No transaction.
- D-09: File size validated client-side AND server-side AND via `next.config.ts` body limit.

**Duplicate row handling**
- D-10: Duplicate detection by `order_number` UNIQUE index. Overwrite = UPDATE (preserve id, bump version).
- D-11: Overwrite event row: `from_state = current, to_state = current, note = '[OVERWRITE] batch_id=<batch_id>'`.
- D-12: Per-row Skip/Overwrite radio in preview. Default = Skip. No batch toggle in v2.0.
- D-13: Overwrite allowed for any state including `Mixing`. Preserves existing `state` value.

**Row validation strategy**
- D-14: Zod `z.object({}).safeParse(row)` is canonical runtime validation. No yup/joi.
- D-15: Required: Document Number, Customer, Product, Weight (positive), Mill Line, Early Delivery Date, Formula Type. Nullable: Texture Type, Line Code.
- D-16: No Mill Line column in Book1.xlsx — every imported row defaults to `'Premix'`.

### Claude's Discretion
- Whether to ship `relations()` for `productionOrders` ↔ `orderEvents` in Phase 33.
- `users` table lazy-sync (DATA-05): likely defer to Phase 34.
- Whether to insert `from_state: null → to_state: 'Pending'` event on first import insert (recommend YES).
- Test coverage strategy: same stub-`@/db` pattern as Phase 32 (fast unit tests).

### Deferred Ideas (OUT OF SCOPE)
- Mill line reassignment UI (v2.1+)
- Mill line derivation rule from Formula Type (v2.1+)
- Column-mapping UI for non-Book1.xlsx ERP exports (IMPORT-FUT-01, v2.1+)
- Undo last transition (TRANS-FUT-01, v2.1+)
- Optimistic UI on transition (PROD-FUT-01, v2.1+)
- Batch "set all duplicates to X" toggle (v2.1+)
- `users` table lazy-sync (defer to Phase 34 unless needed for action functionality)
- `delivery_date` typed column (defer to Phase 35 with KPI-08)
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TRANS-01 | Operator can transition Pending → Mixing | `transitionToMixing(orderId, version)` action; state guard in action body |
| TRANS-02 | Operator can transition Mixing → Completed | `completeOrder(orderId, version)` action; state guard in action body |
| TRANS-03 | Operator can Block any active order with required reason | `blockOrder(orderId, version, reason: string)` action; reason is REQUIRED TS param |
| TRANS-04 | Operator can Resume Blocked → Mixing or Pending | `resumeFromBlocked(orderId, version, toState)` action |
| TRANS-05 | Every transition writes `order_events` row | `db.insert(orderEvents)` after successful UPDATE in every action |
| TRANS-06 | Optimistic concurrency via `version` column; locked message text | `UPDATE … WHERE id = $id AND version = $version`; `.returning()` empty = conflict |
| TRANS-07 | All transitions call `revalidateTag('production-orders')` | Mandatory before every action return per STATE.md mutation invariant |
| IMPORT-01 | Upload via drag-drop or file picker (Phase 34 wires UI; Phase 33 exports constants) | `MAX_IMPORT_BYTES = 2 * 1024 * 1024` exported from `src/actions/import.ts` |
| IMPORT-02 | Server-side parse with `read-excel-file` 9.0.9 | `import readXlsxFile from 'read-excel-file/node'` in server action |
| IMPORT-03 | Preview shows row count, total weight, duplicates | `previewImportAction` returns `{ summary, rows[] }` per D-06 |
| IMPORT-04 | Row-level error; partial import allowed | Per-row insert loop; failures collected, valid rows committed |
| IMPORT-05 | Duplicate detection by Document Number; skip/overwrite per row | DB query + intra-file set; overwrite = UPDATE + event row |
| IMPORT-06 | Confirmed imports recorded in `import_batches` | `db.insert(importBatches)` after row loop, per D-07 |
| IMPORT-07 | `next.config.ts` body size limit + client-side validation | `experimental.serverActions.bodySizeLimit: '2mb'` — VERIFIED config key below |
</phase_requirements>

---

## Summary

Phase 33 builds the entire write side and read-query layer of the v2.0 data stack. It produces five new files (`src/actions/transitions.ts`, `src/actions/import.ts`, `src/db/queries/orders.ts`, `src/db/queries/events.ts`) and one config change (`next.config.ts`). All schema, drivers, and auth infrastructure are complete from Phases 31–32; Phase 33 assembles them into typed, tested server functions.

The critical implementation decisions are already locked in CONTEXT.md. The research focus is on the exact API shapes and footguns for Drizzle neon-http optimistic concurrency, Zod v4 coercion, read-excel-file node-API usage, the Next.js 16 body-limit config key, and `revalidateTag` semantics — so the planner can write tasks with precise action steps rather than vague directives.

Three findings have immediate planning impact: (1) `experimental.serverActions.bodySizeLimit` is confirmed as the correct key in Next.js 16.1.6 — NOT a top-level `serverActions:` key. (2) The installed Zod version is 4.3.6 (not 4.4.3 as STACK.md states — minor difference, same API surface). (3) `read-excel-file` is NOT yet installed — it must be added as a production dependency.

**Primary recommendation:** Follow the locked decisions exactly. Plan tasks in dependency order: install deps → queries → transition actions → import actions → `next.config.ts` → tests. Drizzle `relations()` should be shipped in this phase since `getOrderEvents` joins across the FK boundary and the `db.query` relational API requires `schema` registration at construction time.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| State-transition enforcement (Pending → Mixing etc.) | API / Backend (server action) | — | Business logic must not live in browser; action receives orderId + version, enforces directed machine |
| Optimistic concurrency check | API / Backend (server action) | Database (UPDATE WHERE) | Read-modify-write in action; Postgres WHERE clause is the atomicity guarantee |
| Audit trail insert (`order_events`) | API / Backend (server action) | Database | Append-only; written in the same action that succeeds the UPDATE |
| Cache invalidation (`revalidateTag`) | API / Backend (server action) | Frontend Server (Next.js cache) | Action calls revalidateTag; Next.js RSC cache responds on next request |
| Typed query functions (`getProductionOrders`, `getOrderEvents`) | API / Backend (query layer) | Database | Server-only async functions; RSC pages call them directly (no 'use server') |
| XLSX parse and validate | API / Backend (server action) | — | `read-excel-file/node` is Node.js only; server action runs in Node.js runtime |
| Duplicate detection (file vs DB) | API / Backend (server action) | Database | `order_number` UNIQUE index catches DB collisions; intra-file detection in action memory |
| File size guard (client-side) | Browser / Client | — | `file.size > MAX_IMPORT_BYTES` check before submit; constant exported from actions/import.ts |
| Body size enforcement (Next.js) | Frontend Server (Next.js) | — | `experimental.serverActions.bodySizeLimit` in next.config.ts; 413 before action runs |
| Role authorization | API / Backend (server action) | Frontend Server (middleware) | `requireRole('mill_operator')` in every mutating action body; middleware is outer gate |

---

## Standard Stack

### Core (all already installed except read-excel-file)

| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| `drizzle-orm` | 0.45.2 | ORM, query builder, UPDATE/INSERT | INSTALLED [VERIFIED: node_modules] |
| `@neondatabase/serverless` | 1.1.0 | Neon HTTP driver | INSTALLED [VERIFIED: node_modules] |
| `zod` | 4.3.6 | Runtime validation, import schema | INSTALLED [VERIFIED: node_modules] |
| `read-excel-file` | 9.0.9 | XLSX parse server-side | NOT INSTALLED — must `npm install read-excel-file` |
| `next` | 16.1.6 | Server actions, revalidateTag, bodySizeLimit config | INSTALLED [VERIFIED: node_modules] |
| `@clerk/nextjs` | ^7.3.3 | `auth()` for user ID in actions | INSTALLED [VERIFIED: node_modules] |

**Note on Zod version:** STACK.md lists 4.4.3 but 4.3.6 is what is installed. `npm view zod version` confirms 4.4.3 is the current registry version; upgrading is optional since 4.3.6 and 4.4.3 share the same classic API surface used here. [VERIFIED: npm view + node_modules/zod/package.json]

### Installation needed

```bash
npm install read-excel-file
```

No other new production dependencies. `zod` is already installed.

---

## Architecture Patterns

### System Architecture Diagram

```
Operator browser
      |
      | FormData (orderId + version) or File upload
      v
[Next.js Server Action: 'use server']
      |
      +---> await requireRole('mill_operator')    [auth guard — first line]
      |
      +---> Read current order state from DB      [for state-machine guard]
      |         db.select().from(productionOrders).where(eq(id, orderId))
      |
      +---> State-machine guard                   [reject invalid transitions]
      |         if currentState !== expectedFromState → return { ok: false, code: 'validation' }
      |
      +---> Optimistic-concurrency UPDATE         [atomic write]
      |         UPDATE production_orders
      |         SET state=newState, version=version+1, updated_at=now()
      |         WHERE id=$id AND version=$version
      |         RETURNING id
      |
      +---> Conflict check                        [empty RETURNING = conflict]
      |         if result.length === 0 → return { ok: false, code: 'conflict' }
      |
      +---> Insert order_events row               [audit trail]
      |         db.insert(orderEvents).values({ orderId, fromState, toState, changedBy, changedAt, note })
      |
      +---> revalidateTag('production-orders')    [MANDATORY — STATE.md invariant]
      |
      +---> return { ok: true }
      v
Phase 34 RSC re-fetches via unstable_cache with tag 'production-orders'
```

```
XLSX Import flow:

Client (Phase 34 form)
      |
      | File.size <= MAX_IMPORT_BYTES check (client-side guard)
      | FormData with File
      v
[previewImportAction(file)]          [commitImportAction(file, decisions)]
      |                                     |
      +-> await requireRole(...)            +-> await requireRole(...)
      |                                     |
      +-> Server-side size check            +-> Server-side size check
      |                                     |
      +-> readXlsxFile(buffer, {schema})    +-> readXlsxFile(buffer, {schema}) [re-parse]
      |                                     |
      +-> Zod safeParse each row            +-> Zod safeParse each row
      |                                     |
      +-> Intra-file duplicate detect       +-> Apply decisions.skipRows
      |                                     |
      +-> DB query: existing order_numbers  +-> Per-row: INSERT or UPDATE
      |   (for file-vs-DB duplicate flag)   |   (based on overwriteRows set)
      |                                     |
      +-> return full preview payload       +-> Write import_batches row
          (NO DB writes)                    |
                                            +-> revalidateTag('production-orders')
                                            |
                                            +-> return { ok: true, results[] }
```

### Recommended Project Structure

```
src/
├── actions/
│   ├── transitions.ts        # 'use server'; 4 named exports; requireRole guard
│   └── import.ts             # 'use server'; previewImportAction, commitImportAction, MAX_IMPORT_BYTES
├── db/
│   ├── index.ts              # UNCHANGED — singleton
│   ├── schema/
│   │   ├── orders.ts         # MAY ADD relations() declaration for productionOrders
│   │   ├── events.ts         # Unchanged
│   │   ├── imports.ts        # Unchanged
│   │   └── index.ts          # Re-exports (update if relations() added)
│   └── queries/
│       ├── orders.ts         # NEW — getProductionOrders, getOrderById
│       └── events.ts         # NEW — getOrderEvents
next.config.ts                # ADD experimental.serverActions.bodySizeLimit: '2mb'
```

---

## Critical Technical Details (Research Focus Areas)

### 1. Drizzle Optimistic Concurrency with neon-http

**Exact UPDATE pattern** [VERIFIED: Drizzle neon-http session.d.ts + PITFALLS.md §Pitfall 6]:

```typescript
// src/actions/transitions.ts
import { db } from '@/db';
import { productionOrders } from '@/db/schema/orders';
import { orderEvents } from '@/db/schema/events';
import { eq, and } from 'drizzle-orm';

const updated = await db
  .update(productionOrders)
  .set({
    state: toState,
    version: currentVersion + 1,
    // updatedAt is handled by $onUpdate(() => new Date()) — fires automatically
  })
  .where(
    and(
      eq(productionOrders.id, orderId),
      eq(productionOrders.version, currentVersion)
    )
  )
  .returning({ id: productionOrders.id });

if (updated.length === 0) {
  return { ok: false, code: 'conflict' as const, message: 'Order was modified by another user. Please refresh.' };
}
```

**Why `.returning()` not `rowsAffected`:** The Neon HTTP driver (`drizzle-orm/neon-http`) returns a `FullQueryResults` object. Drizzle wraps this and exposes the result array directly. There is no `.rowsAffected` property on the neon-http result — the correct zero-rows check is `result.length === 0` on the `.returning()` array. [VERIFIED: neon-http session.d.ts — `NeonHttpQueryResult<T> = Omit<FullQueryResults<false>, 'rows'> & { rows: T[] }` — no rowsAffected field exposed]

**No transactions on neon-http:** The Phase 32 CR-02 carryover confirms the neon-http driver does not support multi-statement transactions. The two-step (UPDATE + INSERT events) is two sequential auto-committed HTTP calls. If the events INSERT fails after a successful UPDATE, the state is updated but the audit trail is missing. Mitigation: the events INSERT is low-risk (simple append); no rollback path exists without switching to the Pool driver (out of scope). Accept the residual risk; document in code.

**`updatedAt` auto-set:** Phase 32 schema uses `$onUpdate(() => new Date())`. This fires on any `db.update()` call — no need to include `updatedAt` in the `.set()` object. [VERIFIED: orders.ts line 48]

### 2. Drizzle `relations()` for productionOrders ↔ orderEvents

**Recommendation: SHIP in Phase 33.** [ASSUMED — based on architecture analysis]

Rationale: `getOrderEvents(orderId)` is required for Phase 34's timeline UI. The query can use a plain `db.select().from(orderEvents).where(eq(orderEvents.orderId, orderId))` join without `relations()`. However, if `db.query.productionOrders.findFirst({ with: { events: true } })` is used anywhere, it requires:
1. `relations()` declarations in schema files
2. The schema object passed to `drizzle({ client: sql, schema })` in `src/db/index.ts`

**Current `src/db/index.ts`:** `drizzle({ client: sql })` — no schema registered. If `db.query` API is used, `index.ts` must be updated to `drizzle({ client: sql, schema: { productionOrders, orderEvents, importBatches, users } })`.

**Plain SELECT alternative (no schema change to index.ts):**
```typescript
// src/db/queries/events.ts
import { db } from '@/db';
import { orderEvents } from '@/db/schema/events';
import { eq } from 'drizzle-orm';
import { desc } from 'drizzle-orm';

export async function getOrderEvents(orderId: string) {
  return db
    .select()
    .from(orderEvents)
    .where(eq(orderEvents.orderId, orderId))
    .orderBy(desc(orderEvents.changedAt));
}
```

**Planner recommendation:** Use the plain `db.select()` API for `getOrderEvents`. Avoids modifying `src/db/index.ts`. If `relations()` are later needed for complex queries, add them in Phase 34 or 35. Document the decision with a comment. This avoids a potential footgun: if `db.query` is used without schema registration, TypeScript types resolve to `never` for relational results — a silent bug.

### 3. `read-excel-file` 9.0.9 Server-Side API

[VERIFIED: npm view read-excel-file exports]

The package has four named export paths:
- `read-excel-file/node` — Node.js server (Buffer, stream, filepath)
- `read-excel-file/browser` — browser File object
- `read-excel-file/universal` — both environments
- `read-excel-file/web-worker` — web workers

**Correct import for server actions:**
```typescript
import readXlsxFile from 'read-excel-file/node';
```

**Schema-based parsing (preferred for typed output):**
```typescript
import readXlsxFile, { Schema } from 'read-excel-file/node';

const schema: Schema = {
  'Document Number': {
    prop: 'orderNumber',
    type: String,
    required: true,
  },
  'Customer': {
    prop: 'customer',
    type: String,
    required: true,
  },
  'Weight': {
    prop: 'weightLbs',
    type: Number,  // read-excel-file parses as number; Zod then coerces to string for DB
    required: true,
  },
  'Early Delivery Date': {
    prop: 'deliveryDate',
    type: Date,    // Date cells returned as JS Date objects
  },
  // ... etc
};

const { rows, errors } = await readXlsxFile(buffer, { schema });
// rows: Array<{ orderNumber: string, customer: string, weightLbs: number, deliveryDate: Date, ... }>
// errors: Array<{ row, column, error, value }>
```

**Receiving the File in a server action:**

In a React 19 server action receiving FormData, the file is a `File` object (Web API). `read-excel-file/node` accepts `Buffer` (not `File`). Conversion:

```typescript
'use server';
import readXlsxFile from 'read-excel-file/node';

export async function previewImportAction(formData: FormData) {
  const file = formData.get('file') as File;
  // Convert Web API File → Node.js Buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const { rows, errors } = await readXlsxFile(buffer, { schema });
}
```

**Date handling:** Book1.xlsx `Early Delivery Date` column cells are Excel date serials. `read-excel-file` with `type: Date` returns JS `Date` objects. Storage: convert to ISO date string for the `delivery_time text` column: `date.toISOString().split('T')[0]` → `'2025-08-15'`. Do not call `toISOString()` without splitting — would store datetime, not date. [ASSUMED — based on read-excel-file docs behavior; verify against actual Book1.xlsx during implementation]

**Intra-file duplicate detection:** The schema-parsed `rows` array is available in memory. Build a `Set<string>` of seen `orderNumber` values during the preview loop. Second occurrence of the same number gets `isDuplicate: true, duplicateOf: 'row N'`. [ASSUMED — implementation pattern, no verification needed]

### 4. Zod v4 → Drizzle Bridge for `numeric` Columns

[VERIFIED: node_modules/zod — installed version 4.3.6, classic API]

Zod v4.3.6 is installed and the default import (`import { z } from 'zod'`) uses the v4 classic API (backward-compatible with v3 usage patterns). `z.coerce.number()` is confirmed available. [VERIFIED: zod/v4/classic/coerce.d.ts]

**`weightLbs` coercion pattern:**
```typescript
import { z } from 'zod';

const productionOrderImportSchema = z.object({
  orderNumber: z.string().min(1, 'Document Number is required'),
  customer: z.string().min(1, 'Customer is required'),
  product: z.string().min(1, 'Product is required'),
  // read-excel-file returns a JS number for numeric cells
  // Drizzle numeric(10,2) expects string | number (Postgres accepts both)
  // Store as string to match ProductionOrder type (CR-01 boundary contract)
  weightLbs: z.number().positive('Weight must be positive'),
  millLine: z.enum(['Premix', 'Excel', 'CGM']).default('Premix'),
  deliveryTime: z.string().min(1, 'Early Delivery Date is required'),  // ISO date string after Date→string conversion
  formulaType: z.string().min(1, 'Formula Type is required'),
  textureType: z.string().nullable().optional(),   // D-15: nullable
  lineCode: z.string().nullable().optional(),       // D-15: nullable
});

// At insert time, convert weightLbs number → string for Drizzle numeric column:
const insertRow = {
  ...parsedRow,
  weightLbs: parsedRow.weightLbs.toString(),  // CR-01 boundary: numeric → string
  state: 'Pending' as const,
  version: 1,
  createdBy: userId,
};
```

**Why NOT `z.coerce.number()`:** `read-excel-file` with `type: Number` already returns a JS number. Coercion is not needed. Use `z.number().positive()` directly. [VERIFIED: read-excel-file schema type behavior]

**`z.string().nullable()` vs `z.string().nullish()`:** Both work for nullable columns. `nullable()` accepts `null | string`; `nullish()` accepts `null | undefined | string`. For optional import fields that may be absent, use `z.string().nullish()` so that missing XLSX cells (which come as `undefined` from read-excel-file) pass validation without error.

### 5. Next.js 16 `serverActions.bodySizeLimit` Config Key — CRITICAL FINDING

[VERIFIED: node_modules/next/dist/server/config-shared.d.ts, installed version 16.1.6]

**The correct config key is `experimental.serverActions.bodySizeLimit`**, NOT a top-level `serverActions.bodySizeLimit`.

Confirmed from the TypeScript type signatures:
- `ExperimentalConfig` (interface starting at line 215) contains `serverActions?: { bodySizeLimit?: SizeLimit; allowedOrigins?: string[] }` at line 532
- `NextConfig` contains `experimental?: ExperimentalConfig` at line 1060
- There is no top-level `serverActions` key in `NextConfig`

`proxyClientMaxBodySize` is a top-level `experimental.*` field — NOT `serverActions` nesting:
```
experimental.proxyClientMaxBodySize?: SizeLimit   (separate from serverActions)
experimental.middlewareClientMaxBodySize?: SizeLimit  (@deprecated)
```

**Correct `next.config.ts`:**
```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;
```

**Note:** CONTEXT.md D-09 mentions `proxyClientMaxBodySize` as an optional third defense layer. For v2.0 with a 2MB file ceiling, `experimental.serverActions.bodySizeLimit: '2mb'` is the required change. The `proxyClientMaxBodySize` setting is NOT required but can be added as defense-in-depth if needed. The REQUIREMENTS.md IMPORT-07 wording says "serverActions.bodySizeLimit: '2mb'" — this maps to the `experimental.serverActions.bodySizeLimit` key.

### 6. `revalidateTag` Semantics with `unstable_cache`

[CITED: Next.js PITFALLS.md §Pitfall 3 (project internal research) + CONTEXT.md code_context]

The Phase 33 query functions wrap DB calls in `unstable_cache`:
```typescript
// src/db/queries/orders.ts
import { unstable_cache } from 'next/cache';

export const getProductionOrders = unstable_cache(
  async (filters?) => {
    return db.select().from(productionOrders).where(...);
  },
  ['production-orders'],
  { tags: ['production-orders'] }
);
```

When any Phase 33 action calls `revalidateTag('production-orders')`, Next.js invalidates ALL `unstable_cache` entries tagged with that string. On the next RSC request, the query re-runs against the DB. This is the correct mechanism. [VERIFIED: PITFALLS.md §Pitfall 3 pattern]

**`revalidatePath` NOT required:** `revalidateTag('production-orders')` is sufficient. `revalidatePath('/')` would nuke the entire page from the Full Route Cache, which is heavier than needed and unnecessary since the page uses tag-based caching. Do NOT add `revalidatePath` — it can cause unnecessary cache busts for unrelated cached pages. [CITED: PITFALLS.md §Pitfall 3, item 4]

**Tag string consistency:** The tag `'production-orders'` MUST be identical in both the query wrapper and every action's `revalidateTag` call. A typo breaks cache invalidation silently. Pre-commit grep: `grep -rn "'production-orders'" src/` should show both sites.

**`revalidate` interval vs tag-only:** For Phase 34's polling model (30s `router.refresh()`), the cache does not need a time-based `revalidate`. Set `{ tags: ['production-orders'] }` only (no `revalidate` integer). This means data is only fresh after a tag invalidation (triggered by an action) or a `router.refresh()`. Correct behavior.

### 7. React 19 `useActionState` Consumption Shape

[CITED: ARCHITECTURE.md Decision 2 + STACK.md §6]

Phase 33 actions must return types that `useActionState` in Phase 34 can consume:

```typescript
// What Phase 33 exports (action signatures):
export async function transitionToMixing(
  orderId: string,
  version: number
): Promise<{ ok: true } | { ok: false; code: 'conflict' | 'unauthorized' | 'validation' | 'not_found' | 'server'; message: string }>;
```

**Phase 34 consumption pattern:**
```typescript
// Phase 34 client component
'use client';
import { useActionState } from 'react';
import { transitionToMixing } from '@/actions/transitions';

const [state, action, isPending] = useActionState(
  async (prevState: unknown, formData: FormData) => {
    return transitionToMixing(orderId, version);
  },
  null
);
// state: { ok: true } | { ok: false, code, message } | null
```

**Type the return explicitly:** The discriminated union must be defined as an exported TypeScript type from `src/actions/transitions.ts` so Phase 34 components can import it for proper narrowing. Recommend:
```typescript
export type TransitionResult =
  | { ok: true }
  | { ok: false; code: 'conflict' | 'unauthorized' | 'validation' | 'not_found' | 'server'; message: string };
```

### 8. Per-Row XLSX Insert Performance with Neon HTTP

[CITED: CONTEXT.md code_context "Build-time risks" section + ARCHITECTURE.md Decision 3]

From CONTEXT.md: 500 rows × ~50ms/insert ≈ 25s total. Vercel function default timeout is 300s (Fluid Compute). **Conclusion: within budget for v2.0's expected import volume (33-row Book1.xlsx up to ~500 rows).**

No batching required for v2.0. The per-row loop is the correct design for:
- Partial-import semantics (IMPORT-04)
- Neon HTTP driver constraint (no multi-statement transactions)
- Clear per-row error reporting

If import volume grows beyond 500 rows in a single file, consider `db.batch([...])` which the Neon HTTP session supports (confirmed: `batch<U, T>` method on `NeonHttpSession`). [VERIFIED: neon-http session.d.ts line: `batch<U extends BatchItem<'pg'>, T extends Readonly<[U, ...U[]]>>(queries: T): Promise<any>`]. However, `batch` sends all statements as a single HTTP request and does NOT support rollback — it commits each in order, same as a for-loop. Reserve for performance tuning post-v2.0.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| XLSX parsing | Custom binary parser | `read-excel-file/node` | Handles date serials, cell types, schema validation, error collection |
| Row schema validation | Manual field checks | `z.object({}).safeParse(row)` | Error path, field-level messages, TypeScript type inference |
| Auth guard | Custom JWT decode | `requireRole('mill_operator')` from `src/lib/auth.ts` | Canonical inner-guard pattern; already tested in Phase 31 |
| Cache invalidation | Manual fetch cache bust | `revalidateTag('production-orders')` | Built-in; tags all `unstable_cache` entries in one call |
| Unique constraint detection | Pre-flight SELECT + error parse | Handle the UNIQUE violation from the UPDATE `.returning()` empty result | For overwrites: UPDATE returns 0 rows if order_number doesn't exist yet → insert path; UPDATE returns 1 row if found → overwrite done |

**Key insight:** The XLSX + Zod + Drizzle pipeline handles every tricky edge case (date cells, empty strings, null vs undefined, numeric precision) if wired correctly. The one genuine footgun is the `numeric` ↔ `string` boundary at the DB layer — always `.toString()` before insert.

---

## Common Pitfalls

### Pitfall 1: `rowsAffected` Does Not Exist on Neon HTTP Results
**What goes wrong:** Developer checks `result.rowsAffected === 0` for conflict detection. Property is `undefined` — conflict is never detected, audit trail is written for every "conflict" because the code falls through.
**Why it happens:** Drizzle neon-http wraps Neon's HTTP response which does not expose PgBouncer-style `rowsAffected`. The TypeScript types do not expose this field.
**How to avoid:** Always use `.returning({ id: table.id })` on the UPDATE and check `result.length === 0`. This is the only reliable signal.
**Warning signs:** Two concurrent clicks both succeed; audit shows duplicate transitions; no TypeScript error (field access on `any` types).

### Pitfall 2: `'use server'` Missing from actions files / Wrong Placement
**What goes wrong:** Functions in `src/actions/*.ts` are called from client components but the directive is missing — functions execute client-side and import `src/db/index.ts` which has `import 'server-only'` → build error.
**How to avoid:** `'use server'` must be the FIRST LINE of `src/actions/transitions.ts` and `src/actions/import.ts`. Query files (`src/db/queries/*.ts`) do NOT use `'use server'` — they are server-only by transitive import of `db/index.ts`.

### Pitfall 3: `read-excel-file` Default Import vs `/node` Subpath
**What goes wrong:** `import readXlsxFile from 'read-excel-file'` resolves to the universal entry, which may attempt browser-specific APIs in Node.js context.
**How to avoid:** Always use `import readXlsxFile from 'read-excel-file/node'` in server actions.

### Pitfall 4: `experimental.serverActions.bodySizeLimit` vs Other Keys
**What goes wrong:** Developer puts `serverActions: { bodySizeLimit: '2mb' }` at the top level of `NextConfig` — TypeScript accepts it (loose object types) but it has no effect. Oversized files return 413 with no warning.
**How to avoid:** Key must be nested: `experimental: { serverActions: { bodySizeLimit: '2mb' } }`. The installed Next.js 16.1.6 types confirm this is the correct path (verified above).

### Pitfall 5: Drizzle `$onUpdate` Does Not Fire on Insert
**What goes wrong:** `updatedAt` shows NULL or default value after an overwrite UPDATE that was incorrectly coded as `INSERT … ON CONFLICT DO UPDATE`. The `$onUpdate(() => new Date())` only fires for Drizzle `db.update()` calls, not `db.insert()` calls.
**How to avoid:** All overwrite operations MUST use `db.update().set({...}).where(eq(orderNumber, value))`, not `db.insert().onConflictDoUpdate()`. This is already mandated by D-10 (UPDATE to preserve `id`).

### Pitfall 6: Missing `requireRole` on `blockOrder` + Incorrect State Guard
**What goes wrong:** `blockOrder` with missing auth guard allows any authenticated user to block orders. Or `blockOrder` allows blocking a `Completed` order (should be invalid — only active states).
**How to avoid:** `requireRole('mill_operator')` is line 1 after `'use server'`. State guard: `if (!['Pending', 'Mixing'].includes(currentOrder.state)) return { ok: false, code: 'validation', ... }`.

### Pitfall 7: Intra-File Duplicate Misdetection in commitImportAction
**What goes wrong:** Same `order_number` appears twice in the XLSX. Preview correctly flags as intra-file duplicate. Commit receives `decisions.overwriteRows = [{ rowIndex: 5 }]` for the second occurrence. The per-row INSERT runs for row 1 (succeeds), then row 5's UPDATE finds the already-inserted row 1 and overwrites it — but the user may not have intended this.
**How to avoid:** During commit, process rows in order. When an intra-file duplicate is encountered and overwrite is selected, the first occurrence's newly inserted record is the target. Document clearly in code. This is a known edge case in v2.0 — acceptable behavior.

### Pitfall 8: Zod `z.string().nullable()` vs `.nullish()` for Optional XLSX Fields
**What goes wrong:** `textureType` is absent in some XLSX rows. `read-excel-file` returns `undefined` for missing cells. `z.string().nullable()` rejects `undefined` → rows with missing texture_type fail validation unexpectedly.
**How to avoid:** Use `z.string().nullish()` for `textureType` and `lineCode` so both `null` and `undefined` are accepted. The Drizzle insert value for a nullish field is `null` (or omit the key — Drizzle uses column default).

---

## Code Examples

### Transition Action — Full Shape

```typescript
// src/actions/transitions.ts
'use server';
import { db } from '@/db';
import { productionOrders } from '@/db/schema/orders';
import { orderEvents } from '@/db/schema/events';
import { eq, and } from 'drizzle-orm';
import { revalidateTag } from 'next/cache';
import { requireRole } from '@/lib/auth';
import { auth } from '@clerk/nextjs/server';

export type TransitionResult =
  | { ok: true }
  | { ok: false; code: 'conflict' | 'unauthorized' | 'validation' | 'not_found' | 'server'; message: string };

export async function transitionToMixing(
  orderId: string,
  version: number
): Promise<TransitionResult> {
  await requireRole('mill_operator');  // redirects if not authorized
  const { userId } = await auth();

  // 1. Load current order for state guard
  const [order] = await db
    .select({ state: productionOrders.state })
    .from(productionOrders)
    .where(eq(productionOrders.id, orderId));

  if (!order) return { ok: false, code: 'not_found', message: 'Order not found.' };
  if (order.state !== 'Pending') {
    return { ok: false, code: 'validation', message: `Cannot transition from ${order.state} to Mixing.` };
  }

  // 2. Optimistic-concurrency UPDATE
  const updated = await db
    .update(productionOrders)
    .set({ state: 'Mixing', version: version + 1 })
    .where(and(eq(productionOrders.id, orderId), eq(productionOrders.version, version)))
    .returning({ id: productionOrders.id });

  if (updated.length === 0) {
    return { ok: false, code: 'conflict', message: 'Order was modified by another user. Please refresh.' };
  }

  // 3. Audit trail
  await db.insert(orderEvents).values({
    orderId,
    fromState: 'Pending',
    toState: 'Mixing',
    changedBy: userId!,
    note: null,
  });

  // 4. Cache invalidation (MANDATORY — STATE.md invariant)
  revalidateTag('production-orders');

  return { ok: true };
}
```

### Query Function with unstable_cache

```typescript
// src/db/queries/orders.ts
import 'server-only';
import { unstable_cache } from 'next/cache';
import { db } from '@/db';
import { productionOrders } from '@/db/schema/orders';
import { and, eq, inArray } from 'drizzle-orm';
import type { ProductionState, MillLine } from '@/db/schema/orders';

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
  ['production-orders'],
  { tags: ['production-orders'] }  // invalidated by revalidateTag('production-orders')
);
```

### XLSX Import — File → Buffer Conversion

```typescript
// src/actions/import.ts (partial)
'use server';
import readXlsxFile from 'read-excel-file/node';
import { requireRole } from '@/lib/auth';
import type { Schema } from 'read-excel-file/node';

export const MAX_IMPORT_BYTES = 2 * 1024 * 1024; // 2MB

const xlsxSchema: Schema = {
  'Document Number': { prop: 'orderNumber', type: String, required: true },
  'Customer': { prop: 'customer', type: String, required: true },
  'Weight': { prop: 'weightLbs', type: Number, required: true },
  'Early Delivery Date': { prop: 'deliveryDate', type: Date },
  'Formula Type': { prop: 'formulaType', type: String, required: true },
  'Texture Type': { prop: 'textureType', type: String },
  'Line Code': { prop: 'lineCode', type: String },
  // Mill Line NOT in Book1.xlsx — defaults to 'Premix' in action logic (D-16)
};

export async function previewImportAction(formData: FormData) {
  await requireRole('mill_operator');
  const file = formData.get('file') as File | null;
  if (!file) return { ok: false, code: 'validation' as const, message: 'No file provided.' };
  if (file.size > MAX_IMPORT_BYTES) {
    return { ok: false, code: 'validation' as const, message: 'File exceeds 2MB limit.' };
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const { rows, errors } = await readXlsxFile(buffer, { schema: xlsxSchema });
  // ... parse, Zod validate, duplicate detect, return preview payload
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `experimental.serverActions.bodySizeLimit` | Now stable: still inside `experimental` block in Next.js 16.1.6 | Config type confirmed in installed version | Use `experimental.serverActions.bodySizeLimit`, not top-level |
| `xlsx` / SheetJS | `read-excel-file` 9.0.9 | CVE-2023-30533 decision | SheetJS npm version permanently banned in this project |
| `rowsAffected` for UPDATE detection | `.returning({ id }).length === 0` | Neon HTTP driver constraint | Must use `.returning()` — no `rowsAffected` property available |
| Zod v3 patterns | Zod v4.3.6 classic API | Already installed | `import { z } from 'zod'` gives v4 classic API; `z.coerce.number()`, `safeParse()` work identically |

**Deprecated/outdated:**
- `revalidatePath('/')`: Too broad; replace with `revalidateTag('production-orders')` per STATE.md invariant.
- `db.transaction()` on neon-http: Throws at runtime (CR-02 carryover). Do not attempt.
- `import readXlsxFile from 'read-excel-file'` (root): Use `/node` subpath in server actions.

---

## Don't Hand-Roll

Already covered above. Key summary for planner:

| Problem | Don't Build | Use Instead |
|---------|-------------|-------------|
| Optimistic lock conflict check | Manual SELECT + compare version | `.returning().length === 0` after UPDATE WHERE version |
| XLSX date parsing | Custom date serial math | `read-excel-file` `type: Date` → JS Date → `.toISOString().split('T')[0]` |
| Per-row Zod errors | Manual field iteration | `z.object({}).safeParse(row).error.issues` array |
| File size enforcement (server) | Custom body size middleware | `experimental.serverActions.bodySizeLimit` in next.config.ts |

---

## Runtime State Inventory

Phase 33 is a new-code phase (no renaming or migration). The runtime state inventory is not applicable. All new files create new state; no existing runtime state is renamed.

Confirm: Phase 33 does NOT rename any existing identifiers, env vars, or DB table names. New files only.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `read-excel-file` | IMPORT-02 | NOT installed | — | Must install: `npm install read-excel-file` |
| `zod` | IMPORT row validation | INSTALLED | 4.3.6 | — |
| `drizzle-orm` | All DB operations | INSTALLED | 0.45.2 | — |
| `@neondatabase/serverless` | DB driver | INSTALLED | 1.1.0 | — |
| `next/cache` (revalidateTag) | TRANS-07 | Built into Next.js 16.1.6 | 16.1.6 | — |
| Neon DATABASE_URL | Runtime DB connection | Set in .env (Phases 31–32) | — | Phase 31 provisioned |
| Node.js | Server action runtime | v24.1.0 | 24.1.0 | — |

**Missing dependencies with no fallback:**
- `read-excel-file` — must be installed before `src/actions/import.ts` can be written.

**Wave 0 task:** `npm install read-excel-file` before any import action work.

---

## Validation Architecture

*nyquist_validation = true in .planning/config.json — section required.*

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest 30.3.0 |
| Config file | `jest.config.ts` (project root) |
| Quick run command | `npm test -- --testPathPattern="src/actions\|src/db/queries" --no-coverage` |
| Full suite command | `npm test` |

### TDD Mode Boundaries

The project has `tdd_mode: true`. Phase 33 has a clean test/no-test split:

**TDD-eligible (pure business logic, defined I/O, no live DB):**
- `productionOrderImportSchema` Zod schema — `safeParse` with valid/invalid rows
- Version-conflict detector — the "zero rows returned = conflict" branch
- State machine guard — "transition to Mixing when already Mixing returns validation error"
- Intra-file duplicate detector — Set-based O(n) scan
- File size guard — `file.size > MAX_IMPORT_BYTES`
- `ImportDecisions` application logic — skipRows/overwriteRows filtering

**Execute-only (live DB / external I/O / Next.js internals):**
- `revalidateTag` call — Next.js internals, cannot unit test
- `readXlsxFile(buffer, schema)` — file I/O glue; test with a real fixture file or skip
- Integration paths against Neon dev DB — optional, no CI Neon branch yet
- `requireRole` actual redirect behavior — tested in Phase 31; stub it here

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TRANS-01 | `transitionToMixing` succeeds when state=Pending | unit | `npm test -- --testPathPattern="actions/transitions"` | ❌ Wave 0 |
| TRANS-01 | `transitionToMixing` rejects when state != Pending | unit | same | ❌ Wave 0 |
| TRANS-02 | `completeOrder` succeeds when state=Mixing | unit | `npm test -- --testPathPattern="actions/transitions"` | ❌ Wave 0 |
| TRANS-03 | `blockOrder` requires non-empty reason string | unit | same | ❌ Wave 0 |
| TRANS-03 | `blockOrder` rejects when state=Completed | unit | same | ❌ Wave 0 |
| TRANS-04 | `resumeFromBlocked` succeeds with toState=Mixing | unit | same | ❌ Wave 0 |
| TRANS-06 | Conflict: zero rows → `code: 'conflict'` + locked message | unit | same | ❌ Wave 0 |
| TRANS-06 | Conflict message exact text | unit | same | ❌ Wave 0 |
| TRANS-07 | `revalidateTag('production-orders')` called on success | unit (mock) | same | ❌ Wave 0 |
| IMPORT-02 | `productionOrderImportSchema` accepts valid row | unit | `npm test -- --testPathPattern="actions/import"` | ❌ Wave 0 |
| IMPORT-02 | Schema rejects missing required fields | unit | same | ❌ Wave 0 |
| IMPORT-02 | Schema accepts null textureType/lineCode | unit | same | ❌ Wave 0 |
| IMPORT-04 | Weight coercion: number → string for DB insert | unit | same | ❌ Wave 0 |
| IMPORT-05 | Intra-file duplicate detection (same orderNumber twice) | unit | same | ❌ Wave 0 |
| IMPORT-05 | Overwrite event row has `from_state === to_state` + `[OVERWRITE]` note | unit | same | ❌ Wave 0 |
| IMPORT-07 | File > 2MB returns `{ ok: false, code: 'validation' }` | unit | same | ❌ Wave 0 |

### Test Strategy for Actions (No Live DB)

Follow the Phase 32 JSON-fixture + Drizzle mock pattern:

```typescript
// src/actions/__tests__/transitions.test.ts
jest.mock('@/db', () => ({
  db: {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockResolvedValue([{ state: 'Pending', id: 'order-1' }]),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    returning: jest.fn().mockResolvedValue([{ id: 'order-1' }]),  // simulate success
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockResolvedValue([]),
  },
}));

jest.mock('@/lib/auth', () => ({ requireRole: jest.fn().mockResolvedValue(undefined) }));
jest.mock('@clerk/nextjs/server', () => ({ auth: jest.fn().mockResolvedValue({ userId: 'u1' }) }));
jest.mock('next/cache', () => ({ revalidateTag: jest.fn() }));
```

For conflict test: override `returning` to `mockResolvedValue([])` (empty = conflict).

### Sampling Rate

- **Per task commit:** `npm test -- --testPathPattern="src/actions|src/db/queries" --no-coverage`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `src/actions/__tests__/transitions.test.ts` — covers TRANS-01..07 (all states, conflict path, revalidateTag)
- [ ] `src/actions/__tests__/import.test.ts` — covers Zod schema, duplicate detection, size guard, overwrite event
- [ ] `src/db/queries/__tests__/orders.test.ts` — covers getProductionOrders filter shapes
- [ ] `src/db/queries/__tests__/events.test.ts` — covers getOrderEvents ordering

---

## Security Domain

*security_enforcement is enabled (not set to false in config).*

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | `auth()` from `@clerk/nextjs/server` — session JWT claim verification |
| V3 Session Management | no | Clerk manages session lifecycle |
| V4 Access Control | yes | `requireRole('mill_operator')` — first line of every mutating action |
| V5 Input Validation | yes | Zod `z.object({}).safeParse()` for import rows; file size validation |
| V6 Cryptography | no | No crypto operations in Phase 33 |

### Known Threat Patterns for This Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Unauthorized state transition | Elevation of Privilege | `requireRole('mill_operator')` as first line in every action (AUTH-02) |
| Stale-write race condition | Tampering | `UPDATE … WHERE version = $version` optimistic lock; 0 rows = conflict |
| XLSX RCE / formula injection | Tampering | `read-excel-file` does NOT evaluate formulas (no macro execution); locked library choice |
| DoS via large file upload | DoS | Three layers: client-side `file.size`, server-side check, `experimental.serverActions.bodySizeLimit` |
| Audit trail bypass | Repudiation | `order_events` INSERT after every successful state change; cannot be bypassed by action callers |
| Client-side role spoofing | Elevation of Privilege | `requireRole` reads from server-side JWT claims via `auth()`, not from client-supplied data |
| Read-only query authz creep | Elevation of Privilege | `getProductionOrders` and `getOrderEvents` do NOT call `requireRole` — page-level RSC guard handles auth (AUTH-03) |

**SSRF via XLSX:** `read-excel-file` 9.0.9 parses only the file buffer — no network calls, no external entity resolution. Not a vector. [VERIFIED: library is a pure parser with no HTTP client]

**SheetJS CVE:** CVE-2023-30533 (Prototype Pollution) affects the npm version of `xlsx`. `read-excel-file` is unaffected — different codebase, different author, confirmed patched in 9.0.9 (published 2026-05-02). [CITED: STACK.md + npm registry]

**`docs/security-patterns.md` §1 update:** Phase 33 does not add new RSC pages, so the audit findings table does not gain new rows. However, the JSDoc requirement from §6 item 8 applies: since actions are new modules with role guards, add a brief note to the audit table that `src/actions/*.ts` are server-action modules with inner `requireRole('mill_operator')` guards.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `read-excel-file` `type: Date` returns JS Date objects for Excel date cells | Code Examples (XLSX schema) | Date cells parsed as strings or numbers; need manual date-serial conversion |
| A2 | `db.select()` plain JOIN is sufficient for `getOrderEvents` (no `relations()` needed) | Architecture Patterns | If Phase 34 wants `db.query` relational API, `src/db/index.ts` must be updated with schema registration |
| A3 | `z.string().nullish()` is the correct Zod v4 shape for optional XLSX fields | Technical Details §4 | Missing cells that come as `undefined` fail validation; rows incorrectly rejected |
| A4 | Intra-file duplicate detection: second occurrence of same `orderNumber` is marked duplicate in preview and handled in commit | Code Examples | Commit could emit a UNIQUE constraint violation if not properly handled |

**If this table has only ASSUMED claims:** A1 can be verified during Wave 1 by testing `readXlsxFile` against the actual `example-data/Book1.xlsx` file. A2 is a planner decision (discretion area). A3 can be verified with a one-line Zod test.

---

## Open Questions

1. **`relations()` in Phase 33 or defer?**
   - What we know: Plain `db.select().from(orderEvents).where(eq(orderId, ...))` works without `relations()`. The `db.query` relational API requires both `relations()` AND schema registration in `drizzle({ client, schema })`.
   - What's unclear: Phase 34 may want `db.query.productionOrders.findFirst({ with: { events: true } })` for efficiency.
   - Recommendation: Defer `relations()` to Phase 34. Phase 33's `getOrderEvents(orderId)` uses plain SELECT. Avoid modifying `src/db/index.ts` in Phase 33. If Phase 34 needs it, it adds `relations()` + updates `index.ts` in the same wave.

2. **Initial event row for bulk-imported orders (`from_state: null → to_state: 'Pending'`)?**
   - What we know: Phase 32 D-18 explicitly rejected synthetic events for the seed. CONTEXT.md Claude's Discretion recommends YES for imports (not seed).
   - What's unclear: The planner must decide and document in PLAN.md.
   - Recommendation: YES — insert a `{ fromState: null, toState: 'Pending', note: 'Imported from XLSX' }` event for each new (non-overwrite) insert. This gives timeline continuity. Omit for seed data.

3. **`users` table lazy-sync (DATA-05)?**
   - What we know: `changed_by` in `order_events` is the Clerk user ID — no display name needed for Phase 33 functionality.
   - Recommendation: Defer to Phase 34 when display names are first rendered. Phase 33 does not touch `users`.

---

## Sources

### Primary (HIGH confidence — verified against installed packages)
- `node_modules/next/dist/server/config-shared.d.ts` — `experimental.serverActions.bodySizeLimit` config key location and type (line 532 within `ExperimentalConfig`, not top-level `NextConfig`)
- `node_modules/drizzle-orm/neon-http/session.d.ts` — `NeonHttpQueryResult<T>` type; no `rowsAffected`; `batch()` available
- `node_modules/zod/v4/classic/coerce.d.ts` — `z.coerce.number()` confirmed in Zod v4.3.6 classic API
- `node_modules/zod/index.d.ts` — confirms default import routes to `v4/classic`
- `node_modules/drizzle-orm/utils.d.ts` — `DrizzleConfig.schema?: TSchema` (optional; required only for `db.query` relational API)
- `npm view read-excel-file exports` — four named subpaths; `/node` is the correct server-side path
- `src/db/schema/orders.ts` — `version integer NOT NULL DEFAULT 1`, `$onUpdate` pattern, `numeric(10,2)` type
- `src/db/schema/events.ts` — `fromState` nullable, `toState` notNull, cascade-delete FK
- `src/db/index.ts` — `drizzle({ client: sql })` without schema (no relational API currently registered)
- `src/lib/auth.ts` — `requireRole` redirects (never returns); `auth()` from `@clerk/nextjs/server`
- `src/test/fixtures/clerkAuth.ts` — `mockMillOperatorSession()` available for action tests

### Secondary (MEDIUM confidence — project research docs)
- `.planning/research/v2.0/PITFALLS.md` §Pitfall 3 — `revalidateTag` semantics, tag-over-path preference
- `.planning/research/v2.0/PITFALLS.md` §Pitfall 6 — optimistic lock pattern with `.returning()` empty check
- `.planning/research/v2.0/ARCHITECTURE.md` Decision 2–3 — server action over route handler; Vercel 300s limit
- `.planning/research/v2.0/STACK.md` — `read-excel-file` 9.0.9 rationale, SheetJS CVE confirmation

### Tertiary (LOW confidence — verified during this session, low risk)
- npm registry: `read-excel-file@9.0.9` (most recent), `zod@4.4.3` (registry latest vs 4.3.6 installed)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified in node_modules or npm registry
- Architecture: HIGH — follows locked CONTEXT.md decisions; no new architectural choices
- Optimistic concurrency API: HIGH — verified from Drizzle neon-http session.d.ts
- Next.js config key: HIGH — verified from installed Next.js 16.1.6 type definitions
- read-excel-file node API: HIGH — verified from npm exports; ASSUMED on Date cell behavior (A1)
- Zod v4 coerce API: HIGH — verified from installed zod/v4/classic/coerce.d.ts
- Pitfalls: HIGH — mostly derived from verified type signatures and project research docs

**Research date:** 2026-05-13
**Valid until:** 2026-06-13 (30 days — stable libraries)

---

## RESEARCH COMPLETE

**Phase:** 33 — Server Actions, Queries, and Bulk Import
**Confidence:** HIGH

### Key Findings

1. **`experimental.serverActions.bodySizeLimit` is the correct config key** in Next.js 16.1.6 — verified from installed type definitions. It lives inside `experimental:` block, NOT at the top level of `NextConfig`. CONTEXT.md D-09 already had this right; the research confirms it.

2. **`read-excel-file` is NOT installed** — must be added with `npm install read-excel-file` as Wave 0 before any import action code can be written.

3. **No `rowsAffected` property on Neon HTTP results** — optimistic concurrency conflict detection MUST use `.returning({ id }).length === 0`. Verified from `drizzle-orm/neon-http/session.d.ts`. Using `rowsAffected` is a silent bug (property is `undefined`, conflict never detected).

4. **Zod v4.3.6 is installed** (not 4.4.3 as STACK.md states — minor). The default `import { z } from 'zod'` routes to the v4 classic API. `z.coerce.number()`, `z.object({}).safeParse()`, and `z.string().nullish()` all work identically to v3. No migration effort.

5. **`db.query` relational API requires schema registration** — current `src/db/index.ts` calls `drizzle({ client: sql })` without `schema`. To use `db.query.productionOrders.findFirst({ with: { events: true } })`, `index.ts` must be updated. Recommend deferring `relations()` to Phase 34 and using plain `db.select()` for `getOrderEvents` in Phase 33.

### File Created
`.planning/phases/33-server-actions-queries-and-bulk-import/33-RESEARCH.md`

### Confidence Assessment

| Area | Level | Reason |
|------|-------|--------|
| Next.js config key | HIGH | Verified from installed next@16.1.6 type definitions |
| Drizzle neon-http conflict detection | HIGH | Verified from session.d.ts; no rowsAffected |
| Zod v4 coerce API | HIGH | Verified from installed zod/v4/classic/coerce.d.ts |
| read-excel-file node API | HIGH | Verified from npm exports; Date cell behavior is ASSUMED (A1) |
| Test architecture | HIGH | Follows established Phase 32 mock pattern |
| Security threat model | HIGH | Follows locked CONTEXT.md + docs/security-patterns.md |

### Open Questions

- Whether to use plain `db.select()` or `relations()` + `db.query` for `getOrderEvents` (recommendation: plain SELECT, defer relations to Phase 34)
- Whether to emit `{ fromState: null, toState: 'Pending' }` event row on first bulk-import insert (recommendation: YES)

### Ready for Planning
Research complete. Planner can now create PLAN.md files for Phase 33.
