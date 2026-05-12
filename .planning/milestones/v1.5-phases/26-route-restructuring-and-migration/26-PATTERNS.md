# Phase 26: Route Restructuring and Migration - Pattern Map

**Mapped:** 2026-05-11
**Files analyzed:** 11 new/modified files
**Analogs found:** 11 / 11

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/app/demo/orders/page.tsx` | page | request-response | `src/app/orders/page.tsx` | exact (migration) |
| `src/app/demo/customers/page.tsx` | page | request-response | `src/app/customers/page.tsx` | exact (migration) |
| `src/app/demo/customers/[id]/page.tsx` | page | request-response | `src/app/customers/[id]/page.tsx` | exact (migration) |
| `src/app/demo/mill-production/page.tsx` | page | request-response | `src/app/mill-production/page.tsx` | exact (migration) |
| `src/app/page.tsx` | page | request-response | `src/app/settings/page.tsx` | role-match |
| `src/components/Sidebar.tsx` | component | UI-conditional | `src/components/Sidebar.tsx` (current) | exact (modification) |
| `src/components/Header.tsx` | component | UI-conditional | `src/components/Header.tsx` (current) | exact (modification) |
| `src/app/demo/orders/__tests__/page.test.tsx` | test | — | `src/app/orders/__tests__/page.test.tsx` | exact (migration) |
| `src/app/demo/customers/__tests__/page.test.tsx` | test | — | `src/app/customers/__tests__/page.test.tsx` | exact (migration) |
| `src/app/demo/customers/[id]/page.test.tsx` | test | — | `src/app/customers/[id]/page.test.tsx` | exact (migration) |
| `src/app/demo/mill-production/__tests__/page.test.tsx` | test | — | `src/app/mill-production/__tests__/page.test.tsx` | exact (migration) |

## Pattern Assignments

### `src/app/demo/orders/page.tsx` (page, request-response)

**Analog:** `src/app/orders/page.tsx`

**Migration approach:** Move file from `src/app/orders/page.tsx` to `src/app/demo/orders/page.tsx` with layout refactor.

**Current structure** (lines 31-43):
```typescript
export default function OrdersPage() {
  return (
    <div className="bg-bg-page flex h-screen">
      <Sidebar />
      <main className="flex flex-1 flex-col gap-6 overflow-auto p-6 pr-8">
        <Header />
        <Suspense fallback={<div className="flex-1 animate-pulse rounded-[var(--radius-xl)] bg-[var(--divider)]" />}>
          <OrdersContent />
        </Suspense>
      </main>
    </div>
  );
}
```

**Target pattern** (use DashboardLayout):
```typescript
import DashboardLayout from "@/components/DashboardLayout"

export default function OrdersPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={<div className="flex-1 animate-pulse rounded-[var(--radius-xl)] bg-[var(--divider)]" />}>
        <OrdersContent />
      </Suspense>
    </DashboardLayout>
  );
}
```

**Import block** (lines 1-7, modified):
```typescript
"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import OrdersTable from "@/components/OrdersTable";
```

**Key changes:**
- Remove `Sidebar` and `Header` imports (provided by DashboardLayout)
- Add `DashboardLayout` import
- Remove manual layout `<div>` and `<main>` structure
- Wrap content directly in `<DashboardLayout>`
- All other logic (useState, useEffect, OrdersContent component) remains identical

---

### `src/app/demo/customers/page.tsx` (page, request-response)

**Analog:** `src/app/customers/page.tsx`

**Migration approach:** Move file from `src/app/customers/page.tsx` to `src/app/demo/customers/page.tsx` with layout refactor.

**Current structure** (lines 77-192):
```typescript
export default function CustomersPage() {
  // ... state and hooks ...
  return (
    <div className="bg-bg-page flex h-screen">
      <Sidebar />
      <main className="flex flex-1 flex-col gap-6 overflow-auto p-6 pr-8">
        <Header />
        {/* Customer List Card */}
        <Card className="flex flex-1 flex-col">
          {/* ... card content ... */}
        </Card>
      </main>
    </div>
  );
}
```

**Target pattern** (use DashboardLayout):
```typescript
import DashboardLayout from '@/components/DashboardLayout'

