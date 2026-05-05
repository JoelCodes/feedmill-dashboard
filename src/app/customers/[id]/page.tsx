import { notFound } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import CustomerDetailHeader from '@/components/CustomerDetailHeader';
import { ActivityTimeline } from '@/components/ActivityTimeline';
import { BinGaugeRow } from '@/components/BinGaugeRow';
import { getCustomerById } from '@/services/customers';
import { getActivityEvents } from '@/services/activity';
import { getBinsByCustomerId } from '@/services/bins';

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  // CRITICAL: await params (Next.js 16 requirement)
  const { id } = await params;

  // Parallel fetch: customer, events, and bins (D-07)
  const [customer, events, bins] = await Promise.all([
    getCustomerById(id),
    getActivityEvents(id),
    getBinsByCustomerId(id),
  ]);

  // 404 handling
  if (!customer) {
    notFound();
  }

  return (
    <div className="flex h-screen bg-bg-page">
      <Sidebar />
      <main className="flex flex-1 flex-col gap-6 overflow-auto p-6 pr-8">
        <Header />
        <CustomerDetailHeader customer={customer} stats={customer.stats} />
        <ActivityTimeline events={events} />
        <BinGaugeRow bins={bins} />
      </main>
    </div>
  );
}
