import { useState, useEffect } from 'react';
import {
  ShoppingCart,
  AlertTriangle,
  Factory,
  Truck,
  CheckCircle,
  Timer,
} from "lucide-react";
import { getOrderById } from '@/services/orders';
import { Order } from '@/types/order';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatDeliveryDate } from '@/utils/formatDate';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface TimelineEvent {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  date: Date;
  color: "primary" | "success" | "error" | "pending";
  isPending?: boolean;
}

const colorMap = {
  primary: {
    bg: "bg-primary",
    bar: "bg-primary",
    text: "text-primary",
  },
  success: {
    bg: "bg-success",
    bar: "bg-success",
    text: "text-success",
  },
  error: {
    bg: "bg-error",
    bar: "bg-error",
    text: "text-error",
  },
  pending: {
    bg: "bg-white border-2 border-pending",
    bar: "bg-pending",
    text: "text-text-secondary",
  },
};

function generateTimelineEvents(order: Order): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  // Order placed (always present)
  events.push({
    id: 'order-placed',
    icon: ShoppingCart,
    title: 'Order Placed',
    description: `Order received from ${order.customer}`,
    date: order.createdAt,
    color: 'primary',
    isPending: false,
  });

  // Change event (if hasChanges)
  if (order.hasChanges) {
    events.push({
      id: 'change-event',
      icon: AlertTriangle,
      title: 'Order Modified',
      description: 'Mill assignment changed',
      date: order.updatedAt,
      color: 'error',
      isPending: false,
    });
  }

  // Status-based events (derive from current status)
  // Add production event - completed or pending based on status
  if (['Producing', 'Ready', 'In Transit', 'Complete'].includes(order.status)) {
    events.push({
      id: 'production-started',
      icon: Factory,
      title: 'Production Started',
      description: `Producing ${order.quantity} tons ${order.textureType}`,
      date: new Date(order.createdAt.getTime() + 3600000), // 1 hour after order
      color: 'primary',
      isPending: false,
    });
  } else if (order.status === 'Pending') {
    // Add as pending event
    events.push({
      id: 'production-started',
      icon: Factory,
      title: 'Production Started',
      description: `Producing ${order.quantity} tons ${order.textureType}`,
      date: new Date(order.deliveryDate.getTime() - 7 * 24 * 3600000), // 7 days before delivery
      color: 'pending',
      isPending: true,
    });
  }

  // Add ready event - completed or pending based on status
  if (['Ready', 'In Transit', 'Complete'].includes(order.status)) {
    events.push({
      id: 'ready-for-pickup',
      icon: CheckCircle,
      title: 'Ready for Pickup',
      description: 'Order ready for shipment',
      date: new Date(order.deliveryDate.getTime() - 2 * 24 * 3600000), // 2 days before delivery
      color: 'primary',
      isPending: false,
    });
  } else if (['Pending', 'Producing'].includes(order.status)) {
    events.push({
      id: 'ready-for-pickup',
      icon: CheckCircle,
      title: 'Ready for Pickup',
      description: 'Order ready for shipment',
      date: new Date(order.deliveryDate.getTime() - 2 * 24 * 3600000), // 2 days before delivery
      color: 'pending',
      isPending: true,
    });
  }

  // Add delivery event - completed or pending based on status
  if (['In Transit', 'Complete'].includes(order.status)) {
    events.push({
      id: 'delivery-started',
      icon: Truck,
      title: 'Delivery Started',
      description: `Shipment departed for ${order.location}`,
      date: new Date(order.deliveryDate.getTime() - 21600000), // 6 hours before delivery
      color: 'primary',
      isPending: false,
    });
  } else if (['Pending', 'Producing', 'Ready'].includes(order.status)) {
    events.push({
      id: 'delivery-started',
      icon: Truck,
      title: 'Delivery Started',
      description: `Shipment departed for ${order.location}`,
      date: new Date(order.deliveryDate.getTime() - 21600000), // 6 hours before delivery
      color: 'pending',
      isPending: true,
    });
  }

  // Add completion event - completed or pending based on status
  if (order.status === 'Complete') {
    events.push({
      id: 'delivered',
      icon: CheckCircle,
      title: 'Delivered',
      description: `Delivered to ${order.location}`,
      date: order.deliveryDate,
      color: 'success',
      isPending: false,
    });
  } else {
    events.push({
      id: 'delivered',
      icon: CheckCircle,
      title: 'Delivered',
      description: `Delivered to ${order.location}`,
      date: order.deliveryDate,
      color: 'pending',
      isPending: true,
    });
  }

  return events;
}

function formatTimelineDate(date: Date, isPending?: boolean): string {
  const formatted = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(date).replace(',', ' ·');

  return isPending ? `Est. ${formatted}` : formatted;
}

function PendingBadge() {
  return (
    <div className="flex items-center gap-1.5 bg-pending-light rounded-md px-2 py-1 my-3">
      <Timer className="h-3 w-3 text-text-secondary" />
      <span className="text-[10px] font-bold text-text-secondary uppercase">Pending</span>
    </div>
  );
}

interface OrderDetailsProps {
  orderId: string | null;
}

