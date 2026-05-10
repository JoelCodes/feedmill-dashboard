# Architecture Research: Clerk Authentication Integration

**Domain:** Authentication for Next.js 15 App Router dashboard
**Researched:** 2026-05-09
**Confidence:** HIGH

## Standard Clerk Architecture for Next.js App Router

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │ Pages   │  │ Layouts │  │ API     │  │ Server  │        │
│  │ (RSC)   │  │ (RSC)   │  │ Routes  │  │ Actions │        │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘        │
│       │            │            │            │              │
├───────┴────────────┴────────────┴────────────┴──────────────┤
│                    Auth Abstraction Layer                    │
├─────────────────────────────────────────────────────────────┤
│  Server-side:  auth()  currentUser()  auth.protect()        │
│  Client-side:  useAuth()  useUser()  <UserButton/>          │
│  Components:   <SignedIn/>  <SignedOut/>  <Show/>           │
├─────────────────────────────────────────────────────────────┤
│                    Middleware Layer                          │
├─────────────────────────────────────────────────────────────┤
│  clerkMiddleware() → Route Protection → Cookie Check        │
│  createRouteMatcher() → Pattern-based auth rules            │
├─────────────────────────────────────────────────────────────┤
│                    Provider Layer                            │
├─────────────────────────────────────────────────────────────┤
│  <ClerkProvider> in RootLayout (app/layout.tsx)             │
│  - Wraps entire app                                          │
│  - Makes auth context available globally                     │
│  - Handles sign-in/sign-up/sign-out redirects               │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| `middleware.ts` | Route protection, auth checks before page load | `clerkMiddleware()` with `createRouteMatcher()` for pattern-based protection |
| `app/layout.tsx` | Global auth context provider | `<ClerkProvider>` wrapping children, provides auth to entire app |
| `app/sign-in/[[...sign-in]]/page.tsx` | Sign-in UI | `<SignIn />` component with catch-all route for nested paths |
| `app/sign-up/[[...sign-up]]/page.tsx` | Sign-up UI | `<SignUp />` component with catch-all route for nested paths |
| Server Components | Auth state access, user data fetching | `auth()` for auth state, `currentUser()` for user object |
| Client Components | Interactive auth UI, conditional rendering | `useAuth()`, `useUser()`, `<SignedIn>`, `<SignedOut>`, `<UserButton>` |
| API Routes | Protected endpoints, auth verification | `auth()` helper to check authentication, return 401 if unauthorized |
| Server Actions | Server-side mutations with auth | `auth()` and `currentUser()` to validate user before executing |

## Recommended Project Structure for CGM Dashboard

```
/Users/joel/Desktop/Projects/cgm-dashboard/
├── src/
│   ├── middleware.ts                    # NEW - Clerk middleware for route protection
│   ├── app/
│   │   ├── layout.tsx                   # MODIFIED - Add ClerkProvider wrapper
│   │   ├── sign-in/
│   │   │   └── [[...sign-in]]/
│   │   │       └── page.tsx             # NEW - Clerk SignIn component
│   │   ├── sign-up/
│   │   │   └── [[...sign-up]]/
│   │   │       └── page.tsx             # NEW - Clerk SignUp component
│   │   ├── page.tsx                     # EXISTING - Protected dashboard home
│   │   ├── orders/
│   │   │   └── page.tsx                 # EXISTING - Protected orders page
│   │   ├── mill-production/
│   │   │   └── page.tsx                 # EXISTING - Protected production page
│   │   ├── customers/
│   │   │   ├── page.tsx                 # EXISTING - Protected customers list
│   │   │   └── [id]/
│   │   │       └── page.tsx             # EXISTING - Protected customer detail
│   │   ├── inventory/
│   │   │   └── page.tsx                 # EXISTING - Protected inventory page
│   │   ├── shipments/
│   │   │   └── page.tsx                 # EXISTING - Protected shipments page
│   │   └── settings/
│   │       └── page.tsx                 # EXISTING - Protected settings page
│   ├── components/
│   │   ├── Header.tsx                   # MODIFIED - Add UserButton, remove static user
│   │   ├── Sidebar.tsx                  # EXISTING - No changes needed
│   │   └── ui/                          # EXISTING - Design system components
│   ├── services/                        # EXISTING - Mock data services (no changes)
│   ├── hooks/                           # EXISTING - Custom hooks
│   └── types/                           # EXISTING - TypeScript types
├── .env.local                           # NEW - Clerk API keys (gitignored)
├── .env.example                         # NEW - Template for required env vars
└── package.json                         # MODIFIED - Add @clerk/nextjs dependency
```

