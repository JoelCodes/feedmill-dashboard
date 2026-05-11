# Phase 26: Route Restructuring and Migration - Research

**Researched:** 2026-05-11
**Domain:** Next.js App Router file-based routing and route reorganization
**Confidence:** HIGH

## Summary

Phase 26 involves migrating existing demo pages (orders, customers, mill-production) from root-level routes to a `/demo/*` namespace, implementing route-based sidebar navigation, and creating a Coming Soon homepage. This is a standard Next.js App Router file structure reorganization with conditional client component rendering.

The technical domain is well-understood: Next.js file-based routing requires moving page.tsx files into new directory structures, and the App Router's `usePathname()` hook provides the standard mechanism for route-aware conditional rendering. The existing codebase already uses `usePathname()` for active link detection, making this a pattern extension rather than a new implementation.

All three pages to migrate have nested routes and test files that must move together. The middleware is already configured for `/demo(.*)` matching, requiring no changes. The primary complexity lies in coordinating multiple file moves while maintaining test coverage and avoiding broken imports.

**Primary recommendation:** Use Next.js file-based routing conventions to move pages into `app/demo/` subdirectories, extend existing `Sidebar.tsx` `usePathname()` patterns to conditionally render navigation items, and replace root `page.tsx` with a minimal Coming Soon message using `DashboardLayout`.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ROUTE-01 | Existing pages (orders, customers, mill-production) moved to `/demo/*` subdirectory | Next.js file-based routing — create `app/demo/orders/`, `app/demo/customers/`, `app/demo/mill-production/` directories with page.tsx files |
| ROUTE-02 | New homepage at `/` displays "Coming Soon" message with full layout (header + sidebar) | Replace `app/page.tsx` with Coming Soon content wrapped in existing `DashboardLayout` component |
| NAV-01 | Sidebar displays different navigation based on route context (demo vs production) | Extend existing `Sidebar.tsx` `usePathname()` pattern to conditionally render different navItems arrays based on route prefix detection |
</phase_requirements>

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01: No redirects from old URLs**
- Old paths (`/orders`, `/customers`, `/mill-production`) will 404 after migration
- Clean break approach — no 308 permanent or 307 temporary redirects
- Requirement ROUTE-03 (redirects) explicitly deferred to future milestone

**D-02: Route-based detection using `usePathname()`**
- Use existing Sidebar pattern for active state detection
- Check pathname prefix to determine demo vs production context
- Consistent with current `isActive()` implementation

**D-03: Production context shows single "Coming Soon" placeholder link**
- Not an empty sidebar
- Not the same navigation as demo context
- Single placeholder item in PRODUCTION section

**D-04: Demo context shows full navigation**
- Orders, Customers, Mill Production links
- All pointing to `/demo/*` paths
- Full feature navigation for demo users

**D-05: Minimal placeholder content for Coming Soon homepage**
- Simple "Coming Soon" heading with brief professional subtext
- No elaborate graphics or animations
- Professional placeholder message

**D-06: Uses full DashboardLayout**
- Coming Soon page uses same Header + Sidebar + main content structure
- Consistent navigation experience across all routes
- No special-case layout for homepage

**D-07: Settings link visible in both contexts**
- Demo sidebar shows Settings link
- Production sidebar shows Settings link
- Users can always access settings regardless of context

### Claude's Discretion

