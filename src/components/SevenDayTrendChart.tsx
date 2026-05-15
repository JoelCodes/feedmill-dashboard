/**
 * SevenDayTrendChart — KPI-06 hand-rolled SVG bar chart.
 *
 * D-13: No chart library. Pure React / inline SVG only.
 * D-17: Read-only display; no interaction handlers, no hover tooltips (deferred to v2.1).
 *
 * Props: data: TrendDay[] (0..7 entries, oldest-first, server-sorted).
 * Empty state when fewer than 7 days of data exist per KPI-06 spec.
 *
 * SVG geometry (UI-SPEC locked):
 *   viewBox: 0 0 420 160
 *   7 bars × 48px wide + 8px gap = 56px stride
 *   max bar height: 120px (top 40px reserved for max-value label)
 *   bar y-position: 120 - barHeight
 *   bar fill: var(--primary); opacity 80% non-today, 100% today (last entry)
 *   min bar height: 4px for non-zero; 0px for zero (operator sees missing-data signal)
 *   weekday labels: 3-letter abbrev at x + 24 (centered), y=148
 *
 * Anti-patterns avoided:
 *   - Deterministic geometry only; no random jitter (RESEARCH.md anti-pattern)
 *   - No client directive needed — pure server-render, no hooks
 */
import Card from '@/components/ui/Card';
import type { TrendDay } from '@/db/queries/kpis';

/**
 * weekdayShort — derive a 3-letter weekday abbreviation from a YYYY-MM-DD string.
 *
 * The 'T12:00:00Z' anchor ensures the Date object represents noon UTC, avoiding
 * any local-timezone off-by-one across midnight. We then render using UTC
 * timeZone so toLocaleDateString is deterministic regardless of the test runner's
 * or browser's local timezone.
 */
function weekdayShort(isoDate: string): string {
  return new Date(isoDate + 'T12:00:00Z').toLocaleDateString('en-US', {
    weekday: 'short',
    timeZone: 'UTC',
  });
}

export default function SevenDayTrendChart({ data }: { data: TrendDay[] }): JSX.Element {
  // ── Empty state ─────────────────────────────────────────────────────────────
  if (data.length < 7) {
    return (
      <Card>
        <div className="p-4">
          <p className="text-sm font-bold text-[var(--text-primary)]">7-Day Volume Trend</p>
          <div
            role="status"
            className="min-h-[160px] flex flex-col items-center justify-center gap-2"
          >
            <p className="text-sm font-bold text-[var(--text-primary)]">Not enough data yet</p>
            <p className="text-[var(--fs-13)] text-[var(--text-muted)]">
              Check back after 7 days of production
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // ── Bar chart ───────────────────────────────────────────────────────────────
  // maxLbs computed once outside map — deterministic, no per-bar recalculation.
  // Math.max(..., 1) guards against all-zero dataset (prevents division-by-zero).
  const maxLbs = Math.max(...data.map((d) => d.completedLbs), 1);
  const todayIdx = data.length - 1;

  return (
    <Card>
      <div className="p-4">
        <p className="text-sm font-bold text-[var(--text-primary)]">7-Day Volume Trend</p>
        <section role="img" aria-label="7-day production volume trend bar chart">
          <svg
            viewBox="0 0 420 160"
            width="100%"
            preserveAspectRatio="xMidYMid meet"
            aria-hidden="true"
          >
            {data.map((d, i) => {
              // Zero completedLbs → height 0 (no stub bar — operator sees gap as missing-data signal).
              // Non-zero: Math.max(4, ...) ensures a visible minimum so tiny values still render.
              const barHeight =
                d.completedLbs === 0 ? 0 : Math.max(4, (d.completedLbs / maxLbs) * 120);

              const x = i * 56; // 48px bar + 8px gap = 56px stride
              const isToday = i === todayIdx;

              return (
                <g key={d.date}>
                  <rect
                    x={x}
                    y={120 - barHeight}
                    width={48}
                    height={barHeight}
                    fill="var(--primary)"
                    opacity={isToday ? 1 : 0.8}
                  />
                  <text
                    x={x + 24}
                    y={148}
                    textAnchor="middle"
                    fontSize="11"
                    fill="var(--text-muted)"
                  >
                    {weekdayShort(d.date)}
                  </text>
                </g>
              );
            })}
          </svg>
        </section>
      </div>
    </Card>
  );
}
