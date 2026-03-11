import { useState, useEffect } from 'react';
import {
  ShoppingCart,
  AlertTriangle,
  Factory,
  Truck,
  CheckCircle,
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
  color: "primary" | "success" | "error";
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
    });
  }

  // Status-based events (derive from current status)
  // Add production event if past Pending
  if (['Producing', 'Ready', 'In Transit', 'Complete'].includes(order.status)) {
    events.push({
      id: 'production-started',
      icon: Factory,
      title: 'Production Started',
      description: `Producing ${order.quantity} tons ${order.textureType}`,
      date: new Date(order.createdAt.getTime() + 3600000), // 1 hour after order
      color: 'primary',
    });
  }

  // Add delivery event if In Transit or Complete
  if (['In Transit', 'Complete'].includes(order.status)) {
    events.push({
      id: 'delivery-started',
      icon: Truck,
      title: 'Delivery Started',
      description: `Shipment departed for ${order.location}`,
      date: new Date(order.deliveryDate.getTime() - 21600000), // 6 hours before delivery
      color: 'primary',
    });
  }

  // Add completion event if Complete
  if (order.status === 'Complete') {
    events.push({
      id: 'delivered',
      icon: CheckCircle,
      title: 'Delivered',
      description: `Delivered to ${order.location}`,
      date: order.deliveryDate,
      color: 'success',
    });
  }

  return events;
}

function formatTimelineDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(date).replace(',', ' ·');
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
  const sortedEvents = [...timelineEvents].sort((a, b) => {
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
          {sortedEvents.map((event, index) => (
            <div key={event.id}>
              <TimelineItem
                icon={event.icon}
                title={event.title}
                description={event.description}
                date={formatTimelineDate(event.date)}
                color={event.color}
              />
              {index < sortedEvents.length - 1 && (
                <TimelineConnector color={event.color} />
              )}
            </div>
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
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  date: string;
  color: "primary" | "success" | "error";
}) {
  const colors = colorMap[color];

  return (
    <div className="flex gap-3.5">
      {/* Left - Icon */}
      <div className="flex w-9 flex-col items-center">
        <div
          className={`h-7 w-7 ${colors.bg} flex items-center justify-center rounded-full`}
        >
          <Icon className="h-3.5 w-3.5 text-white" />
        </div>
      </div>

      {/* Right - Content */}
      <div className="flex flex-1 flex-col gap-0.5">
        <span className="text-text-primary text-[13px] font-bold">
          {title}
        </span>
        <p className="text-text-secondary text-[11px] leading-relaxed">
          {description}
        </p>
        <span className={`text-[10px] font-bold ${colors.text}`}>{date}</span>
      </div>
    </div>
  );
}

function TimelineConnector({ color }: { color: "primary" | "success" | "error" }) {
  const colors = colorMap[color];

  return (
    <div className="h-8 pl-4.25">
      <div className={`h-full w-0.5 ${colors.bar}`} />
    </div>
  );
}
