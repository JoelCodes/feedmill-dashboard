'use client';

/**
 * BlockedAlertBand — Sticky top-of-board alert band listing all Blocked orders.
 *
 * PROD-06 / D-22:
 * - When any order is in the Blocked state, shows a sticky alert band at the
 *   top of the board listing each blocked order as a clickable chip.
 * - Chip format: "BLOCKED: ORD-123 (Premix)".
 * - Clicking a chip sets ?order=<id> and opens the drawer for that order.
 * - When no orders are blocked, component returns null (band is not shown).
 *
 * NOTE: Reason excerpt (UI-SPEC surface 2 "— [reason excerpt, max 40 chars]") is
 * deferred per PATTERNS.md until a derived blockedReasonByOrderId map is
 * computed RSC-side from the events query — out of scope for this plan.
 *
 * T-34-03-02: parseAsString accepts any string; getOrderById (plan 07) uses
 * parameterised Drizzle — no SQL injection surface from the URL param.
 */
import { startTransition } from 'react';
import { useQueryStates, parseAsString } from 'nuqs';
import type { ProductionOrder } from '@/db/schema/orders';

interface BlockedAlertBandProps {
  orders: ProductionOrder[];
}

export default function BlockedAlertBand({ orders }: BlockedAlertBandProps) {
  // Order is NON-SHALLOW: setting ?order=<id> must re-run the page RSC (T10b gap closure).
  // history: 'push' enables browser-back to close the drawer.
  const [, setQuery] = useQueryStates(
    { order: parseAsString.withDefault('') },
    { shallow: false, history: 'push' }
  );

  const blocked = orders.filter((o) => o.state === 'Blocked');

  // D-22: hidden when zero blocked orders
  if (blocked.length === 0) return null;

  return (
    <div className="sticky top-0 z-10 flex flex-wrap gap-2 border-l-4 border-[var(--status-blocked-border)] bg-error-light px-4 py-3">
      {blocked.map((order) => (
        <button
          key={order.id}
          onClick={() => startTransition(() => setQuery({ order: order.id }))}
          className="rounded px-2 py-1 text-xs text-[var(--error-dark)] hover:underline"
        >
          BLOCKED: {order.orderNumber} ({order.millLine})
        </button>
      ))}
    </div>
  );
}
