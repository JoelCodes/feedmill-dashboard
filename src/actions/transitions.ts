'use server';
/**
 * Transition server actions for the production order state machine.
 *
 * Four named exports:
 *   - `transitionToMixing(orderId, version)`:  Pending → Mixing (TRANS-01)
 *   - `completeOrder(orderId, version)`:        Mixing → Completed (TRANS-02)
 *   - `blockOrder(orderId, version, reason)`:   Pending|Mixing → Blocked (TRANS-03)
 *   - `resumeFromBlocked(orderId, version, toState)`: Blocked → Mixing|Pending (TRANS-04)
 *
 * ALL four actions follow the identical canonical shape:
 *   1. `await requireRole('mill_operator')` — AUTH-02 inner-guard pattern
 *      (docs/security-patterns.md §2). If the caller is not a mill_operator,
 *      `requireRole` throws NEXT_REDIRECT and the action never reaches the DB.
 *   2. `const { userId } = await auth()` — Clerk user ID for the audit trail.
 *   3. State-guard SELECT — load current order; reject not-found / wrong from-state.
 *   4. Optimistic-concurrency UPDATE with `.returning()` — check `.length === 0`
 *      for the conflict path. Use `.returning()` NOT `.rowCount` — the neon-http
 *      driver surfaces zero-row updates only via the returned array length
 *      (RESEARCH.md Pitfall 1 — verified from Drizzle neon-http session types).
 *   5. Audit INSERT into `orderEvents`.
 *   6. `revalidateTag('production-orders')` — STATE.md mutation invariant;
 *      must be called BEFORE returning (TRANS-07 + plan 33-02 cache tag contract).
 *   7. `return { ok: true }`.
 *
 * Non-transactional sequence: The neon-http driver does NOT support
 * `db.transaction()` (Phase 32 CR-02 carryover). The UPDATE and subsequent
 * INSERT are two independent HTTP calls. If the INSERT fails after a successful
 * UPDATE, the state change commits to the DB but no audit row is written.
 * The action returns `{ ok: false, code: 'server' }` to signal the partial
 * failure so the operator-facing UI can prompt for manual review.
 *
 * CONFLICT_MESSAGE invariant: The string
 *   `'Order was modified by another user. Please refresh.'`
 * is locked per D-02 and ROADMAP SC#2. Phase 34 client components detect
 * `code === 'conflict'` from this action and surface an inline red banner on
 * the affected order card + auto-`router.refresh()`. Do NOT paraphrase or
 * translate this string without a ROADMAP change.
 *
 * Cache tag contract: `revalidateTag('production-orders')` here corresponds to
 * the `unstable_cache(..., { tags: ['production-orders'] })` wrappers in
 * `src/db/queries/orders.ts` and `src/db/queries/events.ts` (plan 33-02).
 * A typo in either site silently breaks cache invalidation.
 *
 * AUTH-02 inner-guard pattern reference: docs/security-patterns.md §2.
 * Every mutating action calls `await requireRole('mill_operator')` as the
 * first line of the action body (after `'use server'` directive).
 */
import { db } from '@/db';
import { productionOrders } from '@/db/schema/orders';
import { orderEvents } from '@/db/schema/events';
import { eq, and } from 'drizzle-orm';
import { revalidateTag } from 'next/cache';
import { requireRole } from '@/lib/auth';
import { auth } from '@clerk/nextjs/server';

// Locked conflict message (D-02, ROADMAP SC#2).
// Used verbatim in all four actions — do NOT export; internal invariant only.
const CONFLICT_MESSAGE = 'Order was modified by another user. Please refresh.';

/**
 * Discriminated union returned by every transition action (D-01, D-02).
 *
 * Codes and their Phase 34 UI surface:
 *   - `conflict`     → inline red banner on the affected order card + auto-refresh
 *   - `unauthorized` → redirect to /sign-in (handled by requireRole throwing NEXT_REDIRECT)
 *   - `validation`   → form-level / toast error describing the illegal transition
 *   - `not_found`    → toast "Order not found"
 *   - `server`       → generic error toast (partial failure — state changed, audit failed)
 */
