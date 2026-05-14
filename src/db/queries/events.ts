import 'server-only';
import { unstable_cache } from 'next/cache';
import { db } from '@/db';
import { orderEvents } from '@/db/schema/events';
import { eq, desc } from 'drizzle-orm';

/**
 * Fetch all events for a given order, ordered newest-first.
 *
 * CACHE CONTRACT:
 * This function is wrapped in `unstable_cache` with tag `'production-orders'`.
 * The tag MUST match the `revalidateTag('production-orders')` call in every
 * mutating action under `src/actions/` (plan 33-04, plan 33-06). When a
 * transition writes an event, both this cache and getProductionOrders
 * invalidate together.
 *
 * ORDER: `orderBy(desc(orderEvents.changedAt))` orders events newest-first.
 * This is supported by index `idx_events_order_id_changed_at_desc` on
 * `(order_id, changed_at DESC)` from Phase 32 schema events.ts lines 20-22.
 * The timeline UI in Phase 34 needs newest-first ordering to display the
 * most recent state transition at the top.
 *
 * Note: `revalidate` is intentionally absent — tag-only invalidation.
 */
export const getOrderEvents = unstable_cache(
  async (orderId: string) => {
    return db
      .select()
      .from(orderEvents)
      .where(eq(orderEvents.orderId, orderId))
      .orderBy(desc(orderEvents.changedAt));
  },
  ['order-events'],
  { tags: ['production-orders'] }
);
