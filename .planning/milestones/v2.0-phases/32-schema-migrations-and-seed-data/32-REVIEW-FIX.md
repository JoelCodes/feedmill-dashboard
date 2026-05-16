---
phase: 32-schema-migrations-and-seed-data
fixed_at: 2026-05-13T00:00:00Z
review_path: .planning/phases/32-schema-migrations-and-seed-data/32-REVIEW.md
iteration: 1
fix_scope: critical_warning
findings_in_scope: 15
fixed: 11
skipped: 4
status: partial
---

# Phase 32: Code Review Fix Report

**Fixed at:** 2026-05-13
**Source review:** `.planning/phases/32-schema-migrations-and-seed-data/32-REVIEW.md`
**Iteration:** 1
**Fix scope:** critical + blocker + warning (15 findings)

**Summary:**
- Findings in scope: 15 (3 Critical + 3 Blocker + 9 Warning)
- Fixed: 11
- Skipped: 4 (one architectural / deferred to Phase 33, one judgment-call deferred, one partially deferred for driver change, one CR-03 deferred pending alignment with CR-01)
- Status: partial (expected — see Critical guidance in task input)

All Phase-32-related Jest suites pass (80/80) after fixes. Pre-existing
test failures in `src/app/settings/__tests__/page.test.tsx` (14 failures
on `main`) are unrelated and were not introduced by this work.

---

## Fixed Issues

### BL-03 & WR-09: Tautological tailwind test + symlink recursion guard

**Files modified:** `src/__tests__/no-bad-tailwind-literals.test.ts`
**Commit:** `cd20d18`
**Applied fix:** Replaced `expect.arrayContaining([])` (a tautology that
matches every array) with the prior review's suggested
`expect(violations).toHaveLength(0)` after the throw guard, removing the
stale `eslint-disable jest/no-conditional-expect`. Added an
`entry.isSymbolicLink()` short-circuit in `walkFiles` to prevent infinite
recursion on symlink loops, addressing the prior review's WR-02
carry-over reflagged here as WR-09.

### BL-01: Replace tautological schema unit tests

**Files modified:**
- `src/db/schema/__tests__/orders.test.ts`
- `src/db/schema/__tests__/events.test.ts`
- `src/db/schema/__tests__/imports.test.ts`
- `src/db/schema/__tests__/users.test.ts`

**Commit:** `6847f71`
**Applied fix:** Replaced `expect(table).toBeDefined()` / `expect(true).toBe(true)`
patterns with real structural assertions using Drizzle's
`getTableConfig()` from `drizzle-orm/pg-core`. Each test now asserts:
column set, NOT NULL flags, default values, primary-key flags, column
types (PgUUID / PgText / PgEnumColumn / etc.), enum values in order,
foreign-key references (table + column + `onDelete: cascade` for events),
and index column targets + uniqueness. Test count across the four files
grew from 12 to 36, and the new tests will fail RED on column rename,
NOT NULL flip, FK cascade-mode drift, enum reorder, and index target
drift — all of which the previous tautological tests accepted silently.

### BL-02 & WR-08: Anchored migration regex assertions + readdirSync try/catch

**Files modified:** `src/db/__tests__/migration.test.ts`
**Commit:** `1fe42a8`
**Applied fix:** Replaced unanchored `.toContain(substring)` calls with
column- and constraint-anchored regex assertions:
- `DEFAULT 1` → `"version" integer DEFAULT 1 NOT NULL`
- `ON DELETE cascade` → anchored to the `order_events_order_id_production_orders_id_fk` FK constraint name
- `CREATE UNIQUE INDEX "idx_orders_order_number"` → anchored to `production_orders(order_number)`
- enum existence → enum values in expected lifecycle / canonical order
- new assertion 16: `weight_lbs numeric(10, 2) NOT NULL`

Also wrapped `readdirSync` in a try/catch (WR-08) so a missing `drizzle/`
directory produces a clear actionable error instead of a cryptic ENOENT
stack trace. Test count grew from 17 to 18 in this file; all 18 pass.

### WR-01, WR-02, WR-03, WR-04, partial CR-02: Harden seed.ts

**Files modified:** `src/db/seed.ts`
**Commit:** `d01b7a1`
**Applied fix:** Four related safety changes in one commit:

- **WR-01 / partial CR-02:** New `assertSafeToSeed()` function called as
  the first statement in `seed()`. It throws if the parsed
  `DATABASE_URL_UNPOOLED` hostname matches `/prod/i` (case-insensitive)
  or if `NODE_ENV === 'production'` without `ALLOW_SEED_IN_PRODUCTION=1`.
  This is the smaller half of CR-02 — it prevents accidental prod wipes
  but does not switch the runtime driver. JSDoc explicitly documents the
  full transactional fix as deferred (see Skipped Issues below).
- **WR-02:** Moved `process.exit(0)` out of the body of `seed()` into a
  `.then()` continuation so any future awaited cleanup (e.g. `pool.end()`
  if the CR-02 driver swap happens) can run on both success and failure.
- **WR-03:** Replaced inline literal-union types for `state` /
  `mill_line` in `SnakeRow` with `ProductionState` / `MillLine` imported
  from `./schema/orders`, so new enum values flow in automatically.
- **WR-04:** Added a runtime validator loop over `seedData` that checks
  state and mill_line against schema-derived enum value sets before
  insert, producing an actionable "Seed row N (order_number=X): invalid
  state Y" error rather than a Postgres-side enum violation deep inside
  bulk INSERT.

### WR-05: Initialize ordersByState / stateCounts accumulators explicitly