export type TransitionResult =
  | { ok: true }
  | {
      ok: false;
      code: 'conflict' | 'unauthorized' | 'validation' | 'not_found' | 'server';
      message: string;
    };

/**
 * Transition Pending → Mixing (TRANS-01).
 *
 * @param orderId - UUID of the production order to transition.
 * @param version - Optimistic-concurrency version the caller last saw.
 */
export async function transitionToMixing(
  orderId: string,
  version: number
): Promise<TransitionResult> {
  await requireRole('mill_operator');
  const { userId } = await auth();

  // Step 3: state-guard SELECT
  const [order] = await db
    .select({ state: productionOrders.state, id: productionOrders.id })
    .from(productionOrders)
    .where(eq(productionOrders.id, orderId));

  if (!order) {
    return { ok: false, code: 'not_found' as const, message: 'Order not found.' };
  }
  if (order.state !== 'Pending') {
    return {
      ok: false,
      code: 'validation' as const,
      message: `Cannot transition from ${order.state} to Mixing.`,
    };
  }

  // Step 4: optimistic-concurrency UPDATE
  const updated = await db
    .update(productionOrders)
    .set({ state: 'Mixing', version: version + 1 })
    .where(and(eq(productionOrders.id, orderId), eq(productionOrders.version, version)))
    .returning({ id: productionOrders.id });

  if (updated.length === 0) {
    return { ok: false, code: 'conflict' as const, message: CONFLICT_MESSAGE };
  }

  // Step 5: audit trail INSERT
  try {
    await db.insert(orderEvents).values({
      orderId,
      fromState: 'Pending',
      toState: 'Mixing',
      changedBy: userId!,
      note: null,
    });
  } catch {
    revalidateTag('production-orders', 'max');
    return {
      ok: false,
      code: 'server' as const,
      message: 'Failed to record audit event after state change.',
    };
  }

  // Step 6 + 7: cache invalidation then success
  revalidateTag('production-orders', 'max');
  return { ok: true };
}

/**
 * Transition Mixing → Completed (TRANS-02).
 *
 * @param orderId - UUID of the production order to transition.
 * @param version - Optimistic-concurrency version the caller last saw.
 */
export async function completeOrder(
  orderId: string,
  version: number
): Promise<TransitionResult> {
  await requireRole('mill_operator');
  const { userId } = await auth();

  // Step 3: state-guard SELECT
  const [order] = await db
    .select({ state: productionOrders.state, id: productionOrders.id })
    .from(productionOrders)
    .where(eq(productionOrders.id, orderId));

  if (!order) {
    return { ok: false, code: 'not_found' as const, message: 'Order not found.' };
  }
  if (order.state !== 'Mixing') {
    return {
      ok: false,
      code: 'validation' as const,
      message: `Cannot transition from ${order.state} to Completed.`,
    };
  }

  // Step 4: optimistic-concurrency UPDATE
  const updated = await db
    .update(productionOrders)
    .set({ state: 'Completed', version: version + 1 })
    .where(and(eq(productionOrders.id, orderId), eq(productionOrders.version, version)))
    .returning({ id: productionOrders.id });

  if (updated.length === 0) {
    return { ok: false, code: 'conflict' as const, message: CONFLICT_MESSAGE };
  }

  // Step 5: audit trail INSERT
  try {
    await db.insert(orderEvents).values({
      orderId,
      fromState: 'Mixing',
      toState: 'Completed',
      changedBy: userId!,
      note: null,
    });
  } catch {
    revalidateTag('production-orders', 'max');
    return {
      ok: false,
      code: 'server' as const,
      message: 'Failed to record audit event after state change.',
    };
  }

  // Step 6 + 7: cache invalidation then success
  revalidateTag('production-orders', 'max');
  return { ok: true };
}

