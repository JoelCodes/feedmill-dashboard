"use client";

import { useState, useEffect, useMemo } from "react";
import { CheckCircle, Package, Search } from "lucide-react";
import StatusBadge, { STATUS_CONFIG } from "@/components/ui/StatusBadge";
import { OrderStatus, Order } from "@/types/order";
import { getOrders } from "@/services/orders";
import { formatDeliveryDate } from "@/utils/formatDate";
import { useDebounce } from "@/hooks/useDebounce";

export default function OrdersTable() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeStatuses, setActiveStatuses] = useState<Set<OrderStatus>>(new Set());
  const [hasChangesFilter, setHasChangesFilter] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);

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

  const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const highlightMatch = (text: string, query: string): React.ReactNode => {
    if (!query) return text;

    const escaped = escapeRegex(query);
    const regex = new RegExp(`(${escaped})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, i) =>
      regex.test(part)
        ? <mark key={i} className="bg-primary/20 rounded px-0.5 font-semibold">{part}</mark>
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
    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase();
      result = result.filter(order =>
        order.customer.toLowerCase().includes(searchLower) ||
        `${order.textureType} ${order.formulaType}`.toLowerCase().includes(searchLower)
      );
    }

    return result;
  }, [orders, activeStatuses, hasChangesFilter, debouncedSearch]);

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
    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase();
      ordersToCount = ordersToCount.filter(o =>
        o.customer.toLowerCase().includes(searchLower) ||
        `${o.textureType} ${o.formulaType}`.toLowerCase().includes(searchLower)
      );
    }

    ordersToCount.forEach(order => {
      counts[order.status]++;
    });

    return counts;
  }, [orders, hasChangesFilter, debouncedSearch]);

  const hasChangesCount = useMemo(() => {
    // Count orders with changes, respecting status filter
    let ordersToCount = orders;
    if (activeStatuses.size > 0) {
      ordersToCount = ordersToCount.filter(o => activeStatuses.has(o.status));
    }

    // Apply search filter
    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase();
      ordersToCount = ordersToCount.filter(o =>
        o.customer.toLowerCase().includes(searchLower) ||
        `${o.textureType} ${o.formulaType}`.toLowerCase().includes(searchLower)
      );
    }

    return ordersToCount.filter(o => o.hasChanges).length;
  }, [orders, activeStatuses, debouncedSearch]);
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

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by customer or product..."
          className="border-divider focus:border-primary focus:ring-primary w-full rounded-lg border py-2 pr-3 pl-10 text-sm placeholder:text-gray-400 focus:ring-1 focus:outline-none"
        />
      </div>

      {/* Status Filters */}
      <div className="flex gap-2.5">
        <FilterPill
          label="Complete"
          count={statusCounts["Complete"]}
          status="Complete"
          isActive={activeStatuses.has("Complete")}
          onClick={() => toggleStatus("Complete")}
        />
        <FilterPill
          label="Transit"
          count={statusCounts["In Transit"]}
          status="In Transit"
          isActive={activeStatuses.has("In Transit")}
          onClick={() => toggleStatus("In Transit")}
        />
        <FilterPill
          label="Producing"
          count={statusCounts["Producing"]}
          status="Producing"
          isActive={activeStatuses.has("Producing")}
          onClick={() => toggleStatus("Producing")}
        />
        <FilterPill
          label="Ready"
          count={statusCounts["Ready"]}
          status="Ready"
          isActive={activeStatuses.has("Ready")}
          onClick={() => toggleStatus("Ready")}
        />
        <FilterPill
          label="Pending"
          count={statusCounts["Pending"]}
          status="Pending"
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
                {highlightMatch(order.customer, debouncedSearch)}
              </div>
              <div className="text-text-primary flex-1 text-xs">
                {highlightMatch(`${order.textureType} ${order.formulaType}`, debouncedSearch)}
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

interface FilterPillProps {
  label: string;
  count: number;
  status?: OrderStatus;
  isActive: boolean;
  onClick: () => void;
  showDot?: boolean;
  dotColor?: string;
}

function FilterPill({ label, count, status, isActive, onClick, showDot, dotColor }: FilterPillProps) {
  const config = status ? STATUS_CONFIG[status] : null;

  // Active state styling (like current "All" pill)
  if (isActive) {
    return (
      <button
        onClick={onClick}
        className="bg-primary flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 transition-colors"
      >
        {showDot && <div className={`h-2 w-2 rounded-full ${dotColor || 'bg-white'}`} />}
        <span className="text-[11px] font-bold text-white">{label}</span>
        <div className="rounded-lg bg-white/20 px-1.5 py-0.5">
          <span className="text-[10px] font-bold text-white">{count}</span>
        </div>
      </button>
    );
  }

  // Inactive state with status colors (or gray for non-status pills)
  const bgClass = config?.bg || 'bg-gray-100';
  const textClass = config?.text || 'text-gray-600';
  const dotClass = showDot ? (dotColor || config?.dot || 'bg-gray-600') : config?.dot;
  const countBgClass = config?.countBg || 'bg-gray-200';

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 ${bgClass} rounded-xl border border-transparent px-3.5 py-1.5 transition-colors hover:opacity-80`}
    >
      {dotClass && <div className={`h-2 w-2 rounded-full ${dotClass}`} />}
      <span className={`text-[11px] font-bold ${textClass}`}>{label}</span>
      <div className={`${countBgClass} flex items-center rounded-lg px-1.5`}>
        <span className={`text-[10px] font-bold ${textClass}`}>{count}</span>
      </div>
    </button>
  );
}