### Structure Rationale

- **`middleware.ts` in `src/`:** Follows existing project convention of using `src/` directory. Must be at root of `src/` for Next.js to detect it.
- **Sign-in/Sign-up catch-all routes:** `[[...sign-in]]` syntax allows Clerk to handle nested auth flows (e.g., password reset, verification) at the same route.
- **ClerkProvider in root layout:** Provides auth context to entire app tree, enabling all server/client components to access auth state.
- **Protected pages remain unchanged:** Pages don't need auth logic - middleware handles protection. Pages can optionally use `auth()` or `currentUser()` for user-specific data.
- **Header modification only:** Only component needing changes is Header to display user info and sign-out. Sidebar and other UI components work as-is.
- **Services layer untouched:** Mock data services don't need auth - real API calls in future can use `getToken()` for authenticated requests.

## Architectural Patterns

### Pattern 1: Middleware-Based Route Protection

**What:** Protect all dashboard routes using middleware with pattern matching, redirecting unauthenticated users to sign-in.

**When to use:** When you want to protect entire sections of your app (all routes except sign-in/sign-up).

**Trade-offs:**
- ✓ Centralized auth logic - single source of truth for protected routes
- ✓ Runs before page render - no flash of protected content
- ✓ Edge runtime - fast cookie-based checks
- ✗ Cannot access database in middleware (Edge runtime limitation)
- ✗ Broad matchers required to avoid "auth() called but no middleware" errors

**Example:**
```typescript
// src/middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Define public routes (everything else is protected)
const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)'])

export default clerkMiddleware(async (auth, req) => {
  // Protect all routes except public ones
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
    // Always run for Clerk frontend API routes
    '/__clerk/(.*)',
  ],
}
```

### Pattern 2: Server Component Auth Access

**What:** Access auth state and user data in React Server Components using `auth()` and `currentUser()`.

**When to use:** When server components need user-specific data or want to show personalized content.

**Trade-offs:**
- ✓ No client-side JavaScript required
- ✓ User data available at render time
- ✓ Can be used with database queries
- ✗ Async functions only (must await)
- ✗ Server Components only (not in client components)

**Example:**
```typescript
// src/app/page.tsx (Server Component)
import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const { userId } = await auth()

  // Optional: redundant check if middleware already protects route
  if (!userId) {
    redirect('/sign-in')
  }

  // Fetch user details if needed
  const user = await currentUser()

  return (
    <div>
      <h1>Welcome, {user?.firstName}!</h1>
      {/* Dashboard content */}
    </div>
  )
}
```

### Pattern 3: Client Component Auth Hooks

**What:** Use `useAuth()` and `useUser()` hooks in client components for reactive auth state.

**When to use:** Interactive components that need auth state (user buttons, conditional UI, client-side navigation).

**Trade-offs:**
- ✓ Reactive - updates automatically on auth state change
- ✓ Access to methods like `signOut()`, `getToken()`
- ✓ Can be used with UI interactions
- ✗ Client-side only - requires 'use client' directive
- ✗ Adds JavaScript bundle size
- ✗ Hydration consideration - check `isLoaded` before rendering

**Example:**
```typescript
// src/components/Header.tsx (Client Component)
'use client'

import { useUser, UserButton } from '@clerk/nextjs'

export function Header() {
  const { isSignedIn, user, isLoaded } = useUser()

  if (!isLoaded) {
    return <div>Loading...</div>
  }

  return (
    <header>
      {isSignedIn && (
        <div className="flex items-center gap-4">
          <span>Welcome, {user.firstName}</span>
          <UserButton />
        </div>
      )}
    </header>
  )
}
```

### Pattern 4: Conditional Rendering with Clerk Components

**What:** Use `<SignedIn>`, `<SignedOut>`, and `<Show>` components for declarative auth-based rendering.

**When to use:** Simple show/hide logic based on auth state without manual conditionals.

**Trade-offs:**
- ✓ Declarative - clear intent in JSX
- ✓ Automatic rerenders on auth change
- ✓ Works in both server and client components
- ✗ Less flexible than manual conditionals
- ✗ Adds nesting to component tree

**Example:**
```typescript
import { Show, SignInButton, UserButton } from '@clerk/nextjs'

export function NavBar() {
  return (
    <nav>
      <Show when="signed-out">
        <SignInButton mode="modal" />
      </Show>
      <Show when="signed-in">
        <UserButton />
      </Show>
    </nav>
  )
}
```

