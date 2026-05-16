# Phase 35: KPI Sections and Role-Specific Metrics - Pattern Map

**Mapped:** 2026-05-14
**Files analyzed:** 18 files to create or modify
**Analogs found:** 17 / 18

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/db/queries/kpis.ts` | server query | request-response (aggregation) | `src/db/queries/orders.ts` | exact |
| `src/lib/formula-mix.ts` | utility (pure) | transform | `src/lib/production-derivations.ts` | exact |
| `src/lib/format-dwell.ts` | utility (pure) | transform | `src/lib/production-derivations.ts` | role-match |
| `src/components/KpiCard.tsx` | component | request-response | `src/components/ui/Card.tsx` | role-match |
| `src/components/KpiStrip.tsx` | component | request-response | `src/components/BlockedAlertBand.tsx` | role-match |
| `src/components/KpiSection.tsx` | component | request-response | `src/components/ProductionDashboard.tsx` | role-match |
| `src/components/SevenDayTrendChart.tsx` | component | request-response | `src/components/ColumnSkeleton.tsx` | partial |
| `src/components/BlockedExceptionList.tsx` | component | request-response | `src/components/BlockedAlertBand.tsx` | role-match |
| `src/components/TzBootstrap.tsx` | component (client utility) | event-driven | `src/components/LastUpdatedChip.tsx` | partial |
| `src/components/MillColumn.tsx` | component (EDIT) | request-response | self (existing file) | self |
| `src/components/ProductionDashboard.tsx` | component (EDIT) | request-response | self (existing file) | self |
| `src/db/schema/orders.ts` | schema (EDIT) | CRUD | self (existing file) | self |
| `drizzle/0001_*.sql` | migration | batch | `drizzle/0000_aromatic_stone_men.sql` | role-match |
| `src/lib/import-schema.ts` | schema/validation (EDIT) | transform | self (existing file) | self |
| `src/actions/import.ts` | server action (EDIT) | CRUD | self (existing file) | self |
| `src/db/seed-data.json` + `src/db/seed.ts` | fixture + script (EDIT) | batch | self (existing file) | self |
| `src/app/page.tsx` | RSC page (EDIT) | request-response | self (existing file) | self |
| All `makeOrder` test fixtures | test | — | `src/components/MillColumn.test.tsx` | exact |

---

## Pattern Assignments

### `src/db/queries/kpis.ts` (server query, request-response/aggregation)

**Analog:** `src/db/queries/orders.ts`

**Imports pattern** (`orders.ts` lines 1–6):
```typescript
import 'server-only';
import { unstable_cache } from 'next/cache';
import { db } from '@/db';
import { productionOrders } from '@/db/schema/orders';
import { and, eq, inArray } from 'drizzle-orm';
import type { ProductionState, MillLine, ProductionOrder } from '@/db/schema/orders';
```

For `kpis.ts` extend with:
```typescript
import { sql, sum, count, eq, and, max } from 'drizzle-orm';
import { orderEvents } from '@/db/schema/events';
```

**`unstable_cache` wrapping pattern** (`orders.ts` lines 32–49):
```typescript
export const getProductionOrders = unstable_cache(
  async (filters?: ProductionOrderFilters): Promise<ProductionOrder[]> => {
    // ... query body ...
  },
  ['production-orders'],          // cache KEY — unique per query function
  { tags: ['production-orders'] } // cache TAG — shared across all KPI queries (D-14)
);
```

**KPI query diverges from the analog in two ways:**
1. The cache KEY array must be unique per KPI function: `['kpi-completed-today']`, `['kpi-column-summaries']`, `['kpi-seven-day-trend']`, `['kpi-blocked-dwell']`, etc.
2. The `tags` array is always `['production-orders']` — same as existing queries (D-14).

**Core aggregation pattern** (from RESEARCH.md Pattern 1):
```typescript
// KPI-01: Mill-wide tons completed today (timezone-aware)
export const getKpiCompletedToday = unstable_cache(
  async (tz: string): Promise<{ totalLbs: string }> => {
    const sanitizedTz = Intl.supportedValuesOf('timeZone').includes(tz)
      ? tz
      : 'America/Chicago'; // Security: validate IANA string before SQL composition
    const [row] = await db
      .select({
        totalLbs: sql<string>`COALESCE(${sum(productionOrders.weightLbs)}::text, '0')`,
      })
      .from(productionOrders)
      .where(
        sql`${productionOrders.state} = 'Completed'
        AND date_trunc('day', ${productionOrders.updatedAt} AT TIME ZONE ${sanitizedTz})
          = date_trunc('day', NOW() AT TIME ZONE ${sanitizedTz})`
      );
    return row ?? { totalLbs: '0' };
  },
  ['kpi-completed-today'],
  { tags: ['production-orders'] }
);
```

**Dwell-time query pattern** (RESEARCH.md Pattern 3):
```typescript
// KPI-07: Blocked orders with dwell time
// JOIN order_events + production_orders; GROUP BY order; ORDER BY dwell DESC
const blockedWithDwell = await db
  .select({
    orderId: orderEvents.orderId,
    orderNumber: productionOrders.orderNumber,
    customer: productionOrders.customer,
    millLine: productionOrders.millLine,
    earlyDeliveryDate: productionOrders.earlyDeliveryDate,
    dwellSeconds: sql<number>`EXTRACT(EPOCH FROM (NOW() - MAX(${orderEvents.changedAt})))`,
  })
  .from(orderEvents)
  .innerJoin(productionOrders, eq(orderEvents.orderId, productionOrders.id))
  .where(and(eq(orderEvents.toState, 'Blocked'), eq(productionOrders.state, 'Blocked')))
  .groupBy(orderEvents.orderId, productionOrders.orderNumber,
           productionOrders.customer, productionOrders.millLine,
           productionOrders.earlyDeliveryDate)
  .orderBy(sql`MAX(${orderEvents.changedAt}) ASC`); // oldest block = longest dwell = sort first
