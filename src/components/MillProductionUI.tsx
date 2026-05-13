"use client";

import { useMemo, useState } from "react";
import {
  DemoOrder,
  ProductionState,
  MillLine,
} from "@/types/millProduction";
import FilterPill, { FilterPillColorConfig } from "@/components/ui/FilterPill";

const STATE_ORDER: ProductionState[] = [
  "Completed",
  "Mixing",
  "Blocked",
  "Pending",
];

const STATE_COLORS: Record<
  ProductionState,
  { border: string; header: string }
> = {
  Completed: {
    border: "var(--status-completed-border)",
    header: "var(--status-completed-header)",
  },
  Mixing: {
    border: "var(--status-mixing-border)",
    header: "var(--status-mixing-header)",
  },
  Blocked: {
    border: "var(--status-blocked-border)",
    header: "var(--status-blocked-header)",
  },
  Pending: {
    border: "var(--status-pending-border)",
    header: "var(--status-pending-header)",
  },
};

const PRODUCTION_STATE_PILL_CONFIG: Record<ProductionState, FilterPillColorConfig> = {
  Completed: {
    bg: "bg-success-light",
    text: "text-success-dark",
    dot: "bg-success",
    countBg: "bg-[var(--status-completed-bg-22)]",
  },
  Mixing: {
    bg: "bg-warning-light",
    text: "text-warning",
    dot: "bg-warning",
    countBg: "bg-[var(--status-mixing-bg-22)]",
  },
  Blocked: {
    bg: "bg-error-light",
    text: "text-error-dark",
    dot: "bg-error",
    countBg: "bg-[var(--status-blocked-bg-22)]",
  },
  Pending: {
    bg: "bg-pending-light",
    text: "text-muted",
    dot: "bg-pending",
    countBg: "bg-[var(--status-pending-bg-22)]",
  },
};

function formatWeight(lbs: number): string {
  if (lbs >= 1000) {
    return `${Math.round(lbs / 1000)}K`;
  }
  return lbs.toLocaleString();
}

function ProductionCard({ order }: { order: DemoOrder }) {
  const borderColor = STATE_COLORS[order.state].border;

  return (
    <div className="shadow-card relative overflow-hidden rounded-r-xl bg-[var(--bg-card)]">
      <div
        className="absolute top-0 left-0 h-full w-1 rounded-l-xl"
        style={{ backgroundColor: borderColor }}
      />
      <div className="py-2.5 pr-4 pl-5">
        <p className="text-card-label text-muted font-semibold">
          {order.orderNumber}
        </p>
        <p className="text-card-title text-text-primary mt-0.5 font-bold">
          {order.customer}
        </p>
        <p className="text-medium mt-1 text-sm font-medium">
          {order.weightLbs.toLocaleString()} lbs &bull; {order.product}
        </p>
        <p className="text-muted mt-1.5 text-xs font-medium">
          Delivery: {order.deliveryTime}
        </p>
      </div>
    </div>
  );
}

function StateSection({
  state,
  orders,
}: {
  state: ProductionState;
  orders: DemoOrder[];
}) {
  const headerColor = STATE_COLORS[state].header;
  const totalWeight = orders.reduce((sum, o) => sum + o.weightLbs, 0);

  if (orders.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline gap-3">
        <span className="text-xl font-bold" style={{ color: headerColor }}>
          {state}
        </span>
        <span className="text-muted text-base font-medium">
          {formatWeight(totalWeight)}
        </span>
      </div>
      <div className="flex flex-col gap-3">
        {orders.map((order) => (
          <ProductionCard key={order.id} order={order} />
        ))}
      </div>
    </div>
  );
}

function MillColumn({
  millLine,
  orders,
}: {
  millLine: MillLine;
  orders: DemoOrder[];
}) {
  const completedWeight = orders
    .filter((o) => o.state === "Completed")
    .reduce((sum, o) => sum + o.weightLbs, 0);
  const totalWeight = orders.reduce((sum, o) => sum + o.weightLbs, 0);

  // WR-05 fix: initialize every key explicitly so a future change that
  // shrinks STATE_ORDER does not silently leave keys undefined at the
  // ordersByState[state] read sites below.
  const ordersByState = STATE_ORDER.reduce(
    (acc, state) => {
      acc[state] = orders.filter((o) => o.state === state);
      return acc;
    },
    {
      Completed: [],
      Mixing: [],
      Blocked: [],
      Pending: [],
    } as Record<ProductionState, DemoOrder[]>
  );

  return (
    <div className="flex flex-1 flex-col gap-5">
      <div>
        <h2 className="text-primary text-2xl font-bold">{millLine}</h2>
        <p className="text-muted mt-1 text-base font-semibold">
          {formatWeight(completedWeight)} / {formatWeight(totalWeight)} lbs
        </p>
      </div>
      <div className="flex flex-col gap-6">
        {STATE_ORDER.map((state) => (
          <StateSection
            key={state}
            state={state}
            orders={ordersByState[state]}
          />
        ))}
      </div>
    </div>
  );
}

export interface MillProductionUIProps {
  orders: DemoOrder[];
}

/**
 * Client wrapper for the mill-production dashboard.
 *
 * Owns the filter strip (`activeStates: Set<ProductionState>`), state counts,
 * and column rendering. Receives `orders` as a prop from the parent RSC
 * (`src/app/demo/mill-production/page.tsx`) — never imports
 * `@/services/millProduction` directly (Phase 28 D-01, D-07).
 */
export default function MillProductionUI({ orders }: MillProductionUIProps) {
  const [activeStates, setActiveStates] = useState<Set<ProductionState>>(new Set());

  const toggleState = (state: ProductionState) => {
    setActiveStates((prev) => {
      const next = new Set(prev);
      if (next.has(state)) {
        next.delete(state);
      } else {
        next.add(state);
      }
      return next;
    });
  };

  const stateCounts = useMemo(() => {
    // WR-05 fix: initialize every key explicitly so STATE_ORDER changes
    // do not silently leave keys undefined at the read sites below.
    return STATE_ORDER.reduce(
      (acc, state) => {
        acc[state] = orders.filter((o) => o.state === state).length;
        return acc;
      },
      {
        Completed: 0,
        Mixing: 0,
        Blocked: 0,
        Pending: 0,
      } as Record<ProductionState, number>
    );
  }, [orders]);

  const filteredOrders = useMemo(() => {
    if (activeStates.size === 0) return orders;
    return orders.filter((order) => activeStates.has(order.state));
  }, [orders, activeStates]);

  const ordersByMill = useMemo<Record<MillLine, DemoOrder[]>>(
    () => ({
      Premix: filteredOrders.filter((o) => o.millLine === "Premix"),
      Excel: filteredOrders.filter((o) => o.millLine === "Excel"),
      CGM: filteredOrders.filter((o) => o.millLine === "CGM"),
    }),
    [filteredOrders],
  );

  return (
    <>
      {/* Filter strip - per D-01, D-02 */}
      <div className="flex gap-2.5">
        {STATE_ORDER.map((state) => (
          <FilterPill
            key={state}
            label={state}
            count={stateCounts[state]}
            color={PRODUCTION_STATE_PILL_CONFIG[state]}
            isActive={activeStates.has(state)}
            onClick={() => toggleState(state)}
          />
        ))}
      </div>
      <div className="flex gap-6">
        <MillColumn millLine="Premix" orders={ordersByMill.Premix} />
        <MillColumn millLine="Excel" orders={ordersByMill.Excel} />
        <MillColumn millLine="CGM" orders={ordersByMill.CGM} />
      </div>
    </>
  );
}
