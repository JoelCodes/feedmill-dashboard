---
phase: 33-server-actions-queries-and-bulk-import
reviewed: 2026-05-13T00:00:00Z
depth: standard
files_reviewed: 14
files_reviewed_list:
  - docs/security-patterns.md
  - next.config.ts
  - package.json
  - src/actions/import-schema.ts
  - src/actions/import.ts
  - src/actions/transitions.ts
  - src/db/queries/events.ts
  - src/db/queries/orders.ts
  - src/actions/__tests__/import-commit.test.ts
  - src/actions/__tests__/import-preview.test.ts
  - src/actions/__tests__/import-schema.test.ts
  - src/actions/__tests__/transitions.test.ts
  - src/db/queries/__tests__/events.test.ts
  - src/db/queries/__tests__/orders.test.ts
findings:
  critical: 4
  warning: 9
  info: 4
  total: 17
status: issues_found
---

# Phase 33: Code Review Report

**Reviewed:** 2026-05-13T00:00:00Z
**Depth:** standard
**Files Reviewed:** 14
**Status:** issues_found

## Summary

Phase 33 ships the server actions and queries layer for the mill production dashboard. The implementation generally adheres to the documented contracts: AUTH-02 inner-guard is present in every server action, optimistic concurrency in `transitions.ts` correctly uses `.returning().length === 0` rather than `.rowCount`, the cache-revalidation contract is wired uniformly, and the 3-layer DoS guard for imports is present.

However, four critical defects undermine the security/correctness claims for the bulk-import path:

1. **`MAX_IMPORT_BYTES` is exported from a `'use server'` file.** Next.js 16 explicitly forbids non-async-function exports from server-action files; the documented client-side use of the constant for the layer-1 DoS guard will not work.
2. **The overwrite path in `commitImportAction` does NOT actually implement optimistic concurrency**, despite a JSDoc that claims it does. The UPDATE has no `version = N` guard in the WHERE clause and no `.returning().length === 0` check.
3. **`commitImportAction` computes `dbDuplicates` then never uses it.** A row that was flagged as a DB duplicate in preview but not added to `decisions.skipRows` or `decisions.overwriteRows` is attempted as a fresh INSERT, hitting the unique-index error at the DB layer.
4. **Outer-catch error path silently strands successful per-row inserts.** Any exception thrown by the `import_batches` insert or `revalidateTag` after the per-row loop returns `{ ok: false, code: 'server' }` and discards `results[]`, so committed rows have no batch record and the cache is not invalidated.

Warnings include missing runtime validation on `decisions`, the import overwrite `action: 'insert'` mislabel for error rows in the overwrite list, the empty-string-as-reason hole in `blockOrder`, and several robustness/safety issues at the data-marshalling boundary.

## Critical Issues

### CR-01: `MAX_IMPORT_BYTES` exported from a `'use server'` file is forbidden by Next.js 16

**File:** `src/actions/import.ts:25`
**Issue:** The file starts with `'use server';`, then exports `export const MAX_IMPORT_BYTES = 2 * 1024 * 1024;`. Next.js 16's server-boundary TypeScript rule (verified in `node_modules/next/dist/esm/server/typescript/rules/server-boundary.js` line 54-55, 76-77) emits an error: `The "use server" file can only export async functions.` The JSDoc comment promises that Phase 34's client upload form will import this constant for the layer-1 client-side DoS guard, but that client import will either fail to bundle, throw at runtime, or silently break the layer-1 guard. The 3-layer DoS mitigation reduces to 2 layers (server action + framework body-size).
**Fix:** Move the constant to a non-`'use server'` module so it can be imported safely by both server and client code:
```typescript
// src/lib/import-constants.ts (new file — no 'use server' directive)
export const MAX_IMPORT_BYTES = 2 * 1024 * 1024;
```
Then in `src/actions/import.ts`:
```typescript
import { MAX_IMPORT_BYTES } from '@/lib/import-constants';
// remove the local `export const MAX_IMPORT_BYTES` declaration
```
Update Phase 34 client imports to point at `@/lib/import-constants`. Re-export from `import.ts` is not a fix — the same TS rule applies to re-exports of non-async-function values.