```

**Events analog** (`events.ts` lines 1–6): cache key differs from tag — demonstrated here:
```typescript
export const getOrderEvents = unstable_cache(
  async (orderId: string): Promise<OrderEvent[]> => { ... },
  ['order-events'],           // ← unique key
  { tags: ['production-orders'] } // ← same shared tag
);
```

**Error handling:** No try/catch in the query layer. Errors propagate to the RSC page's `Promise.all` and bubble to the Next.js error boundary. Consistent with `orders.ts` and `events.ts` (neither wraps in try/catch).

---

### `src/lib/formula-mix.ts` (utility, transform)

**Analog:** `src/lib/production-derivations.ts`

**Imports pattern** (`production-derivations.ts` lines 1–16): pure file — no server/client imports:
```typescript
/**
 * Pure derivation helpers for the production dashboard.
 *
 * No React, no Next.js, no database — this file is intentionally free of
 * browser/server APIs so it can be imported from both RSC and client contexts.
 */
import type { ProductionOrder, ProductionState } from '@/db/schema/orders';
import { STATE_ORDER } from '@/lib/state-order';
```

For `formula-mix.ts`: no imports needed (pure function over a string primitive).

**Core pure function pattern** (`production-derivations.ts` lines 47–58):
```typescript
export function computeColumnWeights(
  orders: ProductionOrder[]
): { completed: number; total: number } {
  const total = orders.reduce(
    (sum, o) => sum + parseFloat(o.weightLbs || '0'),
    0
  );
  // ...
  return { completed, total };
}
```

**`bucketTexture` follows the same pure-function shape** (D-11 bucket rules):
```typescript
/**
 * Maps a raw texture_type string to one of 3 buckets or null.
 * Comparisons are case-sensitive on the canonical uppercase DB form.
 * NULL and unrecognized values return null (excluded from KPI-05 denominator — D-12).
 */
export function bucketTexture(raw: string | null): 'Pellet' | 'Mash' | 'Crumble' | null {
  switch (raw) {
    case 'PELLET':
    case 'SH PELLET':
      return 'Pellet';
    case 'MASH':
      return 'Mash';
    case 'FINE CR':
    case 'C. CRUMBLE':
      return 'Crumble';
    default:
      return null;
  }
}
```

**Test pattern** (`src/lib/__tests__/production-derivations.test.ts` lines 1–28):
```typescript
import { computeColumnWeights } from '@/lib/production-derivations';
import type { ProductionOrder } from '@/db/schema/orders';

function makeOrder(overrides: Partial<ProductionOrder> = {}): ProductionOrder {
  return {
    id: 'test-id-1', orderNumber: 'ORD-001', customer: 'Acme Feed',
    product: 'Layer Mash', weightLbs: '1000.00',
    deliveryTime: 'Mar 5, 2026 10am', state: 'Pending', millLine: 'Premix',
    textureType: null, lineCode: null, version: 1,
    createdBy: 'user-001', createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}
```

Test file location for `formula-mix`: `src/lib/__tests__/formula-mix.test.ts` (matching `src/lib/__tests__/production-derivations.test.ts` location pattern).

---

### `src/lib/format-dwell.ts` (utility, transform)

**Analog:** `src/lib/production-derivations.ts` (same pure-lib shape, no imports needed)

**Core function shape** (from RESEARCH.md Code Examples):
```typescript
/**
 * Formats a dwell duration (epoch seconds from EXTRACT(EPOCH FROM interval)) into
 * the UI-SPEC display string. Pure function — no browser/server APIs.
 *
 * Format (UI-SPEC):
 *   < 3600s  → "{N}m"    (e.g. "42m")
 *   < 86400s → "{N}h {M}m"  (e.g. "2h 14m")
 *   ≥ 86400s → "{N}d {M}h"  (e.g. "1d 3h")
 */
export function formatDwell(epochSeconds: number): string {
  if (epochSeconds < 3600) {
    return `${Math.floor(epochSeconds / 60)}m`;
  }
  if (epochSeconds < 86400) {
    const h = Math.floor(epochSeconds / 3600);
    const m = Math.floor((epochSeconds % 3600) / 60);
    return `${h}h ${m}m`;
  }
  const d = Math.floor(epochSeconds / 86400);
  const h = Math.floor((epochSeconds % 86400) / 3600);
  return `${d}d ${h}h`;
}
```

Test file: `src/lib/__tests__/format-dwell.test.ts` — same directory pattern as `production-derivations.test.ts`. No mocks needed; test with raw number inputs.

---

### `src/components/KpiCard.tsx` (component, request-response)

**Analog:** `src/components/ui/Card.tsx`

**Card primitive pattern** (`Card.tsx` lines 1–17):
```typescript
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const cardVariants = cva(
  "bg-[var(--bg-card)] rounded-[var(--radius-lg)] overflow-hidden",
  {
    variants: {
      variant: {
        default: "border border-[var(--divider)]",
        elevated: "shadow-[0_4px_12px_rgba(0,0,0,0.08)]",
      },
    },
    defaultVariants: { variant: "default" },
  }
);
```

**`KpiCard` is NOT a client component** — it receives pre-formatted strings and renders them statically. No `'use client'` directive.

**Prop shape** (from RESEARCH.md + UI-SPEC):
```typescript
import type { LucideIcon } from 'lucide-react';
import Card from '@/components/ui/Card';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  label: string;
  value: string;       // e.g., "18,400 lbs" — formatted by caller, never raw number
  unit?: string;
  subValue?: string;
  footnote?: string;   // "Excludes N uncategorized orders" for KPI-05 D-12
  icon?: LucideIcon;
}
```

**Visual structure** (UI-SPEC):
- Outer: `Card` default variant
- Inner padding: `px-5 py-5` (20px — matches `ProductionCard.tsx pl-5` prior art)
- `label` at `text-[var(--fs-11)] font-bold text-[var(--text-muted)]`
- `value` at `text-[var(--fs-22)] font-bold text-[var(--text-primary)]`
- `footnote` at `text-[var(--fs-11)] text-[var(--text-muted)]`
- Icon container (when `icon` present): `h-11 w-11 rounded-xl bg-[var(--primary)]` with `Icon className="h-5 w-5 text-white"`

---

### `src/components/KpiStrip.tsx` (component, request-response)

**Analog:** `src/components/BlockedAlertBand.tsx`

**`BlockedAlertBand` structural pattern** (`BlockedAlertBand.tsx` lines 1–52):
```typescript
'use client';
import { startTransition } from 'react';
import { useOrderQuery } from '@/hooks/useOrderQuery';
import type { ProductionOrder } from '@/db/schema/orders';

