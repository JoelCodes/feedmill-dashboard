"use client";

import { useEffect, useState, useMemo } from "react";
import {
  ProductionOrder,
  ProductionState,
  MillLine,
} from "@/types/millProduction";
import { getProductionOrders } from "@/services/millProduction";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import FilterPill, { FilterPillColorConfig } from "@/components/FilterPill";

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

function ProductionCard({ order }: { order: ProductionOrder }) {
  const borderColor = STATE_COLORS[order.state].border;

  return (
    <div className="relative overflow-hidden rounded-r-xl bg-white shadow-card">
      <div
        className="absolute left-0 top-0 h-full w-1 rounded-l-xl"
        style={{ backgroundColor: borderColor }}
      />
      <div className="py-2.5 pl-5 pr-4">
        <p className="text-card-label font-semibold text-muted">
          {order.orderNumber}
        </p>
        <p className="mt-0.5 text-card-title font-bold text-text-primary">
          {order.customer}
        </p>
        <p className="mt-1 text-sm font-medium text-medium">
          {order.weightLbs.toLocaleString()} lbs &bull; {order.product}
        </p>
        <p className="mt-1.5 text-xs font-medium text-muted">
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
  orders: ProductionOrder[];
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
        <span className="text-base font-medium text-muted">
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
  orders: ProductionOrder[];
}) {
  const completedWeight = orders
    .filter((o) => o.state === "Completed")
    .reduce((sum, o) => sum + o.weightLbs, 0);
  const totalWeight = orders.reduce((sum, o) => sum + o.weightLbs, 0);

  const ordersByState = STATE_ORDER.reduce(
    (acc, state) => {
      acc[state] = orders.filter((o) => o.state === state);
      return acc;
    },
    {} as Record<ProductionState, ProductionOrder[]>
  );

  return (
    <div className="flex flex-1 flex-col gap-5">
      <div>
        <h2 className="text-2xl font-bold text-primary">{millLine}</h2>
        <p className="mt-1 text-base font-semibold text-muted">
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

function LoadingSkeleton() {
  return (
    <div className="flex gap-6">
      {[1, 2, 3].map((col) => (
        <div key={col} className="flex flex-1 flex-col gap-5">
          <div>
            <div className="h-8 w-24 animate-pulse rounded bg-gray-200" />
            <div className="mt-1 h-5 w-32 animate-pulse rounded bg-gray-200" />
          </div>
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map((card) => (
              <div
                key={card}
                className="h-24 animate-pulse rounded-xl bg-gray-200"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function MillProductionPage() {
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStates, setActiveStates] = useState<Set<ProductionState>>(new Set());

  const toggleState = (state: ProductionState) => {
    setActiveStates(prev => {
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
    return STATE_ORDER.reduce((acc, state) => {
      acc[state] = orders.filter(o => o.state === state).length;
      return acc;
    }, {} as Record<ProductionState, number>);
  }, [orders]);

  const filteredOrders = useMemo(() => {
    if (activeStates.size === 0) return orders;
    return orders.filter(order => activeStates.has(order.state));
  }, [orders, activeStates]);

  useEffect(() => {
    getProductionOrders()
      .then((data) => {
        setOrders(data);
        setLoading(false);
      })
      .catch((error) => {
        if (process.env.NODE_ENV !== 'production') {
          console.error('Failed to load production orders:', error);
        }
        setLoading(false);
      });
  }, []);

  const ordersByMill: Record<MillLine, ProductionOrder[]> = {
    Premix: filteredOrders.filter((o) => o.millLine === "Premix"),
    Excel: filteredOrders.filter((o) => o.millLine === "Excel"),
    CGM: filteredOrders.filter((o) => o.millLine === "CGM"),
  };

  return (
    <div className="flex h-screen bg-bg-page">
      <Sidebar />
      <main className="flex flex-1 flex-col gap-6 overflow-auto p-6 pr-8">
        <Header />
        {/* Filter strip - per D-01, D-02 */}
        <div className="flex gap-2.5">
          {STATE_ORDER.map(state => (
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
        {loading ? (
          <LoadingSkeleton />
        ) : (
          <div className="flex gap-6">
            <MillColumn millLine="Premix" orders={ordersByMill.Premix} />
            <MillColumn millLine="Excel" orders={ordersByMill.Excel} />
            <MillColumn millLine="CGM" orders={ordersByMill.CGM} />
          </div>
        )}
      </main>
    </div>
  );
}
