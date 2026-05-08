import { Wheat, ClipboardList, Truck, Activity, LucideIcon } from "lucide-react";
import Card from "@/components/ui/Card";

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
    <div className="flex w-full gap-6">
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
    <Card className="flex-1">
      <Card.Content className="flex items-center justify-between p-[18px_21px]">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-bold text-[var(--text-secondary)]">{label}</span>
          <div className="flex items-end gap-1.5">
            <span className="text-lg font-bold text-[var(--text-primary)]">{value}</span>
            <span className={`text-sm font-bold ${changeColor}`}>{change}</span>
          </div>
        </div>
        <div className="flex h-11.25 w-11.25 items-center justify-center rounded-xl bg-[var(--primary)] shadow-[var(--shadow-card)]">
          <Icon className="h-5.5 w-5.5 text-white" />
        </div>
      </Card.Content>
    </Card>
  );
}
