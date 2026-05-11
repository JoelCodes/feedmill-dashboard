# Phase 25: Foundation and Middleware Configuration - Research

**Researched:** 2026-05-10
**Domain:** Clerk authentication, Next.js middleware, TypeScript module augmentation, shared layout components
**Confidence:** HIGH

## Summary

Phase 25 establishes role-based access control infrastructure and eliminates layout duplication across dashboard pages. This phase adds role data to Clerk session tokens via publicMetadata, extends TypeScript interfaces for type-safe role checking, implements middleware protection for `/demo/*` routes, and creates a reusable DashboardLayout component.

The implementation leverages Clerk's built-in JWT session claim customization and Next.js App Router middleware patterns. All patterns are well-documented in official sources with proven production use cases. The project already uses Clerk authentication (v7.3.3) and follows standard Next.js App Router conventions, so integration points are clear.

**Primary recommendation:** Use Clerk's publicMetadata + session token customization for role storage, extend CustomJwtSessionClaims in `types/clerk.d.ts` for TypeScript safety, implement role checking in middleware with 307 temporary redirects, and create a client-side DashboardLayout component that uses `usePathname()` for navigation state detection.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Middleware Behavior:**
- **D-01:** Role check failure redirects to root (`/`) with standard 307 redirect — no query params or flash messages
- **D-02:** No logging for failed access attempts — role mismatches are expected behavior, keep middleware simple

**DashboardLayout Scope:**
- **D-03:** Full layout includes Header + Sidebar + main content wrapper — pages just provide content
- **D-04:** Navigation adapts automatically via route-based detection (usePathname pattern) — no navItems prop

**Type Organization:**
- **D-05:** Role types and CustomJwtSessionClaims live in `types/clerk.d.ts` — Clerk's documented pattern for extending session claims
- **D-06:** Role values use string union type (`type Role = 'demo' | 'admin' | 'user'`) — simple, no runtime overhead

### Claude's Discretion
None — all areas were explicitly decided.

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ROLE-01 | Clerk publicMetadata configured with `role` field, included in session token claims | Clerk session token customization via Dashboard configuration, publicMetadata automatically included in JWT when configured |
| ROLE-02 | TypeScript `CustomJwtSessionClaims` interface extended for type-safe role checking | TypeScript module augmentation in `types/clerk.d.ts` using `declare global` pattern, Clerk's official approach |
| ACCESS-01 | Middleware protects `/demo/*` routes, redirecting users without `demo` role to root | `clerkMiddleware` + `createRouteMatcher` with `auth.sessionClaims.metadata.role` checks, 307 redirect for temporary auth-based redirects |
| NAV-02 | DashboardLayout component wraps all pages, eliminating layout duplication | Client component with `usePathname()` hook, wraps existing Header + Sidebar + main content structure |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Role storage | API / Backend (Clerk) | — | Clerk Dashboard publicMetadata is the source of truth, modified via Clerk API only |
| Session token generation | API / Backend (Clerk) | — | Clerk backend generates JWTs with publicMetadata claims after Dashboard configuration |
| Role-based route protection | Frontend Server (Middleware) | — | Next.js middleware runs on edge before page rendering, accesses session claims directly |
| TypeScript type safety | Browser / Client | Frontend Server | Type definitions are compile-time only, used in both client and server components |
| Layout rendering | Browser / Client | — | DashboardLayout is a client component using `usePathname()` hook for navigation state |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @clerk/nextjs | 7.3.3 | Authentication and session management | Already installed, official Clerk SDK for Next.js App Router with built-in middleware support [VERIFIED: npm registry, project package.json] |
| next | 16.1.6 | Framework (middleware, routing, layouts) | Already installed, project uses App Router conventions [VERIFIED: project package.json] |
| typescript | 5.9.3 | Type safety for role checks | Already installed, required for CustomJwtSessionClaims interface augmentation [VERIFIED: project package.json, bash version check] |

**Installation:**
```bash
# No installation needed — all dependencies already present
```

