/**
 * RTL tests for BlockedExceptionList component.
 *
 * TDD RED phase: all 10 tests written before implementation.
 *
 * KPI-07 / KPI-08 / D-10:
 * - Empty state, row render, overdue badge (conditional on isOverdue)
 * - Server-pre-sorted rows rendered in array order (no client re-sort)
 * - Row click + keyboard (Enter/Space) → useOrderQuery setQuery with startTransition
 * - Uses dwellFormatted verbatim (does NOT import formatDwell client-side)
 * - Distinct from BlockedAlertBand (D-10)
 */
import { render, screen, fireEvent } from '@testing-library/react';
import type { BlockedOrderWithDwell } from '@/db/queries/kpis';

// Mock nuqs — same pattern as BlockedAlertBand.test.tsx
const mockSetQuery = jest.fn();
jest.mock('nuqs', () => ({
  useQueryStates: jest.fn(() => [null, mockSetQuery]),
  parseAsString: {
    withDefault: jest.fn(() => ({})),
  },
}));

import BlockedExceptionList from '@/components/BlockedExceptionList';

/** Minimal BlockedOrderWithDwell factory */
function makeRow(overrides: Partial<BlockedOrderWithDwell> = {}): BlockedOrderWithDwell {
  return {
    orderId: 'ord_default',
    orderNumber: 'ORD-001',
    customer: 'Acme Feed',
    millLine: 'Premix',
    dwellSeconds: 8040,
    dwellFormatted: '2h 14m',
    earlyDeliveryDate: null,
    isOverdue: false,
    ...overrides,
  };
}

describe('BlockedExceptionList', () => {
  beforeEach(() => {
    mockSetQuery.mockClear();
  });

  // ── Empty state ─────────────────────────────────────────────────────────────

  it('Test 1: empty orders — renders card with header + sort label + empty state, no table rows', () => {
    render(<BlockedExceptionList orders={[]} />);

    expect(screen.getByText('Blocked Orders')).toBeInTheDocument();
    expect(screen.getByText('Sorted by dwell time')).toBeInTheDocument();
    expect(screen.getByText('No blocked orders')).toBeInTheDocument();

    // No rows with role="button"
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  // ── Row render ──────────────────────────────────────────────────────────────

  it('Test 2: one row — renders orderNumber, customer, millLine, dwellFormatted', () => {
    const row = makeRow({
      orderId: 'ord_x',
      orderNumber: 'ORD-001',
      customer: 'Acme Feed',
      millLine: 'Premix',
      dwellFormatted: '2h 14m',
      earlyDeliveryDate: '2026-05-10',
      isOverdue: true,
    });
    render(<BlockedExceptionList orders={[row]} />);

    expect(screen.getByText('ORD-001')).toBeInTheDocument();
    expect(screen.getByText('Acme Feed')).toBeInTheDocument();
    expect(screen.getByText('Premix')).toBeInTheDocument();
    expect(screen.getByText('2h 14m')).toBeInTheDocument();
  });

  it('Test 3 (overdue badge present): isOverdue=true → "Overdue" span with role="status" and aria-label', () => {
    const row = makeRow({ orderId: 'ord_x', isOverdue: true });
    const { container } = render(<BlockedExceptionList orders={[row]} />);

    // Overdue text present
    expect(screen.getByText('Overdue')).toBeInTheDocument();

    // role="status" on the badge
    const statusEl = container.querySelector('[role="status"]');
    expect(statusEl).not.toBeNull();
    expect(statusEl?.getAttribute('aria-label')).toBe('Order past early delivery date');

    // Warning color class
    expect(statusEl?.className).toContain('var(--warning)');
  });

  it('Test 4 (overdue badge absent): isOverdue=false → no "Overdue" element', () => {
    const row = makeRow({ isOverdue: false });
    render(<BlockedExceptionList orders={[row]} />);

    expect(screen.queryByText('Overdue')).not.toBeInTheDocument();
  });

  // ── Sort assumption ─────────────────────────────────────────────────────────

  it('Test 5 (no client re-sort): 3 pre-sorted rows render in input array order', () => {
    const rows: BlockedOrderWithDwell[] = [
      makeRow({ orderId: 'ord_1', orderNumber: 'ORD-100', dwellSeconds: 9000 }),
      makeRow({ orderId: 'ord_2', orderNumber: 'ORD-050', dwellSeconds: 5000 }),
      makeRow({ orderId: 'ord_3', orderNumber: 'ORD-010', dwellSeconds: 1000 }),
    ];
    const { container } = render(<BlockedExceptionList orders={rows} />);

    // Get all cells containing the order numbers
    const renderedTexts = Array.from(container.querySelectorAll('td, [role="cell"]'))
      .map((el) => el.textContent ?? '')
      .filter((t) => t.startsWith('ORD-'));

    expect(renderedTexts[0]).toBe('ORD-100');
    expect(renderedTexts[1]).toBe('ORD-050');
    expect(renderedTexts[2]).toBe('ORD-010');
  });

  // ── Row click → drawer navigation ─────────────────────────────────────────

  it('Test 6 (mouse click): clicking a row calls setQuery({ order: orderId }) via startTransition', () => {
    const row = makeRow({ orderId: 'ord_x', orderNumber: 'ORD-001' });
    render(<BlockedExceptionList orders={[row]} />);

    const rowEl = screen.getByRole('button', { name: /Open order ORD-001/i });
    fireEvent.click(rowEl);

    expect(mockSetQuery).toHaveBeenCalledWith({ order: 'ord_x' });
    expect(mockSetQuery).toHaveBeenCalledTimes(1);
  });

  it('Test 7 (keyboard Enter): Enter on focused row calls setQuery', () => {
    const row = makeRow({ orderId: 'ord_y', orderNumber: 'ORD-002' });
    render(<BlockedExceptionList orders={[row]} />);

    const rowEl = screen.getByRole('button', { name: /Open order ORD-002/i });
    fireEvent.keyDown(rowEl, { key: 'Enter' });

    expect(mockSetQuery).toHaveBeenCalledWith({ order: 'ord_y' });
    expect(mockSetQuery).toHaveBeenCalledTimes(1);
  });

  it('Test 8 (keyboard Space): Space on row calls setQuery and prevents default scroll', () => {
    const row = makeRow({ orderId: 'ord_z', orderNumber: 'ORD-003' });
    render(<BlockedExceptionList orders={[row]} />);

    const rowEl = screen.getByRole('button', { name: /Open order ORD-003/i });
    const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
    Object.defineProperty(event, 'preventDefault', { value: jest.fn() });
    rowEl.dispatchEvent(event);

    expect(mockSetQuery).toHaveBeenCalledWith({ order: 'ord_z' });
  });

  // ── Accessibility ────────────────────────────────────────────────────────────

  it('Test 9 (accessibility): row has role="button", tabIndex=0, aria-label with order number', () => {
    const row = makeRow({ orderId: 'ord_1', orderNumber: 'ORD-001' });
    render(<BlockedExceptionList orders={[row]} />);

    const rowEl = screen.getByRole('button', { name: /Open order ORD-001/i });
    expect(rowEl).toBeInTheDocument();
    expect(rowEl).toHaveAttribute('tabIndex', '0');
  });

  // ── dwellFormatted pass-through ─────────────────────────────────────────────

  it('Test 10 (dwellFormatted verbatim): renders dwellFormatted as-is, no client formatting', () => {
    const row = makeRow({ dwellFormatted: '1d 3h' });
    render(<BlockedExceptionList orders={[row]} />);

    // The server-formatted string is rendered verbatim
    expect(screen.getByText('1d 3h')).toBeInTheDocument();
  });
});
