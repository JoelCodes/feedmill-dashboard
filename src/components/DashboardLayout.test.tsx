import { render, screen } from "@testing-library/react";
import DashboardLayout from "./DashboardLayout";

// Mock next/navigation since Sidebar and Header use usePathname
jest.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
  }),
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

// Mock @clerk/nextjs components used by Header
jest.mock("@clerk/nextjs", () => ({
  ClerkLoaded: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="clerk-loaded">{children}</div>
  ),
  ClerkLoading: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="clerk-loading">{children}</div>
  ),
  UserButton: () => <div data-testid="user-button">User</div>,
}));

// Mock services used by Header
jest.mock("@/services/notifications", () => ({
  getNotifications: jest.fn().mockResolvedValue([]),
}));

// Mock useProductionPolling to avoid live router.refresh intervals in layout tests
jest.mock('@/hooks/useProductionPolling', () => ({
  useProductionPolling: jest.fn(),
}));

// Mock ProductionDrawer to avoid pulling in server-action dependencies
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

// Mock KpiStrip + KpiSection to avoid DB query imports in the integration test
jest.mock('./KpiStrip', () => ({
  __esModule: true,
  default: () => {
    const React = require('react');
    return React.createElement('div', { 'aria-label': 'KPI summary strip', 'data-testid': 'kpi-strip' }, 'KpiStrip');
  },
  KpiStripSkeleton: () => {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'kpi-strip-skeleton' }, 'KpiStripSkeleton');
  },
}));

jest.mock('./KpiSection', () => ({
  __esModule: true,
  default: () => {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'kpi-section' }, 'KpiSection');
  },
  KpiSectionSkeleton: () => {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'kpi-section-skeleton' }, 'KpiSectionSkeleton');
  },
}));

describe("DashboardLayout", () => {
  it("renders children", () => {
    render(
      <DashboardLayout>
        <div data-testid="child">Test content</div>
      </DashboardLayout>
    );

    expect(screen.getByTestId("child")).toBeInTheDocument();
    expect(screen.getByText("Test content")).toBeInTheDocument();
  });

  it("renders Sidebar component", () => {
    render(
      <DashboardLayout>
        <div>Content</div>
      </DashboardLayout>
    );

    // Sidebar renders an aside element with the logo text
    expect(screen.getByText("FEEDMILL PRO")).toBeInTheDocument();
    expect(screen.getByRole("complementary")).toBeInTheDocument();
  });

  it("renders Header component", () => {
    render(
      <DashboardLayout>
        <div>Content</div>
      </DashboardLayout>
    );

    // Header renders a header element with page title and search
    expect(screen.getByRole("banner")).toBeInTheDocument();
    // Use heading role to find the page title in Header
    // Note: "/" now shows "Dashboard" after Phase 34 production nav update (D-24)
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Dashboard");
  });

  it("has correct layout structure", () => {
    const { container } = render(
      <DashboardLayout>
        <div>Content</div>
      </DashboardLayout>
    );

    // Outer div has flex and h-screen classes
    const outerDiv = container.firstChild as HTMLElement;
    expect(outerDiv).toHaveClass("flex");
    expect(outerDiv).toHaveClass("h-screen");
  });
});

// ── Integration regression: T3 gap closure ──────────────────────────────────
//
// These tests render DashboardLayout + ProductionDashboard together to exercise
// the full `/` route DOM and catch layout-level duplicate-input bugs that
// standalone-component tests cannot observe.
//
// Previously: Header had a dead `type="text"` search input (placeholder "Type here...")
// that was never wired to URL state. ProductionDashboard has the real URL-syncing
// `type="search"` input (placeholder "Search orders..."). Rendering both in isolation
// missed the duplication; this test catches it.

import React from 'react';
import { act, fireEvent, waitFor } from '@testing-library/react';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import ProductionDashboard from './ProductionDashboard';
import type { ProductionOrder } from '@/db/schema/orders';
import type { OrderEvent } from '@/db/schema/events';
import type { KpiStripData, TrendDay, BlockedOrderWithDwell } from '@/db/queries/kpis';

const emptyOrders: ProductionOrder[] = [];
const emptyEvents: OrderEvent[] = [];

// KPI fixtures — minimal values for integration test (KPI components are mocked)
const kpiStripFixture: KpiStripData = {
  completedTodayLbs: '0', premixLbs: '0', excelLbs: '0', cgmLbs: '0',
  pendingCount: 0, pendingLbs: '0', pelletPct: null, mashPct: null,
  crumblePct: null, uncategorizedCount: 0,
};
const trendFixture: TrendDay[] = [];
const exceptionsFixture: BlockedOrderWithDwell[] = [];

describe('DashboardLayout + ProductionDashboard integration (T3 gap closure)', () => {
  it('renders exactly one searchbox on the `/` route', () => {
    render(
      <NuqsTestingAdapter>
        <DashboardLayout>
          <ProductionDashboard
            orders={emptyOrders}
            canEdit={false}
            drawerOrder={null}
            drawerEvents={emptyEvents}
            kpiStrip={kpiStripFixture}
            kpiTrend={trendFixture}
            kpiBlocked={exceptionsFixture}
          />
        </DashboardLayout>
      </NuqsTestingAdapter>
    );

    const searchboxes = screen.getAllByRole('searchbox');
    expect(searchboxes).toHaveLength(1);
    expect(searchboxes[0]).toHaveAttribute('placeholder', 'Search orders...');
  });

  it('the surviving searchbox writes ?q to the URL via nuqs', async () => {
    jest.useFakeTimers();
    try {
      const urlUpdates: URLSearchParams[] = [];

      render(
        <NuqsTestingAdapter onUrlUpdate={(evt) => urlUpdates.push(evt.searchParams)}>
          <DashboardLayout>
            <ProductionDashboard
              orders={emptyOrders}
              canEdit={false}
              drawerOrder={null}
              drawerEvents={emptyEvents}
              kpiStrip={kpiStripFixture}
              kpiTrend={trendFixture}
              kpiBlocked={exceptionsFixture}
            />
          </DashboardLayout>
        </NuqsTestingAdapter>
      );

      const input = screen.getByPlaceholderText('Search orders...');

      // Type into the search field via fireEvent (compatible with fake timers)
      fireEvent.change(input, { target: { value: 'acme' } });

      // Advance past 150ms debounce window (ProductionDashboard uses 150ms)
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
});
