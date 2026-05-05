import { render, screen } from '@testing-library/react';
import CustomerDetailPage from './page';

// Mock dependencies
jest.mock('next/navigation', () => ({
  notFound: jest.fn(),
  usePathname: jest.fn(() => '/customers/CUST-001'),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
}));

jest.mock('@/services/customers', () => ({
  getCustomerById: jest.fn(),
}));

// Import mocks after jest.mock
import { notFound } from 'next/navigation';
import { getCustomerById } from '@/services/customers';
import { CustomerWithStats } from '@/types/customer';

const mockCustomer: CustomerWithStats = {
  id: 'CUST-001',
  name: 'Greenfield Farms',
  location: 'Springfield, IL',
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
    jest.clearAllMocks();
  });

  it('renders customer name when customer exists', async () => {
    (getCustomerById as jest.Mock).mockResolvedValue(mockCustomer);

    const Page = await CustomerDetailPage({
      params: Promise.resolve({ id: 'CUST-001' }),
    });
    render(Page);

    expect(screen.getByText('Greenfield Farms')).toBeInTheDocument();
  });

  it('calls notFound when customer ID does not exist', async () => {
    (getCustomerById as jest.Mock).mockResolvedValue(null);
    (notFound as jest.Mock).mockImplementation(() => {
      throw new Error('NEXT_NOT_FOUND');
    });

    await expect(async () => {
      await CustomerDetailPage({
        params: Promise.resolve({ id: 'INVALID-999' }),
      });
    }).rejects.toThrow('NEXT_NOT_FOUND');

    expect(notFound).toHaveBeenCalled();
  });

  it('renders CustomerDetailHeader with customer stats', async () => {
    (getCustomerById as jest.Mock).mockResolvedValue(mockCustomer);

    const Page = await CustomerDetailPage({
      params: Promise.resolve({ id: 'CUST-001' }),
    });
    render(Page);

    // Verify stats are displayed
    expect(screen.getByText('5')).toBeInTheDocument(); // totalOrders
    expect(screen.getByText('Total Orders')).toBeInTheDocument();
    expect(screen.getByText('Active Bins')).toBeInTheDocument();
  });
});