export default function OrderDetails({ orderId }: OrderDetailsProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [sortOrder, setSortOrder] = useLocalStorage<'asc' | 'desc'>(
    'orderTimelineSortOrder',
    'desc'  // Newest first by default
  );

  useEffect(() => {
    if (!orderId) return;

    let cancelled = false;

    // Fetch from external system (mock service)
    getOrderById(orderId).then(data => {
      if (!cancelled) {
        setOrder(data);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [orderId]);

  // Derive whether to show order based on orderId match
  const displayOrder = orderId && order?.id === orderId ? order : null;

  // Show placeholder when no order selected
  if (!orderId || !displayOrder) {
    return (
      <div className="flex w-120 flex-col gap-4 rounded-[15px] bg-white p-5.25 shadow-[0_3.5px_5px_rgba(0,0,0,0.02)]">
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-text-secondary text-sm">Select an order to view details</p>
        </div>
      </div>
    );
  }

  // Generate and sort timeline events
  const timelineEvents = generateTimelineEvents(displayOrder);

  // Split into completed and pending
  const completedEvents = timelineEvents.filter(e => !e.isPending);
  const pendingEvents = timelineEvents.filter(e => e.isPending);

  // Sort each group
  const sortedCompleted = [...completedEvents].sort((a, b) => {
    const diff = a.date.getTime() - b.date.getTime();
    return sortOrder === 'desc' ? -diff : diff;
  });

  const sortedPending = [...pendingEvents].sort((a, b) => {
    const diff = a.date.getTime() - b.date.getTime();
    return sortOrder === 'desc' ? -diff : diff;
  });

  return (
    <div className="flex w-120 flex-col gap-4 rounded-[15px] bg-white p-5.25 shadow-[0_3.5px_5px_rgba(0,0,0,0.02)]">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h2 className="text-text-primary text-lg font-bold">
            {displayOrder.documentNumber} - {displayOrder.customer}
          </h2>
          <StatusBadge status={displayOrder.status} />
        </div>
        <p className="text-text-secondary text-sm">
          {displayOrder.quantity} tons {displayOrder.textureType} · {displayOrder.location}
        </p>
      </div>

      {/* Stats */}
      <div className="flex gap-3">
        <StatCard label="Quantity" value={displayOrder.quantity.toString()} unit="tons" />
        <StatCard label="Delivery" value={formatDeliveryDate(displayOrder.deliveryDate)} />
        <StatCard label="Texture" value={displayOrder.textureType} subtext={displayOrder.formulaType} />
      </div>

      {/* Timeline */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-text-primary text-sm font-bold">Timeline</h3>
          <button
            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
            className="text-primary text-[10px] font-medium hover:underline"
          >
            {sortOrder === 'desc' ? 'Newest first' : 'Oldest first'}
          </button>
        </div>
        <div className="flex flex-col">
          {/* Completed events */}
          {sortedCompleted.map((event, index) => (
            <TimelineItem
              key={event.id}
              icon={event.icon}
              title={event.title}
              description={event.description}
              date={formatTimelineDate(event.date, event.isPending)}
              color={event.color}
              isPending={event.isPending}
              showConnector={index < sortedCompleted.length - 1}
            />
          ))}

          {/* Pending badge divider */}
          {sortedPending.length > 0 && <PendingBadge />}

          {/* Pending events */}
          {sortedPending.map((event, index) => (
            <TimelineItem
              key={event.id}
              icon={event.icon}
              title={event.title}
              description={event.description}
              date={formatTimelineDate(event.date, event.isPending)}
              color={event.color}
              isPending={event.isPending}
              showConnector={index < sortedPending.length - 1}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  unit,
  percentage,
  subtext,
}: {
  label: string;
  value: string;
  unit?: string;
  percentage?: string;
  subtext?: string;
}) {
  return (
    <div className="bg-bg-page flex flex-1 flex-col items-center gap-1 rounded-xl p-3.5">
      <span className="text-text-secondary text-[10px] font-bold">
        {label}
      </span>
      <span className="text-text-primary text-[22px] font-bold">
        {value}
      </span>
      {unit && (
        <span className="text-text-secondary text-[10px]">{unit}</span>
      )}
      {percentage && (
        <span className="text-success text-[10px] font-bold">
          {percentage}
        </span>
      )}
      {subtext && (
        <span className="text-text-secondary text-[10px]">{subtext}</span>
      )}
    </div>
  );
}

function TimelineItem({
  icon: Icon,
  title,
  description,
  date,
  color,
  isPending,
  showConnector,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  date: string;
  color: "primary" | "success" | "error" | "pending";
  isPending?: boolean;
  showConnector?: boolean;
}) {
  const colors = colorMap[color];

  return (
    <div className="flex items-stretch gap-3.5">
      {/* Left - Icon + Connector */}
      <div className="flex w-9 flex-col items-center">
        <div
          className={`h-7 w-7 ${colors.bg} flex shrink-0 items-center justify-center rounded-full`}
        >
          <Icon className={`h-3.5 w-3.5 ${isPending ? 'text-pending' : 'text-white'}`} />
        </div>
        {showConnector && (
          <div className={`w-0.5 flex-1 ${colors.bar}`} />
        )}
      </div>

      {/* Right - Content */}
      <div className="flex flex-1 flex-col gap-0.5 pb-8">
        <span className="text-text-primary text-[13px] font-bold">
          {title}
        </span>
        <p className="text-text-secondary text-[11px] leading-relaxed">
          {description}
        </p>
        <div className="flex items-center gap-1">
          {isPending && <Timer className="h-2.5 w-2.5 text-text-secondary" />}
          <span className={`text-[10px] font-bold ${colors.text}`}>{date}</span>
        </div>
      </div>
    </div>
  );
}

