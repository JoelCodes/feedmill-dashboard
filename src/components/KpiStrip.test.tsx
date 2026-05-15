/**
 * RTL tests for KpiStrip — the horizontal KPI strip composing 6 KpiCard instances.
 *
 * TDD RED phase: tests written before implementation.
 *
 * Tests cover:
 *  - 6 region cards render for a complete KpiStripData payload
 *  - Intl.NumberFormat thousands formatting for weight values
 *  - KPI-04 pending backlog: orders count + lbs subValue
 *  - KPI-05 formula mix: dominant bucket + subValue + D-12 footnote
 *  - KPI-05 zero uncategorized: no footnote rendered
 *  - KPI-05 null percentages: value shows em dash "—", no subValue
 *  - Correct icons: Wheat (Completed Today), ClipboardList (Pending), Activity (Formula Mix)
 *  - Scroll container: overflow-x-auto + aria-label
 *  - KpiStripSkeleton: 6 animate-pulse divs in flex-row
 */
import { render, screen } from '@testing-library/react';
import type { KpiStripData } from '@/db/queries/kpis';

import KpiStrip, { KpiStripSkeleton } from '@/components/KpiStrip';

const sample: KpiStripData = {
  completedTodayLbs: '18400',
  premixLbs: '6000',
  excelLbs: '8000',
  cgmLbs: '4400',
  pendingCount: 5,
  pendingLbs: '47200',
  pelletPct: 58.0,
  mashPct: 32.0,
  crumblePct: 10.0,
  uncategorizedCount: 3,
};

describe('KpiStrip', () => {
  it('Test 1: renders 6 KpiCard regions', () => {
    render(<KpiStrip kpis={sample} />);
    const regions = screen.getAllByRole('region');
    expect(regions).toHaveLength(6);
  });

  it('Test 2: "Completed Today" card has formatted value "18,400 lbs"', () => {
    render(<KpiStrip kpis={sample} />);
    expect(screen.getByText('18,400 lbs')).toBeInTheDocument();
  });

  it('Test 3: "Premix Today" card has formatted value "6,000 lbs"', () => {
    render(<KpiStrip kpis={sample} />);
    expect(screen.getByText('6,000 lbs')).toBeInTheDocument();
  });

  it('Test 4: "Pending Backlog" card has value "5 orders" AND subValue "47,200 lbs total"', () => {
    render(<KpiStrip kpis={sample} />);
    expect(screen.getByText('5 orders')).toBeInTheDocument();
    expect(screen.getByText('47,200 lbs total')).toBeInTheDocument();
  });

  it('Test 5: "Formula Mix" card has dominant bucket value, remaining subValue, and D-12 footnote', () => {
    render(<KpiStrip kpis={sample} />);
    // Dominant bucket: 58% Pellet
    expect(screen.getByText('58% Pellet')).toBeInTheDocument();
    // Remaining two sorted descending: 32% Mash · 10% Crumble
    expect(screen.getByText('32% Mash · 10% Crumble')).toBeInTheDocument();
    // D-12 footnote when uncategorizedCount > 0
    expect(screen.getByText('Excludes 3 uncategorized orders')).toBeInTheDocument();
  });

  it('Test 6 (KPI-05 zero uncategorized): footnote NOT rendered when uncategorizedCount is 0', () => {
    render(<KpiStrip kpis={{ ...sample, uncategorizedCount: 0 }} />);
    expect(screen.queryByText(/Excludes.*uncategorized/)).not.toBeInTheDocument();
  });

  it('Test 7 (KPI-05 null percentages): value displays em dash "—" and no subValue renders', () => {
    render(
      <KpiStrip
        kpis={{ ...sample, pelletPct: null, mashPct: null, crumblePct: null }}
      />
    );
    // Value is em dash
    expect(screen.getByText('—')).toBeInTheDocument();
    // No subValue showing bucket breakdown
    expect(screen.queryByText(/%.*·/)).not.toBeInTheDocument();
  });

  it('Test 8 (icons): Wheat, ClipboardList, Activity icons render inside their respective regions', () => {
    const { container } = render(<KpiStrip kpis={sample} />);
    // All three icon containers should be present (h-11 w-11 rounded-xl)
    const iconContainers = container.querySelectorAll('.h-11.w-11.rounded-xl');
    // Completed Today (Wheat), Pending Backlog (ClipboardList), Formula Mix (Activity)
    expect(iconContainers.length).toBeGreaterThanOrEqual(3);
    // Each contains an SVG
    iconContainers.forEach((container) => {
      expect(container.querySelector('svg')).toBeTruthy();
    });
  });

  it('Test 9 (scroll container): outer wrapper has overflow-x-auto and aria-label', () => {
    const { container } = render(<KpiStrip kpis={sample} />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper?.className).toContain('overflow-x-auto');
    expect(wrapper?.getAttribute('aria-label')).toBe('KPI summary strip');
  });
});

describe('KpiStripSkeleton', () => {
  it('Test 10: renders 6 animate-pulse divs in a flex-row layout', () => {
    const { container } = render(<KpiStripSkeleton />);
    const wrapper = container.firstElementChild as HTMLElement;
    // Outer flex row
    expect(wrapper?.className).toContain('flex');
    expect(wrapper?.className).toContain('flex-row');
    // 6 skeleton placeholders each with animate-pulse
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons).toHaveLength(6);
    // Each has bg-[var(--divider)]
    skeletons.forEach((s) => {
      expect(s.className).toContain('bg-[var(--divider)]');
    });
  });
});
