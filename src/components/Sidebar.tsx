"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  Factory,
  Package,
  Truck,
  Users,
  FlaskConical,
} from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", id: "dashboard", href: "/" },
  { icon: Factory, label: "Production", id: "production", href: "/mill-production" },
  { icon: ClipboardList, label: "Orders", id: "orders", href: "/orders" },
  { icon: Users, label: "Customers", id: "customers", href: "/customers" },
  { icon: Package, label: "Inventory", id: "inventory", href: "/inventory" },
  { icon: Truck, label: "Shipments", id: "shipments", href: "/shipments" },
];

const settingsItems = [
  { icon: FlaskConical, label: "Formulas", id: "formulas", href: "#" },
];

function isActive(href: string, pathname: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname.startsWith(href);
}

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="flex h-full w-[var(--sidebar-width)] flex-col gap-2 bg-[var(--bg-card)] p-6">
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
      <span className="mt-2 font-bold tracking-wide text-[var(--fs-10)] text-[var(--text-secondary)]">
        PRODUCTION
      </span>

      {navItems.map((item) => (
        <NavItem
          key={item.label}
          icon={item.icon}
          label={item.label}
          href={item.href}
          active={isActive(item.href, pathname)}
        />
      ))}

      {/* Divider */}
      <div className="mt-2 h-px w-full bg-[var(--divider)]" />

      {/* Settings Section */}
      <span className="mt-2 font-bold tracking-wide text-[var(--fs-10)] text-[var(--text-secondary)]">
        SETTINGS
      </span>

      {settingsItems.map((item) => (
        <NavItem
          key={item.label}
          icon={item.icon}
          label={item.label}
          href={item.href}
          active={isActive(item.href, pathname)}
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
      className={`flex w-full items-center gap-3 rounded-[var(--radius-xl)] px-4 py-3 ${
        active
          ? "bg-[var(--bg-card)] shadow-[var(--shadow-card)]"
          : "bg-transparent"
      }`}
    >
      <div
        className={`flex h-[var(--nav-icon-size)] w-[var(--nav-icon-size)] items-center justify-center rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] ${
          active ? "bg-[var(--primary)]" : "bg-[var(--bg-card)]"
        }`}
      >
        <Icon
          className={`h-4 w-4 ${active ? "text-white" : "text-[var(--primary)]"}`}
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
