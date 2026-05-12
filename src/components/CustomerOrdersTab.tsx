"use client";

import { useState, useMemo } from "react";
import { Package, Search } from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import { Order, OrderStatus } from "@/types/order";
import { formatDeliveryDate } from "@/utils/formatDate";
import Link from "next/link";

interface CustomerOrdersTabProps {
  orders: Order[];
}

const STATUS_FILTERS: OrderStatus[] = ["Producing", "Ready", "Complete"];

export default function CustomerOrdersTab({ orders }: CustomerOrdersTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeStatuses, setActiveStatuses] = useState<Set<OrderStatus>>(new Set());

  const toggleStatus = (status: OrderStatus) => {
    setActiveStatuses((prev) => {
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

    // Apply status filter
    if (activeStatuses.size > 0) {
      result = result.filter((order) => activeStatuses.has(order.status));
    }

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(
        (order) =>
          order.documentNumber.toLowerCase().includes(searchLower) ||
          `${order.textureType} ${order.formulaType}`.toLowerCase().includes(searchLower)
      );
    }

    return result;
  }, [orders, activeStatuses, searchTerm]);

  const statusCounts = useMemo(() => {
    const counts: Record<OrderStatus, number> = {
      Pending: 0,
      Producing: 0,
      Ready: 0,
      "In Transit": 0,
      Complete: 0,
    };

    orders.forEach((order) => {
      counts[order.status]++;
    });

    return counts;
  }, [orders]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden rounded-[var(--radius-xl)] bg-[var(--bg-card)] p-5 shadow-[var(--shadow-sm)]">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search orders..."
          className="border-divider focus:border-primary focus:ring-primary w-full rounded-lg border py-2 pr-3 pl-10 text-sm placeholder:text-gray-400 focus:ring-1 focus:outline-none"
        />
      </div>

      {/* Filter Pills */}
      <div className="flex gap-2.5">
        {STATUS_FILTERS.map((status) => (
          <button
            key={status}
            onClick={() => toggleStatus(status)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeStatuses.has(status)
                ? "bg-primary/10 text-primary"
                : "text-text-secondary bg-gray-100 hover:bg-gray-200"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                activeStatuses.has(status) ? "bg-primary" : "bg-text-secondary"
              }`}
            />
            {status === "Producing" ? "In Production" : status}
            <span className="ml-0.5 text-[var(--fs-10)] opacity-70">
              {statusCounts[status]}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="flex min-h-0 w-full flex-1 flex-col overflow-y-auto">
        {/* Table Header */}
        <div className="flex py-2.5">
          <div className="text-text-secondary w-[var(--table-col-lg)] font-bold text-[var(--fs-10)]">
            DOCUMENT #
          </div>
          <div className="text-text-secondary flex-1 font-bold text-[var(--fs-10)]">
            PRODUCT
          </div>
          <div className="text-text-secondary w-[var(--table-col-sm)] font-bold text-[var(--fs-10)]">
            QTY (TONS)
          </div>
          <div className="text-text-secondary flex-1 font-bold text-[var(--fs-10)]">
            LOCATION
          </div>
          <div className="text-text-secondary w-[var(--table-col-sm)] font-bold text-[var(--fs-10)]">
            DELIVERY
          </div>
          <div className="text-text-secondary w-[var(--table-col-md)] font-bold text-[var(--fs-10)]">
            STATUS
          </div>
        </div>

        <div className="bg-divider h-px" />

        {/* Table Rows */}
        {filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="mb-4 h-12 w-12 text-gray-300" />
            <p className="text-text-secondary text-sm">
              {orders.length === 0
                ? "No order history yet"
                : "No orders match your current filters"}
            </p>
            {orders.length > 0 && (
              <button
                onClick={() => {
                  setActiveStatuses(new Set());
                  setSearchTerm("");
                }}
                className="text-primary mt-2 text-sm hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          filteredOrders.map((order, index) => (
            <div key={order.id}>
              <Link
                href={`/demo/orders?selected=${order.id}`}
                className={`flex cursor-pointer items-center py-3 transition-colors hover:bg-gray-50`}
              >
                <div className="flex w-[var(--table-col-lg)] items-center gap-2">
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
                  {order.textureType} {order.formulaType}
                </div>
                <div className="text-text-primary w-[var(--table-col-sm)] text-xs font-bold">
                  {order.quantity}
                </div>
                <div className="text-text-primary flex-1 text-xs">
                  {order.location}
                </div>
                <div className="text-text-primary w-[var(--table-col-sm)] text-xs">
                  {formatDeliveryDate(order.deliveryDate)}
                </div>
                <div className="w-[var(--table-col-md)]">
                  <StatusBadge status={order.status} />
                </div>
              </Link>
              {index < filteredOrders.length - 1 && (
                <div className="bg-divider h-px" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
