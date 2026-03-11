import { OrderStatus } from "@/types/order";

export interface StatusConfig {
  bg: string;
  text: string;
  dot: string;
  countBg: string;
  label: string;
}

export const STATUS_CONFIG: Record<OrderStatus, StatusConfig> = {
  "Pending": {
    bg: "bg-gray-100",
    text: "text-gray-600",
    dot: "bg-gray-600",
    countBg: "bg-gray-100",
    label: "Pending"
  },
  "Producing": {
    bg: "bg-[var(--warning-light)]",
    text: "text-[var(--warning)]",
    dot: "bg-[var(--warning)]",
    countBg: "bg-[#975a1622]",
    label: "Producing"
  },
  "Ready": {
    bg: "bg-[var(--info-light)]",
    text: "text-[var(--info)]",
    dot: "bg-[var(--info)]",
    countBg: "bg-[#2b6cb022]",
    label: "Ready"
  },
  "In Transit": {
    bg: "bg-[var(--purple-light)]",
    text: "text-[var(--purple)]",
    dot: "bg-[var(--purple)]",
    countBg: "bg-[#9333ea22]",
    label: "Transit"
  },
  "Complete": {
    bg: "bg-[var(--success-light)]",
    text: "text-[var(--success-dark)]",
    dot: "bg-[var(--success-dark)]",
    countBg: "bg-[#2f855a22]",
    label: "Complete"
  }
};

interface StatusBadgeProps {
  status: OrderStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <div
      className={`inline-flex items-center gap-1 ${config.bg} rounded-lg px-2.5 py-1`}
    >
      <div className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      <span className={`text-[10px] font-bold ${config.text}`}>
        {config.label}
      </span>
    </div>
  );
}
