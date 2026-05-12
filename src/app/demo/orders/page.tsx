import { Suspense } from 'react';
import { requireRole } from '@/lib/auth';
import { getOrders } from '@/services/orders';
import DashboardLayout from '@/components/DashboardLayout';
import OrdersTableContent from '@/components/OrdersTableContent';

export default async function OrdersPage() {
  await requireRole('demo');
  const orders = await getOrders();

  return (
    <DashboardLayout>
      <Suspense
        fallback={
          <div className="flex-1 animate-pulse rounded-[var(--radius-xl)] bg-[var(--divider)]" />
        }
      >
        <OrdersTableContent orders={orders} />
      </Suspense>
    </DashboardLayout>
  );
}