### CR-02: Overwrite path in `commitImportAction` lacks optimistic-concurrency enforcement

**File:** `src/actions/import.ts:489-507`
**Issue:** The JSDoc on lines 488-490 claims `version bumped via sql\`version + 1\` to support optimistic concurrency (D-10 + T-33-Stale)`, and Test 6 only asserts that `setArg.version` is a `sql` literal, not that conflicting concurrent overwrites are rejected. But the UPDATE is:
```typescript
.update(productionOrders)
.set({ ..., version: sql`version + 1` as any })
.where(eq(productionOrders.orderNumber, row.orderNumber))
.returning({ id: productionOrders.id });
```
There is NO `version = <expected>` predicate in the WHERE clause, and the `.returning()` result is never inspected for a zero-row length. Two concurrent overwrites of the same `orderNumber` will both succeed, with the second silently clobbering the first; an in-flight transition state change running concurrently with an overwrite will also be lost. This is the exact pattern that `transitions.ts:113` correctly implements and that this overwrite block claims to mirror. Contrast with `transitions.ts:110-118`, which uses `and(eq(id, ...), eq(version, version))` and checks `updated.length === 0` for the conflict.
**Fix:** The preview duplicate detection loaded the existing row's `version`; the operator's overwrite decision is implicitly against that version. Either (a) thread the version through `ImportDecisions` and check it, or (b) drop the optimistic-concurrency claim from the JSDoc and accept that overwrite is last-write-wins (D-13 may already permit this — confirm against decision record). For (a):
```typescript
// load existing with version
const [existing] = await db
  .select({ id: productionOrders.id, state: productionOrders.state, version: productionOrders.version })
  .from(productionOrders)
  .where(eq(productionOrders.orderNumber, row.orderNumber));

// gate the UPDATE on the version we just observed (TOCTOU is still wide, but at least
// concurrent post-preview mutations will conflict-fail visibly)
const updated = await db
  .update(productionOrders)
  .set({ ...payload, version: sql`version + 1` as any })
  .where(and(
    eq(productionOrders.orderNumber, row.orderNumber),
    eq(productionOrders.version, existing.version),
  ))
  .returning({ id: productionOrders.id });

if (updated.length === 0) {
  results.push({ rowIndex, ok: false, action: 'overwrite', error: 'Order was modified after preview. Please refresh.' });
  continue;
}
```
Also extend Test 6 / add a new test that asserts an overwrite returns the conflict outcome when the row's version moves between the existing-row SELECT and the UPDATE.

### CR-03: `commitImportAction` computes `dbDuplicates` then ignores it; un-decided DB-duplicate rows hit the unique-index error path

**File:** `src/actions/import.ts:446-450`
**Issue:** After parsing and intra-file duplicate detection, the action computes:
```typescript
const validOrderNumbers = deduplicatedRows
  .filter((r) => !r.errors?.length && !r.isDuplicate)
  .map((r) => r.orderNumber)
  .filter(Boolean);
const dbDuplicates = await detectDbDuplicates(validOrderNumbers);
```
`dbDuplicates` is never referenced after this line — verified via `grep -n "dbDuplicates" src/actions/import.ts` (two hits in `previewImportAction`, one in `commitImportAction` and no further use). A row that the preview UI flagged as a DB-duplicate and that the operator does not explicitly skip or overwrite (e.g., closes the dialog without making a per-row decision, or the UI defaults to "include all" for valid rows) reaches the new-insert path, and the `productionOrders.orderNumber` unique index throws a constraint violation that surfaces as a generic `'insert' error` in the per-row result. The dead code strongly suggests the developer intended to default-skip un-decided DB-duplicates (the safer behavior consistent with `isDuplicate` being marked in preview), and forgot to wire it up. Combined with the round-trip cost of the now-pointless duplicate query, this is both a correctness gap and wasted work.
**Fix:** Use the `dbDuplicates` set as the un-decided-duplicate guard, mirroring the safer default that `skipRows` already implements:
```typescript
const dbDuplicates = await detectDbDuplicates(validOrderNumbers);

for (const row of deduplicatedRows) {
  const rowIndex = row.rowIndex;
  if (decisions.skipRows.includes(rowIndex)) {
    results.push({ rowIndex, ok: true, action: 'skipped' });
    continue;
  }
  if (row.errors && row.errors.length > 0) { /* unchanged */ continue; }

  // NEW: un-decided duplicates (intra-file OR DB) default to skipped, NOT to insert-attempt
  const isUndecidedDup =
    (row.isDuplicate || dbDuplicates.has(row.orderNumber)) &&
    !decisions.overwriteRows.includes(rowIndex);
  if (isUndecidedDup) {
    results.push({ rowIndex, ok: true, action: 'skipped' });
    continue;
  }

  if (decisions.overwriteRows.includes(rowIndex)) { /* overwrite path */ }
  else { /* insert path */ }
}
```
Add a test: a row is in `validOrderNumbers`, the DB lookup returns its orderNumber, and the row is in NEITHER `skipRows` NOR `overwriteRows` — assert the result is `action: 'skipped'` and that no INSERT was attempted for it.

