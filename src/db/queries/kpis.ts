import 'server-only';
import { unstable_cache } from 'next/cache';
import { db } from '@/db';
import { productionOrders } from '@/db/schema/orders';
import { orderEvents } from '@/db/schema/events';
import { sql, sum, count, eq, and } from 'drizzle-orm';
import { sanitizeIanaTimezone } from '@/lib/timezone';
import { formatDwell } from '@/lib/format-dwell';
import type { MillLine } from '@/db/schema/orders';

/**
 * KPI aggregation query layer.
 *
 * Server-only: import 'server-only' on line 1 causes a build-time error if any
 * client component tries to import from this file (T-35-04-06 mitigation).
 *
 * D-14: All three exported queries use tags: ['production-orders'] so they
 * invalidate alongside getProductionOrders / getOrderEvents when any mutating
 * action calls revalidateTag('production-orders'). No new tag is introduced.
 *
 * Pitfall 2 mitigation: every tz-accepting query calls sanitizeIanaTimezone()
 * BEFORE any sql`` AT TIME ZONE interpolation. The IANA string from the cookie
 * is operator-controlled; the allowlist check is the only SQL-injection barrier.
 *
 * Pitfall 1 mitigation: every sum() is wrapped in COALESCE(..., '0') so that
 * an empty result set returns '0' instead of null.
 *
 * Pitfall 5 mitigation: every "today" query uses date_trunc('day', ... AT TIME
 * ZONE $tz) on BOTH SIDES of the date comparison.
 *
 * D-12 mitigation: KPI-05 formula-mix percentages use NULLIF for the denominator
 * so that zero categorized completions returns null (not division-by-zero) — the
 * UI maps null to "—" or "0%" as appropriate.
 *
 * Anti-pattern (RESEARCH.md): the bucketTexture helper from @/lib/formula-mix is
 * NOT called from this server-query code. The SQL CASE expression and the JS helper
 * are parallel implementations. Their agreement is enforced by Test 13 in
 * src/db/queries/__tests__/kpis.test.ts.
 */

// ─── Exported payload types ───────────────────────────────────────────────────
// These types are the contract consumed by Plans 35-05 / 35-06 / 35-07.

export type KpiStripData = {
  /** KPI-01: mill-wide tons completed today (formatted string preserves numeric precision) */
  completedTodayLbs: string;
  /** KPI-02: per-line tons completed today */
  premixLbs: string;
  excelLbs: string;
  cgmLbs: string;
  /** KPI-04: pending backlog */
  pendingCount: number;
  pendingLbs: string;
  /**
   * KPI-05: formula mix percentages over today's Completed (uncategorized excluded).
   * null when denominator = 0 (no categorized completions today).
   */
  pelletPct: number | null;
  mashPct: number | null;
  crumblePct: number | null;
  uncategorizedCount: number;
};

export type TrendDay = {
  /** YYYY-MM-DD from date_trunc::date */
  date: string;
  /** SUM(weightLbs) as float — server-side cast so UI receives number not string */
  completedLbs: number;
};

export type BlockedOrderWithDwell = {
  orderId: string;
  orderNumber: string;
  customer: string;
  millLine: 'Premix' | 'Excel' | 'CGM';
  /** EXTRACT(EPOCH FROM ...) — raw for sort/test stability */
  dwellSeconds: number;
  /** server-side formatDwell(dwellSeconds) — Plan 35-03 helper */
  dwellFormatted: string;
  earlyDeliveryDate: string | null;
  /**
   * KPI-08: earlyDeliveryDate IS NOT NULL AND earlyDeliveryDate < CURRENT_DATE AND state <> 'Completed'.
   * Computed server-side via SQL; JS layer defensively checks null earlyDeliveryDate.
   */
  isOverdue: boolean;
};

// ─── KPI-01 / KPI-02 / KPI-04 / KPI-05: getKpiStrip ──────────────────────────

/**
 * Fetch KPI-01 (mill-wide tons today), KPI-02 (per-line tons today),
 * KPI-04 (pending backlog), and KPI-05 (formula-mix percentages today)
 * in one cached payload.
 *
 * Cache key: ['kpi-strip'] — unique per query function.
 * Cache tag: ['production-orders'] — D-14, shared with all other queries.
 */