**Version verification:**
All versions verified via `npm view` and project `package.json` on 2026-05-10.

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @clerk/types | 4.101.23 | TypeScript types for Clerk interfaces | Already installed as devDependency, provides `Appearance` and other Clerk-specific types [VERIFIED: package.json] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Clerk publicMetadata | Organization-based RBAC | Organizations add complexity (org switching UI, member management) for single-tenant app — publicMetadata simpler per STATE.md carry-forward decision |
| String union type | Enum | Enums create runtime overhead and complicate JSON serialization — string unions are compile-time only and match Clerk's JWT string values |
| Client component layout | Route group layouts | Route groups would duplicate layout file per route segment — single client component is more maintainable per STATE.md decision |

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│ Clerk Dashboard (External Configuration)                            │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ User publicMetadata: { role: "demo" | "admin" | "user" }        │ │
│ │ Session Token Config: { "metadata": "{{user.public_metadata}}" }│ │
│ └─────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────┬─────────────────────────────────┘
                                    │ JWT with claims
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Next.js Middleware (Edge Runtime)                                   │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ clerkMiddleware checks:                                         │ │
│ │ 1. Is user authenticated? → No: 307 redirect to /sign-in       │ │
│ │ 2. Is route /demo/*? → Yes: Check role                         │ │
│ │ 3. Does user have demo role? → No: 307 redirect to /           │ │
│ │ 4. All checks pass → Continue to page                          │ │
│ └─────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────┬─────────────────────────────────┘
                                    │ Allowed
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Page Component (Server or Client)                                   │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ <DashboardLayout>                                               │ │
│ │   ├─ <Sidebar /> (client, uses usePathname)                    │ │
│ │   └─ <main>                                                     │ │
│ │       ├─ <Header /> (client, uses usePathname)                 │ │
│ │       └─ {children} (page content)                             │ │
│ │ </DashboardLayout>                                              │ │
│ └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘

Type Safety Layer (Compile-Time Only):
┌─────────────────────────────────────────────────────────────────────┐
│ types/clerk.d.ts                                                    │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ type Role = 'demo' | 'admin' | 'user'                          │ │
│ │ interface CustomJwtSessionClaims {                              │ │
│ │   metadata: { role?: Role }                                     │ │
│ │ }                                                                │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│ → Provides autocomplete for auth.sessionClaims.metadata.role       │
│ → Prevents typos ('dmo' vs 'demo')                                 │
│ → No runtime overhead (types erased during compilation)            │
└─────────────────────────────────────────────────────────────────────┘
```

**Data flow:**
1. User authenticates → Clerk generates JWT with publicMetadata as claims
2. Request hits middleware → Edge runtime checks session claims synchronously
3. Role check fails → 307 redirect (temporary, not cached)
4. Role check passes → Request proceeds to page rendering
5. Page wraps content in DashboardLayout → Client component uses usePathname for navigation state

### Component Responsibilities

| File | Responsibility | Implementation Notes |
|------|---------------|---------------------|
| `src/types/clerk.d.ts` | TypeScript definitions for role types and session claims | New file, uses `declare global` pattern, no runtime code |
| `src/middleware.ts` | Route protection and role checking | Extend existing file, add `isDemoRoute` matcher and role check logic |
| `src/components/DashboardLayout.tsx` | Shared layout wrapper for all dashboard pages | New client component, wraps existing Sidebar + Header + main structure |
| Clerk Dashboard (external) | Session token configuration | Manual UI configuration: Sessions → Customize session token → Add `{"metadata": "{{user.public_metadata}}"}` |

### Recommended Project Structure

```
src/
├── types/
│   ├── clerk.d.ts           # NEW: Role types and CustomJwtSessionClaims extension
│   ├── order.ts             # (existing)
│   └── customer.ts          # (existing)
├── middleware.ts            # MODIFY: Add role checking logic
├── components/
│   ├── DashboardLayout.tsx  # NEW: Shared layout component
│   ├── Sidebar.tsx          # (existing, will be imported by DashboardLayout)
│   └── Header.tsx           # (existing, will be imported by DashboardLayout)
└── app/
    ├── layout.tsx           # (existing, no changes)
    ├── orders/page.tsx      # (existing, will be wrapped in Phase 26)
    └── customers/page.tsx   # (existing, will be wrapped in Phase 26)
```

### Pattern 1: TypeScript Module Augmentation for Clerk Session Claims

**What:** Extend Clerk's `CustomJwtSessionClaims` interface globally to add role type safety.

**When to use:** When adding custom claims to Clerk session tokens that need TypeScript autocomplete and type checking.

**Example:**
```typescript
// Source: https://github.com/clerk/clerk-docs/blob/main/docs/guides/secure/basic-rbac.mdx
// types/clerk.d.ts
export {}

// Create a type for the Roles
export type Role = 'demo' | 'admin' | 'user'

declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      role?: Role
    }
  }
}
```
[VERIFIED: Clerk official docs - basic RBAC guide]

**Why this works:**
- `export {}` makes the file a module, required for `declare global` to work
- `declare global` augments the global namespace, making types available everywhere
- Clerk's `auth()` and middleware `auth.sessionClaims` automatically use this interface
- Optional `role?` field because not all users may have roles assigned initially

### Pattern 2: Middleware Role Checking with Session Claims

**What:** Check user roles in middleware and redirect if role requirements aren't met.

**When to use:** Protecting routes that require specific roles, runs before page rendering on edge.

**Example:**
```typescript
// Source: https://github.com/clerk/clerk-docs/blob/main/docs/guides/secure/basic-rbac.mdx
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isDemoRoute = createRouteMatcher(['/demo(.*)'])

export default clerkMiddleware(async (auth, req) => {
  // Protect all routes starting with `/demo`
  if (isDemoRoute(req) && (await auth()).sessionClaims?.metadata?.role !== 'demo') {
    const url = new URL('/', req.url)
    return NextResponse.redirect(url)
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
```
[VERIFIED: Clerk official docs - basic RBAC guide]

**Key details:**
- `await auth()` returns auth object with sessionClaims
- `sessionClaims.metadata.role` accesses the custom claim from publicMetadata
- `NextResponse.redirect()` defaults to 307 (temporary) status code
- Middleware runs on every request matching the config.matcher pattern

### Pattern 3: Client Component with usePathname for Navigation State

**What:** Extract pathname-dependent logic into a client component to prevent stale navigation state in layouts.

**When to use:** When a layout or component needs to know the current route for active link highlighting or conditional rendering.

**Example:**
```typescript
// Source: https://nextjs.org/docs/app/api-reference/functions/use-pathname
'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

export function NavLinks() {
  const pathname = usePathname()

  return (
    <nav>
      <Link className={`link ${pathname === '/' ? 'active' : ''}`} href="/">
        Home
      </Link>
      <Link className={`link ${pathname === '/about' ? 'active' : ''}`} href="/about">
        About
      </Link>
    </nav>
  )
}
```
[VERIFIED: Next.js official docs - usePathname function reference]

**Why client component is required:**
- Layouts are Server Components by default and don't re-render on navigation
- `usePathname()` is a client-side hook that requires component re-renders
- Client Components re-render (but aren't refetched) during navigation, keeping pathname fresh

### Pattern 4: DashboardLayout Composition

**What:** Single layout component that wraps all dashboard pages with consistent structure.

**When to use:** Eliminating duplication when multiple pages share the same Sidebar + Header + main wrapper pattern.

**Example:**
```typescript
// Source: Project existing pattern in orders/page.tsx, converted to reusable layout
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
[CITED: Existing project pattern from src/app/orders/page.tsx]

**Usage in pages:**
```typescript
// In any dashboard page
export default function OrdersPage() {
  return (
    <DashboardLayout>
      <OrdersContent />
    </DashboardLayout>
  )
}
```

### Anti-Patterns to Avoid

- **Server Component with usePathname:** Layouts are Server Components by default and don't re-render on navigation, causing pathname to become stale. Always use client components for pathname-dependent logic. [CITED: https://nextjs.org/docs/app/api-reference/functions/use-pathname]

- **Role checking in client components for security:** Client-side checks can be bypassed by modifying JavaScript. Always enforce role checks in middleware or server components/actions. [CITED: Clerk docs - multiple authentication layers principle]

- **308 permanent redirects for auth checks:** Authentication and permissions are user-specific and change over time. Use 307 temporary redirects for session-based routing decisions. [CITED: https://nextjs.org/docs/app/building-your-application/routing/redirecting]

- **Manually parsing JWT tokens:** Clerk's `auth()` and middleware provide typed access to session claims. Never parse JWTs manually — it's error-prone and breaks when Clerk updates token structure.

- **Storing roles in localStorage or cookies:** Browser storage can be manipulated. Roles must live in Clerk publicMetadata (server-side source of truth) and flow through session tokens.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JWT token generation and validation | Custom JWT library + signing keys + token refresh logic | Clerk session tokens with publicMetadata claims | Token rotation, key management, JWKS endpoint, claim validation, and security updates handled by Clerk. Custom JWT systems miss edge cases (clock skew, key rotation, replay attacks). |
| Role-based middleware logic | Custom Express-style middleware with manual cookie parsing | Clerk's `clerkMiddleware` + `createRouteMatcher` | Clerk middleware integrates with Next.js edge runtime, handles token validation automatically, provides typed `auth.sessionClaims` access. Custom solutions break on Next.js updates. |
| TypeScript global type definitions | Copying types into every file that needs them | TypeScript module augmentation with `declare global` | Global declarations make types available everywhere without imports, preventing drift when multiple files define the same interface. One source of truth. |
| Layout duplication logic | Copy-pasting Sidebar + Header structure into every page | Shared DashboardLayout component | Changes (like adding a new section to Header) only happen once. Copy-paste creates maintenance nightmare when structure evolves. |

**Key insight:** Authentication infrastructure has decades of accumulated edge cases. Clerk's publicMetadata + session token system handles token refresh, claim staleness, concurrent logins, and security updates automatically. Custom implementations miss subtle issues like token refresh race conditions during long-running requests or handling users with multiple active sessions.

## Runtime State Inventory

> Phase 25 is a greenfield implementation adding new infrastructure. No existing runtime state requires migration.

**N/A:** This section applies only to rename/refactor/migration phases. Phase 25 creates new types, components, and middleware logic without modifying existing identifiers or stored state.

## Common Pitfalls

### Pitfall 1: Session Claims Not Updating After Role Assignment

**What goes wrong:** After assigning a role via Clerk Dashboard, middleware still sees `undefined` for `auth.sessionClaims.metadata.role`.

**Why it happens:** Session tokens refresh automatically ~every 60 seconds, but the current user's token contains pre-assignment claims. New token won't be issued until refresh interval elapses or user signs out/in.

**How to avoid:**
1. Configure session token BEFORE assigning roles to test users
2. For immediate verification during development, sign out and sign back in after role assignment
3. In production, document to users that role changes take effect on next sign-in (or implement forced token refresh with `user.reload()`)

**Warning signs:**
- `auth.sessionClaims.metadata` is `undefined` even though publicMetadata shows role in Clerk Dashboard
- TypeScript errors for accessing `metadata.role` when session token config is missing
- Role checks pass inconsistently (works after fresh sign-in, fails on subsequent requests)

[CITED: Clerk documentation warns session tokens refresh ~every 60 seconds, need manual refresh or re-auth for immediate updates]

### Pitfall 2: Middleware Async/Await Forgotten

**What goes wrong:** Middleware crashes with "Cannot read property 'sessionClaims' of undefined" or role checks never execute.

**Why it happens:** `auth()` in clerkMiddleware is async and returns a Promise. Forgetting `await` means you're trying to access `.sessionClaims` on a Promise object, not the resolved auth object.

**How to avoid:**
- Always use `await auth()` when calling inside clerkMiddleware
- Enable TypeScript strict mode (`"strict": true` in tsconfig.json) to catch missing awaits
- Use ESLint rule `@typescript-eslint/no-floating-promises` to detect unawaited promises

**Warning signs:**
```typescript
// WRONG - no await
if (isDemoRoute(req) && auth().sessionClaims?.metadata?.role !== 'demo') {
  // This will never work
}

// CORRECT - with await
if (isDemoRoute(req) && (await auth()).sessionClaims?.metadata?.role !== 'demo') {
  // Now sessionClaims is accessible
}
```

[VERIFIED: Clerk official middleware examples always use `await auth()` pattern]

### Pitfall 3: Client Component Layout with Server-Side Data Fetching

**What goes wrong:** DashboardLayout marked as `'use client'` but tries to use async/await for server-side data fetching (like fetching user profile). Results in "You're importing a component that needs X, but none of its parents are async" errors.

**Why it happens:** Client Components can't use async/await for server-side data fetching. Once a component is marked `'use client'`, its entire subtree runs in the browser.

**How to avoid:**
- DashboardLayout should ONLY handle layout structure (Sidebar, Header, children wrapper)
- Any server-side data fetching should happen in individual pages or Server Components
- If layout needs user data, fetch it in page and pass as prop to a separate client component (not the layout itself)

**Warning signs:**
- ESLint error "async/await is not allowed in client components"
- Runtime error about importing server-only code in client component
- `usePathname()` works but auth data fetching fails

**Correct pattern:**
```typescript
// DashboardLayout.tsx - Client Component
'use client'
import { usePathname } from 'next/navigation'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() // ✅ Client hook works
  return (
    <div>
      <Sidebar pathname={pathname} />
      <main>{children}</main>
    </div>
  )
}

// page.tsx - Server Component (or can be client)
import DashboardLayout from '@/components/DashboardLayout'

export default function OrdersPage() {
  // Can be async, fetch server data here if needed
  return (
    <DashboardLayout>
      <OrdersContent />
    </DashboardLayout>
  )
}
```

### Pitfall 4: TypeScript Types Not Found After Creating clerk.d.ts

**What goes wrong:** After creating `types/clerk.d.ts`, TypeScript still doesn't recognize `Role` type or `CustomJwtSessionClaims` extension. Middleware shows "Property 'role' does not exist on type 'never'".

**Why it happens:** TypeScript's `include` paths in `tsconfig.json` may not cover the `types/` directory, or the file is missing the `export {}` statement that makes it a module.

**How to avoid:**
1. Verify `tsconfig.json` includes `"**/*.ts"` pattern (project already has this)
2. Add `export {}` at the top of `types/clerk.d.ts` to make it a module
3. Restart TypeScript server in VSCode (Cmd+Shift+P → "TypeScript: Restart TS Server")
4. Check that `declare global` is used (not just `export interface`)

