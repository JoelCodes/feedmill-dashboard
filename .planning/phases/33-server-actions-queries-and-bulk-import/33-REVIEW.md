---
phase: 33-server-actions-queries-and-bulk-import
reviewed: 2026-05-14T00:00:00Z
depth: standard
files_reviewed: 5
files_reviewed_list:
  - scripts/test-concurrent-transition.ts
  - scripts/test-xlsx-import.ts
  - src/actions/__tests__/import-commit.test.ts
  - src/actions/__tests__/import-preview.test.ts
  - src/actions/import.ts
findings:
  critical: 2
  warning: 9
  info: 6
  total: 17
status: issues_found
---

# Phase 33: Code Review Report (Re-Review — Gap-Closure Wave)

**Reviewed:** 2026-05-14
**Depth:** standard
**Files Reviewed:** 5
**Status:** issues_found

## Scope Note

This re-review covers only the narrowed gap-closure wave (plans 33-07 through
33-11): the two live-DB harness scripts (33-07/33-08), the XLSX action patches
for `parserErrors` undefined-guard (33-10) and the `readXlsxFile → readSheet`
migration (33-11), and the corresponding action tests. The prior `33-REVIEW.md`
findings on `transitions.ts`, `import-schema.ts`, and the queries module are out
of scope here; no code changes for those files since the prior review.

## Summary

The gap-closure wave correctly migrates to `read-excel-file` v9.x `readSheet`,
adds discriminated-union guards (`objects ?? []`, `errors ?? []`, null-row
skip), and gates the overwrite UPDATE on `version` (CR-02). Tests have been
extended for the v9.x shape and CR-02/CR-03/CR-04 invariants.

Two **BLOCKER** issues were found in the live-DB harness scripts: the cleanup
`finally` block is bypassed on the success path because `process.exit(0)` is
called inside the `try`, so committed harness rows persist in the dev DB after
a successful run. This defeats the entire sentinel-cleanup design — the
"self-cleaning" contract in both harness headers is false on the happy path
and only works incidentally on the next run via `preDeleteSentinelRows()`.

A second cluster of warnings centers on the v9.x mock typing in
`import-commit.test.ts` (mutable module-scope state with dead code paths),
weak negative-branch assertions in the `GAP-04/GAP-05` tests (they accept
either success or any of two error codes — a regressed implementation could
crash with `TypeError` surfacing as `code: 'server'` and the test would still
pass), and one harness-only schema correctness gap (Book1.xlsx has no
`Product` column; the harness injects `'unknown'` while the production action
reports a Zod validation error — divergent paths).

## Critical Issues

### CR-01: `process.exit(0)` inside try block bypasses `finally` cleanup — orphans harness rows on success

**File:** `scripts/test-xlsx-import.ts:531-542`, `scripts/test-concurrent-transition.ts:391-402`
**Issue:** Both harness scripts use the pattern

```ts
(async () => {
  try {
    await main();
    console.log('PASS: ...');
    process.exit(0);             // <-- terminates here; finally never runs
  } catch (err) {
    console.error('FAIL:', err);
    process.exitCode = 1;
  } finally {
    await cleanup();             // <-- only runs on the failure path
  }
})();
```

`process.exit(0)` synchronously terminates the Node process. The pending
`finally` block contains an `await db.delete(...)` — that awaited promise
cannot resolve before the process exits, so `cleanup()` does not run on the
success path. On a passing run, every row inserted by the harness
(`production_orders`, `order_events`, and `import_batches` for
`test-xlsx-import`; `production_orders` for `test-concurrent-transition`)
remains in the dev DB under its sentinel.

Both file headers advertise a self-cleaning contract — "every successful (and
failed) run leaves zero residue" (`test-concurrent-transition.ts:52-56`) and
"the finally block re-runs the same deletes so every successful (and failed)
run leaves zero residue" (`test-xlsx-import.ts:46-49`). **This contract is
false on the happy path.** Cleanup only works on the failure path (where
`process.exit()` is not called) and incidentally via the next run's
`preDeleteSentinelRows`. Running the harness once and then querying the dev DB
will show residue.

Secondary risk: the `test-xlsx-import` `import_batches` row that is left
behind on success is a real audit row pointing at `fileName: 'Book1.xlsx'`
with `importedBy: 'harness-xlsx-test'`. If a code path later filters batches
by `fileName` rather than `importedBy`, the leaked rows pollute the view.

