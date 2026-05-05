'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Package, AlertTriangle, Search, Users } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { getCustomers } from '@/services/customers';
import { sortCustomersByRecentActivity } from '@/utils/customerSort';
import { useDebounce } from '@/hooks/useDebounce';
import { CustomerWithStats } from '@/types/customer';

function CustomerTableSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center py-3" data-testid="skeleton-row">
          <div className="flex-1">
            <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 animate-pulse rounded bg-gray-200" />
            <div className="h-2 w-2 animate-pulse rounded-full bg-gray-200" />
            <div className="h-4 w-4 animate-pulse rounded bg-gray-200" />
          </div>
        </div>
      ))}
    </>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Users className="mb-4 h-12 w-12 text-gray-300" />
      <p className="text-text-primary text-sm font-bold">No customers found</p>
      <p className="text-text-secondary text-sm">
        Try adjusting your search or check back later for customer data.
      </p>
    </div>
  );
}

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<CustomerWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Fetch customers on mount
  useEffect(() => {
    getCustomers()
      .then(data => {
        setCustomers(sortCustomersByRecentActivity(data));
      })
      .finally(() => setLoading(false));
  }, []);

  // Filter by search term
  const filteredCustomers = useMemo(() => {
    if (!debouncedSearch) return customers;
    const searchLower = debouncedSearch.toLowerCase();
    return customers.filter(c => c.name.toLowerCase().includes(searchLower));
  }, [customers, debouncedSearch]);

  const handleRowClick = (customerId: string) => {
    router.push(`/customers/${customerId}`);
  };

  return (
    <div className="flex h-screen bg-bg-page">
      <Sidebar />
      <main className="flex flex-1 flex-col gap-6 overflow-auto p-6 pr-8">
        <Header />

        {/* Customer List Card */}
        <div className="flex flex-1 flex-col rounded-[15px] bg-white p-5 shadow-[0_3.5px_5px_rgba(0,0,0,0.02)]">
          {/* Header */}
          <div className="mb-5">
            <h2 className="text-text-primary text-lg font-bold">
              Customers
            </h2>
          </div>

          {/* Search Bar */}
          <div className="relative mb-5">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search customers by name..."
              className="border-divider focus:border-primary focus:ring-primary w-full rounded-lg border py-2 pr-3 pl-10 text-sm placeholder:text-gray-400 focus:ring-1 focus:outline-none"
            />
          </div>

          {/* Customer List */}
          <div className="flex-1 overflow-auto">
            {loading ? (
              <CustomerTableSkeleton />
            ) : filteredCustomers.length === 0 ? (
              <EmptyState />
            ) : (
              filteredCustomers.map((customer) => (
                <div
                  key={customer.id}
                  data-customer-id={customer.id}
                  onClick={() => handleRowClick(customer.id)}
                  className="flex cursor-pointer items-center py-3 hover:bg-gray-50"
                >
                  {/* Customer Name */}
                  <div className="flex-1">
                    <span className="text-text-primary text-xs font-bold">
                      {customer.name}
                    </span>
                  </div>

                  {/* Status Indicators */}
                  <div className="flex items-center gap-2" style={{ width: '120px' }}>
                    {customer.stats.activeOrders > 0 && (
                      <Package
                        className="h-4 w-4"
                        style={{ color: 'var(--primary)' }}
                        data-testid="status-orders"
                      />
                    )}
                    {customer.stats.hasChanges && (
                      <div
                        className="h-2 w-2 rounded-full bg-error"
                        data-testid="status-changes"
                      />
                    )}
                    {customer.stats.binAlertLevel === 'low' && (
                      <AlertTriangle
                        className="h-4 w-4"
                        style={{ color: 'var(--warning)' }}
                        data-testid="status-bin-low"
                      />
                    )}
                    {customer.stats.binAlertLevel === 'critical' && (
                      <AlertTriangle
                        className="h-4 w-4"
                        style={{ color: 'var(--error)' }}
                        data-testid="status-bin-critical"
                      />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
