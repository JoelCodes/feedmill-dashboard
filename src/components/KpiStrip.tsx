'use client';

/**
 * KpiStrip — horizontal strip of 6 KpiCard instances for the dashboard top zone.
 *
 * D-07: Zone 1 — above filter pills.
 * Consumes KpiStripData from Plan 35-04's getKpiStrip() query.
 *
 * 'use client' directive: lucide-react icons import cleanly; allows future
 * hover/scroll-snap UX without refactor (per PLAN.md interfaces section).
 *
 * Number formatting lives HERE, not in KpiCard — KpiCard is dumb-component
 * (no business logic). KpiStrip is the formatting boundary.
 *
 * KPI-05 dominant-bucket selection: pure helper formulaMixDisplay() returns
 * { value, subValue, footnote } for the Formula Mix card. Null percentages
 * (no categorized completions today — D-12 NULLIF case) render as em dash "—".
 *
 * Also exports KpiStripSkeleton — 6 animate-pulse placeholders for Suspense fallback.
 */

import { Wheat, ClipboardList, Activity } from 'lucide-react';
import KpiCard from '@/components/KpiCard';
import type { KpiStripData } from '@/db/queries/kpis';

// ─── Number formatting helper ─────────────────────────────────────────────────

/** Format a raw weight string (e.g., "18400") into "18,400 lbs". */
function fmtLbs(raw: string): string {
  return Intl.NumberFormat('en-US').format(parseFloat(raw || '0')) + ' lbs';
}

// ─── KPI-05 formula mix helper ────────────────────────────────────────────────

interface FormulaDisplay {
  value: string;
  subValue: string | undefined;
  footnote: string | undefined;
}

/**
 * Derive the Formula Mix card content from KpiStripData.
 *
 * Logic:
 *  - All three pcts null → em dash "—" (no categorized completions today — D-12).
 *  - Otherwise: sort [Pellet, Mash, Crumble] by pct desc; dominant = value;
 *    remaining two = subValue separated by " · ".
 *  - footnote: "Excludes N uncategorized orders" when uncategorizedCount > 0.
 *
 * Deviation from UI-SPEC: null-pct empty state returns "—" (em dash).
 * UI-SPEC does not explicitly define this case; em dash is the standard
 * "no data" treatment used elsewhere in the dashboard. Documented in SUMMARY.
 */
function formulaMixDisplay(p: KpiStripData): FormulaDisplay {
  // Null state: all three pcts null means no categorized completions today
  if (p.pelletPct === null && p.mashPct === null && p.crumblePct === null) {
    return { value: '—', subValue: undefined, footnote: undefined };
  }

  const entries: [string, number][] = [
    ['Pellet', p.pelletPct ?? 0],
    ['Mash', p.mashPct ?? 0],
    ['Crumble', p.crumblePct ?? 0],
  ];

  // Sort descending by percentage — dominant bucket first
  entries.sort((a, b) => b[1] - a[1]);

  const [topName, topPct] = entries[0];
  const value = `${Math.round(topPct)}% ${topName}`;

  // Remaining two buckets as subValue
  const subValue = entries
    .slice(1)
    .map(([name, pct]) => `${Math.round(pct)}% ${name}`)
    .join(' · ');

  // D-12 footnote: only when uncategorized orders exist
  const footnote =
    p.uncategorizedCount > 0
      ? `Excludes ${p.uncategorizedCount} uncategorized orders`
      : undefined;

  return { value, subValue, footnote };
}

// ─── KpiStrip ─────────────────────────────────────────────────────────────────

export default function KpiStrip({ kpis }: { kpis: KpiStripData }) {
  const mix = formulaMixDisplay(kpis);

  return (
    <div
      className="flex flex-row gap-4 w-full overflow-x-auto pb-1"
      aria-label="KPI summary strip"
    >
      <KpiCard label="Completed Today" value={fmtLbs(kpis.completedTodayLbs)} icon={Wheat} />
      <KpiCard label="Premix Today"    value={fmtLbs(kpis.premixLbs)} />
      <KpiCard label="Excel Today"     value={fmtLbs(kpis.excelLbs)} />
      <KpiCard label="CGM Today"       value={fmtLbs(kpis.cgmLbs)} />
      <KpiCard
        label="Pending Backlog"
        value={`${kpis.pendingCount} orders`}
        subValue={`${Intl.NumberFormat('en-US').format(parseFloat(kpis.pendingLbs || '0'))} lbs total`}
        icon={ClipboardList}
      />
      <KpiCard
        label="Formula Mix"
        value={mix.value}
        subValue={mix.subValue}
        footnote={mix.footnote}
        icon={Activity}
      />
    </div>
  );
}

// ─── KpiStripSkeleton ─────────────────────────────────────────────────────────

/**
 * KpiStripSkeleton — Suspense fallback for KpiStrip.
 *
 * Matches the ColumnSkeleton animate-pulse pattern (Phase 34).
 * 6 horizontal placeholders: h-[88px] w-[140px] per UI-SPEC.
 */
export function KpiStripSkeleton() {
  return (
    <div className="flex flex-row gap-4 w-full" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-[88px] w-[140px] flex-shrink-0 animate-pulse rounded-[var(--radius-lg)] bg-[var(--divider)]"
        />
      ))}
    </div>
  );
}