### Pattern 5: API Route Protection

**What:** Protect API routes by checking auth state with `auth()` and returning 401 for unauthorized requests.

**When to use:** Any API endpoint that should only be accessible to authenticated users.

**Trade-offs:**
- ✓ Explicit - clear that endpoint requires auth
- ✓ Can check permissions/roles beyond just authentication
- ✓ Node.js runtime - can access database
- ✗ Manual check required (not automatic like middleware)
- ✗ Boilerplate in every protected route

**Example:**
```typescript
// src/app/api/orders/route.ts
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch and return orders for authenticated user
  const orders = await fetchOrders(userId)
  return NextResponse.json({ orders })
}
```

### Pattern 6: Server Action Auth

**What:** Protect Server Actions by validating auth at the start of the action.

**When to use:** Form submissions and mutations that require authentication.

**Trade-offs:**
- ✓ Server-side validation - cannot be bypassed
- ✓ Access to full user object for audit logs
- ✓ Can throw errors that client catches
- ✗ Must be explicitly checked in each action
- ✗ Requires error handling on client

**Example:**
```typescript
// src/app/actions.ts
'use server'

import { auth, currentUser } from '@clerk/nextjs/server'

export async function updateOrderStatus(orderId: string, status: string) {
  const { userId } = await auth()
  const user = await currentUser()

  if (!userId) {
    throw new Error('You must be signed in to update orders')
  }

  // Perform mutation with user context
  await updateOrder(orderId, status, {
    updatedBy: user.id,
    updatedByEmail: user.emailAddresses[0].emailAddress,
  })
}
```

## Data Flow

### Authentication Flow

```
User visits /orders
    ↓
middleware.ts runs → clerkMiddleware() checks cookies
    ↓
Not authenticated? → Redirect to /sign-in
    ↓
Authenticated? → Continue to page
    ↓
Page renders (Server Component)
    ↓
Optional: auth() or currentUser() for user data
    ↓
Render with user context
```

### Sign-In Flow

```
User visits /sign-in
    ↓
Clerk <SignIn /> component renders
    ↓
User enters email + password
    ↓
Clerk validates credentials (external API)
    ↓
Success → Set session cookie
    ↓
Redirect to NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL (/)
    ↓
Middleware allows access
    ↓
Dashboard loads
```

### Client-Side Auth State

```
ClerkProvider loads session from cookie
    ↓
Populates useAuth() and useUser() hooks
    ↓
Components using hooks rerender with auth data
    ↓
User clicks "Sign Out" in <UserButton />
    ↓
Clerk clears session cookie
    ↓
Hooks update to isSignedIn: false
    ↓
Middleware redirects to /sign-in on next navigation
```

### Key Data Flows

1. **Session Management:** Clerk manages session via HTTP-only cookies set by middleware. Client never directly handles tokens.
2. **User Data Propagation:** Server Components get user data via `currentUser()` on each request. Client Components subscribe to user state via `useUser()` hook.
3. **Token for External APIs:** Use `await getToken()` from `useAuth()` (client) or `auth()` (server) to get JWT for authenticating external API requests.
4. **Sign-Out:** `<UserButton />` handles sign-out automatically. Clears cookie, updates hooks, middleware redirects unauthenticated routes.

## Integration Points for CGM Dashboard

### New Files Required

| File | Purpose | Priority |
|------|---------|----------|
| `src/middleware.ts` | Route protection with clerkMiddleware | **Critical** - Required first |
| `src/app/sign-in/[[...sign-in]]/page.tsx` | Sign-in page | **Critical** - Required first |
| `src/app/sign-up/[[...sign-up]]/page.tsx` | Sign-up page | **Critical** - Required first |
| `.env.local` | Clerk API keys (gitignored) | **Critical** - Required first |
| `.env.example` | Template for required env vars | **High** - Documentation |

### Files to Modify

| File | Changes Required | Priority | Complexity |
|------|------------------|----------|------------|
| `src/app/layout.tsx` | Add `<ClerkProvider>` wrapper around existing `<ThemeProvider>` | **Critical** | Low |
| `src/components/Header.tsx` | Replace static user info with `<UserButton />`, add signed-in/signed-out conditional | **High** | Medium |
| `package.json` | Add `@clerk/nextjs` dependency | **Critical** | Low |

### Files Unchanged

