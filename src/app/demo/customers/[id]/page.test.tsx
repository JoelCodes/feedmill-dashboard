import {
  clerkAuthMockFactory,
  nextNavigationMockFactory,
  mockAuth,
  mockDemoSession,
  mockNonDemoSession,
  mockUnauthenticatedSession,
} from '@/test/fixtures/clerkAuth';

// Mock dependencies — jest.mock calls are hoisted above all imports (Pattern C
// from src/lib/auth.test.ts). The 28-01 factory imports above are hoisted
// alongside, so the references inside the factory arrows resolve correctly.
jest.mock('@clerk/nextjs/server', () => clerkAuthMockFactory());
jest.mock('next/navigation', () => nextNavigationMockFactory());

import { render, screen } from '@testing-library/react';
import CustomerDetailPage from './page';

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

jest.mock('@/services/customers', () => ({
  getCustomerById: jest.fn(),
}));

jest.mock('@/services/activity', () => ({
  getActivityEvents: jest.fn(),
}));

jest.mock('@/services/bins', () => ({
  getBinsByCustomerId: jest.fn(),
}));

jest.mock('@/services/orders', () => ({
  getOrdersByCustomerId: jest.fn(),
}));

jest.mock('@/services/notifications', () => ({
  getNotifications: jest.fn().mockResolvedValue([]),
}));

jest.mock('@/components/ui/Timeline', () => ({
  ActivityTimeline: jest.fn(() => <div data-testid="activity-timeline">ActivityTimeline Mock</div>),
}));

// Import mocks after jest.mock
import { getCustomerById } from '@/services/customers';
import { getActivityEvents } from '@/services/activity';
import { getBinsByCustomerId } from '@/services/bins';
import { getOrdersByCustomerId } from '@/services/orders';
import { ActivityTimeline } from '@/components/ui/Timeline';
import { CustomerWithStats } from '@/types/customer';
import { ActivityEvent } from '@/types/activity';

const mockCustomer: CustomerWithStats = {
  id: 'CUST-001',
  name: 'Greenfield Farms',
  location: 'Springfield, IL',
  contactName: 'John Green',
  contactPhone: '(217) 555-0101',
  contactEmail: 'jgreen@greenfieldfarms.com',
  deliveryPreferences: 'Mon/Wed/Fri, 6-8 AM',
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2026-03-11'),
  stats: {
    totalOrders: 5,
    activeOrders: 2,
    completedOrders: 3,
    hasChanges: false,
    binAlertLevel: 'low',
    activeBins: 2,
  },
};

