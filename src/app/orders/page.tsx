"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import OrdersTable from "@/components/OrdersTable";

function OrdersContent() {
  const searchParams = useSearchParams();
  const initialSelected = searchParams.get("selected");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(initialSelected);

  // Sync URL param to state when it changes (e.g., navigating from timeline)
  useEffect(() => {
    const urlSelected = searchParams.get("selected");
    if (urlSelected) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional: syncing external URL param to local state
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
    <div className="bg-bg-page flex h-screen">
      <Sidebar />
      <main className="flex flex-1 flex-col gap-6 overflow-auto p-6 pr-8">
        <Header />
        <Suspense fallback={<div className="flex-1 animate-pulse rounded-[var(--radius-xl)] bg-[var(--divider)]" />}>
          <OrdersContent />
        </Suspense>
      </main>
    </div>
  );
}
