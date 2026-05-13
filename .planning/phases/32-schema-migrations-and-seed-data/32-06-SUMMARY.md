---
phase: 32-schema-migrations-and-seed-data
plan: "06"
subsystem: database
tags: [seed, runtime, tsx, truncate, insert, data]
dependency_graph:
  requires: [32-04, 32-05]
  provides: [seed-runtime, db-seed-script]
  affects: [dev-database, package.json]
tech_stack:
  added: [tsx@4.21.0]
  patterns: [dotenv-cli-pattern, drizzle-parameterized-insert, truncate-cascade-idempotency]
key_files:
  created:
    - src/db/seed.ts
  modified:
    - package.json
    - package-lock.json
decisions:
  - "D-16: npm run db:seed → tsx src/db/seed.ts; seed reads DATABASE_URL_UNPOOLED"
  - "D-17: users NOT truncated — would orphan Clerk-mapped rows once Phase 33 lazy-sync ships"
  - "D-17: TRUNCATE covers production_orders, order_events, import_batches only"
  - "dotenv config() called before neon() client construction (module-load ordering)"
  - "As-any cast on seedData insert is acceptable — shape validated in Plan 05 tests"
metrics:
  duration: "~3 minutes"
  completed: "2026-05-13"
  tasks_completed: 2
  tasks_total: 3
  files_created: 1
  files_modified: 2
---

# Phase 32 Plan 06: Seed Runtime (tsx + db:seed + seed.ts) Summary

## One-liner

Seed runtime built: tsx installed, db:seed script wired, src/db/seed.ts TRUNCATEs three transactional tables then bulk-inserts 33 orders from static JSON via parameterized Drizzle — awaiting operator gate for live execution.

## Completed Tasks

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Install tsx + add db:seed script | 080b97a | package.json, package-lock.json |
| 2 | Author src/db/seed.ts (TRUNCATE + bulk insert) | a2a80a1 | src/db/seed.ts |

## Task 3: CHECKPOINT REACHED (operator gate)

Task 3 (`npm run db:seed` against the Neon dev DB) is a `checkpoint:human-action gate="blocking"` — the executor stopped before issuing the seed command. The operator must run the seed and verify the row counts.

## Implementation Notes

### src/db/seed.ts structure

1. All imports at top (static module discipline)
2. `config({ path: path.resolve(__dirname, '../../.env.local') })` called immediately (two-level depth from `src/db/` to repo root — mirrors `drizzle.config.ts` which is at repo root with single-level depth)
3. Env guard: throws if `DATABASE_URL_UNPOOLED` absent, with same error message style as drizzle.config.ts
4. `neon(process.env.DATABASE_URL_UNPOOLED!)` + `drizzle({ client })` — direct connection, not pooled
5. `TRUNCATE production_orders, order_events, import_batches RESTART IDENTITY CASCADE` — exact SQL, no users
6. `db.insert(productionOrders).values(seedData as any)` — Drizzle parameterized, no SQL concatenation
7. Top-level `.catch()` exits with code 1 on failure

### D-17 Invariant Enforcement

`grep -c 'TRUNCATE.*users' src/db/seed.ts` → **0** (confirmed)

The word "users" appears exactly once in the file, inside a comment explaining why users is excluded. The TRUNCATE SQL template literal contains no reference to the users table.

### Security (T-32-01, T-32-03, T-32-05)

- T-32-01 (SQL injection via seed data): Mitigated — `db.insert().values()` always parameterizes; no `db.execute(sql\`INSERT ...\`)` with interpolation
- T-32-03 (TRUNCATE against wrong DB): Mitigated — Task 3 is checkpoint:human-action; operator confirms before execution; DATABASE_URL_UNPOOLED points to dev branch only
- T-32-05 (users truncated): Mitigated — TRUNCATE list is a literal string with no users; grep confirms 0 matches

## Deviations from Plan

None — plan executed exactly as written. The import ordering comment in PATTERNS.md ("Imports AFTER dotenv config") was interpreted correctly: all `import` declarations are at the top (TypeScript static module discipline), with `config()` called first in the module body so it runs before the `neon()` client construction at line 24.

## Success Criteria Status

- [x] `tsx` in `devDependencies` at `^4.21.0`
- [x] `package.json` scripts contain `"db:seed": "tsx src/db/seed.ts"`
- [x] `package.json` does NOT contain `"db:push"` (D-23 ban preserved)
- [x] `src/db/seed.ts` exists with all required invariants
- [x] `npx tsc --noEmit` exits 0
- [ ] OPERATOR-GATED: `npm run db:seed` — CHECKPOINT REACHED, executor stopped
- [x] SUMMARY.md created

## Known Stubs

None. The seed runtime is complete and functional. The only pending item is the operator-gated execution (Task 3).

## Self-Check

Checking created files and commits exist.
