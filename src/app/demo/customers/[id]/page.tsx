import { notFound } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import CustomerDetailHeader from '@/components/CustomerDetailHeader';
import CustomerDetailTabs from '@/components/CustomerDetailTabs';
import { getCustomerById } from '@/services/customers';
import { getActivityEvents } from '@/services/activity';
import { getBinsByCustomerId } from '@/services/bins';
import { getOrdersByCustomerId } from '@/services/orders';
import { requireRole } from '@/lib/auth';

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireRole('demo');
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
    <DashboardLayout>
      <CustomerDetailHeader customer={customer} stats={customer.stats} bins={bins} />
      <CustomerDetailTabs events={events} orders={orders} />
    </DashboardLayout>
  );
}
