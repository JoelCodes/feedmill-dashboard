# Phase 35: KPI Sections and Role-Specific Metrics - Research

**Researched:** 2026-05-14
**Domain:** Server-side SQL aggregation, Drizzle migrations, Next.js RSC data flow, hand-rolled SVG charts
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01 / D-02:** "Today" uses operator's browser IANA timezone, propagated via a `tz` cookie (default fallback `'America/Chicago'`). SQL: `date_trunc('day', updated_at AT TIME ZONE $tz)`.
- **D-03:** Dwell time = `NOW() - MAX(changed_at)` for the most-recent Block event (`to_state = 'Blocked'` in `order_events`). Resets on Resume → re-Block.
- **D-04:** New nullable `early_delivery_date date` column on `production_orders` via Drizzle migration (`drizzle-kit generate` + `drizzle-kit migrate`).
- **D-05:** `early_delivery_date` source is the existing Book1.xlsx column "Early Delivery Date" (already mapped in `import.ts` xlsxSchema as `deliveryDate: { column: 'Early Delivery Date', type: Date }`). XLSX parsing already works; Phase 35 adds persistence.
- **D-06:** Backfill synthetic `early_delivery_date` values for all 33 seeded orders, spread `today ±5 days` deterministically (row index modulo 11 offset).
- **D-07:** Three-zone layout in `ProductionDashboard.tsx`: (1) `KpiStrip` above filter pills, (2) KPI-03 strip inline in each `MillColumn` header, (3) `KpiSection` (SevenDayTrendChart + BlockedExceptionList) full-width below columns.
- **D-08:** Delete `src/components/KPICard.tsx` (demo-era, static mock data). Build fresh `KpiCard.tsx` on the existing `Card` primitive.
- **D-09:** KPI-03 per-column strip extends `MillColumn` header. Server passes `summary: { orderCount, completedLbs, totalLbs }` prop.
- **D-10:** `BlockedExceptionList` (KPI-07) is distinct from `BlockedAlertBand`. Both coexist.
- **D-11 / D-12:** Texture bucketing: `PELLET|SH PELLET → Pellet`, `MASH → Mash`, `FINE CR|C. CRUMBLE → Crumble`, NULL/unrecognized → excluded from numerator AND denominator. Pure helper in `src/lib/formula-mix.ts`.
- **D-13:** Hand-rolled inline SVG for the 7-day trend chart. **No new chart library dependency.**
- **D-14:** KPI queries share the `'production-orders'` cache tag with existing queries. No new tag needed.
- **D-15:** KPI refresh piggybacks on existing `useProductionPolling` 30s cadence. No separate KPI polling.
- **D-16:** Per-zone `<Suspense>` boundaries: `<KpiStripSkeleton>` for top strip, `<KpiSectionSkeleton>` for bottom section.
- **D-17:** All KPI surfaces are read-only, visible to any authenticated user. No `canEdit` gate on KPIs.

### Claude's Discretion

- Exact bootstrap mechanism for the `tz` cookie (recommend: tiny `<TzBootstrap />` client component in root layout).
- Whether KPI queries live in `src/db/queries/kpis.ts` (new file) or are co-located in `orders.ts`/`events.ts`.
- Exact prop shape for the `summary` object passed to `MillColumn` (single `summary` object vs. flat props).
- Whether `BlockedExceptionList` ships with click-to-sort column headers or default dwell-time sort only in v2.0.
- Exact arrangement of `SevenDayTrendChart` and `BlockedExceptionList` within `KpiSection` (resolved in UI-SPEC: side-by-side on md+, stacked on mobile).

### Deferred Ideas (OUT OF SCOPE)

- Drill-down from KPI card into filtered order view (`KPI-FUT-09`).
- Week-over-week throughput delta (`KPI-FUT-04`), bottleneck heatmap (`KPI-FUT-05`), customer concentration (`KPI-FUT-06`), delivery compliance rate (`KPI-FUT-07`), manager exception inbox (`KPI-FUT-08`).
- Tooltips, animations, or interactivity on the 7-day trend chart.
- Click-to-sort column headers on `BlockedExceptionList` beyond the default dwell-time sort.
- Manual entry/edit of `early_delivery_date` in the drawer (v2.1+).
- Custom date-range KPI views (explicit out of scope in REQUIREMENTS.md).
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| KPI-01 | Mill-wide tons completed today | Drizzle `sum()` + `sql\`AT TIME ZONE\`` date filter on `updatedAt`; cache tag `'production-orders'` |
| KPI-02 | Tons completed today per mill line (Premix/Excel/CGM) | Same aggregation as KPI-01, grouped by `millLine`; 3 rows → 3 sub-cards |
| KPI-03 | Per-column header strip: order count + completed-lbs / total-lbs | `computeColumnWeights` already exists in `production-derivations.ts`; Phase 35 adds `orderCount` and moves computation server-side |
| KPI-04 | Pending backlog (count + total weight) | `count()` and `sum(weightLbs)` where `state = 'Pending'`; passed as `KpiCard` props |
| KPI-05 | Formula mix breakdown (Pellet/Mash/Crumble percentages) for completed today | CASE expression in SQL mirrors `bucketTexture()` helper; `NULLIF` guard for zero-denominator |
| KPI-06 | 7-day order volume trend; empty state < 7 days | `date_trunc` by day over past 7 days; 0..7 bucket array; hand-rolled SVG in `SevenDayTrendChart.tsx` |
| KPI-07 | Cross-column exception list of blocked orders, sortable by dwell time | Query `order_events` for `MAX(changed_at)` where `to_state='Blocked'`; compute `NOW() - MAX(changed_at)` server-side |
| KPI-08 | Overdue badge when `earlyDeliveryDate < today AND state != 'Completed'` | Requires new `early_delivery_date` column (D-04), import path extension (D-05), seed backfill (D-06) |
</phase_requirements>

---

## Summary

Phase 35 closes the KPI deferral from v1.0 by wiring eight computed metrics into the existing `ProductionDashboard` shell. All aggregations run server-side in SQL via Drizzle's typed aggregation helpers (`count`, `sum`) combined with `sql` template literals for timezone-aware `AT TIME ZONE` date truncation. The queries are wrapped in `unstable_cache` with the existing `'production-orders'` tag, so KPI data invalidates alongside the order list on every mutating action and on every 30-second `router.refresh()`.

The most significant non-trivial addition is the `early_delivery_date date` nullable column, which requires a Drizzle migration (migration `0001_*` — the second in the journal). The Book1.xlsx `Early Delivery Date` column is already parsed in `src/actions/import.ts` (xlsxSchema key `deliveryDate`) and converted to a date string via `dateToIsoString()`. Phase 35 closes the loop: the parsed date is now persisted to the new column, and the import schema gains an optional `earlyDeliveryDate` field. All 33 seed rows gain synthetic dates for KPI-08 visibility.

The 7-day trend chart ships as a hand-rolled inline SVG (D-13) with no new npm dependencies. The `ProductionOrder` type will gain an `earlyDeliveryDate: string | null` field after schema migration, which propagates into the `makeOrder` test fixture in `MillColumn.test.tsx` (TypeScript will surface this as a compile error, guiding updates).

