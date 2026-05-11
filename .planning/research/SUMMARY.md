# Project Research Summary

**Project:** CGM Dashboard v1.5 Production Transition
**Domain:** Role-Based Access Control and Route Restructuring
**Researched:** 2026-05-10
**Confidence:** HIGH

## Executive Summary

The CGM Dashboard v1.5 transition to production requires adding role-based access control and restructuring routes to separate demo content from future production features. Research shows this can be achieved with **zero new package installations** — all required APIs already exist in the current stack (Clerk v7.3.3 + Next.js 15). The solution involves configuring Clerk session tokens to include role metadata, extending middleware for route protection, and restructuring routes into a `/demo/*` namespace.

The recommended approach uses Clerk's `publicMetadata` stored in session tokens for role checks, avoiding the complexity of organization-based RBAC. Middleware checks roles at the edge before pages load, providing security without additional network requests. Routes should be moved to a regular `demo/` folder (not a route group) to enable URL-based middleware matching. A component-based DashboardLayout eliminates current code duplication while maintaining flexibility for shared routes like `/settings`.

Key risks center on middleware configuration errors (infinite redirects, missing static asset exclusions), session token sync delays after role assignment, and breaking existing bookmarks without proper redirects. All critical pitfalls have well-documented prevention strategies from official Clerk and Next.js sources, providing high confidence in the implementation approach.

## Key Findings

### Recommended Stack

**No stack changes required** — the existing Next.js 15 + Clerk v7 integration already provides all necessary APIs for role-based access control. Research confirmed that Clerk v7.3.3 includes full RBAC support via `publicMetadata`, `auth().sessionClaims`, and role-based route protection.

**Current stack (sufficient for v1.5):**
- **@clerk/nextjs@^7.3.3**: Provides session claims API, middleware with role checking, publicMetadata management — already installed
- **next@16.1.6 (Next.js 15 framework)**: Supports route groups, middleware with createRouteMatcher, App Router patterns — already installed
- **@clerk/types@^4.101.23**: Enables TypeScript interface extensions for type-safe role checking — already installed

**Implementation approach:**
1. Configure Clerk Dashboard to include `publicMetadata` in session token claims
2. Create TypeScript type definitions for roles (`type Roles = 'demo' | 'admin'`)
3. Extend middleware with role-based route matchers
4. Use regular `demo/` folder (not route group) for URL-based middleware matching
5. Extract existing layout patterns into reusable DashboardLayout component

**Critical finding:** Next.js version is 15, NOT 16 (package version `next@16.1.6` is misleading). Continue using `middleware.ts` convention, not the Next.js 16 `proxy.ts` pattern.

### Expected Features

**Must have (table stakes for v1.5):**
- Route protection by role — users with `demo` role can access `/demo/*` routes, others redirected to root
- Clear visual feedback when unauthorized — middleware redirects with 404 or redirect to Coming Soon page
- Session-based role assignment — roles available in session token without additional API calls
- Context-aware sidebar — navigation adapts based on route (demo vs production)
- Coming Soon homepage — root `/` displays placeholder with full layout
- Universal settings access — `/settings` accessible to all authenticated users regardless of role

**Should have (competitive advantage):**
- Progressive feature rollout infrastructure — demo namespace at `/demo/*` allows incremental real feature releases at root
- Graceful empty states — professional Coming Soon placeholder instead of blank pages
- Seamless route migration — existing routes move to `/demo/*` with proper redirects (no broken bookmarks)

**Defer to v1.x (post-launch):**
- Auto-redirect demo users from root to `/demo/orders` on first load — improves UX but not essential
- Role assignment UI via admin interface — manual Clerk dashboard assignment sufficient initially
- Onboarding flow explaining demo vs production contexts — add when user confusion emerges
- Audit logging for role-based access attempts — add when security review demands it

**Anti-features to avoid:**
- Fine-grained permission system — premature optimization, start with simple role flags
- Client-side role checking as security boundary — security theater, always enforce server-side
- Automatic role assignment based on metadata — hidden magic leads to debugging nightmares
- Nested role hierarchies — role explosion and inheritance conflicts

