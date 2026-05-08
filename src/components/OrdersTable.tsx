"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { CheckCircle, Package, Search } from "lucide-react";
import StatusBadge, { STATUS_CONFIG } from "@/components/ui/StatusBadge";
import FilterPill, { FilterPillColorConfig } from "@/components/ui/FilterPill";
import { OrderStatus, Order } from "@/types/order";
import { getOrders } from "@/services/orders";
import { formatDeliveryDate } from "@/utils/formatDate";
import { useDebounce } from "@/hooks/useDebounce";

const STATUS_PILL_CONFIG: Record<OrderStatus, FilterPillColorConfig> = {
  "Pending": {
    bg: "bg-[var(--pending-light)]",
    text: "text-[var(--text-secondary)]",
    dot: "bg-[var(--pending)]",
    countBg: "bg-[var(--status-pending-bg-22)]",
  },
  "Producing": {
    bg: "bg-[var(--warning-light)]",
    text: "text-[var(--warning)]",
    dot: "bg-[var(--warning)]",
    countBg: "bg-[var(--status-mixing-bg-22)]",
  },
  "Ready": {
    bg: "bg-[var(--info-light)]",
    text: "text-[var(--info)]",
    dot: "bg-[var(--info)]",
    countBg: "bg-[color-mix(in_srgb,var(--info)_13%,transparent)]",
  },
  "In Transit": {
    bg: "bg-[var(--purple-light)]",
    text: "text-[var(--purple)]",
    dot: "bg-[var(--purple)]",
    countBg: "bg-[color-mix(in_srgb,var(--purple)_13%,transparent)]",
  },
  "Complete": {
    bg: "bg-[var(--success-light)]",
    text: "text-[var(--success-dark)]",
    dot: "bg-[var(--success-dark)]",
    countBg: "bg-[var(--status-completed-bg-22)]",
  },
};

interface OrdersTableProps {
  selectedOrderId: string | null;
  onSelectOrder: (id: string) => void;
  externalSearchTerm?: string;
}