**Fix:** Drop the early `process.exit(0)` and let `finally` run before the
implicit exit. Set `process.exitCode = 0` if you want to be explicit:

```ts
(async () => {
  try {
    await main();
    console.log('PASS: ...');
    process.exitCode = 0;
  } catch (err) {
    console.error('FAIL:', err);
    process.exitCode = 1;
  } finally {
    await cleanup();
  }
  // implicit process.exit(process.exitCode) once event loop drains
})();
```

If a hard exit is required (e.g., to defeat lingering Neon HTTP keepalives),
move `process.exit(process.exitCode)` to AFTER an explicit `await cleanup()`
inside the `try` block, OR move cleanup ahead of the `process.exit` call:

```ts
try {
  await main();
  console.log('PASS: ...');
} catch (err) { ... }
await cleanup();         // outside the try/finally — always runs
process.exit(process.exitCode ?? 0);
```

---

### CR-02: Concurrent-race harness has a secondary leak window if `seedRaceOrder` fails mid-roundtrip

**File:** `scripts/test-concurrent-transition.ts:338-388, 391-402`
**Issue:** Beyond the shared `process.exit(0)` BLOCKER in CR-01, `main()` in
the concurrent-race harness intentionally does NOT clean up after its
top-level `preDeleteSentinelRows()` call on the success path — the only
cleanup is the per-iteration `deleteSeed(seed.id)` in the loop's `finally`.
That per-iteration delete keys on `seed.id` (the row inserted by the current
loop iteration). If `seedRaceOrder()` itself throws AFTER its `INSERT` has
committed but BEFORE the `RETURNING` resolves (transient Neon HTTP error
during the round-trip — rare but the entire premise of the race harness is
testing transient behavior), the harness has no reference to `seed.id` to
delete, the loop's per-iteration `finally` is not entered (no `seed`
in scope), and the outer cleanup is also skipped by `process.exit(0)` per
CR-01.

The sentinel-keyed `cleanup()` would otherwise catch the orphan, but it
cannot run on success and is the only safety net for this edge case.

**Fix:** Address CR-01 (`process.exit(0)` removal) which makes the outer
sentinel-keyed `cleanup()` actually run on success — that single fix closes
this hole as well. Optionally, ALSO wrap the `seedRaceOrder()` call in its
own try-catch that defensively logs the orderNumber so an operator can
sentinel-delete by hand if the cleanup itself fails:

```ts
let seed: { id: string; version: number } | undefined;
try {
  seed = await seedRaceOrder(i);
  ...
} finally {
  if (seed) await deleteSeed(seed.id);
}
```

## Warnings

### WR-01: GAP-05 regression tests accept "success OR generic server error" — fail-open against future bugs

**File:** `src/actions/__tests__/import-commit.test.ts:1222-1257`, `src/actions/__tests__/import-preview.test.ts:498-534`
**Issue:** Test 28 (commit) and Test 18 (preview) both target the
`ParseSheetDataResultError` discriminated-union branch where
`readSheet` returns `{ objects: undefined, errors: [...] }`. Both assertions
accept multiple outcomes:

```ts
expect(result).toBeDefined();
if (result.ok) {
  expect(result.committedCount).toBe(0);
} else {
  expect(['server', 'validation']).toContain(result.code);
}
```

A regressed implementation that crashes with `TypeError: Cannot read properties
of undefined (reading 'length')` would be caught by the outer try/catch and
surface as `{ ok: false, code: 'server', message: 'Failed to ...' }`. The test
would still pass — exactly the bug the test was added to prevent. The "no
TypeError unhandled" comment is misleading: a TypeError IS handled (by the
outer catch) and produces `code: 'server'`, which is in the accepted set.

**Fix:** Assert the intended behavior precisely. The GAP-05 contract is that
the action returns `ok: true` with the parser errors surfaced as per-row
`errors[]` (or as synthetic error rows for preview). Tighten the test to:

```ts
expect(result.ok).toBe(true);
if (result.ok) {
  expect(result.committedCount).toBe(0);
  expect(result.failedCount).toBe(0);  // parser errors are not "failed inserts"
  // (for preview) the synthetic error row must surface
  expect(result.rows.some((r) => r.errors && r.errors.length > 0)).toBe(true);
}
```

To regression-protect against `code: 'server'` masking, also explicitly assert:

