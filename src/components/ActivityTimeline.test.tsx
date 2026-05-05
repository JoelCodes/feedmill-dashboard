import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ActivityTimeline } from './ActivityTimeline';
import { ActivityEvent } from '@/types/activity';

describe('ActivityTimeline', () => {
  // Test 1: Empty state
  it('renders empty state when events array is empty', () => {
    render(<ActivityTimeline events={[]} />);
    expect(screen.getByText('No recent activity')).toBeInTheDocument();
    expect(screen.getByText('Activity will appear here as orders, deliveries, and bin alerts occur.')).toBeInTheDocument();
  });

  // Test 2: Renders timeline items
  it('renders timeline items for each event', () => {
    const events: ActivityEvent[] = [
      {
        id: '1',
        customerId: 'CUST-001',
        type: 'order_placed',
        timestamp: new Date('2026-05-05T10:00:00Z'),
        title: 'Order #12345 Placed',
        description: '5 tons Pellet Feed ordered for delivery',
        orderId: '12345',
        orderQuantity: 5,
        orderProduct: 'Pellet Feed',
        orderStatus: 'Pending'
      },
      {
        id: '2',
        customerId: 'CUST-001',
        type: 'bin_alert_low',
        timestamp: new Date('2026-05-04T14:30:00Z'),
        title: 'Low Feed Alert - Bin 4A',
        description: 'Pellet Feed level dropped below 30%',
        binId: 'BIN-001',
        binLocationCode: '4A',
        binFillPercentage: 25
      }
    ];

    render(<ActivityTimeline events={events} />);

    expect(screen.getByText('Order #12345 Placed')).toBeInTheDocument();
    expect(screen.getByText('5 tons Pellet Feed ordered for delivery')).toBeInTheDocument();
    expect(screen.getByText('Low Feed Alert - Bin 4A')).toBeInTheDocument();
    expect(screen.getByText('Pellet Feed level dropped below 30%')).toBeInTheDocument();
  });

  // Test 3: Click to expand
  it('clicking a collapsed row expands it', async () => {
    const user = userEvent.setup();
    const events: ActivityEvent[] = [
      {
        id: '1',
        customerId: 'CUST-001',
        type: 'order_placed',
        timestamp: new Date('2026-05-05T10:00:00Z'),
        title: 'Order #12345 Placed',
        description: '5 tons Pellet Feed ordered for delivery',
        orderId: '12345',
        orderQuantity: 5,
        orderProduct: 'Pellet Feed',
        orderStatus: 'Pending'
      }
    ];

    render(<ActivityTimeline events={events} />);

    const row = screen.getByRole('button', { name: /Order #12345 Placed/i });
    expect(row).toHaveAttribute('aria-expanded', 'false');

    await user.click(row);

    expect(row).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/Quantity: 5 tons/i)).toBeInTheDocument();
  });

  // Test 4: Click to collapse
  it('clicking an expanded row collapses it', async () => {
    const user = userEvent.setup();
    const events: ActivityEvent[] = [
      {
        id: '1',
        customerId: 'CUST-001',
        type: 'order_placed',
        timestamp: new Date('2026-05-05T10:00:00Z'),
        title: 'Order #12345 Placed',
        description: '5 tons Pellet Feed ordered for delivery',
        orderId: '12345',
        orderQuantity: 5,
        orderProduct: 'Pellet Feed',
        orderStatus: 'Pending'
      }
    ];

    render(<ActivityTimeline events={events} />);

    const row = screen.getByRole('button', { name: /Order #12345 Placed/i });

    // Expand first
    await user.click(row);
    expect(row).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/Quantity: 5 tons/i)).toBeInTheDocument();

    // Then collapse
    await user.click(row);
    expect(row).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText(/Quantity: 5 tons/i)).not.toBeInTheDocument();
  });

  // Test 5: Multiple rows expanded
  it('allows multiple rows to be expanded simultaneously', async () => {
    const user = userEvent.setup();
    const events: ActivityEvent[] = [
      {
        id: '1',
        customerId: 'CUST-001',
        type: 'order_placed',
        timestamp: new Date('2026-05-05T10:00:00Z'),
        title: 'Order #12345 Placed',
        description: '5 tons Pellet Feed ordered for delivery',
        orderId: '12345',
        orderQuantity: 5,
        orderProduct: 'Pellet Feed',
        orderStatus: 'Pending'
      },
      {
        id: '2',
        customerId: 'CUST-001',
        type: 'production_started',
        timestamp: new Date('2026-05-04T14:30:00Z'),
        title: 'Production Started - Order #12346',
        description: 'Producing 10 tons Mash Feed',
        orderId: '12346',
        orderQuantity: 10,
        orderProduct: 'Mash Feed',
        orderStatus: 'Producing'
      }
    ];

    render(<ActivityTimeline events={events} />);

    const row1 = screen.getByRole('button', { name: /Order #12345 Placed/i });
    const row2 = screen.getByRole('button', { name: /Production Started - Order #12346/i });

    // Expand both
    await user.click(row1);
    await user.click(row2);

    // Both should be expanded
    expect(row1).toHaveAttribute('aria-expanded', 'true');
    expect(row2).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/Quantity: 5 tons/i)).toBeInTheDocument();
    expect(screen.getByText(/Quantity: 10 tons/i)).toBeInTheDocument();
  });

  // Test 6: Expanded order content
  it('expanded order event shows Quantity, Product, Status', async () => {
    const user = userEvent.setup();
    const events: ActivityEvent[] = [
      {
        id: '1',
        customerId: 'CUST-001',
        type: 'order_placed',
        timestamp: new Date('2026-05-05T10:00:00Z'),
        title: 'Order #12345 Placed',
        description: '5 tons Pellet Feed ordered for delivery',
        orderId: '12345',
        orderQuantity: 5,
        orderProduct: 'Pellet Feed',
        orderStatus: 'Pending'
      }
    ];

    render(<ActivityTimeline events={events} />);

    const row = screen.getByRole('button', { name: /Order #12345 Placed/i });
    await user.click(row);

    expect(screen.getByText(/Quantity: 5 tons/i)).toBeInTheDocument();
    expect(screen.getByText(/Product: Pellet Feed/i)).toBeInTheDocument();
    expect(screen.getByText(/Status: Pending/i)).toBeInTheDocument();
  });

  // Test 7: View Order Details link
  it('expanded order event contains View Order Details link with correct href', async () => {
    const user = userEvent.setup();
    const events: ActivityEvent[] = [
      {
        id: '1',
        customerId: 'CUST-001',
        type: 'order_placed',
        timestamp: new Date('2026-05-05T10:00:00Z'),
        title: 'Order #12345 Placed',
        description: '5 tons Pellet Feed ordered for delivery',
        orderId: '12345',
        orderQuantity: 5,
        orderProduct: 'Pellet Feed',
        orderStatus: 'Pending'
      }
    ];

    render(<ActivityTimeline events={events} />);

    const row = screen.getByRole('button', { name: /Order #12345 Placed/i });
    await user.click(row);

    const link = screen.getByRole('link', { name: /View Order Details/i });
    expect(link).toHaveAttribute('href', '/orders?selected=12345');
  });

  // Test 8: Bin events without expanded detail
  it('bin alert events do not show expanded detail box', async () => {
    const user = userEvent.setup();
    const events: ActivityEvent[] = [
      {
        id: '1',
        customerId: 'CUST-001',
        type: 'bin_alert_low',
        timestamp: new Date('2026-05-04T14:30:00Z'),
        title: 'Low Feed Alert - Bin 4A',
        description: 'Pellet Feed level dropped below 30%',
        binId: 'BIN-001',
        binLocationCode: '4A',
        binFillPercentage: 25
      }
    ];

    render(<ActivityTimeline events={events} />);

    const row = screen.getByRole('button', { name: /Low Feed Alert - Bin 4A/i });

    // Click the row
    await user.click(row);

    // No expanded detail should appear (no Quantity, Product, Status, or link)
    expect(screen.queryByText(/Quantity:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Product:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Status:/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /View Order Details/i })).not.toBeInTheDocument();
  });
});
