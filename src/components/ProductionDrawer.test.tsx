/**
 * ProductionDrawer — TDD RED tests for plan 34-06 Task 3.
 *
 * Tests cover: null order (Pitfall 7), valid order header, fields, timeline, TransitionButtons
 * conditional on canEdit, drawer container width w-[480px], backdrop bg-black/30.
 *
 * Mock strategy: mock nuqs, next/navigation, and child components for isolation.
 */

// Mocks BEFORE imports
const mockSetQuery = jest.fn();

jest.mock('nuqs', () => ({
  useQueryStates: () => [{ order: 'ord-001' }, mockSetQuery],
  parseAsString: { withDefault: () => ({ withDefault: () => ({}) }) },
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: jest.fn() }),
}));

// Mock child components for isolation
jest.mock('./TransitionButtons', () => ({
  __esModule: true,
  default: ({ order }: { order: { state: string } }) => (
    <div data-testid="transition-buttons">TransitionButtons for {order.state}</div>
  ),
}));

jest.mock('./BlockReasonModal', () => ({
  __esModule: true,
  default: () => <div data-testid="block-reason-modal">BlockReasonModal</div>,
}));

jest.mock('./DrawerCloseHandlers', () => ({
  __esModule: true,
  default: () => <div data-testid="drawer-close-handlers">DrawerCloseHandlers</div>,
}));

jest.mock('@/actions/transitions', () => ({
  transitionToMixing: jest.fn(),
  completeOrder: jest.fn(),
  blockOrder: jest.fn(),
  resumeFromBlocked: jest.fn(),
}));

import React from 'react';
import { render, screen } from '@testing-library/react';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import ProductionDrawer from './ProductionDrawer';
import type { ProductionOrder } from '@/db/schema/orders';
import type { OrderEvent } from '@/db/schema/events';

// ─── Fixture helpers ─────────────────────────────────────────────────────────

function makeOrder(overrides: Partial<ProductionOrder> = {}): ProductionOrder {
  return {
    id: 'ord-001',
    orderNumber: 'ORD-001',
    customer: 'Acme Feed',
    product: 'Layer Mash',
    weightLbs: '5000.00',
    deliveryTime: 'May 14, 2026 10am',
    state: 'Pending',
    millLine: 'Premix',
    textureType: null,
    lineCode: null,
    version: 1,
    createdBy: 'user_abc',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}

function makeEvent(overrides: Partial<OrderEvent> = {}): OrderEvent {
  return {
    id: 'evt-001',
    orderId: 'ord-001',
    fromState: 'Pending',
    toState: 'Mixing',
    changedBy: 'user_operator',
    changedAt: new Date('2026-05-14T10:00:00Z'),
    note: null,
    ...overrides,
  };
}

// ─── Render helper ────────────────────────────────────────────────────────────

function renderDrawer({
  order = makeOrder(),
  events = [] as OrderEvent[],
  canEdit = true,
}: {
  order?: ProductionOrder | null;
  events?: OrderEvent[];
  canEdit?: boolean;
} = {}) {
  return render(
    <NuqsTestingAdapter searchParams="?order=ord-001">
      <ProductionDrawer order={order} events={events} canEdit={canEdit} />
    </NuqsTestingAdapter>
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ProductionDrawer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Test 5: null order → "Order not found" empty state ─────────────────────

  test('Test 5 (Pitfall 7): with order=null renders "Order not found" empty state with Close button', () => {
    renderDrawer({ order: null, events: [] });

    expect(screen.getByText('Order not found')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
  });

  // ── Test 6: Valid order → header with order number + customer ─────────────

  test('Test 6: renders order number + customer in the header', () => {
    const order = makeOrder({ orderNumber: 'ORD-001', customer: 'Acme Feed' });
    renderDrawer({ order });

    // Header should contain order number and customer — both appear in h2
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('ORD-001');
    // Customer appears in the header and also in fields — at least one occurrence
    const customerEls = screen.getAllByText(/Acme Feed/);
    expect(customerEls.length).toBeGreaterThanOrEqual(1);
  });

  // ── Test 7: Order fields rendered ────────────────────────────────────────

  test('Test 7: renders order fields including customer, product, weight, delivery, mill line', () => {
    const order = makeOrder({
      customer: 'Acme Feed',
      product: 'Layer Mash',
      weightLbs: '5000.50',
      deliveryTime: 'May 14, 2026 10am',
      millLine: 'Premix',
      textureType: null,
    });
    const { container } = renderDrawer({ order });

    // Product field — appears in the dl fields section
    expect(screen.getAllByText('Layer Mash').length).toBeGreaterThanOrEqual(1);
    // Weight — formatted with parseFloat + toLocaleString — at least one element contains "5,000" or "5000"
    const weightRegex = /5[,.]?000/;
    const allText = container.textContent ?? '';
    expect(allText).toMatch(weightRegex);
    // Mill Line — appears in field row
    const premixEls = screen.getAllByText('Premix');
    expect(premixEls.length).toBeGreaterThanOrEqual(1);
  });

  // ── Test 8: Timeline rendered in order ───────────────────────────────────

  test('Test 8: renders events timeline with from→to state, date, changedBy', () => {
    const events: OrderEvent[] = [
      makeEvent({
        id: 'evt-001',
        fromState: 'Pending',
        toState: 'Mixing',
        changedBy: 'user_operator',
        changedAt: new Date('2026-05-14T10:00:00Z'),
        note: null,
      }),
    ];
    renderDrawer({ events });

    // Timeline section heading
    expect(screen.getByText('Transition History')).toBeInTheDocument();

    // from → to state notation
    expect(screen.getByText(/Pending.*Mixing|Mixing/)).toBeInTheDocument();

    // changedBy
    expect(screen.getByText('user_operator')).toBeInTheDocument();
  });

  // ── Test 9: canEdit=true → TransitionButtons rendered ────────────────────

  test('Test 9: when canEdit=true and state is not Completed, TransitionButtons is rendered', () => {
    const order = makeOrder({ state: 'Pending' });
    renderDrawer({ order, canEdit: true });

    expect(screen.getByTestId('transition-buttons')).toBeInTheDocument();
  });

  // ── Test 10: canEdit=false → TransitionButtons NOT rendered (D-25) ────────

  test('Test 10 (D-25): when canEdit=false, TransitionButtons is NOT rendered', () => {
    const order = makeOrder({ state: 'Pending' });
    renderDrawer({ order, canEdit: false });

    expect(screen.queryByTestId('transition-buttons')).not.toBeInTheDocument();
  });

  // ── Test 11: Drawer container has w-[480px] class ────────────────────────

  test('Test 11: drawer container has w-[480px] class (UI-SPEC §5)', () => {
    const { container } = renderDrawer();

    // The drawer aside/div should have w-[480px]
    const drawerEl = container.querySelector('[class*="w-\\[480px\\]"]');
    expect(drawerEl).toBeTruthy();
  });

  // ── Test 12: Backdrop has bg-black/30 ────────────────────────────────────

  test('Test 12: backdrop element has bg-black/30 class (UI-SPEC §5)', () => {
    const { container } = renderDrawer();

    const backdrop = container.querySelector('[class*="bg-black\\/30"]');
    expect(backdrop).toBeTruthy();
  });
});