None — all implementation areas were explicitly decided.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Route structure organization | Frontend Server (Next.js App Router) | — | File-based routing is a build-time framework concern, not a client/API concern |
| Conditional navigation rendering | Browser / Client | — | `usePathname()` is a client-side hook; navigation UI is client-rendered |
| Coming Soon page rendering | Frontend Server (SSR) | Browser (hydration) | Static content can be server-rendered, then hydrated for interactivity |
| Middleware route matching | Frontend Server (Edge) | — | Middleware runs on edge before page render, already configured for `/demo(.*)` |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.1.6 → 16.2.6 (latest) | App Router framework | [VERIFIED: npm registry] Project uses Next.js 16.1.6, latest is 16.2.6 (May 2026) — App Router is the standard routing paradigm since Next.js 13 |
| React | 19.2.3 | UI library | [VERIFIED: package.json] Already in use — Next.js builds on React |
| next/navigation | (included in Next.js) | Client-side routing hooks | [CITED: nextjs.org/docs/app/api-reference/functions/use-pathname] Official Next.js navigation API for App Router |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Lucide React | 0.577.0 | Icon library for nav items | [VERIFIED: package.json] Already in use for Sidebar icons — reuse for new navigation items |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `usePathname()` | Route Groups with layouts | Route groups would affect URL structure (user wants clean `/demo/*` paths visible); `usePathname()` keeps URLs explicit and allows single shared Sidebar component |
| Moving files manually | Next.js `rewrites` config | Rewrites add indirection and complexity; file moves are explicit and match URL structure directly |
| Separate Sidebar components | Single Sidebar with conditional logic | Duplicate components create maintenance burden; conditional rendering in one component is standard React pattern |

**Installation:**

No new dependencies required — all capabilities available in existing stack.

**Version verification:**

```bash
npm view next version
# Output: 16.2.6 (as of 2026-05-11)
```

Current project version (16.1.6) is recent enough for all App Router features needed. No upgrade required for phase scope.

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Browser                             │
└───────────┬─────────────────────────────────────────────────────┘
            │ URL request
            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Next.js Middleware (Edge)                     │
│  • Matches /demo(.*) routes → checks demo role → allows/redirects│
│  • Already configured — no changes needed                        │
└───────────┬─────────────────────────────────────────────────────┘
            │ Route matched
            ▼
       ┌────┴────┐
       │ Is demo │ No ──────────────────┐
       │ route?  │                      │
       └────┬────┘                      │
            │ Yes                       │
            ▼                           ▼
┌─────────────────────┐      ┌──────────────────────┐
│ /demo/orders        │      │ / (Coming Soon)      │
│ /demo/customers     │      │ Uses DashboardLayout │
│ /demo/mill-prod     │      │ Minimal content      │
└──────────┬──────────┘      └──────────┬───────────┘
           │                             │
           │ Renders with                │ Renders with
           ▼                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DashboardLayout                             │