**Primary recommendation:** Implement the `early_delivery_date` migration first (Wave 0), then the KPI query layer in `src/db/queries/kpis.ts` (TDD RED → GREEN), then the UI components, then wire the page. The migration and seed update are the only irreversible steps; all other work is additive.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| KPI aggregation SQL (KPI-01–07) | API/Backend (RSC query layer) | — | All sums, percentages, and dwell-time math run in SQL per the Phase 31–34 server-side discipline |
| Timezone date boundary computation | API/Backend (RSC query layer) | Browser (cookie source) | `AT TIME ZONE` in SQL; IANA string sourced from browser cookie |
| `tz` cookie write | Browser/Client (`<TzBootstrap />`) | — | `Intl.DateTimeFormat().resolvedOptions().timeZone` is a browser API; write must be client-side |
| `tz` cookie read | API/Backend (RSC `cookies()`) | — | `cookies()` from `next/headers` reads the cookie server-side |
| KPI prop passing | API/Backend (`src/app/page.tsx` RSC) | — | Parallel `Promise.all` pattern established in Phase 34; KPI queries join the fan-out |
| KPI UI rendering | Frontend (`ProductionDashboard.tsx` client wrapper) | — | Props flow from RSC through the client wrapper to individual KPI components |
| Formula mix bucketing | API/Backend (`formula-mix.ts` pure helper) | — | Pure mapping used both in the SQL CASE expression and in unit tests; no browser API needed |
| Hand-rolled SVG chart | Frontend (`SevenDayTrendChart.tsx`) | — | SVG is declarative; server sends the 0..7 data array; client renders SVG deterministically |
| `early_delivery_date` column | Database/Storage (Drizzle migration) | — | `ALTER TABLE … ADD COLUMN … NULL` — non-destructive; added in migration `0001_*` |
| Overdue badge logic | API/Backend (query returns computed flag) | Frontend (conditional render) | Server computes `earlyDeliveryDate < today AND state != 'Completed'`; client conditionally renders badge |
| Dwell-time string formatting | API/Backend (server query return) | Frontend (display) | D-03: server computes duration; UI-SPEC locks format strings `Xm / Xh Ym / Xd Yh` |

---

## Standard Stack

### Core (no new additions — locked per D-13)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `drizzle-orm` | 0.45.2 (installed) | SQL aggregation queries, `count()`, `sum()`, `sql` template | Project standard since Phase 32 |
| `drizzle-kit` | 0.31.10 (installed) | Generate + apply the `early_delivery_date` migration | Project standard since Phase 32 |
| `next` | 16.1.6 (installed) | RSC fan-out, `unstable_cache`, `cookies()`, `force-dynamic` | Project standard since Phase 31 |
| `zod` | ^4.3.6 (installed) | Extend `productionOrderImportSchema` with optional `earlyDeliveryDate` | Project standard since Phase 33 |
| `@neondatabase/serverless` | 1.1.0 (installed) | Neon HTTP driver for all DB queries | Project standard since Phase 31 |

**No new packages.** [VERIFIED: package.json grep confirmed zero chart libraries; D-13 is hard-locked.]

### Supporting (existing, phase 35 extends)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `lucide-react` | ^0.577.0 (installed) | Icons in `KpiCard`: `Wheat`, `ClipboardList`, `Activity` | Already in UI-SPEC; icon imports are additive |
| `class-variance-authority` | installed (via `Card.tsx`) | `KpiCard.tsx` uses `Card` primitive which uses `cva` | Used for `Card` variant composition |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hand-rolled SVG (D-13) | `recharts`, `visx`, `@nivo/*` | Chart libraries add bundle weight and setup complexity; operator feedback in v2.1+ can justify the swap; SVG is simpler for 7 static bars |
| Separate `kpis.ts` query file | Co-locate in `orders.ts` | Separation is cleaner (concerns: orders vs. aggregations); recommended |

**Installation:** No new packages to install. `drizzle-kit generate` + `drizzle-kit migrate` is a dev-side CLI step, not an npm install.

---

## Package Legitimacy Audit

> No new npm packages are installed in Phase 35 (D-13, locked). This section is not applicable.

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none
**No install steps required.**

---

## Architecture Patterns

### System Architecture Diagram

```
Browser (operator)
    │
    ├─ [first render] <TzBootstrap /> client component
    │        └─ writes tz=<IANA> cookie (Intl.DateTimeFormat)
    │
    └─ GET / (every 30s router.refresh())
            │
            ▼
    src/app/page.tsx (RSC, force-dynamic)
            │  reads cookies().get('tz') → IANA string
            │
            └─ Promise.all([
                  getProductionOrders(),          ─┐
                  getOrderById(order?),            │ existing
                  getOrderEvents(order?),          │
                  getKpiStrip(tz),                 ─┘ new (kpis.ts)
                  getColumnSummaries(tz),          ─┐ new
                  getSevenDayTrend(tz),            │
                  getBlockedWithDwell(),           ─┘
               ])
               │
               ▼ passes props to:
    ProductionDashboard.tsx (client wrapper)
               │
               ├─ <Suspense fallback={<KpiStripSkeleton />}>
               │       └─ <KpiStrip kpis={stripData} />
               │               └─ 6× <KpiCard /> (KPI-01, 02a/b/c, 04, 05)
               │
               ├─ Header strip (filter pills, search, Import, LastUpdatedChip)
               │
               ├─ <BlockedAlertBand /> (unchanged)
               │
               ├─ 3× <Suspense><MillColumn summary={...} /></Suspense>
               │       └─ KPI-03 strip inline in each column header
               │
               └─ <Suspense fallback={<KpiSectionSkeleton />}>
                       └─ <KpiSection>
                               ├─ <SevenDayTrendChart data={trendData} />  (KPI-06)
                               └─ <BlockedExceptionList orders={blocked} /> (KPI-07 + KPI-08)
```

### Recommended Project Structure

```
src/
├── db/
│   ├── queries/
│   │   ├── orders.ts           (unchanged)
│   │   ├── events.ts           (unchanged)
│   │   └── kpis.ts             (NEW — all KPI aggregation queries)
│   ├── schema/
│   │   └── orders.ts           (EDIT — add earlyDeliveryDate column)
│   ├── seed-data.json          (EDIT — add early_delivery_date to all 33 rows)
│   └── seed.ts                 (EDIT — extend SnakeRow type + mapping)
├── actions/
│   └── import.ts               (EDIT — persist earlyDeliveryDate on insert/update)
├── lib/
│   ├── formula-mix.ts          (NEW — pure bucketTexture() helper)
│   └── import-schema.ts        (EDIT — add optional earlyDeliveryDate field)
├── app/
│   └── page.tsx                (EDIT — add tz cookie read + KPI Promise.all)
└── components/
    ├── KPICard.tsx              (DELETE — demo-era static component)
    ├── KpiCard.tsx              (NEW — generic Card-based KPI primitive)
    ├── KpiStrip.tsx             (NEW — horizontal strip of KpiCard instances)
    ├── KpiSection.tsx           (NEW — full-width bottom container)
    ├── SevenDayTrendChart.tsx   (NEW — hand-rolled SVG bar chart)
    ├── BlockedExceptionList.tsx (NEW — sortable dwell-time table)
    ├── MillColumn.tsx           (EDIT — add summary prop + KPI-03 header strip)
    └── ProductionDashboard.tsx  (EDIT — slot KpiStrip + KpiSection + tz prop)
```