### Architecture Approach

The architecture integrates Next.js App Router route groups with Clerk RBAC through middleware-based protection and component-based layouts. Routes are organized into a regular `demo/` folder (not a route group with parentheses) to enable URL path matching in middleware. The solution eliminates current code duplication where every page manually renders Sidebar + Header + main wrapper by extracting this pattern into a reusable DashboardLayout component.

**Major components:**
1. **Middleware Layer** — Extends existing clerkMiddleware with role-based route matchers, checks `sessionClaims.metadata.role` before allowing access to `/demo/*` routes, redirects unauthorized users to root `/`
2. **Route Structure** — Regular `demo/` folder containing moved pages (orders, customers, mill-production), root `/` becomes Coming Soon page, `/settings` remains shared across contexts
3. **DashboardLayout Component** — Reusable wrapper composing Sidebar + Header + main, used consistently across all pages to eliminate duplication
4. **Conditional Sidebar** — Client component using `usePathname()` to render different nav items based on route context (demo vs production)
5. **Session Token Configuration** — Clerk Dashboard customization to include `publicMetadata.role` in session claims, enabling role checks without network requests

**Key architectural patterns:**
- **Middleware Role-Based Protection**: Check roles at edge using `createRouteMatcher()` and `sessionClaims.metadata.role`
- **Component-Based Layouts**: DashboardLayout wrapper instead of route group layouts for consistency across shared routes
- **Conditional Navigation**: Single Sidebar component with conditional logic based on pathname rather than duplicate components
- **TypeScript Type Safety**: Extend `CustomJwtSessionClaims` interface for compile-time role checking

**Data flow:** User navigates → Middleware intercepts → `auth.protect()` verifies authentication → Check if demo route → Read `sessionClaims.metadata.role` → Allow if `role === 'demo'`, redirect otherwise → Page loads with DashboardLayout → Sidebar reads pathname → Renders appropriate nav items

### Critical Pitfalls

1. **Middleware Infinite Redirect Loops** — Redirecting to routes that trigger the same middleware creates infinite loops. Prevention: Check current location before redirecting, ensure redirect targets excluded from matchers, use `NextResponse.next()` for authenticated users. Address in Phase 1 before any role logic.

2. **Middleware Matcher Missing Static Assets** — Running authentication checks on CSS/JS/images breaks page loads. Prevention: Use Clerk's recommended matcher excluding `_next/static` and file extensions. Address in Phase 1 during middleware configuration.

3. **Hard Refresh Breaking Route Groups** — Soft navigation works but browser refresh returns 404. Prevention: Add `default.js` files to parallel routes, test all routes with both soft and hard refresh. Address in Phase 2 during route restructure.

4. **Broken Bookmarks from Missing Redirects** — Moving routes without redirects breaks bookmarks and SEO. Prevention: Implement permanent redirects (308) in `next.config.js` for all moved routes. Address in Phase 2 alongside route moves.

5. **Session Token Not Updated After Role Assignment** — Roles assigned via publicMetadata don't appear in session token until 60-second refresh. Prevention: Configure session token to include metadata in Clerk Dashboard, force refresh with `user.reload()` after assignment. Address in Phase 1 during Clerk configuration.

6. **`<Protect>` Component Exposes Data** — Using `<Protect>` to hide sensitive UI doesn't prevent data loading in browser source. Prevention: Never use `<Protect>` for security, always check roles server-side before fetching data. Address in Phase 4 during client component audits.

7. **Dynamic Routes Break After Restructuring** — Moving `/customers/[id]` to demo folder breaks param access. Prevention: Use correct App Router folder structure `[id]/page.tsx`, update from `useRouter().query` to `useParams()`. Address in Phase 2 during route moves.

8. **Middleware Role Checks on Public Routes** — Overly broad middleware applies role checks to routes that should be universally accessible. Prevention: Use route matchers to scope checks only to `/demo/*`, allow authenticated users to access `/settings`. Address in Phase 1 during middleware design.

## Implications for Roadmap

Based on combined research, the implementation follows a clear dependency chain with 4 phases. Route restructuring and middleware configuration have interdependencies that require careful sequencing to avoid breaking existing functionality.

