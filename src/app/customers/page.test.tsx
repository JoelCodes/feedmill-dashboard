import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CustomersPage from './page';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
  usePathname: jest.fn(() => '/customers'),
}));

jest.mock('@/services/customers', () => ({
  getCustomers: jest.fn(),
}));

jest.mock('@/utils/customerSort', () => ({
  sortCustomersByRecentActivity: jest.fn((customers) => customers),
}));

// Import mocks after jest.mock
import { useRouter } from 'next/navigation';
import { getCustomers } from '@/services/customers';
import { sortCustomersByRecentActivity } from '@/utils/customerSort';
import { CustomerWithStats } from '@/types/customer';

const mockRouter = { push: jest.fn() };

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
    },
  },
];

describe('CustomersPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (getCustomers as jest.Mock).mockResolvedValue(mockCustomers);
  });

  it('renders search input with placeholder "Search customers by name..."', async () => {
    render(<CustomersPage />);

    const searchInput = screen.getByPlaceholderText('Search customers by name...');
    expect(searchInput).toBeInTheDocument();
  });

  it('renders customer names from getCustomers() service', async () => {
    render(<CustomersPage />);

    await waitFor(() => {
      expect(screen.getByText('Greenfield Farms')).toBeInTheDocument();
      expect(screen.getByText('Valley Ranch')).toBeInTheDocument();
      expect(screen.getByText('Highland Feed')).toBeInTheDocument();
    });
  });

  it('filters customers by name when search term entered (case-insensitive)', async () => {
    const user = userEvent.setup();
    render(<CustomersPage />);

    // Wait for customers to load
    await waitFor(() => {
      expect(screen.getByText('Greenfield Farms')).toBeInTheDocument();
    });

    // Type in search box
    const searchInput = screen.getByPlaceholderText('Search customers by name...');
    await user.type(searchInput, 'green');

    // Wait for debounce
    await waitFor(() => {
      expect(screen.getByText('Greenfield Farms')).toBeInTheDocument();
      expect(screen.queryByText('Valley Ranch')).not.toBeInTheDocument();
      expect(screen.queryByText('Highland Feed')).not.toBeInTheDocument();
    }, { timeout: 500 });
  });

  it('shows Package icon with numeric count when stats.activeOrders > 0', async () => {
    render(<CustomersPage />);

    await waitFor(() => {
      // Greenfield Farms has activeOrders = 2
      const greenfield = screen.getByText('Greenfield Farms').closest('div')?.parentElement;
      const ordersIndicator = greenfield?.querySelector('[data-testid="status-orders"]');
      expect(ordersIndicator).toBeInTheDocument();

      // Verify numeric count is displayed
      const orderCount = greenfield?.querySelector('[data-testid="order-count"]');
      expect(orderCount).toBeInTheDocument();
      expect(orderCount).toHaveTextContent('2');

      // Highland Feed has activeOrders = 0 — no indicator
      const highland = screen.getByText('Highland Feed').closest('div')?.parentElement;
      const noOrdersIndicator = highland?.querySelector('[data-testid="status-orders"]');
      expect(noOrdersIndicator).not.toBeInTheDocument();
    });
  });

  it('shows red dot when stats.hasChanges is true', async () => {
    render(<CustomersPage />);

    await waitFor(() => {
      // Valley Ranch has hasChanges = true
      const valley = screen.getByText('Valley Ranch').closest('div')?.parentElement;
      const redDot = valley?.querySelector('[data-testid="status-changes"]');
      expect(redDot).toBeInTheDocument();

      // Greenfield Farms has hasChanges = false
      const greenfield = screen.getByText('Greenfield Farms').closest('div')?.parentElement;
      const noDot = greenfield?.querySelector('[data-testid="status-changes"]');
      expect(noDot).not.toBeInTheDocument();
    });
  });

  it('shows yellow AlertTriangle when stats.binAlertLevel is "low"', async () => {
    render(<CustomersPage />);

    await waitFor(() => {
      // Valley Ranch has binAlertLevel = 'low'
      const valley = screen.getByText('Valley Ranch').closest('div')?.parentElement;
      const yellowAlert = valley?.querySelector('[data-testid="status-bin-low"]');
      expect(yellowAlert).toBeInTheDocument();
    });
  });

  it('shows red AlertTriangle when stats.binAlertLevel is "critical"', async () => {
    render(<CustomersPage />);

    await waitFor(() => {
      // Highland Feed has binAlertLevel = 'critical'
      const highland = screen.getByText('Highland Feed').closest('div')?.parentElement;
      const redAlert = highland?.querySelector('[data-testid="status-bin-critical"]');
      expect(redAlert).toBeInTheDocument();
    });
  });

  it('shows skeleton rows when loading (5 skeleton rows)', async () => {
    // Make getCustomers hang to test loading state
    (getCustomers as jest.Mock).mockImplementation(() => new Promise(() => {}));

    render(<CustomersPage />);

    const skeletons = screen.getAllByTestId('skeleton-row');
    expect(skeletons).toHaveLength(5);
  });

  it('shows empty state when no customers match search', async () => {
    const user = userEvent.setup();
    render(<CustomersPage />);

    // Wait for customers to load
    await waitFor(() => {
      expect(screen.getByText('Greenfield Farms')).toBeInTheDocument();
    });

    // Search for something that doesn't exist
    const searchInput = screen.getByPlaceholderText('Search customers by name...');
    await user.type(searchInput, 'xyz');

    // Wait for debounce
    await waitFor(() => {
      expect(screen.getByText('No customers found')).toBeInTheDocument();
      expect(screen.getByText(/Try adjusting your search/)).toBeInTheDocument();
    }, { timeout: 500 });
  });

  it('calls router.push with customer ID when row clicked', async () => {
    render(<CustomersPage />);

    await waitFor(() => {
      expect(screen.getByText('Greenfield Farms')).toBeInTheDocument();
    });

    // Click the customer row
    const customerRow = screen.getByText('Greenfield Farms').closest('[data-customer-id]');
    fireEvent.click(customerRow!);

    expect(mockRouter.push).toHaveBeenCalledWith('/customers/CUST-001');
  });
});
