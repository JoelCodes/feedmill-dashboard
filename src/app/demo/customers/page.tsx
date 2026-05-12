import { requireRole } from '@/lib/auth';
import { getCustomers } from '@/services/customers';
import { sortCustomersByRecentActivity } from '@/utils/customerSort';
import DashboardLayout from '@/components/DashboardLayout';
import CustomersList from '@/components/CustomersList';

/**
 * Customer list page (Server Component). Phase 28 D-05 inner guard:
 * `await requireRole('demo')` runs BEFORE any data fetch; pre-sorted
 * customers cross the server→client prop boundary to `<CustomersList>`.
 */
export default async function CustomersPage() {
  await requireRole('demo');
  const customers = sortCustomersByRecentActivity(await getCustomers());

  return (
    <DashboardLayout>
      <CustomersList customers={customers} />
    </DashboardLayout>
  );
}