export const getKpiStrip = unstable_cache(
  async (rawTz: string): Promise<KpiStripData> => {
    // Pitfall 2: sanitize the IANA string from the cookie before ANY SQL composition.
    const tz = sanitizeIanaTimezone(rawTz);

    // KPI-01: mill-wide sum of completed weight for today (tz-aware boundary).
    // Pitfall 5: BOTH SIDES of the date comparison use AT TIME ZONE $tz.
    const millWideResult = await db
      .select({
        totalLbs: sql<string>`COALESCE(${sum(productionOrders.weightLbs)}::text, '0')`,
      })
      .from(productionOrders)
      .where(
        sql`${productionOrders.state} = 'Completed'
        AND date_trunc('day', ${productionOrders.updatedAt} AT TIME ZONE ${tz})
          = date_trunc('day', NOW() AT TIME ZONE ${tz})`
      );

    const completedTodayLbs = millWideResult[0]?.totalLbs ?? '0';

    // KPI-02: per-line breakdown, grouped by mill_line.
    // Same date filter as KPI-01 + GROUP BY millLine.
    const perLineResult = await db
      .select({
        millLine: productionOrders.millLine,
        lbs: sql<string>`COALESCE(${sum(productionOrders.weightLbs)}::text, '0')`,
      })
      .from(productionOrders)
      .where(
        sql`${productionOrders.state} = 'Completed'
        AND date_trunc('day', ${productionOrders.updatedAt} AT TIME ZONE ${tz})
          = date_trunc('day', NOW() AT TIME ZONE ${tz})`
      )
      .groupBy(productionOrders.millLine);

    // Default-fill all three lines with '0' (Test 8: missing line → '0', not undefined).
    const perLine: Record<MillLine, string> = { Premix: '0', Excel: '0', CGM: '0' };
    for (const row of perLineResult) {
      perLine[row.millLine as MillLine] = row.lbs;
    }
    const premixLbs = perLine['Premix'];
    const excelLbs = perLine['Excel'];
    const cgmLbs = perLine['CGM'];

    // KPI-04: pending backlog — all pending orders (no date filter).
    const pendingResult = await db
      .select({
        cnt: sql<number>`COUNT(*)::int`,
        totalLbs: sql<string>`COALESCE(${sum(productionOrders.weightLbs)}::text, '0')`,
      })
      .from(productionOrders)
      .where(sql`${productionOrders.state} = 'Pending'`);

    const pendingCount = pendingResult[0]?.cnt ?? 0;
    const pendingLbs = pendingResult[0]?.totalLbs ?? '0';

    // KPI-05: formula-mix percentages for today's Completed orders.
    // D-11: SQL CASE expression mirrors the bucketTexture helper — agreement enforced by Test 13.
    // D-12: NULL and unrecognized textures excluded from numerator AND denominator.
    // Inline-comment each WHEN line for PR reviewers and for Test 13's parseable structure.
    const formulaMixResult = await db
      .select({
        pelletPct: sql<number | null>`
          ROUND(
            COUNT(*) FILTER (WHERE (
              CASE ${productionOrders.textureType}
                WHEN 'PELLET'     THEN 'Pellet'   -- → 'Pellet'
                WHEN 'SH PELLET'  THEN 'Pellet'   -- → 'Pellet'
                WHEN 'MASH'       THEN 'Mash'     -- → 'Mash'
                WHEN 'FINE CR'    THEN 'Crumble'  -- → 'Crumble'
                WHEN 'C. CRUMBLE' THEN 'Crumble'  -- → 'Crumble'
                ELSE NULL
              END
            ) = 'Pellet') * 100.0
            / NULLIF(
                COUNT(*) FILTER (WHERE (
                  CASE ${productionOrders.textureType}
                    WHEN 'PELLET'     THEN 'Pellet'
                    WHEN 'SH PELLET'  THEN 'Pellet'
                    WHEN 'MASH'       THEN 'Mash'
                    WHEN 'FINE CR'    THEN 'Crumble'
                    WHEN 'C. CRUMBLE' THEN 'Crumble'
                    ELSE NULL
                  END
                ) IS NOT NULL),
              0
            ),
            1
          )
        `,
        mashPct: sql<number | null>`
          ROUND(
            COUNT(*) FILTER (WHERE (
              CASE ${productionOrders.textureType}
                WHEN 'PELLET'     THEN 'Pellet'
                WHEN 'SH PELLET'  THEN 'Pellet'
                WHEN 'MASH'       THEN 'Mash'
                WHEN 'FINE CR'    THEN 'Crumble'
                WHEN 'C. CRUMBLE' THEN 'Crumble'
                ELSE NULL
              END
            ) = 'Mash') * 100.0
            / NULLIF(
                COUNT(*) FILTER (WHERE (
                  CASE ${productionOrders.textureType}
                    WHEN 'PELLET'     THEN 'Pellet'
                    WHEN 'SH PELLET'  THEN 'Pellet'
                    WHEN 'MASH'       THEN 'Mash'
                    WHEN 'FINE CR'    THEN 'Crumble'
                    WHEN 'C. CRUMBLE' THEN 'Crumble'
                    ELSE NULL
                  END
                ) IS NOT NULL),
              0
            ),
            1
          )
        `,
        crumblePct: sql<number | null>`
          ROUND(
            COUNT(*) FILTER (WHERE (
              CASE ${productionOrders.textureType}
                WHEN 'PELLET'     THEN 'Pellet'
                WHEN 'SH PELLET'  THEN 'Pellet'
                WHEN 'MASH'       THEN 'Mash'
                WHEN 'FINE CR'    THEN 'Crumble'
                WHEN 'C. CRUMBLE' THEN 'Crumble'
                ELSE NULL
              END
            ) = 'Crumble') * 100.0
            / NULLIF(
                COUNT(*) FILTER (WHERE (
                  CASE ${productionOrders.textureType}
                    WHEN 'PELLET'     THEN 'Pellet'
                    WHEN 'SH PELLET'  THEN 'Pellet'
                    WHEN 'MASH'       THEN 'Mash'
                    WHEN 'FINE CR'    THEN 'Crumble'
                    WHEN 'C. CRUMBLE' THEN 'Crumble'
                    ELSE NULL
                  END
                ) IS NOT NULL),
              0
            ),
            1
          )
        `,
        uncategorizedCount: sql<number>`
          COUNT(*) FILTER (WHERE (
            CASE ${productionOrders.textureType}
              WHEN 'PELLET'     THEN 'Pellet'
              WHEN 'SH PELLET'  THEN 'Pellet'
              WHEN 'MASH'       THEN 'Mash'
              WHEN 'FINE CR'    THEN 'Crumble'
              WHEN 'C. CRUMBLE' THEN 'Crumble'
              ELSE NULL
            END
          ) IS NULL)::int
        `,
      })
      .from(productionOrders)
      .where(
        sql`${productionOrders.state} = 'Completed'
        AND date_trunc('day', ${productionOrders.updatedAt} AT TIME ZONE ${tz})
          = date_trunc('day', NOW() AT TIME ZONE ${tz})`
      );

    const fmRow = formulaMixResult[0];
    const pelletPct = fmRow?.pelletPct ?? null;
    const mashPct = fmRow?.mashPct ?? null;
    const crumblePct = fmRow?.crumblePct ?? null;
    const uncategorizedCount = fmRow?.uncategorizedCount ?? 0;

    return {
      completedTodayLbs,
      premixLbs,
      excelLbs,
      cgmLbs,
      pendingCount,
      pendingLbs,
      pelletPct,
      mashPct,
      crumblePct,
      uncategorizedCount,
    };
  },
  ['kpi-strip'],
  { tags: ['production-orders'] }
);