│  ┌───────────────┐  ┌───────────────────────────────────────┐   │
│  │   Sidebar     │  │           Header                      │   │
│  │ (client comp) │  │       (shows page title)              │   │
│  │               │  └───────────────────────────────────────┘   │
│  │ usePathname() │  ┌───────────────────────────────────────┐   │
│  │      │        │  │                                       │   │
│  │      ▼        │  │        Page Content                   │   │
│  │ Checks prefix │  │   (OrdersTable / CustomersPage /     │   │
│  │ /demo/* ?     │  │    MillProductionPage /              │   │
│  │      │        │  │    "Coming Soon" message)            │   │
│  │ ┌────┴─────┐ │  │                                       │   │
│  │ │ Demo ctx │ │  └───────────────────────────────────────┘   │
│  │ │ Prod ctx │ │                                              │
│  │ └────┬─────┘ │                                              │
│  │      ▼       │                                              │
│  │ Render:      │                                              │
│  │ • Demo: Orders,                                             │
│  │   Customers,                                                │
│  │   Mill Prod,                                                │
│  │   Settings                                                  │
│  │ • Prod: "Coming                                             │
│  │   Soon" link,                                               │
│  │   Settings                                                  │
│  └───────────────┘                                              │
└─────────────────────────────────────────────────────────────────┘
```

**Data flow:**

1. User navigates to `/demo/orders` or `/` (root)
2. Middleware validates demo role for `/demo/*` routes (already implemented)
3. Next.js resolves route to appropriate `page.tsx` file
4. `DashboardLayout` wraps page content
5. `Sidebar` (client component) calls `usePathname()` to get current route
6. Sidebar checks if pathname starts with `/demo`
7. Sidebar renders demo navigation (if demo route) or production placeholder (if non-demo route)
8. Page content renders inside main area

### Recommended Project Structure

**Current structure:**
```
src/app/
├── orders/page.tsx
├── customers/page.tsx
├── customers/[id]/page.tsx
├── mill-production/page.tsx
├── settings/page.tsx
└── page.tsx (current dashboard)
```

**Target structure (after Phase 26):**
```
src/app/
├── demo/                    # New demo namespace
│   ├── orders/
│   │   ├── __tests__/
│   │   │   └── page.test.tsx
│   │   └── page.tsx
│   ├── customers/
│   │   ├── [id]/
│   │   │   └── page.tsx
│   │   ├── __tests__/
│   │   │   └── page.test.tsx
│   │   └── page.tsx
│   └── mill-production/
│       ├── __tests__/
│       │   └── page.test.tsx
│       └── page.tsx
├── settings/                # Stays at root (accessible to all users)
│   └── page.tsx
└── page.tsx                 # New Coming Soon homepage
```

**Why this structure:**

- `/demo/*` paths explicitly visible in URLs (per D-01, no redirects from old paths)
- Middleware already configured for `/demo(.*)` pattern matching — no changes needed
- Settings stays at root per D-07 (accessible in both demo and production contexts)
- Test files collocated with pages (Next.js allows non-page files in route folders)

### Pattern 1: File-Based Route Migration

**What:** Move page.tsx files into new directory structure to change URL paths

**When to use:** Reorganizing routes without changing page content

**Example:**

```typescript
// Before: src/app/orders/page.tsx → URL: /orders
// After:  src/app/demo/orders/page.tsx → URL: /demo/orders

// No code changes needed inside page.tsx
// File system location defines the route
export default function OrdersPage() {
  return <OrdersTable />
}
```

**Source:** [CITED: nextjs.org/docs/app/getting-started/project-structure] — "Nested folders define route structure where each folder represents a route segment mapped to a corresponding segment in a URL path."

### Pattern 2: Route-Aware Conditional Rendering with `usePathname()`

**What:** Client component uses `usePathname()` to detect current route and render different UI

**When to use:** Navigation, breadcrumbs, or any UI that changes based on current route

**Example:**

```typescript
// Source: Next.js official docs via Context7
'use client'

import { usePathname } from 'next/navigation'

export default function Sidebar() {
  const pathname = usePathname()

  // Determine context based on route prefix
  const isDemoContext = pathname.startsWith('/demo')

  const navItems = isDemoContext
    ? demoNavItems      // Orders, Customers, Mill Production
    : productionNavItems // "Coming Soon" placeholder

  return (
    <aside>
      {navItems.map(item => (
        <NavItem key={item.id} {...item} active={pathname.startsWith(item.href)} />
      ))}
    </aside>
  )
}
```

**Source:** [CITED: nextjs.org/docs/app/api-reference/functions/use-pathname] — Official Next.js `usePathname()` documentation demonstrates using pathname for conditional rendering and active link detection.

**Existing project pattern:**

Current `Sidebar.tsx` already uses `usePathname()` for active state detection:

```typescript
// Existing pattern in src/components/Sidebar.tsx (lines 28-36)
function isActive(href: string, pathname: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname.startsWith(href);
}

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside>
      {navItems.map((item) => (
        <NavItem
          key={item.label}
          active={isActive(item.href, pathname)}
          // ...
        />
      ))}
    </aside>
  );
}
```

Phase 26 extends this pattern to conditionally select `navItems` array based on pathname prefix.

### Pattern 3: Layout Reuse for Consistent Structure

**What:** Wrap different page content in shared `DashboardLayout` component

**When to use:** All authenticated dashboard pages that need Header + Sidebar + main content

**Example:**

```typescript
// src/app/page.tsx (Coming Soon homepage)
import DashboardLayout from '@/components/DashboardLayout'

export default function HomePage() {
  return (
    <DashboardLayout>
      <div className="flex items-center justify-center flex-1">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Coming Soon</h1>
          <p className="text-muted mt-2">Production features launching soon.</p>
        </div>
      </div>
    </DashboardLayout>
  )
}
```

**Source:** Project codebase — `DashboardLayout` already implemented in Phase 25 per NAV-02 requirement. Existing pages (orders, customers, mill-production) already duplicate this structure inline — migration opportunity to use shared component.

### Pattern 4: Test File Migration

**What:** Move test files alongside their page files, preserving test coverage

**When to use:** Any file structure change involving tested components

**Example:**

```bash
# Before
src/app/orders/__tests__/page.test.tsx

# After
src/app/demo/orders/__tests__/page.test.tsx

# Test imports remain the same (relative to page.tsx)
import OrdersPage from '../page'
```

**Why important:** Jest/test runners discover tests by file path. Moving pages without moving tests breaks test coverage. Next.js allows collocating test files with pages because "only content returned by page.js or route.js is sent to client" — other files in route folders are safely ignored.

**Source:** [CITED: nextjs.org/docs/app/getting-started/project-structure] — "Project files can be safely colocated inside route segments in the app directory without accidentally being routable."

### Anti-Patterns to Avoid

- **Changing imports inside moved files unnecessarily:** Next.js `@/` path alias is root-relative, so `@/components/Sidebar` works from any depth. Only update imports if they break (relative imports like `./component` may need adjustment).

- **Creating route groups for this use case:** Route groups `(folder)` affect URL structure by being invisible in paths. User wants explicit `/demo/*` URLs visible. Using route groups would require redirects to maintain old URLs, contradicting D-01 (no redirects).

- **Duplicating Sidebar component:** Creating `DemoSidebar.tsx` and `ProductionSidebar.tsx` duplicates styling and structure. Conditional rendering in a single component is standard React pattern and easier to maintain.

- **Middleware changes for route matching:** Existing middleware already handles `/demo(.*)` pattern. No changes needed. Modifying middleware risks breaking Phase 25 access control.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Route-based conditional logic | Custom context provider tracking current route | `usePathname()` from `next/navigation` | [CITED: nextjs.org] Official Next.js hook, optimized for App Router, updates automatically on navigation, tree-shakeable |
| URL pattern matching | Regex-based route detection with `useRouter()` | `pathname.startsWith('/demo')` with `usePathname()` | String prefix checks are simpler, faster, and more maintainable than regex for simple path matching |
| File moving during route restructure | Manual copy-paste with git mv | Automated refactor tool or careful git mv preserving history | Git tracks file moves if done correctly (`git mv`), preserving blame history and making review easier |

**Key insight:** Next.js App Router's file-based routing removes nearly all routing complexity. The framework handles URL-to-component mapping, middleware integration, and navigation state. Custom routing logic (like manual pattern matching or route configuration files) reintroduces complexity that the framework already solved.

## Runtime State Inventory

> Not applicable — this is a greenfield layout change, not a rename/refactor/migration of existing identifiers. No runtime systems store route paths as data; routes are code organization only.

## Common Pitfalls

### Pitfall 1: Broken Relative Imports After File Moves

**What goes wrong:** Moving `src/app/orders/page.tsx` to `src/app/demo/orders/page.tsx` breaks relative imports like `import { getOrders } from '../../../services/orders'` (now needs one more `../`).

**Why it happens:** Relative imports are resolved from file location. Moving files changes relative paths to siblings, parents, and services.

**How to avoid:**

1. **Prefer absolute imports with `@/` alias** (already configured in project via `tsconfig.json` `paths` field):
   ```typescript
   // Good (depth-independent)
   import { getOrders } from '@/services/orders'
   import Sidebar from '@/components/Sidebar'

   // Avoid (depth-dependent)
   import { getOrders } from '../../../services/orders'
   ```

2. **Verify imports after moving files:**
   ```bash
   npm run build
   # TypeScript will catch broken imports at compile time
   ```

**Warning signs:**

- TypeScript errors: `Cannot find module '../services/orders'`
- Build failures after file moves
- Unexpected `undefined` imports at runtime

### Pitfall 2: Forgetting to Move Test Files

**What goes wrong:** Moving page.tsx but leaving test files in old location causes tests to fail (wrong path) or pass while testing old code (if old page still exists).

**Why it happens:** Test files in `__tests__/` folders aren't automatically tracked when moving sibling files.

**How to avoid:**

1. **Move entire directory structure at once:**
   ```bash
   # Good: Move everything together
   git mv src/app/orders src/app/demo/orders

   # Avoid: Moving files piecemeal
   git mv src/app/orders/page.tsx src/app/demo/orders/page.tsx
   # (Now __tests__ left behind)
   ```

2. **Run tests immediately after migration:**
   ```bash
   npm test
   # Verify all tests still pass and coverage unchanged
   ```

3. **Check test file paths in test output:**
   ```bash
   npm test -- --verbose
   # Verify tests running from new paths: app/demo/orders/__tests__/page.test.tsx
   ```

**Warning signs:**

- Test coverage drops after migration
- Tests pass but don't import from new file locations
- Test runner shows old paths in output

### Pitfall 3: Middleware Pattern Mismatch After Route Changes

**What goes wrong:** Changing route structure without updating middleware matchers causes access control to break (users can access protected routes or get blocked from allowed routes).

**Why it happens:** Middleware uses pattern matching (`/demo(.*)`) to determine which routes to protect. If routes move outside matched patterns, middleware doesn't run.

**How to avoid:**

1. **Verify middleware patterns still match new routes:**
   ```typescript
   // Current middleware (src/middleware.ts line 18)
   const isDemoRoute = createRouteMatcher(['/demo(.*)']);

   // After migration, verify routes are at /demo/orders, /demo/customers, /demo/mill-production
   // Pattern still matches — no changes needed
   ```

2. **Test protected routes after migration:**
   ```bash
   # Manual verification steps:
   # 1. Sign in as user without demo role
   # 2. Try accessing /demo/orders — should redirect to /
   # 3. Try accessing / — should allow
   # 4. Sign in as user with demo role
   # 5. Try accessing /demo/orders — should allow
   ```

**Warning signs:**

- Users can access `/demo/*` routes without demo role
- Users with demo role get redirected unexpectedly
- Middleware logs show routes not being matched (if logging added)

### Pitfall 4: Sidebar Navigation Href Mismatch

**What goes wrong:** Sidebar renders links to old paths (`/orders`) but pages moved to new paths (`/demo/orders`), resulting in 404s when users click navigation.

**Why it happens:** Navigation hrefs are hardcoded strings in Sidebar component. Moving files doesn't automatically update href values.

**How to avoid:**

1. **Update navItems hrefs when changing route structure:**
   ```typescript
   // Before migration
   const navItems = [
     { href: "/orders", label: "Orders" },
     { href: "/customers", label: "Customers" },
     { href: "/mill-production", label: "Production" },
   ]

   // After migration (demo context)
   const demoNavItems = [
     { href: "/demo/orders", label: "Orders" },
     { href: "/demo/customers", label: "Customers" },
     { href: "/demo/mill-production", label: "Production" },
   ]
   ```

2. **Test navigation after migration:**
   ```bash
   # Manual verification:
   # 1. Load /demo/orders
   # 2. Click each sidebar link
   # 3. Verify all links work and don't 404
   ```

3. **Use TypeScript const assertions for safety:**
   ```typescript
   const demoNavItems = [
     { href: "/demo/orders" as const, label: "Orders" },
     // ...
   ] as const

   // Type error if href doesn't match actual routes (with additional typing)
   ```

**Warning signs:**

- Sidebar links result in 404 pages
- Browser console shows `Failed to load resource: 404` for navigation clicks
- Users report "page not found" when clicking sidebar

### Pitfall 5: DashboardLayout Not Applied to Coming Soon Page

**What goes wrong:** New homepage at `/` renders without Header/Sidebar, looking inconsistent with rest of app.

**Why it happens:** Forgetting to wrap page content in `DashboardLayout` component (per D-06 requirement).

**How to avoid:**

1. **Always wrap page content in DashboardLayout for dashboard pages:**
   ```typescript
   // Good
   export default function HomePage() {
     return (
       <DashboardLayout>
         <div>Coming Soon</div>
       </DashboardLayout>
     )
   }

   // Wrong (no layout)
   export default function HomePage() {
     return <div>Coming Soon</div>
   }
   ```

2. **Verify layout structure in browser:**
   ```bash
   # Open /
   # Check for:
   # - Sidebar on left
   # - Header at top
   # - Main content area with Coming Soon message
   ```

**Warning signs:**

- Homepage missing sidebar/header
- Different visual structure than other dashboard pages
- Layout inconsistencies between routes

## Code Examples

Verified patterns from official sources and project codebase.

### Conditional Navigation Based on Route Context

```typescript
// Source: Extends existing pattern in src/components/Sidebar.tsx
'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, ClipboardList, Users, Factory, FlaskConical } from 'lucide-react'

// Demo context navigation (D-04)
const demoNavItems = [
  { icon: ClipboardList, label: "Orders", href: "/demo/orders" },
  { icon: Users, label: "Customers", href: "/demo/customers" },
  { icon: Factory, label: "Mill Production", href: "/demo/mill-production" },
]

// Production context navigation (D-03)
const productionNavItems = [
  { icon: LayoutDashboard, label: "Coming Soon", href: "/" },
]

// Settings visible in both contexts (D-07)
const settingsItems = [
  { icon: FlaskConical, label: "Settings", href: "/settings" },
]

function isActive(href: string, pathname: string): boolean {
  if (href === "/") {
    return pathname === "/"
  }
  return pathname.startsWith(href)
}

export default function Sidebar() {
  const pathname = usePathname()

  // D-02: Route-based detection using usePathname()
  const isDemoContext = pathname.startsWith('/demo')

  // Select appropriate navigation items based on context
  const mainNavItems = isDemoContext ? demoNavItems : productionNavItems

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
  )
}

function NavItem({
  icon: Icon,
  label,
  href,
  active,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  href: string
  active: boolean
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
  )
}
```

### Coming Soon Homepage with DashboardLayout

```typescript
// Source: Project pattern from existing DashboardLayout usage
// File: src/app/page.tsx

import DashboardLayout from '@/components/DashboardLayout'

export default function HomePage() {
  return (
    <DashboardLayout>
      {/* D-05: Minimal placeholder content */}
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