These existing files work as-is with Clerk:

- **All page components** (`page.tsx` files) - Middleware handles protection, no page-level changes needed
- **Sidebar.tsx** - Navigation works without auth changes
- **All UI components** (`src/components/ui/*`) - Design system components unaffected
- **All services** (`src/services/*`) - Mock data services don't need auth
- **All hooks** (`src/hooks/*`) - Custom hooks continue to work
- **ThemeProvider.tsx** - Theme toggle unaffected by auth

### Environment Variables

```env
# .env.local (gitignored)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx

# Optional: Customize redirect URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
```

### Dependency Installation

```bash
npm install @clerk/nextjs
```

**Version compatibility:**
- `@clerk/nextjs` latest version requires `next@>=15.2.3`
- Current project uses Next.js 15, verify version is 15.2.3+
- Node.js 20.9.0+ required for Clerk Core 3

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1k users | Default Clerk setup handles this easily. Free tier supports 10k MAU. |
| 1k-10k users | No changes needed. Consider upgrading to Pro plan at 10k+ MAU for support and advanced features. |
| 10k-100k users | Still no architecture changes. Clerk is hosted SaaS - scales automatically. May want custom JWT claims for role-based access. |
| 100k+ users | Consider Clerk's Enterprise plan for SLA and dedicated support. May want to cache user data in database for frequently accessed user attributes. |

### Scaling Priorities

1. **First bottleneck:** Won't hit auth bottleneck - Clerk infrastructure scales. More likely to hit Next.js server limits or database query performance first.
2. **Second bottleneck:** If showing user-specific data on every page, `currentUser()` calls add ~50-100ms. Cache user attributes in database and fetch with user ID from `auth()` instead.

## Anti-Patterns

### Anti-Pattern 1: Mixing Client and Server Auth Helpers

**What people do:** Import `auth()` in a client component or use `useAuth()` in a server component.

**Why it's wrong:**
- `auth()` and `currentUser()` are server-only and will throw errors in client components
- `useAuth()` and `useUser()` are client-only hooks and won't work in server components
- Causes "Cannot read property of undefined" or "Cannot use hooks in server components" errors

**Do this instead:**
- Use `auth()` / `currentUser()` in Server Components, API routes, Server Actions
- Use `useAuth()` / `useUser()` in Client Components with 'use client' directive
- If you need user data in a client component, either:
  - Convert to client component and use hooks, OR
  - Fetch in parent server component and pass as props

### Anti-Pattern 2: Manual Redirects in Protected Pages

**What people do:** Add redirect logic in every protected page:
```typescript
// ❌ DON'T DO THIS
export default async function OrdersPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')
  // ...
}
```

**Why it's wrong:**
- Duplicated logic across all protected pages
- Page still loads briefly before redirect (wasted work)
- Can cause flash of protected content
- Harder to maintain - many places to update if auth logic changes

**Do this instead:**
Use middleware for route protection. All routes are protected by default, only sign-in/sign-up are public:
```typescript
// ✓ DO THIS - in middleware.ts
const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)'])

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})
```

### Anti-Pattern 3: Narrow Middleware Matchers

**What people do:** Only match specific routes in middleware config:
```typescript
// ❌ DON'T DO THIS
export const config = {
  matcher: ['/orders', '/customers', '/settings'],
}
```

**Why it's wrong:**
- Easy to forget routes as app grows
- 404 pages and error pages throw "auth() was called but no middleware" error
- API routes may not be protected
- Static assets unnecessarily matched

**Do this instead:**
Use broad matcher that excludes static files and Next.js internals:
```typescript
// ✓ DO THIS
export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
    '/__clerk/(.*)',
  ],
}
```

### Anti-Pattern 4: Checking Auth Before Loading State

**What people do:** Render auth-dependent UI before checking if auth is loaded:
```typescript
// ❌ DON'T DO THIS
'use client'
export function Header() {
  const { user } = useUser()
  return <div>Welcome, {user.firstName}</div> // Error: user is null during load
}
```

**Why it's wrong:**
- `user` is `null` while Clerk loads session
- Causes "Cannot read property 'firstName' of null" error
- Creates hydration mismatch if server/client render different content

**Do this instead:**
Check `isLoaded` before accessing user data:
```typescript
// ✓ DO THIS
'use client'
export function Header() {
  const { user, isLoaded } = useUser()

  if (!isLoaded) {
    return <div>Loading...</div>
  }

  return <div>Welcome, {user?.firstName ?? 'Guest'}</div>
}
```

