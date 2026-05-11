# Pitfalls Research

**Domain:** Adding role-based access and route restructuring to Next.js + Clerk app
**Researched:** 2026-05-10
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Middleware Infinite Redirect Loops

**What goes wrong:**
Middleware redirects users to the same route that triggers the middleware, creating an infinite loop. For example, redirecting unauthenticated users from `/demo/orders` to `/demo/orders?auth=required` still matches the middleware matcher and triggers another redirect.

**Why it happens:**
Developers forget that query parameters don't change the route path for middleware matching purposes. The middleware matcher sees the base path and runs again, even with query params. Additionally, redirecting to a protected route without checking if you're already on that route causes infinite recursion.

**How to avoid:**
- Always check current location before redirecting: `if (pathname === targetUrl) return NextResponse.next()`
- Ensure redirect targets are excluded from middleware matchers
- Use `NextResponse.next()` for authenticated users instead of redirecting them
- Next.js uses `x-middleware-subrequest` header to halt execution after 5 iterations, but relying on this is a code smell

**Warning signs:**
- Browser DevTools shows repeated requests to the same URL
- Console shows "Too many redirects" error
- Middleware logs show the same path being processed repeatedly
- Performance degradation or browser timeout errors

**Phase to address:**
Phase 1 (Middleware Configuration) - Before implementing any role checks, verify redirect logic with comprehensive test cases for authenticated, unauthenticated, and role-based scenarios.

---

### Pitfall 2: Middleware Matcher Missing Static Assets

**What goes wrong:**
Middleware runs on every request including static files, images, fonts, and Next.js internals (`_next/static`). This causes authentication checks on resources that should always be public, breaking page loads and causing 401/403 errors for CSS, JS, and images.

**Why it happens:**
The default middleware matcher is too broad or developers forget to exclude Next.js internals and static assets. When `clerkMiddleware()` runs without a proper matcher, it attempts to authenticate every file request.

**How to avoid:**
Use Clerk's recommended matcher configuration that excludes internals and static files:

```typescript
export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
    // Always run for Clerk-specific frontend API routes
    '/__clerk/(.*)',
  ],
}
```

**Warning signs:**
- Images or fonts fail to load on protected pages
- CSS files return 401/403 errors in Network tab
- Browser console shows "Failed to load resource" for static files
- Pages load but look unstyled

**Phase to address:**
Phase 1 (Middleware Configuration) - Test static asset loading immediately after middleware implementation. Verify images, CSS, fonts all load correctly on both protected and public routes.

---

### Pitfall 3: Hard Refresh Breaking Route Groups

**What goes wrong:**
After restructuring routes into route groups like `(demo)`, soft navigation works perfectly but browser refresh returns 404 errors. Users who bookmark `/demo/orders` or reload the page lose access.

**Why it happens:**
Next.js App Router performs partial rendering during soft navigation but needs additional configuration for hard refreshes. With route groups or parallel routes, Next.js cannot determine active state after a full page load unless you provide a `default.js` file or catch-all segment.

**How to avoid:**
- Add `default.js` files to parallel routes: `app/@slot/default.tsx`
- Use catch-all segments for route groups: `app/(demo)/[...slug]/page.tsx`
- Test every restructured route with browser refresh, not just `<Link>` navigation
- Verify bookmarked URLs still work after restructure

**Warning signs:**
- Routes work when navigating with `<Link>` but 404 on refresh
- Browser DevTools shows 404 for the route but client-side navigation succeeds
- Hard reload returns "404 This page could not be found"
- Bookmarked URLs break after deployment

**Phase to address:**
Phase 2 (Route Restructure) - Before moving routes to new paths, implement proper `default.js` files and test every route with both soft navigation AND hard refresh.

---

### Pitfall 4: Broken SEO and Bookmarks from Missing Redirects

**What goes wrong:**
Existing routes are moved to new paths (e.g., `/orders` → `/demo/orders`) but no redirects are implemented. Users with bookmarks get 404 errors, and search engines index broken links, tanking SEO rankings.

