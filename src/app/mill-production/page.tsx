"use client";

import { useEffect, useState } from "react";
import {
  ProductionOrder,
  ProductionState,
  MillLine,
} from "@/types/millProduction";
import { getProductionOrders } from "@/services/millProduction";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

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
  Completed: { border: "#38a169", header: "#276749" },
  Mixing: { border: "#d69e2e", header: "#975a16" },
  Blocked: { border: "#e53e3e", header: "#c53030" },
  Pending: { border: "#a0aec0", header: "#4a5568" },
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
    <div
      className="relative overflow-hidden rounded-r-xl bg-white"
      style={{
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
      }}
    >
      <div
        className="absolute left-0 top-0 h-full w-1 rounded-l-xl"
        style={{ backgroundColor: borderColor }}
      />
      <div className="py-2.5 pl-5 pr-4">
        <p className="text-[11px] font-semibold text-[#718096]">
          {order.orderNumber}
        </p>
        <p className="mt-1 text-[15px] font-bold text-[#2d3748]">
          {order.customer}
        </p>
        <p className="mt-2 text-sm font-medium text-[#4a5568]">
          {order.weightLbs.toLocaleString()} lbs &bull; {order.product}
        </p>
        <p className="mt-1.5 text-xs font-medium text-[#718096]">
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
        <span className="text-base font-medium text-[#718096]">
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
        <h2 className="text-2xl font-bold text-[#2d3748]">{millLine}</h2>
        <p className="mt-1 text-base font-semibold text-[#718096]">
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
    Premix: orders.filter((o) => o.millLine === "Premix"),
    Excel: orders.filter((o) => o.millLine === "Excel"),
    CGM: orders.filter((o) => o.millLine === "CGM"),
  };

  return (
    <div className="flex h-screen bg-bg-page">
      <Sidebar />
      <main className="flex flex-1 flex-col gap-6 overflow-auto p-6 pr-8">
        <Header />
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
