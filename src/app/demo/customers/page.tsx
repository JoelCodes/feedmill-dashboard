'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Package, AlertTriangle, Search, Users } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import Card from '@/components/ui/Card';
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
            <div className="h-4 w-32 animate-pulse rounded bg-[var(--divider)]" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 animate-pulse rounded bg-[var(--divider)]" />
            <div className="h-2 w-2 animate-pulse rounded-full bg-[var(--divider)]" />
            <div className="h-4 w-4 animate-pulse rounded bg-[var(--divider)]" />
          </div>
        </div>
      ))}
    </>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Users className="mb-4 h-12 w-12 text-[var(--text-secondary)]" />
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
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Fetch customers on mount
  useEffect(() => {
    getCustomers()
      .then(data => {
        setCustomers(sortCustomersByRecentActivity(data));
      })
      .catch(err => {
        console.error('Failed to load customers:', err);
        setError('Failed to load customers. Please try again.');
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
    router.push(`/demo/customers/${customerId}`);
  };

  return (
    <DashboardLayout>
      {/* Customer List Card */}
      <Card className="flex flex-1 flex-col">
        <Card.Content className="p-5">
        {/* Header */}
        <div className="mb-5">
          <h2 className="text-text-primary text-lg font-bold">
            Customers
          </h2>
        </div>

        {/* Search Bar */}
        <div className="relative mb-5">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search customers by name..."
            className="w-full rounded-lg border border-[var(--divider)] py-2 pr-3 pl-10 text-sm placeholder:text-[var(--text-secondary)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none"
          />
        </div>

        {/* Screen reader announcement for search results */}
        <div aria-live="polite" className="sr-only">
          {loading ? 'Loading customers...' :
            filteredCustomers.length === 0 ? 'No customers found' :
            `${filteredCustomers.length} customer${filteredCustomers.length !== 1 ? 's' : ''} found`}
        </div>

        {/* Customer List */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <CustomerTableSkeleton />
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertTriangle className="mb-4 h-12 w-12 text-[var(--error)]" />
              <p className="text-text-primary text-sm font-bold">Error loading customers</p>
              <p className="text-text-secondary text-sm">{error}</p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <EmptyState />
          ) : (
            filteredCustomers.map((customer) => (
              <div
                key={customer.id}
                data-customer-id={customer.id}
                onClick={() => handleRowClick(customer.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleRowClick(customer.id);
                  }
                }}
                role="button"
                tabIndex={0}
                className="flex cursor-pointer items-center py-3 hover:bg-[var(--bg-page)]"
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
                    <div className="flex items-center gap-1" data-testid="status-orders">
                      <Package
                        className="h-4 w-4"
                        style={{ color: 'var(--primary)' }}
                      />
                      <span
                        className="text-xs font-bold"
                        style={{ color: 'var(--primary)' }}
                        data-testid="order-count"
                      >
                        {customer.stats.activeOrders}
                      </span>
                    </div>
                  )}
                  {customer.stats.hasChanges && (
                    <div
                      className="bg-error h-2 w-2 rounded-full"
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
        </Card.Content>
      </Card>
    </DashboardLayout>
  );
}
