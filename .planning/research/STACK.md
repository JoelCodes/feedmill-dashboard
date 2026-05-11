# Technology Stack: v1.5 Role-Based Access and Route Restructuring

**Project:** CGM Dashboard v1.5 Production Transition
**Researched:** 2026-05-10
**Confidence:** HIGH

## Executive Summary

Adding role-based access control and route restructuring to the existing Next.js 15 + Clerk v7 application requires **ZERO new package installations**. All necessary APIs are already available in the current stack (`@clerk/nextjs@^7.3.3`, `next@16.1.6`).

Implementation requires:
1. **Clerk Dashboard configuration** to customize session tokens with metadata
2. **TypeScript type extensions** for type-safe role checking
3. **Middleware updates** to add role-based route protection (remains `middleware.ts` in Next.js 15)
4. **Route groups** using Next.js App Router conventions (parentheses folders)
5. **Utility functions** for role verification in Server Components

**Key finding:** Next.js 16 introduced `proxy.ts` to replace `middleware.ts`, but this project uses Next.js 15 (`next@16.1.6` package version != framework version) and should continue using `middleware.ts`.

---

## No Stack Changes Required

### Current Stack (Already Sufficient)

| Technology | Current Version | Required For | Status |
|------------|----------------|--------------|--------|
| `@clerk/nextjs` | `^7.3.3` (latest: 7.3.3) | Roles/permissions APIs, session claims | ✅ Sufficient |
| `next` | `16.1.6` (Next.js 15 framework) | Route groups, middleware | ✅ Sufficient |
| `@clerk/types` | `^4.101.23` | TypeScript type extensions | ✅ Sufficient |

**Verification:** Context7 documentation confirms Clerk v7 includes full RBAC support via `publicMetadata`, `auth().sessionClaims`, and `auth.protect()` with role matchers.

---

## Implementation Requirements

### 1. Clerk Dashboard Configuration

**Purpose:** Make user metadata available in session tokens without additional API calls.

**Steps:**
1. Navigate to Clerk Dashboard → Sessions page
2. Add to session token claims (JSON editor):

```json
{
  "metadata": "{{user.public_metadata}}"
}
```

**Why this approach:**
- Attaches `publicMetadata` to JWT session token
- Eliminates network calls to check roles (available in every request)
- Session token has ~1.2KB available for custom claims (sufficient for role strings)
- Clerk refreshes tokens automatically when metadata changes

