"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  Factory,
  Users,
  FlaskConical,
  Upload,
} from "lucide-react";

const demoNavItems = [
  { icon: ClipboardList, label: "Orders", id: "orders", href: "/demo/orders" },
  { icon: Users, label: "Customers", id: "customers", href: "/demo/customers" },
  { icon: Factory, label: "Mill Production", id: "mill-production", href: "/demo/mill-production" },
];

// D-24: Production sidebar lists Dashboard (/) and Import (/import) only.
const productionNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", id: "dashboard", href: "/" },
  { icon: Upload,          label: "Import",    id: "import",    href: "/import" },
];

const settingsItems = [
  { icon: FlaskConical, label: "Settings", id: "settings", href: "/settings" },
];

function isActive(href: string, pathname: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname.startsWith(href);
}

/**
 * Context-aware sidebar navigation component.
 *
 * Displays different navigation items based on the current route:
 * - Demo routes (/demo/*): Shows Orders, Customers, and Mill Production links
 * - Production routes: Shows Dashboard and Import navigation items (D-24)
 * - Settings link is visible in both contexts
 *
 * Section label dynamically displays "DEMO" or "PRODUCTION" based on context.
 */
export default function Sidebar() {
  const pathname = usePathname();
  const isDemoContext = pathname.startsWith('/demo');
  const mainNavItems = isDemoContext ? demoNavItems : productionNavItems;

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

      {/* Navigation Section */}
      <span className="mt-2 font-bold tracking-wide text-[var(--fs-10)] text-[var(--text-secondary)]">
        {isDemoContext ? "DEMO" : "PRODUCTION"}
      </span>

      {mainNavItems.map((item) => (
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