### Migrated Demo Page Structure

```typescript
// Source: Existing page structure, new location
// File: src/app/demo/orders/page.tsx

"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import DashboardLayout from "@/components/DashboardLayout"
import OrdersTable from "@/components/OrdersTable"

function OrdersContent() {
  const searchParams = useSearchParams()
  const initialSelected = searchParams.get("selected")
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(initialSelected)

  useEffect(() => {
    const urlSelected = searchParams.get("selected")
    if (urlSelected) {
      setSelectedOrderId(urlSelected)
    }
  }, [searchParams])

  return (
    <OrdersTable
      selectedOrderId={selectedOrderId}
      onSelectOrder={setSelectedOrderId}
    />
  )
}

export default function OrdersPage() {
  // Now using shared DashboardLayout instead of duplicating structure
  return (
    <DashboardLayout>
      <Suspense fallback={<div className="flex-1 animate-pulse rounded-[var(--radius-xl)] bg-[var(--divider)]" />}>
        <OrdersContent />
      </Suspense>
    </DashboardLayout>
  )
}
```

**Changes from current implementation:**

1. Removed inline `<Sidebar />` and `<Header />` — now provided by `DashboardLayout`
2. Removed wrapping `<div>` and `<main>` structure — now handled by layout
3. Content (OrdersTable) now directly wrapped by `DashboardLayout`
4. No other logic changes — imports, state, effects remain identical

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Pages Router (`pages/` directory) | App Router (`app/` directory) | Next.js 13 (Oct 2022) | File-based routing with improved layouts, server components by default, nested route segments |
| `useRouter()` for pathname | `usePathname()` dedicated hook | Next.js 13 (App Router) | Cleaner API, tree-shakeable, only returns pathname (not entire router object) |
| Per-page layout duplication | Shared layout components | Next.js 13 layouts + React patterns | Eliminates code duplication, consistent structure, easier maintenance |
| Manual route configuration | File system as source of truth | Next.js core philosophy | No config files, explicit structure, URLs match folder hierarchy |

