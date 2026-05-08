"use client";

import { useState } from "react";
import { ActivityTimeline } from "@/components/ui/Timeline";
import CustomerOrdersTab from "@/components/CustomerOrdersTab";
import { ActivityEvent } from "@/types/activity";
import { Order } from "@/types/order";

type TabType = "activity" | "orders";

interface CustomerDetailTabsProps {
  events: ActivityEvent[];
  orders: Order[];
}

export default function CustomerDetailTabs({ events, orders }: CustomerDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>("activity");

  return (
    <>
      {/* Tab Bar */}
      <div className="flex w-full">
        <button
          onClick={() => setActiveTab("activity")}
          className={`px-5 py-3 font-medium text-[var(--fs-13)] transition-colors ${
            activeTab === "activity"
              ? "border-primary text-primary border-b-2 font-bold"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          Activity Timeline
        </button>
        <button
          onClick={() => setActiveTab("orders")}
          className={`px-5 py-3 font-medium text-[var(--fs-13)] transition-colors ${
            activeTab === "orders"
              ? "border-primary text-primary border-b-2 font-bold"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          Orders
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "activity" ? (
        <ActivityTimeline events={events} />
      ) : (
        <CustomerOrdersTab orders={orders} />
      )}
    </>
  );
}
