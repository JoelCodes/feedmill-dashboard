/**
 * KpiSection — D-07 zone 3 layout container.
 *
 * Composes SevenDayTrendChart (KPI-06) + BlockedExceptionList (KPI-07/08)
 * side-by-side on md+ viewports, stacked on mobile.
 *
 * UI-SPEC layout:
 *   flex flex-col gap-5 md:flex-row md:gap-6
 *   SevenDayTrendChart: flex-1 (wider, takes remaining space)
 *   BlockedExceptionList: w-full md:w-[380px] flex-shrink-0 (fixed right panel)
 *
 * Pure layout composition — no client hooks needed.
 * Children handle their own client/server boundaries independently.
 *
 * Plan 35-07 mounts <KpiSection trendData={kpiTrend} exceptions={kpiBlocked} />
 * below the three columns in ProductionDashboard.tsx.
 */
import SevenDayTrendChart from '@/components/SevenDayTrendChart';
import BlockedExceptionList from '@/components/BlockedExceptionList';
import type { TrendDay, BlockedOrderWithDwell } from '@/db/queries/kpis';

interface KpiSectionProps {
  trendData: TrendDay[];
  exceptions: BlockedOrderWithDwell[];
}

export default function KpiSection({ trendData, exceptions }: KpiSectionProps) {
  return (
    <div className="flex flex-col gap-5 md:flex-row md:gap-6">
      <div className="flex-1">
        <SevenDayTrendChart data={trendData} />
      </div>
      <div className="w-full md:w-[380px] flex-shrink-0">
        <BlockedExceptionList orders={exceptions} />
      </div>
    </div>
  );
}

/**
 * KpiSectionSkeleton — Suspense fallback for <KpiSection>.
 *
 * Two side-by-side animate-pulse rectangles matching the live layout shape.
 * Mirrors the flex layout so there is no layout shift when the real content loads.
 *
 * D-16: Wrapped by <Suspense fallback={<KpiSectionSkeleton />}> in ProductionDashboard.
 */
export function KpiSectionSkeleton(): JSX.Element {
  return (
    <div className="flex flex-col gap-5 md:flex-row md:gap-6" aria-hidden="true">
      <div className="h-[200px] flex-1 animate-pulse rounded-[var(--radius-lg)] bg-[var(--divider)]" />
      <div className="h-[200px] w-full md:w-[380px] flex-shrink-0 animate-pulse rounded-[var(--radius-lg)] bg-[var(--divider)]" />
    </div>
  );
}
