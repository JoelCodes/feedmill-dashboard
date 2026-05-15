/**
 * RTL tests for KpiSection layout container + KpiSectionSkeleton.
 *
 * TDD RED phase: all 4 tests written before implementation.
 *
 * D-07 zone 3: Side-by-side on md+, stacked on mobile.
 *   SevenDayTrendChart (flex-1, wider) + BlockedExceptionList (w-[380px] right panel)
 */
import { render, screen } from '@testing-library/react';
import type { TrendDay, BlockedOrderWithDwell } from '@/db/queries/kpis';

// Mock nuqs — needed because BlockedExceptionList (child) uses 'use client' + useOrderQuery
jest.mock('nuqs', () => ({
  useQueryStates: jest.fn(() => [null, jest.fn()]),
  parseAsString: {
    withDefault: jest.fn(() => ({})),
  },
}));

import KpiSection, { KpiSectionSkeleton } from '@/components/KpiSection';

/** Helper: 7-day dataset */
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

function makeRow(overrides: Partial<BlockedOrderWithDwell> = {}): BlockedOrderWithDwell {
  return {
    orderId: 'ord_1',
    orderNumber: 'ORD-001',
    customer: 'Acme Feed',
    millLine: 'Premix',
    dwellSeconds: 1000,
    dwellFormatted: '16m',
    earlyDeliveryDate: null,
    isOverdue: false,
    ...overrides,
  };
}

describe('KpiSection', () => {
  it('Test 1 (composition): renders both SevenDayTrendChart heading and BlockedExceptionList heading', () => {
    render(<KpiSection trendData={[]} exceptions={[]} />);

    expect(screen.getByText('7-Day Volume Trend')).toBeInTheDocument();
    expect(screen.getByText('Blocked Orders')).toBeInTheDocument();
  });

  it('Test 2 (layout classes): outer wrapper has flex layout; chart container has flex-1; list container has md:w-[380px]', () => {
    const { container } = render(<KpiSection trendData={[]} exceptions={[]} />);

    const outer = container.firstElementChild;
    expect(outer?.className).toContain('flex');
    expect(outer?.className).toContain('flex-col');
    expect(outer?.className).toContain('md:flex-row');
    expect(outer?.className).toContain('md:gap-6');

    // Chart container — flex-1
    const children = Array.from(outer?.children ?? []);
    expect(children[0]?.className).toContain('flex-1');

    // List container — md:w-[380px] and flex-shrink-0
    expect(children[1]?.className).toContain('md:w-[380px]');
    expect(children[1]?.className).toContain('flex-shrink-0');
  });

  it('Test 3 (children receive props): trendData with 7 rows → 7 bars; exceptions with 2 rows → 2 row buttons', () => {
    const rows = [
      makeRow({ orderId: 'ord_1', orderNumber: 'ORD-001' }),
      makeRow({ orderId: 'ord_2', orderNumber: 'ORD-002' }),
    ];
    const { container } = render(<KpiSection trendData={make7Days()} exceptions={rows} />);

    // 7 SVG bars
    const rects = container.querySelectorAll('rect');
    expect(rects).toHaveLength(7);

    // 2 row buttons in exception list
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(2);
  });

  it('Test 4 (KpiSectionSkeleton): renders two animate-pulse rectangles with correct classes and same layout', () => {
    const { container } = render(<KpiSectionSkeleton />);

    const outer = container.firstElementChild;
    // Same layout as live KpiSection
    expect(outer?.className).toContain('flex');
    expect(outer?.className).toContain('md:flex-row');
    expect(outer?.className).toContain('md:gap-6');

    // Two skeleton rectangles
    const children = Array.from(outer?.children ?? []);
    expect(children).toHaveLength(2);

    // Both animate-pulse
    expect(children[0]?.className).toContain('animate-pulse');
    expect(children[1]?.className).toContain('animate-pulse');

    // Correct heights
    expect(children[0]?.className).toContain('h-[200px]');
    expect(children[1]?.className).toContain('h-[200px]');

    // List side has w-[380px] (or md:w-[380px])
    expect(children[1]?.className).toContain('w-[380px]');
  });
});