**Deprecated/outdated:**

- **Pages Router `getServerSideProps`/`getStaticProps`**: Replaced by Server Components and `async` component functions in App Router. Not relevant to this phase (all components are client components).
- **`useRouter().pathname` in App Router**: Use dedicated `usePathname()` hook instead. `useRouter()` still exists but for navigation actions (push, replace), not reading state.
- **`_app.tsx` and `_document.tsx`**: Replaced by `layout.tsx` hierarchy in App Router. Root layout already implemented in project.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Current page files have no dependencies on their URL paths (e.g., no hardcoded `/orders` references in logic) | Architecture Patterns → File-Based Route Migration | If pages reference their own URLs in logic, those references break after moving files; requires code changes beyond file moves |
| A2 | Test files can move alongside pages without changing test imports (assuming relative imports like `'../page'`) | Common Pitfalls → Forgetting to Move Test Files | If test imports use absolute paths to old locations, tests will fail after migration; requires import updates |
| A3 | Header's `getPageTitle()` function (lines 23-32) will need updates to recognize `/demo/*` paths | Code Examples → Migrated Demo Page Structure | If not updated, Header will show wrong page titles on demo routes (e.g., "Dashboard" instead of "Orders" on `/demo/orders`); minor UX issue |

**If this table were empty:** All claims in this research were verified or cited — no user confirmation needed.

