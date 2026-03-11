import {
  LayoutDashboard,
  ClipboardList,
  Factory,
  Package,
  Truck,
  FlaskConical,
} from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: ClipboardList, label: "Orders", active: false },
  { icon: Factory, label: "Production Lines", active: false },
  { icon: Package, label: "Inventory", active: false },
  { icon: Truck, label: "Shipments", active: false },
];

const settingsItems = [{ icon: FlaskConical, label: "Formulas", active: false }];

export default function Sidebar() {
  return (
    <aside className="w-[280px] bg-white h-full p-6 flex flex-col gap-2">
      {/* Logo */}
      <div className="flex items-center gap-2.5 pb-5">
        <div className="w-8 h-8 bg-[var(--primary)] rounded-lg" />
        <span className="text-sm font-bold text-[var(--text-primary)]">
          FEEDMILL PRO
        </span>
      </div>

      {/* Divider */}
      <div className="h-px bg-[var(--divider)] w-full" />

      {/* Production Section */}
      <span className="text-[10px] font-bold text-[var(--text-secondary)] mt-2 tracking-wide">
        PRODUCTION
      </span>

      {navItems.map((item) => (
        <NavItem
          key={item.label}
          icon={item.icon}
          label={item.label}
          active={item.active}
        />
      ))}

      {/* Divider */}
      <div className="h-px bg-[var(--divider)] w-full mt-2" />

      {/* Settings Section */}
      <span className="text-[10px] font-bold text-[var(--text-secondary)] mt-2 tracking-wide">
        SETTINGS
      </span>

      {settingsItems.map((item) => (
        <NavItem
          key={item.label}
          icon={item.icon}
          label={item.label}
          active={item.active}
        />
      ))}
    </aside>
  );
}

function NavItem({
  icon: Icon,
  label,
  active,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-[15px] w-full ${
        active
          ? "bg-white shadow-[0_3.5px_5px_rgba(0,0,0,0.03)]"
          : "bg-transparent"
      }`}
    >
      <div
        className={`w-[30px] h-[30px] rounded-xl flex items-center justify-center shadow-[0_3.5px_5px_rgba(0,0,0,0.03)] ${
          active ? "bg-[var(--primary)]" : "bg-white"
        }`}
      >
        <Icon
          className={`w-4 h-4 ${active ? "text-white" : "text-[--primary]"}`}
        />
      </div>
      <span
        className={`text-xs font-bold ${
          active ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"
        }`}
      >
        {label}
      </span>
    </div>
  );
}