**Warning signs:**
- `Role` type not available for import in other files
- `auth.sessionClaims.metadata` shows type `never` instead of `{ role?: Role }`
- VSCode autocomplete doesn't suggest `role` field in sessionClaims.metadata

**Correct structure:**
```typescript
// types/clerk.d.ts
export {} // ← REQUIRED to make this a module

export type Role = 'demo' | 'admin' | 'user'

declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      role?: Role
    }
  }
}
```

[VERIFIED: Clerk docs examples always include `export {}` statement]

## Code Examples

Verified patterns from official sources:

### Extend CustomJwtSessionClaims for Role Type Safety

```typescript
// types/clerk.d.ts
// Source: https://github.com/clerk/clerk-docs/blob/main/docs/guides/secure/basic-rbac.mdx
export {}

// Create a type for the Roles
export type Role = 'demo' | 'admin' | 'user'

declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      role?: Role
    }
  }
}
```

### Configure Session Token in Clerk Dashboard

```json
// Clerk Dashboard → Sessions → Customize session token
// Source: https://github.com/clerk/clerk-docs/blob/main/docs/guides/secure/basic-rbac.mdx
{
  "metadata": "{{user.public_metadata}}"
}
```

**Configuration steps:**
1. Log into Clerk Dashboard → Select your application
2. Navigate to "Sessions" in left sidebar
3. Click "Edit" in "Customize session token" section
4. Paste the JSON above
5. Click "Save" — takes effect immediately for new logins

