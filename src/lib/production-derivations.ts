/**
 * Pure derivation helpers for the production dashboard.
 *
 * No React, no Next.js, no database — this file is intentionally free of
 * browser/server APIs so it can be imported from both RSC and client contexts.
 *
 * T-34-04-01 (mitigate): computeColumnWeights uses parseFloat to convert the
 * Drizzle `numeric` string to a number. Pitfall 6 — never call
 * weightLbs.toLocaleString() directly; do parseFloat first.
 */
import type { ProductionOrder, ProductionState } from '@/db/schema/orders';
// WR-06 (deep review 2026-05-14): STATE_ORDER now lives in @/lib/state-order
// as the single source of truth, shared with search-params.ts (parser) and
// MillColumn.tsx (visual). The shared module has no 'server-only' imports so
// this pure derivations module stays import-clean for both RSC and client.
import { STATE_ORDER } from '@/lib/state-order';

/**
 * Groups an array of ProductionOrders into a Record keyed by ProductionState.
 * All four state buckets are always present — empty arrays when no orders match.
 * Order within each bucket follows input order (stable grouping).
 */
export function groupOrdersByState(
  orders: ProductionOrder[]
): Record<ProductionState, ProductionOrder[]> {
  return STATE_ORDER.reduce(
    (acc, state) => {
      acc[state] = orders.filter((o) => o.state === state);
      return acc;
    },
    {
      Pending: [],
      Mixing: [],
      Completed: [],
      Blocked: [],
    } as Record<ProductionState, ProductionOrder[]>
  );
}

/**
 * Computes completed and total weight (in lbs) for a column's orders.
 *
 * IMPORTANT: weightLbs is a Drizzle `numeric` column inferred as `string`.
 * This function uses parseFloat to convert — never raw string arithmetic.
 * (Pitfall 6, CR-01 contract in src/db/schema/orders.ts)
 */
export function computeColumnWeights(
  orders: ProductionOrder[]
): { completed: number; total: number } {
  const total = orders.reduce(
    (sum, o) => sum + parseFloat(o.weightLbs || '0'),
    0
  );
  const completed = orders
    .filter((o) => o.state === 'Completed')
    .reduce((sum, o) => sum + parseFloat(o.weightLbs || '0'), 0);
  return { completed, total };
}

/**
 * Filters orders by status and search term.
 *
 * D-07: empty status [] means show all (Pitfall 11 — empty status ≠ show none).
 * D-05: q is trimmed and lowercased inside this function; URL preserves original.
 *
 * Filter chain: status applied first, then q substring on survivors.
 * Substring match is on customer + product fields (case-insensitive).
 */
export function filterOrders(
  orders: ProductionOrder[],
  status: ProductionState[],
  q: string
): ProductionOrder[] {
  // Step 1: status filter — empty array = pass through all
  const afterStatus =
    status.length === 0
      ? orders
      : orders.filter((o) => status.includes(o.state));

  // Step 2: search filter — trim + lowercase the query
  const needle = q.trim().toLowerCase();
  if (!needle) return afterStatus;

  return afterStatus.filter(
    (o) =>
      o.customer.toLowerCase().includes(needle) ||
      o.product.toLowerCase().includes(needle)
  );
}

/**
 * Returns true if the order is the topmost Pending order in its column
 * (i.e., the "next to start" order).
 *
 * T-34-04-04: pure function over in-memory list — correctness enforced by
 * tests 13-16.
 */
export function isOrderNextUp(
  order: ProductionOrder,
  pendingOrdersInColumn: ProductionOrder[]
): boolean {
  return (
    order.state === 'Pending' &&
    pendingOrdersInColumn.length > 0 &&
    pendingOrdersInColumn[0].id === order.id
  );
}
