import React from 'react';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { checkRole } from '@/lib/auth';
import { searchParamsCache } from '@/lib/search-params';
import { getProductionOrders, getOrderById } from '@/db/queries/orders';
import { getOrderEvents } from '@/db/queries/events';
import { getKpiStrip, getSevenDayTrend, getBlockedWithDwell } from '@/db/queries/kpis';
import { DEFAULT_TIMEZONE } from '@/lib/timezone';
import DashboardLayout from '@/components/DashboardLayout';
import ProductionDashboard from '@/components/ProductionDashboard';
import type { SearchParams } from 'nuqs/server';

export const dynamic = 'force-dynamic'; // PROD-01: never cached at the RSC level

/**
 * Production homepage (`/`) — async RSC with live DB data.
 *
 * PROD-01: force-dynamic, no CDN cache, every request re-runs queries.
 * D-02: auth gate ONLY (no role gate) — any authenticated user reaches the page.
 * D-03: canEdit computed server-side, passed as a serializable boolean prop.
 * D-09: drawer data fetched here (RSC layer), not inside the drawer component.
 * D-25: canEdit gates transition buttons inside ProductionDrawer.
 * Pitfall 2 (RESEARCH.md): searchParams is a Promise in Next.js 16 and must be awaited.
 * Pitfall 7 (RESEARCH.md): getOrderById may return null for stale ?order= ids;
 *   drawerOrder=null is passed through — ProductionDrawer renders empty state.
 */
export default async function HomePage({
  searchParams,
}: { searchParams: Promise<SearchParams> }): Promise<React.JSX.Element> {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in'); // D-02: auth gate ONLY (no role gate)

  const canEdit = await checkRole('mill_operator'); // D-03

  // Pitfall 2 (RESEARCH.md): searchParams is a Promise in Next.js 16 — must be awaited via the cache
  const { order } = await searchParamsCache.parse(searchParams);

  // D-02: read tz cookie set by <TzBootstrap />; fallback DEFAULT_TIMEZONE when absent or empty.
  // sanitizeIanaTimezone is applied inside each KPI query (defense-in-depth) — Plan 35-04 Pitfall 2.
  const cookieStore = await cookies();
  const tz = cookieStore.get('tz')?.value || DEFAULT_TIMEZONE;

  // D-09: fetch drawer data server-side when ?order= is present.
  // Six queries run in parallel via fan-out; null/[] are resolved synchronously
  // when order is absent, so no extra DB round-trip is added in that case.
  // D-15: KPI queries piggyback on the same Promise.all as the order queries — all six
  // invalidate on every router.refresh() tick from useProductionPolling (30s cadence).
  const [orders, drawerOrder, drawerEvents, kpiStrip, kpiTrend, kpiBlocked] = await Promise.all([
    getProductionOrders(),
    order ? getOrderById(order) : Promise.resolve(null),
    order ? getOrderEvents(order) : Promise.resolve([]),
    getKpiStrip(tz),        // KPI-01, KPI-02a/b/c, KPI-04, KPI-05
    getSevenDayTrend(tz),   // KPI-06
    getBlockedWithDwell(),  // KPI-07 + KPI-08 (no tz — dwell is wallclock-relative per D-03)
  ]);

  return (
    <DashboardLayout>
      <ProductionDashboard
        orders={orders}
        canEdit={canEdit}
        drawerOrder={drawerOrder}
        drawerEvents={drawerEvents}
        kpiStrip={kpiStrip}
        kpiTrend={kpiTrend}
        kpiBlocked={kpiBlocked}
      />
    </DashboardLayout>
  );
}
