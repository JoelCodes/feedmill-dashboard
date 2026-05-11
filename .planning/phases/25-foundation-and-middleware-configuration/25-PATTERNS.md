# Phase 25: Foundation and Middleware Configuration - Pattern Map

**Mapped:** 2026-05-10
**Files analyzed:** 3 files (1 new type definition, 1 middleware modification, 1 new layout component)
**Analogs found:** 3 / 3

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/types/clerk.d.ts` | type-definition | compile-time | `src/types/customer.ts` | role-match |
| `src/middleware.ts` | middleware | request-response | `src/middleware.ts` (existing) | exact |
| `src/components/DashboardLayout.tsx` | component | client-render | `src/app/orders/page.tsx` | pattern-match |

## Pattern Assignments

### `src/types/clerk.d.ts` (type-definition, compile-time)

**Analog:** `src/types/customer.ts`

**Type definition pattern** (lines 1-28):
```typescript
import { BinAlertLevel } from "./bin";

export type { BinAlertLevel };

export interface Customer {
  id: string;
  name: string;
  location: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  deliveryPreferences?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerStats {
  totalOrders: number;
  activeOrders: number;
  completedOrders: number;
  hasChanges: boolean;
  binAlertLevel: BinAlertLevel;
  activeBins: number;
}

export interface CustomerWithStats extends Customer {
  stats: CustomerStats;
}
```

**Key patterns:**
- Clean interface definitions with optional properties using `?`
- Type aliases exported separately from interfaces
- Re-exporting imported types for convenience
- No runtime code - pure type definitions

**New pattern for clerk.d.ts (from RESEARCH.md):**
```typescript
// Module augmentation pattern for global type extension
export {}  // Makes file a module

export type Role = 'demo' | 'admin' | 'user'

declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      role?: Role
    }
  }
}
```

---

### `src/middleware.ts` (middleware, request-response)

**Analog:** `src/middleware.ts` (existing file - extend pattern)

**Existing middleware structure** (lines 1-31):
```typescript
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

/**
 * Routes that are publicly accessible without authentication.
 * All other routes are protected by default.
 */
const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  // Protect all routes except public ones
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

/**
 * Middleware matcher configuration.
 * Uses broad matcher to ensure middleware runs on all routes.
 * Excludes static files and Next.js internals.
 */
export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
```

**Patterns to maintain:**
- `createRouteMatcher` for route pattern matching
- Async middleware function with `(auth, request)` parameters
- `await auth.protect()` for authentication enforcement
- JSDoc comments for route matcher documentation
- `export const config` with matcher array

**Extension pattern (from RESEARCH.md):**
```typescript
// Add new route matcher
const isDemoRoute = createRouteMatcher(['/demo(.*)'])

// Add role checking logic in middleware function after auth.protect()
if (isDemoRoute(req)) {
  const { sessionClaims } = await auth()
  if (sessionClaims?.metadata?.role !== 'demo') {
    const url = new URL('/', req.url)
    return NextResponse.redirect(url)  // 307 temporary redirect by default
  }
}
```

**Import additions needed:**
```typescript
import { NextResponse } from 'next/server'
```

---

### `src/components/DashboardLayout.tsx` (component, client-render)

**Analog:** `src/app/orders/page.tsx` (existing layout pattern to extract)

**Layout structure to extract** (lines 31-43):
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

**Component patterns from Sidebar.tsx** (lines 1-4, 35-36):
```typescript
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();
  // ... uses pathname for active state detection
}
```

**Component patterns from Header.tsx** (lines 1, 11-12, 34-37):
```typescript
'use client';

import { UserButton, ClerkLoaded, ClerkLoading } from '@clerk/nextjs';
import { clerkAppearance } from '@/lib/clerk-theme';

export default function Header({ onSearch }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const title = getPageTitle(pathname);
  // ... uses pathname for page title
}
```

**DashboardLayout composition pattern:**
```typescript
'use client'

import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'

interface DashboardLayoutProps {
  children: React.ReactNode
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
  )
}
```

**Key patterns:**
- `'use client'` directive at top (required for usePathname)
- Import existing Sidebar and Header components
- Standard component structure with interface for props
- Children passed through for page content
- CSS classes match existing pattern exactly
- No Suspense wrapper needed in layout (pages handle their own loading states)

---

## Shared Patterns

### Client Component with 'use client' Directive

**Source:** `src/components/Sidebar.tsx` (line 1), `src/components/Header.tsx` (line 1)
**Apply to:** `src/components/DashboardLayout.tsx`

```typescript
"use client";
// or
'use client';
```

**Rationale:** Required for any component using React hooks like `usePathname()` or `useRouter()`. Both quote styles are valid.

### Import Path Aliases

**Source:** `src/components/Header.tsx` (lines 6-12)
**Apply to:** All new files

```typescript
import { useDebounce } from '@/hooks/useDebounce';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { getNotifications } from '@/services/notifications';
import { Notification } from '@/types/notification';
import NotificationDropdown from './NotificationDropdown';
import { UserButton, ClerkLoaded, ClerkLoading } from '@clerk/nextjs';
import { clerkAppearance } from '@/lib/clerk-theme';
```

**Pattern:** Use `@/` alias for absolute imports from `src/`, relative imports (`./`) for same-directory files.

### TypeScript Interface Definitions

**Source:** `src/types/customer.ts` (lines 5-14), `src/components/Header.tsx` (lines 14-16)
**Apply to:** `src/components/DashboardLayout.tsx`

```typescript
interface DashboardLayoutProps {
  children: React.ReactNode
}