### CR-04: Outer-catch in `commitImportAction` strands committed rows when a post-loop step fails

**File:** `src/actions/import.ts:579-597`
**Issue:** The per-row loop accumulates `results[]` and writes `productionOrders` + `orderEvents` per row inside an inner try/catch. After the loop, the action writes the `import_batches` audit row (line 579-587) and calls `revalidateTag('production-orders', 'max')` (line 591). Both calls are INSIDE the outer `try` (line 420) whose catch returns `{ ok: false, code: 'server', message: 'Failed to commit import.' }` and discards `results[]`. If `import_batches.insert` throws (Neon transient error, schema drift, NOT NULL violation on a coerced `fileObj.name`, etc.) or if `revalidateTag` throws, the caller sees a generic server error and has no way to know that N production orders were already persisted. Cache is also not invalidated, so the dashboard will show stale state. The per-row partial-failure invariant (IMPORT-04) protects in-loop failures; the outer catch defeats that invariant for post-loop failures.
**Fix:** Move the `import_batches` insert and the `revalidateTag` call out of the broad try/catch, OR catch their failures locally and still return the per-row results:
```typescript
// after the per-row loop, OUTSIDE the outer try:
if (committedCount === 0) {
  return { ok: true, batchId, committedCount: 0, failedCount, results };
}

// import_batches insert — if this fails, we still succeeded at the per-row level;
// surface a degraded-success rather than discarding results.
try {
  await db.insert(importBatches).values({
    id: batchId,
    fileName: fileObj.name,
    rowCount: committedCount,
    importedBy: userId!,
  });
} catch (err) {
  // batch row missing is an audit failure, not a row-commit failure.
  // Still revalidate (the data DID change), still return results so the operator sees them.
  revalidateTag('production-orders', 'max');
  return {
    ok: true,
    batchId,
    committedCount,
    failedCount,
    results,
    // optionally extend CommitResult with a `warnings` field for "batch audit row missing"
  };
}

revalidateTag('production-orders', 'max');
return { ok: true, batchId, committedCount, failedCount, results };
```
Add an integration test: configure the `importBatches` insert mock to reject after one successful row insert, and assert the action still returns `ok: true` with `committedCount: 1` and that `revalidateTag` was called.

## Warnings

### WR-01: `commitImportAction` does not validate the `decisions` parameter shape

**File:** `src/actions/import.ts:413-418, 463-465, 475`
**Issue:** `decisions.skipRows.includes(rowIndex)` and `decisions.overwriteRows.includes(rowIndex)` are called directly on the parameter without any guard. The TS signature `decisions: ImportDecisions` is enforced at compile time, but server actions are network endpoints — a malformed client payload (e.g., `{ skipRows: null, overwriteRows: null }`) crashes with TypeError, gets caught by the outer try/catch (CR-04), and surfaces as a generic `'Failed to commit import.'` with no diagnostic value, OR worse, gets coerced silently if the deserializer is permissive. Server actions should validate inputs at the boundary the same way they validate FormData.
**Fix:** Use Zod (already a dependency) to validate `decisions` immediately after `requireRole`:
```typescript
const decisionsSchema = z.object({
  skipRows: z.array(z.number().int().nonnegative()),
  overwriteRows: z.array(z.number().int().nonnegative()),
});

const parsed = decisionsSchema.safeParse(decisions);
if (!parsed.success) {
  return { ok: false, code: 'validation', message: 'Invalid decisions payload.' };
}
const safeDecisions = parsed.data;
```
Then use `safeDecisions.skipRows` / `safeDecisions.overwriteRows` everywhere below.