```ts
if (!result.ok) {
  fail(`Expected ok:true (parser error branch should not crash); got ${result.code}: ${result.message}`);
}
```

### WR-02: Test 26 (WR-04 blank-name normalization) accepts the default `'blob'` and never exercises the normalization branch

**File:** `src/actions/__tests__/import-commit.test.ts:1144-1175`
**Issue:** The test description says "blank file.name is normalized to
`'unknown.xlsx'`", but the assertion is

```ts
expect(['blob', 'unknown.xlsx']).toContain(batchArg.fileName);
```

`FormData.set('file', blob)` always wraps a `Blob` as `'blob'`. The action's
WR-04 normalization (`rawName.trim().length > 0 ? rawName.slice(0, 255) :
'unknown.xlsx'`) sees `'blob'` (length > 0) and passes it through. The test
ALWAYS hits the `'blob'` branch and never observes the `'unknown.xlsx'`
fallback — even though the test claims to verify that fallback. If the
normalization regressed (e.g., removed entirely), the test would still pass.

**Fix:** Use a name that the action's logic genuinely treats as blank.
Construct a `File` (not `Blob`) with an empty or whitespace-only name:

```ts
const file = new File([new Uint8Array(100)], '   ', {
  type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
});
const formData = new FormData();
formData.set('file', file);

await commitImportAction(formData, noDecisions);

const batchArg = mockInsertBatchesValues.mock.calls[0][0] as Record<string, unknown>;
expect(batchArg.fileName).toBe('unknown.xlsx');  // exactly, not "either-or"
```

### WR-03: `import.ts` non-null asserts `userId!` on the `auth()` return — silent NOT NULL DB violation if Clerk shape drifts

**File:** `src/actions/import.ts:548, 706, 734, 745, 785`
**Issue:** After `await requireRole('mill_operator')`, the code calls
`const { userId } = await auth()` and then uses `userId!` (non-null assertion)
in five DB inserts. `requireRole` is documented to throw if there is no
authenticated user, but `requireRole` and `auth()` are TWO independent
imports. If `auth()` ever returns `{ userId: null }` while a session is
present (Clerk version drift, anonymous-with-role testing setup, a refactor
that returns a session with `userId: null` for organization-scoped tokens),
the inserts would push `null` into the `changedBy` / `created_by` /
`imported_by` NOT NULL columns and surface as a generic "server" error per
the outer catch — losing the per-row results array.

This is the same defensive posture issue that CR-04 (audit-row insert
wrapping) was added to address.

**Fix:** Guard once after destructuring and short-circuit cleanly:

```ts
const { userId } = await auth();
if (!userId) {
  return { ok: false, code: 'unauthorized', message: 'No authenticated user.' };
}
// ... no `!` needed on subsequent uses; userId is `string`
```

Then drop the `!` operators at lines 706, 734, 745, 785.

### WR-04: Harness `xlsxSchema` injects `product: 'unknown'` while production action surfaces missing-product as a Zod error — divergent path means harness does NOT exercise the real Zod failure surface

**File:** `scripts/test-xlsx-import.ts:240-253`
**Issue:** The harness header acknowledges (lines 239-245) that Book1.xlsx
has no `Product` column and that the production action treats this as a Zod
validation error per IMPORT-04. But the harness then **injects**
`product: 'unknown'` so every row passes Zod and the commit loop has work to
do. This means the harness proves the DB-driver path on a SYNTHETIC dataset
that diverges from the production parse pipeline. GAP-03's purpose
("Unit tests mock @/db; this harness hits the real Neon HTTP driver so
per-row auto-commit behavior and the UNIQUE constraint surface on
order_number are exercised end-to-end") is partly defeated — the harness
never exercises the production case where most rows would be Zod-rejected.

This is a scope-narrowing decision the harness author made consciously, but
it should be called out as a coverage gap rather than left to a single inline
comment.

**Fix:** Either (a) use a fixture XLSX that DOES have a Product column so the
harness mirrors the production parse path 1:1, or (b) add a second harness
that exercises the all-rows-Zod-fail path against the same DB to verify the
"no productionOrders inserts, no import_batches row, no order_events" contract.
At minimum, document in the harness header that GAP-03 closure is
partial — the no-Product-column scenario is not exercised by this harness
because of the `product: 'unknown'` injection.

### WR-05: `import-commit.test.ts` mutable module-scope state with dead code paths — fragile under parallel test runs / re-imports

**File:** `src/actions/__tests__/import-commit.test.ts:77-88, 184-262`
**Issue:** Module-level mutable state (`mockInsertCalls: unknown[]`,
`insertCallIndex`, `mockInsertDispatch`) plus `setupDefaultInsertDispatch`
(declared but never called from `beforeEach`) plus `resetInsertDispatch`
(declared but never called) create a confusing test harness. `mockInsertDispatch`
is initialized as a `let` arrow returning `mockInsertOrdersValues`, but every
test path then calls `mockInsert.mockImplementation(...)` directly, so the
`mockInsertDispatch` ref is dead. Future maintainers may add a test that
calls one of the setup helpers, expecting it to mutate state — but the
`beforeEach` block at line 246-262 rebinds `mockInsert.mockImplementation`
anyway, silently clobbering any setup the helper did.

The dispatch logic is also fragile across tests that change row count: the
"even idx = orders, odd idx = events, last idx = batches" heuristic in many
tests assumes a fixed call sequence and will silently mis-route inserts if
the action's call order ever changes (e.g., batch insert moves before the
per-row loop).