/**
 * Transition Pending|Mixing → Blocked (TRANS-03).
 *
 * @param orderId - UUID of the production order to block.
 * @param version - Optimistic-concurrency version the caller last saw.
 * @param reason  - REQUIRED free-text reason for blocking (TypeScript-level enforcement
 *   of TRANS-03 + D-04 — no `?` optional marker; callers MUST supply a non-empty reason).
 */
export async function blockOrder(
  orderId: string,
  version: number,
  reason: string
): Promise<TransitionResult> {
  await requireRole('mill_operator');
  const { userId } = await auth();

  // Step 3: state-guard SELECT
  const [order] = await db
    .select({ state: productionOrders.state, id: productionOrders.id })
    .from(productionOrders)
    .where(eq(productionOrders.id, orderId));

  if (!order) {
    return { ok: false, code: 'not_found' as const, message: 'Order not found.' };
  }
  if (!['Pending', 'Mixing'].includes(order.state)) {
    return {
      ok: false,
      code: 'validation' as const,
      message: `Cannot block an order in ${order.state} state.`,
    };
  }

  const fromState = order.state as 'Pending' | 'Mixing';

  // Step 4: optimistic-concurrency UPDATE
  const updated = await db
    .update(productionOrders)
    .set({ state: 'Blocked', version: version + 1 })
    .where(and(eq(productionOrders.id, orderId), eq(productionOrders.version, version)))
    .returning({ id: productionOrders.id });

  if (updated.length === 0) {
    return { ok: false, code: 'conflict' as const, message: CONFLICT_MESSAGE };
  }

  // Step 5: audit trail INSERT — reason is stored as note (TRANS-03)
  try {
    await db.insert(orderEvents).values({
      orderId,
      fromState,
      toState: 'Blocked',
      changedBy: userId!,
      note: reason,
    });
  } catch {
    revalidateTag('production-orders', 'max');
    return {
      ok: false,
      code: 'server' as const,
      message: 'Failed to record audit event after state change.',
    };
  }

  // Step 6 + 7: cache invalidation then success
  revalidateTag('production-orders', 'max');
  return { ok: true };
}

/**
 * Transition Blocked → Mixing|Pending (TRANS-04).
 *
 * @param orderId  - UUID of the blocked production order to resume.
 * @param version  - Optimistic-concurrency version the caller last saw.
 * @param toState  - Target state: `'Mixing'` or `'Pending'` (constrained union per D-04;
 *   intentionally NOT `ProductionState` to prevent accidentally routing to `Completed`
 *   or `Blocked` via this action).
 */
export async function resumeFromBlocked(
  orderId: string,
  version: number,
  toState: 'Mixing' | 'Pending'
): Promise<TransitionResult> {
  await requireRole('mill_operator');
  const { userId } = await auth();

  // Step 3: state-guard SELECT
  const [order] = await db
    .select({ state: productionOrders.state, id: productionOrders.id })
    .from(productionOrders)
    .where(eq(productionOrders.id, orderId));

  if (!order) {
    return { ok: false, code: 'not_found' as const, message: 'Order not found.' };
  }
  if (order.state !== 'Blocked') {
    return {
      ok: false,
      code: 'validation' as const,
      message: `Cannot resume from ${order.state} state. Order must be Blocked.`,
    };
  }

  // Step 4: optimistic-concurrency UPDATE
  const updated = await db
    .update(productionOrders)
    .set({ state: toState, version: version + 1 })
    .where(and(eq(productionOrders.id, orderId), eq(productionOrders.version, version)))
    .returning({ id: productionOrders.id });

  if (updated.length === 0) {
    return { ok: false, code: 'conflict' as const, message: CONFLICT_MESSAGE };
  }

  // Step 5: audit trail INSERT
  try {
    await db.insert(orderEvents).values({
      orderId,
      fromState: 'Blocked',
      toState,
      changedBy: userId!,
      note: null,
    });
  } catch {
    revalidateTag('production-orders', 'max');
    return {
      ok: false,
      code: 'server' as const,
      message: 'Failed to record audit event after state change.',
    };
  }

  // Step 6 + 7: cache invalidation then success
  revalidateTag('production-orders', 'max');
  return { ok: true };
}
