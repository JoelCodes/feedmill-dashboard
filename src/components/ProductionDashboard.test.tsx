/**
 * ProductionDashboard — RTL + nuqs + fake-timer integration tests.
 *
 * Covers: filter pills, search debounce, polling, BlockedAlertBand,
 * Suspense wrapping (data-suspense attr), lastUpdated reset, drawer click.
 *
 * Plan 34-05 TDD RED → GREEN sequence.
 */

// Mock next/navigation BEFORE any imports that may trigger the module
const mockRefresh = jest.fn();
const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRefresh, push: mockPush }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock next/link to a simple passthrough <a> for jsdom
jest.mock('next/link', () => {
  const React = require('react');
  return function MockLink({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) {
    return React.createElement('a', { href }, children);
  };
});

// Mock ProductionDrawer to avoid pulling in server-action dependencies (transitions.ts → DB)
jest.mock('./ProductionDrawer', () => ({
  __esModule: true,
  default: ({ order }: { order: { orderNumber?: string } | null }) => {
    const React = require('react');
    return React.createElement(
      'div',
      { 'data-testid': 'production-drawer' },
      order ? `Drawer: ${order.orderNumber ?? 'unknown'}` : 'Drawer: Order not found'
    );
  },
}));

// Mock DrawerSkeleton
jest.mock('./DrawerSkeleton', () => ({
  __esModule: true,
  default: () => {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'drawer-skeleton' }, 'DrawerSkeleton');
  },
}));

// Mock @/actions/transitions to prevent DB connection attempts
jest.mock('@/actions/transitions', () => ({
  transitionToMixing: jest.fn(),
  completeOrder: jest.fn(),
  blockOrder: jest.fn(),
  resumeFromBlocked: jest.fn(),
}));

