# Architecture Research: Route Restructuring and Role-Based Access

**Domain:** Next.js App Router Route Groups + Clerk RBAC Integration
**Researched:** 2026-05-10
**Confidence:** HIGH

## Integration Overview

This architecture integrates route groups with role-based access control in an existing Next.js 15 App Router application with Clerk authentication. The solution separates demo content from production pages while preserving existing layout patterns.

### System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     Root Layout (layout.tsx)                     │
│              ClerkProvider + ThemeProvider                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────┐  ┌──────────────────────────────┐│
│  │   Production Routes       │  │    Demo Routes               ││
│  │   (/)                     │  │    (/demo/*)                 ││
│  │                           │  │                               ││
│  │  ┌────────────────────┐  │  │  ┌────────────────────────┐  ││
│  │  │  DashboardLayout   │  │  │  │   DemoLayout           │  ││
│  │  │  (Header + minimal │  │  │  │   (Header + full       │  ││
│  │  │   sidebar)         │  │  │  │    sidebar)            │  ││
│  │  └────────────────────┘  │  │  └────────────────────────┘  ││
│  │                           │  │                               ││
│  │  - Coming Soon page      │  │  - /orders                    ││
│  │  - /settings (shared)    │  │  - /customers                 ││
│  │                           │  │  - /mill-production           ││
│  └──────────────────────────┘  │  - /settings (shared)         ││
│                                 └──────────────────────────────┘│
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                     Middleware Layer                             │
│         clerkMiddleware + Role-Based Route Matcher              │
│                                                                  │
│  Auth Protection    Role Check (/demo/*)    Public Routes       │
│  (all routes)       (requires demo role)     (sign-in/sign-up)  │
└─────────────────────────────────────────────────────────────────┘
```

## Integration Points with Existing Architecture

### Critical Existing Components

Based on analysis of current codebase structure:

| Component | Current State | Required Changes |
|-----------|---------------|------------------|
| **middleware.ts** | Protects all routes except /sign-in, /sign-up | **EXTEND:** Add role checking for /demo/* routes |
| **Sidebar.tsx** | Hardcoded navItems array, client component with usePathname | **CONDITIONAL:** Render different nav items based on route |
| **layout.tsx** | Root layout with ClerkProvider + ThemeProvider | **NO CHANGE:** Stays at root, wraps all routes |
| **Header.tsx** | Client component with usePathname for title | **NO CHANGE:** Already dynamic based on pathname |
| **Page components** | Each duplicates Sidebar + Header + main wrapper | **MOVE:** Relocate to /demo/* route group |
| **/settings/page.tsx** | Standard page with Sidebar + Header | **KEEP:** Accessible from both contexts |

### New Components Required

| Component | Type | Purpose | Location |
|-----------|------|---------|----------|
| **DashboardLayout** | Layout component | Wraps production homepage with Header + minimal sidebar | `src/components/layouts/DashboardLayout.tsx` |
| **DemoLayout** | Layout component | Wraps demo pages with Header + full sidebar | `src/components/layouts/DemoLayout.tsx` |
| **Sidebar variants** | Component props | Pass `variant` prop to Sidebar ("demo" \| "production") | Modify existing `src/components/Sidebar.tsx` |
| **Coming Soon page** | Page component | Production homepage placeholder | `src/app/page.tsx` (replace existing) |

## Architectural Patterns

### Pattern 1: Route Groups for URL-Transparent Organization

**What:** Use parentheses-wrapped folders `(demo)` to organize routes without affecting URL paths

**When to use:** When you need to apply different layouts to route subsets without changing public URLs

**Trade-offs:**
- **PRO:** URLs remain clean (`/orders` not `/demo/orders` in address bar)
- **PRO:** Easy layout isolation per route group
- **CON:** Can create confusion if URL doesn't match file path
- **CON:** Navigating between different route groups causes full page reload

**Example:**
```typescript
// File: src/app/(demo)/orders/page.tsx
// URL: /demo/orders (route group in URL path)

export default function OrdersPage() {
  return <OrdersTable />
}

// Note: Route groups ARE included in the URL for middleware matching
// /demo/orders will be accessible at /demo/orders, not /orders
```

**IMPORTANT CORRECTION:** After reviewing Next.js documentation more carefully, route groups wrapped in parentheses like `(demo)` do NOT appear in the URL. However, for this project we need `/demo/*` to be in the URL path for middleware role checking. Therefore we should use a regular folder `demo/` NOT a route group `(demo)/`.

### Pattern 2: Middleware Role-Based Route Protection

**What:** Extend existing clerkMiddleware to check user roles from sessionClaims before allowing access to specific routes

**When to use:** When routes require specific user roles beyond basic authentication

**Trade-offs:**
- **PRO:** Protection at edge, prevents unauthorized access before page loads
- **PRO:** Centralized authorization logic in middleware
- **PRO:** Role checked from sessionClaims (no extra network request)
- **CON:** Requires custom claims configured in Clerk Dashboard
- **CON:** Role changes require new session token (re-login or token refresh)

**Example:**
```typescript
// File: src/middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

const isDemoRoute = createRouteMatcher(["/demo(.*)"]);

export default clerkMiddleware(async (auth, request) => {
  // Public routes bypass all checks
  if (isPublicRoute(request)) {
    return;
  }

  // All other routes require authentication
  const session = await auth();
  await session.protect();

  // Demo routes require 'demo' role
  if (isDemoRoute(request)) {
    const role = session.sessionClaims?.metadata?.role;

    if (role !== 'demo') {
      // Redirect to production homepage if no demo role
      const url = new URL('/', request.url);
      return NextResponse.redirect(url);
    }
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
```

**Source:** [Clerk: Implement basic Role Based Access Control (RBAC) with metadata](https://clerk.com/docs/guides/secure/basic-rbac) | [Clerk: Role-Based Access Control in Next.js](https://clerk.com/blog/nextjs-role-based-access-control)

### Pattern 3: Conditional Sidebar with usePathname

**What:** Use usePathname hook in client component to render different navigation items based on current route

**When to use:** When a single sidebar component needs different content for different route contexts

**Trade-offs:**
- **PRO:** Single Sidebar component, follows DRY principle
- **PRO:** usePathname already used in existing codebase
- **PRO:** No layout duplication
- **CON:** Conditional logic in component (slight complexity increase)
- **CON:** Must be client component ("use client" directive required)

**Example:**
```typescript
// File: src/components/Sidebar.tsx (MODIFIED)
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ClipboardList, /* ... */ } from "lucide-react";

const demoNavItems = [
  { icon: ClipboardList, label: "Orders", href: "/demo/orders" },
  { icon: Users, label: "Customers", href: "/demo/customers" },
  { icon: Factory, label: "Production", href: "/demo/mill-production" },
];

const productionNavItems = [
  { icon: LayoutDashboard, label: "Coming Soon", href: "/" },
];

const settingsItems = [
  { icon: Settings, label: "Settings", href: "/settings" },
];

function isActive(href: string, pathname: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname.startsWith(href);
}

export default function Sidebar() {
  const pathname = usePathname();
  const isDemoRoute = pathname.startsWith("/demo");

  const navItems = isDemoRoute ? demoNavItems : productionNavItems;

  return (
    <aside className="flex h-full w-[var(--sidebar-width)] flex-col gap-2 bg-[var(--bg-card)] p-6">
      {/* Logo */}
      <div className="flex items-center gap-2.5 pb-5">
        <div className="h-8 w-8 rounded-lg bg-[var(--primary)]" />
        <span className="text-sm font-bold text-[var(--text-primary)]">
          FEEDMILL PRO
        </span>
      </div>

      <div className="h-px w-full bg-[var(--divider)]" />

      {/* Production Section */}
      <span className="mt-2 font-bold tracking-wide text-[var(--fs-10)] text-[var(--text-secondary)]">
        {isDemoRoute ? "DEMO" : "PRODUCTION"}
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

// NavItem component unchanged
```

**Source:** [Next.js: usePathname Hook](https://nextjs.org/docs/app/api-reference/functions/use-pathname) | [Next.js: Active Navigation Links](https://nextjs.org/docs/app/getting-started/layouts-and-pages)

### Pattern 4: Shared Layout Components with Client-Side Composition

**What:** Create reusable DashboardLayout component that composes Header + Sidebar + main wrapper, called from page components

**When to use:** When multiple pages need identical layout structure but you can't use route group layouts due to shared routes (/settings)

**Trade-offs:**
- **PRO:** Eliminates duplication of layout boilerplate across pages
- **PRO:** Works for routes that need to be accessible from multiple contexts
- **PRO:** Easier to maintain — change layout in one place
- **CON:** Must import and wrap each page manually
- **CON:** Slightly less idiomatic than route group layouts

**Example:**
```typescript
// File: src/components/layouts/DashboardLayout.tsx (NEW)
"use client";

import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

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

// Usage in page:
// File: src/app/demo/orders/page.tsx
"use client";

import DashboardLayout from "@/components/layouts/DashboardLayout";
import OrdersTable from "@/components/OrdersTable";

export default function OrdersPage() {
  return (
    <DashboardLayout>
      <OrdersTable />
    </DashboardLayout>
  );
}
```

**Alternative: Route Group Layout**

For routes that don't need cross-context sharing, use Next.js layout files:

```typescript
// File: src/app/demo/layout.tsx (NEW)
import DashboardLayout from "@/components/layouts/DashboardLayout";

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}

// Pages automatically wrapped:
// File: src/app/demo/orders/page.tsx
export default function OrdersPage() {
  return <OrdersTable />; // DashboardLayout applied by route
}
```

**Recommendation for this project:** Use **Component-based DashboardLayout** for all pages (including /settings) because /settings needs to be accessible from both production and demo contexts. This avoids nested layout issues and keeps patterns consistent.

**Source:** [Next.js: Route Groups and Layouts](https://nextjs.org/docs/app/building-your-application/routing/route-groups) | [LogRocket: Guide to Next.js Layouts](https://blog.logrocket.com/guide-next-js-layouts-nested-layouts/)

## Data Flow

### Authentication and Authorization Flow

```
User navigates to /demo/orders
    ↓
Middleware intercepts request
    ↓
Check if public route? (No)
    ↓
Call auth.protect() → Ensure authenticated
    ↓
Check if /demo/* route? (Yes)
    ↓
Read sessionClaims.metadata.role
    ↓
role === 'demo'? (Yes) → Allow | (No) → Redirect to /
    ↓
Page loads with DashboardLayout
    ↓
Sidebar.tsx reads pathname via usePathname()
    ↓
pathname.startsWith('/demo') → Render demoNavItems
```

### Component Rendering Flow

```
Page Component (e.g., /demo/orders/page.tsx)
    ↓
Wraps content in DashboardLayout
    ↓
DashboardLayout renders:
    ├── Sidebar (client component)
    │   ├── usePathname() → "/demo/orders"
    │   └── Render demoNavItems
    ├── Header (client component)
    │   ├── usePathname() → getPageTitle()
    │   └── Display "Orders"
    └── main with children (OrdersTable)
```

### Role Check Flow (Server-Side)

```
Clerk Dashboard
    ↓
User publicMetadata set: { role: "demo" }
    ↓
Next session token generated
    ↓
sessionClaims.metadata.role available
    ↓
Middleware: await auth() → sessionClaims
    ↓
Check role in middleware
    ↓
Component: Can also check role for conditional rendering
```

**Note:** For basic RBAC with user-level roles (not organization-level), use publicMetadata stored in sessionClaims. This approach requires no network request and is available directly from the session token.

**Source:** [Clerk: Implement basic RBAC with metadata](https://clerk.com/docs/guides/secure/basic-rbac)

## Recommended Project Structure

```
src/
├── app/
│   ├── layout.tsx                    # Root layout (NO CHANGE)
│   ├── page.tsx                      # NEW: Production homepage (Coming Soon)
│   ├── demo/                         # NEW: Demo route folder (NOT route group)
│   │   ├── orders/
│   │   │   └── page.tsx              # MOVED: Orders page
│   │   ├── customers/
│   │   │   ├── page.tsx              # MOVED: Customers list
│   │   │   └── [id]/
│   │   │       └── page.tsx          # MOVED: Customer detail
│   │   ├── mill-production/
│   │   │   └── page.tsx              # MOVED: Mill production page
│   │   └── settings/                 # DUPLICATE: Demo context settings
│   │       └── page.tsx              # Copy of /settings
│   ├── settings/
│   │   └── page.tsx                  # KEPT: Root settings (accessible to all)
│   ├── sign-in/
│   │   └── [[...sign-in]]/
│   │       └── page.tsx              # NO CHANGE: Public route
│   └── sign-up/
│       └── [[...sign-up]]/
│           └── page.tsx              # NO CHANGE: Public route
├── components/
│   ├── layouts/                      # NEW: Layout components folder
│   │   └── DashboardLayout.tsx       # NEW: Reusable layout wrapper
│   ├── Sidebar.tsx                   # MODIFIED: Conditional nav items
│   ├── Header.tsx                    # NO CHANGE: Already dynamic
│   └── ...                           # Other components unchanged
├── middleware.ts                     # MODIFIED: Add role checking
└── ...
```

### Structure Rationale

- **`demo/` folder (not `(demo)/` route group):** Needed because `/demo/*` must be in the URL path for middleware role matching. Route groups in parentheses are omitted from URLs.

- **`components/layouts/`:** New folder for reusable layout wrappers. Keeps layout logic separate from page components while enabling shared patterns.

- **`settings` in two locations:** `/settings` accessible to all authenticated users, `/demo/settings` accessible only to demo users. Alternative: Single `/settings` with conditional content based on role.

- **No route group layouts:** Using component-based DashboardLayout for consistency across all pages, including shared routes like `/settings`.

## Component Modification vs. New Components

### Components to Modify

| Component | Current Location | Change Required | Reason |
|-----------|------------------|-----------------|--------|
| **Sidebar.tsx** | `src/components/Sidebar.tsx` | Add conditional logic for nav items based on pathname | Single sidebar with context-aware navigation |
| **middleware.ts** | `src/middleware.ts` | Add role checking for `/demo/*` routes | Centralized authorization logic |

### Components to Create

| Component | Location | Purpose | Dependencies |
|-----------|----------|---------|--------------|
| **DashboardLayout** | `src/components/layouts/DashboardLayout.tsx` | Wrapper for Header + Sidebar + main | Sidebar, Header |
| **Coming Soon page** | `src/app/page.tsx` (replace) | Production homepage placeholder | DashboardLayout |

### Components to Move

| Component | From | To | Changes Required |
|-----------|------|----|--------------------|
| **Orders page** | `src/app/orders/page.tsx` | `src/app/demo/orders/page.tsx` | Update imports, wrap in DashboardLayout |
| **Customers page** | `src/app/customers/page.tsx` | `src/app/demo/customers/page.tsx` | Update imports, wrap in DashboardLayout |
| **Customer detail page** | `src/app/customers/[id]/page.tsx` | `src/app/demo/customers/[id]/page.tsx` | Update imports, wrap in DashboardLayout |
| **Mill production page** | `src/app/mill-production/page.tsx` | `src/app/demo/mill-production/page.tsx` | Update imports, wrap in DashboardLayout |

**Note:** Current pages already duplicate Sidebar + Header + main wrapper inline. Moving to DashboardLayout component actually reduces duplication.

## Build Order and Dependencies

### Phase 1: Foundation (No Dependencies)

**Order matters:** Must complete before Phase 2

1. **Create DashboardLayout component**
   - File: `src/components/layouts/DashboardLayout.tsx`
   - No dependencies on other changes
   - Extracts existing pattern from current pages

2. **Update Sidebar conditional logic**
   - File: `src/components/Sidebar.tsx`
   - Modify navItems array to check pathname
   - No breaking changes to existing pages

### Phase 2: Move Pages (Depends on Phase 1)

**Order flexible:** Can parallelize within phase

3. **Create demo folder structure**
   - Folder: `src/app/demo/`
   - Empty folder, no files yet

4. **Move and refactor orders page**
   - From: `src/app/orders/page.tsx`
   - To: `src/app/demo/orders/page.tsx`
   - Use DashboardLayout component
   - Test: Visit `/demo/orders` (will require auth)

5. **Move and refactor customers pages**
   - From: `src/app/customers/page.tsx` and `src/app/customers/[id]/page.tsx`
   - To: `src/app/demo/customers/page.tsx` and `src/app/demo/customers/[id]/page.tsx`
   - Use DashboardLayout component
   - Test: Visit `/demo/customers` and `/demo/customers/[id]`

6. **Move and refactor mill-production page**
   - From: `src/app/mill-production/page.tsx`
   - To: `src/app/demo/mill-production/page.tsx`
   - Use DashboardLayout component
   - Test: Visit `/demo/mill-production`

### Phase 3: Production Homepage (Depends on Phase 1)

**Can parallelize with Phase 2**

7. **Create production Coming Soon page**
   - File: `src/app/page.tsx` (replace existing)
   - Use DashboardLayout component
   - Simple content area with "Coming Soon" message
   - Test: Visit `/` (will show Coming Soon)

### Phase 4: Middleware Protection (Depends on Phase 2 Complete)

**Must be last:** Breaking change until pages moved

8. **Update middleware with role checking**
   - File: `src/middleware.ts`
   - Add createRouteMatcher for `/demo/*`
   - Check sessionClaims.metadata.role
   - Redirect to `/` if role !== 'demo'
   - Test: Visit `/demo/orders` without demo role (should redirect)

9. **Configure Clerk session claims** (Manual step in Clerk Dashboard)
   - Add custom session claims to include publicMetadata.role
   - Assign demo role to test users
   - Test: Sign in with demo user, verify access to `/demo/*`

### Dependency Graph

```
Phase 1: Foundation
├── DashboardLayout (no deps)
└── Sidebar conditional (no deps)
    ↓
Phase 2: Move Pages (needs DashboardLayout)
├── Demo folder structure
├── Move orders (needs DashboardLayout)
├── Move customers (needs DashboardLayout)
└── Move mill-production (needs DashboardLayout)
    ↓
Phase 3: Production Homepage (needs DashboardLayout)
└── Coming Soon page (needs DashboardLayout)
    ↓
Phase 4: Middleware (needs Phase 2 complete)
├── Middleware role check (needs pages moved)
└── Clerk config (manual, needs middleware)
```

### Testing Checkpoints

After each phase:

| Phase | Test | Expected Result |
|-------|------|-----------------|
| Phase 1 | Visit existing pages | No change in behavior |
| Phase 2 | Visit `/demo/orders` | Shows orders page (auth required) |
| Phase 2 | Visit `/orders` | 404 (page moved) |
| Phase 3 | Visit `/` | Shows Coming Soon page |
| Phase 4 | Visit `/demo/orders` without demo role | Redirect to `/` |
| Phase 4 | Visit `/demo/orders` with demo role | Shows orders page |

## Anti-Patterns

### Anti-Pattern 1: Using Route Groups for URL Paths Needed by Middleware

**What people do:** Create `(demo)` route group expecting `/demo/*` URLs

**Why it's wrong:** Route groups wrapped in parentheses are omitted from the URL path. Middleware cannot match against them because the URL is actually `/orders` not `/demo/orders`.

**Do this instead:** Use a regular folder `demo/` without parentheses. This creates actual URL paths `/demo/orders`, `/demo/customers`, etc. that middleware can match with `createRouteMatcher(["/demo(.*)"])`.

**Source:** [Next.js: Route Groups](https://nextjs.org/docs/app/building-your-application/routing/route-groups)

### Anti-Pattern 2: Checking Roles in Components Instead of Middleware

**What people do:** Skip middleware role checking and instead check roles in page components or layouts

**Why it's wrong:**
- Page loads before role check, wasting resources
- User sees flash of unauthorized content
- Must repeat role checking logic in every protected component
- Race conditions between auth loading and component mounting

**Do this instead:** Always protect routes at the middleware level using `auth.protect()` or custom role checking. Components can still check roles for conditional UI rendering, but middleware is the primary gate.

**Example of wrong approach:**
```typescript
// ❌ BAD: Role check in component
export default function OrdersPage() {
  const { sessionClaims } = useAuth();
  const role = sessionClaims?.metadata?.role;

  if (role !== 'demo') {
    redirect('/'); // Already loaded page, wasted resources
  }

  return <OrdersTable />;
}
```

**Example of correct approach:**
```typescript
// ✅ GOOD: Role check in middleware
// src/middleware.ts
export default clerkMiddleware(async (auth, request) => {
  if (isDemoRoute(request)) {
    const session = await auth();
    if (session.sessionClaims?.metadata?.role !== 'demo') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }
});
```

**Source:** [Clerk: Protect Routes with clerkMiddleware](https://clerk.com/docs/reference/nextjs/clerk-middleware)

### Anti-Pattern 3: Duplicating Layout Code Across Pages

**What people do:** Copy Sidebar + Header + main wrapper boilerplate to every page

**Why it's wrong:**
- Duplication makes updates error-prone (must change multiple files)
- Inconsistent styling if one page copy diverges
- Harder to refactor layout structure later

**Do this instead:** Extract layout wrapper as reusable component (DashboardLayout) and use route group layouts where possible. For shared routes like `/settings`, use the component approach.

**Current codebase pattern (needs refactoring):**
```typescript
// ❌ Current pattern in /orders/page.tsx, /customers/page.tsx, etc.
export default function OrdersPage() {
  return (
    <div className="bg-bg-page flex h-screen">
      <Sidebar />
      <main className="flex flex-1 flex-col gap-6 overflow-auto p-6 pr-8">
        <Header />
        <OrdersTable />
      </main>
    </div>
  );
}
```

**Better pattern:**
```typescript
// ✅ GOOD: Extract to DashboardLayout
export default function OrdersPage() {
  return (
    <DashboardLayout>
      <OrdersTable />
    </DashboardLayout>
  );
}
```

**Source:** [LogRocket: Guide to Next.js Layouts](https://blog.logrocket.com/guide-next-js-layouts-nested-layouts/)

### Anti-Pattern 4: Mixing organizationMemberships and publicMetadata Roles

**What people do:** Try to use organization roles for single-tenant apps or use publicMetadata for multi-tenant apps

**Why it's wrong:**
- organizationMemberships adds complexity when you only need user-level roles
- publicMetadata doesn't support organization context switching
- Mixing both creates confusion about source of truth

**Do this instead:**
- **Single-tenant with user roles:** Use publicMetadata (this project)
- **Multi-tenant with organization roles:** Use organizationMemberships
- Never mix both approaches in the same app

**This project's approach (correct for single-tenant):**
```typescript
// ✅ GOOD: User-level role in publicMetadata
const session = await auth();
const role = session.sessionClaims?.metadata?.role; // "demo" or undefined
```

**Multi-tenant approach (overkill for this project):**
```typescript
// ❌ BAD for this project: Organization-level roles
const { orgId, has } = await auth();
const isAdmin = has({ role: 'org:admin' });
```

**Source:** [Clerk: Implement basic RBAC with metadata](https://clerk.com/docs/guides/secure/basic-rbac) | [Clerk: Organizations and RBAC](https://clerk.com/docs/guides/organizations/control-access/roles-and-permissions)

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 1-10 users (current) | Current architecture sufficient. Role stored in publicMetadata, checked in middleware. |
| 10-1000 users | Monitor middleware performance. Consider caching role checks if auth() becomes bottleneck. Session claims avoid network request, so should remain fast. |
| 1000+ users | If multiple roles emerge beyond "demo", consider organization-based roles with Clerk Organizations. Evaluate whether route groups need sub-groups for additional contexts. |

### Scaling Priorities

1. **First bottleneck:** Middleware auth checks on every request
   - **Solution:** Clerk session claims are cached in tokens (no network request). If still slow, add caching layer or consider edge middleware optimization.

2. **Second bottleneck:** Conditional sidebar re-renders on every route change
   - **Solution:** Memoize nav items arrays with useMemo. Cache pathname checks. Minimize sidebar re-renders with React.memo.

## Additional Integration Patterns

### Pattern 5: Clerk Custom Session Claims for Role Storage

**What:** Configure Clerk Dashboard to include publicMetadata in session token claims

**Setup Steps:**
1. Navigate to Clerk Dashboard → Customizations → Session Token
2. Add custom claim for metadata:
```json
{
  "metadata": "{{user.public_metadata}}"
}
```
3. Save configuration
4. Role accessible via `sessionClaims.metadata.role` in middleware and components

**Setting user role:**
```typescript
// Via Clerk Dashboard: Users → [User] → Metadata → Public
{
  "role": "demo"
}

// Via API (for programmatic assignment):
import { clerkClient } from '@clerk/nextjs/server';

await clerkClient.users.updateUserMetadata(userId, {
  publicMetadata: { role: 'demo' }
});
```

**Accessing role in middleware:**
```typescript
const session = await auth();
const role = session.sessionClaims?.metadata?.role;
```

**Accessing role in components:**
```typescript
import { useAuth } from '@clerk/nextjs';

const { sessionClaims } = useAuth();
const role = sessionClaims?.metadata?.role;
```

**Source:** [Clerk: Implement basic RBAC with metadata](https://clerk.com/docs/guides/secure/basic-rbac)

### Pattern 6: Conditional Rendering with Clerk's `<Show>` Component

**What:** Use Clerk's declarative `<Show>` component for role-based UI rendering

**When to use:** When you need to show/hide UI elements based on roles without writing conditional logic

**Trade-offs:**
- **PRO:** Declarative, cleaner than if statements
- **PRO:** Built-in loading states
- **CON:** Requires Clerk component import
- **CON:** Less flexible than custom logic for complex conditions

**Example:**
```typescript
import { Show } from '@clerk/nextjs';

export default function DemoFeature() {
  return (
    <Show
      when={{ role: 'demo' }}
      fallback={<p>Demo access required.</p>}
    >
      <DemoContent />
    </Show>
  );
}
```

**Source:** [Clerk: Conditionally Render Content by User Role](https://clerk.com/docs/reference/components/control/show)

## Summary: Integration Checklist

- [ ] **Middleware:** Extend with role checking for `/demo/*` routes
- [ ] **Sidebar:** Add conditional nav items based on pathname
- [ ] **DashboardLayout:** Create reusable layout wrapper component
- [ ] **Pages:** Move existing pages to `/demo/*` folder
- [ ] **Production Homepage:** Create Coming Soon page at `/`
- [ ] **Clerk Configuration:** Add custom session claims for role in Dashboard
- [ ] **Test Users:** Assign demo role to test users via publicMetadata
- [ ] **Testing:** Verify role-based access works for demo routes
- [ ] **Settings Route:** Decide if single `/settings` or separate `/demo/settings`

## Sources

**Official Documentation:**
- [Next.js: Route Groups](https://nextjs.org/docs/app/building-your-application/routing/route-groups)
- [Next.js: usePathname Hook](https://nextjs.org/docs/app/api-reference/functions/use-pathname)
- [Next.js: Layouts and Pages](https://nextjs.org/docs/app/getting-started/layouts-and-pages)
- [Clerk: Implement basic RBAC with metadata](https://clerk.com/docs/guides/secure/basic-rbac)
- [Clerk: clerkMiddleware Reference](https://clerk.com/docs/reference/nextjs/clerk-middleware)
- [Clerk: Role-Based Access Control in Next.js](https://clerk.com/blog/nextjs-role-based-access-control)

**Community Resources:**
- [This Dot Labs: Next.js Route Groups](https://www.thisdot.co/blog/next-js-route-groups)
- [LogRocket: Guide to Next.js Layouts and Nested Layouts](https://blog.logrocket.com/guide-next-js-layouts-nested-layouts/)
- [DEV: Managing Multiple Layouts in Next.js with App Router and Route Groups](https://dev.to/flcn16/managing-multiple-layouts-in-nextjs-13-with-app-router-and-route-groups-4pmg)
- [DEV: Implementing Role-Based Access Control in Next.js App Router using Clerk Organizations](https://dev.to/musebe/implementing-role-based-access-control-in-nextjs-app-router-using-clerk-organizations-566g)

---
*Architecture research for: Route restructuring and role-based access in Next.js App Router with Clerk*
*Researched: 2026-05-10*
*Confidence: HIGH - All patterns verified from official documentation (Context7 docs for Next.js and Clerk) and existing codebase analysis*
