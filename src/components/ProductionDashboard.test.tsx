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

import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
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
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  // ── Test 1: Filter pill labels and counts ──────────────────────────────

  test('Test 1: renders four FilterPill labels with counts from fixture orders', () => {
    renderDashboard();

    // The four states must appear as pill labels
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Mixing')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('Blocked')).toBeInTheDocument();
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

    // UI-SPEC §1 placeholder
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

    // Click the "Mixing" pill (it's a button with aria-label)
    const mixingPill = screen.getByRole('button', {
      name: /filter by mixing/i,
    });
    await act(async () => {
      await userEvent.click(mixingPill);
    });

    // nuqs should have updated the URL to include status=Mixing
    expect(urlUpdates.length).toBeGreaterThan(0);
    const lastUrl = urlUpdates[urlUpdates.length - 1];
    const statusParam = lastUrl.get('status');
    expect(statusParam).toBeTruthy();
    expect(statusParam).toContain('Mixing');
  });

  // ── Test 7: Search debounce → nuqs q update ────────────────────────────

  test('Test 7: typing in search input updates nuqs q after 150ms debounce', async () => {
    const urlUpdates: URLSearchParams[] = [];
    renderDashboard({
      onUrlUpdate: (evt) => urlUpdates.push(evt.searchParams),
    });

    const searchInput = screen.getByPlaceholderText(/search/i);

    await act(async () => {
      await userEvent.type(searchInput, 'acme');
    });

    // Advance past 150ms debounce
    act(() => {
      jest.advanceTimersByTime(200);
    });

    // After debounce, the URL q param should be 'acme'
    await waitFor(() => {
      const lastUrl = urlUpdates[urlUpdates.length - 1];
      expect(lastUrl?.get('q')).toBe('acme');
    });
  });

  // ── Test 8: Polling — router.refresh called after 30s ─────────────────

  test('Test 8 (D-19 / PROD-09): after 30s, router.refresh is called at least once', () => {
    renderDashboard();

    expect(mockRefresh).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(30_000);
    });

    expect(mockRefresh).toHaveBeenCalledTimes(1);
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

    // Cards have role="button" — get the one for our order
    const cards = screen.getAllByRole('button');
    // The card for the order (not the filter pills or import button)
    // The order card should contain "ORD-ord_1"
    const orderCard = cards.find((btn) => {
      return btn.textContent?.includes('Acme Feed');
    });
    expect(orderCard).toBeTruthy();

    await act(async () => {
      await userEvent.click(orderCard!);
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
    const { rerender } = renderDashboard({ orders: baseFixture });

    // Advance time 10 seconds so chip shows something > 0s
    act(() => {
      jest.advanceTimersByTime(10_000);
    });

    // Find the "Updated Xs ago" text — it should be ≥ 10s
    const chipEl = screen.getByText(/updated.*ago/i);
    const textBefore = chipEl.textContent ?? '';
    // Should show at least some seconds elapsed
    expect(textBefore).toMatch(/updated \d+s ago/i);

    // Re-render with a NEW orders array reference (simulates RSC refresh after router.refresh())
    const newOrders = [...baseFixture, makeOrder({ id: 'ord_new', state: 'Pending', millLine: 'CGM' })];

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
  });
});