interface BlockedAlertBandProps {
  orders: ProductionOrder[];
}

export default function BlockedAlertBand({ orders }: BlockedAlertBandProps) {
  const blocked = orders.filter((o) => o.state === 'Blocked');
  if (blocked.length === 0) return null;
  return (
    <div className="...flex flex-wrap gap-2...">
      {blocked.map((order) => (...))}
    </div>
  );
}
```

**`KpiStrip` diverges:** receives a typed KPI payload (not an orders array); no client state needed; NOT `'use client'` unless icon imports require it. Renders 6 `KpiCard` instances in a horizontal flex row.

**Layout** (UI-SPEC):
```typescript
// KpiStrip — no 'use client' directive needed (pure render, no hooks)
import { Wheat, ClipboardList, Activity } from 'lucide-react';
import KpiCard from '@/components/KpiCard';

export default function KpiStrip({ kpis }: { kpis: KpiStripData }) {
  return (
    <div
      className="flex flex-row gap-4 w-full overflow-x-auto pb-1"
      aria-label="KPI summary strip"
    >
      <KpiCard label="Completed Today" value={kpis.completedTodayLbs} icon={Wheat} />
      <KpiCard label="Premix Today"    value={kpis.premixLbs} />
      <KpiCard label="Excel Today"     value={kpis.excelLbs} />
      <KpiCard label="CGM Today"       value={kpis.cgmLbs} />
      <KpiCard label="Pending Backlog" value={kpis.pendingCount} subValue={kpis.pendingLbs} icon={ClipboardList} />
      <KpiCard label="Formula Mix"     value={kpis.dominantBucketLabel} subValue={kpis.otherBucketsLabel} footnote={kpis.uncategorizedNote} icon={Activity} />
    </div>
  );
}
```

**Skeleton** (`KpiStripSkeleton`) — follows `ColumnSkeleton.tsx` pattern (`ColumnSkeleton.tsx` lines 16–33):
```typescript
// ColumnSkeleton pattern:
export default function ColumnSkeleton(): React.JSX.Element {
  return (
    <div className="flex flex-1 flex-col gap-5">
      <div className="h-6 w-24 animate-pulse rounded bg-[var(--divider)]" />
      // ...
    </div>
  );
}
// KpiStripSkeleton — horizontal variant:
// 6 placeholders: h-[88px] w-[140px] animate-pulse rounded-[var(--radius-lg)] bg-[var(--divider)]
```

---

### `src/components/KpiSection.tsx` (component, request-response)

**Analog:** `src/components/ProductionDashboard.tsx` (layout composition pattern)

**Composition pattern** (`ProductionDashboard.tsx` lines 208–309): the root container uses `flex flex-col gap-5`:
```typescript
return (
  <div className="flex flex-col gap-5">
    {/* zones rendered in order */}
    <BlockedAlertBand orders={orders} />
    <div className="flex gap-6">
      {/* columns */}
    </div>
  </div>
);
```

**`KpiSection` layout** (UI-SPEC — side-by-side on md+, stacked on mobile):
```typescript
// KpiSection — pure layout container, no client state
import SevenDayTrendChart from '@/components/SevenDayTrendChart';
import BlockedExceptionList from '@/components/BlockedExceptionList';

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
```

**Skeleton** follows `ColumnSkeleton.tsx` animate-pulse pattern — two side-by-side rectangles (`h-[200px] flex-1` + `h-[200px] w-[380px]`).

---

### `src/components/SevenDayTrendChart.tsx` (component, request-response)

**Analog:** `src/components/ColumnSkeleton.tsx` (closest existing static JSX/SVG layout component)

**`ColumnSkeleton` shape** (`ColumnSkeleton.tsx` lines 14–33) — deterministic layout, no client state, no hooks:
```typescript
import React from 'react';

