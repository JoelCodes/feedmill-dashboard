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
      <div className="flex flex-col items-center w-[var(--icon-container)] flex-shrink-0">
        <div className={`w-[var(--icon-dot)] h-[var(--icon-dot)] rounded-full ${colors.dot} flex items-center justify-center`}>
          <Icon className="w-[var(--icon-sm)] h-[var(--icon-sm)] text-white" />
        </div>
        {showConnector && <div className={`w-[var(--timeline-connector)] flex-1 ${colors.connector} min-h-[var(--timeline-min-height)]`}></div>}
      </div>

      {/* Right column: Content */}
      <div className="flex-1 pb-4">
        <button
          onClick={onToggle}
          className="w-full text-left focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 rounded"
          role="button"
          aria-expanded={isExpanded}
          tabIndex={0}
          aria-label={event.title}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onToggle();
            }
          }}
        >
          <div className="space-y-1">
            <h4 className="text-[var(--fs-13)] font-bold leading-[1.5] text-[var(--text-primary)]">{event.title}</h4>
            <p className="text-[var(--fs-11)] font-normal leading-[1.5] text-[var(--text-secondary)]">
              {event.description}
            </p>
            <p className={`text-[var(--fs-10)] font-bold leading-[1.2] ${colors.text}`}>
              {formatTimelineDate(event.timestamp)}
            </p>
          </div>
        </button>

        {/* Expanded detail box (only for order events) */}
        {showExpanded && (
          <div className="mt-2 bg-[var(--bg-page)] rounded-[var(--radius-md)] p-3 space-y-1">
            <p className="text-[var(--fs-11)] font-normal leading-[1.5] text-[var(--text-primary)]">
              Quantity: {event.orderQuantity} tons
            </p>
            <p className="text-[var(--fs-11)] font-normal leading-[1.5] text-[var(--text-primary)]">
              Product: {event.orderProduct}
            </p>
            <p className="text-[var(--fs-11)] font-normal leading-[1.5] text-[var(--text-primary)]">
              Status: {event.orderStatus}
            </p>
            <Link
              href={`/orders?selected=${event.orderId}`}
              className="text-[var(--fs-10)] font-normal leading-[1.5] text-[var(--primary)] underline inline-block mt-1"
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
          <div className="text-center py-12">
            <h3 className="text-[var(--fs-13)] font-bold text-[var(--text-primary)] mb-2">No recent activity</h3>
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
