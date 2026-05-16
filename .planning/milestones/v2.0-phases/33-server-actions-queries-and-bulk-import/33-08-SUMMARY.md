---
phase: 33-server-actions-queries-and-bulk-import
plan: "08"
subsystem: testing
tags: [gap-closure, integration-harness, concurrent-race, optimistic-concurrency, live-db, neon-http, gap-01]

requires:
  - phase: 33-server-actions-queries-and-bulk-import
    plan: "04"
    provides: transitionToMixing optimistic-UPDATE shape, CONFLICT_MESSAGE constant (D-02 / SC#2)
  - phase: 33-server-actions-queries-and-bulk-import
    plan: "07"
    provides: scripts/_server-only-shim.mjs preload pattern, tsx --env-file invocation pattern, sentinel-cleanup harness convention

provides:
  - "scripts/test-concurrent-transition.ts: live-DB harness asserting exactly-one-winner + locked CONFLICT_MESSAGE for two concurrent UPDATE … WHERE version=1 calls"
  - "npm run test:concurrent-race: operator-invokable CLI entry point"
  - "GAP-01 closure path: 5-iteration race loop + 2-run operator protocol = 10 sample points"

affects:
  - phase: 33-verification
    reason: "GAP-01 — harness enables Postgres-level optimistic-concurrency atomicity claim to be exercised end-to-end once operator runs it"

tech-stack:
  added: []
  patterns:
    - "Concurrent-race harness pattern: seed → Promise.all(2x UPDATE WHERE version=N) → assert exactly 1 returns [{id}] and 1 returns [] → assert final version=N+1"
    - "Iteration loop (RACE_ITERATIONS=5) inside harness + 2 operator runs = 10 sample points to eliminate flaky-race false positives"
    - "Locked-string byte-equality assertion: harness CONFLICT_MESSAGE must match src/actions/transitions.ts byte-for-byte (D-02 contract)"

key-files:
  created:
    - scripts/test-concurrent-transition.ts
  modified:
    - package.json

key-decisions:
  - "Harness replicates the action's UPDATE statement verbatim (same Drizzle expression, same `sql\\`version + 1\\``, same `.returning({ id })` shape) instead of invoking transitionToMixing directly — Clerk's `auth()` requires request context unavailable in a Node CLI script. The gap is about DB-level atomicity, not authz semantics (T-33-08-NoAuth — accepted, same posture as 33-07)"
  - "Sentinel 'harness-race-test' (distinct from 33-07's 'harness-xlsx-test') scopes cleanup so the two harnesses coexist safely during concurrent debugging"
  - "Per-iteration deleteSeed + finally-block sentinel-keyed delete provides defense-in-depth idempotency"
  - "Used scripts/_server-only-shim.mjs preload pattern (33-07's established invocation) — plan suggested dynamic-import workaround that does not work because `server-only` package throws unconditionally outside an RSC bundler conditional regardless of static/dynamic import"
  - "RACE_ITERATIONS=5 + 2 operator runs = 10 sample points; concurrent UPDATE on Postgres is deterministic at SQL level but HTTP roundtrip timing could in principle mask the race, so multiple samples raise confidence"

patterns-established:
  - "Live-DB concurrent-race harness: seed at version=1 → Promise.all of 2 identical UPDATEs → assert one row each return shape → assert post-state row.version=2"
  - "Locked-string byte-equality assertion against a CONFLICT_MESSAGE constant duplicated from the action — drift surfaces as a clear failure with both expected and actual strings printed"

requirements-completed: []  # no requirements field on plan

duration: ~25 min
completed: 2026-05-14
checkpoint_status: "Task 3 (human-verify) PENDING — awaiting operator confirmation of live-DB run against Neon dev DB; .env.local DATABASE_URL is not present in this executor worktree so the harness run must happen in the operator's environment"
---

# Phase 33 Plan 08: Concurrent Transition Race Harness Summary

**Live-DB harness at `scripts/test-concurrent-transition.ts` (invokable via `npm run test:concurrent-race`) closes GAP-01 by firing two concurrent `UPDATE … WHERE version=1 RETURNING id` calls against the real Neon dev DB and asserting exactly one winner + the locked `CONFLICT_MESSAGE` ('Order was modified by another user. Please refresh.') byte-equal to `src/actions/transitions.ts` line 59 — 5 iterations per invocation × 2 operator runs = 10 sample points to eliminate flaky-race false positives.**

## Performance

- **Duration:** ~25 min (Tasks 1-2 automated; Task 3 awaiting operator)
- **Started:** 2026-05-14T (during this executor wave)
- **Completed (Tasks 1-2):** 2026-05-14
- **Tasks:** 2/3 complete (Task 3 is `checkpoint:human-verify` — awaiting operator)
- **Files modified:** 2

## Accomplishments

- Created `scripts/test-concurrent-transition.ts` (402 lines) with end-to-end harness: preDeleteSentinelRows → for(5 iterations) { seedRaceOrder → fireConcurrentTransitions (Promise.all of 2 doTransition calls) → assertExactlyOneWinner → assertFinalState → deleteSeed } → cleanup
- Harness replicates `src/actions/transitions.ts` line 110-114 UPDATE expression VERBATIM: `db.update(productionOrders).set({ state: 'Mixing', version: sql\`version + 1\` }).where(and(eq(id), eq(version, 1))).returning({ id })` — same Drizzle generated SQL the action emits, so the live-DB outcome here is the live-DB outcome the action would produce
- `CONFLICT_MESSAGE` constant byte-identical to `src/actions/transitions.ts` line 59 — locked D-02 string
- Sentinel `'harness-race-test'` (distinct from 33-07's `'harness-xlsx-test'`) appears in 8 sites (constant, doc references, insert createdBy, pre-delete WHERE, finally-delete WHERE)
- Added `"test:concurrent-race"` npm script entry adjacent to existing `test:xlsx-import`
- No files owned by plans 33-01..33-06 modified

## Task Commits

Each task was committed atomically:

1. **Task 1: Add scripts/test-concurrent-transition.ts harness** — `5aa2271` (feat)
2. **Task 2: Register npm script test:concurrent-race** — `0cf43e5` (chore)
3. **Task 3: CHECKPOINT — Operator runs concurrent-race harness against live Neon dev DB** — PENDING (awaiting operator confirmation)

**Plan metadata commit:** `<this commit>` (docs: complete plan)

## Files Created/Modified

- `scripts/test-concurrent-transition.ts` (NEW, 402 lines) — Live-DB concurrent-transition race harness; seeds one row at version=1, fires two concurrent UPDATEs via Promise.all, asserts exactly-one-winner + locked CONFLICT_MESSAGE, loops 5 iterations, self-cleaning via sentinel
- `package.json` — Added `test:concurrent-race` script entry (one line)

## Decisions Made

1. **Direct Drizzle vs action invocation:** `src/actions/transitions.ts:89` calls `await requireRole('mill_operator')` which calls Clerk's `auth()` from `@clerk/nextjs/server` — that throws without a request context (no HTTP headers/cookies in a Node CLI). The gap (GAP-01) is about Postgres-level optimistic-concurrency atomicity, NOT authorization. Direct Drizzle calls emit identical SQL and fully exercise the gap. Auth contract is unit-tested separately (33-04). Threat T-33-08-NoAuth — accepted, same posture as 33-07.

2. **Sentinel separation:** `'harness-race-test'` is distinct from 33-07's `'harness-xlsx-test'`. The two harnesses can run concurrently against the same dev DB without clobbering each other's rows.

3. **Per-iteration + finally cleanup (defense in depth):** Step 6 (deleteSeed) runs after every iteration to keep the table clean for the next run; the `finally` block runs a sentinel-keyed bulk delete to catch anything missed. FK CASCADE on order_events (events.ts line 11 — `onDelete: 'cascade'`) handles audit-row cleanup automatically.

4. **RACE_ITERATIONS=5 + 2 operator runs = 10 sample points:** Concurrent UPDATE conflicts on Postgres are deterministic at the SQL level (row locking + version-check WHERE), but the harness goes via two separate HTTP POSTs through neon-http — the timing-sensitive layer that *could* in principle race away from the SQL race. Five sequential iterations + two operator runs (independently described in Task 3's operator-facing instructions) produce ten samples; a flaky race would show non-uniform winner distribution that the operator can triage. Captured in threat T-33-08-FalsePositiveClose.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Plan's dynamic-import workaround does not work — switched to 33-07's `_server-only-shim.mjs` preload pattern**

- **Found during:** Task 1 (harness implementation) and Task 2 (npm script registration)
- **Issue:** The plan recommends "option (a): top-level await with dynamic import" to defer `@/db` import until after `loadDotenv()`. But `src/db/index.ts` line 1 is `import 'server-only'`. The npm `server-only` package (v0.0.1) has `index.js` consisting solely of `throw new Error(...)`. The package's `exports` field conditional `react-server` resolves to an empty `empty.js`, but only when a bundler (Next.js/Vite) sets the `react-server` resolution condition. Plain Node/tsx does NOT honor this condition — `import 'server-only'` resolves to `index.js` and throws unconditionally at module-load time. Whether the import is static or dynamic, hoisted or deferred, makes no difference: the throw happens when the module is evaluated, period.
- **Fix:** Reused the proven pattern from sibling plan 33-07: invoke via `tsx --env-file=.env.local --import ./scripts/_server-only-shim.mjs scripts/test-concurrent-transition.ts`. The `--import` flag preloads `scripts/_server-only-shim.mjs`, which patches `Module._resolveFilename` to route the `server-only` specifier to `scripts/_server-only-stub.cjs` (a no-op). This runs BEFORE the harness module's static imports resolve, so `import { db } from '@/db'` works. `--env-file` (Node 24's built-in flag, passed through by tsx) loads `.env.local` at the process level, making `DATABASE_URL` available before `src/db/index.ts` evaluates its env-guard. The harness still includes a belt-and-suspenders `loadDotenv({ path: '.env.local' })` at the top for ad-hoc `tsx scripts/test-concurrent-transition.ts` invocation outside the npm script.
- **Files modified:** `package.json` (npm script entry uses the shim invocation, not the plan's literal `tsx scripts/test-concurrent-transition.ts`)
- **Verification:** The plan's literal-string verify check `p.scripts['test:concurrent-race'] === 'tsx scripts/test-concurrent-transition.ts'` would FAIL on the working invocation — but the harness must actually run. The plan's must-have truth #1 ("The harness runs via `npm run test:concurrent-race`") takes precedence over a literal-string check. The actual invocation `tsx --env-file=.env.local --import ./scripts/_server-only-shim.mjs scripts/test-concurrent-transition.ts` is what makes the harness functional. This deviation mirrors 33-07's established pattern exactly.
- **Committed in:** `0cf43e5` (Task 2 commit)

**2. [Rule 1 - Bug] Multi-line Drizzle method chaining fails plan's literal grep verify — inlined to single-line form**

- **Found during:** Task 1 verification
- **Issue:** The plan's automated verify check `grep -F "db.update(productionOrders)"` requires the string on a single line. The natural Drizzle style (used in `src/actions/transitions.ts` itself) is multi-line method chaining: `await db\n    .update(productionOrders)\n    .set(...)\n    .where(...)\n    .returning(...)`. The single-line `grep -F` cannot match that. Same issue for `db.delete(productionOrders)`. Same situation 33-07 surfaced (its deviation #2).
- **Fix:** Inlined the `db.update(productionOrders).set(...).where(...).returning(...)` chain to a single line in `doTransition`, and the `db.delete(productionOrders).where(...).returning(...)` chain to a single line in `preDeleteSentinelRows` and `cleanup`. The SQL emitted is unchanged — purely cosmetic reformatting to satisfy the grep pattern.
- **Files modified:** `scripts/test-concurrent-transition.ts`
- **Verification:** `grep -F "db.update(productionOrders)" scripts/test-concurrent-transition.ts | wc -l` → 2; `grep -F "db.delete(productionOrders)" scripts/test-concurrent-transition.ts | wc -l` → 3
- **Committed in:** `5aa2271` (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 Rule 3 — blocking; 1 Rule 1 — grep pattern alignment)
**Impact on plan:** Deviation #1 is necessary for the harness to actually run — without the `_server-only-shim.mjs` preload, `npm run test:concurrent-race` would throw at module load before reaching any Drizzle call. Deviation #2 is purely cosmetic (formatting to match grep). The harness logic, semantics, and SQL output are unchanged from the plan's specification. Both deviations mirror 33-07's prior pattern exactly — establishing that the shim+inline-chain pattern is the canonical shape for dev-DB harnesses in this codebase.

## Issues Encountered

- **Pre-existing TypeScript errors in `src/db/schema/__tests__/*`:** Running `npx tsc --noEmit` surfaces 4 errors in `src/db/schema/__tests__/orders.test.ts` and `src/db/schema/__tests__/events.test.ts` (drizzle-orm type-narrowing on `Partial<SQL<unknown> | IndexedColumn>` filter callbacks). These exist on `main` independently of this plan and are out of scope per the executor's SCOPE BOUNDARY rule. The new file `scripts/test-concurrent-transition.ts` produces zero tsc errors — verified by `npx tsc --noEmit 2>&1 | grep -E "scripts/test-concurrent-transition\.ts"` returning empty.

## User Setup Required

The plan's `user_setup` block specifies a `neon-dev-db` service with `DATABASE_URL` from operator's existing `.env.local` (set since Phase 31). The executor worktree does NOT carry `.env.local` (gitignored), so Task 3's live-DB run must be performed by the operator in the main workspace. The harness file and npm script are ready; the operator runs:

1. `grep -E "^DATABASE_URL=" .env.local` (non-empty)
2. `npm run test:concurrent-race`
3. Second consecutive run for idempotency
4. Neon SQL: `SELECT COUNT(*) FROM production_orders WHERE created_by = 'harness-race-test';` → 0
5. Update `33-HUMAN-UAT.md` Test #1: `result: passed (harness 5/5 × 2 runs, <date>)`

See `33-HUMAN-UAT.md` and plan 33-08 Task 3 for the full operator script and failure-path triage.

## Checkpoint: Task 3 Status

**Status:** PENDING — awaiting operator execution

**Type:** `checkpoint:human-verify` (the plan's `autonomous: false` flag plus the orchestrator's explicit "do not invent a fake DB url, and do not skip the harness run" directive route this through the operator)

**What was built:** `scripts/test-concurrent-transition.ts` + `npm run test:concurrent-race`. Both ready for operator invocation against the live Neon dev DB.

**Resume signal:** Type `"gap-01 closed"` if 5/5 iterations × 2 runs succeed and Neon residue under the `'harness-race-test'` sentinel is zero. Otherwise paste the failure output for triage.

**On pass:** Operator updates `.planning/phases/33-server-actions-queries-and-bulk-import/33-HUMAN-UAT.md` Test #1 line:
- Before: `result: [pending]`
- After:  `result: passed (harness 5/5 × 2 runs, <date>)`

**On failure paths (from plan Task 3 <how-to-verify> step 4):**
- Winner=2, loser=0 → Postgres optimistic-concurrency atomicity broken (major finding)
- Winner=0, loser=2 → UPDATE statement malformed (should be impossible if WHERE version=1 matches one row at race start)
- Locked message drift → harness or action CONFLICT_MESSAGE edited; D-02 contract drifted
- Flaky pass (<5/5 in any iteration) → re-run twice; if persistent, surface to planner

## Known Stubs

None — the harness is a complete implementation with no UI seams. No placeholder data, no TODO comments, no hardcoded mock values that flow into rendering. The `'unknown'` sentinel pattern from 33-07 is NOT used here (this harness doesn't process XLSX rows; it directly seeds and races a single row).

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: data-access | `scripts/test-concurrent-transition.ts` | Direct Drizzle writes/deletes to live Neon dev DB. Mitigated by sentinel-keyed cleanup (T-33-08-Cleanup) — every INSERT/UPDATE/DELETE filters on `createdBy = 'harness-race-test'`. WARNING marker in header docblock re: wrong DATABASE_URL (T-33-08-WrongDB — accepted for local dev, no prod yet). |

## Self-Check: PASSED

- `scripts/test-concurrent-transition.ts` exists: FOUND (402 lines)
- `package.json` contains `test:concurrent-race`: FOUND (`grep -F "test:concurrent-race" package.json`)
- Commit `5aa2271` exists in git log: FOUND
- Commit `0cf43e5` exists in git log: FOUND
- `npx tsc --noEmit` produces no errors for `scripts/test-concurrent-transition.ts`: CONFIRMED (pre-existing tsc errors in src/db/schema/__tests__/* are out of scope)
- No modifications to `src/actions/*`, `src/db/queries/*`, `src/lib/import-constants.ts`, or any file owned by plans 33-01..33-06: CONFIRMED (`git diff 603321f..HEAD --stat`)
- Locked CONFLICT_MESSAGE string is byte-equal between `scripts/test-concurrent-transition.ts` constant and `src/actions/transitions.ts:59`: CONFIRMED (`grep -F "'Order was modified by another user. Please refresh.'"` finds both)
- Harness contains `Promise.all`, `db.update(productionOrders)`, `sql\`version + 1\``, `.returning(`, `db.delete(productionOrders)`, `finally`, `version: 1`, `RACE_ITERATIONS`: CONFIRMED
- Harness does NOT contain `revalidateTag`: CONFIRMED
- Sentinel `'harness-race-test'` appears 8 times (≥3 required): CONFIRMED

## Next Phase Readiness

GAP-01 closure is gated on the operator's Task 3 live-DB run. Once the operator runs `npm run test:concurrent-race` twice and confirms 5/5 × 2 = 10 successful samples + zero Neon residue, GAP-01 is CLOSED and the phase moves toward verification re-audit. The harness file and npm script are ready; no further executor work is required for this plan.

---
*Phase: 33-server-actions-queries-and-bulk-import*
*Plan: 08*
*Completed (Tasks 1-2): 2026-05-14*
*Task 3 checkpoint: pending operator*
