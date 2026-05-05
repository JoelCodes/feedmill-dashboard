'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FileText, Factory, Truck, CheckCircle, AlertTriangle } from 'lucide-react';
import { ActivityEvent, ActivityEventType } from '@/types/activity';

interface ActivityTimelineProps {
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

// Color mapping per UI-SPEC Event Type Colors
function getEventColor(type: ActivityEventType): { dot: string; connector: string; text: string } {
  switch (type) {
    case 'delivered':
    case 'delivery_completed':
      return { dot: 'bg-success', connector: 'bg-success', text: 'text-success' };
    case 'bin_alert_low':
      return { dot: 'bg-warning', connector: 'bg-warning', text: 'text-warning' };
    case 'bin_alert_critical':
      return { dot: 'bg-error', connector: 'bg-error', text: 'text-error' };
    default: // order events
      return { dot: 'bg-primary', connector: 'bg-primary', text: 'text-primary' };
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
    <div className="flex gap-[14px]">
      {/* Left column: Icon dot and connector line */}
      <div className="flex flex-col items-center w-[36px] flex-shrink-0">
        <div className={`w-[28px] h-[28px] rounded-full ${colors.dot} flex items-center justify-center`}>
          <Icon className="w-[14px] h-[14px] text-white" />
        </div>
        {showConnector && <div className={`w-[2px] flex-1 ${colors.connector} min-h-[40px]`}></div>}
      </div>

      {/* Right column: Content */}
      <div className="flex-1 pb-4">
        <button
          onClick={onToggle}
          className="w-full text-left focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
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
            <h4 className="text-[13px] font-bold leading-[1.5] text-text-primary">{event.title}</h4>
            <p className="text-[11px] font-normal leading-[1.5] text-text-secondary">
              {event.description}
            </p>
            <p className={`text-[10px] font-bold leading-[1.2] ${colors.text}`}>
              {formatTimelineDate(event.timestamp)}
            </p>
          </div>
        </button>

        {/* Expanded detail box (only for order events) */}
        {showExpanded && (
          <div className="mt-2 bg-[#f8f9fa] rounded-[8px] p-3 space-y-1">
            <p className="text-[11px] font-normal leading-[1.5] text-text-primary">
              Quantity: {event.orderQuantity} tons
            </p>
            <p className="text-[11px] font-normal leading-[1.5] text-text-primary">
              Product: {event.orderProduct}
            </p>
            <p className="text-[11px] font-normal leading-[1.5] text-text-primary">
              Status: {event.orderStatus}
            </p>
            <Link
              href={`/orders?selected=${event.orderId}`}
              className="text-[10px] font-normal leading-[1.5] text-primary underline inline-block mt-1"
            >
              View Order Details
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export function ActivityTimeline({ events }: ActivityTimelineProps) {
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
      <div className="bg-white rounded-[15px] shadow-[0_3.5px_5px_rgba(0,0,0,0.05)] p-6">
        <div className="text-center py-12">
          <h3 className="text-[13px] font-bold text-text-primary mb-2">No recent activity</h3>
          <p className="text-[11px] text-text-secondary">
            Activity will appear here as orders, deliveries, and bin alerts occur.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[15px] shadow-[0_3.5px_5px_rgba(0,0,0,0.05)] p-[20px_24px]">
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
    </div>
  );
}