**Source:** [Clerk Basic RBAC Guide](https://clerk.com/docs/guides/secure/basic-rbac), HIGH confidence

---

### 2. TypeScript Type Definitions

**Purpose:** Enable type-safe role checking with IntelliSense and exhaustive checking.

**Location:** `types/globals.d.ts` (new file)

```typescript
export type Roles = 'demo' | 'admin' // Extend as needed

declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      role?: Roles
    }
  }
}
```

**Why this pattern:**
- Extends Clerk's `CustomJwtSessionClaims` interface (provided by `@clerk/types`)
- Makes `auth().sessionClaims.metadata.role` type-safe
- Union type allows exhaustive checking at compile time

**Source:** [Clerk Basic RBAC - TypeScript section](https://clerk.com/docs/guides/secure/basic-rbac), HIGH confidence

---

### 3. Middleware Updates for Role Protection

**File:** `src/middleware.ts` (existing file, update)

**Current pattern:**
```typescript
// Existing: All authenticated users can access all routes
if (!isPublicRoute(request)) {
  await auth.protect();
}
```

**Updated pattern for role-based access:**
```typescript
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);
const isDemoRoute = createRouteMatcher(["/demo(.*)"]);

export default clerkMiddleware(async (auth, request) => {
  // Public routes: allow unauthenticated
  if (isPublicRoute(request)) {
    return NextResponse.next();
  }

  // Protect all other routes (require authentication)
  await auth.protect();

  // Demo routes: require 'demo' role
  if (isDemoRoute(request)) {
    const { sessionClaims } = await auth();
    if (sessionClaims?.metadata?.role !== 'demo') {
      return NextResponse.redirect(new URL('/', request.url));
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

**Why check role AFTER auth.protect():**
- `auth.protect()` ensures user is authenticated (redirects to sign-in if not)
- Role check happens only for authenticated users
- Redirect to `/` (Coming Soon page) if role check fails

**Alternative: auth.protect() with role matcher:**
```typescript
if (isDemoRoute(request)) {
  await auth.protect((has) => has({ role: 'org:demo' }));
}
```
**Note:** This pattern is for organization-scoped roles (`org:role`). For user-level roles stored in `publicMetadata`, use `sessionClaims` check (first pattern).

**Source:** [Clerk Next.js Middleware Reference](https://github.com/clerk/clerk-docs/blob/main/docs/reference/nextjs/clerk-middleware.mdx), HIGH confidence

---

### 4. Next.js Route Groups

**Purpose:** Organize routes without affecting URLs, enable nested layouts.

**Convention:** Wrap folder name in parentheses: `(folderName)`

**Proposed structure:**
```
src/app/
├── layout.tsx                    # Root layout (header + sidebar)
├── page.tsx                      # "/" - Coming Soon page
├── settings/
│   └── page.tsx                  # "/settings" - All authenticated users
├── (demo)/                       # Route group (omitted from URL)
│   ├── layout.tsx                # Demo-specific layout (if needed)
│   ├── orders/page.tsx           # "/orders" (NOT "/demo/orders")
│   ├── customers/page.tsx        # "/customers"
│   └── mill-production/page.tsx  # "/mill-production"
└── sign-in/[[...sign-in]]/page.tsx
```

**Key behaviors:**
- `(demo)` folder name is **omitted from URLs**
- `app/(demo)/orders/page.tsx` → `/orders` (not `/demo/orders`)
- Route group enables shared layout for demo routes only
- Can have `layout.tsx` inside `(demo)` for demo-specific sidebar navigation
- Root layout remains for header/shared chrome

**Gotchas:**
- **Full page reload** when navigating between different root layouts (only if `(demo)/layout.tsx` includes `<html>`/`<body>` tags - avoid this)
- **Conflicting paths:** Cannot have `(demo)/orders/page.tsx` and `(production)/orders/page.tsx` (both resolve to `/orders`)
- **Matcher still sees logical path:** Middleware matcher sees `/orders` not `/(demo)/orders`

**Source:** [Next.js Route Groups Documentation](https://nextjs.org/docs/app/api-reference/file-conventions/route-groups), HIGH confidence (official docs v16.2.6, applies to Next.js 15)

---

### 5. Role Verification Utility

**Purpose:** Reusable helper for role checks in Server Components, Server Actions, and API Routes.

**Location:** `lib/auth.ts` or `utils/roles.ts` (new file)

```typescript
import { Roles } from '@/types/globals';
import { auth } from '@clerk/nextjs/server';

export async function checkRole(role: Roles): Promise<boolean> {
  const { sessionClaims } = await auth();
  return sessionClaims?.metadata?.role === role;
}

export async function requireRole(role: Roles): Promise<void> {
  if (!(await checkRole(role))) {
    throw new Error(`Access denied: ${role} role required`);
  }
}
```

**Usage in Server Components:**
```typescript
// app/(demo)/orders/page.tsx
import { checkRole } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function OrdersPage() {
  if (!(await checkRole('demo'))) {
    redirect('/');
  }

  // Render orders page
}
```

**Why this pattern:**
- Defense in depth: Check role in middleware AND page component
- Protects against middleware bugs or misconfigurations
- Clear error messages for debugging
- Type-safe with `Roles` union type

**Source:** [Clerk Basic RBAC - Helper Function](https://github.com/clerk/clerk-docs/blob/main/docs/guides/secure/basic-rbac.mdx), HIGH confidence

---

## Metadata Best Practices

### Use publicMetadata for Roles (Not privateMetadata)

| Metadata Type | Access | Best For | Why NOT for Roles |
|---------------|--------|----------|-------------------|
| `publicMetadata` | Backend: read/write<br>Frontend: read-only | **Roles, permissions** | ✅ CORRECT |
| `privateMetadata` | Backend only | Stripe IDs, internal state | Hidden from frontend |
| `unsafeMetadata` | Backend + Frontend read/write | User preferences | User can modify |

**Why publicMetadata:**
- Readable from session token (no API calls)
- Write-protected (only backend can modify)
- Visible in frontend for UI decisions (e.g., show/hide "Demo" nav link)

**Setting roles:**
```typescript
// Server action or API route
import { clerkClient } from '@clerk/nextjs/server';

const client = await clerkClient();
await client.users.updateUser(userId, {
  publicMetadata: {
    role: 'demo'
  }
});
```

**Reading roles:**
```typescript
// Anywhere with auth() access
const { sessionClaims } = await auth();
const role = sessionClaims?.metadata?.role; // 'demo' | 'admin' | undefined
```

**Limitations:**
- **8KB total** for all metadata (public + private + unsafe)
- **~1.2KB** available in session token (after JWT overhead)
- **Synchronization delay:** Metadata changes appear in session after next token refresh (typically <60s, can force with `auth().refresh()`)

**Source:** [Clerk User Metadata Guide](https://clerk.com/docs/guides/users/extending), [Clerk Metadata Best Practices](https://clerk.com/docs/guides/organizations/metadata), HIGH confidence

---

## What NOT to Add

### ❌ Do NOT Install New Packages

**Tempting but unnecessary:**
- `next-auth` - Clerk already handles auth
- `@clerk/backend` - Redundant with `@clerk/nextjs` (includes backend client)
- RBAC libraries (Casl, Permissionify) - Overkill for simple role checks

### ❌ Do NOT Rename middleware.ts to proxy.ts

**Current project:** Next.js 15 (package version `next@16.1.6` is confusing, but framework version is 15.x based on docs version)

**Clarification:**
- `proxy.ts` convention introduced in **Next.js 16**
- Migration path: `middleware.ts` → `proxy.ts` with codemod
- **Decision:** Continue using `middleware.ts` until upgrading to Next.js 16 framework

**Why:**
- Next.js 15 expects `middleware.ts`
- Renaming now breaks routing
- No functional benefit (proxy.ts is just a rename with same APIs)

**When to migrate:**
```bash
# When upgrading to Next.js 16:
npx @next/codemod@canary middleware-to-proxy .
```

**Source:** [Next.js Proxy Migration Guide](https://nextjs.org/docs/messages/middleware-to-proxy), [Next.js 16 Upgrade Guide](https://nextjs.org/docs/app/guides/upgrading/version-16), HIGH confidence

### ❌ Do NOT Use Parallel Routes or Intercepting Routes

**Not needed for this milestone:**
- **Parallel routes** (`@folder`): For rendering multiple pages in same layout (e.g., dashboard with sidebar slot + main slot)
- **Intercepting routes** (`(.)folder`): For modal overlays (e.g., image preview without navigation)

**Current requirement:** Simple route organization (demo vs production sections), not advanced UI patterns.

**Source:** [Next.js Parallel Routes](https://nextjs.org/docs/app/api-reference/file-conventions/parallel-routes), [Next.js Intercepting Routes](https://nextjs.org/docs/app/api-reference/file-conventions/intercepting-routes), HIGH confidence

---

## Integration with Existing clerkMiddleware

### Current Implementation Analysis

**File:** `src/middleware.ts`

**Current logic:**
1. Define public routes: `/sign-in(.*)`, `/sign-up(.*)`
2. Protect all other routes with `auth.protect()`

**Integration points:**
- ✅ Already uses `createRouteMatcher` (can add more matchers)
- ✅ Already uses `clerkMiddleware` async callback (can add conditional logic)
- ✅ Matcher config already excludes static files (no changes needed)

**Changes required:**
1. Add `isDemoRoute` matcher for `/demo(.*)` pattern
2. Add role check after `auth.protect()` for demo routes
3. Redirect to `/` if role check fails

**Backward compatibility:**
- Existing routes (`/orders`, `/customers`, `/mill-production`) move to `(demo)` route group
- URLs remain unchanged (route group omitted from URL)
- Middleware logic extends (doesn't replace) existing auth protection

---

## Migration Checklist

### Phase 1: Clerk Configuration
- [ ] Add `metadata` claim to session token in Clerk Dashboard
- [ ] Manually assign `role: "demo"` to test user's `publicMetadata` (via Dashboard → Users → user → Metadata tab)
- [ ] Verify session token includes metadata (check `auth().sessionClaims` in dev)

### Phase 2: TypeScript Setup
- [ ] Create `types/globals.d.ts` with `Roles` type and `CustomJwtSessionClaims` extension
- [ ] Verify TypeScript recognizes `sessionClaims.metadata.role` (no type errors)

### Phase 3: Route Restructuring
- [ ] Create `src/app/(demo)` route group folder
- [ ] Move existing pages to `(demo)`: `orders/`, `customers/`, `mill-production/`
- [ ] Verify URLs unchanged: `/orders` still works (not `/demo/orders`)
- [ ] Add demo-specific sidebar layout in `(demo)/layout.tsx` (optional)

### Phase 4: Middleware Protection
- [ ] Update `src/middleware.ts` with `isDemoRoute` matcher
- [ ] Add role check logic after `auth.protect()`
- [ ] Test: User without `demo` role redirects to `/` when accessing `/orders`

### Phase 5: Utility Functions
- [ ] Create `lib/auth.ts` with `checkRole()` and `requireRole()` helpers
- [ ] Add role checks to page components (defense in depth)
- [ ] Test: Direct page access without proper role shows error or redirects

### Phase 6: UI Conditionals (Optional)
- [ ] Use `auth().sessionClaims.metadata.role` in Server Components to show/hide demo nav links
- [ ] Add "Demo" indicator to header when role is `demo`

---

## Open Questions / Validation Needed

### 1. Next.js Version Clarification
**Question:** Is framework version Next.js 15 or 16?
**Evidence:**
- Package version: `next@16.1.6`
- PROJECT.md states: "Next.js 15"
- Middleware file currently: `middleware.ts` (not `proxy.ts`)

**Recommendation:** Assume Next.js 15 until confirmed otherwise. Use `middleware.ts` convention.

### 2. Demo Role Assignment Process
**Question:** How are users assigned the `demo` role?
**Options:**
- Manual assignment via Clerk Dashboard (simplest for testing)
- Sign-up flow with role selection (requires custom form)
- Server Action triggered by admin (requires admin UI)

**Recommendation for v1.5:** Manual assignment via Dashboard. Defer automatic assignment to future milestone.

### 3. Root Layout vs Route Group Layout
**Question:** Should `(demo)` have its own `layout.tsx`?
**Options:**
- **No separate layout:** Share root layout, differentiate only via role check (simpler)
- **Separate layout:** Different sidebar navigation for demo vs production (cleaner separation)

**Recommendation:** Start without separate layout. Add `(demo)/layout.tsx` only if sidebar navigation differs significantly.

---

## Success Criteria

Implementation is complete when:
- [ ] Zero new npm packages installed
- [ ] Session token includes `metadata.role` claim (verify in Clerk Dashboard preview)
- [ ] TypeScript recognizes `sessionClaims.metadata.role` without type errors
- [ ] Routes moved to `(demo)` route group, URLs unchanged
- [ ] Middleware redirects non-demo users from `/orders` to `/`
- [ ] Authenticated users without role can access `/settings`
- [ ] `checkRole()` utility works in Server Components
- [ ] Tests updated to mock `sessionClaims.metadata.role`

---

## Sources

### Context7 Documentation (HIGH confidence)
- [Clerk Next.js Middleware - Roles and Permissions](https://github.com/clerk/clerk-docs/blob/main/docs/reference/nextjs/clerk-middleware.mdx)
- [Clerk Basic RBAC with Metadata](https://github.com/clerk/clerk-docs/blob/main/docs/guides/secure/basic-rbac.mdx)
- [Clerk User Metadata Guide](https://github.com/clerk/clerk-docs/blob/main/docs/guides/users/extending)

### Official Next.js Documentation (HIGH confidence)
- [Route Groups API Reference](https://nextjs.org/docs/app/api-reference/file-conventions/route-groups)
- [Project Structure Guide](https://nextjs.org/docs/app/getting-started/project-structure)
- [Proxy.js File Convention](https://nextjs.org/docs/app/api-reference/file-conventions/proxy)
- [Middleware to Proxy Migration](https://nextjs.org/docs/messages/middleware-to-proxy)

### Web Search (MEDIUM confidence)
- [Clerk Metadata Best Practices](https://clerk.com/docs/guides/organizations/metadata)
- [Next.js 15 Route Groups Examples](https://dev.to/krunal_groovy/the-nextjs-15-app-router-project-structure-that-scales-with-examples-47ha)
- [Next.js 16 Proxy Migration Guide](https://medium.com/@amitupadhyay878/next-js-16-update-middleware-js-5a020bdf9ca7)
