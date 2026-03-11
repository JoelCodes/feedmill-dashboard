"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import KPICards from "@/components/KPICard";
import OrdersTable from "@/components/OrdersTable";
import OrderDetails from "@/components/OrderDetails";

export default function Dashboard() {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  return (
    <div className="bg-bg-page flex h-screen">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex flex-1 flex-col gap-6 overflow-auto p-6 pr-8">
        {/* Header */}
        <Header />

        {/* KPI Cards */}
        <KPICards />

        {/* Bottom Row */}
        <div className="flex min-h-0 flex-1 gap-6">
          {/* Orders Table */}
          <OrdersTable
            selectedOrderId={selectedOrderId}
            onSelectOrder={setSelectedOrderId}
          />

          {/* Order Details */}
          <OrderDetails orderId={selectedOrderId} />
        </div>
      </main>
    </div>
  );
}
