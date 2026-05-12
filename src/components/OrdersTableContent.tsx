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

  // Two-way URL → state sync: when the `?selected=` param changes (incl.
  // being cleared), reflect that in component state. Writing `null` when
  // the param is absent ensures clearing `?selected=` also clears the
  // selection — without this the UI would keep a stale row highlighted
  // and scrolled-into-view despite the URL claiming no selection.
  useEffect(() => {
    const urlSelected = searchParams.get("selected");
    setSelectedOrderId(urlSelected);
  }, [searchParams]);

  return (
    <OrdersTable
      orders={orders}
      selectedOrderId={selectedOrderId}
      onSelectOrder={setSelectedOrderId}
    />
  );
}
