import { notFound } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import CustomerDetailHeader from '@/components/CustomerDetailHeader';
import CustomerDetailTabs from '@/components/CustomerDetailTabs';
import { getCustomerById } from '@/services/customers';
import { getActivityEvents } from '@/services/activity';
import { getBinsByCustomerId } from '@/services/bins';
import { getOrdersByCustomerId } from '@/services/orders';

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  // CRITICAL: await params (Next.js 16 requirement)
  const { id } = await params;

  // Parallel fetch: customer, events, bins, and orders (D-07)
  const [customer, events, bins, orders] = await Promise.all([
    getCustomerById(id),
    getActivityEvents(id),
    getBinsByCustomerId(id),
    getOrdersByCustomerId(id),
  ]);

  // 404 handling
  if (!customer) {
    notFound();
  }

  return (
    <div className="bg-bg-page flex h-screen">
      <Sidebar />
      <main className="flex flex-1 flex-col gap-6 overflow-auto p-6 pr-8">
        <Header />
        <CustomerDetailHeader customer={customer} stats={customer.stats} bins={bins} />
        <CustomerDetailTabs events={events} orders={orders} />
      </main>
    </div>
  );
}
