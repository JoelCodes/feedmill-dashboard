"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import OrdersTable from "@/components/OrdersTable";

function OrdersContent() {
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
      selectedOrderId={selectedOrderId}
      onSelectOrder={setSelectedOrderId}
    />
  );
}

export default function OrdersPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={<div className="flex-1 animate-pulse rounded-[var(--radius-xl)] bg-[var(--divider)]" />}>
        <OrdersContent />
      </Suspense>
    </DashboardLayout>
  );
}
