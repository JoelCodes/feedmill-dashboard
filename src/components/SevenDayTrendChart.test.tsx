/**
 * RTL tests for SevenDayTrendChart component.
 *
 * TDD RED phase: all 10 tests written before implementation.
 *
 * KPI-06 / D-13:
 * - Empty state when data.length < 7 ("Not enough data yet" + "Check back after 7 days of production")
 * - 7-bar SVG render with deterministic geometry (no Math.random)
 * - Proportional bar heights, today opacity, zero-bar min height, weekday labels
 */
import { render, screen } from '@testing-library/react';
import SevenDayTrendChart from '@/components/SevenDayTrendChart';
import type { TrendDay } from '@/db/queries/kpis';

/** Helper: 7-day dataset, oldest first, today = last */
function make7Days(): TrendDay[] {
  return [
    { date: '2026-05-08', completedLbs: 1000 },
    { date: '2026-05-09', completedLbs: 2000 },
    { date: '2026-05-10', completedLbs: 3000 },
    { date: '2026-05-11', completedLbs: 4000 },
    { date: '2026-05-12', completedLbs: 5000 },
    { date: '2026-05-13', completedLbs: 6000 },
    { date: '2026-05-14', completedLbs: 7000 },
  ];
}

describe('SevenDayTrendChart', () => {
  // ── Empty state (data.length < 7) ─────────────────────────────────────────

  it('Test 1 (zero data): renders Card with section heading and empty state, no SVG', () => {
    const { container } = render(<SevenDayTrendChart data={[]} />);

    // Section heading
    expect(screen.getByText('7-Day Volume Trend')).toBeInTheDocument();

    // Empty state container with role="status"
    const statusEl = container.querySelector('[role="status"]');
    expect(statusEl).not.toBeNull();

    // Both copy strings present
    expect(screen.getByText('Not enough data yet')).toBeInTheDocument();
    expect(screen.getByText('Check back after 7 days of production')).toBeInTheDocument();

    // No SVG rendered
    expect(container.querySelector('svg')).toBeNull();
  });

  it('Test 2 (3 days of data): still renders empty state (threshold is < 7)', () => {
    const threeRows: TrendDay[] = [
      { date: '2026-05-12', completedLbs: 1000 },
      { date: '2026-05-13', completedLbs: 1500 },
      { date: '2026-05-14', completedLbs: 2000 },
    ];
    const { container } = render(<SevenDayTrendChart data={threeRows} />);

    expect(screen.getByText('Not enough data yet')).toBeInTheDocument();
    expect(screen.getByText('Check back after 7 days of production')).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeNull();
  });

  // ── Bar render (data.length === 7) ────────────────────────────────────────

  it('Test 3 (SVG element): 7 rows — SVG renders with correct viewBox, aria-hidden; wrapper has role="img"', () => {
    const { container } = render(<SevenDayTrendChart data={make7Days()} />);

    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute('viewBox')).toBe('0 0 420 160');
    expect(svg?.getAttribute('aria-hidden')).toBe('true');

    // The wrapping section has role="img"
    const imgWrapper = container.querySelector('[role="img"]');
    expect(imgWrapper).not.toBeNull();
    expect(imgWrapper?.getAttribute('aria-label')).toBeTruthy();
  });

  it('Test 4 (7 bars): exactly 7 rect elements inside the SVG', () => {
    const { container } = render(<SevenDayTrendChart data={make7Days()} />);
    const rects = container.querySelectorAll('rect');
    expect(rects).toHaveLength(7);
  });

  it('Test 5 (proportional heights): last bar height=120; first bar height < last bar', () => {
    const { container } = render(<SevenDayTrendChart data={make7Days()} />);
    const rects = Array.from(container.querySelectorAll('rect'));

    const lastHeight = parseFloat(rects[6].getAttribute('height') ?? '0');
    const firstHeight = parseFloat(rects[0].getAttribute('height') ?? '0');

    expect(lastHeight).toBe(120);
    expect(firstHeight).toBeLessThan(lastHeight);
    // First bar: Math.max(4, (1000/7000)*120) ≈ 17.14
    expect(firstHeight).toBeGreaterThanOrEqual(4);
  });

  it('Test 6 (today opacity): last bar has opacity 1; other 6 have opacity 0.8', () => {
    const { container } = render(<SevenDayTrendChart data={make7Days()} />);
    const rects = Array.from(container.querySelectorAll('rect'));

    // Today = last entry
    expect(parseFloat(rects[6].getAttribute('opacity') ?? '0')).toBe(1);

    // Other 6 bars = 0.8
    for (let i = 0; i < 6; i++) {
      expect(parseFloat(rects[i].getAttribute('opacity') ?? '0')).toBe(0.8);
    }
  });

  it('Test 7 (zero-bar min height): completedLbs=0 → height 0 (no stub bar)', () => {
    const dataWithZero: TrendDay[] = [
      { date: '2026-05-08', completedLbs: 0 },
      { date: '2026-05-09', completedLbs: 1000 },
      { date: '2026-05-10', completedLbs: 2000 },
      { date: '2026-05-11', completedLbs: 3000 },
      { date: '2026-05-12', completedLbs: 4000 },
      { date: '2026-05-13', completedLbs: 5000 },
      { date: '2026-05-14', completedLbs: 6000 },
    ];
    const { container } = render(<SevenDayTrendChart data={dataWithZero} />);
    const rects = Array.from(container.querySelectorAll('rect'));

    // First bar (completedLbs=0) → height 0
    expect(parseFloat(rects[0].getAttribute('height') ?? '-1')).toBe(0);
  });

  it('Test 8 (weekday labels): 7 text elements at y=148 with 3-letter weekday abbreviations', () => {
    const { container } = render(<SevenDayTrendChart data={make7Days()} />);
    const texts = Array.from(container.querySelectorAll('text'));

    expect(texts).toHaveLength(7);

    // All text elements at y=148
    for (const t of texts) {
      expect(t.getAttribute('y')).toBe('148');
    }

    // Verify a known date: 2026-05-14 is a Thursday → "Thu"
    const labels = texts.map((t) => t.textContent ?? '');
    expect(labels).toContain('Thu');
  });

  it('Test 9 (deterministic geometry): two renders of the same dataset produce identical SVG output', () => {
    const data = make7Days();
    const { container: c1 } = render(<SevenDayTrendChart data={data} />);
    const html1 = c1.innerHTML;

    const { container: c2 } = render(<SevenDayTrendChart data={data} />);
    const html2 = c2.innerHTML;

    expect(html1).toBe(html2);
  });

  it('Test 10 (Card wrapper): both empty state and chart render inside Card (var(--bg-card) background class)', () => {
    // Empty state
    const { container: emptyContainer } = render(<SevenDayTrendChart data={[]} />);
    // Card uses bg-[var(--bg-card)] via the cardVariants cva
    const emptyCard = emptyContainer.querySelector('.bg-\\[var\\(--bg-card\\)\\]');
    expect(emptyCard).not.toBeNull();

    // 7-bar chart
    const { container: chartContainer } = render(<SevenDayTrendChart data={make7Days()} />);
    const chartCard = chartContainer.querySelector('.bg-\\[var\\(--bg-card\\)\\]');
    expect(chartCard).not.toBeNull();
  });
});