### Middleware with Role-Based Route Protection

```typescript
// src/middleware.ts
// Source: https://github.com/clerk/clerk-docs/blob/main/docs/guides/secure/basic-rbac.mdx
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
])

const isDemoRoute = createRouteMatcher(['/demo(.*)'])

export default clerkMiddleware(async (auth, req) => {
  // Protect all routes except public ones
  if (!isPublicRoute(req)) {
    await auth.protect()
  }

  // Additional check for demo routes
  if (isDemoRoute(req)) {
    const { sessionClaims } = await auth()
    if (sessionClaims?.metadata?.role !== 'demo') {
      const url = new URL('/', req.url)
      return NextResponse.redirect(url) // 307 temporary redirect by default
    }
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
```

**Key patterns:**
- `await auth.protect()` redirects unauthenticated users automatically
- `await auth()` then access `.sessionClaims` for role checking
- `createRouteMatcher` uses glob patterns (`/demo(.*)` matches `/demo/*`)
- `NextResponse.redirect()` defaults to 307 (temporary), appropriate for auth checks

### DashboardLayout Component

```typescript
// src/components/DashboardLayout.tsx
// Pattern derived from existing project structure (src/app/orders/page.tsx)
'use client'

import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'

interface DashboardLayoutProps {
  children: React.ReactNode
}

/**
 * Shared dashboard layout wrapper.
 *
 * Provides consistent structure for all dashboard pages:
 * - Sidebar navigation (left)
 * - Header with search and user actions (top of main area)
 * - Page content area (children)
 *
 * Must be client component because Sidebar and Header use usePathname().
 */
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

**Usage in pages:**
```typescript
// Example: src/app/orders/page.tsx (Phase 26 will migrate to this pattern)
import DashboardLayout from '@/components/DashboardLayout'
import OrdersTable from '@/components/OrdersTable'

