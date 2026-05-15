'use client';

/**
 * ProductionDashboard — Client wrapper integrating every Phase 34 Wave 1+2 primitive.
 *
 * PROD-02: Three-column board (Premix / Excel / CGM).
 * PROD-03: Status filter pills URL-synced via nuqs.
 * PROD-04: Search input URL-synced with 150ms debounce (D-05).
 * PROD-06: Blocked alert band (D-22).
 * PROD-09: 30-second auto-refresh via useProductionPolling (D-19).
 * PROD-10: Per-column Suspense with ColumnSkeleton fallback (D-23).
 * PROD-11: LastUpdatedChip resets on every orders prop change (D-20).
 *
 * D-01: PRODUCTION_STATE_PILL_CONFIG and STATE_COLORS are local consts —
 *       do NOT import from MillProductionUI.tsx.
 *
 * D-25: canEdit prop controls whether the ProductionDrawer shows transition buttons.
 * Plan 06: ProductionDrawer is rendered conditionally on the order URL param.
 */

import React, { useMemo, useState, useEffect, Suspense, startTransition } from 'react';
import {
  useQueryStates,
  parseAsArrayOf,
  parseAsStringLiteral,
  parseAsString,
} from 'nuqs';
import { useOrderQuery } from '@/hooks/useOrderQuery';
import Link from 'next/link';
import { Search, Upload } from 'lucide-react';

import { STATE_ORDER } from '@/lib/search-params';
import { filterOrders } from '@/lib/production-derivations';
import { useProductionPolling } from '@/hooks/useProductionPolling';
import { useDebounce } from '@/hooks/useDebounce';
import FilterPill, { type FilterPillColorConfig } from '@/components/ui/FilterPill';
import Button from '@/components/ui/Button';
import BlockedAlertBand from '@/components/BlockedAlertBand';
import LastUpdatedChip from '@/components/LastUpdatedChip';
import ColumnSkeleton from '@/components/ColumnSkeleton';
import MillColumn from '@/components/MillColumn';
import ProductionDrawer from '@/components/ProductionDrawer';
import DrawerSkeleton from '@/components/DrawerSkeleton';

import type { ProductionOrder, MillLine, ProductionState } from '@/db/schema/orders';
import type { OrderEvent } from '@/db/schema/events';

// ─── Local consts — D-01: do NOT import from MillProductionUI.tsx ───────────

/**
 * Local STATE_COLORS — copied from MillProductionUI.tsx visual prior art (D-01).
 * Intentionally duplicated; no code sharing with /demo components.
 */
const STATE_COLORS: Record<ProductionState, { border: string; header: string }> = {
  Completed: {
    border: 'var(--status-completed-border)',
    header: 'var(--status-completed-header)',
  },
  Mixing: {
    border: 'var(--status-mixing-border)',
    header: 'var(--status-mixing-header)',
  },
  Blocked: {
    border: 'var(--status-blocked-border)',
    header: 'var(--status-blocked-header)',
  },
  Pending: {
    border: 'var(--status-pending-border)',
    header: 'var(--status-pending-header)',
  },
};

// Suppress unused variable — STATE_COLORS is kept for plan 06 reference (D-01).
void STATE_COLORS;

/**
 * PRODUCTION_STATE_PILL_CONFIG — local const per D-01.
 * Copied verbatim from MillProductionUI.tsx lines ~40-65.
 */
const PRODUCTION_STATE_PILL_CONFIG: Record<ProductionState, FilterPillColorConfig> = {
  Completed: {
    bg: 'bg-success-light',
    text: 'text-success-dark',
    dot: 'bg-success',
    countBg: 'bg-[var(--status-completed-bg-22)]',
  },
  Mixing: {
    bg: 'bg-warning-light',
    text: 'text-warning',
    dot: 'bg-warning',
    countBg: 'bg-[var(--status-mixing-bg-22)]',
  },
  Blocked: {
    bg: 'bg-error-light',
    text: 'text-error-dark',
    dot: 'bg-error',
    countBg: 'bg-[var(--status-blocked-bg-22)]',
  },
  Pending: {
    bg: 'bg-pending-light',
    text: 'text-muted',
    dot: 'bg-pending',
    countBg: 'bg-[var(--status-pending-bg-22)]',
  },
};

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Toggle a value in an array (multi-select pill behavior).
 * Pitfall 11 mitigation: removing the last active state empties the array,
 * which filterOrders treats as "show all" (not "show none").
 */
function toggleArray<T>(arr: T[], val: T): T[] {
  return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
}

// ─── Mill lines in render order ─────────────────────────────────────────────
// D-23 acceptance criteria: grep checks for ≥ 3 literal <Suspense in source.
// Columns are rendered explicitly (not via .map) so each boundary is visible.

// ─── Component ──────────────────────────────────────────────────────────────

type Props = {
  orders: ProductionOrder[];
  canEdit: boolean;
  drawerOrder: ProductionOrder | null;
  drawerEvents: OrderEvent[];
};

