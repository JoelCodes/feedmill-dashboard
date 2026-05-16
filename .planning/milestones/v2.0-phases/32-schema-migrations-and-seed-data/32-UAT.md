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
  - 32-07-SUMMARY.md
started: 2026-05-13T16:20:01Z
updated: 2026-05-16
resolved_by: 32-07-PLAN.md
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
  status: resolved
  resolved_by: 32-07-PLAN.md
  resolved_at: 2026-05-13T17:30:00Z
  resolution: "Plan 32-07 three-layer fix: (1) defused dangerous literal in 7 .planning/**/*.md files using `&ast;` escape, (2) replaced broken `@source not` glob in src/app/globals.css with `@import \"tailwindcss\" source(none);` + `@source \"../../src\";`, (3) added Jest enforcement gate `src/__tests__/no-bad-tailwind-literals.test.ts` so future recurrence fails CI. Verified: `npm run build` exit 0, zero CSS warnings; 3/3 enforcement tests pass; dev server smoke test on /sign-in returns HTTP 200 with no Build Error overlay."
  reason: "User reported: CSS parse error in src/app/globals.css line 1794 — `.text-\\[var\\(--text-\\*\\)\\] { color: var(--text-*); }` — Unexpected token Delim('*'). Import trace: globals.css → layout.tsx."
  severity: major
  test: 5
  root_cause: "Tailwind v4's `@source not` directive only accepts a directory path, not a file-level glob. The Phase 31-05 fix at `src/app/globals.css:4` (`@source not \"../../.planning/**/*\"`) uses an unsupported glob form and is silently a no-op. Tailwind's Oxide scanner then walks every non-gitignored file (`.planning/` is not in `.gitignore`), finds the literal `text-[var(--text-&ast;)]` in five `.planning/**/*.md` files, and emits a malformed CSS rule that LightningCSS rejects. Phase 31-05 went green by coincidence — scrubbing `18-UI-REVIEW.md` did the work; the glob change actually broke the directive."
  artifacts:
    - path: "src/app/globals.css:4"
      issue: "Broken `@source not` directive using unsupported file-level glob form"
    - path: ".planning/milestones/v1.5-phases/27-role-assignment-and-testing/deferred-items.md"
      issue: "Contains literal text-[var(--text-&ast;)] (lines 58, 61)"
    - path: ".planning/milestones/v1.5-phases/27-role-assignment-and-testing/27-05-SUMMARY.md"
      issue: "Contains literal text-[var(--text-&ast;)] (line 89)"
    - path: ".planning/milestones/v1.5-phases/27-role-assignment-and-testing/27-VERIFICATION.md"
      issue: "Contains literal text-[var(--text-&ast;)] (line 137)"
    - path: ".planning/phases/31-role-expansion-and-db-infrastructure/31-05-SUMMARY.md"
      issue: "Contains literal text-[var(--text-&ast;)] (line 77)"
    - path: ".planning/phases/32-schema-migrations-and-seed-data/32-UAT.md"
      issue: "Contains literal text-[var(--text-&ast;)] (gap-notes — quoting the bug)"
    - path: ".gitignore"
      issue: "Missing .planning/ entry — Oxide auto-includes by default"
  missing:
    - "Defuse literal `text-[var(--text-&ast;)]` in all five .planning/**/*.md files (replace `*` with `&ast;` inside inline code, or rewrite as plain prose). This is the durable layer — survives any future Tailwind config drift."
    - "Replace the broken `@source not \"../../.planning/**/*\"` in src/app/globals.css with a working exclusion: either directory form `@source not \"../../.planning\"`, OR `source(none)` + explicit positive `@source` for `src/`. Defense-in-depth layer."
  debug_session: .planning/debug/css-text-var-text-star-parse-fail.md
  notes: "Recurrence of Phase 27 deferred-items #4 and Phase 31-05 incident. This is the THIRD time this bug has surfaced. The fix must eliminate the latent literal in .md files AND repair the @source not directive — fixing only one layer leaves a landmine. Phase 32 itself did NOT introduce the bug, but Phase 32 markdown writing (e.g. SUMMARYs that quote past incidents) can trigger it just as Phase 18 UI review did originally."
