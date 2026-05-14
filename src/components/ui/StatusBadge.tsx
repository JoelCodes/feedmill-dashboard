import { OrderStatus } from "@/types/order";
import type { ProductionState } from "@/db/schema/orders";

export interface StatusConfig {
  bg: string;
  text: string;
  dot: string;
  countBg: string;
  label: string;
}

/**
 * BadgeStatus is the union of all supported status values:
 * - OrderStatus: demo order statuses (Pending, Producing, Ready, In Transit, Complete)
 * - ProductionState: production order states (Pending, Mixing, Completed, Blocked)
 *
 * 'Pending' is shared between both unions and uses the same visual config.
 */
export type BadgeStatus = OrderStatus | ProductionState;

export const STATUS_CONFIG: Record<BadgeStatus, StatusConfig> = {
  // --- OrderStatus values ---
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
  },
  // --- ProductionState values (D-03 extension) ---
  // 'Pending' is already defined above and is shared.
  "Mixing": {
    bg: "bg-[var(--warning-light)]",
    text: "text-[var(--warning)]",
    dot: "bg-[var(--warning)]",
    countBg: "bg-[var(--status-mixing-bg-22)]",
    label: "Mixing"
  },
  "Completed": {
    bg: "bg-[var(--success-light)]",
    text: "text-[var(--success-dark)]",
    dot: "bg-[var(--success-dark)]",
    countBg: "bg-[var(--status-completed-bg-22)]",
    label: "Completed"
  },
  "Blocked": {
    bg: "bg-[var(--error-light)]",
    text: "text-[var(--error-dark)]",
    dot: "bg-[var(--error)]",
    countBg: "bg-[var(--status-blocked-bg-22)]",
    label: "Blocked"
  },
};

interface StatusBadgeProps {
  status: BadgeStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG["Pending"];

  return (
    <div
      className={`inline-flex items-center gap-1 ${config.bg} h-6 rounded-[var(--radius-sm)] px-2 py-1`}
    >
      <span className={`font-medium text-[var(--fs-11)] ${config.text}`}>
        {config.label}
      </span>
    </div>
  );
}
