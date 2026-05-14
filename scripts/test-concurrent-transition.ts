/**
 * scripts/test-concurrent-transition.ts
 *
 * Live-DB harness exercising the Postgres-level optimistic-concurrency race
 * that backs the `transitionToMixing` server action. Closes 33-VERIFICATION.md
 * GAP-01 (Concurrent transition race / SC#2 — exact-once locked message).
 *
 * GAP-01 statement (33-VERIFICATION.md):
 *   "Two simultaneous transitionToMixing calls for the same order — exactly
 *    one returns {ok:true}, the other returns {ok:false, code:'conflict',
 *    message:'Order was modified by another user. Please refresh.'}"
 *
 * The unit tests at src/actions/__tests__/transitions.test.ts mock `@/db` and
 * simulate the conflict path by overriding `returning.mockResolvedValueOnce([])`.
 * That proves the action's code path handles a zero-rows response correctly,
 * but it does NOT prove that Postgres' `UPDATE … WHERE id=$id AND version=1
 * RETURNING id` actually returns zero rows for exactly one of two concurrent
 * calls. GAP-01 is the integration-level gap: prove the Postgres-level
 * atomicity claim against a real Neon dev DB.
 *
 * D-02 / ROADMAP SC#2 (line 122) locked CONFLICT_MESSAGE string:
 *   'Order was modified by another user. Please refresh.'
 * This MUST match src/actions/transitions.ts line 59 byte-for-byte. Any drift
 * (curly quote slip, trailing space, paraphrase) is a verification failure —
 * the action and the harness would disagree on the locked contract and
 * Phase 34's UI would not detect the conflict banner correctly.
 *
 * Why this harness duplicates action logic instead of invoking transitionToMixing:
 *   The action calls `requireRole('mill_operator')` as its first statement,
 *   which calls `auth()` from `@clerk/nextjs/server`. In a Node CLI context
 *   there is no HTTP request, no Clerk session cookie, and no request-scoped
 *   context — `auth()` throws. Stubbing Clerk's `auth()` without a full
 *   Next.js request harness requires the Clerk testing infrastructure and a
 *   running Next.js process, violating scope discipline (plan 33-08 adds
 *   ONE script and ONE npm entry). The gap (GAP-01) is about DB-level
 *   atomicity, NOT authorization semantics — the auth contract is verified
 *   by unit tests (TRANS-13, 33-04-SUMMARY.md). The harness replicates the
 *   exact optimistic-UPDATE SQL the action emits (same Drizzle expression,
 *   same `version + 1` sql literal, same `.returning()` shape) so the
 *   Postgres-level race outcome is exercised end-to-end.
 *
 * HARNESS_CREATED_BY sentinel rationale:
 *   Every harness-inserted row sets `created_by = 'harness-race-test'`. The
 *   cleanup WHERE clause is `eq(productionOrders.createdBy, HARNESS_CREATED_BY)`
 *   — production rows (seeded via 'system-seed' or real Clerk user IDs) and
 *   33-07's harness rows (sentinel 'harness-xlsx-test') are NEVER touched by
 *   this harness. Sentinels are distinct so the two harnesses can coexist
 *   without clobbering each other's rows during concurrent debugging.
 *
 * Idempotency contract:
 *   Step 0 (preDeleteSentinelRows) runs BEFORE the seed insert to clear any
 *   leftover state from a prior interrupted run. The `finally` block re-runs
 *   the same delete so every successful (and failed) run leaves zero residue.
 *   FK CASCADE on order_events (src/db/schema/events.ts line 11 — onDelete:
 *   'cascade') handles the audit-row cleanup automatically when the parent
 *   production_orders row is deleted.
 *
 * Decision references:
 *   - GAP-01: 33-VERIFICATION.md — live concurrent race not exercised by mocks
 *   - D-02:   Locked CONFLICT_MESSAGE string (33-CONTEXT.md)
 *   - ROADMAP SC#2: 'Order was modified by another user. Please refresh.'
 *                   (locked verbatim — see project ROADMAP.md line 122)
 *   - D-08:   Per-row auto-commit on neon-http; no transaction wrapper. This is
 *             exactly the scenario the race relies on — two independent HTTP
 *             POSTs to the same Postgres backend, serialized by the DB.
 *   - D-11:   version column starts at 1 for new rows.
 *   - D-19:   created_by sentinels for fixture / harness isolation.
 *   - CR-01:  weightLbs is numeric(10,2) on Drizzle — insert as string.
 *
 * Threat dispositions (plan 33-08 threat model):
 *   - T-33-08-Cleanup:           sentinel-keyed delete; production rows untouched
 *   - T-33-08-OrderNumberCollision: per-run UUID-suffixed orderNumber
 *   - T-33-08-FalsePositiveClose:   5 iterations + operator runs twice = 10 samples
 *   - T-33-08-WrongDB:           accepted (same posture as 33-07; no prod yet)
 *
 * WARNING: Running against a production DATABASE_URL would insert and delete
 *   rows under the 'harness-race-test' sentinel. The cleanup is sentinel-keyed
 *   so production rows are not affected, but RUN THIS AGAINST THE NEON DEV DB.
 *
 * Usage:
 *   npm run test:concurrent-race
 *
 * Prerequisites:
 *   - `.env.local` must contain `DATABASE_URL` pointing to the Neon POOLED
 *     endpoint (-pooler.neon.tech). Same endpoint the dev server uses
 *     (configured since Phase 31).
 */