import React from 'react';
import { render, screen, act, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import ProductionDashboard from './ProductionDashboard';
import type { ProductionOrder } from '@/db/schema/orders';
import type { OrderEvent } from '@/db/schema/events';

// ─── Fixture helpers ────────────────────────────────────────────────────────

function makeOrder(overrides: Partial<ProductionOrder> & { id: string }): ProductionOrder {
  return {
    id: overrides.id,
    orderNumber: `ORD-${overrides.id}`,
    customer: overrides.customer ?? 'Acme Feed',
    product: overrides.product ?? 'Layer Mash',
    weightLbs: overrides.weightLbs ?? '1000.00',
    deliveryTime: 'Mar 5, 2026 10am',
    state: overrides.state ?? 'Pending',
    millLine: overrides.millLine ?? 'Premix',
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

// Fixture: one order per state, spread across mill lines
const baseFixture: ProductionOrder[] = [
  makeOrder({ id: 'ord_1', state: 'Pending', millLine: 'Premix', customer: 'Acme Feed', product: 'Layer Mash' }),
  makeOrder({ id: 'ord_2', state: 'Mixing', millLine: 'Excel', customer: 'Sunrise Farms', product: 'Broiler Mix' }),
  makeOrder({ id: 'ord_3', state: 'Completed', millLine: 'CGM', customer: 'Green Pastures', product: 'Turkey Blend' }),
  makeOrder({ id: 'ord_4', state: 'Blocked', millLine: 'Premix', customer: 'Valley Co', product: 'Starter Feed' }),
];

const noBlockedFixture: ProductionOrder[] = [
  makeOrder({ id: 'ord_1', state: 'Pending', millLine: 'Premix' }),
  makeOrder({ id: 'ord_2', state: 'Mixing', millLine: 'Excel' }),
  makeOrder({ id: 'ord_3', state: 'Completed', millLine: 'CGM' }),
];

const emptyEvents: OrderEvent[] = [];

// ─── Render helper ──────────────────────────────────────────────────────────

interface RenderOptions {
  orders?: ProductionOrder[];
  searchParams?: string | Record<string, string>;
  onUrlUpdate?: (event: { searchParams: URLSearchParams }) => void;
  drawerOrder?: ProductionOrder | null;
  drawerEvents?: OrderEvent[];
}

function renderDashboard({
  orders = baseFixture,
  searchParams = '',
  onUrlUpdate,
  drawerOrder = null,
  drawerEvents = emptyEvents,
}: RenderOptions = {}) {
  return render(
    <NuqsTestingAdapter searchParams={searchParams} onUrlUpdate={onUrlUpdate}>
      <ProductionDashboard
        orders={orders}
        canEdit={true}
        drawerOrder={drawerOrder}
        drawerEvents={drawerEvents}
      />
    </NuqsTestingAdapter>
  );
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('ProductionDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Test 1: Filter pill labels and counts ──────────────────────────────

  test('Test 1: renders four FilterPill labels with counts from fixture orders', () => {
    renderDashboard();

    // FilterPill has aria-label="Filter by X, N orders"
    // Use this to assert each pill is present
    expect(screen.getByRole('button', { name: /filter by pending/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /filter by mixing/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /filter by completed/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /filter by blocked/i })).toBeInTheDocument();
  });

  // ── Test 2: Mill column headings ───────────────────────────────────────

  test('Test 2: renders three MillColumn headings — Premix, Excel, CGM', () => {
    renderDashboard();

    expect(screen.getByRole('heading', { name: 'Premix' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Excel' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'CGM' })).toBeInTheDocument();
  });

  // ── Test 3: Search input placeholder ───────────────────────────────────

  test('Test 3: renders search input with placeholder text', () => {
    renderDashboard();

    // UI-SPEC §1 placeholder contains "search"
    const searchInput = screen.getByPlaceholderText(/search/i);
    expect(searchInput).toBeInTheDocument();
  });

  // ── Test 4: LastUpdatedChip and Import Orders button ────────────────────

  test('Test 4: renders LastUpdatedChip and Import Orders button', () => {
    renderDashboard();

    // LastUpdatedChip renders "Updated Xs ago" text
    expect(screen.getByText(/updated.*ago/i)).toBeInTheDocument();

    // Import Orders button/link
    const importLink = screen.getByRole('link', { name: /import orders/i });
    expect(importLink).toBeInTheDocument();
    expect(importLink).toHaveAttribute('href', '/import');
  });

  // ── Test 5: Pitfall 11 — empty status shows all, specific status filters ─

  test('Test 5 (Pitfall 11): empty status shows all four states; ?status=Pending shows only Pending orders', () => {
    // With default (empty status=[]), all states render
    const { unmount } = renderDashboard({ orders: baseFixture, searchParams: '' });

    // All four orders should be visible (by order number)
    expect(screen.getByText('ORD-ord_1')).toBeInTheDocument();
    expect(screen.getByText('ORD-ord_2')).toBeInTheDocument();
    expect(screen.getByText('ORD-ord_3')).toBeInTheDocument();
    expect(screen.getByText('ORD-ord_4')).toBeInTheDocument();
    unmount();

    // With status=Pending, only Pending orders render
    renderDashboard({ orders: baseFixture, searchParams: '?status=Pending' });

    expect(screen.getByText('ORD-ord_1')).toBeInTheDocument();
    expect(screen.queryByText('ORD-ord_2')).not.toBeInTheDocument();
    expect(screen.queryByText('ORD-ord_3')).not.toBeInTheDocument();
    // ORD-ord_4 is Blocked — should not appear
    expect(screen.queryByText('ORD-ord_4')).not.toBeInTheDocument();
  });

  // ── Test 6: Toggle filter pill → nuqs status updates ──────────────────

  test('Test 6: clicking Mixing FilterPill updates nuqs status to Mixing', async () => {
    const urlUpdates: URLSearchParams[] = [];
    renderDashboard({
      onUrlUpdate: (evt) => urlUpdates.push(evt.searchParams),
    });

    // Click the "Mixing" pill
    const mixingPill = screen.getByRole('button', {
      name: /filter by mixing/i,
    });

    await act(async () => {
      fireEvent.click(mixingPill);
    });

    // nuqs may update asynchronously via scheduler — wait for URL to update
    await waitFor(() => {
      expect(urlUpdates.length).toBeGreaterThan(0);
    });

    const lastUrl = urlUpdates[urlUpdates.length - 1];
    const statusParam = lastUrl.get('status');
    expect(statusParam).toBeTruthy();
    expect(statusParam).toContain('Mixing');
  });

  // ── Test 7: Search debounce → nuqs q update ────────────────────────────

  test('Test 7: typing in search input updates nuqs q after 150ms debounce', async () => {
    jest.useFakeTimers();
    try {
      const urlUpdates: URLSearchParams[] = [];
      renderDashboard({
        onUrlUpdate: (evt) => urlUpdates.push(evt.searchParams),
      });

      const searchInput = screen.getByPlaceholderText(/search/i);

      // Type into the search field via fireEvent (compatible with fake timers)
      fireEvent.change(searchInput, { target: { value: 'acme' } });

      // Advance past 150ms debounce
      await act(async () => {
        jest.advanceTimersByTime(200);
      });

      // After debounce, the URL q param should be 'acme'
      await waitFor(() => {
        expect(urlUpdates.length).toBeGreaterThan(0);
        const lastUrl = urlUpdates[urlUpdates.length - 1];
        expect(lastUrl?.get('q')).toBe('acme');
      });
    } finally {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    }
  });

  // ── Test 8: Polling — router.refresh called after 30s ─────────────────

  test('Test 8 (D-19 / PROD-09): after 30s, router.refresh is called at least once', async () => {
    jest.useFakeTimers();
    try {
      renderDashboard();

      expect(mockRefresh).not.toHaveBeenCalled();

      await act(async () => {
        jest.advanceTimersByTime(30_000);
      });

      expect(mockRefresh).toHaveBeenCalledTimes(1);
    } finally {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    }
  });

  // ── Test 9: Card click → nuqs order updates ────────────────────────────

  test('Test 9: clicking ProductionCard sets nuqs order to that order id', async () => {
    const urlUpdates: URLSearchParams[] = [];
    // Fixture: Premix column has ord_1 (Pending) as topmost card
    renderDashboard({
      orders: [
        makeOrder({ id: 'ord_1', state: 'Pending', millLine: 'Premix', customer: 'Acme Feed' }),
      ],
      onUrlUpdate: (evt) => urlUpdates.push(evt.searchParams),
    });

    // ProductionCard has role="button" — find the card that contains "Acme Feed"
    // Filter buttons from the pill strip by aria-label pattern; cards don't have aria-label
    const allButtons = screen.getAllByRole('button');
    // Find the card - it will have customer text inside it
    const orderCard = allButtons.find((btn) =>
      btn.textContent?.includes('Acme Feed')
    );
    expect(orderCard).toBeTruthy();

    await act(async () => {
      fireEvent.click(orderCard!);
    });

    expect(urlUpdates.length).toBeGreaterThan(0);
    const lastUrl = urlUpdates[urlUpdates.length - 1];
    expect(lastUrl.get('order')).toBe('ord_1');
  });

  // ── Test 10: BlockedAlertBand shown/hidden ─────────────────────────────

  test('Test 10: BlockedAlertBand renders with blocked orders; absent with zero blocked', () => {
    const { unmount } = renderDashboard({ orders: baseFixture });

    // "BLOCKED:" text appears in the band — baseFixture has ord_4 as Blocked
    expect(screen.getByText(/BLOCKED:/)).toBeInTheDocument();
    unmount();

    // With no blocked orders, band should not render
    renderDashboard({ orders: noBlockedFixture });
    expect(screen.queryByText(/BLOCKED:/)).not.toBeInTheDocument();
  });

  // ── Test 11: Suspense wrappers — data-suspense="column" divs ──────────

  test('Test 11: each mill column is wrapped in a div with data-suspense="column"', () => {
    const { container } = renderDashboard();

    const suspenseDivs = container.querySelectorAll('[data-suspense="column"]');
    expect(suspenseDivs.length).toBe(3);
  });

  // ── Test 12: lastUpdated resets when orders prop changes ───────────────

  test('Test 12: LastUpdatedChip resets when orders prop reference changes', async () => {
    jest.useFakeTimers();
    try {
      const { rerender } = renderDashboard({ orders: baseFixture });

      // Advance time 10 seconds so chip shows something > 0s
      await act(async () => {
        jest.advanceTimersByTime(10_000);
      });

      // Find the "Updated Xs ago" text — it should be ≥ 10s
      const chipEl = screen.getByText(/updated.*ago/i);
      const textBefore = chipEl.textContent ?? '';
      // Should show some seconds elapsed (≥ 10s)
      expect(textBefore).toMatch(/updated \d+s ago/i);
      expect(parseInt(textBefore.match(/\d+/)?.[0] ?? '0', 10)).toBeGreaterThanOrEqual(9);

      // Re-render with a NEW orders array reference (simulates RSC refresh after router.refresh())
      const newOrders = [
        ...baseFixture,
        makeOrder({ id: 'ord_new', state: 'Pending', millLine: 'CGM' }),
      ];

      await act(async () => {
        rerender(
          <NuqsTestingAdapter searchParams="">
            <ProductionDashboard
              orders={newOrders}
              canEdit={true}
              drawerOrder={null}
              drawerEvents={emptyEvents}
            />
          </NuqsTestingAdapter>
        );
      });

      // After re-render, the lastUpdated state resets → chip shows ~0s
      const chipElAfter = screen.getByText(/updated.*ago/i);
      const textAfter = chipElAfter.textContent ?? '';
      // The chip should reset to "Updated 0s ago"
      expect(textAfter).toBe('Updated 0s ago');
    } finally {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    }
  });
});

// ─── T10b gap closure: URL-update options (shallow/history) ─────────────────

describe('Order key URL-update options (T10b gap closure)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('order setter uses shallow: false + history: push (card click triggers RSC fetch)', async () => {
    const urlUpdateEvents: Array<{ searchParams: URLSearchParams; queryString: string; options: { shallow: boolean; history: string; scroll: boolean } }> = [];
    const onUrlUpdate = (evt: typeof urlUpdateEvents[0]) => urlUpdateEvents.push(evt);

    render(
      <NuqsTestingAdapter onUrlUpdate={onUrlUpdate}>
        <ProductionDashboard
          orders={[makeOrder({ id: 'ord_1', state: 'Pending', millLine: 'Premix', customer: 'Acme Feed' })]}
          canEdit={false}
          drawerOrder={null}
          drawerEvents={[]}
        />
      </NuqsTestingAdapter>
    );

    // Find the order card button (contains customer name)
    const allButtons = screen.getAllByRole('button');
    const orderCard = allButtons.find((btn) => btn.textContent?.includes('Acme Feed'));
    expect(orderCard).toBeTruthy();

    await act(async () => {
      fireEvent.click(orderCard!);
    });

    await waitFor(() => {
      expect(urlUpdateEvents.length).toBeGreaterThan(0);
    });

    // Find the update that sets the order param
    const orderUpdate = urlUpdateEvents.find((evt) =>
      evt.queryString.includes('order=') || evt.searchParams.has('order')
    );
    expect(orderUpdate).toBeDefined();
    expect(orderUpdate!.options.shallow).toBe(false);
    expect(orderUpdate!.options.history).toBe('push');
  });

  it('status pill toggle remains shallow (no RSC fetch per pill)', async () => {
    const urlUpdateEvents: Array<{ searchParams: URLSearchParams; queryString: string; options: { shallow: boolean; history: string; scroll: boolean } }> = [];
    const onUrlUpdate = (evt: typeof urlUpdateEvents[0]) => urlUpdateEvents.push(evt);

    render(
      <NuqsTestingAdapter onUrlUpdate={onUrlUpdate}>
        <ProductionDashboard
          orders={[]}
          canEdit={false}
          drawerOrder={null}
          drawerEvents={[]}
        />
      </NuqsTestingAdapter>
    );

    // Click the Pending filter pill
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /filter by pending/i }));
    });

    await waitFor(() => {
      expect(urlUpdateEvents.length).toBeGreaterThan(0);
    });

    const statusUpdate = urlUpdateEvents.find((evt) =>
      evt.queryString.includes('status=') || evt.searchParams.has('status')
    );
    expect(statusUpdate).toBeDefined();
    // shallow defaults to true when not specified — assert it's NOT false
    expect(statusUpdate!.options.shallow).not.toBe(false);
  });

  it('search-debounce q update remains shallow (no RSC fetch per keystroke)', async () => {
    jest.useFakeTimers();
    try {
      const urlUpdateEvents: Array<{ searchParams: URLSearchParams; queryString: string; options: { shallow: boolean; history: string; scroll: boolean } }> = [];
      const onUrlUpdate = (evt: typeof urlUpdateEvents[0]) => urlUpdateEvents.push(evt);

      render(
        <NuqsTestingAdapter onUrlUpdate={onUrlUpdate}>
          <ProductionDashboard
            orders={[]}
            canEdit={false}
            drawerOrder={null}
            drawerEvents={[]}
          />
        </NuqsTestingAdapter>
      );

      const input = screen.getByPlaceholderText(/search/i);
      fireEvent.change(input, { target: { value: 'acme' } });

      // Advance past the 150ms debounce
      await act(async () => {
        jest.advanceTimersByTime(200);
      });

      await waitFor(() => {
        expect(urlUpdateEvents.length).toBeGreaterThan(0);
      });

      const qUpdate = urlUpdateEvents.find((evt) =>
        evt.queryString.includes('q=') || evt.searchParams.has('q')
      );
      expect(qUpdate).toBeDefined();
      expect(qUpdate!.options.shallow).not.toBe(false);
    } finally {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    }
  });
});