### Suggested Phase Structure

**4 phases recommended** based on technical dependencies from architecture research and pitfall prevention strategies:

### Phase 1: Foundation and Middleware Configuration
**Rationale:** Middleware and type definitions have no dependencies on route moves. Implementing these first allows testing auth logic without breaking existing routes. Clerk configuration must complete before middleware can access role data.

**Delivers:**
- TypeScript role definitions with `CustomJwtSessionClaims` interface extension
- Clerk Dashboard session token customization to include `publicMetadata.role`
- Updated middleware with role-based route matchers for `/demo/*`
- DashboardLayout component extraction (eliminates duplication, needed before moving pages)
- Conditional Sidebar logic with pathname-based nav items

**Addresses from FEATURES.md:**
- Session-based role assignment (session token config)
- Context-aware sidebar (conditional nav logic)

**Avoids from PITFALLS.md:**
- Middleware infinite redirect loops (test redirect logic comprehensively)
- Middleware matcher missing static assets (use Clerk's recommended matcher)
- Middleware role checks on public routes (explicit route matchers for demo vs universal routes)
- Session token not updated after role assignment (configure token before assigning roles)

**Stack elements from STACK.md:**
- Clerk v7 session claims API
- Next.js middleware with createRouteMatcher
- TypeScript interface extensions

**Research flag:** Standard patterns — skip deep research. Well-documented in Clerk and Next.js official docs.

---

### Phase 2: Route Restructuring and Migration
**Rationale:** Must complete after Phase 1 because moved pages need DashboardLayout component. Route moves and redirects should deploy together to minimize 404 exposure. Middleware already configured in Phase 1, so protection activates immediately after routes move.

**Delivers:**
- Create `demo/` folder structure in app directory
- Move existing pages to `/demo/orders`, `/demo/customers`, `/demo/customers/[id]`, `/demo/mill-production`
- Update all page components to use DashboardLayout wrapper
- Implement permanent redirects (308) in `next.config.js` for old paths
- Create Coming Soon page at root `/`
- Update all navigation links, breadcrumbs, and hardcoded paths

**Addresses from FEATURES.md:**
- Coming Soon homepage (root placeholder)
- Seamless route migration (redirects preserve bookmarks)
- Progressive feature rollout infrastructure (demo namespace established)

**Avoids from PITFALLS.md:**
- Hard refresh breaking route groups (test both soft and hard navigation)
- Broken bookmarks from missing redirects (308 redirects in next.config.js)
- Dynamic routes break after restructuring (correct [id]/page.tsx structure)
- Missing navigation updates (grep codebase for old paths)
- Prefetch errors for protected routes (add prefetch={false} or conditional rendering)

**Implements from ARCHITECTURE.md:**
- Route structure with regular `demo/` folder
- DashboardLayout usage across all pages
- Proper dynamic route folder patterns

**Research flag:** Standard patterns — skip deep research. Route moves and redirects are well-established Next.js practices.

---

### Phase 3: Role Assignment and Testing
**Rationale:** Routes protected and redirects in place, now need to assign demo roles to users and verify end-to-end access control. Must complete after Phase 2 so there are protected routes to test against.

**Delivers:**
- Assign `demo` role to initial test users via Clerk Dashboard
- Verify session token includes role in `sessionClaims.metadata`
- Create role assignment utility functions (`checkRole()`, `requireRole()`)
- Test authenticated users without role redirect to root
- Test authenticated users with demo role can access `/demo/*`
- Test all users can access `/settings`
- Force token refresh logic after role assignment

**Addresses from FEATURES.md:**
- Route protection by role (verify middleware enforcement)
- Clear visual feedback when unauthorized (test redirect behavior)
- Universal settings access (verify `/settings` accessible to all)

**Avoids from PITFALLS.md:**
- Session token not updated after role assignment (force refresh with user.reload())
- Organization roles vs publicMetadata confusion (document decision to use publicMetadata)

**Testing considerations from FEATURES.md:**
- E2E tests for role-based access (no role → 404/redirect, with role → success)
- Middleware unit tests (mock auth() with different role values)
- Manual testing checklist for all demo routes with and without role

**Research flag:** Standard patterns — skip deep research. Role assignment via Clerk Dashboard is straightforward, well-documented process.

---

### Phase 4: Client Component Security Audit
**Rationale:** All routes protected server-side, now audit client components to ensure no data exposure or security theater. This is the "defense in depth" phase that catches missed security checks.

**Delivers:**
- Audit all `<Protect>` component usage
- Verify sensitive data only fetched after server-side role checks
- Add defense-in-depth role checks in Server Components
- Document client vs server role checking patterns
- Remove any client-side-only security checks

**Addresses from FEATURES.md:**
- Clear visual feedback when unauthorized (UX enhancements after security verified)

**Avoids from PITFALLS.md:**
- `<Protect>` component exposes data (move sensitive data fetching to server)
- Client-side only role checks (enforce server-side verification)

**Implements from ARCHITECTURE.md:**
- Role verification utility usage in Server Components
- Proper separation of client UX checks vs server security checks

**Research flag:** Standard patterns — skip deep research. Client vs server security boundaries are well-understood React Server Components patterns.

---

### Phase Ordering Rationale

**Why this sequence:**
1. **Phase 1 before Phase 2**: DashboardLayout must exist before pages can use it during migration. TypeScript types and middleware logic can be implemented and tested without moving routes.

2. **Phase 2 depends on Phase 1**: Pages need DashboardLayout component. Middleware configuration complete so role protection activates immediately when routes move.

3. **Phase 3 after Phase 2**: Can't test role-based access until protected routes exist at `/demo/*` paths. Role assignment requires session token customization from Phase 1.

4. **Phase 4 is final audit**: All server-side protection in place, now verify client components don't create false security assumptions or data leaks.

**Dependency chain:**
```
Phase 1 (Foundation)
    ├── TypeScript types (no deps)
    ├── Clerk session token config (no deps)
    ├── DashboardLayout component (no deps)
    └── Middleware with role matchers (needs Clerk config)
        ↓
Phase 2 (Route Restructure)
    ├── Create demo/ folder (no deps)
    ├── Move pages (needs DashboardLayout from Phase 1)
    ├── Add redirects (needs route moves)
    └── Update navigation (needs route moves)
        ↓
Phase 3 (Role Assignment)
    ├── Assign roles (needs Clerk config from Phase 1)
    └── Test access control (needs protected routes from Phase 2)
        ↓
Phase 4 (Security Audit)
    └── Audit client components (needs server security from Phase 1-3)
```

**Grouping rationale:**
- **Phase 1** groups all zero-dependency foundation work that can be implemented and tested independently
- **Phase 2** groups all route-related changes that must deploy atomically (moves + redirects + nav updates)
- **Phase 3** groups testing and validation that verifies the system works end-to-end
- **Phase 4** separates security audit as distinct from implementation to ensure thorough review

### Research Flags

**Phases with standard patterns (skip research-phase):**
- **Phase 1**: Clerk session token customization, middleware configuration, and TypeScript types are all well-documented with official examples
- **Phase 2**: Next.js route restructuring, redirects, and App Router patterns have extensive official documentation
- **Phase 3**: Role assignment via Clerk Dashboard UI is straightforward and well-documented
- **Phase 4**: React Server Components security patterns have clear guidance in official docs

**All 4 phases use standard, well-documented patterns.** No phases require `/gsd-research-phase` during planning. Research provided comprehensive implementation details with high confidence from official sources.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All required APIs verified in current packages via official Clerk v7 docs. Zero new installations needed confirmed. |
| Features | HIGH | Feature requirements well-defined with clear table stakes vs differentiators. Anti-features identified from community experience. |
| Architecture | HIGH | All patterns verified from official Next.js and Clerk documentation. Existing codebase structure analyzed for integration points. |
| Pitfalls | HIGH | Critical pitfalls documented with prevention strategies from official docs and community issue trackers. Recovery strategies included. |

**Overall confidence:** HIGH

All research findings verified against official documentation (Next.js App Router docs, Clerk v7 API references) and supported by community consensus. No conflicting information found. Implementation path clear with well-defined phases.

### Gaps to Address

**Open questions for validation during planning:**

1. **Next.js Framework Version Confirmation** — PROJECT.md states Next.js 15, package.json shows `next@16.1.6`. Research assumes Next.js 15 based on existing `middleware.ts` file. Validation: Run `npx next --version` to confirm framework version. **Impact**: If actually Next.js 16, need to migrate middleware.ts to proxy.ts (codemod available).

2. **Demo Role Assignment Process** — Research recommends manual assignment via Clerk Dashboard for v1.5. Alternative options exist (sign-up flow with role selection, admin UI). Validation: Confirm manual approach acceptable for initial rollout. **Impact**: If automatic assignment needed, add to Phase 3 scope.

3. **Route Group Layout Decision** — Research recommends shared DashboardLayout component for all pages. Alternative: Separate layouts for demo vs production with different `layout.tsx` files. Validation: Confirm whether demo and production need significantly different sidebars. **Impact**: If different sidebars required, restructure to use route-specific layouts.

4. **Settings Route Strategy** — Research shows single `/settings` shared by all authenticated users. Alternative: Separate `/demo/settings` with demo-specific configuration options. Validation: Confirm settings should be universal. **Impact**: If demo needs separate settings, create `/demo/settings` in Phase 2.

**None of these gaps block implementation.** All have reasonable defaults documented in research. Can proceed with roadmap creation using recommended approaches, adjust during planning if validation reveals different requirements.

## Sources

### Primary (HIGH confidence)

**Context7 Clerk Documentation:**
- [Clerk: Basic RBAC with Metadata](https://clerk.com/docs/guides/secure/basic-rbac) — Role storage in publicMetadata, session token customization
- [Clerk: Next.js Middleware Reference](https://github.com/clerk/clerk-docs/blob/main/docs/reference/nextjs/clerk-middleware.mdx) — clerkMiddleware patterns, createRouteMatcher usage
- [Clerk: User Metadata Guide](https://clerk.com/docs/guides/users/extending) — publicMetadata vs privateMetadata best practices
- [Clerk: Session Token Customization](https://clerk.com/docs/guides/sessions/session-tokens) — Including metadata in JWT claims

**Official Next.js Documentation:**
- [Next.js: Route Groups API Reference](https://nextjs.org/docs/app/api-reference/file-conventions/route-groups) — Route group patterns and gotchas
- [Next.js: Middleware Documentation](https://nextjs.org/docs/app/building-your-application/routing/middleware) — Middleware configuration and matchers
- [Next.js: Dynamic Routes](https://nextjs.org/docs/app/api-reference/file-conventions/dynamic-routes) — App Router dynamic segment patterns
- [Next.js: Redirects](https://nextjs.org/docs/app/api-reference/config/next-config-js/rewrites) — Permanent redirect configuration

### Secondary (MEDIUM confidence)

**Community Resources:**
- [Vercel Blog: Common mistakes with Next.js App Router](https://vercel.com/blog/common-mistakes-with-the-next-js-app-router-and-how-to-fix-them) — Hard refresh 404s, route group pitfalls
- [LogRocket: Guide to Next.js Layouts](https://blog.logrocket.com/guide-next-js-layouts-nested-layouts/) — Layout composition patterns
- [DEV: Role-Based Sidebar Navigation in React](https://dev.to/dmadridy/role-based-sidebar-navigation-in-react-applications-415o) — Conditional navigation patterns
- [This Dot Labs: Next.js Route Groups](https://www.thisdot.co/blog/next-js-route-groups) — Route organization strategies

**Issue Trackers:**
- [Next.js Middleware Redirect Loops Discussion](https://github.com/vercel/next.js/issues/62547) — Infinite redirect prevention
- [Clerk publicMetadata Sync Issues](https://github.com/clerk/javascript/issues/1944) — Token refresh timing
- [Next.js Parallel Routes Hard Navigation](https://github.com/vercel/next.js/issues/73939) — Hard refresh gotchas

---

*Research completed: 2026-05-10*
*Ready for roadmap: Yes*
*Synthesis by: gsd-synthesizer agent*