### WR-02: Error-row in `overwriteRows` is reported with `action: 'insert'`

**File:** `src/actions/import.ts:470-473`
**Issue:** When a row has Zod/parser errors AND the operator listed its `rowIndex` in `decisions.overwriteRows`, the error-bail block runs BEFORE the overwrite-vs-insert split and unconditionally reports `action: 'insert'`. The operator wanted to overwrite, not insert, so the result row's `action` field misrepresents the intended action. Minor UI defect; the audit/result trail is wrong.
**Fix:** Compute the intended action from the decisions, then report it on the error path:
```typescript
if (row.errors && row.errors.length > 0) {
  const intendedAction = decisions.overwriteRows.includes(rowIndex) ? 'overwrite' : 'insert';
  results.push({ rowIndex, ok: false, action: intendedAction, error: row.errors[0].message });
  continue;
}
```

### WR-03: `blockOrder` accepts empty-string `reason`, defeating the TS-enforced "reason required" contract

**File:** `src/actions/transitions.ts:215-219`
**Issue:** TRANS-03 + D-04 require a non-empty blocking reason. The TypeScript signature `reason: string` (no `?`) prevents callers from omitting the parameter, but `''` (empty string) is a valid string. The action passes `note: reason` to the audit insert; the DB column is nullable text, so empty strings are stored. An empty-reason block event is indistinguishable from a missing-reason scenario in the timeline UI. The contract's intent is "operator must explain the block"; the code only enforces "operator must call the function with a string."
**Fix:** Reject empty/whitespace-only reasons at the action body:
```typescript
if (reason.trim().length === 0) {
  return {
    ok: false,
    code: 'validation' as const,
    message: 'A non-empty reason is required to block an order.',
  };
}
```
Add a test: `blockOrder('order-1', 1, '')` and `blockOrder('order-1', 1, '   ')` both return `code: 'validation'` and no DB writes occur.

### WR-04: `commitImportAction` writes `fileName: fileObj.name` with no name validation

**File:** `src/actions/import.ts:428, 583`
**Issue:** The cast `fileObj = file as { size: number; name: string; arrayBuffer: ... }` is a TS-only assertion; at runtime a `Blob` (not `File`) lacks `.name` (or has the default `"blob"`). `import_batches.file_name` is `notNull` — if `fileObj.name` is `undefined`, the insert fails at the NOT NULL constraint, which is then caught by the outer try/catch and discards the per-row `results` (CR-04 amplifies this). Also: the file name is operator-supplied input persisted to the audit table. No length cap, no sanitization (filenames can contain newlines, control characters, etc.).
**Fix:** Validate and normalize the name explicitly:
```typescript
const rawName = (fileObj as { name?: unknown }).name;
const fileName = typeof rawName === 'string' && rawName.trim().length > 0
  ? rawName.slice(0, 255)
  : 'unknown.xlsx';
// ... then use `fileName` in the importBatches insert
```

### WR-05: `previewImportAction` and `commitImportAction` `catch {}` swallow all error context

**File:** `src/actions/import.ts:338-340, 595-597`
**Issue:** Both top-level catch blocks bind no error and return a generic `'Failed to parse XLSX file.'` / `'Failed to commit import.'`. No logging, no error class differentiation. In production, when an operator reports "import doesn't work", there is no server-side trace to correlate. read-excel-file emits typed errors (e.g., for malformed XLSX vs. password-protected vs. wrong sheet); all are flattened to one message.
**Fix:** Bind the error and log it server-side (using a logger if one exists, otherwise `console.error` is acceptable in a server action — it routes to the Next.js server logs):
```typescript
} catch (err) {
  console.error('[previewImportAction] failed:', err);
  return { ok: false, code: 'server', message: 'Failed to parse XLSX file.' };
}
```
Apply to both action bodies.

