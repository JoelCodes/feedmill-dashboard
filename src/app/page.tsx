import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import KPICards from "@/components/KPICard";
import OrdersTable from "@/components/OrdersTable";
import OrderDetails from "@/components/OrderDetails";

export default function Dashboard() {
  return (
    <div className="flex h-screen bg-[var(--bg-page)]">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 flex flex-col gap-6 p-6 pr-8 overflow-auto">
        {/* Header */}
        <Header />

        {/* KPI Cards */}
        <KPICards />

        {/* Bottom Row */}
        <div className="flex gap-6 flex-1 min-h-0">
          {/* Orders Table */}
          <OrdersTable />

          {/* Order Details */}
          <OrderDetails />
        </div>
      </main>
    </div>
  );
}
