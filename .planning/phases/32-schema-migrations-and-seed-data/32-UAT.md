---
status: complete
phase: 32-schema-migrations-and-seed-data
source:
  - 32-01-SUMMARY.md
  - 32-02-SUMMARY.md
  - 32-03-SUMMARY.md
  - 32-04-SUMMARY.md
  - 32-05-SUMMARY.md
  - 32-06-SUMMARY.md
started: 2026-05-13T16:20:01Z
updated: 2026-05-13T16:27:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Cold Start Smoke Test
expected: From a clean shell, `npm run db:migrate` then `npm run db:seed` both exit 0 with no errors. Seed inserts 33 rows.
result: pass

### 2. Database Query Sanity
expected: After seed, the dev Postgres has exactly 33 rows in `production_orders`. Mill line distribution is 11/11/11 across Premix/Excel/CGM. State distribution covers Pending/Mixing/Completed/Blocked (no row has a NULL or invalid state).
result: pass

### 3. Seed Idempotency
expected: Running `npm run db:seed` a second time (immediately after first run) completes with exit 0 and row count is still exactly 33 in `production_orders` (TRUNCATE CASCADE wipes prior rows, then re-inserts). No FK violations from `order_events` cascade.
result: pass

### 4. users Table Untouched (D-17)
expected: Before/after a seed run, the `users` table row count is unchanged. (Manually insert a sentinel row if needed, run seed, confirm the row is still present. Or simply confirm the `users` table is NOT named in `seed.ts`'s TRUNCATE statement and is preserved on re-runs.)
result: pass

### 5. Demo UI Regression — /demo/mill-production
expected: Start the dev server (`npm run dev`) and load `http://localhost:3000/demo/mill-production`. The page renders the demo board with all 33 mock orders, mill lines (Premix/Excel/CGM) and states (Pending/Mixing/Completed/Blocked) display correctly. The type rename (`ProductionOrder` → `DemoOrder`) did not break rendering or interactions.
result: issue
reported: |
  CSS parse error in src/app/globals.css around line 1794:
  `.text-\[var\(--text-\*\)\] { color: var(--text-*); }` —
  "Unexpected token Delim('*')". Import trace: globals.css → layout.tsx.
severity: major
notes: Pre-existing globals.css issue surfaced during Phase 32 UAT — Phase 32 did not modify globals.css. The bug is a Tailwind-arbitrary-value class with a literal `*` in a CSS value, which PostCSS rejects.

### 6. drizzle-kit push Banned
expected: `package.json` has no `db:push` script and the project never invokes `drizzle-kit push`. The available DB scripts are exactly: `db:generate`, `db:migrate`, `db:seed`.
result: pass

## Summary

total: 6
passed: 5
issues: 1
pending: 0
skipped: 0

## Gaps

- truth: "Loading /demo/mill-production should render without CSS parse errors in globals.css"
  status: failed
  reason: "User reported: CSS parse error in src/app/globals.css line 1794 — `.text-\\[var\\(--text-\\*\\)\\] { color: var(--text-*); }` — Unexpected token Delim('*'). Import trace: globals.css → layout.tsx."
  severity: major
  test: 5
  artifacts:
    - src/app/globals.css
    - src/app/layout.tsx
  missing: []
  notes: "Pre-existing — Phase 32 did not modify globals.css. Surfaced during demo UI regression UAT but originates outside Phase 32 scope (likely from an earlier MIG / design-system phase that introduced .text-[var(--text-*)] Tailwind classes)."