**Why it happens:**
Developers focus on new route structure without considering existing URLs in the wild. Bookmarks, shared links, search engine indexes, and browser history all point to old paths that no longer exist.

**How to avoid:**
Implement permanent redirects in `next.config.js`:

```typescript
module.exports = {
  async redirects() {
    return [
      {
        source: '/orders',
        destination: '/demo/orders',
        permanent: true, // 308 status code
      },
      {
        source: '/customers',
        destination: '/demo/customers',
        permanent: true,
      },
      {
        source: '/mill-production',
        destination: '/demo/mill-production',
        permanent: true,
      },
    ]
  },
}
```

Use 308 (permanent redirect) for moved routes to preserve SEO value and pass link equity. Avoid client-side redirects or meta refresh tags - they're bad for SEO.

**Warning signs:**
- Google Search Console shows increased 404 errors
- Users report "page not found" after clicking old links
- Analytics show referrer URLs that 404
- Old URLs in browser autocomplete lead to 404s

**Phase to address:**
Phase 2 (Route Restructure) - Configure redirects BEFORE moving routes. Deploy redirects and route moves in the same release to minimize 404 exposure window.

---

### Pitfall 5: Session Token Not Updated After Role Assignment

**What goes wrong:**
Roles are assigned to users via `publicMetadata`, but the session token doesn't reflect the change until it naturally refreshes (60 seconds). Middleware role checks fail immediately after assignment, causing access denied errors for users who should have access.

**Why it happens:**
Clerk caches the session token for 60 seconds by default. When you update `publicMetadata` server-side, the user's current session token still contains old data. Middleware reads from the token, not the database.

**How to avoid:**
1. **Configure session token to include publicMetadata**: In Clerk Dashboard → Sessions → Customize session token:
```json
{
  "metadata": "{{user.public_metadata}}"
}
```

2. **Force token refresh after role assignment**:
```typescript
// After updating user metadata
await user.reload() // Fetches updated session data
// OR
await getToken({ skipCache: true }) // Forces fresh token
```

3. **Handle stale token gracefully**: Show "Refreshing permissions..." state instead of access denied, then retry after refresh.

**Warning signs:**
- Users assigned roles can't access protected routes immediately
- Role checks work after waiting ~60 seconds but not instantly
- `auth().sessionClaims.metadata` doesn't match database values
- Error logs show "unauthorized" immediately after successful role assignment

**Phase to address:**
Phase 3 (Role Assignment) - Implement token refresh logic when assigning roles. Add E2E test that verifies role access works immediately after assignment, not after delay.

---

### Pitfall 6: `<Protect>` Component Exposes Data in Browser Source

**What goes wrong:**
Developers use `<Protect role="demo">` to hide sensitive UI components, believing it provides security. However, the component only visually hides content - the data still loads and remains accessible in browser DevTools and page source.

**Why it happens:**
Misunderstanding client-side vs server-side security. `<Protect>` is a convenience component for UX (showing/hiding UI), not a security boundary. React components run in the browser where users have full access to all loaded data.

**How to avoid:**
- **Never use `<Protect>` for truly sensitive data** - it's UX, not security
- **Perform authorization checks on the server** before sending data to client:
```typescript
// app/demo/orders/page.tsx
import { auth } from '@clerk/nextjs/server'

export default async function OrdersPage() {
  const { has } = await auth()

  if (!has({ role: 'demo' })) {
    redirect('/unauthorized')
  }

  // Only now fetch and send sensitive data
  const orders = await getOrders()
  return <OrdersList orders={orders} />
}
```

- Use `auth.protect()` in middleware or server components for actual security
- `<Protect>` is fine for showing/hiding UI elements, just not for data access control