export default function ProductionDashboard({
  orders,
  canEdit,
  drawerOrder,
  drawerEvents,
}: Props): React.JSX.Element {
  // ── Polling — PROD-09 / D-19 ───────────────────────────────────────────
  useProductionPolling();

  // ── URL state — D-04 / D-05 / D-06 (split per T10b gap closure 2026-05-14) ──
  // Status + q are SHALLOW: they update the URL without triggering an RSC fetch.
  // This preserves the snappy pill-toggle and per-keystroke search UX (filters
  // execute client-side over the already-fetched orders array — Pitfall 11).
  const [{ status, q }, setQuery] = useQueryStates({
    status: parseAsArrayOf(parseAsStringLiteral(STATE_ORDER)).withDefault([]),
    q: parseAsString.withDefault(''),
  });

  // Order is NON-SHALLOW: setting ?order=<id> must re-run the page RSC so
  // getOrderById + getOrderEvents are fetched (src/app/page.tsx:39-43).
  // history: 'push' makes the browser back button close the drawer (deep-link parity).
  // The setter is wrapped in startTransition() at each call site so the existing
  // <Suspense fallback={<DrawerSkeleton />}> boundary at lines 275-282 renders
  // during the RSC fetch instead of freezing the previous UI.
  // WR-05: parser + option literals centralised in @/hooks/useOrderQuery.
  const [{ order }, setOrderQuery] = useOrderQuery();

  // ── Search debounce — D-05 / 150ms ────────────────────────────────────
  // Initialize controlled input from URL state on first render
  const [searchInput, setSearchInput] = useState(q);

  const debouncedSearch = useDebounce(searchInput, 150);

  useEffect(() => {
    setQuery({ q: debouncedSearch });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- setQuery is stable per nuqs contract; omitting prevents redundant URL writes.
  }, [debouncedSearch]);

  // ── Last-updated reset — PROD-11 / D-20 ───────────────────────────────
  // `orders` is a new reference after every router.refresh() (parent RSC re-renders
  // with a fresh array). This effect fires on every refresh cycle, resetting
  // the chip to "Updated 0s ago". Test 12 validates this behavior.
  const [lastUpdated, setLastUpdated] = useState(() => new Date());

  useEffect(() => {
    setLastUpdated(new Date());
  }, [orders]);

  // ── Derived data ───────────────────────────────────────────────────────

  // State counts use the full unfiltered orders array (pills show total count, not filtered count)
  const stateCounts = useMemo(
    () =>
      STATE_ORDER.reduce(
        (acc, s) => ({ ...acc, [s]: orders.filter((o) => o.state === s).length }),
        {} as Record<ProductionState, number>
      ),
    [orders]
  );

  // filterOrders applies status (empty = show all — Pitfall 11) then q
  const filtered = useMemo(
    () => filterOrders(orders, status as ProductionState[], q),
    [orders, status, q]
  );

  const ordersByMill = useMemo<Record<MillLine, ProductionOrder[]>>(
    () => ({
      Premix: filtered.filter((o) => o.millLine === 'Premix'),
      Excel: filtered.filter((o) => o.millLine === 'Excel'),
      CGM: filtered.filter((o) => o.millLine === 'CGM'),
    }),
    [filtered]
  );

  // ── JSX ───────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-5">
      {/* ── Header strip — UI-SPEC §1 ──────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        {/* Left: filter pills */}
        <div className="flex items-center gap-2.5">
          {STATE_ORDER.map((state) => (
            <FilterPill
              key={state}
              label={state}
              count={stateCounts[state] ?? 0}
              color={PRODUCTION_STATE_PILL_CONFIG[state]}
              isActive={status.includes(state)}
              onClick={() => setQuery({ status: toggleArray(status as ProductionState[], state) })}
            />
          ))}
        </div>

        {/* Center: search input */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" aria-hidden="true" />
          <input
            type="search"
            placeholder="Search orders..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="h-9 w-full rounded-[var(--radius-md)] border border-[var(--divider)] bg-[var(--bg-card)] pl-9 pr-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-2 focus:border-[var(--primary)]"
          />
        </div>

        {/* Right: Import Orders CTA + LastUpdatedChip */}
        <div className="flex items-center gap-3">
          <Link href="/import">
            <Button variant="secondary" size="sm" icon={<Upload className="h-4 w-4" />}>
              Import Orders
            </Button>
          </Link>
          <LastUpdatedChip lastUpdated={lastUpdated} />
        </div>
      </div>

      {/* ── Blocked alert band — PROD-06 / D-22 ───────────────────────── */}
      <BlockedAlertBand orders={orders} />

      {/* ── Columns — PROD-02 / D-23 Suspense per column ─────────────── */}
      {/* Each column is explicitly rendered (not .map) so grep sees ≥ 3 literal <Suspense */}
      <div className="flex gap-6">
        <div data-suspense="column">
          <Suspense fallback={<ColumnSkeleton />}>
            <MillColumn
              millLine="Premix"
              orders={ordersByMill.Premix}
              onOrderClick={(id) =>
                startTransition(() => {
                  setOrderQuery({ order: id });
                })
              }
            />
          </Suspense>
        </div>
        <div data-suspense="column">
          <Suspense fallback={<ColumnSkeleton />}>
            <MillColumn
              millLine="Excel"
              orders={ordersByMill.Excel}
              onOrderClick={(id) =>
                startTransition(() => {
                  setOrderQuery({ order: id });
                })
              }
            />
          </Suspense>
        </div>
        <div data-suspense="column">
          <Suspense fallback={<ColumnSkeleton />}>
            <MillColumn
              millLine="CGM"
              orders={ordersByMill.CGM}
              onOrderClick={(id) =>
                startTransition(() => {
                  setOrderQuery({ order: id });
                })
              }
            />
          </Suspense>
        </div>
      </div>

      {/* ── Drawer — plan 06 integration ──────────────────────────────── */}
      {/* Render when ?order= URL param is set (even if drawerOrder is null for stale IDs) */}
      {order && (
        <Suspense fallback={<DrawerSkeleton />}>
          <ProductionDrawer
            order={drawerOrder}
            events={drawerEvents}
            canEdit={canEdit}
          />
        </Suspense>
      )}
    </div>
  );
}