### WR-06: `parseAndValidate` silently drops parser errors for rows that read-excel-file omitted from `rows`

**File:** `src/actions/import.ts:118-197`
**Issue:** `parserErrorsByRow` is keyed by `pe.row`, but the main loop iterates `rawRows` and computes `rowIndex = i + 1`. If read-excel-file detects a row so malformed that it does not emit a row in `rawRows` at all (e.g., a fully unparseable row), the corresponding parser-error entry has no matching `rowIndex` in the result and is silently lost. The operator sees `errorCount: 0` and `validCount: rowCount`, but the file actually had bad rows that never made it to the result.
**Fix:** After the main per-row loop, append synthetic result rows for any `parserErrorsByRow` keys that were not consumed:
```typescript
const consumedRowIndices = new Set(result.map((r) => r.rowIndex));
for (const [row, errs] of parserErrorsByRow.entries()) {
  if (!consumedRowIndices.has(row)) {
    result.push({
      rowIndex: row,
      orderNumber: '',
      customer: '',
      product: '',
      weightLbs: 0,
      deliveryTime: '',
      formulaType: '',
      millLine: 'Premix',
      textureType: null,
      lineCode: null,
      isDuplicate: false,
      errors: errs,
    });
  }
}
```
Add a test: configure the `readXlsxFile` mock to return `rows: [oneValidRow]` and `errors: [{ row: 99, column: 'Weight', ... }]`, assert that the preview result includes a row with `rowIndex: 99` carrying the parser error.

### WR-07: `import-schema.ts` accepts unbounded `weightLbs` values that overflow `numeric(10, 2)`

**File:** `src/actions/import-schema.ts:38`
**Issue:** `weightLbs: z.number().positive('Weight must be positive')` — no upper bound. The DB column is `numeric(10, 2)` (max value `99_999_999.99`). A row with `weightLbs: 1e10` passes Zod, then fails at the DB layer with a generic "numeric field overflow" caught as `error: String(err)` in the per-row result. Operator sees a cryptic Postgres error in the UI rather than a clear validation message.
**Fix:** Cap at the numeric(10,2) maximum at the schema layer:
```typescript
weightLbs: z.number()
  .positive('Weight must be positive')
  .max(99_999_999.99, 'Weight exceeds maximum (99,999,999.99 lbs).'),
```

### WR-08: `import.ts` cast `file as { size: number; arrayBuffer: ... }` does not validate that the FormData entry is actually a Blob/File

**File:** `src/actions/import.ts:280-283, 425-428`
**Issue:** The check is `if (!file || typeof file === 'string')`. Anything not a string and not nullish passes — including primitives, plain objects, etc. (`typeof` other than `'string'` includes `'number'`, `'boolean'`, `'object'`). In practice Next.js deserialization of FormData yields only string-or-Blob entries, but the action's robustness against malformed input depends on the framework. A stricter check is cheap and removes the cast:
```typescript
if (!(file instanceof Blob)) {
  return { ok: false, code: 'validation', message: 'No file provided.' };
}
// `file` is now narrowed to Blob — no cast needed
```

### WR-09: `detectDbDuplicates` issues a single unbounded `IN` clause; large valid-file imports may exceed Neon HTTP request size limits

**File:** `src/actions/import.ts:242-251`
**Issue:** Within the 2MB file size limit, an XLSX could plausibly contain tens of thousands of rows. `inArray(productionOrders.orderNumber, orderNumbers)` produces a single `WHERE order_number IN ($1, $2, ..., $N)` query that grows linearly with input. Neon's HTTP endpoint imposes request size limits (commented elsewhere in the codebase); a 10k-element IN-list with 32-char order numbers approaches ~300KB of parameter payload. The query may fail with a 400/413, caught by the outer try/catch as a generic `'server'` error — and crucially, this happens BEFORE the per-row loop, so the entire import bails for what is conceptually a "duplicate detection" optimization.
**Fix:** Batch the `inArray` query in chunks of e.g. 1000:
```typescript
async function detectDbDuplicates(orderNumbers: string[]): Promise<Set<string>> {
  if (orderNumbers.length === 0) return new Set();
  const CHUNK = 1000;
  const found = new Set<string>();
  for (let i = 0; i < orderNumbers.length; i += CHUNK) {
    const slice = orderNumbers.slice(i, i + CHUNK);
    const existing = await db
      .select({ orderNumber: productionOrders.orderNumber })
      .from(productionOrders)
      .where(inArray(productionOrders.orderNumber, slice));
    for (const r of existing) found.add(r.orderNumber);
  }
  return found;
}
```