### Anti-Pattern 5: Using Middleware for Database Queries

**What people do:** Try to check database permissions in middleware:
```typescript
// ❌ DON'T DO THIS
export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth()
  const userRole = await db.users.findUnique({ where: { id: userId } }) // Error!
  if (userRole !== 'admin') return NextResponse.redirect('/unauthorized')
})
```

**Why it's wrong:**
- Middleware runs on Edge Runtime (before Next.js 15.2)
- Edge Runtime cannot access Node.js APIs like database connections
- Causes "Cannot use Node.js runtime" errors

**Do this instead:**
Use cookie-based checks in middleware for fast redirects, then validate in page with Node.js runtime:
```typescript
// ✓ DO THIS - middleware.ts (fast cookie check)
export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect() // Just checks if signed in
  }
})

// ✓ DO THIS - page.tsx (full validation with database)
export default async function AdminPage() {
  const { userId } = await auth()
  const user = await db.users.findUnique({ where: { id: userId } })

  if (user.role !== 'admin') {
    notFound() // Returns 404 for unauthorized
  }

  // Render admin content
}
```

### Anti-Pattern 6: Storing Clerk Keys in Code

**What people do:** Hardcode API keys in components or config files:
```typescript
// ❌ DON'T DO THIS
const clerk = new Clerk('pk_test_xxxxx') // Hardcoded key
```

**Why it's wrong:**
- Keys in code get committed to version control
- Anyone with repo access has your keys
- Can't rotate keys without code changes
- Different keys for dev/staging/prod require code changes

**Do this instead:**
Use environment variables (Clerk does this automatically):
```env
# ✓ DO THIS - .env.local
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
```

Clerk SDK reads these automatically. Add `.env.local` to `.gitignore` and provide `.env.example` template for team.

## Testing Considerations

### Mocking Clerk in Tests

Clerk authentication requires mocking in unit/integration tests. The recommended pattern:

```typescript
// jest.setup.js or test file
jest.mock('@clerk/nextjs', () => {
  return {
    auth: jest.fn(() => Promise.resolve({ userId: 'test-user-id' })),
    currentUser: jest.fn(() => Promise.resolve({
      id: 'test-user-id',
      firstName: 'Test',
      lastName: 'User',
      emailAddresses: [{ emailAddress: 'test@example.com' }],
    })),
    useAuth: jest.fn(() => ({
      userId: 'test-user-id',
      isSignedIn: true,
      isLoaded: true,
    })),
    useUser: jest.fn(() => ({
      user: {
        id: 'test-user-id',
        firstName: 'Test',
        lastName: 'User',
      },
      isSignedIn: true,
      isLoaded: true,
    })),
    UserButton: () => <div data-testid="clerk-user-button">User Button</div>,
    SignIn: () => <div data-testid="clerk-sign-in">Sign In</div>,
    SignUp: () => <div data-testid="clerk-sign-up">Sign Up</div>,
    ClerkProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  }
})
```

**Testing strategies:**
- **Unit tests:** Mock Clerk hooks to return test user data
- **Integration tests:** Mock entire `@clerk/nextjs` module
- **E2E tests:** Use Clerk's test mode or create test accounts

### Test User Creation

For E2E tests, create dedicated test users in Clerk Dashboard or use Clerk's Backend API to programmatically create test accounts.

## Build Order Recommendations

### Phase 1: Core Auth Infrastructure (Critical Path)

**Dependencies:** None
**Goal:** Get authentication working end-to-end

1. **Install Clerk SDK**
   - Run `npm install @clerk/nextjs`
   - Verify version compatibility with Next.js 15.2.3+

2. **Set up environment variables**
   - Create Clerk account and application
   - Add `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` to `.env.local`
   - Create `.env.example` template for team

3. **Add ClerkProvider to root layout**
   - Modify `src/app/layout.tsx`
   - Wrap existing `<ThemeProvider>` with `<ClerkProvider>`
   - Test that app still runs

4. **Create middleware**
   - Create `src/middleware.ts`
   - Implement `clerkMiddleware()` with public route matching
   - Configure broad matcher to avoid middleware detection errors

5. **Create sign-in and sign-up pages**
   - Create `src/app/sign-in/[[...sign-in]]/page.tsx` with `<SignIn />`
   - Create `src/app/sign-up/[[...sign-up]]/page.tsx` with `<SignUp />`
   - Test redirect to sign-in when accessing protected routes

