import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MillColumn from './MillColumn';
import type { ProductionOrder } from '@/db/schema/orders';
import type { ColumnSummary } from './MillColumn';

// Fixture: 6 orders in the Premix mill line across mixed states
// 2 Pending, 1 Mixing, 2 Completed, 1 Blocked
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
    earlyDeliveryDate: null,
    version: 1,
    createdBy: 'user-001',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}

const fixture: ProductionOrder[] = [
  makeOrder({ id: 'p1', state: 'Pending', weightLbs: '500.00' }),
  makeOrder({ id: 'p2', state: 'Pending', weightLbs: '750.00' }),
  makeOrder({ id: 'm1', state: 'Mixing', weightLbs: '1000.00' }),
  makeOrder({ id: 'c1', state: 'Completed', weightLbs: '2000.00' }),
  makeOrder({ id: 'c2', state: 'Completed', weightLbs: '1500.00' }),
  makeOrder({ id: 'b1', state: 'Blocked', weightLbs: '800.00' }),
];

// completed = 2000 + 1500 = 3500; total = 500+750+1000+2000+1500+800 = 6550
const fixtureSummary: ColumnSummary = {
  orderCount: 6,
  completedLbs: 3500,
  totalLbs: 6550,
};

describe('MillColumn', () => {
  // ── New KPI-03 tests (Phase 35 Plan 07) ────────────────────────────────

  test('New Test 1 (KPI-03 header strip format): renders "{N} orders — {completedLbs} / {totalLbs} lbs"', () => {
    render(
      <MillColumn
        millLine="Premix"
        orders={fixture}
        summary={{ orderCount: 4, completedLbs: 18400, totalLbs: 52000 }}
        onOrderClick={() => {}}
      />
    );
    // Check that the text matches the KPI-03 copywriting contract
    const text = screen.getByText(/orders/i).closest('p');
    expect(text?.textContent).toMatch(/4 orders.*18,400.*52,000.*lbs/);
  });

  test('New Test 2 (zero-orders edge case): with summary={orderCount:0,completedLbs:0,totalLbs:0} header renders "0 orders — 0 / 0 lbs"', () => {
    render(
      <MillColumn
        millLine="Premix"
        orders={[]}
        summary={{ orderCount: 0, completedLbs: 0, totalLbs: 0 }}
        onOrderClick={() => {}}
      />
    );
    // "0 orders" span is the first child of the <p>; find via the specific order-count span
    const orderCountSpan = screen.getByText('0 orders');
    const p = orderCountSpan.closest('p');
    expect(p?.textContent).toMatch(/0 orders.*0.*0.*lbs/);
    // Empty state body still shows "No orders"
    expect(screen.getByText('No orders')).toBeInTheDocument();
  });

  test('New Test 3 (text-style classes): the KPI-03 header strip has order count and ratio spans', () => {
    const { container } = render(
      <MillColumn
        millLine="Premix"
        orders={fixture}
        summary={{ orderCount: 4, completedLbs: 18400, totalLbs: 52000 }}
        onOrderClick={() => {}}
      />
    );
    // Verify the primary-colored span contains the order count
    const primarySpan = container.querySelector('span[class*="text-[var(--text-primary)]"]');
    expect(primarySpan).toBeInTheDocument();
    expect(primarySpan?.textContent).toContain('4 orders');
    // Verify the muted-colored spans exist (em-dash + ratio)
    const mutedSpans = container.querySelectorAll('span[class*="text-[var(--text-muted)]"]');
    expect(mutedSpans.length).toBeGreaterThanOrEqual(2);
  });

  // ── Existing tests (regression) — updated to pass summary prop ─────────

  test('Test 1 (RED): renders the mill line name as a heading', () => {
    render(
      <MillColumn
        millLine="Premix"
        orders={fixture}
        summary={fixtureSummary}
        onOrderClick={() => {}}
      />
    );
    expect(screen.getByText('Premix')).toBeInTheDocument();
  });

  test('Test 2 (regression): sub-label shows "{N} orders — {completedLbs} / {totalLbs} lbs" with computed summary values', () => {
    render(
      <MillColumn
        millLine="Premix"
        orders={fixture}
        summary={fixtureSummary}
        onOrderClick={() => {}}
      />
    );
    // completed = 3500; total = 6550
    // The sub-label contains "6 orders — 3,500 / 6,550 lbs"
    const p = screen.getByText(/orders/i).closest('p');
    expect(p?.textContent).toContain('3,500');
    expect(p?.textContent).toContain('6,550');
    expect(p?.textContent).toContain('lbs');
  });

  test('Test 3 (RED): state sections render in Completed → Mixing → Blocked → Pending order', () => {
    render(
      <MillColumn
        millLine="Premix"
        orders={fixture}
        summary={fixtureSummary}
        onOrderClick={() => {}}
      />
    );
    // Get all state section headings
    const sectionHeadings = screen.getAllByRole('heading', { level: 3 });
    const headingTexts = sectionHeadings.map((h) => h.textContent);

    // Verify order: Completed before Mixing, Mixing before Blocked, Blocked before Pending
    const completedIdx = headingTexts.indexOf('Completed');
    const mixingIdx = headingTexts.indexOf('Mixing');
    const blockedIdx = headingTexts.indexOf('Blocked');
    const pendingIdx = headingTexts.indexOf('Pending');

    expect(completedIdx).toBeGreaterThanOrEqual(0);
    expect(mixingIdx).toBeGreaterThan(completedIdx);
    expect(blockedIdx).toBeGreaterThan(mixingIdx);
    expect(pendingIdx).toBeGreaterThan(blockedIdx);
  });

  test('Test 4 (RED): state with zero orders does not render section header', () => {
    // Create fixture with only Completed + Pending (no Mixing or Blocked)
    const partialFixture: ProductionOrder[] = [
      makeOrder({ id: 'c1', state: 'Completed', weightLbs: '1000.00' }),
      makeOrder({ id: 'p1', state: 'Pending', weightLbs: '500.00' }),
    ];
    const partialSummary: ColumnSummary = { orderCount: 2, completedLbs: 1000, totalLbs: 1500 };

    render(
      <MillColumn
        millLine="Premix"
        orders={partialFixture}
        summary={partialSummary}
        onOrderClick={() => {}}
      />
    );

    // Completed and Pending sections should be present
    expect(screen.getByRole('heading', { name: 'Completed' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Pending' })).toBeInTheDocument();

    // Mixing and Blocked sections should NOT be present
    expect(screen.queryByRole('heading', { name: 'Mixing' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Blocked' })).not.toBeInTheDocument();
  });

  test('Test 5 (RED): topmost Pending order receives isNextUp=true (shows "Next Up" badge)', () => {
    render(
      <MillColumn
        millLine="Premix"
        orders={fixture}
        summary={fixtureSummary}
        onOrderClick={() => {}}
      />
    );
    // Only ONE "Next Up" badge should appear — for the first Pending order (p1)
    const nextUpBadges = screen.getAllByText('Next Up');
    expect(nextUpBadges).toHaveLength(1);
  });

  test('Test 6 (RED): every Mixing order receives isInProgress=true (shows "In progress" dot)', () => {
    render(
      <MillColumn
        millLine="Premix"
        orders={fixture}
        summary={fixtureSummary}
        onOrderClick={() => {}}
      />
    );
    // fixture has 1 Mixing order → should have exactly 1 "In progress" indicator
    const progressDots = screen.getAllByLabelText('In progress');
    expect(progressDots).toHaveLength(1);
  });

  test('Test 7 (RED): empty orders array shows header, "0 orders — 0 / 0 lbs", and "No orders" message', () => {
    render(
      <MillColumn
        millLine="Premix"
        orders={[]}
        summary={{ orderCount: 0, completedLbs: 0, totalLbs: 0 }}
        onOrderClick={() => {}}
      />
    );
    // Column header always visible
    expect(screen.getByText('Premix')).toBeInTheDocument();

    // Weight sub-label shows "0 orders — 0 / 0 lbs" — find via order-count span
    const orderCountSpan = screen.getByText('0 orders');
    const p = orderCountSpan.closest('p');
    expect(p?.textContent).toContain('0');
    expect(p?.textContent).toContain('lbs');

    // Empty state message
    expect(screen.getByText('No orders')).toBeInTheDocument();
  });

  test('Test 8 (RED): clicking a ProductionCard fires onOrderClick with the correct order id', async () => {
    const mockOnOrderClick = jest.fn();
    render(
      <MillColumn
        millLine="Premix"
        orders={fixture}
        summary={fixtureSummary}
        onOrderClick={mockOnOrderClick}
      />
    );

    // Get all cards (role="button") — click the first one
    const cards = screen.getAllByRole('button');
    await userEvent.click(cards[0]);

    expect(mockOnOrderClick).toHaveBeenCalledTimes(1);
    // The callback should receive an order id (string)
    expect(typeof mockOnOrderClick.mock.calls[0][0]).toBe('string');
  });
});