// or with export
export interface HeaderProps {
  onSearch?: (query: string) => void;
}
```

**Pattern:** Interface for component props, optional properties with `?`, `React.ReactNode` for children.

### Middleware Testing Pattern

**Source:** `src/middleware.test.ts`
**Apply to:** Tests for modified middleware

**Mock pattern** (lines 1-5):
```typescript
// Mock Clerk imports before importing middleware
jest.mock("@clerk/nextjs/server", () => ({
  clerkMiddleware: (fn: () => void) => fn,
  createRouteMatcher: () => () => false,
}));
```

**Config testing pattern** (lines 13-18):
```typescript
describe("middleware", () => {
  describe("middleware configuration", () => {
    it("exports a config object with matcher array", () => {
      expect(config).toBeDefined();
      expect(config).toHaveProperty("matcher");
      expect(Array.isArray(config.matcher)).toBe(true);
    });
```

**File content verification pattern** (lines 56-68):
```typescript
it("defines /sign-in as a public route", async () => {
  const fs = await import("fs/promises");
  const path = await import("path");

  const middlewarePath = path.join(__dirname, "middleware.ts");
  const middlewareContent = await fs.readFile(middlewarePath, "utf-8");

  // Per PROT-03 requirement: /sign-in must be publicly accessible
  expect(middlewareContent).toContain('"/sign-in');
  expect(middlewareContent).toContain("isPublicRoute");
  expect(middlewareContent).toContain("createRouteMatcher");
});
```

### Component Testing Pattern

**Source:** `src/components/ThemeProvider.test.tsx`
**Apply to:** Tests for DashboardLayout component

**Basic render test** (lines 1-2, 12-21):
```typescript
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "./ThemeProvider";

it("renders children", () => {
  render(
    <ThemeProvider>
      <div data-testid="child">Test content</div>
    </ThemeProvider>
  );

  expect(screen.getByTestId("child")).toBeInTheDocument();
  expect(screen.getByText("Test content")).toBeInTheDocument();
});
```

**Mock external dependencies** (lines 4-9):
```typescript
// Mock next-themes since it requires browser APIs
jest.mock("next-themes", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-theme-provider">{children}</div>
  ),
}));
```

### E2E Route Testing Pattern

**Source:** `e2e/route-protection.spec.ts`
**Apply to:** E2E tests for demo route protection

**Test structure** (lines 1, 13-18, 22-30):
```typescript
import { test, expect } from '@playwright/test';

const protectedRoutes = [
  '/orders',
  '/customers',
  '/mill-production',
  '/settings',
] as const;

test.describe('Route Protection', () => {
  test.describe('PROT-01: Unauthenticated redirect to sign-in', () => {
    for (const route of protectedRoutes) {
      test(`unauthenticated user accessing ${route} redirects to sign-in`, async ({ page }) => {
        // Navigate to protected route without authentication
        await page.goto(route);

        // Verify redirect to sign-in page (regex handles query params)
        await expect(page).toHaveURL(/\/sign-in/);
      });
    }
  });
```

**Pattern:** Use `test.describe` nesting, loop over routes, regex URL matching for redirects.

---

## No Analog Found

All files have strong analogs:
- Type definitions follow existing `src/types/*.ts` pattern
- Middleware extends existing `src/middleware.ts`
- DashboardLayout extracts pattern from existing page layouts

---

## Metadata

**Analog search scope:** `src/types/`, `src/middleware.ts`, `src/components/`, `src/app/**/page.tsx`, `e2e/`
**Files scanned:** 11 (3 primary analogs + 8 supporting pattern files)
**Pattern extraction date:** 2026-05-10

**Key insights:**
- Project has consistent TypeScript patterns across type definitions
- Middleware already uses Clerk patterns, just needs role checking extension
- Layout structure is duplicated across pages - DashboardLayout will extract this
- Testing patterns well-established for middleware (file content verification) and components (render + mock)
- Client components consistently use 'use client' directive and pathname hooks