**Fix:** Either route inserts by **table identity** (import the schema
modules after the mock is in place and key on the actual imported references)
or by a per-test explicit map. Remove the dead `setupDefaultInsertDispatch`,
`resetInsertDispatch`, and `mockInsertDispatch` declarations. Centralize the
sequence logic in a single helper:

```ts
function dispatchInserts(plan: Array<'orders' | 'events' | 'batches'>) {
  let n = 0;
  mockInsert.mockImplementation((_table) => {
    const which = plan[n++];
    if (which === 'orders') return { values: mockInsertOrdersValues };
    if (which === 'events') return { values: mockInsertEventsValues };
    return { values: mockInsertBatchesValues };
  });
}
// per test:
dispatchInserts(['orders', 'events', 'orders', 'events', 'batches']);
```

This makes the expected call sequence explicit in each test and fails loudly
when the action diverges.

### WR-06: `xlsxSchema` cast as `Record<string, unknown>` (action) and `Record<string, any>` (harness) — type-safety of v9.x schema-aware return shape is unverified

**File:** `src/actions/import.ts:86, 160-166`, `scripts/test-xlsx-import.ts:140-151, 208-214`
**Issue:** Both the action and the harness define `xlsxSchema` as
`Record<string, unknown>` / `Record<string, any>` and then cast `readSheet`
to a hand-rolled `XlsxFn` signature via `readSheet as unknown as XlsxFn`.
The actual v9.x `Schema` type from
`node_modules/read-excel-file/index.d.ts` is parameterized and supports
overloads — the hand-rolled signature loses both compile-time guarantees:

1. If the upstream schema shape changes (e.g., a `validate` or `parse`
   callback is added that the action should provide), TypeScript will not
   complain.
2. `readSheet`'s declared return type carries a discriminated union via
   `ParseSheetDataResult` — the hand-rolled `{ objects: ...; errors: ... }`
   shape is structurally compatible but loses the discriminant. Tests must
   reproduce the cast (`as never`) on every mock return value, polluting
   every test setup.

**Fix:** Import the real `Schema` type from `read-excel-file` and use it for
the schema literal:

```ts
import { readSheet, Schema } from 'read-excel-file/node';

const xlsxSchema: Schema = {
  orderNumber: { column: 'Document Number', type: String },
  // ...
};

// then `readSheet(buffer, { schema: xlsxSchema })` types correctly without the cast
```

If the typed `Schema` import is not exported from the `/node` entry point,
file an upstream issue and TODO-tag the cast with a link.

### WR-07: `cleanup()` in test-xlsx-import.ts deletes `order_events` BEFORE `production_orders` — works but defeats the documented CASCADE verification

**File:** `scripts/test-xlsx-import.ts:282-296, 498-504`
**Issue:** The pre-delete and final-cleanup both delete in the order
`order_events → production_orders → import_batches`. The comments say
"explicit event delete is belt-and-suspenders — the CASCADE on the FK
handles it automatically, but being explicit confirms the FK cascade is
wired correctly." But by deleting events FIRST, the production_orders delete
no longer has any events to cascade — the CASCADE branch is never actually
exercised by the harness. If the FK CASCADE wiring was wrong (or
accidentally changed to `ON DELETE NO ACTION`), this harness would still
pass cleanup successfully.