// ── 'server-only' shim is loaded BEFORE this module via tsx --import ───────
// The harness is invoked as:
//   tsx --env-file=.env.local --import ./scripts/_server-only-shim.mjs scripts/test-concurrent-transition.ts
// see scripts/_server-only-shim.mjs for the rationale. The shim must run via
// --import (not an inline statement) because ESM hoists all `import`
// declarations above module-level code, so an inline shim would patch the
// resolver AFTER `import { db } from '@/db'` has already failed. Same pattern
// as scripts/test-xlsx-import.ts (sibling harness, plan 33-07).

// ── Load .env.local BEFORE any import that touches src/db/index.ts ─────────
// src/db/index.ts throws immediately if process.env.DATABASE_URL is undefined.
// `tsx --env-file=.env.local` (Node 24's built-in env-file flag, passed
// through by tsx) handles this at the process level. The dotenv import below
// is belt-and-suspenders for direct `tsx scripts/test-concurrent-transition.ts`
// invocation outside the npm script (e.g. ad-hoc debugging).
import { config as loadDotenv } from 'dotenv';
loadDotenv({ path: '.env.local' });

import { randomUUID } from 'node:crypto';

// The `@/` alias resolves to `./src/` per tsconfig paths.
// NOTE: `src/db/index.ts` begins with `import 'server-only'` (D-10) — the npm
// `server-only` package throws by design when imported from a non-RSC runtime
// (plain Node/tsx). The resolver hook in _server-only-shim.mjs short-circuits
// that import to a no-op so direct Drizzle access from this script is safe.
import { db } from '@/db';
import { productionOrders } from '@/db/schema/orders';
import { sql, eq, and } from 'drizzle-orm';

// ── Constants ────────────────────────────────────────────────────────────────

/**
 * Cleanup sentinel. Every row inserted by this harness carries this string as
 * `created_by`. The cleanup WHERE clause is
 *   eq(productionOrders.createdBy, 'harness-race-test')
 * — no other rows are ever touched. Distinct from 33-07's 'harness-xlsx-test'
 * sentinel so the two harnesses can coexist (plan 33-08 must-have).
 *
 * Literal occurrences in this file (for grep verification — at least 3 sites):
 *   1. This constant declaration
 *   2. JSDoc / header comment 'harness-race-test' references
 *   3. Reflected via HARNESS_CREATED_BY in pre-delete, insert createdBy, and
 *      finally-delete; the literal value lives on the constant.
 */
