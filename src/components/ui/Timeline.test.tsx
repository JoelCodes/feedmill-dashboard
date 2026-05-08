import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import userEvent from '@testing-library/user-event';
import { Timeline, ActivityTimeline } from './Timeline';
import { ActivityEvent } from '@/types/activity';

// Mock next/link
jest.mock('next/link', () => {
  const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
  MockLink.displayName = 'MockLink';
  return MockLink;
});

const mockEvents: ActivityEvent[] = [
  {
    id: '1',
    customerId: 'CUST-001',
    type: 'order_placed',
    title: 'Order Placed',
    description: 'Order #12345 placed',
    timestamp: new Date('2024-01-15T10:00:00'),
    orderId: 'order-1',
    orderQuantity: 100,
    orderProduct: 'Premium Feed',
    orderStatus: 'Pending'
  },
  {
    id: '2',
    customerId: 'CUST-001',
    type: 'delivered',
    title: 'Delivery Completed',
    description: 'Order #12344 delivered',
    timestamp: new Date('2024-01-14T14:00:00'),
  },
];

describe('Timeline', () => {
  // Existing behavior tests (adapted from ActivityTimeline.test.tsx)
  it('renders events', () => {
    render(<Timeline events={mockEvents} />);
    expect(screen.getByText('Order Placed')).toBeInTheDocument();
    expect(screen.getByText('Delivery Completed')).toBeInTheDocument();
  });

  it('shows empty state when no events', () => {
    render(<Timeline events={[]} />);
    expect(screen.getByText('No recent activity')).toBeInTheDocument();
  });

  it('expands event on click', async () => {
    const user = userEvent.setup();
    render(<Timeline events={mockEvents} />);
    const orderEvent = screen.getByRole('button', { name: 'Order Placed' });
    await user.click(orderEvent);
    expect(screen.getByText('Quantity: 100 tons')).toBeInTheDocument();
  });

  it('collapses event on second click', async () => {
    const user = userEvent.setup();
    render(<Timeline events={mockEvents} />);
    const orderEvent = screen.getByRole('button', { name: 'Order Placed' });
    await user.click(orderEvent);
    expect(screen.getByText('Quantity: 100 tons')).toBeInTheDocument();
    await user.click(orderEvent);
    expect(screen.queryByText('Quantity: 100 tons')).not.toBeInTheDocument();
  });

  it('has correct aria attributes', () => {
    render(<Timeline events={mockEvents} />);
    const button = screen.getByRole('button', { name: 'Order Placed' });
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('shows View Order Details link when expanded', async () => {
    const user = userEvent.setup();
    render(<Timeline events={mockEvents} />);
    const orderEvent = screen.getByRole('button', { name: 'Order Placed' });
    await user.click(orderEvent);
    const link = screen.getByRole('link', { name: /View Order Details/i });
    expect(link).toHaveAttribute('href', '/orders?selected=order-1');
  });

  // TOKEN USAGE TESTS
  describe('token verification', () => {
    it('uses CSS variables for event colors', () => {
      const { container } = render(<Timeline events={mockEvents} />);
      const html = container.innerHTML;

      // Should use token-based classes
      expect(html).toContain('var(--');
    });

    it('uses token for expanded detail background', async () => {
      const user = userEvent.setup();
      const { container } = render(<Timeline events={mockEvents} />);
      const orderEvent = screen.getByRole('button', { name: 'Order Placed' });
      await user.click(orderEvent);

      const html = container.innerHTML;
      expect(html).toContain('var(--bg-page)');
    });

    it('uses token for expanded detail border radius', async () => {
      const user = userEvent.setup();
      const { container } = render(<Timeline events={mockEvents} />);
      const orderEvent = screen.getByRole('button', { name: 'Order Placed' });
      await user.click(orderEvent);

      const html = container.innerHTML;
      expect(html).toContain('var(--radius-md)');
    });

    it('uses token for text colors', () => {
      const { container } = render(<Timeline events={mockEvents} />);
      const html = container.innerHTML;

      expect(html).toContain('var(--text-primary)');
      expect(html).toContain('var(--text-secondary)');
    });

    it('uses token for focus ring color', () => {
      const { container } = render(<Timeline events={mockEvents} />);
      const html = container.innerHTML;

      expect(html).toContain('focus:ring-[var(--primary)]');
    });

    it('contains no hardcoded hex colors for backgrounds', () => {
      const { container } = render(<Timeline events={mockEvents} />);
      const html = container.innerHTML;

      // Should NOT contain hardcoded hex colors for bg-page
      expect(html).not.toContain('#f8f9fa');
    });

    it('contains no hardcoded border radius', () => {
      const { container } = render(<Timeline events={mockEvents} />);
      const html = container.innerHTML;

      expect(html).not.toContain('rounded-[8px]');
      expect(html).not.toContain('rounded-[15px]');
    });

    it('contains no hardcoded shadow values', () => {
      const { container } = render(<Timeline events={mockEvents} />);
      const html = container.innerHTML;

      expect(html).not.toContain('shadow-[0_3.5px');
    });

    it('uses Card component wrapper (check for Card classes)', () => {
      const { container } = render(<Timeline events={mockEvents} />);
      const html = container.innerHTML;

      // Card component provides these tokens
      expect(html).toContain('var(--bg-card)');
      expect(html).toContain('var(--divider)');
    });
  });

  // Backwards compatibility
  describe('ActivityTimeline alias', () => {
    it('exports ActivityTimeline as alias for Timeline', () => {
      expect(ActivityTimeline).toBe(Timeline);
    });
  });
});

describe('Timeline - Accessibility', () => {
  const mockAccessibilityEvents: ActivityEvent[] = [
    {
      id: '1',
      customerId: 'CUST-001',
      type: 'order_placed',
      title: 'Order Placed',
      description: 'Order #12345 placed',
      timestamp: new Date('2024-01-15T10:00:00'),
      orderId: 'order-1',
      orderQuantity: 100,
      orderProduct: 'Premium Feed',
      orderStatus: 'Pending'
    },
    {
      id: '2',
      customerId: 'CUST-001',
      type: 'delivered',
      title: 'Delivery Completed',
      description: 'Order #12344 delivered',
      timestamp: new Date('2024-01-14T14:00:00'),
    },
  ];

  it('has no accessibility violations', async () => {
    const { container } = render(<Timeline events={mockAccessibilityEvents} />);
    const results = await axe(container, {
      rules: { region: { enabled: false } },
    });
    expect(results).toHaveNoViolations();
  });

  it('has no violations with empty events', async () => {
    const { container } = render(<Timeline events={[]} />);
    const results = await axe(container, {
      rules: { region: { enabled: false } },
    });
    expect(results).toHaveNoViolations();
  });
});
