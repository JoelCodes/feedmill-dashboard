import 'server-only';
import { unstable_cache } from 'next/cache';
import { db } from '@/db';
import { productionOrders } from '@/db/schema/orders';
import { and, eq, inArray } from 'drizzle-orm';
import type { ProductionState, MillLine } from '@/db/schema/orders';

export type ProductionOrderFilters = {
  millLine?: MillLine;
  states?: ProductionState[];
};

/**
 * Fetch all production orders, optionally filtered by mill line and/or states.
 *
 * CACHE CONTRACT:
 * This function is wrapped in `unstable_cache` with tag `'production-orders'`.
 * The tag MUST match the `revalidateTag('production-orders')` call in every
 * mutating action under `src/actions/` (plan 33-04, plan 33-06).
 *
 * See STATE.md mutation invariant: "Every server action that mutates data must
 * call `revalidateTag('production-orders')` before returning."
 *
 * Note: `revalidate` is intentionally absent — this function uses tag-only
 * invalidation, not TTL-based invalidation. Data is fresh after a tag
 * invalidation triggered by a mutating action, or after a `router.refresh()`.
 */
export const getProductionOrders = unstable_cache(
  async (filters?: ProductionOrderFilters) => {
    const conditions = [];
    if (filters?.millLine) {
      conditions.push(eq(productionOrders.millLine, filters.millLine));
    }
    if (filters?.states?.length) {
      conditions.push(inArray(productionOrders.state, filters.states));
    }
    return db
      .select()
      .from(productionOrders)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(productionOrders.deliveryTime);
  },
  ['production-orders'],
  { tags: ['production-orders'] }
);

/**
 * Fetch a single production order by ID.
 *
 * NOT CACHED — this is the single-row state-guard read called from inside
 * transition actions (plan 33-04). It must reflect the most recent committed
 * state so the version comparison is against the freshest row.
 *
 * See CONTEXT.md code_context integration points: "transition actions call
 * getOrderById(orderId) as their state-guard read; without it, plan 33-04
 * has no consistent way to load the current state before the optimistic UPDATE."
 */
export async function getOrderById(id: string) {
  const [order] = await db
    .select()
    .from(productionOrders)
    .where(eq(productionOrders.id, id));
  return order ?? null;
}
