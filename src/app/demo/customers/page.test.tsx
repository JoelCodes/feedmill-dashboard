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
import CustomersPage from './page';

// Mock @clerk/nextjs components used by Header
jest.mock('@clerk/nextjs', () => ({
  ClerkLoaded: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="clerk-loaded">{children}</div>
  ),
  ClerkLoading: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="clerk-loading">{children}</div>
  ),
  UserButton: () => <div data-testid="user-button">User</div>,
}));

jest.mock('@/services/customers', () => ({
  getCustomers: jest.fn(),
}));

jest.mock('@/services/notifications', () => ({
  getNotifications: jest.fn().mockResolvedValue([]),
}));

// Mock sortCustomersByRecentActivity as a pass-through. Sort now runs server-side
// in the RSC; we assert it was called once with the fetched customers, but the
// page tests don't need to re-validate the sort algorithm (that's the
// customerSort.test.ts contract).
jest.mock('@/utils/customerSort', () => ({
  sortCustomersByRecentActivity: jest.fn((customers) => customers),
}));

// Import mocks after jest.mock
import { getCustomers } from '@/services/customers';
import { sortCustomersByRecentActivity } from '@/utils/customerSort';
import { CustomerWithStats } from '@/types/customer';

const mockCustomers: CustomerWithStats[] = [
  {
    id: 'CUST-001',
    name: 'Greenfield Farms',
    location: 'Dallas, TX',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    stats: {
      totalOrders: 5,
      activeOrders: 2,
      completedOrders: 3,
      hasChanges: false,
      binAlertLevel: 'none',
      activeBins: 0,
    },
  },
  {
    id: 'CUST-002',
    name: 'Valley Ranch',
    location: 'Austin, TX',
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
    stats: {
      totalOrders: 3,
      activeOrders: 1,
      completedOrders: 2,
      hasChanges: true,
      binAlertLevel: 'low',
      activeBins: 1,
    },
  },
  {
    id: 'CUST-003',
    name: 'Highland Feed',
    location: 'Houston, TX',
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-03'),
    stats: {
      totalOrders: 8,
      activeOrders: 0,
      completedOrders: 8,
      hasChanges: false,
      binAlertLevel: 'critical',
      activeBins: 1,
    },
  },
];

describe('CustomersPage (async RSC)', () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockDemoSession();
    jest.clearAllMocks();
    (getCustomers as jest.Mock).mockResolvedValue(mockCustomers);
  });

  // ---------------------------------------------------------------------------
  // Redirect-branch coverage (D-05 inner guard, defense-in-depth).
  // Mirrors src/app/demo/customers/[id]/page.test.tsx pattern.
  // ---------------------------------------------------------------------------

  it('redirects to /sign-in when userId is missing (unauthenticated)', async () => {
    mockUnauthenticatedSession();

    await expect(CustomersPage()).rejects.toMatchObject({ url: '/sign-in' });
  });

  it('redirects to / when role is user (non-demo)', async () => {
    mockNonDemoSession('user');

    await expect(CustomersPage()).rejects.toMatchObject({ url: '/' });
  });

  it('redirects to / when role is admin (any non-demo role)', async () => {
    mockNonDemoSession('admin');

    await expect(CustomersPage()).rejects.toMatchObject({ url: '/' });
  });

  // ---------------------------------------------------------------------------
  // Render-path coverage: the RSC fetches, sorts, and passes data to
  // <CustomersList>. Detailed search/click/status-indicator behavior is
  // covered in src/components/__tests__/CustomersList.test.tsx — assertions
  // here verify the data-flow contract only.
  // ---------------------------------------------------------------------------

  it('renders the search input wired by CustomersList for demo users', async () => {
    const element = await CustomersPage();
    render(element);

    expect(screen.getByPlaceholderText('Search customers by name...')).toBeInTheDocument();
  });

  it('renders customer names returned by the getCustomers service', async () => {
    const element = await CustomersPage();
    render(element);

    expect(screen.getByText('Greenfield Farms')).toBeInTheDocument();
    expect(screen.getByText('Valley Ranch')).toBeInTheDocument();
    expect(screen.getByText('Highland Feed')).toBeInTheDocument();
  });

  it('calls getCustomers exactly once during the RSC render', async () => {
    await CustomersPage();

    expect(getCustomers).toHaveBeenCalledTimes(1);
  });

  it('calls sortCustomersByRecentActivity exactly once with the fetched customers', async () => {
    await CustomersPage();

    expect(sortCustomersByRecentActivity).toHaveBeenCalledTimes(1);
    expect(sortCustomersByRecentActivity).toHaveBeenCalledWith(mockCustomers);
  });

  it('renders the visible status indicators handed off to CustomersList', async () => {
    const element = await CustomersPage();
    render(element);

    // Verify the rendered DOM still surfaces status indicators (i.e., that the
    // RSC successfully passed data to CustomersList — not a re-test of the
    // indicator logic, which lives in CustomersList.test.tsx).
    const greenfieldRow = screen.getByText('Greenfield Farms').closest('[data-customer-id]');
    expect(greenfieldRow?.querySelector('[data-testid="status-orders"]')).toBeInTheDocument();

    const valleyRow = screen.getByText('Valley Ranch').closest('[data-customer-id]');
    expect(valleyRow?.querySelector('[data-testid="status-bin-low"]')).toBeInTheDocument();
    expect(valleyRow?.querySelector('[data-testid="status-changes"]')).toBeInTheDocument();

    const highlandRow = screen.getByText('Highland Feed').closest('[data-customer-id]');
    expect(highlandRow?.querySelector('[data-testid="status-bin-critical"]')).toBeInTheDocument();
  });
});