**Validation:** Unauthenticated users should be redirected to `/sign-in`. After signing in, users should access dashboard.

### Phase 2: User Display in Header

**Dependencies:** Phase 1 complete
**Goal:** Show authenticated user in header with sign-out capability

1. **Modify Header component**
   - Add `'use client'` directive to `src/components/Header.tsx`
   - Import `useUser` and `UserButton` from `@clerk/nextjs`
   - Replace static user info with `<UserButton />`
   - Add conditional rendering with `isLoaded` check

2. **Test user display**
   - Verify user name/avatar shows in header
   - Test sign-out from UserButton dropdown
   - Confirm redirect to sign-in after sign-out

**Validation:** Header displays authenticated user info. Clicking UserButton shows dropdown with "Sign Out" option.

### Phase 3: Optional Enhancements

**Dependencies:** Phase 1-2 complete
**Goal:** Polish and developer experience improvements

1. **Add loading states**
   - Create loading skeleton for Header while `isLoaded: false`
   - Consider loading.tsx files for page-level suspense

2. **Customize sign-in/sign-up appearance**
   - Match Clerk components to existing design system
   - Use `appearance` prop on `<SignIn />` and `<SignUp />` components

3. **Set up testing mocks**
   - Create `jest.setup.js` with Clerk mocks
   - Update existing tests to mock auth state
   - Add tests for authenticated/unauthenticated states

4. **Add user-specific data (future)**
   - When connecting to real database, use `userId` from `auth()` to filter orders
   - Consider caching user data in database for performance

**Validation:** App looks polished, tests pass, ready for production.

## Sources

### Official Clerk Documentation (HIGH Confidence)

- [Clerk Next.js Quickstart](https://clerk.com/docs/nextjs/getting-started/quickstart) - Official setup guide
- [clerkMiddleware() Reference](https://clerk.com/docs/reference/nextjs/clerk-middleware) - Middleware configuration
- [auth() Server Helper](https://clerk.com/docs/reference/nextjs/app-router/auth) - Server-side auth access
- [currentUser() Helper](https://github.com/clerk/clerk-docs/blob/main/clerk-typedoc/nextjs/current-user.mdx) - Fetch user object server-side
- [UserButton Component](https://github.com/clerk/clerk-docs/blob/main/docs/reference/components/user/user-button.mdx) - User dropdown component
- [Clerk Environment Variables](https://github.com/clerk/clerk-docs/blob/main/docs/getting-started/quickstart/pages-router.mdx) - Required API keys

### Integration Guides (HIGH Confidence)

- [Complete Authentication Guide for Next.js App Router](https://clerk.com/articles/complete-authentication-guide-for-nextjs-app-router) - Comprehensive integration patterns
- [Build with Matija: Clerk Authentication in Next.js 15](https://www.buildwithmatija.com/blog/clerk-authentication-nextjs15-app-router) - Full integration guide
- [Prismic: Next.js Authentication with Clerk](https://prismic.io/blog/nextjs-authentication) - Step-by-step tutorial

### File Structure Best Practices (MEDIUM Confidence)

- [Best Practices for Organizing Your Next.js 15 2025](https://dev.to/bajrayejoon/best-practices-for-organizing-your-nextjs-15-2025-53ji) - File organization patterns
- [The Ultimate Guide to Organizing Your Next.js 15 Project Structure](https://www.wisp.blog/blog/the-ultimate-guide-to-organizing-your-nextjs-15-project-structure) - Project structure recommendations
- [Next.js Official: Project Structure](https://nextjs.org/docs/app/getting-started/project-structure) - Next.js conventions

### Common Pitfalls (HIGH Confidence)

- [Clerk: auth() was called but middleware not detected](https://clerk.com/docs/reference/nextjs/errors/auth-was-called) - Middleware detection error
- [GitHub Issues: Middleware not working](https://github.com/clerk/javascript/issues/299) - Common middleware issues
- [Next.js Discussion: Multiple middlewares (Clerk + next-intl)](https://github.com/vercel/next.js/discussions/63736) - Middleware conflict patterns

### Testing (HIGH Confidence)

- [A Practical Guide to Testing Clerk Next.js Applications](https://clerk.com/blog/testing-clerk-nextjs) - Official testing guide with Jest and Playwright examples

---
*Architecture research for: Clerk authentication integration with Next.js 15 App Router*
*Researched: 2026-05-09*
*All findings verified against official Clerk documentation and Next.js 15 App Router patterns*