**Verification needed:**

- **A1**: Review existing page files for hardcoded URL references before migration
- **A2**: Check test file import patterns (run `grep -r "from.*app/orders" tests/`)
- **A3**: Confirm Header component needs updating for demo route titles (review `getPageTitle()` logic)

## Open Questions

None — phase scope is well-defined with explicit user decisions covering all implementation areas.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Next.js build and dev server | ✓ | v24.1.0 | — |
| npm | Package management and scripts | ✓ | 11.5.2 | — |
| Next.js | App Router framework | ✓ | 16.1.6 | — |
| TypeScript | Type checking | ✓ | ^5 (from package.json) | — |
| Jest | Unit/integration testing | ✓ | 30.3.0 | — |

**Missing dependencies with no fallback:**

None — all required tools available.

**Missing dependencies with fallback:**

None — project has complete toolchain.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest 30.3.0 + React Testing Library 16.3.2 |
| Config file | `jest.config.ts` (already exists) |
| Quick run command | `npm test -- --testPathPattern="demo"` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ROUTE-01 | Pages accessible at `/demo/orders`, `/demo/customers`, `/demo/mill-production` | integration | `npm test -- --testPathPattern="app/demo"` | ❌ Wave 0 |
| ROUTE-02 | Root `/` renders Coming Soon with DashboardLayout | integration | `npm test -- src/app/page.test.tsx -x` | ❌ Wave 0 |
| NAV-01 | Sidebar shows demo nav on `/demo/*` routes | unit | `npm test -- Sidebar.test.tsx -x` | ❌ Wave 0 |
| NAV-01 | Sidebar shows production nav on `/` route | unit | `npm test -- Sidebar.test.tsx -x` | ❌ Wave 0 |

