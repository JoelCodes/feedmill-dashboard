import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CustomersList from '@/components/CustomersList';
import { CustomerWithStats } from '@/types/customer';

// Mock next/navigation: CustomersList is a pure client component (not a page),
// so a local minimal mock is appropriate. The 28-01 clerkAuth fixture is only
// for page-level RSC tests that touch `@clerk/nextjs/server`.
const mockRouter = { push: jest.fn() };
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => mockRouter),
  usePathname: jest.fn(() => '/demo/customers'),
}));

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

describe('CustomersList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the first customer name synchronously when given customers prop', () => {
    render(<CustomersList customers={mockCustomers} />);

    // No `waitFor` — data arrives via prop, so render is synchronous.
    expect(screen.getByText('Greenfield Farms')).toBeInTheDocument();
    expect(screen.getByText('Valley Ranch')).toBeInTheDocument();
    expect(screen.getByText('Highland Feed')).toBeInTheDocument();
  });

  it('renders empty state ("No customers found") when customers is an empty array', () => {
    render(<CustomersList customers={[]} />);

    // One "No customers found" element: the visible <EmptyState>. The
    // sr-only aria-live region announces "Search returned no results"
    // (IN-01: two distinct phrases for the two distinct UI concerns).
    const noCustomersElements = screen.getAllByText('No customers found');
    expect(noCustomersElements.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Try adjusting your search/)).toBeInTheDocument();
  });

  it('filters customers by name (case-insensitive substring) after debounced search input', async () => {
    const user = userEvent.setup();
    render(<CustomersList customers={mockCustomers} />);

    // All three initially visible.
    expect(screen.getByText('Greenfield Farms')).toBeInTheDocument();
    expect(screen.getByText('Valley Ranch')).toBeInTheDocument();

    // Type 'green' (lower-case) — should match 'Greenfield Farms' (case-insensitive).
    const searchInput = screen.getByPlaceholderText('Search customers by name...');
    await user.type(searchInput, 'green');

    // 300ms debounce — give it room to flush.
    await waitFor(
      () => {
        expect(screen.getByText('Greenfield Farms')).toBeInTheDocument();
        expect(screen.queryByText('Valley Ranch')).not.toBeInTheDocument();
        expect(screen.queryByText('Highland Feed')).not.toBeInTheDocument();
      },
      { timeout: 500 },
    );
  });

  it('calls router.push with /demo/customers/<id> when a customer row is clicked', async () => {
    const user = userEvent.setup();
    render(<CustomersList customers={mockCustomers} />);

    // Click the Greenfield Farms row (CUST-001).
    const customerRow = screen.getByText('Greenfield Farms').closest('[data-customer-id]');
    expect(customerRow).not.toBeNull();
    await user.click(customerRow!);

    expect(mockRouter.push).toHaveBeenCalledWith('/demo/customers/CUST-001');
  });

  it('renders status indicators (status-orders / status-bin-low / status-changes) per customer stats', () => {
    render(<CustomersList customers={mockCustomers} />);

    // Greenfield Farms — activeOrders=2 → status-orders indicator visible with count.
    const greenfieldRow = screen.getByText('Greenfield Farms').closest('[data-customer-id]');
    const ordersIndicator = greenfieldRow?.querySelector('[data-testid="status-orders"]');
    expect(ordersIndicator).toBeInTheDocument();
    const orderCount = greenfieldRow?.querySelector('[data-testid="order-count"]');
    expect(orderCount).toHaveTextContent('2');

    // Valley Ranch — hasChanges=true → red dot; binAlertLevel='low' → yellow alert triangle.
    const valleyRow = screen.getByText('Valley Ranch').closest('[data-customer-id]');
    expect(valleyRow?.querySelector('[data-testid="status-changes"]')).toBeInTheDocument();
    expect(valleyRow?.querySelector('[data-testid="status-bin-low"]')).toBeInTheDocument();

    // Highland Feed — activeOrders=0 (no orders indicator); binAlertLevel='critical' → red alert.
    const highlandRow = screen.getByText('Highland Feed').closest('[data-customer-id]');
    expect(highlandRow?.querySelector('[data-testid="status-orders"]')).not.toBeInTheDocument();
    expect(highlandRow?.querySelector('[data-testid="status-bin-critical"]')).toBeInTheDocument();
  });
});