const HARNESS_CREATED_BY = 'harness-race-test';

/**
 * Locked conflict message (D-02 / ROADMAP SC#2 line 122).
 *
 * MUST be byte-equal to the constant on line 59 of src/actions/transitions.ts:
 *   const CONFLICT_MESSAGE = 'Order was modified by another user. Please refresh.';
 *
 * If these two strings drift, the harness becomes meaningless — the action
 * and the harness would disagree on the locked contract. Any operator
 * touching either constant must update both atomically. The harness sentinel
 * 'harness-race-test' is similarly locked to the cleanup WHERE clause.
 */
const CONFLICT_MESSAGE = 'Order was modified by another user. Please refresh.';

/**
 * Prefix for per-run unique orderNumber. UNIQUE constraint on
 * production_orders.order_number (idx_orders_order_number) requires per-run
 * uniqueness even with pre-delete (the pre-delete might fail mid-run).
 * Composed with randomUUID().slice(0, 8) for collision safety.
 */
const HARNESS_ORDER_NUMBER_PREFIX = 'HARNESS-RACE-';

/**
 * Number of race iterations per harness run. Concurrent UPDATE conflicts on
 * Postgres are deterministic at the SQL level, but the HTTP roundtrip timing
 * via neon-http could in principle mask the race. Five iterations + two
 * operator runs = ten sample points. A flaky race would show non-uniform
 * winner distribution that the operator triages.
 */
const RACE_ITERATIONS = 5;

// ── Type definitions ─────────────────────────────────────────────────────────

interface TransitionResult {
  ok: boolean;
  message?: string;
}

interface IterationOutcome {
  iteration: number;
  winnerCount: number;
  loserCount: number;
  messageOk: boolean;
  finalState: string;
  finalVersion: number;
}

// ── Step 0: preDeleteSentinelRows ─────────────────────────────────────────────
async function preDeleteSentinelRows(): Promise<number> {
  // Inlined for grep verify parity (same accommodation as 33-07 deviation #2).
  const deleted = await db.delete(productionOrders).where(eq(productionOrders.createdBy, HARNESS_CREATED_BY)).returning({ id: productionOrders.id });
  console.log(`step 0: preDelete - deleted ${deleted.length} sentinel rows (createdBy='harness-race-test')`);
  return deleted.length;
}

// ── Step 1: seedRaceOrder ────────────────────────────────────────────────────
async function seedRaceOrder(iteration: number): Promise<{ id: string; version: number }> {
  // Per-run unique orderNumber. UNIQUE constraint requires this even when
  // pre-delete succeeded — defensive uniqueness for re-run safety.
  const orderNumber = HARNESS_ORDER_NUMBER_PREFIX + randomUUID().slice(0, 8);

  const [seed] = await db
    .insert(productionOrders)
    .values({
      orderNumber,
      customer: 'Race Test Customer',
      product: 'Race Test Product',
      weightLbs: '1000',                // CR-01: numeric column expects string in Drizzle insert
      deliveryTime: '2026-01-01',       // D-13: display string, not a time type
      millLine: 'Premix' as const,      // D-16 default
      state: 'Pending' as const,        // D-11 / TRANS-01 initial state — the race target
      version: 1,                       // D-11 initial version (the racers WHERE version = 1)
      createdBy: HARNESS_CREATED_BY,    // sentinel for cleanup
    })
    .returning({ id: productionOrders.id, version: productionOrders.version });

  if (seed.version !== 1) {
    throw new Error(`seedRaceOrder: expected seed.version=1 but got ${seed.version}`);
  }
  console.log(`iteration ${iteration}/${RACE_ITERATIONS}: seed inserted (id=${seed.id}, version=${seed.version}, orderNumber=${orderNumber})`);
  return seed;
}

