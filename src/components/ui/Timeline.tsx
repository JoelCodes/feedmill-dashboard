'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FileText, Factory, Truck, CheckCircle, AlertTriangle } from 'lucide-react';
import { ActivityEvent, ActivityEventType } from '@/types/activity';
import Card from './Card';

interface TimelineProps {
  events: ActivityEvent[];
}

// Icon mapping per UI-SPEC
const iconMap: Record<ActivityEventType, React.ComponentType<{ className?: string }>> = {
  order_placed: FileText,
  production_started: Factory,
  ready: CheckCircle,
  out_for_delivery: Truck,
  delivered: CheckCircle,
  delivery_completed: Truck,
  bin_alert_low: AlertTriangle,
  bin_alert_critical: AlertTriangle,
};

// Color mapping using design tokens
function getEventColor(type: ActivityEventType): { dot: string; connector: string; text: string } {
  switch (type) {
    case 'delivered':
    case 'delivery_completed':
      return {
        dot: 'bg-[var(--success)]',
        connector: 'bg-[var(--success)]',
        text: 'text-[var(--success)]'
      };
    case 'bin_alert_low':
      return {
        dot: 'bg-[var(--warning)]',
        connector: 'bg-[var(--warning)]',
        text: 'text-[var(--warning)]'
      };
    case 'bin_alert_critical':
      return {
        dot: 'bg-[var(--error)]',
        connector: 'bg-[var(--error)]',
        text: 'text-[var(--error)]'
      };
    default: // order events
      return {
        dot: 'bg-[var(--primary)]',
        connector: 'bg-[var(--primary)]',
        text: 'text-[var(--primary)]'
      };
  }
}

// Date formatting per UI-SPEC
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

// Internal TimelineItem component
interface TimelineItemProps {
  event: ActivityEvent;
  isExpanded: boolean;
  showConnector: boolean;
  onToggle: () => void;
}

function TimelineItem({ event, isExpanded, showConnector, onToggle }: TimelineItemProps) {
  const showExpanded = isExpanded && event.orderId;
  const colors = getEventColor(event.type);
  const Icon = iconMap[event.type];

  return (
    <div className="flex gap-[var(--timeline-gap)]">
      {/* Left column: Icon dot and connector line */}
      <div className="flex w-[var(--icon-container)] flex-shrink-0 flex-col items-center">
        <div className={`h-[var(--icon-dot)] w-[var(--icon-dot)] rounded-full ${colors.dot} flex items-center justify-center`}>
          <Icon className="h-[var(--icon-sm)] w-[var(--icon-sm)] text-white" />
        </div>
        {showConnector && <div className={`w-[var(--timeline-connector)] flex-1 ${colors.connector} min-h-[var(--timeline-min-height)]`}></div>}
      </div>

      {/* Right column: Content */}
      <div className="flex-1 pb-4">
        <button
          onClick={onToggle}
          className="w-full rounded text-left focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 focus:outline-none"
          aria-expanded={isExpanded}
          aria-label={event.title}
        >
          <div className="space-y-1">
            <h4 className="leading-[1.5] font-bold text-[var(--fs-13)] text-[var(--text-primary)]">{event.title}</h4>
            <p className="leading-[1.5] font-normal text-[var(--fs-11)] text-[var(--text-secondary)]">
              {event.description}
            </p>
            <p className={`leading-[1.2] font-bold text-[var(--fs-10)] ${colors.text}`}>
              {formatTimelineDate(event.timestamp)}
            </p>
          </div>
        </button>

        {/* Expanded detail box (only for order events) */}
        {showExpanded && (
          <div className="mt-2 space-y-1 rounded-[var(--radius-md)] bg-[var(--bg-page)] p-3">
            <p className="leading-[1.5] font-normal text-[var(--fs-11)] text-[var(--text-primary)]">
              Quantity: {event.orderQuantity} tons
            </p>
            <p className="leading-[1.5] font-normal text-[var(--fs-11)] text-[var(--text-primary)]">
              Product: {event.orderProduct}
            </p>
            <p className="leading-[1.5] font-normal text-[var(--fs-11)] text-[var(--text-primary)]">
              Status: {event.orderStatus}
            </p>
            <Link
              href={`/demo/orders?selected=${event.orderId}`}
              className="mt-1 inline-block leading-[1.5] font-normal text-[var(--fs-10)] text-[var(--primary)] underline"
            >
              View Order Details
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export function Timeline({ events }: TimelineProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (eventId: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  };

  // Empty state
  if (events.length === 0) {
    return (
      <Card>
        <Card.Content className="p-6">
          <div className="py-12 text-center">
            <h3 className="mb-2 font-bold text-[var(--fs-13)] text-[var(--text-primary)]">No recent activity</h3>
            <p className="text-[var(--fs-11)] text-[var(--text-secondary)]">
              Activity will appear here as orders, deliveries, and bin alerts occur.
            </p>
          </div>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card>
      <Card.Content className="p-[20px_24px]">
        <div className="space-y-0">
          {events.map((event, index) => (
            <TimelineItem
              key={event.id}
              event={event}
              isExpanded={expandedIds.has(event.id)}
              showConnector={index < events.length - 1}
              onToggle={() => toggleExpand(event.id)}
            />
          ))}
        </div>
      </Card.Content>
    </Card>
  );
}

// Re-export with old name for backwards compatibility
export { Timeline as ActivityTimeline };