**Fix:** Either reverse the order (delete `production_orders` FIRST; rely on
CASCADE to remove events; then verify zero events remain for the sentinel),
or add an explicit assertion that the orderEvents row count for the sentinel
drops to zero after the `productionOrders` delete:

```ts
const ordersDeleted = await db.delete(productionOrders)
  .where(eq(productionOrders.createdBy, HARNESS_CREATED_BY))
  .returning({ id: productionOrders.id });
// CASCADE verification: events for these orders must be gone
const [{ count }] = await db
  .select({ count: sql<number>`count(*)::int` })
  .from(orderEvents)
  .where(eq(orderEvents.changedBy, HARNESS_CREATED_BY));
if (count !== 0) {
  console.error(`CASCADE assertion failed: ${count} order_events remain for sentinel`);
}
const batchesDeleted = await db.delete(importBatches)...
```

### WR-08: `cleanup()` failure swallowed with `console.error` only — silent residue under chained errors

**File:** `scripts/test-xlsx-import.ts:493-509`, `scripts/test-concurrent-transition.ts:327-335`
**Issue:** Both `cleanup()` implementations catch any error from the
`db.delete(...)` chain and log via `console.error`. The function then
returns normally, the harness's `process.exitCode` is whatever the main path
set (1 on failure, otherwise the default 0). A failed cleanup leaves
sentinel rows in the dev DB AND does NOT influence the exit code, so the
caller (CI, an operator running the harness) cannot distinguish a clean
exit from a "cleanup-failed-residue-present" exit.

**Fix:** Set `process.exitCode = 1` when cleanup fails so the caller can
detect it:

```ts
} catch (err) {
  console.error('cleanup FAILED (residue may remain):', String(err));
  if (process.exitCode === undefined || process.exitCode === 0) {
    process.exitCode = 1;
  }
}
```

### WR-09: `dateToIsoString` (and its copy in the harness) uses `Date.toISOString().split('T')[0]` — UTC vs local-timezone footgun

**File:** `src/actions/import.ts:113-118`, `scripts/test-xlsx-import.ts:169-174`
**Issue:** `read-excel-file` parses Excel date cells assuming the local
timezone unless configured otherwise. `Date.prototype.toISOString()` returns
the UTC representation. A row with `Early Delivery Date = 2025-08-15` parsed
on a server in `America/New_York` produces a Date of
`2025-08-15T04:00:00.000Z`, and `.split('T')[0]` correctly yields `2025-08-15`.
But a row with `2025-08-15` parsed on a server in `Pacific/Auckland` (UTC+12)
produces a Date of `2025-08-14T12:00:00.000Z`, and `.split('T')[0]` yields
`2025-08-14` — silent off-by-one-day in storage.

The function's defensive `instanceof Date && !isNaN(...)` guard does not
address this. Server timezone is not explicitly configured anywhere in the
codebase visible from this review.

**Fix:** Use the UTC date components explicitly:

```ts
function dateToIsoString(d: unknown): string {
  if (!(d instanceof Date) || isNaN(d.getTime())) return '';
  // Use UTC components — d.toISOString() and d.getUTCFullYear() agree.
  // If you want LOCAL components, swap to getFullYear/getMonth/getDate AND
  // document the policy at the top of the action file.
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
```

OR pass `dateFormat: 'yyyy-mm-dd'` to `read-excel-file` so the parsed value
is a string in the desired format from the start, eliminating the
timezone-conversion step. This is also a duplication issue: the harness
copies `dateToIsoString` verbatim with the same flaw.

## Info

### IN-01: Sentinel constant name drift between code and task description

**File:** `scripts/test-xlsx-import.ts:110`
**Issue:** The orchestrator's `scope_note` says the harness self-cleans via
the `'harness-xlsx-import'` sentinel, but the actual constant in code is
`'harness-xlsx-test'`. The code is internally consistent (header comment,
constant, and WHERE clauses all use `'harness-xlsx-test'`). This is a
documentation mismatch only — flagging because it can confuse a future
operator looking at logs or running `DELETE FROM production_orders WHERE
created_by = 'harness-xlsx-import'` to clean up.
**Fix:** Update the plan/scope note to match the in-code constant
(`'harness-xlsx-test'`), or rename the constant to match the documented name
(but the constant is referenced in three sites — see header comment lines
124-131 of `test-concurrent-transition.ts` — so prefer fixing the doc).

