import { notFound } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import CustomerDetailHeader from '@/components/CustomerDetailHeader';
import { ActivityTimeline } from '@/components/ActivityTimeline';
import { getCustomerById } from '@/services/customers';
import { getActivityEvents } from '@/services/activity';

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  // CRITICAL: await params (Next.js 16 requirement)
  const { id } = await params;

  // Fetch customer (includes stats)
  const customer = await getCustomerById(id);

  // 404 handling
  if (!customer) {
    notFound();
  }

  // Fetch activity events for this customer
  const events = await getActivityEvents(id);

  return (
    <div className="flex h-screen bg-bg-page">
      <Sidebar />
      <main className="flex flex-1 flex-col gap-6 overflow-auto p-6 pr-8">
        <Header />
        <CustomerDetailHeader customer={customer} stats={customer.stats} />
        <ActivityTimeline events={events} />
        {/* Bins section will be added in Phase 15 */}
      </main>
    </div>
  );
}
