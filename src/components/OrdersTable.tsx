"use client";

import { useState, useEffect, useMemo } from "react";
import { CheckCircle, Package } from "lucide-react";
import StatusBadge, { STATUS_CONFIG } from "@/components/ui/StatusBadge";
import { OrderStatus, Order } from "@/types/order";
import { getOrders } from "@/services/orders";
import { formatDeliveryDate } from "@/utils/formatDate";

export default function OrdersTable() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeStatuses, setActiveStatuses] = useState<Set<OrderStatus>>(new Set());
  const [hasChangesFilter, setHasChangesFilter] = useState(false);

  useEffect(() => {
    getOrders().then(setOrders);
  }, []);

  const toggleStatus = (status: OrderStatus) => {
    setActiveStatuses(prev => {
      const next = new Set(prev);
      if (next.has(status)) {
        next.delete(status);
      } else {
        next.add(status);
      }
      return next;
    });
  };

  const filteredOrders = useMemo(() => {
    let result = orders;

    // Apply status filter (empty set = show all)
    if (activeStatuses.size > 0) {
      result = result.filter(order => activeStatuses.has(order.status));
    }

    // Apply has changes filter
    if (hasChangesFilter) {
      result = result.filter(order => order.hasChanges);
    }

    return result;
  }, [orders, activeStatuses, hasChangesFilter]);

  const statusCounts = useMemo(() => {
    const counts: Record<OrderStatus, number> = {
      'Pending': 0,
      'Producing': 0,
      'Ready': 0,
      'In Transit': 0,
      'Complete': 0,
    };

    // Count from orders respecting hasChanges filter only
    // (status counts should NOT filter themselves out)
    let ordersToCount = orders;
    if (hasChangesFilter) {
      ordersToCount = ordersToCount.filter(o => o.hasChanges);
    }

    ordersToCount.forEach(order => {
      counts[order.status]++;
    });

    return counts;
  }, [orders, hasChangesFilter]);

  const hasChangesCount = useMemo(() => {
    // Count orders with changes, respecting status filter
    let ordersToCount = orders;
    if (activeStatuses.size > 0) {
      ordersToCount = ordersToCount.filter(o => activeStatuses.has(o.status));
    }
    return ordersToCount.filter(o => o.hasChanges).length;
  }, [orders, activeStatuses]);
  return (
    <div className="flex flex-1 flex-col gap-4 rounded-[15px] bg-white p-5.25 shadow-[0_3.5px_5px_rgba(0,0,0,0.02)]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-text-primary text-lg font-bold">
            Outgoing Orders
          </h2>
          <div className="flex items-center gap-1">
            <CheckCircle className="text-success h-3.75 w-3.75" />
            <span className="text-text-secondary text-sm">
              18 dispatched this week
            </span>
          </div>
        </div>
      </div>

      {/* Status Filters */}
      <div className="flex gap-2.5">
        {/* All pill removed - when nothing selected, show all orders automatically */}
        <FilterPill
          label="Complete"
          count={statusCounts["Complete"]}
          status="Complete"
        />
        <FilterPill
          label="Transit"
          count={statusCounts["In Transit"]}
          status="In Transit"
        />
        <FilterPill
          label="Producing"
          count={statusCounts["Producing"]}
          status="Producing"
        />
        <FilterPill
          label="Ready"
          count={statusCounts["Ready"]}
          status="Ready"
        />
        <FilterPill
          label="Pending"
          count={statusCounts["Pending"]}
          status="Pending"
        />
      </div>

      {/* Table */}
      <div className="flex w-full flex-col">
        {/* Table Header */}
        <div className="flex py-2.5">
          <div className="text-text-secondary flex-1 text-[10px] font-bold">
            DOCUMENT #
          </div>
          <div className="text-text-secondary flex-1 text-[10px] font-bold">
            CUSTOMER
          </div>
          <div className="text-text-secondary flex-1 text-[10px] font-bold">
            PRODUCT
          </div>
          <div className="text-text-secondary flex-1 text-[10px] font-bold">
            QTY (TONS)
          </div>
          <div className="text-text-secondary flex-1 text-[10px] font-bold">
            LOCATION
          </div>
          <div className="text-text-secondary flex-1 text-[10px] font-bold">
            DELIVERY
          </div>
          <div className="text-text-secondary flex-1 text-[10px] font-bold">
            STATUS
          </div>
        </div>

        <div className="bg-divider h-px" />

        {/* Table Rows */}
        {filteredOrders.map((order, index) => (
          <div key={order.id}>
            <div className="flex items-center py-3">
              <div className="flex flex-1 items-center gap-2">
                <div className="bg-primary flex h-6 w-6 items-center justify-center rounded-md">
                  <Package className="h-3 w-3 text-white" />
                </div>
                <span className="text-text-primary text-xs font-bold">
                  {order.documentNumber}
                </span>
                {order.hasChanges && (
                  <div className="bg-error h-2 w-2 rounded-full" />
                )}
              </div>
              <div className="text-text-primary flex-1 text-xs">
                {order.customer}
              </div>
              <div className="text-text-primary flex-1 text-xs">
                {order.textureType} {order.formulaType}
              </div>
              <div className="text-text-primary flex-1 text-xs font-bold">
                {order.quantity}
              </div>
              <div className="text-text-primary flex-1 text-xs">
                {order.location}
              </div>
              <div className="text-text-primary flex-1 text-xs">
                {formatDeliveryDate(order.deliveryDate)}
              </div>
              <div className="flex-1">
                <StatusBadge status={order.status} />
              </div>
            </div>
            {index < filteredOrders.length - 1 && (
              <div className="bg-divider h-px" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function FilterPill({
  label,
  count,
  status,
  active = false,
}: {
  label: string;
  count: number;
  status?: OrderStatus;
  active?: boolean;
}) {
  if (active) {
    return (
      <div className="bg-primary flex items-center gap-1.5 rounded-xl px-3.5 py-1.5">
        <span className="text-[11px] font-bold text-white">{label}</span>
        <div className="rounded-lg bg-white/20 px-1.5 py-0.5">
          <span className="text-[10px] font-bold text-white">{count}</span>
        </div>
      </div>
    );
  }

  const config = status ? STATUS_CONFIG[status] : null;
  if (!config) return null;

  return (
    <div
      className={`flex items-center gap-1.5 ${config.bg} rounded-xl border border-transparent px-3.5 py-1.5`}
    >
      <div className={`h-2 w-2 rounded-full ${config.dot}`} />
      <span className={`text-[11px] font-bold ${config.text}`}>{label}</span>
      <div className={`${config.countBg} flex items-center rounded-lg px-1.5`}>
        <span className={`text-[10px] font-bold ${config.text}`}>{count}</span>
      </div>
    </div>
  );
}

