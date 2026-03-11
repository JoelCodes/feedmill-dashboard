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

interface TimelineStep {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  date: string;
  color: "primary" | "success" | "error";
}

const timelineSteps: TimelineStep[] = [
  {
    icon: ShoppingCart,
    title: "Order Placed",
    description:
      "Order received from Greenfield Farms for 24.5 tons of Layer Mash. Payment confirmed.",
    date: "Mar 18, 2026 · 9:15 AM",
    color: "primary",
  },
  {
    icon: AlertTriangle,
    title: "Mill Changed",
    description:
      "ABC Mill changed to McGruff Mill due to capacity reallocation.",
    date: "Mar 18, 2026 · 2:45 PM",
    color: "error",
  },
  {
    icon: Factory,
    title: "Production Complete",
    description:
      "Batch #B-4420 mixed and pelleted on Line 3. QC passed — moisture 11.2%, protein 16.8%.",
    date: "Mar 19, 2026 · 2:40 PM",
    color: "primary",
  },
  {
    icon: Truck,
    title: "Delivery Started",
    description:
      "Truck #TK-118 departed plant. Driver: M. Santos. ETA 6 hrs to Greenfield Farms, Amarillo TX.",
    date: "Mar 20, 2026 · 6:00 AM",
    color: "primary",
  },
  {
    icon: CheckCircle,
    title: "Delivery Received",
    description:
      "Signed by J. Henderson at Greenfield Farms. Full load accepted — no damage reported.",
    date: "Mar 20, 2026 · 12:30 PM",
    color: "success",
  },
];

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

interface OrderDetailsProps {
  orderId: string | null;
}

export default function OrderDetails({ orderId }: OrderDetailsProps) {
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!orderId) {
      setOrder(null);
      return;
    }
    getOrderById(orderId).then(setOrder);
  }, [orderId]);

  // Show placeholder when no order selected
  if (!orderId || !order) {
    return (
      <div className="flex w-120 flex-col gap-4 rounded-[15px] bg-white p-5.25 shadow-[0_3.5px_5px_rgba(0,0,0,0.02)]">
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-text-secondary text-sm">Select an order to view details</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-120 flex-col gap-4 rounded-[15px] bg-white p-5.25 shadow-[0_3.5px_5px_rgba(0,0,0,0.02)]">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h2 className="text-text-primary text-lg font-bold">
            {order.documentNumber} - {order.customer}
          </h2>
          <StatusBadge status={order.status} />
        </div>
        <p className="text-text-secondary text-sm">
          {order.quantity} tons {order.textureType} · {order.location}
        </p>
      </div>

      {/* Stats */}
      <div className="flex gap-3">
        <StatCard label="Quantity" value={order.quantity.toString()} unit="tons" />
        <StatCard label="Delivery" value={formatDeliveryDate(order.deliveryDate)} />
        <StatCard label="Texture" value={order.textureType} subtext={order.formulaType} />
      </div>

      {/* Timeline */}
      <div className="flex flex-col">
        {timelineSteps.map((step, index) => (
          <div key={step.title}>
            <TimelineItem {...step} />
            {index < timelineSteps.length - 1 && (
              <TimelineConnector
                color={
                  index === 0
                    ? "error"
                    : index === timelineSteps.length - 2
                    ? "success"
                    : "primary"
                }
              />
            )}
          </div>
        ))}
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
}: TimelineStep) {
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
