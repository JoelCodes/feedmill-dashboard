'use client';

import {
  groupOrdersByState,
  computeColumnWeights,
  isOrderNextUp,
} from '@/lib/production-derivations';
import ProductionCard from '@/components/ProductionCard';
import type { ProductionOrder, ProductionState, MillLine } from '@/db/schema/orders';

/**
 * Visual ordering of state sections within a column.
 * UI-SPEC §3: Completed → Mixing → Blocked → Pending
 * This differs from STATE_ORDER in search-params.ts which is the parsing/filter order.
 */
const COLUMN_STATE_ORDER: readonly ProductionState[] = [
  'Completed',
  'Mixing',
  'Blocked',
  'Pending',
] as const;

/**
 * Local STATE_COLORS — copied from MillProductionUI.tsx (visual prior art, D-01).
 * No code sharing with /demo components — intentionally duplicated.
 */
const STATE_COLORS: Record<ProductionState, { header: string }> = {
  Completed: { header: 'var(--status-completed-header)' },
  Mixing: { header: 'var(--status-mixing-header)' },
  Blocked: { header: 'var(--status-blocked-header)' },
  Pending: { header: 'var(--status-pending-header)' },
};

/**
 * Format a weight number to a human-readable locale string with thousands separators.
 * Consistent with ProductionCard.tsx formatWeight — both must stay in sync.
 *
 * T-34-04-01: computeColumnWeights and ProductionCard BOTH use parseFloat; this
 * function operates on already-parsed numbers so it never receives the raw string.
 */
function formatWeight(lbs: number): string {
  return lbs.toLocaleString();
}

// ─────────────────────────────────────────────────────────────────────────────
// StateSection — renders a group of orders for a single state
// ─────────────────────────────────────────────────────────────────────────────

interface StateSectionProps {
  state: ProductionState;
  orders: ProductionOrder[];
  pendingOrdersInColumn: ProductionOrder[];
  onOrderClick: (orderId: string) => void;
}

function StateSection({
  state,
  orders,
  pendingOrdersInColumn,
  onOrderClick,
}: StateSectionProps) {
  // Guard: don't render section if no orders in this state
  if (orders.length === 0) return null;

  const headerColor = STATE_COLORS[state].header;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline gap-3">
        <h3 className="text-xl font-bold" style={{ color: headerColor }}>
          {state}
        </h3>
      </div>
      <div className="flex flex-col gap-3">
        {orders.map((order) => (
          <ProductionCard
            key={order.id}
            order={order}
            isNextUp={isOrderNextUp(order, pendingOrdersInColumn)}
            isInProgress={order.state === 'Mixing'}
            onClick={() => onOrderClick(order.id)}
          />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MillColumn — per-line composition component
// ─────────────────────────────────────────────────────────────────────────────

export interface MillColumnProps {
  millLine: MillLine;
  orders: ProductionOrder[];
  onOrderClick: (orderId: string) => void;
}

/**
 * Per-line column component that composes ProductionCard + pure derivations.
 *
 * PROD-02: three-column board structure (one MillColumn per mill line).
 * PROD-07: next-up indicator wired via isOrderNextUp.
 * PROD-08: in-progress badge wired via order.state === 'Mixing'.
 * UI-SPEC §3: Completed → Mixing → Blocked → Pending visual ordering.
 * UI-SPEC §3: Empty column shows "No orders" — never collapses header.
 */
export default function MillColumn({
  millLine,
  orders,
  onOrderClick,
}: MillColumnProps) {
  const grouped = groupOrdersByState(orders);
  const { completed, total } = computeColumnWeights(orders);

  return (
    <div className="flex flex-1 flex-col gap-5">
      {/* Column header — always visible, even when empty */}
      <div>
        <h2 className="text-primary text-2xl font-bold">{millLine}</h2>
        <p className="text-muted mt-1 text-base font-semibold">
          {formatWeight(completed)} / {formatWeight(total)} lbs
        </p>
      </div>

      {/* Empty state */}
      {orders.length === 0 ? (
        <p className="text-center text-sm text-[var(--text-secondary)]">
          No orders
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {COLUMN_STATE_ORDER.map((state) => {
            const list = grouped[state];
            if (list.length === 0) return null;
            return (
              <StateSection
                key={state}
                state={state}
                orders={list}
                pendingOrdersInColumn={grouped.Pending}
                onOrderClick={onOrderClick}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