// ─── KPI-06: getSevenDayTrend ─────────────────────────────────────────────────

/**
 * Fetch 7-day daily volume trend for completed orders.
 * Returns 0..7 TrendDay rows ordered oldest-first.
 *
 * The UI renders empty state when data.length < 7 (D-13).
 * No server-side zero-fill — the component handles missing days.
 *
 * Cache key: ['kpi-seven-day-trend'] — unique per query function.
 * Cache tag: ['production-orders'] — D-14.
 */
export const getSevenDayTrend = unstable_cache(
  async (rawTz: string): Promise<TrendDay[]> => {
    // Pitfall 2: sanitize before SQL composition.
    const tz = sanitizeIanaTimezone(rawTz);

    // Pattern 4 (RESEARCH.md): 7-day window using AT TIME ZONE on both sides.
    // Pitfall 5: INTERVAL '6 days' subtracted from the tz-aware "today" boundary.
    // Drizzle's sql template interpolates `${productionOrders.updatedAt}` as a
    // bare `"updated_at"` inside SELECT alias expressions but as a fully-qualified
    // `"production_orders"."updated_at"` inside WHERE/GROUP BY/ORDER BY. Postgres
    // treats those as different expressions for GROUP BY purposes (42803). Inline
    // the qualified reference everywhere so all four occurrences are byte-identical.
    const rows = await db
      .select({
        date: sql<string>`date_trunc('day', "production_orders"."updated_at" AT TIME ZONE ${tz})::date::text`,
        completedLbs: sql<number>`COALESCE(${sum(productionOrders.weightLbs)}, '0')::float8`,
      })
      .from(productionOrders)
      .where(
        sql`${productionOrders.state} = 'Completed'
        AND "production_orders"."updated_at" AT TIME ZONE ${tz}
          >= date_trunc('day', NOW() AT TIME ZONE ${tz}) - INTERVAL '6 days'`
      )
      .groupBy(sql`date_trunc('day', "production_orders"."updated_at" AT TIME ZONE ${tz})::date::text`)
      .orderBy(sql`date_trunc('day', "production_orders"."updated_at" AT TIME ZONE ${tz})::date::text ASC`);

    return rows.map((r) => ({
      date: r.date,
      completedLbs: typeof r.completedLbs === 'string' ? parseFloat(r.completedLbs) : r.completedLbs,
    }));
  },
  ['kpi-seven-day-trend'],
  { tags: ['production-orders'] }
);