## Info

### IN-01: `import-schema.ts` `millLine` default is unreachable; action injects `'Premix'` before validation

**File:** `src/actions/import-schema.ts:40`, `src/actions/import.ts:157`
**Issue:** `millLine: z.enum(['Premix', 'Excel', 'CGM']).default('Premix')` defines a default value, but `parseAndValidate` always injects `millLine: 'Premix' as const` into the object before calling `safeParse` (line 157). The Zod `.default()` is dead from this caller's perspective. Not incorrect, but the redundancy hides D-16 intent (the Zod schema's default is the contract; the action's injection is overlay) and could confuse a future reader who removes one and not the other.
**Fix:** Drop the action-side injection and rely on the schema default — the schema is the source of truth:
```typescript
// in parseAndValidate, REMOVE:
millLine: 'Premix' as const,
// keep the schema default in import-schema.ts
```

### IN-02: `parseAndValidate` error-path coalescing is hard to read

**File:** `src/actions/import.ts:165-172`
**Issue:** `path: (issue.path.join('.') || issue.path[0]?.toString()) ?? 'unknown'` is a defensive chain that handles three cases (multi-segment path, single-segment path, empty path), but the precedence is non-obvious — `||` vs `??` interaction needs a second read to verify. `issue.path.join('.')` already returns `''` for empty paths, which is falsy, so the `||` branch handles it; the `?? 'unknown'` only matters if `issue.path[0]` is `undefined`, which can only happen when `issue.path` is empty, in which case `join('.')` already returned `''`. The first fallback (`issue.path[0]?.toString()`) is unreachable as long as `issue.path` exists.
**Fix:** Simplify:
```typescript
path: issue.path.length > 0 ? issue.path.join('.') : 'unknown',
```

### IN-03: `decisions.skipRows.includes(rowIndex)` is O(n) per row; large decision sets are O(n*m)

**File:** `src/actions/import.ts:464, 475`
**Issue:** Out of v1 review scope (performance), but worth noting for a future tune-up: when the operator skips/overwrites hundreds of rows, the `Array.prototype.includes` lookups dominate the in-loop overhead. Converting to `Set` once before the loop is a trivial change.
**Fix:**
```typescript
const skipSet = new Set(decisions.skipRows);
const overwriteSet = new Set(decisions.overwriteRows);
// then use .has(rowIndex) instead of .includes(rowIndex)
```

### IN-04: Test file mock dispatch is brittle (sequence-based `callN` keys)

**File:** `src/actions/__tests__/import-commit.test.ts:243-260, multiple test bodies`
**Issue:** The `mockInsert` dispatch keys on call-count (e.g., `if (idx === 4) return batches; if (idx % 2 === 0) return orders;`). Any future code change that adds a DB call inside `commitImportAction` (e.g., an additional read or audit row) breaks every test that hardcoded the sequence. The cleaner pattern would key on the table identity (`if (table === productionOrders)`) by importing the schema modules inside the test file (which is allowed — only the mocked `@/db` is intercepted). The current pattern is documented as a known compromise but is a real maintenance liability.
**Fix:** Refactor the dispatch to key on the table reference:
```typescript
import { productionOrders } from '@/db/schema/orders';
import { orderEvents } from '@/db/schema/events';
import { importBatches } from '@/db/schema/imports';

mockInsert.mockImplementation((table: unknown) => {
  if (table === productionOrders) return { values: mockInsertOrdersValues };
  if (table === orderEvents) return { values: mockInsertEventsValues };
  if (table === importBatches) return { values: mockInsertBatchesValues };
  throw new Error('Unknown table');
});
```

---

_Reviewed: 2026-05-13T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
