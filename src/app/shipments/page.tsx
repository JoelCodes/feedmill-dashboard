import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

export default function ShipmentsPage() {
  return (
    <div className="flex h-screen bg-bg-page">
      <Sidebar />
      <main className="flex flex-1 flex-col gap-6 overflow-auto p-6 pr-8">
        <Header title="Shipments" />
      </main>
    </div>
  );
}