// ─── KPI-07 + KPI-08: getBlockedWithDwell ────────────────────────────────────

/**
 * Fetch blocked orders with dwell time (KPI-07) and overdue flag (KPI-08).
 *
 * D-03: Dwell time = NOW() - MAX(changed_at) for the most-recent Block event.
 * Resets on Resume → re-Block (only the latest Block event drives MAX).
 *
 * No tz parameter — dwell is wallclock-relative (a duration, not a calendar date).
 *
 * KPI-08: isOverdue computed server-side via early_delivery_date < CURRENT_DATE.
 * UI cannot upgrade a non-overdue row to overdue (T-35-04-09 mitigation).
 *
 * Cache key: ['kpi-blocked-dwell'] — unique per query function.
 * Cache tag: ['production-orders'] — D-14.
 */
export const getBlockedWithDwell = unstable_cache(
  async (): Promise<BlockedOrderWithDwell[]> => {
    // Pattern 3 (RESEARCH.md + PATTERNS.md): JOIN order_events with production_orders.
    // Filter: BOTH event.toState = 'Blocked' AND order.state = 'Blocked' (D-03).
    // ORDER BY MAX(changedAt) ASC — oldest block = longest dwell = first row.
    const rows = await db
      .select({
        orderId: orderEvents.orderId,
        orderNumber: productionOrders.orderNumber,
        customer: productionOrders.customer,
        millLine: productionOrders.millLine,
        earlyDeliveryDate: productionOrders.earlyDeliveryDate,
        dwellSeconds: sql<number>`EXTRACT(EPOCH FROM (NOW() - MAX(${orderEvents.changedAt})))`,
        // KPI-08: early_delivery_date < CURRENT_DATE computed server-side by Postgres.
        // Returns null when earlyDeliveryDate IS NULL (JS layer defensively checks).
        isOverdue: sql<boolean | null>`
          CASE
            WHEN ${productionOrders.earlyDeliveryDate} IS NULL THEN NULL
            ELSE (${productionOrders.earlyDeliveryDate} < CURRENT_DATE)
          END
        `,
      })
      .from(orderEvents)
      .innerJoin(productionOrders, eq(orderEvents.orderId, productionOrders.id))
      .where(
        and(
          eq(orderEvents.toState, 'Blocked'),
          eq(productionOrders.state, 'Blocked') // only CURRENTLY blocked orders (D-03)
        )
      )
      .groupBy(
        orderEvents.orderId,
        productionOrders.orderNumber,
        productionOrders.customer,
        productionOrders.millLine,
        productionOrders.earlyDeliveryDate
      )
      .orderBy(sql`MAX(${orderEvents.changedAt}) ASC`); // oldest block = longest dwell first

    return rows.map((row) => {
      const dwellSeconds = typeof row.dwellSeconds === 'string'
        ? parseFloat(row.dwellSeconds)
        : row.dwellSeconds ?? 0;

      // Defensive JS-side double-guard: isOverdue from Postgres may be null when
      // earlyDeliveryDate IS NULL (the CASE returns NULL). Treat null as false.
      const isOverdue = row.earlyDeliveryDate !== null && row.isOverdue === true;

      return {
        orderId: row.orderId,
        orderNumber: row.orderNumber,
        customer: row.customer,
        millLine: row.millLine as 'Premix' | 'Excel' | 'CGM',
        dwellSeconds,
        dwellFormatted: formatDwell(dwellSeconds),
        earlyDeliveryDate: row.earlyDeliveryDate ?? null,
        isOverdue,
      };
    });
  },
  ['kpi-blocked-dwell'],
  { tags: ['production-orders'] }
);