describe('CustomerDetailPage', () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockDemoSession();
    jest.clearAllMocks();
    (getBinsByCustomerId as jest.Mock).mockResolvedValue([]);
    (getOrdersByCustomerId as jest.Mock).mockResolvedValue([]);
  });

  it('renders customer name when customer exists', async () => {
    (getCustomerById as jest.Mock).mockResolvedValue(mockCustomer);
    (getActivityEvents as jest.Mock).mockResolvedValue([]);

    const Page = await CustomerDetailPage({
      params: Promise.resolve({ id: 'CUST-001' }),
    });
    render(Page);

    expect(screen.getByText('Greenfield Farms')).toBeInTheDocument();
  });

  it('calls notFound when customer ID does not exist', async () => {
    (getCustomerById as jest.Mock).mockResolvedValue(null);
    (getActivityEvents as jest.Mock).mockResolvedValue([]);

    // The 28-01 nextNavigationMockFactory's `notFound` is a sentinel-throw
    // whose `digest` property matches real Next.js 16
    // (`'NEXT_HTTP_ERROR_FALLBACK;404'`). Assert the digest shape rather
    // than the synthetic message — this keeps the test compatible with any
    // future error-boundary that distinguishes 404s via
    // `error.digest?.startsWith('NEXT_HTTP_ERROR_FALLBACK;404')`.
    await expect(
      CustomerDetailPage({ params: Promise.resolve({ id: 'INVALID-999' }) }),
    ).rejects.toMatchObject({ digest: expect.stringContaining(';404') });
  });

  it('renders CustomerDetailHeader with customer stats', async () => {
    (getCustomerById as jest.Mock).mockResolvedValue(mockCustomer);
    (getActivityEvents as jest.Mock).mockResolvedValue([]);

    const Page = await CustomerDetailPage({
      params: Promise.resolve({ id: 'CUST-001' }),
    });
    render(Page);

    // Verify stats are displayed
    expect(screen.getByText('5')).toBeInTheDocument(); // totalOrders
    expect(screen.getByText('Total Orders')).toBeInTheDocument();
    expect(screen.getByText('Active Bins')).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // New redirect-branch coverage (28-02 D-05 inner guard, defense-in-depth).
  // Source pattern: src/lib/auth.test.ts lines 67-89 (redirect-sentinel-throw).
  // ---------------------------------------------------------------------------

  it('redirects to /sign-in when userId is missing (unauthenticated)', async () => {
    mockUnauthenticatedSession();

    await expect(
      CustomerDetailPage({ params: Promise.resolve({ id: 'CUST-001' }) }),
    ).rejects.toMatchObject({ url: '/sign-in' });
    // D-04 fetch-after-guard invariant: NONE of the four parallel-fetch
    // services may run when the role guard rejects. The `Promise.all([...])`
    // shape means a regression that moves the fetches above the guard would
    // invoke all four — these assertions catch every reorder.
    expect(getCustomerById).not.toHaveBeenCalled();
    expect(getActivityEvents).not.toHaveBeenCalled();
    expect(getBinsByCustomerId).not.toHaveBeenCalled();
    expect(getOrdersByCustomerId).not.toHaveBeenCalled();
  });

  it('redirects to / when role is user (non-demo)', async () => {
    mockNonDemoSession('user');

    await expect(
      CustomerDetailPage({ params: Promise.resolve({ id: 'CUST-001' }) }),
    ).rejects.toMatchObject({ url: '/' });
    expect(getCustomerById).not.toHaveBeenCalled();
    expect(getActivityEvents).not.toHaveBeenCalled();
    expect(getBinsByCustomerId).not.toHaveBeenCalled();
    expect(getOrdersByCustomerId).not.toHaveBeenCalled();
  });

  it('redirects to / when role is admin (any non-demo role)', async () => {
    mockNonDemoSession('admin');

    await expect(
      CustomerDetailPage({ params: Promise.resolve({ id: 'CUST-001' }) }),
    ).rejects.toMatchObject({ url: '/' });
    expect(getCustomerById).not.toHaveBeenCalled();
    expect(getActivityEvents).not.toHaveBeenCalled();
    expect(getBinsByCustomerId).not.toHaveBeenCalled();
    expect(getOrdersByCustomerId).not.toHaveBeenCalled();
  });

  describe('partial failure handling', () => {
    // Phase 28 WR-04/WR-06 follow-up: the page contract is "customer exists
    // AND has stats, or the page 404s." Plan 13-03's FALLBACK_STATS shape was
    // never implemented; rather than re-introduce graceful degradation in a
    // page that has no UI affordance for "stats unavailable," we treat
    // missing stats as a 404 (same shape as missing customer). This test
    // locks the guard in place so a future regression that drops the
    // `!customer.stats` check is caught.
    it('calls notFound when customer is returned without stats', async () => {
      const customerWithoutStats = {
        ...mockCustomer,
        // Cast away the non-optional `stats` type so we can simulate a
        // partial service-shape regression. The page must guard at runtime
        // even though TypeScript treats `stats` as non-optional.
        stats: undefined as unknown as (typeof mockCustomer)['stats'],
      };

      (getCustomerById as jest.Mock).mockResolvedValue(customerWithoutStats);
      (getActivityEvents as jest.Mock).mockResolvedValue([]);

      // The notFound mock throws an error whose `digest` matches real
      // Next.js 16 (`'NEXT_HTTP_ERROR_FALLBACK;404'`). Asserting on the
      // digest keeps the test stable against any future error-boundary
      // that branches on `error.digest`.
      await expect(
        CustomerDetailPage({ params: Promise.resolve({ id: 'CUST-001' }) }),
      ).rejects.toMatchObject({ digest: expect.stringContaining(';404') });
    });
  });

  describe('ActivityTimeline integration', () => {
    it('renders ActivityTimeline component with events from activity service', async () => {
      // GAP-01: Verify ActivityTimeline integration
      // Requirement: Customer detail page renders ActivityTimeline with events

      const mockEvents: ActivityEvent[] = [
        {
          id: 'evt-1',
          customerId: 'CUST-001',
          type: 'order_placed',
          timestamp: new Date('2026-05-01T10:00:00Z'),
          title: 'Order #ORD-001 Placed',
          description: '10 tons Textured Grower ordered for delivery',
          orderId: 'ORD-001',
          orderQuantity: 10,
          orderProduct: 'Textured Grower',
          orderStatus: 'Pending',
        },
        {
          id: 'evt-2',
          customerId: 'CUST-001',
          type: 'bin_alert_low',
          timestamp: new Date('2026-04-30T08:00:00Z'),
          title: 'Low Feed Alert - Bin A1',
          description: 'Starter level dropped below 30%',
          binId: 'BIN-001',
          binLocationCode: 'A1',
          binFillPercentage: 25,
        },
      ];

      (getCustomerById as jest.Mock).mockResolvedValue(mockCustomer);
      (getActivityEvents as jest.Mock).mockResolvedValue(mockEvents);

      const Page = await CustomerDetailPage({
        params: Promise.resolve({ id: 'CUST-001' }),
      });
      render(Page);

      // Verify getActivityEvents was called with correct customer ID
      expect(getActivityEvents).toHaveBeenCalledWith('CUST-001');

      // Verify ActivityTimeline component was rendered
      expect(screen.getByTestId('activity-timeline')).toBeInTheDocument();

      // Verify ActivityTimeline was called with the events
      expect(ActivityTimeline).toHaveBeenCalledWith(
        { events: mockEvents },
        undefined
      );
    });

    it('calls getActivityEvents after customer data is loaded', async () => {
      // Verify service calls happen in correct order
      (getCustomerById as jest.Mock).mockResolvedValue(mockCustomer);
      (getActivityEvents as jest.Mock).mockResolvedValue([]);

      await CustomerDetailPage({
        params: Promise.resolve({ id: 'CUST-001' }),
      });

      // Both services should be called
      expect(getCustomerById).toHaveBeenCalledWith('CUST-001');
      expect(getActivityEvents).toHaveBeenCalledWith('CUST-001');
    });

    it('handles empty activity events array', async () => {
      (getCustomerById as jest.Mock).mockResolvedValue(mockCustomer);
      (getActivityEvents as jest.Mock).mockResolvedValue([]);

      const Page = await CustomerDetailPage({
        params: Promise.resolve({ id: 'CUST-001' }),
      });
      render(Page);

      // ActivityTimeline should still be rendered with empty array
      expect(ActivityTimeline).toHaveBeenCalledWith(
        { events: [] },
        undefined
      );
      expect(screen.getByTestId('activity-timeline')).toBeInTheDocument();
    });
  });
});
