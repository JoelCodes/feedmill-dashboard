'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Package, AlertTriangle, Search, Users } from 'lucide-react';
import Card from '@/components/ui/Card';
import { useDebounce } from '@/hooks/useDebounce';
import { CustomerWithStats } from '@/types/customer';

/**
 * Empty-state placeholder for the customer list. Rendered when the filtered
 * customer set is empty (either no customers were provided, or the search
 * term excludes every customer).
 *
 * Lifted verbatim from the pre-28-04 `customers/page.tsx` body to preserve
 * the existing visual contract (icon + bold "No customers found" headline +
 * secondary instructional copy).
 */
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

interface CustomersListProps {
  /**
   * Pre-sorted customer list. The parent RSC (`/demo/customers/page.tsx`)
   * is responsible for `await getCustomers()` + `sortCustomersByRecentActivity`
   * — this client component renders synchronously from prop, never fetches.
   *
   * Threat T-28-04-01 (info disclosure via client bundle): this component
   * MUST NOT import from `@/services/customers`. Data flows in one direction
   * across the server→client prop boundary.
   */
  customers: CustomerWithStats[];
}

/**
 * Client component for the customer list page. Owns search-input state +
 * debounced filter + row-click navigation. Receives pre-fetched, pre-sorted
 * customer data via the `customers` prop.
 *
 * Pattern: Phase 28 client-data-component shape (see 28-PATTERNS.md §
 * `CustomersList.tsx`). Mirrors the post-28-03 `OrdersTable` signature
 * (no in-component fetch effect; no service import; data-via-prop only).
 */
export default function CustomersList({ customers }: CustomersListProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Filter by debounced search term (case-insensitive substring on name).
  const filteredCustomers = useMemo(() => {
    if (!debouncedSearch) return customers;
    const searchLower = debouncedSearch.toLowerCase();
    return customers.filter((c) => c.name.toLowerCase().includes(searchLower));
  }, [customers, debouncedSearch]);

  const handleRowClick = (customerId: string) => {
    router.push(`/demo/customers/${customerId}`);
  };

  return (
    <Card className="flex flex-1 flex-col">
      <Card.Content className="p-5">
        {/* Header */}
        <div className="mb-5">
          <h2 className="text-text-primary text-lg font-bold">Customers</h2>
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

        {/* Screen reader announcement for search results.
            Loading branch removed: data arrives via prop, so there is no
            "loading customers" state at the client boundary.

            IN-01: the live-region copy intentionally differs from the
            visible <EmptyState> headline ("No customers found") so screen
            readers hear two distinct phrases for two distinct UI concerns
            (search-result count vs. permanent empty-state copy). */}
        <div aria-live="polite" className="sr-only">
          {filteredCustomers.length === 0
            ? 'Search returned no results'
            : `${filteredCustomers.length} customer${filteredCustomers.length !== 1 ? 's' : ''} found`}
        </div>

        {/* Customer List.
            Loading skeleton and error branches removed — data is pre-resolved
            server-side (mock service cannot fail; T-28-04-04 phase-scoped). */}
        <div className="flex-1 overflow-auto">
          {filteredCustomers.length === 0 ? (
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
  );
}