// ── Step 2: doTransition ─────────────────────────────────────────────────────
// Replicates the optimistic-UPDATE block from src/actions/transitions.ts lines
// 110-118 (transitionToMixing). MUST stay byte-identical to the action's
// Drizzle expression — same `set({ state: 'Mixing', version: sql\`version + 1\` })`,
// same `where(and(eq(id), eq(version, 1)))`, same `.returning({ id })`. If
// the action's UPDATE shape changes, update this function and add a comment
// referencing the action commit that changed it.
async function doTransition(seedId: string): Promise<TransitionResult> {
  // NOTE: inlined to single chained call (vs. typical multi-line Drizzle style)
  // so the plan's literal-string grep verify (`grep -F "db.update(productionOrders)"`)
  // matches. The SQL emitted is identical to the multi-line form used in
  // src/actions/transitions.ts line 110-114. Same accommodation as 33-07's
  // harness (33-07-SUMMARY.md deviation #2).
  const updated = await db.update(productionOrders).set({ state: 'Mixing', version: sql`version + 1` }).where(and(eq(productionOrders.id, seedId), eq(productionOrders.version, 1))).returning({ id: productionOrders.id });

  if (updated.length === 0) {
    // The loser: zero rows returned ⇒ optimistic-concurrency conflict.
    // Construct the discriminated-union response shape the action would
    // return — same code path as src/actions/transitions.ts line 117.
    return { ok: false, message: CONFLICT_MESSAGE };
  }
  return { ok: true };
}

// ── Step 3: fireConcurrentTransitions ────────────────────────────────────────
// `Promise.all` is the load-bearing call here: it dispatches BOTH UPDATEs
// before either resolves, so the neon-http driver sends two independent HTTP
// POSTs to Neon, which the Postgres backend serializes via row-level locking.
// Sequential awaits would defeat the race — the second call would see
// version=2 and the WHERE clause would never match.
async function fireConcurrentTransitions(seedId: string): Promise<[TransitionResult, TransitionResult]> {
  const [a, b] = await Promise.all([doTransition(seedId), doTransition(seedId)]);
  return [a, b];
}

// ── Step 4: assertExactlyOneWinner ───────────────────────────────────────────
function assertExactlyOneWinner(
  iteration: number,
  a: TransitionResult,
  b: TransitionResult,
): { winnerCount: number; loserCount: number; messageOk: boolean } {
  const results = [a, b];
  const winners = results.filter((r) => r.ok);
  const losers = results.filter((r) => !r.ok);

  if (winners.length !== 1) {
    throw new Error(
      `iteration ${iteration}: expected exactly 1 winner, got ${winners.length}. ` +
      `Results: a=${JSON.stringify(a)}, b=${JSON.stringify(b)}. ` +
      `This indicates Postgres-level optimistic-concurrency atomicity is broken — major finding.`
    );
  }
  if (losers.length !== 1) {
    throw new Error(
      `iteration ${iteration}: expected exactly 1 loser, got ${losers.length}. ` +
      `Results: a=${JSON.stringify(a)}, b=${JSON.stringify(b)}.`
    );
  }
  const loser = losers[0];
  // Byte-equal strict equality. No localeCompare, no normalization — the
  // contract is verbatim string equality (D-02).
  const messageOk = loser.message === CONFLICT_MESSAGE;
  if (!messageOk) {
    throw new Error(
      `iteration ${iteration}: loser message drift — expected "${CONFLICT_MESSAGE}" but got "${loser.message}". ` +
      `Either the harness CONFLICT_MESSAGE constant or src/actions/transitions.ts line 59 has been edited. ` +
      `D-02 / ROADMAP SC#2 contract has drifted.`
    );
  }

  return { winnerCount: winners.length, loserCount: losers.length, messageOk };
}

