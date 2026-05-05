import { render, screen } from '@testing-library/react';
import CustomerDetailHeader from './CustomerDetailHeader';
import { Customer, CustomerStats } from '@/types/customer';

const mockCustomer: Customer = {
  id: 'CUST-001',
  name: 'Greenfield Farms',
  location: 'Springfield, IL',
  contactName: 'John Green',
  contactPhone: '(217) 555-0101',
  contactEmail: 'jgreen@greenfieldfarms.com',
  deliveryPreferences: 'Mon/Wed/Fri, 6-8 AM',
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2026-03-11'),
};

const mockStats: CustomerStats = {
  totalOrders: 5,
  activeOrders: 2,
  completedOrders: 3,
  hasChanges: false,
  binAlertLevel: 'low',
  activeBins: 2,
};

describe('CustomerDetailHeader', () => {
  it('renders customer name in text-xl font-bold', () => {
    render(<CustomerDetailHeader customer={mockCustomer} stats={mockStats} />);

    const customerName = screen.getByText('Greenfield Farms');
    expect(customerName).toBeInTheDocument();
    expect(customerName).toHaveClass('text-xl');
    expect(customerName).toHaveClass('font-bold');
  });

  it('renders location with MapPin icon', () => {
    render(<CustomerDetailHeader customer={mockCustomer} stats={mockStats} />);

    expect(screen.getByText('Springfield, IL')).toBeInTheDocument();
    expect(screen.getByTestId('icon-map-pin')).toBeInTheDocument();
  });

  it('renders phone with Phone icon when contactPhone present', () => {
    render(<CustomerDetailHeader customer={mockCustomer} stats={mockStats} />);

    expect(screen.getByText('(217) 555-0101')).toBeInTheDocument();
    expect(screen.getByTestId('icon-phone')).toBeInTheDocument();
  });

  it('does not render phone row when contactPhone is undefined', () => {
    const customerWithoutPhone = { ...mockCustomer, contactPhone: undefined };
    render(<CustomerDetailHeader customer={customerWithoutPhone} stats={mockStats} />);

    expect(screen.queryByTestId('icon-phone')).not.toBeInTheDocument();
  });

  it('renders email with Mail icon when contactEmail present', () => {
    render(<CustomerDetailHeader customer={mockCustomer} stats={mockStats} />);

    expect(screen.getByText('jgreen@greenfieldfarms.com')).toBeInTheDocument();
    expect(screen.getByTestId('icon-mail')).toBeInTheDocument();
  });

  it('does not render email row when contactEmail is undefined', () => {
    const customerWithoutEmail = { ...mockCustomer, contactEmail: undefined };
    render(<CustomerDetailHeader customer={customerWithoutEmail} stats={mockStats} />);

    expect(screen.queryByTestId('icon-mail')).not.toBeInTheDocument();
  });

  it('renders delivery preferences in accent color when present', () => {
    render(<CustomerDetailHeader customer={mockCustomer} stats={mockStats} />);

    const deliveryText = screen.getByText(/Delivery: Mon\/Wed\/Fri, 6-8 AM/);
    expect(deliveryText).toBeInTheDocument();
  });

  it('does not render delivery row when deliveryPreferences is undefined', () => {
    const customerWithoutDelivery = { ...mockCustomer, deliveryPreferences: undefined };
    render(<CustomerDetailHeader customer={customerWithoutDelivery} stats={mockStats} />);

    expect(screen.queryByText(/Delivery:/)).not.toBeInTheDocument();
  });

  it('renders "Total Orders" stat with stats.totalOrders value', () => {
    render(<CustomerDetailHeader customer={mockCustomer} stats={mockStats} />);

    expect(screen.getByText('Total Orders')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('renders "Active Bins" stat with stats.activeBins value', () => {
    render(<CustomerDetailHeader customer={mockCustomer} stats={mockStats} />);

    expect(screen.getByText('Active Bins')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('renders "Recent Activity" stat with placeholder dash', () => {
    render(<CustomerDetailHeader customer={mockCustomer} stats={mockStats} />);

    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
