import { requireRole } from '@/lib/auth';
import { getProductionOrders } from '@/services/millProduction';
import DashboardLayout from '@/components/DashboardLayout';
import MillProductionUI from '@/components/MillProductionUI';

export default async function MillProductionPage() {
  await requireRole('demo');
  const orders = await getProductionOrders();

  return (
    <DashboardLayout>
      <MillProductionUI orders={orders} />
    </DashboardLayout>
  );
}