export default function CustomersPage() {
  // ... state and hooks (unchanged) ...
  return (
    <DashboardLayout>
      {/* Customer List Card */}
      <Card className="flex flex-1 flex-col">
        {/* ... card content (unchanged) ... */}
      </Card>
    </DashboardLayout>
  );
}
```

**Import block changes** (lines 1-12):
```typescript
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Package, AlertTriangle, Search, Users } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import Card from '@/components/ui/Card';
import { getCustomers } from '@/services/customers';
import { sortCustomersByRecentActivity } from '@/utils/customerSort';
import { useDebounce } from '@/hooks/useDebounce';
import { CustomerWithStats } from '@/types/customer';
```

**Key changes:**
- Remove `Sidebar` and `Header` imports
- Add `DashboardLayout` import
- Remove layout wrapper divs
- All state, effects, and business logic unchanged

---

### `src/app/demo/customers/[id]/page.tsx` (page, request-response)

**Analog:** `src/app/customers/[id]/page.tsx`

**Migration approach:** Move file from `src/app/customers/[id]/page.tsx` to `src/app/demo/customers/[id]/page.tsx` with layout refactor.

**Pattern:** Follow same layout refactor as other pages (replace manual Sidebar/Header/layout structure with DashboardLayout wrapper). All customer detail logic and UI remains unchanged.

---

### `src/app/demo/mill-production/page.tsx` (page, request-response)

**Analog:** `src/app/mill-production/page.tsx`

**Migration approach:** Move file from `src/app/mill-production/page.tsx` to `src/app/demo/mill-production/page.tsx` with layout refactor.

**Current structure** (lines 248-277):
```typescript
export default function MillProductionPage() {
  // ... state and logic ...
  return (
    <div className="bg-bg-page flex h-screen">
      <Sidebar />
      <main className="flex flex-1 flex-col gap-6 overflow-auto p-6 pr-8">
        <Header />
        {/* Filter strip */}
        <div className="flex gap-2.5">
          {/* ... filter pills ... */}
        </div>
        {loading ? (
          <LoadingSkeleton />
        ) : (
          <div className="flex gap-6">
            {/* ... mill columns ... */}
          </div>
        )}
      </main>
    </div>
  );
}
```

**Target pattern**:
```typescript
import DashboardLayout from "@/components/DashboardLayout";

export default function MillProductionPage() {
  // ... state and logic (unchanged) ...
  return (
    <DashboardLayout>
      {/* Filter strip */}
      <div className="flex gap-2.5">
        {/* ... filter pills (unchanged) ... */}
      </div>
      {loading ? (
        <LoadingSkeleton />
      ) : (
        <div className="flex gap-6">
          {/* ... mill columns (unchanged) ... */}
        </div>
      )}
    </DashboardLayout>
  );
}
```

**Import changes** (lines 1-12):
```typescript
"use client";

import { useEffect, useState, useMemo } from "react";
import {
  ProductionOrder,
  ProductionState,
  MillLine,
} from "@/types/millProduction";
import { getProductionOrders } from "@/services/millProduction";
import DashboardLayout from "@/components/DashboardLayout";
import FilterPill, { FilterPillColorConfig } from "@/components/ui/FilterPill";
```

---

### `src/app/page.tsx` (page, request-response)

**Analog:** `src/app/settings/page.tsx` (for DashboardLayout usage pattern)

**Current file:** Dashboard page with KPI cards and orders table (lines 1-42 of existing `src/app/page.tsx`)

**Target pattern:** Replace entire file with Coming Soon message using DashboardLayout.

**Complete new content**:
```typescript
import DashboardLayout from '@/components/DashboardLayout'

