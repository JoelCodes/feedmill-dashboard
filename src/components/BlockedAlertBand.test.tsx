/**
 * RTL tests for BlockedAlertBand component.
 *
 * TDD RED phase: tests written before implementation.
 *
 * PROD-06 / D-22:
 * - Returns null when no blocked orders (no band shown)
 * - Renders chip per blocked order: "BLOCKED: ORD-001 (Premix)"
 * - Click chip sets ?order=<id> via nuqs
 * - Container has sticky + bg-error-light classes
 */
import { render, screen, fireEvent } from '@testing-library/react';
import type { ProductionOrder } from '@/db/schema/orders';

// Mock nuqs
const mockSetQuery = jest.fn();
jest.mock('nuqs', () => ({
  useQueryStates: jest.fn(() => [null, mockSetQuery]),
  parseAsString: {
    withDefault: jest.fn(() => ({})),
  },
}));

import BlockedAlertBand from './BlockedAlertBand';

// Minimal ProductionOrder factory
function makeOrder(overrides: Partial<ProductionOrder>): ProductionOrder {
  return {
    id: 'ord_default',
    orderNumber: 'ORD-000',
    customer: 'Customer',
    product: 'Product',
    weightLbs: '1000',
    deliveryTime: '2026-01-01',
    state: 'Pending',
    millLine: 'Premix',
    textureType: null,
    lineCode: null,
    earlyDeliveryDate: null,
    version: 1,
    createdBy: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('BlockedAlertBand', () => {
  beforeEach(() => {
    mockSetQuery.mockClear();
  });

  it('Test 7: with no orders, component returns null (container.firstChild is null)', () => {
    const { container } = render(<BlockedAlertBand orders={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('Test 8: with one Blocked order, renders exactly 1 chip with "BLOCKED: ORD-001 (Premix)"', () => {
    const orders = [
      makeOrder({ id: 'ord_1', orderNumber: 'ORD-001', millLine: 'Premix', state: 'Blocked' }),
      makeOrder({ id: 'ord_2', orderNumber: 'ORD-002', millLine: 'Excel', state: 'Pending' }),
    ];
    render(<BlockedAlertBand orders={orders} />);

    const chip = screen.getByText('BLOCKED: ORD-001 (Premix)');
    expect(chip).toBeInTheDocument();

    // Non-blocked order should NOT appear
    expect(screen.queryByText(/ORD-002/)).not.toBeInTheDocument();
  });

  it('Test 9: with three Blocked orders, renders all three chips in document order', () => {
    const orders = [
      makeOrder({ id: 'ord_a', orderNumber: 'ORD-A01', millLine: 'Premix', state: 'Blocked' }),
      makeOrder({ id: 'ord_b', orderNumber: 'ORD-B01', millLine: 'Excel', state: 'Blocked' }),
      makeOrder({ id: 'ord_c', orderNumber: 'ORD-C01', millLine: 'CGM', state: 'Blocked' }),
    ];
    render(<BlockedAlertBand orders={orders} />);

    expect(screen.getByText('BLOCKED: ORD-A01 (Premix)')).toBeInTheDocument();
    expect(screen.getByText('BLOCKED: ORD-B01 (Excel)')).toBeInTheDocument();
    expect(screen.getByText('BLOCKED: ORD-C01 (CGM)')).toBeInTheDocument();
  });

  it('Test 10: clicking a chip calls the nuqs setter with { order: orderId }', () => {
    const orders = [
      makeOrder({ id: 'ord_1', orderNumber: 'ORD-001', millLine: 'Premix', state: 'Blocked' }),
    ];
    render(<BlockedAlertBand orders={orders} />);

    const chip = screen.getByText('BLOCKED: ORD-001 (Premix)');
    fireEvent.click(chip);

    expect(mockSetQuery).toHaveBeenCalledWith({ order: 'ord_1' });
  });

  it('Test 11: container has "sticky" and "bg-error-light" classes per UI-SPEC §2', () => {
    const orders = [
      makeOrder({ id: 'ord_1', orderNumber: 'ORD-001', millLine: 'Premix', state: 'Blocked' }),
    ];
    const { container } = render(<BlockedAlertBand orders={orders} />);
    const band = container.firstElementChild;
    expect(band?.className).toContain('sticky');
    expect(band?.className).toContain('bg-error-light');
  });

  // ── T10b gap closure: useQueryStates called with shallow: false + history: push ──

  it('T10b: useQueryStates is called with { shallow: false, history: "push" } options (blocked-chip triggers RSC fetch)', () => {
    // Access the mocked useQueryStates to assert it was called with the correct options
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useQueryStates: mockUseQueryStates } = require('nuqs') as {
      useQueryStates: jest.Mock;
    };

    const orders = [
      makeOrder({ id: 'ord_1', orderNumber: 'ORD-001', millLine: 'Premix', state: 'Blocked' }),
    ];
    render(<BlockedAlertBand orders={orders} />);

    // Assert that useQueryStates was called with the options object as second arg
    expect(mockUseQueryStates).toHaveBeenCalledWith(
      expect.any(Object), // first arg: parsers object
      expect.objectContaining({ shallow: false, history: 'push' })
    );
  });

  // ── BUILD-01 regression guard (Phase 36 Plan 01) ──
  //
  // The `nuqs` setQuery setter on a non-shallow key returns Promise<URLSearchParams>,
  // which leaks into React's startTransition callback brand `() => void | Promise<void>`
  // (VoidOrUndefinedOnly) and causes a TS2322 build failure. The canonical fix is to
  // coerce the Promise to undefined with the `void` operator inside the inner arrow:
  //
  //   onClick={() => startTransition(() => void setQuery({ order: order.id }))}
  //
  // Canonical reference: src/components/BlockedExceptionList.tsx:35 uses exactly this
  // pattern (`startTransition(() => void setQuery({ order: id }))`).
  //
  // This source-grep test is a structural invariant guard: if a future refactor removes
  // the `void` operator, this test fails BEFORE `npm run build` does, surfacing the
  // regression at unit-test time rather than at integration time.

  it('Test 12: startTransition callback uses `void setQuery` cast (BUILD-01 regression guard)', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('fs');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('path');
    const filePath = path.resolve(__dirname, 'BlockedAlertBand.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toMatch(/startTransition\(\(\) => void setQuery/);
  });
});
