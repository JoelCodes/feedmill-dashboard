"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import OrdersTable from "./OrdersTable";
import type { Order } from "@/types/order";

interface OrdersTableContentProps {
  orders: Order[];
}

/**
 * Client wrapper around `OrdersTable` that owns the `?selected=` URL
 * parameter sync. Extracted from the previous `OrdersContent` inside
 * `src/app/demo/orders/page.tsx` so the parent page can become an
 * async Server Component (a `'use client'` directive applies to the
 * whole file — an RSC and a client subcomponent cannot coexist in the
 * same file).
 *
 * `orders` is passed down from the RSC page (which calls
 * `await getOrders()` server-side after `await requireRole('demo')`).
 */
export default function OrdersTableContent({ orders }: OrdersTableContentProps) {
  const searchParams = useSearchParams();
  const initialSelected = searchParams.get("selected");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(initialSelected);

  // Sync URL param to state when it changes (e.g., navigating from timeline)
  useEffect(() => {
    const urlSelected = searchParams.get("selected");
    if (urlSelected) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Syncing URL param to state on navigation
      setSelectedOrderId(urlSelected);
    }
  }, [searchParams]);

  return (
    <OrdersTable
      orders={orders}
      selectedOrderId={selectedOrderId}
      onSelectOrder={setSelectedOrderId}
    />
  );
}