export default function ColumnSkeleton(): React.JSX.Element {
  return (
    <div className="flex flex-1 flex-col gap-5">
      <div className="h-6 w-24 animate-pulse rounded bg-[var(--divider)]" />
      {/* additional divs... */}
    </div>
  );
}
```

**`SevenDayTrendChart` follows the same "deterministic layout, no client state" discipline** (D-13 — no `Math.random()`, no hooks; RESEARCH.md anti-pattern):

```typescript
// No 'use client' — SVG is deterministic; props are plain data
import Card from '@/components/ui/Card';

interface TrendDay { date: string; completedLbs: number }

export default function SevenDayTrendChart({ data }: { data: TrendDay[] }) {
  // Empty state: data.length < 7
  if (data.length < 7) {
    return (
      <Card className="p-4">
        <p className="text-sm font-bold text-[var(--text-primary)]">7-Day Volume Trend</p>
        <div role="status" className="...">
          <p className="text-sm font-bold">Not enough data yet</p>
          <p className="text-[var(--fs-13)] text-[var(--text-muted)]">
            Check back after 7 days of production
          </p>
        </div>
      </Card>
    );
  }
  // SVG bar chart: viewBox="0 0 420 160", 7 bars 48px wide + 8px gap
  // Bar heights: proportional to max value (deterministic math only)
  // Bar fill: var(--primary); opacity 80% past days, 100% today
  const maxLbs = Math.max(...data.map(d => d.completedLbs), 1);
  return (
    <Card className="p-4">
      <p className="text-sm font-bold text-[var(--text-medium)]">7-Day Volume Trend</p>
      <section role="img" aria-label="7-day production volume trend bar chart">
        <svg viewBox="0 0 420 160" width="100%" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
          {data.map((d, i) => {
            const barHeight = Math.max(4, (d.completedLbs / maxLbs) * 120);
            const x = i * 56; // 48px bar + 8px gap
            return (
              <g key={d.date}>
                <rect x={x} y={120 - barHeight} width={48} height={barHeight}
                  fill="var(--primary)" opacity={/* today check */ 0.8} />
                <text x={x + 24} y={148} textAnchor="middle"
                  fontSize="var(--fs-11)" fill="var(--text-muted)">
                  {/* 3-letter weekday from date string */}
                </text>
              </g>
            );
          })}
        </svg>
      </section>
    </Card>
  );
}
```

---

### `src/components/BlockedExceptionList.tsx` (component, request-response)

**Analog:** `src/components/BlockedAlertBand.tsx`

**`BlockedAlertBand` client pattern** (`BlockedAlertBand.tsx` lines 1–52):
```typescript
'use client';
import { startTransition } from 'react';
import { useOrderQuery } from '@/hooks/useOrderQuery';
import type { ProductionOrder } from '@/db/schema/orders';

export default function BlockedAlertBand({ orders }: BlockedAlertBandProps) {
  const [, setQuery] = useOrderQuery();
  const blocked = orders.filter((o) => o.state === 'Blocked');
  if (blocked.length === 0) return null;
  return (
    <div className="...">
      {blocked.map((order) => (
        <button
          key={order.id}
          onClick={() => startTransition(() => setQuery({ order: order.id }))}
          className="..."
        >
          BLOCKED: {order.orderNumber} ({order.millLine})
        </button>
      ))}
    </div>
  );
}
```

**`BlockedExceptionList` extends this pattern:** `'use client'` (needs `useOrderQuery`); receives pre-computed `BlockedOrderWithDwell[]` (not raw orders); renders a `<table>` (not chips) per UI-SPEC accessibility recommendation.

**Key structural additions:**
```typescript
'use client';
import { startTransition } from 'react';
import { useOrderQuery } from '@/hooks/useOrderQuery';
import Card from '@/components/ui/Card';

interface BlockedOrderWithDwell {
  orderId: string;
  orderNumber: string;
  customer: string;
  millLine: string;
  dwellFormatted: string;        // from formatDwell(dwellSeconds)
  earlyDeliveryDate: string | null;
  isOverdue: boolean;            // earlyDeliveryDate < today AND state !== 'Completed'
}

export default function BlockedExceptionList({ orders }: { orders: BlockedOrderWithDwell[] }) {
  const [, setQuery] = useOrderQuery();
  // Row click: startTransition(() => setQuery({ order: orderId }))
  // Empty state: "No blocked orders" in min-h-[64px] centered
  // Overdue badge: inline <span role="status"> with warning colors
  // Table row hover: hover:bg-[var(--pending-light)]
}
```

**Overdue badge** (inline span — does NOT extend `StatusBadge.tsx`, per UI-SPEC):
```tsx
{row.isOverdue && (
  <span
    role="status"
    aria-label="Order past early delivery date"
    className="bg-[var(--warning-light)] text-[var(--warning)] border border-[var(--warning)] rounded-[var(--radius-sm)] px-2 py-1 text-[var(--fs-11)] font-bold"
  >
    Overdue
  </span>
)}
```

---

### `src/components/TzBootstrap.tsx` (client utility component, event-driven)

**Analog:** No close analog exists. Closest pattern is a `useEffect`-only client component, similar structurally to how `LastUpdatedChip.tsx` uses `useEffect` for timing. However, `TzBootstrap` renders nothing — it exists only for its side effect.

**Pattern** (from RESEARCH.md Pattern 9):
```typescript
'use client';
import { useEffect } from 'react';