export default function HomePage() {
  return (
    <DashboardLayout>
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            Coming Soon
          </h1>
          <p className="text-text-secondary mt-2 text-sm">
            Production features launching soon.
          </p>
        </div>
      </div>
    </DashboardLayout>
  )
}
```

**Pattern notes:**
- Uses server component (no "use client" directive needed for static content)
- Follows decision D-05 (minimal placeholder content)
- Follows decision D-06 (full DashboardLayout)
- Uses project's CSS variable conventions for styling
- Vertical and horizontal centering with flex utilities

---

### `src/components/Sidebar.tsx` (component, UI-conditional)

**Analog:** `src/components/Sidebar.tsx` (current implementation)

**Modification approach:** Extend existing `usePathname()` pattern to conditionally render navigation items based on route context.

**Current navItems pattern** (lines 15-26):
```typescript
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
```

**Target pattern:** Replace static arrays with context-aware conditional logic.

**Demo context navigation** (decision D-04):
```typescript
const demoNavItems = [
  { icon: ClipboardList, label: "Orders", id: "orders", href: "/demo/orders" },
  { icon: Users, label: "Customers", id: "customers", href: "/demo/customers" },
  { icon: Factory, label: "Mill Production", id: "mill-production", href: "/demo/mill-production" },
];
```

**Production context navigation** (decision D-03):
```typescript
const productionNavItems = [
  { icon: LayoutDashboard, label: "Coming Soon", id: "coming-soon", href: "/" },
];
```

**Settings navigation** (decision D-07 - visible in both contexts):
```typescript
const settingsItems = [
  { icon: FlaskConical, label: "Settings", id: "settings", href: "/settings" },
];
```

**Existing isActive pattern** (lines 28-33 - reuse unchanged):
```typescript
function isActive(href: string, pathname: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname.startsWith(href);
}
```

**Existing usePathname usage** (line 36 - extend this pattern):
```typescript
export default function Sidebar() {
  const pathname = usePathname();
  // Add context detection:
  const isDemoContext = pathname.startsWith('/demo');

  // Select navigation based on context:
  const mainNavItems = isDemoContext ? demoNavItems : productionNavItems;

  // ... rest of component
}
```

**Section label pattern** (line 51-52 - update to show context):
```typescript
<span className="mt-2 font-bold tracking-wide text-[var(--fs-10)] text-[var(--text-secondary)]">
  {isDemoContext ? "DEMO" : "PRODUCTION"}
