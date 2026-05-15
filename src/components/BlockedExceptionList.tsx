'use client';

/**
 * BlockedExceptionList — KPI-07 + KPI-08 sortable blocked-orders table.
 *
 * D-10: Distinct from BlockedAlertBand (Phase 34). Coexists with it.
 * BlockedAlertBand = sticky top-of-board terse chip list.
 * BlockedExceptionList = richer bottom-zone table with dwell time + overdue badge.
 *
 * D-17: Read-only. Row click opens drawer via useOrderQuery + startTransition.
 *       The drawer's canEdit gate controls transition-button visibility.
 *
 * KPI-07: Rows are pre-sorted by dwell time DESC (server-side ORDER BY MAX(changedAt) ASC).
 *         This component renders rows in array order — NO client-side re-sort.
 *
 * KPI-08: Overdue badge renders only when row.isOverdue === true.
 *         Inline span — does NOT extend StatusBadge.tsx (UI-SPEC decision).
 *
 * Dwell formatting: uses row.dwellFormatted (server-pre-formatted by Plan 35-04).
 *                   Does NOT compute dwell client-side — client-side drift prevention.
 */
import { startTransition } from 'react';
import type { KeyboardEvent } from 'react';
import { useOrderQuery } from '@/hooks/useOrderQuery';
import Card from '@/components/ui/Card';
import type { BlockedOrderWithDwell } from '@/db/queries/kpis';

export default function BlockedExceptionList({
  orders,
}: {
  orders: BlockedOrderWithDwell[];
}) {
  const [, setQuery] = useOrderQuery();

  const openDrawer = (id: string) => startTransition(() => void setQuery({ order: id }));

  const handleKey = (e: KeyboardEvent<HTMLTableRowElement>, id: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openDrawer(id);
    }
  };

  return (
    <Card>
      <div className="p-4">
        {/* Card header row */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-[var(--text-medium)]">Blocked Orders</p>
          <p className="text-[var(--fs-11)] text-[var(--text-muted)]">Sorted by dwell time</p>
        </div>

        {/* Empty state */}
        {orders.length === 0 ? (
          <div className="min-h-[64px] flex items-center justify-center">
            <p className="text-sm text-[var(--text-muted)]">No blocked orders</p>
          </div>
        ) : (
          <table className="w-full" role="table">
            <tbody>
              {orders.map((row) => (
                <tr
                  key={row.orderId}
                  role="button"
                  tabIndex={0}
                  aria-label={`Open order ${row.orderNumber}`}
                  className="flex items-center py-3 cursor-pointer hover:bg-[var(--pending-light)] active:opacity-90 gap-2"
                  onClick={() => openDrawer(row.orderId)}
                  onKeyDown={(e) => handleKey(e, row.orderId)}
                >
                  {/* Order # */}
                  <td className="text-[var(--fs-11)] font-bold text-[var(--text-muted)] min-w-[80px]">
                    {row.orderNumber}
                  </td>

                  {/* Customer */}
                  <td className="text-sm text-[var(--text-primary)] flex-1">
                    {row.customer}
                  </td>

                  {/* Mill Line */}
                  <td className="text-[var(--fs-11)] font-bold text-[var(--text-muted)] min-w-[72px]">
                    {row.millLine}
                  </td>

                  {/* Blocked For (dwell time) — server-pre-formatted, rendered verbatim */}
                  <td className="text-sm font-bold text-[var(--text-primary)] min-w-[80px]">
                    {row.dwellFormatted}
                  </td>

                  {/* Overdue badge — KPI-08, conditional on isOverdue */}
                  <td className="min-w-[64px]">
                    {row.isOverdue && (
                      <span
                        role="status"
                        aria-label="Order past early delivery date"
                        className="bg-[var(--warning-light)] text-[var(--warning)] border border-[var(--warning)] rounded-[var(--radius-sm)] px-2 py-1 text-[var(--fs-11)] font-bold"
                      >
                        Overdue
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Card>
  );
}
