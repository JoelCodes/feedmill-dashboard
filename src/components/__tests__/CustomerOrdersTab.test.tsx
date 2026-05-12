import { render, screen } from '@testing-library/react';
import CustomerOrdersTab from '../CustomerOrdersTab';
import { Order } from '@/types/order';

// MockLink pattern — VERBATIM from Timeline.test.tsx lines 8–14 (D-08 locked)
jest.mock('next/link', () => {
  const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
  MockLink.displayName = 'MockLink';
  return MockLink;
});

// Inline mock Order — matches OrdersTable.test.tsx pattern (lines 5–51); single-element
// fixture so getByRole('link') is unambiguous (D-09 minimal scope).
const mockOrders: Order[] = [
  {
    id: 'order-1',
    documentNumber: '12345',
    customer: 'Test Farm',
    customerId: 'CUST-001',
    textureType: 'Coarse',
    formulaType: 'Grower',
    quantity: 10,
    location: 'Springfield, IL',
    deliveryDate: new Date('2026-05-15'),
    status: 'Producing',
    hasChanges: false,
    createdAt: new Date('2026-05-01'),
    updatedAt: new Date('2026-05-01'),
  },
];

describe('CustomerOrdersTab', () => {
  it('renders order row link with /demo/orders?selected=<id> href', () => {
    render(<CustomerOrdersTab orders={mockOrders} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/demo/orders?selected=order-1');
  });
});
