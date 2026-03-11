import {
  ShoppingCart,
  AlertTriangle,
  Factory,
  Truck,
  CheckCircle,
} from "lucide-react";

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
    bg: "bg-[var(--primary)]",
    bar: "bg-[var(--primary)]",
    text: "text-[var(--primary)]",
  },
  success: {
    bg: "bg-[var(--success)]",
    bar: "bg-[var(--success)]",
    text: "text-[var(--success)]",
  },
  error: {
    bg: "bg-[var(--error)]",
    bar: "bg-[var(--error)]",
    text: "text-[var(--error)]",
  },
};

export default function OrderDetails() {
  return (
    <div className="flex w-[480px] flex-col gap-4 rounded-[15px] bg-white p-[21px] shadow-[0_3.5px_5px_rgba(0,0,0,0.02)]">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-bold text-[var(--text-primary)]">
          ORD-2847 — Greenfield Farms
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          24.5 tons Layer Mash · Greenfield Farms, TX
        </p>
      </div>

      {/* Stats */}
      <div className="flex gap-3">
        <StatCard label="Tons Ordered" value="24.5" unit="tons" />
        <StatCard label="Tons Produced" value="24.3" percentage="99.2% yield" />
        <StatCard label="Texture" value="Mash" subtext="Layer Mash" />
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
    <div className="flex flex-1 flex-col items-center gap-1 rounded-xl bg-[var(--bg-page)] p-3.5">
      <span className="text-[10px] font-bold text-[var(--text-secondary)]">
        {label}
      </span>
      <span className="text-[22px] font-bold text-[var(--text-primary)]">
        {value}
      </span>
      {unit && (
        <span className="text-[10px] text-[var(--text-secondary)]">{unit}</span>
      )}
      {percentage && (
        <span className="text-[10px] font-bold text-[var(--success)]">
          {percentage}
        </span>
      )}
      {subtext && (
        <span className="text-[10px] text-[var(--text-secondary)]">{subtext}</span>
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
        <span className="text-[13px] font-bold text-[var(--text-primary)]">
          {title}
        </span>
        <p className="text-[11px] leading-relaxed text-[var(--text-secondary)]">
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
    <div className="h-8 pl-[17px]">
      <div className={`h-full w-0.5 ${colors.bar}`} />
    </div>
  );
}