---

### Pattern 1: Drizzle SQL Aggregation with Timezone-Aware Date Filter

The key pattern for KPI-01/02/05/06 is combining Drizzle's typed aggregation helpers with `sql` template literals for the `AT TIME ZONE` clause. [VERIFIED: drizzle-orm 0.45.2 exports `count`, `sum`, `avg`, `max`, `min` from `drizzle-orm`; `sql` template is available from `drizzle-orm`.]

```typescript
// src/db/queries/kpis.ts
import 'server-only';
import { unstable_cache } from 'next/cache';
import { db } from '@/db';
import { productionOrders } from '@/db/schema/orders';
import { sql, sum, count, eq, and } from 'drizzle-orm';

// KPI-01: Mill-wide tons completed today (IANA timezone-aware)
export const getKpiCompletedToday = unstable_cache(
  async (tz: string): Promise<{ totalLbs: string }> => {
    // AT TIME ZONE with the IANA string produces a timezone-aware boundary.
    // date_trunc('day', ...) truncates to midnight in the operator's local timezone.
    // The result is compared against CURRENT_DATE AT TIME ZONE tz.
    const [row] = await db
      .select({
        totalLbs: sql<string>`COALESCE(${sum(productionOrders.weightLbs)}, '0')`,
      })
      .from(productionOrders)
      .where(
        sql`${productionOrders.state} = 'Completed' AND
            date_trunc('day', ${productionOrders.updatedAt} AT TIME ZONE ${tz})
              = date_trunc('day', NOW() AT TIME ZONE ${tz})`
      );
    return row ?? { totalLbs: '0' };
  },
  ['kpi-completed-today'],
  { tags: ['production-orders'] }
);
```

**Critical detail:** `sum(weightLbs)` returns `string | null` (Drizzle preserves the `numeric` → TS `string` boundary). Wrap in `COALESCE(..., '0')` to avoid null propagation. Never parse the string in SQL—pass it to the UI as-is and let the display layer format with `parseFloat().toLocaleString()`. [VERIFIED: `src/db/schema/orders.ts` comment block CR-01 boundary contract + `production-derivations.ts` uses `parseFloat(o.weightLbs || '0')`.]

---

### Pattern 2: Formula Mix Bucketing — SQL CASE Expression

KPI-05 requires a SQL CASE expression that mirrors the `bucketTexture()` TS helper exactly. [ASSUMED: the exact Drizzle `sql` template syntax for a CASE expression with FILTER — verified that Drizzle `sql` templates accept any valid SQL string.]

```typescript
// SQL CASE expression matching D-11 bucket rules exactly
const bucketExpr = sql<string | null>`
  CASE ${productionOrders.textureType}
    WHEN 'PELLET'    THEN 'Pellet'
    WHEN 'SH PELLET' THEN 'Pellet'
    WHEN 'MASH'      THEN 'Mash'
    WHEN 'FINE CR'   THEN 'Crumble'
    WHEN 'C. CRUMBLE' THEN 'Crumble'
    ELSE NULL
  END
`;

// KPI-05: Formula mix percentages for completed today
// D-12: NULL excluded from both numerator AND denominator
const formulaMix = await db
  .select({
    pelletPct: sql<number>`
      ROUND(
        COUNT(*) FILTER (WHERE ${bucketExpr} = 'Pellet') * 100.0
        / NULLIF(COUNT(*) FILTER (WHERE ${bucketExpr} IS NOT NULL), 0),
        1
      )`,
    mashPct: sql<number>`/* same pattern for Mash */`,
    crumblePct: sql<number>`/* same pattern for Crumble */`,
    uncategorizedCount: sql<number>`COUNT(*) FILTER (WHERE ${bucketExpr} IS NULL)`,
  })
  .from(productionOrders)
  .where(/* today's Completed orders */);
```

