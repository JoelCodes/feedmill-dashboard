'use client';

import type { ProductionOrder, ProductionState } from '@/db/schema/orders';

/**
 * Local STATE_COLORS — copied from MillProductionUI.tsx lines 18-38 (visual prior art).
 * D-01: no code sharing with /demo MillProductionUI; duplicated intentionally.
 * UI-SPEC color map: status token names per §Color table.
 */
const STATE_COLORS: Record<ProductionState, { border: string; header: string }> = {
  Completed: {
    border: 'var(--status-completed-border)',
    header: 'var(--status-completed-header)',
  },
  Mixing: {
    border: 'var(--status-mixing-border)',
    header: 'var(--status-mixing-header)',
  },
  Blocked: {
    border: 'var(--status-blocked-border)',
    header: 'var(--status-blocked-header)',
  },
  Pending: {
    border: 'var(--status-pending-border)',
    header: 'var(--status-pending-header)',
  },
};

/**
 * Format a weight in lbs to a human-readable locale string.
 * Takes a number (after parseFloat) — uses toLocaleString for thousands separators.
 * Examples: 1500.5 → "1,500.5", 1000000 → "1,000,000"
 *
 * Copied from MillProductionUI.tsx lines 67-72 (visual prior art, D-01).
 */
function formatWeight(lbs: number): string {
  if (lbs >= 1000) {
    return lbs.toLocaleString();
  }
  return lbs.toLocaleString();
}

export interface ProductionCardProps {
  order: ProductionOrder;
  isNextUp?: boolean;
  isInProgress?: boolean;
  onClick: () => void;
}

/**
 * Clickable DB-shape order card for the production dashboard.
 *
 * D-01: replaces MillProductionUI's DemoOrder-typed ProductionCard — NOT shared.
 * T-34-04-01 (mitigate): uses parseFloat(order.weightLbs) before formatWeight.
 * T-34-04-02 (accept): renders customer + product + deliveryTime for mill operators.
 * T-34-04-03 (accept): onClick only emits via callback; no direct URL mutation.
 *
 * Keyboard accessibility: role="button" + tabIndex=0 + onKeyDown Enter/Space.
 * Pattern sourced from src/components/ui/Card.tsx lines 38-58.
 */
export default function ProductionCard({
  order,
  isNextUp = false,
  isInProgress = false,
  onClick,
}: ProductionCardProps) {
  const borderColor = STATE_COLORS[order.state].border;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className="shadow-card relative overflow-hidden rounded-r-xl bg-[var(--bg-card)] cursor-pointer transition-opacity hover:opacity-95 active:scale-[0.98]"
    >
      {/* Left accent border */}
      <div
        className="absolute top-0 left-0 h-full w-1 rounded-l-xl"
        style={{ backgroundColor: borderColor }}
      />

      {/* Card content */}
      <div className="py-2.5 pr-4 pl-5">
        {/* Next Up badge */}
        {isNextUp && (
          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold text-white bg-[var(--primary)] mb-1">
            Next Up
          </span>
        )}

        {/* Order number + in-progress indicator */}
        <div className="flex items-center gap-1.5">
          <p className="text-card-label text-muted font-semibold">
            {order.orderNumber}
          </p>
          {isInProgress && (
            <span
              aria-label="In progress"
              className="h-2 w-2 rounded-full bg-[var(--status-mixing-header)] animate-pulse"
            />
          )}
        </div>

        {/* Customer name */}
        <p className="text-card-title text-text-primary mt-0.5 font-bold">
          {order.customer}
        </p>

        {/* Weight + product — T-34-04-01: parseFloat(order.weightLbs) guards against Pitfall 6 */}
        <p className="text-medium mt-1 text-sm font-medium">
          {formatWeight(parseFloat(order.weightLbs))} lbs &bull; {order.product}
        </p>

        {/* Delivery time */}
        <p className="text-muted mt-1.5 text-xs font-medium">
          Delivery: {order.deliveryTime}
        </p>
      </div>
    </div>
  );
}