**Files modified:** `src/components/MillProductionUI.tsx`
**Commit:** `e2a5337`
**Applied fix:** Replaced `{} as Record<ProductionState, ...>` casts at
the initial-value position of both `STATE_ORDER.reduce()` calls with
explicit per-key initialization. This removes the landmine where a
future change shrinking `STATE_ORDER` would leave the type-system
believing all keys exist while the runtime returns `undefined` at the
read site, crashing `.reduce()` / `.map()` inside `StateSection`. The
six `MillProductionUI.test.tsx` tests continue to pass.

### WR-07: Tighten seed-data row shape assertion

**Files modified:** `src/db/__tests__/seed-data.test.ts`
**Commit:** `2c114c8`
**Applied fix:** Replaced the `toHaveProperty + not.toBeNull +
not.toBeUndefined` triple (where `toHaveProperty` is dead because it
also returns true for undefined values) with `toBeDefined + not.toBeNull
+ length > 0 for strings`. The length check rejects empty-string
sentinels that would silently pass NOT NULL but break callers expecting
non-empty values. All 10 seed-data tests continue to pass.

### CR-01: Document weightLbs string ↔ number boundary contract

**Files modified:**
- `src/db/schema/orders.ts` (ProductionOrder JSDoc)
- `src/types/millProduction.ts` (DemoOrder JSDoc)

**Commit:** `e3c8a76`
**Applied fix (requires human verification — see notes):**
Per the user's guidance ("the proper fix is to document the boundary"),
added matching JSDoc blocks to `ProductionOrder` (DB shape, `weightLbs:
string`) and `DemoOrder` (UI shape, `weightLbs: number`). Both note that
the `numeric(10, 2)` column is correct for inventory weight and must NOT
be downgraded, that the consumer side wants `number` for
`toLocaleString()` and arithmetic, and that the service-boundary
adapter `rows.map(r => ({...r, weightLbs: Number(r.weightLbs)}))` is the
canonical translation point (deferred to Phase 33). The JSDoc on both
sides preserves the contract without forcing a UI refactor in this
phase.

Note: This is a documentation-only fix to a Critical-level finding. The
actual silent type-fork still exists at runtime if Phase 33 forgets to
add the adapter; this fix relies on the next phase reading the JSDoc.
Flagging for human verification that the deferral is acceptable.

---

## Skipped Issues

### CR-02 (partial): TRUNCATE + INSERT transactional fix

**File:** `src/db/seed.ts:24-66`
**Reason:** The host-allowlist guard half of CR-02 was applied as part
of the WR-01..WR-04 commit (`d01b7a1`). The full transactional fix
(switching from `drizzle-orm/neon-http` → `drizzle-orm/neon-serverless`
Pool, then wrapping in `db.transaction(...)`) was deferred per task
guidance ("Prefer (a) as the smaller safer change unless the Pool
driver is already a project dep"). Pool/Serverless is not currently
used elsewhere; changing it would expand scope into Phase 33's DB-
wiring work.
**Original issue:** Each `.execute()` / `.insert()` over the Neon HTTP
driver auto-commits, so a TRUNCATE-then-INSERT failure leaves the DB
empty with no rollback path. The host-pattern + NODE_ENV guard now in
place prevents the production-wipe scenario; the inability to roll back
a partial dev/staging seed is the remaining residual risk.

### CR-03: weight_lbs precision drift (numeric(10,2) vs "6000" seed strings)

**Files:**
- `src/db/schema/orders.ts:36` (numeric column declaration)
- `src/db/seed-data.json` (`"weight_lbs": "6000"` no decimal)
- `scripts/export-seed.ts:29` (`String(o.weightLbs)`)

**Reason:** The two proposed fixes are mutually exclusive and pull in
opposite directions to CR-01:
- (a) Drop the decimal scale to `integer` / `numeric(10, 0)` — this
  conflicts with the CR-01 contract that the schema's `numeric(10, 2)`
  is intentional for financial-style decimal precision; downgrading
  here contradicts the JSDoc just added.
- (b) Normalize the exporter to `.toFixed(2)` and add a regex shape
  assertion — this changes the seed-JSON wire format, requires
  regenerating `seed-data.json`, and is exactly the kind of "touch
  files outside the original review scope" the task guidance asked me
  to avoid. The current `String(6000) === "6000"` is accepted by
  Postgres and round-trips fine for the current integer-valued seed
  data.

Deferring to a follow-up phase that can coherently decide the precision
policy alongside Phase 33's adapter implementation.
**Original issue:** Three representations of the same value coexist
(`number`, `"6000"`, `"6000.00"`) with no tests pinning down which
lives where; round-tripping integer strings through `numeric(10, 2)`
returns `"6000.00"` from Postgres, which downstream parsers must
handle.

### WR-06: formatWeight precision in MillProductionUI

**File:** `src/components/MillProductionUI.tsx:67-72, 120, 157`
**Reason:** Task guidance explicitly flagged this as "needs judgment —
defer if uncertain". The proposed fixes (one-decimal-place
`(lbs / 1000).toFixed(1)` vs full `.toLocaleString()` for the column
header vs `Math.floor` for one site) each change the visible
dashboard UI in ways that should ride along with the next visual-design
iteration, not be decided unilaterally in a code-review fix pass.
**Original issue:** `Math.round(lbs / 1000)` displayed as `"NK"` loses
up to 999 lbs of precision per side in the per-column "X / Y lbs"
header — visually acceptable for the per-state summary but arguably not
for the precise completed/total column metric.

### IN-* findings (all six Info severity)

**Reason:** `fix_scope: critical_warning` per `<config>` — Info findings
(IN-01 through IN-06) are deliberately out of scope for this iteration.

---

_Fixed: 2026-05-13_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