**Warning signs:**
- Security audit reveals sensitive data in page source
- Browser DevTools Network tab shows API responses with data that shouldn't be visible
- React DevTools shows components with protected data even when user lacks role
- Developers comment "hide this from non-admin users" near `<Protect>` usage

**Phase to address:**
Phase 4 (Client Component Protection) - Audit all `<Protect>` usage. Move sensitive data fetching to server components with `auth.protect()` before rendering client components.

---

### Pitfall 7: Dynamic Routes Break After Restructuring

**What goes wrong:**
Dynamic route segments like `/customers/[id]` stop working after moving to a route group. Links that worked before (`/customers/123`) now 404 after moving to `/(demo)/customers/[id]/page.tsx`.

**Why it happens:**
Incorrect folder structure during migration. App Router requires `[id]` to be a folder containing `page.tsx`, not a file. Additionally, moving from Pages Router patterns (`pages/customers/[id].tsx`) to App Router patterns (`app/customers/[id]/page.tsx`) without updating imports breaks param access.

**How to avoid:**
- **Correct App Router structure**: `app/(demo)/customers/[id]/page.tsx` (folder with bracket name, containing page.tsx)
- **Update param access method**:
  - OLD (Pages Router): `const { id } = useRouter().query`
  - NEW (App Router): `const params = useParams()` (client) or `params` prop (server components)
- **Verify explicit routes don't shadow dynamic routes**: `/customers/new` must exist as `app/customers/new/page.tsx` to take priority over `[id]`
- Test with actual IDs, not just navigation from list pages

**Warning signs:**
- Dynamic routes work locally but 404 in production
- Clicking links from list pages works, but direct URLs fail
- Browser shows "No page found for /customers/123"
- TypeScript errors about `useRouter` from wrong import path

**Phase to address:**
Phase 2 (Route Restructure) - Create comprehensive test suite for all dynamic routes. Test direct URL access, not just `<Link>` navigation.

---

### Pitfall 8: Middleware Role Checks on Public Routes

**What goes wrong:**
Middleware checks for roles on routes that should be accessible to all authenticated users (e.g., `/settings`). Users without the "demo" role can't access settings even though it's meant to be universal.

**Why it happens:**
Overly broad middleware logic applies role checks globally instead of only to specific route patterns. Using `auth.protect({ role: 'demo' })` at the top level affects all routes unless explicitly excluded.

**How to avoid:**
Use route matchers to scope role checks to specific paths:

```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)'])
const isDemoRoute = createRouteMatcher(['/demo(.*)'])

export default clerkMiddleware(async (auth, req) => {
  // Public routes: no checks
  if (isPublicRoute(req)) return

  // Demo routes: require demo role
  if (isDemoRoute(req)) {
    await auth.protect({ role: 'demo' })
    return
  }

  // All other routes: just require authentication
  await auth.protect()
})
```

**Warning signs:**
- Users with valid authentication can't access universal routes like `/settings`
- Error logs show "unauthorized" for routes that should be role-agnostic
- Need to assign "demo" role to every user just to access basic features
- Support tickets about locked-out authenticated users

**Phase to address:**
Phase 1 (Middleware Configuration) - Define explicit route matchers for each protection level. Test access matrix: unauthenticated, authenticated without role, authenticated with role.

---

### Pitfall 9: Organization Roles vs publicMetadata Confusion

**What goes wrong:**
Developers use Clerk's organization roles system when they just need simple user-level role flags. This introduces unnecessary complexity (creating organizations for every user, managing memberships) for a feature that could be a simple `publicMetadata.role` field.

**Why it happens:**
Misunderstanding the difference between organization-scoped roles (permissions within a team/company) and application-level roles (feature access tiers). Clerk's documentation shows organization roles prominently, leading developers to use them by default.