</span>
```

**NavItem rendering** (lines 55-63 - unchanged, just uses dynamic mainNavItems):
```typescript
{mainNavItems.map((item) => (
  <NavItem
    key={item.label}
    icon={item.icon}
    label={item.label}
    href={item.href}
    active={isActive(item.href, pathname)}
  />
))}
```

**Settings section** (lines 68-81 - update label from "Formulas" to "Settings"):
```typescript
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
```

**NavItem component** (lines 86-124 - unchanged):
```typescript
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
      {/* ... icon and label rendering unchanged ... */}
    </Link>
  );
}
```

**Key changes summary:**
1. Replace single static `navItems` with `demoNavItems` and `productionNavItems`
2. Add `isDemoContext = pathname.startsWith('/demo')` after `usePathname()` call
3. Select `mainNavItems` conditionally: `isDemoContext ? demoNavItems : productionNavItems`
4. Update section label to show "DEMO" or "PRODUCTION" based on context
5. Update settings array to use `/settings` href and "Settings" label
6. All rendering logic and styling unchanged

---

### `src/components/Header.tsx` (component, UI-conditional)

**Analog:** `src/components/Header.tsx` (current implementation)

**Modification approach:** Extend `getPageTitle()` function to recognize `/demo/*` paths.

**Current getPageTitle pattern** (lines 23-32):
```typescript
const getPageTitle = (path: string): string => {
  if (path === '/') return 'Dashboard';
  if (path.startsWith('/orders')) return 'Orders';
  if (path.startsWith('/mill-production')) return 'Production';
  if (path.startsWith('/inventory')) return 'Inventory';
  if (path.startsWith('/shipments')) return 'Shipments';
  if (path.startsWith('/customers')) return 'Customers';
  if (path.startsWith('/settings')) return 'Settings';
  return 'Dashboard';
};
```

**Target pattern:** Add demo route detection before checking old routes.

```typescript
const getPageTitle = (path: string): string => {
  // Check for demo routes first
  if (path.startsWith('/demo/orders')) return 'Orders';
  if (path.startsWith('/demo/customers')) return 'Customers';
  if (path.startsWith('/demo/mill-production')) return 'Mill Production';

  // Non-demo routes
  if (path === '/') return 'Coming Soon';
  if (path.startsWith('/settings')) return 'Settings';

  // Legacy routes (will 404 after migration, but keep for safety during transition)
  if (path.startsWith('/orders')) return 'Orders';
  if (path.startsWith('/mill-production')) return 'Production';
  if (path.startsWith('/inventory')) return 'Inventory';
  if (path.startsWith('/shipments')) return 'Shipments';
  if (path.startsWith('/customers')) return 'Customers';

  return 'Dashboard';
};
```

**Existing usage pattern** (lines 34-37 - unchanged):
```typescript
export default function Header({ onSearch }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const title = getPageTitle(pathname);
  // ... rest of component uses `title` unchanged
}
```

**Key changes:**
1. Check `/demo/*` routes first (more specific matches before general matches)
2. Update root `/` title from "Dashboard" to "Coming Soon"
3. Keep legacy route checks for safety (they'll naturally 404, but won't break Header if routes still accessed during testing)
4. All other Header logic, rendering, and styling unchanged

---

### Test Files Migration Pattern

**Analogs:** Existing test files at current locations

**Migration approach:** Move test files alongside their page files, preserving test structure and coverage.

#### `src/app/demo/orders/__tests__/page.test.tsx`

**Current location:** `src/app/orders/__tests__/page.test.tsx`

**Migration:** Move entire file to new location with one import path update.

**Current import** (line 2):
```typescript
import OrdersPage from "../page";
```

**After migration:** Same relative import works (still `../page` from `__tests__/` subdirectory).

**Mock adjustments** (line 12):
```typescript
jest.mock("next/navigation", () => ({
  useSearchParams: jest.fn(() => ({
    get: jest.fn(() => null),
  })),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
  usePathname: jest.fn(() => "/demo/orders"), // Update from "/orders" to "/demo/orders"
}));
```

**Key change:** Update `usePathname` mock to return `/demo/orders` instead of `/orders`.

#### `src/app/demo/customers/__tests__/page.test.tsx`

**Current location:** `src/app/customers/__tests__/page.test.tsx`

**Pattern:** Same as orders - move file, update `usePathname` mock from `/customers` to `/demo/customers`.

#### `src/app/demo/customers/[id]/page.test.tsx`

**Current location:** `src/app/customers/[id]/page.test.tsx`

**Pattern:** Move file, update `usePathname` mock from `/customers/:id` pattern to `/demo/customers/:id`.

#### `src/app/demo/mill-production/__tests__/page.test.tsx`

**Current location:** `src/app/mill-production/__tests__/page.test.tsx`

**Pattern:** Same as others - move file, update `usePathname` mock from `/mill-production` to `/demo/mill-production`.

---

## Shared Patterns

### DashboardLayout Usage

**Source:** `src/components/DashboardLayout.tsx`

**Apply to:** All new/migrated page files (`src/app/demo/*/page.tsx`, `src/app/page.tsx`)

**Pattern:**
```typescript
import DashboardLayout from '@/components/DashboardLayout';

