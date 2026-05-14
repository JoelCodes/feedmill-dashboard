import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MillColumn from './MillColumn';
import type { ProductionOrder } from '@/db/schema/orders';

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

describe('MillColumn', () => {
  test('Test 1 (RED): renders the mill line name as a heading', () => {
    render(
      <MillColumn
        millLine="Premix"
        orders={fixture}
        onOrderClick={() => {}}
      />
    );
    expect(screen.getByText('Premix')).toBeInTheDocument();
  });

  test('Test 2 (RED): sub-label shows completed/total weight from computeColumnWeights', () => {
    render(
      <MillColumn
        millLine="Premix"
        orders={fixture}
        onOrderClick={() => {}}
      />
    );
    // completed = 2000 + 1500 = 3500; total = 500+750+1000+2000+1500+800 = 6550
    // formatWeight(3500) = "3,500"; formatWeight(6550) = "6,550"
    // The sub-label should contain "3,500" and "6,550" and "lbs"
    const subLabel = screen.getByText(/lbs/);
    expect(subLabel.textContent).toContain('3,500');
    expect(subLabel.textContent).toContain('6,550');
    expect(subLabel.textContent).toContain('lbs');
  });

  test('Test 3 (RED): state sections render in Completed → Mixing → Blocked → Pending order', () => {
    render(
      <MillColumn
        millLine="Premix"
        orders={fixture}
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

    render(
      <MillColumn
        millLine="Premix"
        orders={partialFixture}
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
        onOrderClick={() => {}}
      />
    );
    // fixture has 1 Mixing order → should have exactly 1 "In progress" indicator
    const progressDots = screen.getAllByLabelText('In progress');
    expect(progressDots).toHaveLength(1);
  });

  test('Test 7 (RED): empty orders array shows header, 0/0 lbs, and "No orders" message', () => {
    render(
      <MillColumn
        millLine="Premix"
        orders={[]}
        onOrderClick={() => {}}
      />
    );
    // Column header always visible
    expect(screen.getByText('Premix')).toBeInTheDocument();

    // Weight sub-label shows 0 / 0 lbs
    const subLabel = screen.getByText(/lbs/);
    expect(subLabel.textContent).toContain('0');
    expect(subLabel.textContent).toContain('lbs');

    // Empty state message
    expect(screen.getByText('No orders')).toBeInTheDocument();
  });

  test('Test 8 (RED): clicking a ProductionCard fires onOrderClick with the correct order id', async () => {
    const mockOnOrderClick = jest.fn();
    render(
      <MillColumn
        millLine="Premix"
        orders={fixture}
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