**Existing tests to migrate:**

- `src/app/orders/__tests__/page.test.tsx` → `src/app/demo/orders/__tests__/page.test.tsx`
- `src/app/customers/__tests__/page.test.tsx` → `src/app/demo/customers/__tests__/page.test.tsx`
- `src/app/mill-production/__tests__/page.test.tsx` → `src/app/demo/mill-production/__tests__/page.test.tsx`

These tests already exist and have passing coverage. After migration, verify:
1. Tests moved to new locations
2. All tests still pass
3. Coverage percentage unchanged

### Sampling Rate

- **Per task commit:** `npm test -- --testPathPattern="{changed-file-pattern}"` (< 30 sec for relevant subset)
- **Per wave merge:** `npm test` (full suite, ~2 min based on project test count)
- **Phase gate:** Full suite green + manual verification of sidebar navigation contexts

### Wave 0 Gaps

- [ ] `src/app/page.test.tsx` — covers ROUTE-02 (Coming Soon page with layout)
- [ ] `src/components/Sidebar.test.tsx` — update existing tests to cover NAV-01 (demo vs production context rendering)
- [ ] Test helpers for mocking `usePathname()` — if not already available in jest.setup.ts

**Test migration steps:**

1. Move existing test files with their pages (preserves coverage)
2. Update test imports if broken (verify with `npm test`)
3. Create new tests for Coming Soon page and Sidebar context switching
4. Run full suite to verify no regressions