export default function PageName() {
  return (
    <DashboardLayout>
      {/* Page content goes here */}
    </DashboardLayout>
  );
}
```

**What it provides** (lines 21-30):
```typescript
export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="bg-bg-page flex h-screen">
      <Sidebar />
      <main className="flex flex-1 flex-col gap-6 overflow-auto p-6 pr-8">
        <Header />
        {children}
      </main>
    </div>
  );
}
```

**Why use it:**
- Eliminates layout duplication across pages (NAV-02 requirement)
- Ensures consistent Sidebar and Header placement
- Consistent spacing and styling via project CSS variables
- Sidebar will automatically show correct navigation context via `usePathname()`

### Route-Based Context Detection

**Source:** `src/components/Sidebar.tsx` (existing pattern extended)

**Pattern:**
```typescript
import { usePathname } from 'next/navigation';

export default function ComponentName() {
  const pathname = usePathname();
  const isDemoContext = pathname.startsWith('/demo');

  // Use isDemoContext to conditionally render/select data
  const items = isDemoContext ? demoItems : productionItems;

  return (/* ... */);
}
```

**Apply to:** Any component needing route-aware conditional behavior.

**Why this pattern:**
- Already used in Sidebar for `isActive()` detection
- Next.js official pattern for client-side route awareness
- Simple, performant, no regex needed for prefix matching
- Updates automatically on navigation

### Client Component Wrapper for Suspense Boundaries

**Source:** `src/app/orders/page.tsx` (existing pattern to preserve)

**Pattern:**
```typescript
"use client";

import { Suspense } from "react";

function ContentComponent() {
  const searchParams = useSearchParams(); // or other client hooks
  // ... component logic
  return (/* content */);
}

export default function PageName() {
  return (
    <DashboardLayout>
      <Suspense fallback={<div className="flex-1 animate-pulse rounded-[var(--radius-xl)] bg-[var(--divider)]" />}>
        <ContentComponent />
      </Suspense>
    </DashboardLayout>
  );
}
```

**Apply to:** Pages using `useSearchParams()` or other client hooks that need Suspense boundaries.

**Why this pattern:**
- `useSearchParams()` requires Suspense boundary per Next.js App Router requirements
- Separating content component allows proper Suspense wrapping
- Loading skeleton matches project's animation and styling conventions

### CSS Variable Conventions

**Source:** All existing page and component files

**Pattern:**
```typescript
// Colors
className="bg-[var(--bg-page)]"
className="text-[var(--text-primary)]"
className="text-[var(--text-secondary)]"
style={{ color: 'var(--primary)' }}

// Spacing/sizing
className="rounded-[var(--radius-xl)]"
className="shadow-[var(--shadow-card)]"

// State colors
className="bg-[var(--error)]"
className="text-[var(--warning)]"
```

**Apply to:** All new content and styling.

**Why this pattern:**
- Project uses CSS custom properties for theming
- Supports light/dark theme switching via next-themes
- Consistent with all existing components

---

## No Analog Found

All files in this phase have exact analogs (either existing implementations to migrate or extend).

| File | Status |
|------|--------|
| All 11 files | ✅ Analogs found |

---

## Metadata

**Analog search scope:**
- `src/app/` directory (page files)
- `src/components/` directory (layout components)
- Test files in `__tests__/` subdirectories

**Files scanned:** 11 page files, 4 component files, 5 test files

**Pattern extraction date:** 2026-05-11

**Key patterns identified:**
1. **DashboardLayout consolidation** - All pages move from inline layout to shared DashboardLayout component
2. **Route-based context detection** - Sidebar uses `pathname.startsWith('/demo')` to switch navigation
3. **File-based routing migration** - Pages move from `app/[name]/` to `app/demo/[name]/` with no logic changes
4. **Test file colocation** - Tests move with pages, only pathname mocks need updating
5. **CSS variable theming** - All styling uses `var(--token-name)` pattern for theme consistency
