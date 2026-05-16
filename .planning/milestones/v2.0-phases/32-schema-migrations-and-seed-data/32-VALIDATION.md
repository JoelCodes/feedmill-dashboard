---
phase: 32
slug: schema-migrations-and-seed-data
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-05-13
audited: 2026-05-13
---

# Phase 32 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution. Derived from `32-RESEARCH.md` § Validation Architecture.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 30.3.0 + ts-jest |
| **Config file** | `jest.config.js` (root) |
| **Quick run command** | `npm test -- --testPathPatterns="src/db" --watchAll=false` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~1s (quick) / ~30s (full) |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --testPathPatterns="src/db" --watchAll=false`
- **After every plan wave:** Run `npm test` (full Jest suite) + `npx tsc --noEmit`
- **Before `/gsd-verify-work`:** Full suite must be green + SC#4 row count verified manually
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------------|-----------|-------------------|-------------|--------|
| 32-01-02 | schema-tables (orders) | 1 | DATA-02 | server-only schema modules | unit | `npm test -- --testPathPatterns="schema/orders" --watchAll=false` | ✅ | ✅ green |
| 32-01-03 | schema-events | 1 | DATA-03 | FK + ON DELETE CASCADE (live-verified via migration.test) | unit | `npm test -- --testPathPatterns="schema/events" --watchAll=false` | ✅ | ✅ green |
| 32-01-03 | schema-imports | 1 | DATA-04 | n/a | unit | `npm test -- --testPathPatterns="schema/imports" --watchAll=false` | ✅ | ✅ green |
| 32-01-03 | schema-users | 1 | DATA-05 | clerk_user_id text, no FK | unit | `npm test -- --testPathPatterns="schema/users" --watchAll=false` | ✅ | ✅ green |
| 32-04-01/02 | migration-generate | 2 | DATA-06 | no `drizzle-kit push`; FK CASCADE + indexes asserted | unit | `npm test -- --testPathPatterns="db/__tests__/migration" --watchAll=false` | ✅ | ✅ green |
| 32-05-02 + 32-06-02 | seed-json + seed-script | 2 | DATA-07 | TRUNCATE preserves `users`; 33-row JSON shape | unit | `npm test -- --testPathPatterns="db/__tests__/seed-data" --watchAll=false` | ✅ | ✅ green |
| 32-02 | type-rewrite | 1 | D-04 | n/a | ts-build | `npx tsc --noEmit` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `src/db/schema/__tests__/orders.test.ts` — covers DATA-02 (export shape + type + enum values) — 4 tests
- [x] `src/db/schema/__tests__/events.test.ts` — covers DATA-03 export surface; FK CASCADE asserted via `migration.test.ts` — 4 tests
- [x] `src/db/schema/__tests__/imports.test.ts` — covers DATA-04 — 2 tests
- [x] `src/db/schema/__tests__/users.test.ts` — covers DATA-05 (text PK, no FK to clerk) — 3 tests
- [x] `src/db/__tests__/seed-data.test.ts` — covers DATA-07 JSON shape (33 rows, NOT NULL fields, enum values, snake_case shape) — 10 tests
- [x] `src/db/__tests__/migration.test.ts` — covers DATA-06 (`./drizzle/0000_*.sql` existence + CREATE TABLE / CREATE TYPE / CREATE INDEX / ON DELETE cascade / composite-index assertions) — 17 tests
- [x] `tsx` devDependency installed (`package.json` — added in 32-06-01)

**Bonus (beyond Wave-0 contract):** `src/db/schema/__tests__/index.test.ts` — barrel re-export surface (5 tests).

**Total automated coverage:** 7 suites, 45 tests, all GREEN. Runtime ~0.9s.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Seed populates 33 rows in live dev DB | DATA-07 (runtime) | Requires Neon dev DB credentials; not run in CI | `npm run db:seed` then `psql $DATABASE_URL_UNPOOLED -c "SELECT count(*) FROM production_orders"` → expect `33` |
| Re-runnable from scratch (`drizzle-kit drop` + `migrate`) | SC#3 | Destructive — requires scratch Neon branch | Operator playbook in `32-RESEARCH.md` § Verification Playbook |
| `drizzle-kit introspect` confirms four tables + enum types + four indexes exist | SC#1 | Requires live DB | `npx drizzle-kit introspect` or `psql -c "\d production_orders"` |
| `version INTEGER DEFAULT 1` present; no FK on `clerk_user_id` columns | SC#2 | Schema-level assertion best done against live introspection | `psql -c "\d production_orders"` then inspect column + constraint list |

All four were live-verified by operator on 2026-05-13 (see `32-VERIFICATION.md` § Locked Decision Audit and § Success Criteria).

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (6 test files + `tsx` install)
- [x] No watch-mode flags (all commands use `--watchAll=false`)
- [x] Feedback latency < 30s (measured: 0.9s for `src/db` pattern)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** APPROVED — 2026-05-13

---

## Validation Audit 2026-05-13

| Metric | Count |
|--------|-------|
| Requirements audited | 7 (DATA-02..DATA-07 + D-04) |
| Test files expected | 6 (Wave-0 contract) + 1 ts-build |
| Test files present | 7 (6 contract + 1 bonus `index.test.ts`) |
| Suites run | 7 |
| Tests passed | 45 / 45 |
| Tests failed | 0 |
| Gaps found | 0 |
| Resolved | n/a (no gaps) |
| Escalated to manual-only | 0 (manual items unchanged from initial contract) |

**Notes:**
- `events.test.ts` covers the DATA-03 export surface (table + key columns). The "FK + ON DELETE CASCADE" behavior is asserted at the migration-SQL layer in `migration.test.ts` (Assertion 10). Coverage is satisfied through the combined unit + migration-contract pair.
- `seed-data.test.ts` validates the JSON snapshot shape (33 rows, NOT NULL fields, enum values, `version === 1`, snake_case keys, `created_by === 'system-seed'`). Live seed execution remains in Manual-Only and was operator-verified on 2026-05-13.
- The snake_case JSON → camelCase Drizzle property mapper added in `src/db/seed.ts` (commit `4655b30`) has no dedicated unit test; its behavior is covered transitively by the live operator-verified seed run. Future regression risk: if a new column is added to `productionOrders`, the mapper must be updated in tandem — flagged as a planning-process note in `32-VERIFICATION.md` § Deviations item 2.