## Security Domain

> Required when `security_enforcement` is enabled (absent = enabled). Phase 26 is primarily a UI/routing reorganization phase with no new security boundaries introduced. Security controls established in Phase 25 (middleware, role checking) remain unchanged.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | no | Clerk handles auth — no changes in Phase 26 |
| V3 Session Management | no | Clerk session management — no changes |
| V4 Access Control | yes (existing) | Middleware role checking already implemented (Phase 25) — no new logic, verifying existing patterns still apply after route moves |
| V5 Input Validation | no | No new user input in this phase |
| V6 Cryptography | no | No cryptographic operations |

### Known Threat Patterns for Next.js App Router

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Unauthorized route access after migration | Tampering / Elevation of Privilege | Middleware pattern matching must still cover new `/demo/*` paths (verified: existing `/demo(.*)` pattern matches) |
| Broken access control from route mismatch | Elevation of Privilege | Manual testing required: verify middleware still protects `/demo/*` routes after file moves |

**Phase 26 security focus:**

- No new attack surface introduced (moving files doesn't change security boundaries)
- Primary risk: middleware configuration drift if routes move outside matched patterns
- Mitigation: Verify `isDemoRoute` matcher still covers new paths (confirmed: `/demo(.*)` regex matches `/demo/orders`, `/demo/customers`, `/demo/mill-production`)

## Sources

### Primary (HIGH confidence)

- Next.js official documentation via Context7: `/vercel/next.js` library — App Router routing, `usePathname()`, file-based routing conventions, project structure
- Project codebase files: `src/middleware.ts`, `src/components/Sidebar.tsx`, `src/components/DashboardLayout.tsx`, `package.json` — existing patterns and dependencies

### Secondary (MEDIUM confidence)

- [Functions: usePathname | Next.js](https://nextjs.org/docs/app/api-reference/functions/use-pathname) — Official Next.js documentation for `usePathname()` hook
- [Next.js Functions: usePathname - GeeksforGeeks](https://www.geeksforgeeks.org/reactjs/nextjs-functions-usepathname/) — Community documentation and examples
- [Next.js pathname vs path: Everything Developers Need to Know](https://go.lightnode.com/nextjs/nextjs-pathname-vs-path) — Pattern comparisons

### Tertiary (LOW confidence)

None — all research backed by official documentation or verified project code.

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - Project uses Next.js 16.1.6 (verified in package.json), App Router is standard since Next.js 13
- Architecture: HIGH - File-based routing and `usePathname()` are official Next.js patterns, extensively documented
- Pitfalls: HIGH - Common migration issues documented in Next.js migration guides and GitHub discussions

**Research date:** 2026-05-11

**Valid until:** ~60 days (Next.js patterns stable; minor version updates unlikely to affect routing fundamentals)

---

*Phase 26 Research Complete — Ready for Planning*
