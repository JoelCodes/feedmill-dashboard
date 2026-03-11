import { Wheat, ClipboardList, Truck, Activity, LucideIcon } from "lucide-react";

interface KPICardProps {
  label: string;
  value: string;
  change: string;
  changeType: "positive" | "negative" | "neutral";
  icon: LucideIcon;
}

const kpiData: KPICardProps[] = [
  {
    label: "Production Today",
    value: "847 tons",
    change: "+12%",
    changeType: "positive",
    icon: Wheat,
  },
  {
    label: "Orders Pending",
    value: "23",
    change: "+3",
    changeType: "negative",
    icon: ClipboardList,
  },
  {
    label: "Tons Shipped",
    value: "1,240",
    change: "+8%",
    changeType: "positive",
    icon: Truck,
  },
  {
    label: "Active Lines",
    value: "6 / 8",
    change: "75%",
    changeType: "positive",
    icon: Activity,
  },
];

export default function KPICards() {
  return (
    <div className="flex gap-6 w-full">
      {kpiData.map((kpi) => (
        <KPICard key={kpi.label} {...kpi} />
      ))}
    </div>
  );
}

function KPICard({ label, value, change, changeType, icon: Icon }: KPICardProps) {
  const changeColor =
    changeType === "positive"
      ? "text-[var(--success)]"
      : changeType === "negative"
      ? "text-[var(--error)]"
      : "text-[var(--text-secondary)]";

  return (
    <div className="flex-1 bg-white rounded-[15px] p-[18px_21px] flex items-center justify-between shadow-[0_3.5px_5px_rgba(0,0,0,0.02)]">
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-bold text-[var(--text-secondary)]">{label}</span>
        <div className="flex items-end gap-1.5">
          <span className="text-lg font-bold text-[var(--text-primary)]">{value}</span>
          <span className={`text-sm font-bold ${changeColor}`}>{change}</span>
        </div>
      </div>
      <div className="w-[45px] h-[45px] bg-[var(--primary)] rounded-xl flex items-center justify-center shadow-[0_3.5px_5px_rgba(0,0,0,0.02)]">
        <Icon className="w-[22px] h-[22px] text-white" />
      </div>
    </div>
  );
}
