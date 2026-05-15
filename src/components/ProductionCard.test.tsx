import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProductionCard from './ProductionCard';
import type { ProductionOrder } from '@/db/schema/orders';

const fixtureOrder: ProductionOrder = {
  id: 'order-uuid-001',
  orderNumber: 'ORD-001',
  customer: 'Acme Feed',
  product: 'Layer Mash',
  weightLbs: '1500.50',
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
};

describe('ProductionCard', () => {
  test('Test 1 (RED): renders order number and customer name', () => {
    render(
      <ProductionCard
        order={fixtureOrder}
        isNextUp={false}
        isInProgress={false}
        onClick={() => {}}
      />
    );
    expect(screen.getByText('ORD-001')).toBeInTheDocument();
    expect(screen.getByText('Acme Feed')).toBeInTheDocument();
  });

  test('Test 2 (RED): renders weight as formatted number (Pitfall 6 — parseFloat required)', () => {
    render(
      <ProductionCard
        order={fixtureOrder}
        isNextUp={false}
        isInProgress={false}
        onClick={() => {}}
      />
    );
    // Must contain "1,500" (thousands separator from parseFloat + toLocaleString)
    const weightText = screen.getByText(/Layer Mash/);
    expect(weightText.textContent).toContain('1,500');
    expect(weightText.textContent).toContain('Layer Mash');
  });

  test('Test 3 (RED): renders delivery time with "Delivery:" prefix', () => {
    render(
      <ProductionCard
        order={fixtureOrder}
        isNextUp={false}
        isInProgress={false}
        onClick={() => {}}
      />
    );
    expect(screen.getByText(/Delivery: Mar 5, 2026 10am/)).toBeInTheDocument();
  });

  test('Test 4 (RED): isNextUp=true shows "Next Up" badge; isNextUp=false shows none', () => {
    const { rerender } = render(
      <ProductionCard
        order={fixtureOrder}
        isNextUp={true}
        isInProgress={false}
        onClick={() => {}}
      />
    );
    expect(screen.getByText('Next Up')).toBeInTheDocument();

    rerender(
      <ProductionCard
        order={fixtureOrder}
        isNextUp={false}
        isInProgress={false}
        onClick={() => {}}
      />
    );
    expect(screen.queryByText('Next Up')).not.toBeInTheDocument();
  });

  test('Test 5 (RED): isInProgress=true shows aria-label="In progress" with animate-pulse; false hides it', () => {
    const { rerender } = render(
      <ProductionCard
        order={{ ...fixtureOrder, state: 'Mixing' }}
        isNextUp={false}
        isInProgress={true}
        onClick={() => {}}
      />
    );
    const progressDot = screen.getByLabelText('In progress');
    expect(progressDot).toBeInTheDocument();
    expect(progressDot).toHaveClass('animate-pulse');

    rerender(
      <ProductionCard
        order={fixtureOrder}
        isNextUp={false}
        isInProgress={false}
        onClick={() => {}}
      />
    );
    expect(screen.queryByLabelText('In progress')).not.toBeInTheDocument();
  });

  test('Test 6 (RED): card root has role="button" and tabIndex=0', () => {
    render(
      <ProductionCard
        order={fixtureOrder}
        isNextUp={false}
        isInProgress={false}
        onClick={() => {}}
      />
    );
    const card = screen.getByRole('button');
    expect(card).toBeInTheDocument();
    expect(card).toHaveAttribute('tabIndex', '0');
  });

  test('Test 7 (RED): clicking the card fires onClick callback once', async () => {
    const mockOnClick = jest.fn();
    render(
      <ProductionCard
        order={fixtureOrder}
        isNextUp={false}
        isInProgress={false}
        onClick={mockOnClick}
      />
    );
    const card = screen.getByRole('button');
    await userEvent.click(card);
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  test('Test 8 (RED): pressing Enter or Space on focused card fires onClick', async () => {
    const mockOnClick = jest.fn();
    render(
      <ProductionCard
        order={fixtureOrder}
        isNextUp={false}
        isInProgress={false}
        onClick={mockOnClick}
      />
    );
    const card = screen.getByRole('button');
    card.focus();
    await userEvent.keyboard('{Enter}');
    expect(mockOnClick).toHaveBeenCalledTimes(1);

    await userEvent.keyboard(' ');
    expect(mockOnClick).toHaveBeenCalledTimes(2);
  });

  test('Test 9 (RED): left-border has inline style backgroundColor with status-pending-border token', () => {
    render(
      <ProductionCard
        order={fixtureOrder}
        isNextUp={false}
        isInProgress={false}
        onClick={() => {}}
      />
    );
    // The left border div should have inline style with the CSS variable for Pending border
    // We look for an element with an inline backgroundColor that references the token
    const card = screen.getByRole('button');
    // Find the border div — it's the absolute-positioned first child
    const borderEl = card.querySelector('[style]');
    expect(borderEl).not.toBeNull();
    const style = borderEl?.getAttribute('style') ?? '';
    // The style should contain var(--status-pending-border)
    expect(style).toContain('var(--status-pending-border)');
  });
});
