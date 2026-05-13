---
phase: 32
slug: schema-migrations-and-seed-data
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-13
---

# Phase 32 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution. Derived from `32-RESEARCH.md` § Validation Architecture.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 30.3.0 + ts-jest |
| **Config file** | `jest.config.js` (root) |
| **Quick run command** | `npm test -- --testPathPattern="src/db"` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~5s (quick) / ~30s (full) |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --testPathPattern="src/db"`
- **After every plan wave:** Run `npm test` (full Jest suite) + `npx tsc --noEmit`
- **Before `/gsd-verify-work`:** Full suite must be green + SC#4 row count verified manually
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------------|-----------|-------------------|-------------|--------|
| TBD | schema-tables | 1 | DATA-02 | server-only schema modules | unit | `npm test -- --testPathPattern="schema/orders"` | ❌ W0 | ⬜ pending |
| TBD | schema-events | 1 | DATA-03 | FK + ON DELETE CASCADE | unit | `npm test -- --testPathPattern="schema/events"` | ❌ W0 | ⬜ pending |
| TBD | schema-imports | 1 | DATA-04 | n/a | unit | `npm test -- --testPathPattern="schema/imports"` | ❌ W0 | ⬜ pending |
| TBD | schema-users | 1 | DATA-05 | clerk_user_id text, no FK | unit | `npm test -- --testPathPattern="schema/users"` | ❌ W0 | ⬜ pending |
| TBD | migration-generate | 2 | DATA-06 | no `drizzle-kit push` | unit | `npm test -- --testPathPattern="migration"` | ❌ W0 | ⬜ pending |
| TBD | seed-json + seed-script | 2 | DATA-07 | TRUNCATE preserves `users` | unit | `npm test -- --testPathPattern="seed"` | ❌ W0 | ⬜ pending |
| TBD | type-rewrite | 1 | D-04 | n/a | ts-build | `npx tsc --noEmit` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

*Task IDs are filled in by the planner once `*-PLAN.md` files exist; this table is a contract for what each plan must produce.*

---

## Wave 0 Requirements

- [ ] `src/db/schema/__tests__/orders.test.ts` — covers DATA-02 (export shape + type + enum values)
- [ ] `src/db/schema/__tests__/events.test.ts` — covers DATA-03 (FK CASCADE + composite index name)
- [ ] `src/db/schema/__tests__/imports.test.ts` — covers DATA-04
- [ ] `src/db/schema/__tests__/users.test.ts` — covers DATA-05 (text PK, no FK to clerk)
- [ ] `src/db/__tests__/seed-data.test.ts` — covers DATA-07 (33 rows, NOT NULL fields)
- [ ] `src/db/__tests__/migration.test.ts` — covers DATA-06 (`./drizzle/0000_*.sql` file-existence + CREATE TABLE / CREATE TYPE / CREATE INDEX assertions)
- [ ] `tsx` devDependency installed (blocks seed script)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Seed populates 33 rows in live dev DB | DATA-07 (runtime) | Requires Neon dev DB credentials; not run in CI | `npm run db:seed` then `psql $DATABASE_URL_UNPOOLED -c "SELECT count(*) FROM production_orders"` → expect `33` |
| Re-runnable from scratch (`drizzle-kit drop` + `migrate`) | SC#3 | Destructive — requires scratch Neon branch | Operator playbook in `32-RESEARCH.md` § Verification Playbook |
| `drizzle-kit introspect` confirms four tables + enum types + four indexes exist | SC#1 | Requires live DB | `npx drizzle-kit introspect` or `psql -c "\d production_orders"` |
| `version INTEGER DEFAULT 1` present; no FK on `clerk_user_id` columns | SC#2 | Schema-level assertion best done against live introspection | `psql -c "\d production_orders"` then inspect column + constraint list |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (6 test files + `tsx` install)
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
