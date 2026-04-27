import Link from "next/link";
import {
  LayoutDashboard,
  ClipboardList,
  Factory,
  Package,
  Truck,
  FlaskConical,
} from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", id: "dashboard", href: "/" },
  { icon: Factory, label: "Production", id: "production", href: "/mill-production" },
  { icon: ClipboardList, label: "Orders", id: "orders", href: "#" },
  { icon: Package, label: "Inventory", id: "inventory", href: "#" },
  { icon: Truck, label: "Shipments", id: "shipments", href: "#" },
];

const settingsItems = [
  { icon: FlaskConical, label: "Formulas", id: "formulas", href: "#" },
];

interface SidebarProps {
  activeItem?: string;
}

export default function Sidebar({ activeItem = "dashboard" }: SidebarProps) {
  return (
    <aside className="flex h-full w-[280px] flex-col gap-2 bg-white p-6">
      {/* Logo */}
      <div className="flex items-center gap-2.5 pb-5">
        <div className="h-8 w-8 rounded-lg bg-[var(--primary)]" />
        <span className="text-sm font-bold text-[var(--text-primary)]">
          FEEDMILL PRO
        </span>
      </div>

      {/* Divider */}
      <div className="h-px w-full bg-[var(--divider)]" />

      {/* Production Section */}
      <span className="mt-2 text-[10px] font-bold tracking-wide text-[var(--text-secondary)]">
        PRODUCTION
      </span>

      {navItems.map((item) => (
        <NavItem
          key={item.label}
          icon={item.icon}
          label={item.label}
          href={item.href}
          active={item.id === activeItem}
        />
      ))}

      {/* Divider */}
      <div className="mt-2 h-px w-full bg-[var(--divider)]" />

      {/* Settings Section */}
      <span className="mt-2 text-[10px] font-bold tracking-wide text-[var(--text-secondary)]">
        SETTINGS
      </span>

      {settingsItems.map((item) => (
        <NavItem
          key={item.label}
          icon={item.icon}
          label={item.label}
          href={item.href}
          active={item.id === activeItem}
        />
      ))}
    </aside>
  );
}

function NavItem({
  icon: Icon,
  label,
  href,
  active,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex w-full items-center gap-3 rounded-[15px] px-4 py-3 ${
        active
          ? "bg-white shadow-[0_3.5px_5px_rgba(0,0,0,0.03)]"
          : "bg-transparent"
      }`}
    >
      <div
        className={`flex h-[30px] w-[30px] items-center justify-center rounded-xl shadow-[0_3.5px_5px_rgba(0,0,0,0.03)] ${
          active ? "bg-[var(--primary)]" : "bg-white"
        }`}
      >
        <Icon
          className={`h-4 w-4 ${active ? "text-white" : "text-[--primary]"}`}
        />
      </div>
      <span
        className={`text-xs font-bold ${
          active ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"
        }`}
      >
        {label}
      </span>
    </Link>
  );
}
