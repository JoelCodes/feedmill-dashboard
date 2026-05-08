import { Customer, CustomerStats } from '@/types/customer';
import { Bin } from '@/types/bin';
import { MapPin, Phone, Mail } from 'lucide-react';
import { BinGaugeRow } from './BinGaugeRow';

interface CustomerDetailHeaderProps {
  customer: Customer;
  stats: CustomerStats;
  bins?: Bin[];
}

export default function CustomerDetailHeader({
  customer,
  stats,
  bins = [],
}: CustomerDetailHeaderProps) {
  return (
    <div className="rounded-[var(--radius-xl)] bg-[var(--bg-card)] p-5 shadow-[var(--shadow-sm)]">
      <div className="flex items-start justify-between">
        {/* Left - Contact Card */}
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold" style={{ color: '#2d3748' }}>
            {customer.name}
          </h1>

          <div className="flex items-center gap-2">
            <MapPin data-testid="icon-map-pin" className="h-3.5 w-3.5" style={{ color: '#a0aec0' }} />
            <span className="text-xs" style={{ color: '#a0aec0' }}>{customer.location}</span>
          </div>

          {customer.contactPhone && (
            <div className="flex items-center gap-2">
              <Phone data-testid="icon-phone" className="h-3.5 w-3.5" style={{ color: '#a0aec0' }} />
              <span className="text-xs" style={{ color: '#a0aec0' }}>{customer.contactPhone}</span>
            </div>
          )}

          {customer.contactEmail && (
            <div className="flex items-center gap-2">
              <Mail data-testid="icon-mail" className="h-3.5 w-3.5" style={{ color: '#a0aec0' }} />
              <span className="text-xs" style={{ color: '#a0aec0' }}>{customer.contactEmail}</span>
            </div>
          )}

          {customer.deliveryPreferences && (
            <div className="mt-1">
              <span className="font-bold text-[var(--fs-10)]" style={{ color: '#4fd1c5' }}>
                Delivery: {customer.deliveryPreferences}
              </span>
            </div>
          )}
        </div>

        {/* Right - Summary Stats */}
        <div className="flex gap-4">
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-xl font-bold" style={{ color: '#2d3748' }}>
              {stats.totalOrders}
            </span>
            <span className="text-[var(--fs-10)]" style={{ color: '#a0aec0' }}>
              Total Orders
            </span>
          </div>

          <div className="flex flex-col items-center gap-0.5">
            <span className="text-xl font-bold" style={{ color: '#2d3748' }}>
              {stats.activeBins}
            </span>
            <span className="text-[var(--fs-10)]" style={{ color: '#a0aec0' }}>
              Active Bins
            </span>
          </div>

          <div className="flex flex-col items-center gap-0.5">
            <span className="text-xl font-bold" style={{ color: '#2d3748' }}>
              —
            </span>
            <span className="text-[var(--fs-10)]" style={{ color: '#a0aec0' }}>
              Recent Activity
            </span>
          </div>
        </div>
      </div>

      {/* Bins Section - below contact/stats per customer-detail.pen */}
      {bins.length > 0 && (
        <>
          <div className="my-4 h-px w-full" style={{ backgroundColor: '#e2e8f0' }} />
          <BinGaugeRow bins={bins} />
        </>
      )}
    </div>
  );
}