**How to avoid:**
**Use publicMetadata when:**
- Roles are application-wide (demo user, admin, premium subscriber)
- Users don't belong to organizations/teams
- Single-tier access control (has access or doesn't)
- Simpler implementation needed

```typescript
// publicMetadata approach
await clerkClient.users.updateUserMetadata(userId, {
  publicMetadata: { role: 'demo' }
})
```

**Use organization roles when:**
- Multi-tenant application with separate teams/companies
- Permissions scoped to specific organizations
- Users can have different roles in different organizations
- Need built-in invite/membership management

For v1.5 (demo access for specific users), use `publicMetadata.role` - it's simpler and sufficient.

**Warning signs:**
- Creating organization for every individual user
- Organization names like "User_123_Org"
- Complex organization membership management for simple feature flags
- Code checking "user's role in their only organization"

**Phase to address:**
Phase 1 (Architecture Decision) - Document which approach to use BEFORE implementing. For demo access, recommend publicMetadata approach.

---

### Pitfall 10: Missing Navigation Updates After Route Restructure

**What goes wrong:**
Routes are moved to `/demo/*` but sidebar navigation, breadcrumbs, and `<Link>` components still point to old paths. Navigation appears to work in dev (Next.js silently redirects) but breaks in production.

**Why it happens:**
Developers move route files but forget to search codebase for hardcoded paths. Next.js dev server is more forgiving than production builds. Links in components, navigation config, redirects, and analytics tracking all need updates.

**How to avoid:**
1. **Grep for old route paths before deployment**:
```bash
rg "\/orders" --type tsx
rg "\/customers" --type tsx
rg "\/mill-production" --type tsx
```

2. **Use route constants instead of hardcoded strings**:
```typescript
// lib/routes.ts
export const ROUTES = {
  DEMO_ORDERS: '/demo/orders',
  DEMO_CUSTOMERS: '/demo/customers',
  DEMO_MILL_PRODUCTION: '/demo/mill-production',
  SETTINGS: '/settings',
} as const
```

3. **Update active state detection logic** in navigation components to match new paths

4. **Test all navigation links** after restructure, including breadcrumbs and footer links

**Warning signs:**
- Navigation links 404 in production but work in dev
- `isActive` state wrong on sidebar after restructure
- Users report "broken links" after deployment
- Analytics show 404s for old paths from internal navigation

**Phase to address:**
Phase 2 (Route Restructure) - Create checklist of all navigation touchpoints. Test production build locally before deploying.

---

### Pitfall 11: Prefetch Errors for Protected Routes

**What goes wrong:**
Public pages (like homepage) contain `<Link>` components to protected routes. Next.js prefetches these links, triggering middleware redirects to sign-in, causing 401 errors and console warnings even though the user hasn't clicked.

**Why it happens:**
Next.js automatically prefetches `<Link>` targets on hover. When middleware redirects prefetch requests to sign-in, it returns a 400-level error. The browser logs this as a failed request even though functionality works correctly.

**How to avoid:**
1. **Disable prefetch for protected routes on public pages**:
```tsx
<Link href="/demo/orders" prefetch={false}>
  View Demo
</Link>
```

2. **Or conditionally render links based on auth state**:
```tsx
<SignedIn>
  <Link href="/demo/orders">View Demo</Link>
</SignedIn>
<SignedOut>
  <Link href="/sign-in">Sign In to View Demo</Link>
</SignedOut>
```

3. **Configure middleware to return 200 for prefetch requests** (advanced):
```typescript
export default clerkMiddleware(async (auth, req) => {
  // Check if it's a prefetch request
  const isPrefetch = req.headers.get('purpose') === 'prefetch'

  if (isPrefetch && !isPublicRoute(req)) {
    return new Response(null, { status: 200 })
  }
  // ... rest of middleware logic
})
```

**Warning signs:**
- Console shows 401 errors for routes user hasn't visited
- Network tab shows failed requests on hover
- Error monitoring service reports high 401 rates from prefetch
- Users report seeing error indicators despite functionality working

**Phase to address:**
Phase 2 (Route Restructure) - Audit public pages for links to protected routes. Add `prefetch={false}` or conditional rendering.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Checking roles only in UI (`<Protect>`) | Faster implementation, simpler code | Data leaks in browser source, false security | Never - always add server-side checks |
| Using `publicMetadata` without session token customization | Works with user.reload(), simpler setup | 60-second delay on role changes, poor UX | Only for non-critical roles where delay is acceptable |
| Skipping redirects for old route paths | Faster deployment, fewer files to change | SEO penalty, broken bookmarks, poor UX | Never for existing production routes |
| Testing only soft navigation, not hard refresh | Faster test suite, works in dev | 404s on bookmark/refresh in production | Never - always test both |
| Broad middleware matchers (all routes) | Simpler config, "just works" | Performance hit, unnecessary auth checks on static files | Only in POC/prototype phase |
| Client-side route guards with `useAuth()` | Familiar React pattern | Flash of wrong content, client-side only | Only as UX enhancement, never as primary security |

## Integration Gotchas

Common mistakes when connecting Clerk with Next.js features.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Middleware + Static Assets | Matcher includes static files, breaking page loads | Use Clerk's recommended matcher excluding `_next/static` and file extensions |
| Middleware + Redirects | Redirecting to protected routes causes infinite loops | Check current path before redirecting, use `NextResponse.next()` for authenticated users |
| Middleware + Route Groups | Hard refresh 404s after using route groups | Add `default.js` files or catch-all segments |
| Session Token + publicMetadata | Roles in metadata don't appear in token | Customize session token in Clerk Dashboard to include metadata claims |
| Organization Roles + Simple App | Using organizations for single-user feature flags | Use `publicMetadata` for app-level roles, organizations for multi-tenant scenarios |
| `<Protect>` + Sensitive Data | Hiding components with sensitive data | Fetch data only after `auth.protect()` on server |
| Dynamic Routes + App Router | Using Pages Router param access in App Router | Update to `useParams()` hook or `params` prop |
| Clerk Middleware + Next.js Config | `basePath` or proxy headers cause redirect loops | Handle comma-separated proxy headers, test behind load balancers |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Running middleware on every request | Slow page loads, high server costs | Use specific matchers, exclude static assets | 1000+ requests/min |
| Fetching user data in middleware | Middleware timeout, slow navigation | Cache session data, use token claims instead of DB queries | 100+ concurrent users |
| Multiple `user.reload()` calls | Rate limit errors from Clerk API | Batch metadata updates, force refresh once after all changes | 50+ users updating simultaneously |
| Checking organization membership in every component | Excessive API calls, slow renders | Load org data once in layout, pass down via props/context | 10+ org checks per page |
| Custom role logic without indexes | Database query slowdown | Index user metadata fields, cache role checks | 10K+ users |
| Client-side role checking on every render | Unnecessary re-renders, UI jank | Memoize auth checks, use context to avoid prop drilling | Complex dashboards with 20+ components |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Using `<Protect>` as security boundary | Sensitive data exposed in browser source, accessible via DevTools | Always use `auth.protect()` on server before fetching sensitive data |
| Storing roles in `privateMetadata` but not in session token | Requires additional API call on every role check, performance hit | Store roles in `publicMetadata` and include in session token |
| Not validating role on server after client check | User can manipulate client state to bypass UI guards | Always verify roles in API routes and server components |
| Using string comparison for role checks | Typos break security ("adimn" vs "admin"), hard to refactor | Use TypeScript enums or constants for role values |
| Forgetting to check role on API routes | UI shows/hides correctly but API accepts all requests | Add role checks to every sensitive API endpoint |
| Allowing role self-assignment | Users can escalate privileges via Clerk user settings | Only allow admin-initiated role changes, use middleware to block updates to certain metadata keys |
| Not handling missing role gracefully | App crashes or shows errors when role undefined | Provide default role or explicit "no role" handling in authorization logic |
| Trusting client-provided role claims | User can forge requests with fake roles | Always read roles from `auth()` session, never from request headers or client state |

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No loading state during role check | Flash of wrong content, confusing UX | Show skeleton or loading spinner while `auth()` resolves |
| Access denied without explanation | Frustration, support tickets | Show clear message: "Demo access required. Contact admin@company.com" |
| Role changes require sign-out/sign-in | Confusion, "it's broken" reports | Force token refresh automatically, show "Permissions updated" toast |
| Breaking existing bookmarks without notice | Users report "app is broken" | Implement redirects, show deprecation notice before removing old routes |
| No fallback when role check fails | Blank page or error screen | Render fallback UI with upgrade prompt or access request form |
| Inconsistent navigation (some links work, some 404) | Loss of trust, confusion | Test all navigation comprehensively before deploy |
| Demo content labeled confusingly | Users think it's real data, make business decisions | Clearly label "DEMO" in header, use watermark, different color scheme |
| No way to see current role | Users don't understand why they can't access features | Show role badge in user menu or profile settings |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Route Protection:** Middleware configured BUT redirects not tested with browser refresh
- [ ] **Role Assignment:** Users can be assigned roles BUT session token not customized to include metadata
- [ ] **Dynamic Routes:** Routes work via `<Link>` navigation BUT 404 on direct URL access or refresh
- [ ] **Old Route Handling:** New routes deployed BUT no redirects from old paths (bookmarks break)
- [ ] **Static Assets:** Middleware matcher defined BUT includes static files (CSS/images fail to load)
- [ ] **Navigation Update:** Routes moved BUT sidebar still has hardcoded old paths
- [ ] **Security:** `<Protect>` added to UI BUT server still sends sensitive data to client
- [ ] **Role Checks:** Middleware checks authentication BUT doesn't verify roles on `/demo/*` routes
- [ ] **Error Handling:** Role checks implemented BUT no fallback UI when unauthorized
- [ ] **Production Testing:** Works in dev BUT not tested behind load balancer/proxy (redirect loops)
- [ ] **Prefetch Errors:** Links work BUT console shows 401s from automatic prefetching
- [ ] **Token Refresh:** Roles assigned BUT users must wait 60s or reload page to access new features

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Infinite redirect loop in production | **HIGH** | 1. Immediately revert middleware changes 2. Add conditional check before redirects 3. Add integration test for redirect scenarios 4. Redeploy |
| Broken bookmarks from missing redirects | **MEDIUM** | 1. Add redirects to `next.config.js` 2. Deploy redirects 3. Submit updated sitemap to Google Search Console 4. Monitor 404 rates |
| Session token missing metadata | **LOW** | 1. Configure session token in Clerk Dashboard 2. Existing sessions update within 60s automatically 3. Optional: Force refresh for active users |
| Hard refresh 404s with route groups | **MEDIUM** | 1. Add `default.js` to affected routes 2. Test all routes with hard refresh 3. Deploy 4. Clear CDN cache |
| `<Protect>` exposing sensitive data | **HIGH** | 1. Move data fetching to server component with `auth.protect()` 2. Pass only non-sensitive props to client 3. Audit all `<Protect>` usage 4. Security review |
| Dynamic routes broken | **MEDIUM** | 1. Fix folder structure to App Router pattern 2. Update param access from `useRouter()` to `useParams()` 3. Test all dynamic routes directly |
| Middleware on static assets | **LOW** | 1. Update matcher to exclude file extensions 2. Deploy 3. Verify images/CSS load correctly |
| Missing navigation updates | **LOW** | 1. Grep codebase for old paths 2. Update all references 3. Test all navigation links 4. Deploy |
| Role changes not immediate | **LOW** | 1. Add session token customization 2. Call `user.reload()` after role assignment 3. Show "Updating permissions..." state |
| Prefetch errors flooding logs | **LOW** | 1. Add `prefetch={false}` to protected links on public pages 2. Configure error monitoring to ignore prefetch 401s 3. Deploy |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Middleware infinite loops | Phase 1: Middleware Config | Test: unauthenticated redirects don't loop, authenticated users proceed |
| Middleware on static assets | Phase 1: Middleware Config | Test: images/CSS load on protected routes |
| Missing route matchers | Phase 1: Middleware Config | Test: public routes accessible, demo routes require role |
| Org roles vs metadata confusion | Phase 1: Architecture Decision | Doc: decision recorded with rationale for publicMetadata approach |
| Session token without metadata | Phase 1: Clerk Configuration | Test: `auth().sessionClaims.metadata` contains role |
| Hard refresh 404s | Phase 2: Route Restructure | Test: every route works with both soft nav AND browser refresh |
| Broken bookmarks/SEO | Phase 2: Route Restructure | Test: old paths redirect to new paths with 308 status |
| Dynamic routes broken | Phase 2: Route Restructure | Test: `/customers/[id]` routes work via direct URL |
| Missing navigation updates | Phase 2: Route Restructure | Test: all sidebar/breadcrumb links point to new paths |
| Prefetch errors | Phase 2: Route Restructure | Test: public page links to protected routes don't cause console errors |
| Role assignment token delay | Phase 3: Role Assignment | Test: role access works immediately after assignment |
| `<Protect>` data exposure | Phase 4: Client Protection | Audit: sensitive data only loaded after `auth.protect()` on server |
| Client-side only role checks | Phase 4: Client Protection | Test: API routes verify roles, not just UI |

## Sources

**Official Documentation:**
- [Clerk clerkMiddleware() Reference](https://clerk.com/docs/reference/nextjs/clerk-middleware)
- [Clerk Role-Based Access Control Guide](https://clerk.com/docs/guides/secure/basic-rbac)
- [Clerk Session Token Customization](https://clerk.com/docs/guides/sessions/session-tokens)
- [Clerk `<Protect>` Component Reference](https://clerk.com/docs/nextjs/reference/components/control/protect)
- [Next.js Middleware Documentation](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Next.js Redirects Guide](https://nextjs.org/docs/app/building-your-application/routing/redirecting)
- [Next.js Dynamic Routes](https://nextjs.org/docs/app/api-reference/file-conventions/dynamic-routes)
- [Next.js Linking and Navigating](https://nextjs.org/docs/app/building-your-application/routing/linking-and-navigating)

**Community Resources:**
- [Common mistakes with the Next.js App Router - Vercel Blog](https://vercel.com/blog/common-mistakes-with-the-next-js-app-router-and-how-to-fix-them)
- [Next.js Middleware Redirect Loops Discussion](https://github.com/vercel/next.js/issues/62547)
- [Clerk Middleware Auth Detection Error](https://clerk.com/docs/reference/nextjs/errors/auth-was-called)
- [Hard Navigation vs Soft Navigation in Next.js](https://typeshare.co/tume/posts/hard-navigation-vs-soft-navigation)
- [Handling Redirects Without Breaking SEO](https://medium.com/@sureshdotariya/handling-redirects-in-next-js-without-breaking-seo-2f8c754bf586)
- [How to Use Matcher in Next.js Middleware](https://medium.com/@turingvang/how-to-use-matcher-in-next-js-middleware-cf18f441d52a)

**Issue Trackers:**
- [Clerk publicMetadata sync issues](https://github.com/clerk/javascript/issues/1944)
- [Next.js middleware matcher discussions](https://github.com/vercel/next.js/discussions/38615)
- [Clerk infinite redirect loop](https://github.com/clerk/javascript/issues/1436)
- [Next.js Parallel Routes and Hard Navigation](https://github.com/vercel/next.js/issues/73939)

**Context7 Documentation:**
- Clerk v7 role-based access control patterns
- Clerk middleware configuration best practices
- Session token customization for publicMetadata

---
*Pitfalls research for: CGM Dashboard v1.5 - Adding role-based demo access and route restructuring*
*Researched: 2026-05-10*