export default function OrdersTable({ selectedOrderId, onSelectOrder, externalSearchTerm }: OrdersTableProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeStatuses, setActiveStatuses] = useState<Set<OrderStatus>>(new Set());
  const [hasChangesFilter, setHasChangesFilter] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const tableRef = useRef<HTMLDivElement>(null);

  const activeSearch = useMemo(() =>
    externalSearchTerm || debouncedSearch,
    [externalSearchTerm, debouncedSearch]
  );

  useEffect(() => {
    getOrders()
      .then(setOrders)
      .catch((error) => {
        if (process.env.NODE_ENV !== 'production') {
          console.error('Failed to load orders:', error);
        }
      });
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

  const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const highlightMatch = (text: string, query: string): React.ReactNode => {
    if (!query) return text;

    const escaped = escapeRegex(query);
    const regex = new RegExp(`(${escaped})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, i) =>
      regex.test(part)
        ? <mark key={i} className="bg-[color-mix(in_srgb,var(--primary)_20%,transparent)] rounded px-0.5 font-semibold">{part}</mark>
        : part
    );
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

    // Apply search filter (customer name or product)
    if (activeSearch) {
      const searchLower = activeSearch.toLowerCase();
      result = result.filter(order =>
        order.customer.toLowerCase().includes(searchLower) ||
        `${order.textureType} ${order.formulaType}`.toLowerCase().includes(searchLower)
      );
    }

    return result;
  }, [orders, activeStatuses, hasChangesFilter, activeSearch]);

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

    // Apply search filter
    if (activeSearch) {
      const searchLower = activeSearch.toLowerCase();
      ordersToCount = ordersToCount.filter(o =>
        o.customer.toLowerCase().includes(searchLower) ||
        `${o.textureType} ${o.formulaType}`.toLowerCase().includes(searchLower)
      );
    }

    ordersToCount.forEach(order => {
      counts[order.status]++;
    });

    return counts;
  }, [orders, hasChangesFilter, activeSearch]);

  const hasChangesCount = useMemo(() => {
    // Count orders with changes, respecting status filter
    let ordersToCount = orders;
    if (activeStatuses.size > 0) {
      ordersToCount = ordersToCount.filter(o => activeStatuses.has(o.status));
    }

    // Apply search filter
    if (activeSearch) {
      const searchLower = activeSearch.toLowerCase();
      ordersToCount = ordersToCount.filter(o =>
        o.customer.toLowerCase().includes(searchLower) ||
        `${o.textureType} ${o.formulaType}`.toLowerCase().includes(searchLower)
      );
    }

    return ordersToCount.filter(o => o.hasChanges).length;
  }, [orders, activeStatuses, activeSearch]);

  const dispatchedThisWeek = useMemo(() => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return orders.filter(o =>
      o.status === 'Complete' &&
      new Date(o.deliveryDate) > oneWeekAgo
    ).length;
  }, [orders]);

  const visibleIds = filteredOrders.map(o => o.id);

  // Derive valid selection - null if selected order is not in filtered list
  const validSelectedId = selectedOrderId && visibleIds.includes(selectedOrderId) ? selectedOrderId : null;

  // Wrap onSelectOrder in useCallback to avoid infinite loops in useEffect dependencies
  const handleSelectOrder = useCallback((id: string) => {
    onSelectOrder(id);
  }, [onSelectOrder]);

  // Auto-select first row on initial load
  useEffect(() => {
    if (!selectedOrderId && filteredOrders.length > 0) {
      const firstOrder = filteredOrders[0];
      if (firstOrder) {
        handleSelectOrder(firstOrder.id);
      }
    }
  }, [selectedOrderId, filteredOrders, handleSelectOrder]);

  // Auto-select first visible when current selection filtered out
  useEffect(() => {
    if (!validSelectedId && selectedOrderId && filteredOrders.length > 0) {
      const firstOrder = filteredOrders[0];
      if (firstOrder) {
        handleSelectOrder(firstOrder.id);
      }
    }
  }, [validSelectedId, filteredOrders, selectedOrderId, handleSelectOrder]);

  // Scroll selected row into view when keyboard navigating
  useEffect(() => {
    if (validSelectedId && tableRef.current) {
      const selectedRow = tableRef.current.querySelector(`[data-order-id="${validSelectedId}"]`);
      if (selectedRow) {
        selectedRow.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [validSelectedId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!validSelectedId || visibleIds.length === 0) {
      // If nothing selected and arrow pressed, select first row
      if (e.key === 'ArrowDown' && visibleIds.length > 0) {
        e.preventDefault();
        handleSelectOrder(visibleIds[0]);
      }
      return;
    }

    const currentIndex = visibleIds.indexOf(validSelectedId);

    if (e.key === 'ArrowDown' && currentIndex < visibleIds.length - 1) {
      e.preventDefault();
      handleSelectOrder(visibleIds[currentIndex + 1]);
    } else if (e.key === 'ArrowUp' && currentIndex > 0) {
      e.preventDefault();
      handleSelectOrder(visibleIds[currentIndex - 1]);
    }
    // Note: Enter key handling deferred to Phase 2 (opens details panel)
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden rounded-[var(--radius-xl)] bg-[var(--bg-card)] p-5.25 shadow-[var(--shadow-sm)]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-text-primary text-lg font-bold">
            Outgoing Orders
          </h2>
          <div className="flex items-center gap-1">
            <CheckCircle className="text-success h-3.75 w-3.75" />
            <span className="text-text-secondary text-sm">
              {dispatchedThisWeek} dispatched this week
            </span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by customer or product..."
          className="border-divider focus:border-primary focus:ring-primary w-full rounded-lg border py-2 pr-3 pl-10 text-sm placeholder:text-[var(--text-secondary)] focus:ring-1 focus:outline-none"
        />
      </div>

      {/* Status Filters */}
      <div className="flex gap-2.5">
        <FilterPill
          label="Complete"
          count={statusCounts["Complete"]}
          color={STATUS_PILL_CONFIG["Complete"]}
          isActive={activeStatuses.has("Complete")}
          onClick={() => toggleStatus("Complete")}
        />
        <FilterPill
          label="Transit"
          count={statusCounts["In Transit"]}
          color={STATUS_PILL_CONFIG["In Transit"]}
          isActive={activeStatuses.has("In Transit")}
          onClick={() => toggleStatus("In Transit")}
        />
        <FilterPill
          label="Producing"
          count={statusCounts["Producing"]}
          color={STATUS_PILL_CONFIG["Producing"]}
          isActive={activeStatuses.has("Producing")}
          onClick={() => toggleStatus("Producing")}
        />
        <FilterPill
          label="Ready"
          count={statusCounts["Ready"]}
          color={STATUS_PILL_CONFIG["Ready"]}
          isActive={activeStatuses.has("Ready")}
          onClick={() => toggleStatus("Ready")}
        />
        <FilterPill
          label="Pending"
          count={statusCounts["Pending"]}
          color={STATUS_PILL_CONFIG["Pending"]}
          isActive={activeStatuses.has("Pending")}
          onClick={() => toggleStatus("Pending")}
        />
        <FilterPill
          label="Has Changes"
          count={hasChangesCount}
          isActive={hasChangesFilter}
          onClick={() => setHasChangesFilter(prev => !prev)}
          showDot={true}
          dotColor="bg-error"
        />
      </div>

      {/* Table */}
      <div
        ref={tableRef}
        className="flex min-h-0 w-full flex-1 flex-col overflow-y-auto focus:outline-none"
        role="grid"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        aria-label="Orders table"
      >
        {/* Table Header */}
        <div className="flex py-2.5">
          <div className="text-text-secondary flex-1 text-[var(--fs-10)] font-bold">
            DOCUMENT #
          </div>
          <div className="text-text-secondary flex-1 text-[var(--fs-10)] font-bold">
            CUSTOMER
          </div>
          <div className="text-text-secondary flex-1 text-[var(--fs-10)] font-bold">
            PRODUCT
          </div>
          <div className="text-text-secondary flex-1 text-[var(--fs-10)] font-bold">
            QTY (TONS)
          </div>
          <div className="text-text-secondary flex-1 text-[var(--fs-10)] font-bold">
            LOCATION
          </div>
          <div className="text-text-secondary flex-1 text-[var(--fs-10)] font-bold">
            DELIVERY
          </div>
          <div className="text-text-secondary flex-1 text-[var(--fs-10)] font-bold">
            STATUS
          </div>
        </div>

        <div className="bg-divider h-px" />

        {/* Table Rows */}
        {filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="mb-4 h-12 w-12 text-[var(--text-secondary)]" />
            <p className="text-text-secondary text-sm">
              No orders match your current filters
            </p>
            <button
              onClick={() => {
                setActiveStatuses(new Set());
                setHasChangesFilter(false);
                setSearchTerm('');
              }}
              className="text-primary mt-2 text-sm hover:underline"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          filteredOrders.map((order, index) => (
            <div key={order.id}>
              <div
                data-order-id={order.id}
                onClick={() => handleSelectOrder(order.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelectOrder(order.id);
                  }
                }}
                role="row"
                tabIndex={-1}
                className={`flex cursor-pointer items-center py-3 transition-colors
                  ${validSelectedId === order.id
                    ? 'bg-[color-mix(in_srgb,var(--primary)_10%,transparent)]'
                    : 'hover:bg-[var(--bg-page)]'
                  }`}
              >
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
                {highlightMatch(order.customer, activeSearch)}
              </div>
              <div className="text-text-primary flex-1 text-xs">
                {highlightMatch(`${order.textureType} ${order.formulaType}`, activeSearch)}
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
          ))
        )}
      </div>
    </div>
  );
}