export default function TzBootstrap() {
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    document.cookie = `tz=${encodeURIComponent(tz)}; path=/; max-age=86400; SameSite=Lax`;
  }, []); // Runs once on mount — empty dep array
  return null; // Renders nothing
}
```

**Placement** (`layout.tsx` lines 12–26): add adjacent to `{children}` inside `ThemeProvider`:
```typescript
// layout.tsx current structure:
<ClerkProvider afterSignOutUrl="/sign-in">
  <ThemeProvider><NuqsAdapter>{children}</NuqsAdapter></ThemeProvider>
</ClerkProvider>
// Phase 35: add <TzBootstrap /> adjacent to {children}:
<ThemeProvider><NuqsAdapter><TzBootstrap />{children}</NuqsAdapter></ThemeProvider>
```

---

### `src/components/MillColumn.tsx` (EDIT — add `summary` prop)

**Self-analog:** current file lines 87–144.

**Current props type** (`MillColumn.tsx` lines 87–91):
```typescript
export interface MillColumnProps {
  millLine: MillLine;
  orders: ProductionOrder[];
  onOrderClick: (orderId: string) => void;
}
```

**Extend to:**
```typescript
export interface ColumnSummary {
  orderCount: number;
  completedLbs: number;
  totalLbs: number;
}

export interface MillColumnProps {
  millLine: MillLine;
  orders: ProductionOrder[];
  onOrderClick: (orderId: string) => void;
  summary: ColumnSummary; // KPI-03 — computed from UNFILTERED orders in ProductionDashboard
}
```

**Current header** (`MillColumn.tsx` lines 113–118 — REPLACE this block):
```typescript
<div>
  <h2 className="text-primary text-2xl font-bold">{millLine}</h2>
  <p className="text-muted mt-1 text-base font-semibold">
    {formatWeight(completed)} / {formatWeight(total)} lbs
  </p>
</div>
```

**Extended header** (UI-SPEC format `{N} orders — {completedLbs} / {totalLbs} lbs`):
```typescript
<div>
  <h2 className="text-primary text-2xl font-bold">{millLine}</h2>
  <p className="mt-1 text-[var(--fs-11)] font-bold">
    <span className="text-[var(--text-primary)]">{summary.orderCount} orders</span>
    <span className="text-[var(--text-muted)]"> — </span>
    <span className="text-[var(--text-muted)]">
      {formatWeight(summary.completedLbs)} / {formatWeight(summary.totalLbs)} lbs
    </span>
  </p>
