---
phase: 35
plan: 01
subsystem: schema
tags: [schema, migration, drizzle, seed, fixtures, early_delivery_date, tdd]
dependency_graph:
  requires: []
  provides: [earlyDeliveryDate-column, 0001-migration, seed-backfill, fixture-propagation]
  affects: [ProductionOrder-type, all-makeOrder-fixtures, KPI-08-query-surface]
tech_stack:
  added: []
  patterns: [PgDateString-nullable-column, drizzle-kit-generate-migrate, runtime-seed-injection]
key_files:
  created:
    - drizzle/0001_mute_champions.sql
    - drizzle/meta/0001_snapshot.json
  modified:
    - src/db/schema/orders.ts
    - src/db/schema/__tests__/orders.test.ts
    - src/db/seed.ts
    - src/components/MillColumn.test.tsx
    - src/components/BlockedAlertBand.test.tsx
    - src/components/ProductionDashboard.test.tsx
    - src/components/ProductionDrawer.test.tsx
    - src/components/TransitionButtons.test.tsx
    - src/components/ProductionCard.test.tsx
    - src/lib/__tests__/production-derivations.test.ts
    - drizzle/meta/_journal.json
decisions:
  - "Option B for seed backfill: runtime computation in seed.ts (not static JSON edits) — keeps seed-data.json immutable"
  - "PgDateString mode (no { mode: 'date' }) for date() column — TS infers string | null per PATTERNS.md"
  - "ProductionCard.test.tsx added to fixture propagation scope (not in plan but TypeScript surfaced it)"
metrics:
  duration: "5m"
  completed_date: "2026-05-15"
  tasks_completed: 3
  files_modified: 13
requirements-completed: [KPI-08]
---

# Phase 35 Plan 01: Schema Column + Migration + Seed Backfill + Fixture Propagation Summary