### IN-02: `crypto.randomUUID()` (global) in action vs `randomUUID` from `node:crypto` (named import) in harness — minor inconsistency

**File:** `src/actions/import.ts:592`, `scripts/test-xlsx-import.ts:76, 336`, `scripts/test-concurrent-transition.ts:107, 193`
**Issue:** The action uses the global `crypto.randomUUID()` (available on
Node 19+ and the Next.js server runtime); the harness scripts use the named
import from `'node:crypto'`. Functionally identical, but the divergence is
load-bearing for environments without the global (e.g., older Node, jest
environments without `Web Crypto` polyfill). The unit tests under
`__tests__/` don't import `crypto`, so they inherit the action's global call
— in jest's jsdom env, this currently works on Node 19+ but is implicitly
coupled.
**Fix:** Pick one. If sticking with the global, add an explicit comment in
`import.ts` near line 592 noting the Node 19+ requirement; if sticking with
the import, change the action to `import { randomUUID } from 'node:crypto'`
for consistency.

### IN-03: Inlined Drizzle chains for "grep verify parity" trade readability for tooling

**File:** `scripts/test-xlsx-import.ts:287-289, 498-500`, `scripts/test-concurrent-transition.ts:184, 230, 330`
**Issue:** Multiple Drizzle chains are written on a single long line (e.g.,
`db.delete(...).where(...).returning({...})`) with comments citing
"grep verify parity." This means the plan-time verification grep is checking
literal strings rather than parsing the AST, and the code style is bent to
the grep. The result is harder to read at review time. If the verify
tooling could be upgraded to AST-aware checks (e.g., via `tsx` + a tiny AST
walker), the inline-chain accommodation could be retired.
**Fix:** None required for v2.0 — this is a deliberate trade-off documented
in 33-07/33-08 deviations. Track as tech debt: replace literal-string
verification with AST-aware verification at the next tooling pass.

### IN-04: Test 6b reads the source file to verify a SQL predicate — source-grep tests are brittle

**File:** `src/actions/__tests__/import-commit.test.ts:512-547`
**Issue:** Test 6b reads `import.ts` from disk and regex-matches
`eq(productionOrders.version, existing.version)`. This is the same
accommodation as IN-03 (verifying via grep rather than behavior). A small
refactor — e.g., extracting the WHERE predicate to a helper variable named
differently, or using `productionOrders["version"]` — would break the test
without breaking the behavior. Behavioral coverage (Test 6a: zero-rows
return → conflict result) is the stronger guarantee.
**Fix:** Keep Test 6a (behavioral, robust). Demote Test 6b to a comment in
6a (`// CR-02 source assertion verified by Test 6a's zero-rows path`) or
remove it.

### IN-05: `RACE_ITERATIONS = 5` comment overstates the operator's coverage

**File:** `scripts/test-concurrent-transition.ts:156-163`
**Issue:** The comment claims "Five iterations + two operator runs = ten
sample points" but the harness itself only runs five iterations — the
"two operator runs" is a procedural recommendation that lives in the plan,
not in the code. Reading the constant alone, a future operator would think
ten samples are guaranteed per invocation. Cosmetic only.
**Fix:** Tighten the comment to describe what the constant actually does:
"5 iterations per run; the plan recommends invoking the harness twice for a
total of 10 samples (T-33-08-FalsePositiveClose)."

### IN-06: Cleanup log field order does not match cleanup execution order

**File:** `scripts/test-xlsx-import.ts:292-295, 502-505`
**Issue:** The cleanup log message says

```ts
console.log(
  `step 3: preDeleteSentinelRows - deleted ${ordersDeleted.length} production_orders, ` +
  `${batchesDeleted.length} import_batches, ${eventsDeleted.length} order_events`
);
```

…but the deletes happen in the order `events, orders, batches`. The log is
factually accurate, but the column order in the log
(`orders, batches, events`) doesn't match the delete order, which can
confuse a reader correlating logs with the cleanup sequence.
**Fix:** Reorder the log fields to match the execution order, or label them
explicitly:

```ts
console.log(
  `step 3: preDeleteSentinelRows - deleted: events=${eventsDeleted.length}, ` +
  `orders=${ordersDeleted.length}, batches=${batchesDeleted.length}`
);
```

---

_Reviewed: 2026-05-14_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