**Key rule (D-12):** `NULLIF(denominator, 0)` prevents division-by-zero when all orders are uncategorized. The result is `NULL`, which the UI maps to `0%` per each bucket. [ASSUMED: NULLIF behavior — this is standard SQL and matches Phase 32's `computeColumnWeights` pattern of handling nulls defensively.]

---

### Pattern 3: Dwell-Time Query for KPI-07

The `order_events` table has `changedAt` (timestamptz) and `toState`. The dwell query aggregates per blocked order. [VERIFIED: `src/db/schema/events.ts` — `changedAt: timestamp with timezone`, `toState: productionStateEnum`, composite index on `(orderId, changedAt DESC)` exists.]

```typescript
// KPI-07: Blocked orders with dwell time
// Uses order_events.changedAt and production_orders JOIN
const blockedWithDwell = await db
  .select({
    orderId: orderEvents.orderId,
    orderNumber: productionOrders.orderNumber,
    customer: productionOrders.customer,
    millLine: productionOrders.millLine,
    earlyDeliveryDate: productionOrders.earlyDeliveryDate,
    dwellInterval: sql<string>`NOW() - MAX(${orderEvents.changedAt})`,
  })
  .from(orderEvents)
  .innerJoin(productionOrders, eq(orderEvents.orderId, productionOrders.id))
  .where(
    and(
      eq(orderEvents.toState, 'Blocked'),
      eq(productionOrders.state, 'Blocked') // only CURRENTLY blocked orders
    )
  )
  .groupBy(
    orderEvents.orderId,
    productionOrders.orderNumber,
    productionOrders.customer,
    productionOrders.millLine,
    productionOrders.earlyDeliveryDate,
  )
  .orderBy(sql`MAX(${orderEvents.changedAt}) ASC`); // oldest blocked first = longest dwell
```

**Note:** The `dwellInterval` is a Postgres `INTERVAL` type. The UI-SPEC format string (`Xm`, `Xh Ym`, `Xd Yh`) requires formatting. Server-side: extract epoch seconds from the interval via `EXTRACT(EPOCH FROM ...)`, pass as a number, and format in a pure TS helper. [ASSUMED: EXTRACT EPOCH approach — verified this is idiomatic Postgres; TS-side formatting is simpler than SQL-side text construction.]

---

### Pattern 4: 7-Day Trend Bucketing (KPI-06)

```typescript
// KPI-06: 7 daily buckets of completed weight, ordered oldest-first
// Returns up to 7 rows (fewer if DB has < 7 days of completions)
const trend = await db
  .select({
    date: sql<string>`
      date_trunc('day', ${productionOrders.updatedAt} AT TIME ZONE ${tz})::date
    `,
    completedLbs: sql<string>`COALESCE(${sum(productionOrders.weightLbs)}, '0')`,
  })
  .from(productionOrders)
  .where(
    and(
      eq(productionOrders.state, 'Completed'),
      sql`${productionOrders.updatedAt} AT TIME ZONE ${tz}
          >= date_trunc('day', NOW() AT TIME ZONE ${tz}) - INTERVAL '6 days'`
    )
  )
  .groupBy(sql`date_trunc('day', ${productionOrders.updatedAt} AT TIME ZONE ${tz})::date`)
  .orderBy(sql`date_trunc('day', ${productionOrders.updatedAt} AT TIME ZONE ${tz})::date ASC`);
```

The returned array has 0..7 rows. The component receives the array and renders the empty state when `data.length < 7`. [VERIFIED: CONTEXT.md D-13 locks `data.length < 7` as the empty-state threshold.]

---

### Pattern 5: `unstable_cache` Wrapping for KPI Queries

Every KPI query must follow the exact same `unstable_cache` pattern as `getProductionOrders` in `src/db/queries/orders.ts`. [VERIFIED: `orders.ts` lines 32–49 and `events.ts` lines 26–36 show the canonical pattern.]

```typescript
// Canonical pattern from src/db/queries/orders.ts (lines 32-49)
export const getKpiCompletedToday = unstable_cache(
  async (tz: string) => { /* query */ },
  ['kpi-completed-today'],   // cache key array (unique per query)
  { tags: ['production-orders'] }  // D-14: same tag as getProductionOrders
);
```

**Cache key vs. tag:** The second argument (key array) must differ per query so each KPI gets its own cache slot. The `tags` option is always `['production-orders']` (D-14). [VERIFIED: `events.ts` uses key `['order-events']` but tag `'production-orders'` — demonstrates the split between key and tag.]

---

### Pattern 6: `early_delivery_date` Drizzle Column + Migration

Adding a nullable date column to an existing table is non-destructive in Postgres. [VERIFIED: existing migration `0000_aromatic_stone_men.sql` shows no `early_delivery_date` column — confirms the migration will be additive as `0001_*`.]

```typescript
// src/db/schema/orders.ts — ADD to the pgTable column map
earlyDeliveryDate: date('early_delivery_date').default(null),
// TS inferred type: string | null (PgDateString — verified via node inspection)
```

**Important:** `date('col')` without `{ mode: 'date' }` uses the default `PgDateString` column type, so Drizzle infers `string | null` for this column. [VERIFIED: `node -e "const {date} = require('drizzle-orm/pg-core'); ..."` confirms `dataType: "string"`, `columnType: "PgDateString"` for the default mode.] This is consistent with `deliveryTime: text('delivery_time')` being stored as a string — `earlyDeliveryDate` will be a `YYYY-MM-DD` string (from `dateToIsoString()` which already exists in `import.ts`).

Migration command sequence:
```bash
npx drizzle-kit generate   # produces drizzle/0001_*.sql
npx drizzle-kit migrate    # applies against DATABASE_URL_UNPOOLED
```

SQL output will be:
```sql
ALTER TABLE "production_orders" ADD COLUMN "early_delivery_date" date;
```

---

### Pattern 7: Import Path Extension for `earlyDeliveryDate`

The `xlsxSchema` in `src/actions/import.ts` already maps `deliveryDate: { column: 'Early Delivery Date', type: Date }` and `dateToIsoString()` converts the Date to `YYYY-MM-DD`. [VERIFIED: `import.ts` lines 87–96 show the xlsxSchema, and `dateToIsoString()` is already implemented and deployed.]

The current import flow maps `deliveryDate` → `deliveryTime` (the text column). Phase 35 ALSO needs to write `deliveryDate` → `earlyDeliveryDate` (the new date column). Two changes needed:

1. **`import-schema.ts`** — add optional field:
```typescript
earlyDeliveryDate: z.string().nullish(), // YYYY-MM-DD string or null
```

2. **`import.ts`** — in `toValidate` (line ~222), add:
```typescript
const toValidate = {
  ...raw,
  millLine: 'Premix' as const,
  deliveryTime: dateToIsoString(raw.deliveryDate),
  earlyDeliveryDate: dateToIsoString(raw.deliveryDate) || null, // same date, different column
};
```

3. **`import.ts` commitImportAction insert/update paths** — pass `earlyDeliveryDate` in `.values()`:
```typescript
earlyDeliveryDate: row.earlyDeliveryDate ?? null,
```

**Observation:** The Book1.xlsx `Early Delivery Date` column drives BOTH `deliveryTime` (the display text column, established in Phase 33) AND the new `earlyDeliveryDate` (the date column for KPI-08). This is the same source data serving two different persistence targets. [VERIFIED: `import.ts` xlsxSchema line 90 `deliveryDate: { column: 'Early Delivery Date', type: Date }` and line 225 `deliveryTime: dateToIsoString(raw.deliveryDate)` confirm the current mapping.]

---

### Pattern 8: Seed Backfill for `early_delivery_date`

The seed script maps `seed-data.json` rows to DB columns. Current `SnakeRow` type does not include `early_delivery_date`. Phase 35 adds it. [VERIFIED: `seed.ts` lines 93–105 show `SnakeRow` type; `seed-data.json` confirmed to have 33 rows without `early_delivery_date`.]

**Deterministic backfill formula (D-06):**
- For row index `i` (0-based): `earlyDeliveryDate = today + (i % 11) - 5` days
- This spreads dates from `today - 5` to `today + 5` across 33 rows, with some repeating
- Index modulo 11 ensures some rows get negative offsets (overdue), some zero (today), some positive (upcoming)

Implementation: In `seed.ts`, compute `today` at seed runtime and generate the date strings:
```typescript
const today = new Date();
const earlyDeliveryDate = (i: number): string => {
  const d = new Date(today);
  d.setUTCDate(d.getUTCDate() + (i % 11) - 5);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;
};
```

Two options for implementing this:
- **Option A:** Add static `early_delivery_date` values to `seed-data.json` using today's date at the time of writing — but this means the dates are immediately stale on future runs.
- **Option B (recommended):** Compute the dates at seed runtime in `seed.ts` using a deterministic formula. The `seed-data.json` does NOT get `early_delivery_date` keys; the mapping in `seed.ts` injects computed values.

Option B is strongly preferred because D-06 says "spread across today ±5 days deterministically" — implying the dates should be relative to the date the seed runs, not a fixed snapshot date. [ASSUMED: Option B interpretation — CONTEXT.md says "deterministically (e.g., based on row index modulo 11 offset)" which supports runtime computation.]

---

### Pattern 9: `<TzBootstrap />` Client Component

```typescript
// src/components/TzBootstrap.tsx — tiny 'use client' component
'use client';
import { useEffect } from 'react';

export default function TzBootstrap() {
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    document.cookie = `tz=${tz}; path=/; max-age=86400; SameSite=Lax`;
  }, []);
  return null; // renders nothing
}
```

Place in `src/app/layout.tsx` inside `<ClerkProvider>` so it runs on every page. [VERIFIED: `layout.tsx` has `ClerkProvider → ThemeProvider → NuqsAdapter → {children}`; `TzBootstrap` can be added adjacent to `{children}` inside `ThemeProvider`.]

---

### Pattern 10: KPI-03 Column Header Strip (inline in MillColumn)

Current `MillColumn.tsx` header (lines 112–118) renders:
```tsx
<h2>Premix</h2>
<p>{formatWeight(completed)} / {formatWeight(total)} lbs</p>
```

Phase 35 extends to:
```tsx
<h2>Premix</h2>
<p>{orderCount} orders — {formatWeight(completedLbs)} / {formatWeight(totalLbs)} lbs</p>
```

The `summary` prop is passed from `page.tsx` through `ProductionDashboard.tsx` to each `MillColumn`. [VERIFIED: `ProductionDashboard.tsx` props type shows `orders: ProductionOrder[]`; the existing `computeColumnWeights()` in `production-derivations.ts` computes `completed/total` client-side from the orders array.]

**Decision for planner:** The KPI-03 summary values should be computed SERVER-SIDE in the KPI query (not re-derived from the `orders` prop client-side) because: (1) the existing `computeColumnWeights` only counts "today" if interpreted from `updatedAt`, but KPI-03 wants ALL orders in the column (not just today), and (2) the server-side computation aligns with the architecture discipline of "no client-side business math." However, since `ProductionDashboard` already has the full `orders` array, the planner may choose to compute the KPI-03 summary client-side from `orders` filtered by `millLine` and use `computeColumnWeights` — this is simpler and avoids a 4th KPI query. [ASSUMED: The current `MillColumn.tsx` already displays `completed/total` from `computeColumnWeights` — the only missing element is `orderCount`. The planner should verify whether to compute server-side or extend the client-side derivation.]

**Recommendation:** Compute KPI-03 values from the already-fetched `orders` prop in `ProductionDashboard` client-side using the existing `computeColumnWeights` helper, adding only `orderCount` from `orders.filter(o => o.millLine === line).length`. This avoids a separate DB round-trip for data already available in memory.

---

### Anti-Patterns to Avoid

- **Never use `numeric` string in JS arithmetic.** Always `sum()` in SQL or `parseFloat()` before JS math. (Phase 32 CR-01 boundary contract — verified in `production-derivations.ts`.)
- **Never pass a raw SQL string as the `tz` parameter.** The IANA string from `cookies()` must be validated/sanitized before composing into SQL. A minimal allowlist check (e.g., verify the string matches `/^[A-Za-z_]+\/[A-Za-z_]+$/` or `Intl.supportedValuesOf('timeZone')`) prevents SQL injection via cookie manipulation. [ASSUMED: sanitization approach — standard practice; document explicitly in the query helper.]
- **Never use `drizzle-kit push` in this project.** Migration discipline locked since Phase 32 D-06; `push` is explicitly banned in STATE.md.
- **Never call `bucketTexture()` from the SQL query.** The SQL CASE expression and the TS helper are parallel implementations. Their agreement is enforced by a unit test, not by calling one from the other.
- **Avoid `Math.random()` in SVG geometry.** Hand-rolled SVG must be deterministic for React hydration safety. All bar heights are proportional to dataset max value (deterministic math). [VERIFIED: CONTEXT.md build-time risks section flags this explicitly.]
- **Do not TRUNCATE the `users` table in seed.ts.** Phase 32 D-17 / TRUNCATE-protection rule must be preserved. Phase 35 only adds `early_delivery_date` to `production_orders` seed rows.
- **Verify KPICard.tsx has no other importers before deletion.** `grep -rn 'KPICard' src/` must confirm zero imports outside the file itself before `rm`. [VERIFIED: grep confirmed `KPICard.tsx` is the only file containing the string — no other importers.]

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SQL aggregation | Custom loop over JS arrays | Drizzle `sum()`, `count()` + `sql` template | DB-side aggregation is faster, prevents `numeric` → JS string concat bugs |
| Cache invalidation | Timer-based TTL | `revalidateTag('production-orders')` (existing) | Already implemented by every mutating action; adopting it costs nothing |
| Cookie reading server-side | Manual header parsing | `cookies()` from `next/headers` | Next.js provides typed, safe cookie access |
| Timezone math | `moment-timezone`, `date-fns-tz` | Postgres `AT TIME ZONE` clause | No new lib; DB owns the timezone conversion |
| SVG chart | `recharts`, `visx` | Hand-rolled per D-13 | D-13 is locked; 7 static bars require ~40 lines of SVG, not a library |

**Key insight:** Every piece of KPI math (sums, percentages, dwell times, timezone offsets) that would require a JS library or complex client-side computation can instead be expressed in a 5–10 line SQL query. The project's established discipline is to treat the DB as the computation engine, not a raw data store.

---

## Common Pitfalls

### Pitfall 1: `sum()` Returns `null` When No Rows Match

**What goes wrong:** `sum(weightLbs)` returns `null` (not `0`) when the WHERE clause matches no rows (e.g., no completed orders today). Passing `null` as the `value` prop to `KpiCard` renders "null lbs".
**Why it happens:** SQL `SUM` of an empty set is NULL by definition.
**How to avoid:** Wrap every aggregation in `COALESCE(..., '0')` in SQL: `COALESCE(SUM(weight_lbs), 0)`. [VERIFIED: Phase 32 CR-01 comment in `orders.ts` warns about this; `computeColumnWeights` uses `parseFloat(o.weightLbs || '0')` as the JS fallback.]
**Warning signs:** `KpiCard` rendering "null lbs" or "NaN lbs" in the UI.

---

### Pitfall 2: IANA Timezone String Injection via Cookie

**What goes wrong:** The `tz` cookie value is operator-controlled. A malicious user could set `tz=America/Chicago'; DROP TABLE production_orders; --` and compose it directly into a SQL string.
**Why it happens:** The `tz` parameter flows from `cookies().get('tz')?.value` directly into `sql\`... AT TIME ZONE ${tz}\`` without validation.
**How to avoid:** Validate the IANA string before use. Recommended: `Intl.supportedValuesOf('timeZone').includes(tz)` (available in Node 18+). Fall back to `'America/Chicago'` on invalid input. [ASSUMED: `Intl.supportedValuesOf` approach — standard Node.js API; verify available in Next.js 16 runtime which uses Node 18+.]
**Warning signs:** Any non-IANA string reaching the Drizzle `sql` template.

---

### Pitfall 3: `ProductionOrder` Type Shape Changes Break Test Fixtures

**What goes wrong:** Adding `earlyDeliveryDate: string | null` to the Drizzle schema (via migration) changes `ProductionOrder`'s `$inferSelect` type. Every test file that uses `makeOrder({...})` will get a TypeScript compile error because the fixture doesn't include `earlyDeliveryDate`.
**Why it happens:** `ProductionOrder = typeof productionOrders.$inferSelect` is a derived type; adding a column to the schema adds it to the type. [VERIFIED: `production-derivations.test.ts`, `MillColumn.test.tsx`, and 15+ other test files use `makeOrder` with a `Partial<ProductionOrder>` spread — adding a required field propagates immediately.]
**How to avoid:** After adding the column, update the `makeOrder` fixture in EACH test file to include `earlyDeliveryDate: null`. TypeScript will surface all affected files as compile errors — follow the error chain.
**Warning signs:** `tsc --noEmit` errors on fixture shape after schema migration.

---

### Pitfall 4: Suspense Fallbacks Re-showing on Every `router.refresh()`

**What goes wrong:** When `useProductionPolling` fires every 30 seconds, the `<Suspense fallback={<KpiStripSkeleton />}>` boundaries re-show their skeletons briefly during the RSC re-render, creating a "flash of skeleton" UX.
**Why it happens:** React re-mounts Suspense boundaries during async RSC re-render when the parent triggers `router.refresh()`. [VERIFIED: CONTEXT.md build-time risks section mentions this explicitly and suggests `useTransition` + `isPending` dimming as the fix.]
**How to avoid:** On initial ship, accept the behavior. If UAT feedback finds it jarring, wrap the `router.refresh()` call in `startTransition` and use the `isPending` flag to dim existing content instead of showing skeletons (Phase 34 D-23 references this pattern).
**Warning signs:** Operators report KPI values "blinking" every 30 seconds.

---

### Pitfall 5: Date Boundary Off-by-One Across Midnight

**What goes wrong:** An order completed at 11:58 PM Chicago time is attributed to "tomorrow" in UTC (UTC is Chicago + 5h or +6h depending on DST). KPI-01 "tons completed today" shows the wrong total.
**Why it happens:** Without `AT TIME ZONE`, PostgreSQL `date_trunc('day', updatedAt)` truncates in UTC, not local time.
**How to avoid:** Always use `date_trunc('day', updated_at AT TIME ZONE $tz)` and compare against `date_trunc('day', NOW() AT TIME ZONE $tz)`. The `tz` parameter is the IANA string from the cookie. [VERIFIED: CONTEXT.md D-02 SQL skeleton explicitly includes `AT TIME ZONE $tz`.]
**Warning signs:** KPI-01 shows a different total than manually counting today's completed orders in the UI.

---

### Pitfall 6: KPI-03 Uses Stale `orders` Prop After Filter

**What goes wrong:** `ProductionDashboard` applies status + search filters to the `orders` array before passing to `MillColumn`. If the KPI-03 summary is derived from the filtered array, the "4 orders" count reflects only visible orders, not all orders in the column.
**Why it happens:** `filtered` (the filtered subset) is what's passed to `MillColumn.orders` today. [VERIFIED: `ProductionDashboard.tsx` lines 196–204 show `ordersByMill` is derived from `filtered`, not from the raw `orders` array.]
**How to avoid:** Compute KPI-03 column summaries from the UNFILTERED `orders` array. In `ProductionDashboard`, derive column summaries separately: `const allOrdersByMill = { Premix: orders.filter(o => o.millLine === 'Premix'), ... }` and pass `summary` from these unfiltered counts.
**Warning signs:** The "4 orders" header strip count changes when the operator toggles status filter pills.

---

### Pitfall 7: `import.ts` — `earlyDeliveryDate` Not Passed on Overwrite Path

**What goes wrong:** The overwrite path in `commitImportAction` has an explicit `.set({...})` that lists every field to update. If `earlyDeliveryDate` is not added to this `set()` call, re-importing an existing order does not update its early delivery date.
**Why it happens:** The overwrite path uses an explicit field list (not `...row`); new fields must be manually added. [VERIFIED: `import.ts` lines 684–695 show the explicit UPDATE `.set({...})` call — `earlyDeliveryDate` is not currently present.]
**How to avoid:** Add `earlyDeliveryDate: row.earlyDeliveryDate ?? null` to the overwrite `.set({...})` call alongside the insert path.
**Warning signs:** Overwritten orders retain their old `early_delivery_date` value.

---

## Code Examples

### KPI-01/02: Completed Today (verified pattern)

```typescript
// Source: established from Phase 33 orders.ts pattern + Drizzle docs
import { sum, count, eq, sql } from 'drizzle-orm';

// Mill-wide tons completed today
const milWide = await db
  .select({
    totalLbs: sql<string>`COALESCE(${sum(productionOrders.weightLbs)}::text, '0')`,
  })
  .from(productionOrders)
  .where(
    sql`${productionOrders.state} = 'Completed'
    AND date_trunc('day', ${productionOrders.updatedAt} AT TIME ZONE ${tz})
      = date_trunc('day', NOW() AT TIME ZONE ${tz})`
  );

// Per-line breakdown (KPI-02): add groupBy(productionOrders.millLine)
```

### Dwell-time Duration Formatting (pure TS helper)

```typescript
// src/lib/format-dwell.ts — pure helper, TDD-friendly
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

### KpiCard Props (from UI-SPEC)

```typescript
// src/components/KpiCard.tsx
interface KpiCardProps {
  label: string;
  value: string;       // e.g., "18,400 lbs" — formatted by caller
  unit?: string;
  subValue?: string;   // secondary line
  footnote?: string;   // e.g., "Excludes 3 uncategorized orders"
  icon?: LucideIcon;
}
```

### Hand-Rolled SVG Bar Chart (structure)

```tsx
// SevenDayTrendChart.tsx receives { date: string; completedLbs: number }[]
// Empty state: data.length < 7
// SVG viewBox="0 0 420 160", 7 bars at 48px wide + 8px gap
// Bar fill: var(--primary); today's bar at 100% opacity, others at 80%
// X-axis: 3-letter weekday from date string, --fs-11 --text-muted
// No onClick, no tooltips (D-13: static SVG, aria-hidden, wrapper has role="img")
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Demo-era `KPICard.tsx` with hardcoded mock data | DB-backed `KpiCard.tsx` on `Card` primitive with server-aggregated values | Phase 35 | Eliminates static mock; requires deletion of old component |
| Client-side weight sum (`computeColumnWeights` in client) | KPI-01/02 sums in SQL server-side | Phase 35 | Correct decimal arithmetic; no `numeric` → JS string bug risk |
| No `early_delivery_date` column | Nullable `date` column on `production_orders` | Phase 35 | KPI-08 overdue badge becomes possible; import path extended |
| No timezone-aware KPIs | `AT TIME ZONE` in all daily aggregations | Phase 35 | Operators in different timezones see their own local "today" |

**Deprecated/outdated:**
- `src/components/KPICard.tsx`: deleted in Phase 35. No importers confirmed by grep.
- `computeColumnWeights` in `production-derivations.ts`: still used for `MillColumn` UI rendering (not deprecated), but KPI-01/02 aggregations do NOT reuse it — SQL aggregation is the correct approach for daily-filtered totals.

---

## Runtime State Inventory

> Phase 35 adds a new database column and modifies seed data. This is not a rename/refactor phase, but there are runtime state items to address.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | `production_orders` table — 33 rows in dev DB have no `early_delivery_date` column | Drizzle migration adds nullable column (no data migration needed for existing rows; they get NULL) |
| Stored data | `seed-data.json` — 33 rows have no `early_delivery_date` field | `seed.ts` runtime computes dates at seed time; `seed-data.json` may not need to change (Option B) |
| Live service config | None — no external service registrations affected | — |
| OS-registered state | None | — |
| Secrets/env vars | `DATABASE_URL_UNPOOLED` required for `drizzle-kit migrate`; no new secrets needed | — |
| Build artifacts | `drizzle/0001_*.sql` migration file generated by `drizzle-kit generate` | Apply via `drizzle-kit migrate` against dev Neon DB before implementation begins |

**Nothing found in categories:** OS-registered state (None — no pm2/launchd/Task Scheduler entries), Secrets (None new), Build artifacts other than migration (None).

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Seed backfill strategy: compute `earlyDeliveryDate` at seed runtime in `seed.ts` (not as static JSON values) | Pattern 8 | If JSON convention is required, dates become immediately stale; low risk — Option B is more correct |
| A2 | IANA timezone validation via `Intl.supportedValuesOf('timeZone')` available in Node 18+ (Next.js 16 runtime) | Pitfall 2 | If unavailable, use a regex fallback — medium risk |
| A3 | KPI-03 column summary computed client-side from unfiltered `orders` prop (not a separate DB query) | Pattern 10 | If server-side is required, adds a 4th KPI query — low risk either way |
| A4 | SQL `EXTRACT(EPOCH FROM interval)` used to convert dwell interval to seconds for TS formatting | Pattern 3 | If not available in Drizzle's type system, use `sql<number>` cast — low risk |
| A5 | `NULLIF(COUNT(*) FILTER (WHERE bucket IS NOT NULL), 0)` produces NULL (not error) when all orders are uncategorized — UI maps NULL to `0%` | Pattern 2 | Standard SQL; risk is very low |
| A6 | The `early_delivery_date` in `import.ts` uses the same `dateToIsoString(raw.deliveryDate)` as `deliveryTime` — same source date, two destinations | Pattern 7 | Confirmed by reading `import.ts` lines 87–96 and 225; essentially VERIFIED |

**VERIFIED claims (not assumed):**
- Book1.xlsx column header is "Early Delivery Date" (confirmed in `import.ts` xlsxSchema)
- `date()` without mode infers as `string | null` in Drizzle (confirmed via node inspection)
- `KPICard.tsx` has no other importers (confirmed via grep)
- `drizzle-orm` exports `count`, `sum`, `avg`, `max`, `min` (confirmed via node)
- Migration journal has only one entry (`0000_*`), so Phase 35 generates `0001_*`
- No chart libraries installed (confirmed via package.json grep)
- `Intl.DateTimeFormat().resolvedOptions().timeZone` is the correct browser API for reading the IANA timezone
- `updatedAt` (not `createdAt`) is the correct column for "completed today" queries — orders transition to Completed state via `transitionToMixing`/`completeOrder` actions that trigger `updatedAt.$onUpdate`

---

## Open Questions

1. **Option A vs. Option B for seed `early_delivery_date` injection**
   - What we know: `seed.ts` maps `seed-data.json` rows via `SnakeRow` type; the script can compute values at runtime.
   - What's unclear: Whether to add static dates to `seed-data.json` (violates the "today ±5 days" requirement since dates go stale) or compute at runtime in `seed.ts` (cleaner).
   - Recommendation: **Option B** — runtime computation in `seed.ts`. Add the `earlyDeliveryDate` computation inline in the `rows.map()` call; do not modify `seed-data.json`.

2. **KPI-03 server-side vs. client-side computation**
   - What we know: The full `orders` array is already fetched and available in `ProductionDashboard`; `computeColumnWeights` already does the weight math.
   - What's unclear: Whether the planner wants a pure server-side aggregation (consistent with KPI-01/02) or accepts a client-side derivation from the existing `orders` prop.
   - Recommendation: Compute KPI-03 client-side from the unfiltered `orders` array. This avoids a 5th DB query for data already in memory and is logically sound (KPI-03 is not time-windowed like KPI-01/02 — it shows ALL orders in the column regardless of date).

3. **`tz` cookie SameSite + Secure settings**
   - What we know: The cookie is non-sensitive (just an IANA timezone string); non-HTTPOnly is intentional so the client writes it.
   - What's unclear: Whether `Secure` should be set in production (blocks cookie on HTTP).
   - Recommendation: Include `Secure` in production via `; Secure` conditional on `window.location.protocol === 'https:'`, or simply include it always — Vercel serves over HTTPS so `Secure` is always safe.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `drizzle-kit` CLI | Generate + apply migration | ✓ | 0.31.10 | — |
| `DATABASE_URL_UNPOOLED` | `drizzle-kit migrate` | ✓ (verified in drizzle.config.ts) | — | Cannot migrate without it |
| Node.js `Intl.supportedValuesOf` | IANA TZ validation | ✓ (Node 24.1.0 detected) | Node 24.1.0 | Regex fallback `^[A-Za-z_/]+$` |
| Neon dev database | All queries | ✓ (dev DB seeded in Phase 32/33) | — | — |

**Missing dependencies with no fallback:** None.

**Missing dependencies with fallback:** None.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest 30 + `@testing-library/react` 16 |
| Config file | `jest.config.ts` (root) |
| Quick run command | `npm test -- --testPathPattern=kpis` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| KPI-01 | `getKpiCompletedToday` sums completed-weight for today in the correct timezone | unit | `npm test -- --testPathPattern=kpis` | ❌ Wave 0 |
| KPI-02 | Per-line breakdown returns 3 rows (one per mill line) with correct weights | unit | `npm test -- --testPathPattern=kpis` | ❌ Wave 0 |
| KPI-03 | `MillColumn` header renders `{N} orders — {completed} / {total} lbs` format | unit (RTL) | `npm test -- --testPathPattern=MillColumn` | ❌ Wave 0 (extend existing) |
| KPI-04 | Pending backlog count and total weight returned correctly | unit | `npm test -- --testPathPattern=kpis` | ❌ Wave 0 |
| KPI-05 | `bucketTexture()` maps all 5 known texture values + NULL correctly | unit | `npm test -- --testPathPattern=formula-mix` | ❌ Wave 0 |
| KPI-05 | SQL CASE and `bucketTexture()` agree on all known values | unit | `npm test -- --testPathPattern=formula-mix` | ❌ Wave 0 |
| KPI-05 | `getKpiFormulaMix` excludes NULL texture from numerator AND denominator | unit | `npm test -- --testPathPattern=kpis` | ❌ Wave 0 |
| KPI-06 | `SevenDayTrendChart` renders empty state when `data.length < 7` | unit (RTL) | `npm test -- --testPathPattern=SevenDayTrendChart` | ❌ Wave 0 |
| KPI-06 | `SevenDayTrendChart` renders 7 bars when `data.length === 7` | unit (RTL) | `npm test -- --testPathPattern=SevenDayTrendChart` | ❌ Wave 0 |
| KPI-07 | `BlockedExceptionList` renders "No blocked orders" empty state | unit (RTL) | `npm test -- --testPathPattern=BlockedExceptionList` | ❌ Wave 0 |
| KPI-07 | `BlockedExceptionList` rows sorted by dwell time descending | unit (RTL) | `npm test -- --testPathPattern=BlockedExceptionList` | ❌ Wave 0 |
| KPI-07 | `formatDwell` formats durations correctly (< 1h, 1–24h, 24h+) | unit | `npm test -- --testPathPattern=format-dwell` | ❌ Wave 0 |
| KPI-08 | Overdue badge renders only when `earlyDeliveryDate < today AND state != 'Completed'` | unit (RTL) | `npm test -- --testPathPattern=BlockedExceptionList` | ❌ Wave 0 |
| KPI-08 | `earlyDeliveryDate` schema column is nullable date in `production_orders` | schema-assert | `npm test -- --testPathPattern=orders.test` | ❌ Wave 0 (extend existing) |

### TDD Candidates

The following are PRIME `type: tdd` candidates (pure server-side aggregation with defined I/O):

1. **`src/lib/formula-mix.ts` — `bucketTexture()`** — pure function with 5 known inputs + NULL → 3 bucket outputs. Perfect for RED → GREEN → REFACTOR. Write all test cases first.
2. **`src/lib/format-dwell.ts` — `formatDwell(epochSeconds)`** — pure function, well-defined I/O, 3 format cases.
3. **`src/db/queries/kpis.ts` — all KPI aggregation queries** — mock the `db` object (same pattern as `orders.test.ts`); assert: (a) correct SQL structure, (b) correct `unstable_cache` tag `'production-orders'`, (c) COALESCE zero-handling, (d) correct timezone parameter threading.
4. **`src/db/schema/orders.ts` — `earlyDeliveryDate` column** — extend existing schema test to assert the column exists, is nullable, and has `PgDateString` column type.

**NOT TDD candidates (execute type):**
- `KpiCard.tsx` — pure presentational component; test with RTL smoke tests
- `KpiStrip.tsx` — layout composition; RTL snapshot is sufficient
- `SevenDayTrendChart.tsx` — RTL tests for empty state and bar count; SVG geometry is tested visually
- `TzBootstrap.tsx` — writes a cookie; JSDOM cookie API is testable but low-value; skip or mock

### Sampling Rate

- **Per task commit:** `npm test -- --testPathPattern=kpis|formula-mix|format-dwell`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/db/queries/__tests__/kpis.test.ts` — covers KPI-01, KPI-02, KPI-04, KPI-05, KPI-06, KPI-07 query contracts
- [ ] `src/lib/__tests__/formula-mix.test.ts` — covers `bucketTexture()` all known + unknown + NULL inputs
- [ ] `src/lib/__tests__/format-dwell.test.ts` — covers `formatDwell()` edge cases
- [ ] `src/components/SevenDayTrendChart.test.tsx` — covers empty state + 7-bar render
- [ ] `src/components/BlockedExceptionList.test.tsx` — covers empty state, row render, overdue badge
- [ ] Extend `src/db/schema/__tests__/orders.test.ts` — add `earlyDeliveryDate` column assertion
- [ ] Extend `src/components/MillColumn.test.tsx` — add `summary` prop + header strip assertions

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | KPIs are read-only; page-level auth already enforced in `page.tsx` (Phase 31/34) |
| V3 Session Management | No | No new session management; cookies() for tz only |
| V4 Access Control | No | D-17: all authenticated users see KPIs; no role gate |
| V5 Input Validation | Yes | IANA timezone string from `tz` cookie must be validated before SQL composition |
| V6 Cryptography | No | No cryptographic operations |

### Known Threat Patterns for this Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Cookie-injected SQL via `tz` value | Tampering | Validate IANA string via `Intl.supportedValuesOf('timeZone')` before composing into `sql\`\`` |
| `numeric` string arithmetic in JS | Tampering (silent data corruption) | Use SQL `SUM()`, never JS `+` or `reduce` on raw `weightLbs` strings |
| KPI surfaces expose aggregate counts | Information Disclosure | Acceptable — any authenticated user is authorized to see mill-wide KPIs per D-17 |

---

## Sources

### Primary (HIGH confidence)

- `src/db/schema/orders.ts` — column shapes, `ProductionOrder.$inferSelect`, `numeric` → `string` boundary contract
- `src/db/schema/events.ts` — `changedAt` timestamp, `toState` enum, composite index
- `src/db/queries/orders.ts` — canonical `unstable_cache` + `tags: ['production-orders']` pattern
- `src/db/queries/events.ts` — demonstrates cache key vs. tag split (`['order-events']` key, `'production-orders'` tag)
- `src/actions/import.ts` — xlsxSchema confirms "Early Delivery Date" column; `dateToIsoString()` confirmed implementation
- `src/actions/import-schema.ts` — current `productionOrderImportSchema` shape; confirmed `earlyDeliveryDate` absent
- `src/components/ProductionDashboard.tsx` — current prop shape, filter flow, Suspense boundaries
- `src/components/MillColumn.tsx` — current header rendering lines 112–118; `computeColumnWeights` usage
- `src/db/seed.ts` — `SnakeRow` type; TRUNCATE discipline; runtime transform pattern
- `src/db/seed-data.json` — 33 rows confirmed, no `early_delivery_date` key
- `src/app/page.tsx` — `force-dynamic`, `Promise.all` fan-out, `cookies()` not yet used
- `src/app/layout.tsx` — `ClerkProvider → ThemeProvider → NuqsAdapter` — `TzBootstrap` placement target
- `drizzle/0000_aromatic_stone_men.sql` — confirms `early_delivery_date` absent from current schema
- `drizzle/meta/_journal.json` — confirms one existing migration; Phase 35 generates `0001_*`
- `drizzle.config.ts` — `out: './drizzle'`, `DATABASE_URL_UNPOOLED` requirement confirmed
- `package.json` — no chart libraries; exact versions of all relevant deps confirmed
- `jest.config.ts` — `testEnvironment: 'jsdom'`, `moduleNameMapper: @/*`, `transformIgnorePatterns`
- `.planning/phases/35-kpi-sections-and-role-specific-metrics/35-CONTEXT.md` — all locked decisions D-01 through D-17
- `.planning/phases/35-kpi-sections-and-role-specific-metrics/35-UI-SPEC.md` — component visual contract, layout decisions
- `node -e ...` runtime verification of `drizzle-orm/pg-core` `date()` column type inference
- `node -e ...` runtime verification of `drizzle-orm` `count`, `sum` exports

### Secondary (MEDIUM confidence)

- Postgres `AT TIME ZONE` semantics (referenced from CONTEXT.md canonical refs; standard SQL behavior)
- Drizzle ORM `sql` template literal for arbitrary SQL fragments (verified from existing `import.ts` usage of `sql\`version + 1\``)

### Tertiary (LOW confidence / ASSUMED)

- A1: Seed Option B (runtime computation) is the right approach — planner may choose Option A
- A2: `Intl.supportedValuesOf('timeZone')` as the IANA validation method
- A3: KPI-03 computed client-side from `orders` prop rather than a separate server query
- A4: `EXTRACT(EPOCH FROM interval)` for dwell-time conversion

---

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH — all packages are already installed; no new deps
- Architecture: HIGH — verified against all existing code patterns
- KPI Aggregation SQL: HIGH — Drizzle aggregation helpers verified in node; pattern mirrors existing `orders.ts`
- Pitfalls: HIGH — most derived from reading existing code contracts and build-time risk notes in CONTEXT.md
- Seed Backfill: MEDIUM — Option B recommendation is sound but planner has final say
- Timezone IANA validation: MEDIUM — approach is standard but untested in this specific runtime

**Research date:** 2026-05-14
**Valid until:** 2026-06-14 (stable stack; 30-day window)