**One-liner:** Nullable `early_delivery_date date` column added via TDD red/green to Drizzle schema, Drizzle migration `0001_mute_champions` generated and applied to dev Neon DB, deterministic seed backfill using `(i % 11) - 5` formula, and `earlyDeliveryDate: null` propagated to all 7 `makeOrder` fixture files.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 (RED) | Schema test — assert earlyDeliveryDate nullable date | 0f4de67 | src/db/schema/__tests__/orders.test.ts |
| 1 (GREEN) | Add earlyDeliveryDate column to productionOrders schema | 96b9ee5 | src/db/schema/orders.ts, src/db/schema/__tests__/orders.test.ts |
| 1 (REFACTOR) | Propagate earlyDeliveryDate: null to all makeOrder fixtures | 23467a4 | 7 test fixture files |
| 2 | Generate + apply Drizzle migration 0001_mute_champions | 1d13904 | drizzle/0001_mute_champions.sql, drizzle/meta/* |
| 3 | Backfill earlyDeliveryDate in seed.ts (runtime computation) | 070e5fb | src/db/seed.ts |

## Schema Change (D-04)

**File:** `src/db/schema/orders.ts`

Lines added:
```typescript
// Import addition (line 12):
date,  // added to drizzle-orm/pg-core import

// Column addition (after lineCode, line 43):
earlyDeliveryDate: date('early_delivery_date'), // D-04: nullable date; PgDateString → TS: string | null
```

`ProductionOrder = typeof productionOrders.$inferSelect` now includes `earlyDeliveryDate: string | null`.

## Generated Migration

**Filename:** `drizzle/0001_mute_champions.sql`

**SQL content:**
```sql
ALTER TABLE "production_orders" ADD COLUMN "early_delivery_date" date;
```

- No DROP statements — purely additive
- Journal updated: 2 entries total (`0000_aromatic_stone_men`, `0001_mute_champions`)
- `drizzle/meta/0001_snapshot.json` committed alongside

## Migration Applied to Dev Neon DB

`drizzle-kit migrate` applied successfully:
```
[✓] migrations applied successfully!
```

**Live DB verification:**
```
psql: early_delivery_date | date | (nullable)
```

`SELECT COUNT(*) FROM production_orders WHERE early_delivery_date IS NULL` → 0 (after re-seed)

## Seed Backfill (D-06)

**Formula:** `earlyDeliveryDateFor(i: number)` → `today + (i % 11) - 5` days

Implementation in `src/db/seed.ts`:
```typescript
const today = new Date();
function earlyDeliveryDateFor(i: number): string {
  const d = new Date(today);
  d.setUTCDate(d.getUTCDate() + (i % 11) - 5);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
// Called as: earlyDeliveryDate: earlyDeliveryDateFor(i)
```

**Example for i=0:** offset = (0 % 11) - 5 = -5 → `today - 5 days` (overdue)
**Example for i=5:** offset = (5 % 11) - 5 = 0 → `today` (exactly today)
**Example for i=10:** offset = (10 % 11) - 5 = 5 → `today + 5 days` (upcoming)

**Post-seed verification:**
- NULL count: 0 (all 33 rows populated)
- Overdue count: 15 (orders with early_delivery_date < CURRENT_DATE)
- Phase 32 D-07 TRUNCATE protection preserved: `users` table NOT in TRUNCATE list
- `seed-data.json` unchanged (Option B: runtime computation)

## Fixture Propagation (Pitfall 3)

Seven files updated with `earlyDeliveryDate: null` in their `makeOrder` factory or fixture object:

| File | Change |
|------|--------|
| `src/components/MillColumn.test.tsx` | Added `earlyDeliveryDate: null,` to makeOrder factory |
| `src/components/BlockedAlertBand.test.tsx` | Added `earlyDeliveryDate: null,` to makeOrder factory |
| `src/components/ProductionDashboard.test.tsx` | Added `earlyDeliveryDate: null,` to makeOrder factory |
| `src/components/ProductionDrawer.test.tsx` | Added `earlyDeliveryDate: null,` to makeOrder factory |
| `src/components/TransitionButtons.test.tsx` | Added `earlyDeliveryDate: null,` to makeOrder factory |
| `src/lib/__tests__/production-derivations.test.ts` | Added `earlyDeliveryDate: null,` to makeOrder factory |
| `src/components/ProductionCard.test.tsx` | Added `earlyDeliveryDate: null,` to fixtureOrder literal (deviation) |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical functionality] ProductionCard.test.tsx fixture propagation**
- **Found during:** Task 1 Step 3 (REFACTOR)
- **Issue:** `ProductionCard.test.tsx` uses a direct `ProductionOrder` object literal (not a `makeOrder` factory). TypeScript `tsc --noEmit` surfaced it as a missing `earlyDeliveryDate` error (TS2741). The plan listed 6 files but this file was not included.
- **Fix:** Added `earlyDeliveryDate: null,` to `fixtureOrder` object in `ProductionCard.test.tsx`
- **Files modified:** `src/components/ProductionCard.test.tsx`
- **Commit:** 23467a4

### Schema Test Column Count Update

The existing schema test asserted "14 required columns" — with `early_delivery_date` added, the count becomes 15. Updated the test description and column list to match. This is an expected consequence of the schema addition, not a deviation.

### Pre-existing TypeScript Errors (Out of Scope)

The following pre-existing TypeScript errors exist in the codebase and were NOT introduced by this plan:
- `BlockedAlertBand.tsx(44)`: nuqs Promise return type mismatch
- `ProductionDashboard.test.tsx(76)`: duplicate `id` key in spread
- `schema/__tests__/events.test.ts(55)` and `orders.test.ts(87,94,99)`: Drizzle index config type inference

These are documented and deferred per deviation scope boundary rules.

### Pre-existing Test Failures

14 failures in `src/app/settings/__tests__/page.test.tsx` — pre-existing ClerkProvider failures documented in STATE.md as "D-04 deferred from Phase 27". Not caused by this plan.

## Verification Results

| Check | Result |
|-------|--------|
| `npx jest "schema/__tests__/orders.test"` | 16/16 tests pass |
| `npx tsc --noEmit` (earlyDeliveryDate errors) | 0 errors |
| `npm test` | 753 pass, 14 pre-existing failures (settings page) |
| `ls drizzle/0001_*.sql` | drizzle/0001_mute_champions.sql |
| `grep -c '"tag"' drizzle/meta/_journal.json` | 2 |
| `grep -c "earlyDeliveryDate" src/db/seed.ts` | 3 |
| Live DB NULL count | 0 (all 33 rows have early_delivery_date) |
| Live DB overdue count | 15 (KPI-08 has visible overdue data) |

## TDD Gate Compliance

| Gate | Commit | Status |
|------|--------|--------|
| RED — test(35-01) | 0f4de67 | PASS |
| GREEN — feat(35-01) | 96b9ee5 | PASS |
| REFACTOR — refactor(35-01) | 23467a4 | PASS |

## Known Stubs

None. All schema, migration, seed, and fixture changes are complete and functional.

## Threat Flags

None. No new network endpoints, auth paths, or schema changes at trust boundaries beyond the planned `early_delivery_date` nullable column addition (T-35-01-01 through T-35-01-06 covered in the plan's threat model).

## Self-Check: PASSED

- `src/db/schema/orders.ts` — EXISTS and contains `earlyDeliveryDate: date('early_delivery_date')`
- `drizzle/0001_mute_champions.sql` — EXISTS with `ALTER TABLE "production_orders" ADD COLUMN "early_delivery_date" date;`
- `drizzle/meta/_journal.json` — 2 tag entries confirmed
- `src/db/seed.ts` — earlyDeliveryDateFor helper defined and called
- All 5 plan commits exist in git log
- Live DB verified via psql: `early_delivery_date | date | nullable`
