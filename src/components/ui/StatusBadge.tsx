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
    bg: "bg-[var(--pending-light)]",
    text: "text-[var(--text-secondary)]",
    dot: "bg-[var(--pending)]",
    countBg: "bg-[var(--status-pending-bg-22)]",
    label: "Pending"
  },
  "Producing": {
    bg: "bg-[var(--warning-light)]",
    text: "text-[var(--warning)]",
    dot: "bg-[var(--warning)]",
    countBg: "bg-[var(--status-mixing-bg-22)]",
    label: "Producing"
  },
  "Ready": {
    bg: "bg-[var(--info-light)]",
    text: "text-[var(--info)]",
    dot: "bg-[var(--info)]",
    countBg: "bg-[color-mix(in_srgb,var(--info)_13%,transparent)]",
    label: "Ready"
  },
  "In Transit": {
    bg: "bg-[var(--purple-light)]",
    text: "text-[var(--purple)]",
    dot: "bg-[var(--purple)]",
    countBg: "bg-[color-mix(in_srgb,var(--purple)_13%,transparent)]",
    label: "Transit"
  },
  "Complete": {
    bg: "bg-[var(--success-light)]",
    text: "text-[var(--success-dark)]",
    dot: "bg-[var(--success-dark)]",
    countBg: "bg-[var(--status-completed-bg-22)]",
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
      <span className={`text-[var(--fs-10)] font-bold ${config.text}`}>
        {config.label}
      </span>
    </div>
  );
}