</div>
```

**`computeColumnWeights` is no longer called in the header** — remove the `const { completed, total } = computeColumnWeights(orders)` line; the `summary` prop replaces it. `computeColumnWeights` may still be called elsewhere in the file for per-state sections — verify before removing import.

---

### `src/components/ProductionDashboard.tsx` (EDIT — add KPI zones + TzBootstrap)

**Self-analog:** current file lines 124–309.

**Props extension** (`ProductionDashboard.tsx` lines 124–129):
```typescript
// Current:
type Props = {
  orders: ProductionOrder[];
  canEdit: boolean;
  drawerOrder: ProductionOrder | null;
  drawerEvents: OrderEvent[];
};
// Phase 35 adds:
type Props = {
  orders: ProductionOrder[];
  canEdit: boolean;
  drawerOrder: ProductionOrder | null;
  drawerEvents: OrderEvent[];
  kpiStrip: KpiStripData;           // for <KpiStrip>
  kpiTrend: TrendDay[];             // for <SevenDayTrendChart>
  kpiBlocked: BlockedOrderWithDwell[]; // for <BlockedExceptionList>
};
```

**KPI-03 column summaries computed client-side** from the unfiltered `orders` array (RESEARCH.md Pattern 10, Pitfall 6 — MUST use `orders`, not `filtered`):
```typescript
// In the derived data section (after line 195):
const columnSummaries = useMemo<Record<MillLine, ColumnSummary>>(() => {
  const lines: MillLine[] = ['Premix', 'Excel', 'CGM'];
  return Object.fromEntries(
    lines.map((line) => {
      const lineOrders = orders.filter((o) => o.millLine === line);
      const { completed, total } = computeColumnWeights(lineOrders);
      return [line, { orderCount: lineOrders.length, completedLbs: completed, totalLbs: total }];
    })
  ) as Record<MillLine, ColumnSummary>;
}, [orders]); // NOTE: uses `orders` (unfiltered), NOT `filtered` (Pitfall 6)
```

**Three-zone layout additions** (D-07 — insert ABOVE filter pills and BELOW columns):
```typescript
return (
  <div className="flex flex-col gap-5">
    {/* ── Zone 1: KpiStrip — ABOVE filter pills (D-07) ────────── */}
    <Suspense fallback={<KpiStripSkeleton />}>
      <KpiStrip kpis={kpiStrip} />
    </Suspense>

    {/* ── Header strip — unchanged from Phase 34 ──────────────── */}
    <div className="flex items-center justify-between gap-4">
      {/* ... pills, search, import button, LastUpdatedChip ... */}
    </div>

    {/* ── BlockedAlertBand — unchanged ────────────────────────── */}
    <BlockedAlertBand orders={orders} />

    {/* ── Columns — each gets summary prop ───────────────────── */}
    <div className="flex gap-6">
      <Suspense fallback={<ColumnSkeleton />}>
        <MillColumn millLine="Premix" orders={ordersByMill.Premix}
          summary={columnSummaries.Premix} onOrderClick={...} />
      </Suspense>
      {/* Excel and CGM similarly */}
    </div>

    {/* ── Zone 3: KpiSection — BELOW columns (D-07) ───────────── */}
    <Suspense fallback={<KpiSectionSkeleton />}>
      <KpiSection trendData={kpiTrend} exceptions={kpiBlocked} />
    </Suspense>

    {/* ── Drawer — unchanged ──────────────────────────────────── */}
    {order && <Suspense fallback={<DrawerSkeleton />}><ProductionDrawer ... /></Suspense>}
  </div>
);
```

---

### `src/db/schema/orders.ts` (EDIT — add `earlyDeliveryDate` column)

**Self-analog:** current file lines 29–55 (column map).

**Add after `lineCode`** (`orders.ts` line 41):
```typescript
// Current final nullable columns:
textureType: text('texture_type'),              // D-12: nullable
lineCode: text('line_code'),                    // D-12: nullable
// Phase 35 — add:
earlyDeliveryDate: date('early_delivery_date'), // D-04: nullable date; PgDateString → TS: string | null
```

**Import addition** (add `date` to the `drizzle-orm/pg-core` import at line 3):
```typescript
import {
  pgTable, uuid, text, integer, numeric, timestamp,
  index, uniqueIndex, pgEnum,
  date,                          // ← add this
} from 'drizzle-orm/pg-core';
```

**Type implications** (RESEARCH.md Pattern 6 — VERIFIED): `date('early_delivery_date')` without `{ mode: 'date' }` uses `PgDateString`, so Drizzle infers `string | null`. The `ProductionOrder = typeof productionOrders.$inferSelect` type automatically gains `earlyDeliveryDate: string | null`. This is the type-system event that causes every `makeOrder` fixture to need updating.

---

### `drizzle/0001_*.sql` (migration — generated)

**Analog:** `drizzle/0000_aromatic_stone_men.sql`

**Generated via `npx drizzle-kit generate`** — do not hand-write the SQL. The output will be:
```sql
ALTER TABLE "production_orders" ADD COLUMN "early_delivery_date" date;
```

**Non-destructive** — Postgres `ALTER TABLE ... ADD COLUMN ... NULL` does not touch existing rows; they get `NULL` in the new column. No data migration needed.

---

### `src/lib/import-schema.ts` (EDIT — add `earlyDeliveryDate` field)

**Self-analog:** current file lines 31–54.

**Add optional field** (after `lineCode` at line 51):
```typescript
// Current:
lineCode: z.string().nullish(),          // D-15: nullable
// Phase 35 adds:
earlyDeliveryDate: z.string().nullish(), // D-04: YYYY-MM-DD string or null; same .nullish() pattern
```

**Pattern rationale** (from existing file comments, lines 22–29): `.nullish()` accepts both `null` AND `undefined` — consistent with how `textureType` and `lineCode` handle absent XLSX cells.

---

### `src/actions/import.ts` (EDIT — persist `earlyDeliveryDate`)

**Self-analog:** current file lines 222–226 (`toValidate` block) and lines 683–696 (overwrite `.set()`), lines 740–754 (insert `.values()`).

**`toValidate` block** (line ~222 — add `earlyDeliveryDate`):
```typescript
const toValidate = {
  ...raw,
  millLine: 'Premix' as const,
  deliveryTime: dateToIsoString(raw.deliveryDate),
  earlyDeliveryDate: dateToIsoString(raw.deliveryDate) || null, // same source date, new column
};
```

**Insert path** (`import.ts` lines 740–754 — add `earlyDeliveryDate` to `.values()`):
```typescript
await db.insert(productionOrders).values({
  orderNumber: row.orderNumber,
  customer: row.customer,
  product: row.product,
  weightLbs: row.weightLbs.toString(),
  deliveryTime: row.deliveryTime,
  millLine: 'Premix' as const,
  textureType: row.textureType ?? null,
  lineCode: row.lineCode ?? null,
  earlyDeliveryDate: row.earlyDeliveryDate ?? null,  // ← add
  state: 'Pending' as const,
  version: 1,
  createdBy: userId,
});
```

**Overwrite path** (`import.ts` lines 683–696 — add `earlyDeliveryDate` to `.set()`):
```typescript
await db.update(productionOrders).set({
  customer: row.customer,
  product: row.product,
  weightLbs: row.weightLbs.toString(),
  deliveryTime: row.deliveryTime,
  textureType: row.textureType ?? null,
  lineCode: row.lineCode ?? null,
  earlyDeliveryDate: row.earlyDeliveryDate ?? null,  // ← add (Pitfall 7)
  version: sql`version + 1` as any,
}).where(and(...));
```

---

### `src/db/seed.ts` + `src/db/seed-data.json` (EDIT — backfill `earlyDeliveryDate`)

**Self-analog:** current `seed.ts` lines 93–140.

**`SnakeRow` type extension** (`seed.ts` lines 93–105 — add the new field):
```typescript
type SnakeRow = {
  order_number: string;
  customer: string;
  product: string;
  weight_lbs: string;
  delivery_time: string;
  state: ProductionState;
  mill_line: MillLine;
  texture_type: string | null;
  line_code: string | null;
  created_by: string;
  version: number;
  // early_delivery_date is NOT added to SnakeRow — it is injected at runtime
  // (Option B: computed at seed time, not stored in seed-data.json)
};
```

**Runtime injection** (`seed.ts` lines 128–140 — extend the `.map()` call):
```typescript
// Deterministic date formula (D-06): index i (0-based) → today + (i % 11) - 5
const today = new Date();
function earlyDeliveryDateFor(i: number): string {
  const d = new Date(today);
  d.setUTCDate(d.getUTCDate() + (i % 11) - 5);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const rows = (seedData as SnakeRow[]).map((r, i) => ({
  orderNumber: r.order_number,
  customer: r.customer,
  product: r.product,
  weightLbs: r.weight_lbs,
  deliveryTime: r.delivery_time,
  state: r.state,
  millLine: r.mill_line,
  textureType: r.texture_type,
  lineCode: r.line_code,
  createdBy: r.created_by,
  version: r.version,
  earlyDeliveryDate: earlyDeliveryDateFor(i), // ← add (Option B — runtime computed)
}));
```

`seed-data.json` does NOT need new fields — Option B computes dates at runtime.

---

### `src/app/page.tsx` (EDIT — add tz cookie read + KPI queries)

**Self-analog:** current file lines 1–56.

**Imports to add:**
```typescript
import { cookies } from 'next/headers';
import { getKpiStrip, getSevenDayTrend, getBlockedWithDwell } from '@/db/queries/kpis';
// (or import specific query functions depending on how kpis.ts is organized)
```

**Cookie read + parallel fan-out** (`page.tsx` lines 40–44 — extend `Promise.all`):
```typescript
// Read tz cookie — default 'America/Chicago' when absent (D-02)
const cookieStore = await cookies();
const tz = cookieStore.get('tz')?.value ?? 'America/Chicago';

const [orders, drawerOrder, drawerEvents, kpiStrip, kpiTrend, kpiBlocked] = await Promise.all([
  getProductionOrders(),
  order ? getOrderById(order) : Promise.resolve(null),
  order ? getOrderEvents(order) : Promise.resolve([]),
  getKpiStrip(tz),        // KPI-01, KPI-02a/b/c, KPI-04, KPI-05
  getSevenDayTrend(tz),   // KPI-06
  getBlockedWithDwell(),  // KPI-07 + KPI-08 (no tz needed — dwell is wallclock)
]);
```

**Props passing** (extend `<ProductionDashboard>` call):
```typescript
<ProductionDashboard
  orders={orders}
  canEdit={canEdit}
  drawerOrder={drawerOrder}
  drawerEvents={drawerEvents}
  kpiStrip={kpiStrip}
  kpiTrend={kpiTrend}
  kpiBlocked={kpiBlocked}
/>
```

---

### All `makeOrder` test fixtures (EDIT — add `earlyDeliveryDate: null`)

**Analog:** `src/components/MillColumn.test.tsx` lines 8–26 (canonical `makeOrder` pattern).

**Every `makeOrder` factory in the codebase** must add `earlyDeliveryDate: null` to its default spread, because `ProductionOrder = typeof productionOrders.$inferSelect` will gain this field after migration.

**Current `makeOrder`** (`MillColumn.test.tsx` lines 8–26):
```typescript
function makeOrder(overrides: Partial<ProductionOrder>): ProductionOrder {
  return {
    id: `order-${overrides.id ?? Math.random()}`,
    orderNumber: `ORD-${overrides.id ?? '000'}`,
    customer: 'Acme Feed',
    product: 'Layer Mash',
    weightLbs: '1000.00',
    deliveryTime: 'Mar 5, 2026 10am',
    state: 'Pending',
    millLine: 'Premix',
    textureType: null,
    lineCode: null,
    version: 1,
    createdBy: 'user-001',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}
```

**After migration — add one line:**
```typescript
    lineCode: null,
    earlyDeliveryDate: null,   // ← add to every makeOrder factory
    version: 1,
```

**Files that contain `makeOrder` factories** (must all be updated — TypeScript compile error guides discovery):
- `src/components/MillColumn.test.tsx` (lines 8–26 above)
- `src/components/BlockedAlertBand.test.tsx` (lines 27–45)
- `src/lib/__tests__/production-derivations.test.ts` (lines 10–28)
- All other files returned by `grep -rn 'makeOrder' src/`

---

## Shared Patterns

### `unstable_cache` with `'production-orders'` tag
**Source:** `src/db/queries/orders.ts` lines 32–49, `src/db/queries/events.ts` lines 26–36
**Apply to:** All functions in `src/db/queries/kpis.ts`
```typescript
export const myKpiQuery = unstable_cache(
  async (tz: string) => { /* ... */ },
  ['kpi-unique-key'],              // unique per function
  { tags: ['production-orders'] }  // always this tag (D-14)
);
```

### `server-only` + no-edge-runtime discipline
**Source:** `src/db/queries/orders.ts` line 1, `src/db/queries/events.ts` line 1
**Apply to:** `src/db/queries/kpis.ts`, `src/lib/formula-mix.ts` if used server-side
```typescript
import 'server-only'; // first line of every server-only module
// Never add: export const runtime = 'edge'; (RESEARCH.md PITFALLS.md)
```

### `force-dynamic` + `cookies()` in RSC page
**Source:** `src/app/page.tsx` line 12
**Apply to:** `src/app/page.tsx` (already declared — no change needed)
```typescript
export const dynamic = 'force-dynamic'; // PROD-01: never cached at RSC level
```

### `Suspense` boundary wrapping for streaming
**Source:** `src/components/ProductionDashboard.tsx` lines 255–293
**Apply to:** New KPI zones in `ProductionDashboard.tsx` (D-16)
```typescript
// Pattern: wrap each zone in its own Suspense with a skeleton fallback
<Suspense fallback={<KpiStripSkeleton />}>
  <KpiStrip kpis={kpiStrip} />
</Suspense>
```

### `startTransition` for non-shallow URL navigation
**Source:** `src/components/BlockedAlertBand.tsx` lines 44–46, `src/components/ProductionDashboard.tsx` lines 261–264
**Apply to:** `src/components/BlockedExceptionList.tsx` row click handler
```typescript
// Row click opens drawer via ?order= — must be non-shallow and in startTransition
onClick={() => startTransition(() => setQuery({ order: row.orderId }))}
```

### `useOrderQuery` hook for drawer navigation
**Source:** `src/components/BlockedAlertBand.tsx` line 32, `src/components/ProductionDashboard.tsx` line 156
**Apply to:** `src/components/BlockedExceptionList.tsx`
```typescript
const [, setQuery] = useOrderQuery(); // from @/hooks/useOrderQuery
```

### `z.string().nullish()` for optional import fields
**Source:** `src/actions/import-schema.ts` lines 50–51
**Apply to:** New `earlyDeliveryDate` field in `import-schema.ts`
```typescript
earlyDeliveryDate: z.string().nullish(), // same pattern as textureType / lineCode
```

### `COALESCE` guard for SQL aggregate `null`
**Source:** RESEARCH.md Pitfall 1 + Pattern 1
**Apply to:** All `sum()` calls in `src/db/queries/kpis.ts`
```typescript
totalLbs: sql<string>`COALESCE(${sum(productionOrders.weightLbs)}::text, '0')`
// Never: sum(productionOrders.weightLbs) alone — returns null when no rows match
```

### IANA timezone validation before SQL
**Source:** RESEARCH.md Pitfall 2
**Apply to:** All KPI query functions in `kpis.ts` that accept a `tz` parameter
```typescript
const sanitizedTz = Intl.supportedValuesOf('timeZone').includes(tz ?? '')
  ? tz
  : 'America/Chicago';
// Use sanitizedTz in sql`... AT TIME ZONE ${sanitizedTz}` — never raw cookie value
```

---

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `src/components/TzBootstrap.tsx` | client utility | event-driven | No existing null-return side-effect-only client component in the codebase; closest structural relative is `LastUpdatedChip.tsx` which does render output. RESEARCH.md Pattern 9 provides the complete implementation. |

---

## Metadata

**Analog search scope:** `src/db/queries/`, `src/db/schema/`, `src/lib/`, `src/components/`, `src/actions/`, `src/app/`, `src/db/`
**Files scanned:** 18 source files read directly
**Pattern extraction date:** 2026-05-14

**Key reference files:**
- `/Users/joel/Desktop/Projects/cgm-dashboard/src/db/queries/orders.ts` — canonical `unstable_cache` pattern
- `/Users/joel/Desktop/Projects/cgm-dashboard/src/db/queries/events.ts` — cache key vs. tag split
- `/Users/joel/Desktop/Projects/cgm-dashboard/src/components/MillColumn.tsx` — column header to extend; `makeOrder` fixture shape
- `/Users/joel/Desktop/Projects/cgm-dashboard/src/components/ProductionDashboard.tsx` — layout shell to extend; three-zone insertion points
- `/Users/joel/Desktop/Projects/cgm-dashboard/src/components/BlockedAlertBand.tsx` — `useOrderQuery` + `startTransition` client pattern
- `/Users/joel/Desktop/Projects/cgm-dashboard/src/components/ui/Card.tsx` — base primitive for `KpiCard`
- `/Users/joel/Desktop/Projects/cgm-dashboard/src/lib/production-derivations.ts` — pure-lib file shape for `formula-mix.ts` and `format-dwell.ts`
- `/Users/joel/Desktop/Projects/cgm-dashboard/src/lib/__tests__/production-derivations.test.ts` — test file structure for lib utilities
- `/Users/joel/Desktop/Projects/cgm-dashboard/src/components/MillColumn.test.tsx` — `makeOrder` fixture canonical shape (must propagate `earlyDeliveryDate: null`)
- `/Users/joel/Desktop/Projects/cgm-dashboard/src/components/BlockedAlertBand.test.tsx` — RTL component test structure
- `/Users/joel/Desktop/Projects/cgm-dashboard/src/components/ColumnSkeleton.tsx` — skeleton animate-pulse pattern
- `/Users/joel/Desktop/Projects/cgm-dashboard/src/db/seed.ts` — `SnakeRow` type + `.map()` transform to extend
- `/Users/joel/Desktop/Projects/cgm-dashboard/src/actions/import.ts` — insert path (lines 740–754) + overwrite path (lines 683–696)
- `/Users/joel/Desktop/Projects/cgm-dashboard/src/actions/import-schema.ts` — `.nullish()` field pattern
- `/Users/joel/Desktop/Projects/cgm-dashboard/src/app/layout.tsx` — `TzBootstrap` insertion point
- `/Users/joel/Desktop/Projects/cgm-dashboard/src/app/page.tsx` — `Promise.all` fan-out + auth gate pattern