export default function OrdersPage() {
  return (
    <DashboardLayout>
      <OrdersTable />
    </DashboardLayout>
  )
}
```

### Setting User Role via Clerk Dashboard (Manual)

```json
// Clerk Dashboard → Users → [Select User] → Metadata → Public
// Source: https://github.com/clerk/clerk-docs/blob/main/docs/guides/secure/basic-rbac.mdx
{
  "role": "demo"
}
```

**Manual assignment steps (for Phase 25 testing):**
1. Clerk Dashboard → "Users" section
2. Click on a test user
3. Scroll to "Metadata" section
4. Click "Edit" in "Public" subsection
5. Add `{"role": "demo"}` JSON
6. Save — user must sign out/in for new token with role claim

**Note:** Phase 27 will implement programmatic role assignment. Phase 25 uses manual assignment for testing middleware and TypeScript types.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom JWT middleware with Express patterns | Clerk's `clerkMiddleware` with Next.js edge runtime | Clerk 5.0+ (2023) | Edge runtime middleware is faster (runs on CDN edge), no custom JWT parsing, automatic token validation |
| Client-side role checks for UI hiding | Server-side middleware + client-side for UX only | Industry standard (2020+) | Client checks can be bypassed — middleware enforces security, client enhances UX |
| `enum Role` for role types | `type Role = string union` | TypeScript 2.4+ best practices | String unions have no runtime overhead, work better with JSON serialization, simpler for external API compatibility |
| Copying layout structure per page | Shared layout components with children prop | Next.js App Router (2023) | Single source of truth for layout, easier to update Header/Sidebar, reduced bundle size |

**Deprecated/outdated:**
- **Pages Router `getServerSideProps` for auth checks:** App Router uses middleware and Server Components — more efficient, runs on edge, no per-page auth boilerplate.
- **Custom session management with cookies:** Clerk handles sessions, token refresh, multi-device sync automatically — custom cookie-based sessions miss edge cases.
- **Importing `@clerk/nextjs` functions in middleware:** Clerk 5.0+ uses `@clerk/nextjs/server` for server-side imports — old import path causes build errors.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest 30.3.0 + Testing Library 16.3.2 (unit), Playwright 1.59.1 (E2E) |
| Config file | jest.config.ts (unit), playwright.config.ts (E2E) |
| Quick run command | `npm test -- --testPathPattern=middleware` |
| Full suite command | `npm test && npm run test:e2e` |

[VERIFIED: jest.config.ts and playwright.config.ts exist, package.json scripts present]

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ROLE-01 | publicMetadata.role included in session token claims | manual | Dashboard UI verification → sign in → check `auth.sessionClaims.metadata.role` in middleware log | ⚠️ Manual (external config) |
| ROLE-02 | TypeScript autocomplete for `auth.sessionClaims.metadata.role` shows `Role` type | manual | VSCode: Hover over `sessionClaims.metadata.role` → tooltip shows `role?: Role` | ⚠️ Manual (compile-time) |
| ACCESS-01 | User without demo role accessing `/demo/orders` redirects to `/` | e2e | `npm run test:e2e -- --grep "demo route protection"` | ❌ Wave 0 |
| NAV-02 | DashboardLayout renders Sidebar + Header + children | unit | `npm test -- src/components/DashboardLayout.test.tsx` | ❌ Wave 0 |

**Manual-only justifications:**
- **ROLE-01:** Clerk Dashboard configuration is external, can't be automated in tests. Verification: Use middleware logging to confirm claims structure.
- **ROLE-02:** TypeScript types are compile-time only, no runtime test. Verification: VSCode IntelliSense shows correct type, `npm run build` succeeds without type errors.

### Sampling Rate

- **Per task commit:** `npm test -- --testPathPattern=middleware` — runs middleware unit tests only (~5 seconds)
- **Per wave merge:** `npm test` (full unit suite, ~20 seconds) + `npm run test:e2e -- --grep "demo route protection"` (new E2E test, ~15 seconds)
- **Phase gate:** Full suite green (`npm test && npm run test:e2e`) before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `src/middleware.test.ts` — covers ACCESS-01 (role redirect logic)
- [ ] `src/components/DashboardLayout.test.tsx` — covers NAV-02 (layout structure)
- [ ] `e2e/demo-route-protection.spec.ts` — covers ACCESS-01 (full flow: sign in without role → access /demo/orders → redirected to /)

**Existing test infrastructure:**
- ✅ Jest configured with `@testing-library/react` for component tests
- ✅ Playwright configured for E2E with authentication helpers (`@clerk/testing`)
- ✅ Existing E2E test `e2e/route-protection.spec.ts` demonstrates auth redirect pattern — can be copied/adapted for demo route tests

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | yes | Clerk authentication (already implemented) — Phase 25 adds role-based session claims |
| V3 Session Management | yes | Clerk session tokens (JWT with 60s refresh) — Phase 25 customizes claims to include publicMetadata.role |
| V4 Access Control | yes | Middleware route protection with role checks — enforces authorization before page rendering |
| V5 Input Validation | no | Phase 25 has no user input (only configuration and type definitions) |
| V6 Cryptography | no | Clerk handles JWT signing/validation — Phase 25 reads claims, doesn't generate tokens |

### Known Threat Patterns for Next.js + Clerk

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Client-side role bypass | Tampering | Middleware enforces role checks on edge before page render — client-side checks are UX only, not security boundaries |
| Session token replay | Information Disclosure | Clerk's JWT includes `exp` claim (60s refresh) and `nbf` (not-before) — expired tokens rejected automatically |
| Role privilege escalation | Elevation of Privilege | publicMetadata is read-only from client, writable only via Clerk Backend API — users can't assign themselves roles |
| Stale session claims after role change | Authorization | Document to users: role changes require sign out/in (or force token refresh with `user.reload()`) — edge case, not security flaw |

**Threat model assumptions:**
- Attacker has network access, can intercept/modify requests
- Attacker has browser DevTools, can modify client-side code
- Attacker does NOT have Clerk Dashboard access or Backend API keys
- Middleware runs on Vercel Edge (trusted environment)

**Out of scope for Phase 25:**
- Rate limiting (no endpoints created in this phase)
- CSRF protection (no forms or mutations in this phase)
- XSS prevention (no user-generated content rendered in this phase)

## Sources

### Primary (HIGH confidence)

- [Clerk official docs - Basic RBAC guide](https://github.com/clerk/clerk-docs/blob/main/docs/guides/secure/basic-rbac.mdx) - CustomJwtSessionClaims pattern, middleware role checking, session token configuration [VERIFIED: Context7]
- [Clerk official docs - Custom session tokens](https://github.com/clerk/clerk-docs/blob/main/docs/guides/sessions/customize-session-tokens.mdx) - publicMetadata in session tokens, global type definitions [VERIFIED: Context7]
- [Next.js official docs - usePathname](https://nextjs.org/docs/app/api-reference/functions/use-pathname) - Client component requirement for pathname access in layouts [VERIFIED: Context7]
- [Next.js official docs - Layouts and Pages](https://github.com/vercel/next.js/blob/canary/docs/01-app/01-getting-started/03-layouts-and-pages.mdx) - Layout component patterns, children prop usage [VERIFIED: Context7]
- Project codebase - `src/app/orders/page.tsx`, `src/middleware.ts`, `src/components/Sidebar.tsx` - Existing patterns for Sidebar + Header structure, middleware setup, usePathname usage [VERIFIED: Read tool]

### Secondary (MEDIUM confidence)

- [TypeScript official docs - Global .d.ts](https://www.typescriptlang.org/docs/handbook/declaration-files/templates/global-d-ts.html) - Declare global pattern for module augmentation [VERIFIED: WebSearch → official TypeScript docs]
- [Next.js official docs - Redirecting](https://nextjs.org/docs/app/building-your-application/routing/redirecting) - 307 vs 308 status codes, temporary redirects for session checks [VERIFIED: WebSearch → official Next.js docs]

### Tertiary (LOW confidence)

None — all claims verified against official documentation or project codebase.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All dependencies already installed and versions verified via npm registry
- Architecture: HIGH - Clerk and Next.js patterns documented in official sources with code examples
- Pitfalls: HIGH - Session claims staleness and async/await issues documented in Clerk guides and Next.js community discussions

**Research date:** 2026-05-10
**Valid until:** 2026-06-10 (30 days) — Clerk and Next.js are stable, patterns unlikely to change rapidly