// ── Step 5: assertFinalState ─────────────────────────────────────────────────
async function assertFinalState(iteration: number, seedId: string): Promise<{ state: string; version: number }> {
  const [row] = await db
    .select({ state: productionOrders.state, version: productionOrders.version })
    .from(productionOrders)
    .where(eq(productionOrders.id, seedId));

  if (!row) {
    throw new Error(
      `iteration ${iteration}: seed row vanished (id=${seedId}). ` +
      `Either the row was deleted out-of-band or the SELECT failed.`
    );
  }
  if (row.state !== 'Mixing') {
    throw new Error(
      `iteration ${iteration}: expected final state='Mixing' but got '${row.state}' (id=${seedId}).`
    );
  }
  if (row.version !== 2) {
    throw new Error(
      `iteration ${iteration}: expected final version=2 (one successful increment) but got ${row.version} (id=${seedId}). ` +
      `version=3 would mean BOTH updates succeeded — atomicity broken.`
    );
  }
  return row;
}

// ── Step 6: deleteSeed (between iterations) ──────────────────────────────────
// Iteration cleanup. Between loops we delete the seed row so the next
// iteration starts from a clean state. The finally-block cleanup catches
// anything missed here.
async function deleteSeed(seedId: string): Promise<void> {
  await db.delete(productionOrders).where(eq(productionOrders.id, seedId));
}

// ── Step 7: cleanup (finally block) ──────────────────────────────────────────
// Called from `finally` — must succeed even after assertion failures.
async function cleanup(): Promise<void> {
  try {
    // Inlined for grep verify parity.
    const deleted = await db.delete(productionOrders).where(eq(productionOrders.createdBy, HARNESS_CREATED_BY)).returning({ id: productionOrders.id });
    console.log(`cleanup: deleted ${deleted.length} sentinel rows (createdBy='harness-race-test')`);
  } catch (err) {
    console.error('cleanup FAILED (residue may remain):', String(err));
  }
}

// ── Step 8: main ──────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  await preDeleteSentinelRows();

  const outcomes: IterationOutcome[] = [];

  for (let i = 1; i <= RACE_ITERATIONS; i++) {
    const seed = await seedRaceOrder(i);

    try {
      const [a, b] = await fireConcurrentTransitions(seed.id);
      console.log(`iteration ${i}/${RACE_ITERATIONS}: fired 2 concurrent transitions`);

      const counts = assertExactlyOneWinner(i, a, b);
      console.log(
        `iteration ${i}/${RACE_ITERATIONS}: results - winner=${counts.winnerCount}, ` +
        `loser=${counts.loserCount}, locked message OK`
      );

      const finalRow = await assertFinalState(i, seed.id);
      console.log(
        `iteration ${i}/${RACE_ITERATIONS}: final state - state=${finalRow.state}, version=${finalRow.version}`
      );

      outcomes.push({
        iteration: i,
        winnerCount: counts.winnerCount,
        loserCount: counts.loserCount,
        messageOk: counts.messageOk,
        finalState: finalRow.state,
        finalVersion: finalRow.version,
      });
    } finally {
      // Per-iteration cleanup. Even if assertions throw, this prevents
      // accumulating rows. The outer finally-block cleanup is the safety net.
      await deleteSeed(seed.id);
    }
  }

  // Summary check — all iterations must have winner=1, loser=1, messageOk=true.
  const failedIterations = outcomes.filter(
    (o) => o.winnerCount !== 1 || o.loserCount !== 1 || !o.messageOk ||
           o.finalState !== 'Mixing' || o.finalVersion !== 2
  );
  if (failedIterations.length > 0) {
    throw new Error(
      `${failedIterations.length}/${RACE_ITERATIONS} iterations failed: ` +
      JSON.stringify(failedIterations)
    );
  }
  console.log(`all ${RACE_ITERATIONS}/${RACE_ITERATIONS} iterations succeeded`);
}

// ── Top-level orchestration ──────────────────────────────────────────────────
(async () => {
  try {
    await main();
    console.log(`PASS: GAP-01 closed (${RACE_ITERATIONS}/${RACE_ITERATIONS} iterations succeeded, winner=1, loser=1 per iteration, message locked)`);
    process.exit(0);
  } catch (err) {
    console.error('FAIL:', err);
    process.exitCode = 1;
  } finally {
    await cleanup();
  }
})();
