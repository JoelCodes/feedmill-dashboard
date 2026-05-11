# Feature Research

**Domain:** Role-based demo access and route restructuring
**Researched:** 2026-05-10
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Route protection by role | Standard RBAC expectation — different user types see different content | MEDIUM | Clerk middleware with `createRouteMatcher()` and role checking in `sessionClaims.metadata.role`. Requires session token configuration in Clerk dashboard. |
| Clear visual feedback when unauthorized | Users expect immediate feedback when they lack permissions, not silent failures | LOW | Standard HTTP 404 via `auth.protect()` or redirect with `NextResponse.redirect()`. Clerk handles this at edge before page loads. |
| Persistent navigation state | Users expect sidebar to remember expanded/collapsed state and active route highlighting | LOW | Client-side state with localStorage + `usePathname()` for active state detection. Already implemented in existing dashboard. |
| Fallback routes for unauthorized access | Users without demo role need somewhere to land (not a 404) | LOW | Redirect to root `/` homepage or settings. Middleware handles before route resolution. |
| Session-based role assignment | Roles must be available without additional network requests for performance | MEDIUM | Clerk `publicMetadata` in session token (1.2KB limit). Role available in `sessionClaims?.metadata.role` after session token customization. |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Context-aware sidebar | Navigation adapts to current route context (demo vs production), providing focused navigation | MEDIUM | Route groups with separate `layout.tsx` files. Sidebar config driven by route context. React Router `useLocation()` pattern for conditional rendering. |
| Progressive feature rollout infrastructure | Foundation for incremental real feature releases without code changes | MEDIUM | Demo namespace established at `/demo/*`. Future production features at root `/` without affecting demo content. Similar to feature flag architecture. |
| Graceful empty states | Professional "Coming Soon" placeholder with clear messaging instead of blank pages | LOW | Empty state pattern with illustration + message + CTA. Dashboard design patterns show content-shaped skeleton loaders for consistency. |
| Seamless route migration | Existing routes move to `/demo/*` without breaking external links or bookmarks | LOW | Next.js rewrites in `next.config.js` can proxy old paths to new locations if needed. File-based routing requires physical file moves. |
| Universal settings access | Settings accessible to all authenticated users regardless of role | LOW | `/settings` remains at root, excluded from demo-specific middleware checks. Reinforces settings as user-level, not role-level. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Fine-grained permission system | "We need permissions, not just roles" | Premature optimization. Adds complexity (permission arrays, hierarchies, edge cases) before understanding actual needs. RBAC roles are static and don't capture conditions. | Start with simple role-based access (`demo` role). Add permissions only when specific use cases emerge requiring sub-role distinctions. |
| Client-side role checking | "Check roles in React components for conditional rendering" | Security theater. Client-side checks are suggestions, not enforcement. Attackers can bypass. Creates false sense of security. | Always enforce roles in middleware (edge) and Server Components. Use client checks ONLY for UI/UX (hiding buttons), never for access control. |
| Automatic role assignment based on user metadata | "Assign roles based on email domain or signup source" | Hidden magic leads to debugging nightmares. Users get wrong roles with no clear reason. Brittle logic breaks as organization grows. | Explicit role assignment via Clerk dashboard or admin API. Clear audit trail of who assigned what role when. |
| Multiple root layouts without page reload warning | "Users shouldn't notice they're moving between demo and production" | Next.js triggers full page reload when navigating between different root layouts. Fighting the framework creates jank. | Accept the reload as a boundary between demo and production contexts. Use route groups with shared root layout if seamless navigation is critical. |
| Nested role hierarchies | "Admins should automatically have demo access" | Role explosion and inheritance conflicts. Middleware logic becomes brittle with cascading checks (`if admin OR demo OR moderator...`). | Flat role structure. If user needs multiple contexts, assign multiple explicit roles in metadata array, not implicit inheritance. |

## Feature Dependencies

```
Route Restructuring (move files to /demo/*)
    └──requires──> Existing Dashboard Pages (already built)
                       └──requires──> Authentication (v1.4 shipped)

Role-Based Middleware
    └──requires──> Route Restructuring
    └──requires──> Session Token Configuration (Clerk dashboard)
    └──requires──> TypeScript role types

Context-Aware Sidebar
    └──requires──> Route Restructuring
    └──enhances──> Progressive Feature Rollout

Coming Soon Homepage
    └──requires──> Route Restructuring (frees up root `/`)
    └──requires──> Shared Layout Components

Progressive Feature Rollout ──enabled_by──> Demo Namespace Isolation
```

### Dependency Notes

- **Route Restructuring requires Existing Dashboard Pages:** Physical file moves from `/app/(dashboard)/orders` to `/app/(dashboard)/demo/orders`. Must preserve imports and data flows.
- **Role-Based Middleware requires Session Token Configuration:** Clerk session must include `publicMetadata.role` via dashboard configuration before middleware can check `sessionClaims.metadata.role`.
- **Context-Aware Sidebar requires Route Restructuring:** Sidebar logic depends on distinguishing `/demo/*` from root routes. Can't implement conditional navigation without clear route boundaries.
- **Progressive Feature Rollout enabled by Demo Namespace Isolation:** Once demo content lives in `/demo/*`, root routes become available for production features without affecting demo functionality.
- **TypeScript role types enhance all role features:** `type Roles = 'demo'` with `CustomJwtSessionClaims` interface extension provides type safety and autocomplete in middleware and Server Components.

## MVP Definition

### Launch With (v1.5)

Minimum viable product — what's needed to validate the concept.

- [x] **Route Restructuring** — Move existing pages to `/demo/*` subdirectory. Essential foundation. Unblocks everything else.
- [x] **Role-Based Middleware** — Restrict `/demo/*` to users with `demo` role. Core security requirement. Without this, restructuring is pointless.
- [x] **Session Token Configuration** — Add `publicMetadata.role` to Clerk session claims. Technical prerequisite for middleware checks.
- [x] **TypeScript Role Types** — Define `Roles = 'demo'` and extend `CustomJwtSessionClaims`. Type safety prevents runtime role check errors.
- [x] **Context-Aware Sidebar** — Demo routes show demo navigation, root shows minimal navigation. Users must understand where they are.
- [x] **Coming Soon Homepage** — Root `/` displays placeholder with full layout. Prevents authenticated users from landing on empty page.
- [x] **Universal Settings Access** — `/settings` accessible to all authenticated users. Users need access to theme/preferences regardless of role.

### Add After Validation (v1.x)

Features to add once core is working.

- [ ] **Redirect to Demo for Demo Users** — Auto-redirect users with `demo` role from root to `/demo/orders` on first load — Trigger: User confusion about empty homepage when they have demo access
- [ ] **Role Assignment UI** — Admin interface to assign/revoke demo role via Clerk API — Trigger: Manual Clerk dashboard access becomes bottleneck
- [ ] **Onboarding Flow** — First-time user guidance explaining demo vs production contexts — Trigger: Support requests about "where's my data"
- [ ] **Navigation Breadcrumbs** — Show current location within demo/production context — Trigger: Users getting lost in nested routes
- [ ] **Audit Logging** — Track role-based access attempts (successful and denied) — Trigger: Security review or compliance requirement

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] **Multiple Demo Environments** — Separate demo roles like `demo-basic`, `demo-advanced` with different content visibility — Why defer: Unknown if multiple demo tiers are needed. Wait for customer feedback.
- [ ] **Time-Limited Demo Access** — Demo role expires after N days automatically — Why defer: Adds complexity (cron jobs, expiry checking). Validate that persistent demo access is actually a problem first.
- [ ] **Feature Flags Integration** — Progressive rollout system for production features with percentage-based exposure — Why defer: Overkill for small team. Manual releases sufficient until scale demands it.
- [ ] **Usage Analytics by Role** — Track what demo users interact with vs production users — Why defer: Analytics infrastructure not established. Add when data-driven decisions are needed.
- [ ] **Custom Landing Pages by Role** — Different homepage content based on user role — Why defer: Only one role (`demo`) exists. Wait until role proliferation justifies custom experiences.

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Route Restructuring | HIGH | LOW | P1 |
| Role-Based Middleware | HIGH | MEDIUM | P1 |
| Session Token Configuration | HIGH | LOW | P1 |
| TypeScript Role Types | MEDIUM | LOW | P1 |
| Context-Aware Sidebar | HIGH | MEDIUM | P1 |
| Coming Soon Homepage | MEDIUM | LOW | P1 |
| Universal Settings Access | MEDIUM | LOW | P1 |
| Redirect to Demo for Demo Users | MEDIUM | LOW | P2 |
| Role Assignment UI | MEDIUM | MEDIUM | P2 |
| Onboarding Flow | MEDIUM | MEDIUM | P2 |
| Navigation Breadcrumbs | LOW | LOW | P2 |
| Audit Logging | LOW | MEDIUM | P3 |
| Multiple Demo Environments | LOW | HIGH | P3 |
| Time-Limited Demo Access | LOW | MEDIUM | P3 |
| Feature Flags Integration | MEDIUM | HIGH | P3 |

**Priority key:**
- P1: Must have for launch (v1.5)
- P2: Should have, add when possible (v1.x)
- P3: Nice to have, future consideration (v2+)

**Prioritization rationale:**
- **Route Restructuring** is P1 because nothing else works without it. Low cost (file moves) + high value (unblocks everything).
- **Role-Based Middleware** is P1 despite MEDIUM cost because it's the core security mechanism. Without it, demo/production separation is meaningless.
- **Context-Aware Sidebar** is P1 because users need to understand navigation context. MEDIUM cost justified by high user value.
- **Redirect to Demo for Demo Users** is P2 because it improves UX but isn't essential. Demo users can manually navigate to `/demo/orders`.
- **Audit Logging** is P3 because no compliance requirement exists yet. Add when security posture review demands it.
- **Feature Flags Integration** is P3 despite MEDIUM user value because HIGH implementation cost (third-party service, SDK integration, infrastructure). Manual releases work fine at current scale.

## Competitor Feature Analysis

| Feature | Linear (SaaS Dashboard) | Vercel Dashboard | Our Approach |
|---------|-------------------------|------------------|--------------|
| Role-Based Access | Organization-based with roles (Admin, Member, Guest). Roles control access to settings, billing, deployments. | Team-based access with Owner/Member roles. Project-level permissions. | Single `demo` role for now. Simpler model fits small team. Can expand to org-based later if needed. |
| Empty States | Content-shaped skeleton loaders with shimmer animation. No spinners. | Placeholder cards with "No projects yet" + CTA to create. | "Coming Soon" message with full layout (header + sidebar). More explicit than placeholder because we're not waiting on user action. |
| Navigation Context | Sidebar always visible. Nested sections expand/collapse. Active state via router. | Sidebar with project switcher. Navigation changes based on selected project context. | Context-aware sidebar that shows different nav based on route group (demo vs root). Similar to Vercel's project context switching. |
| Route Organization | `/team/[slug]/projects/[id]` pattern. Organization slug in URL. | `/dashboard/[team]/[project]` nested structure. | `/demo/*` namespace for demo content. Root `/` for production. Simpler than nested dynamic routes. |
| Access Denied Handling | Redirect to team selection page if no access. Clear message: "You don't have access to this team." | 404 page for projects you don't own. No explicit "access denied" message. | Following Clerk best practice: `auth.protect()` returns 404 for unauthorized. Consider redirect to root with message if 404 is too cryptic. |

**Key takeaways:**
- **Linear** uses organization context heavily. We're avoiding this complexity for now with flat role structure.
- **Vercel** uses team/project hierarchy. Our demo namespace is simpler but less flexible for future multi-tenancy.
- **Both** use router-based active state detection. We already have this pattern from v1.0 (usePathname with prefix matching).
- **Empty states** vary widely. Our "Coming Soon" approach is more explicit than skeleton loaders because we're not loading data — features genuinely don't exist yet.

## Edge Cases & Testing Considerations

### Critical Edge Cases

| Scenario | Expected Behavior | Notes |
|----------|-------------------|-------|
| User with no role assigned | Redirect to root `/`. No demo access. Settings still accessible. | `sessionClaims?.metadata.role === undefined` should not crash. Middleware must handle gracefully. |
| User logs out while on `/demo/*` page | Redirect to sign-in via Clerk middleware. After sign-in, redirect to root `/` (not back to demo). | Clerk's `afterSignOutUrl` handles first part. Need to prevent redirect back to protected route after sign-in. |
| User role changes while session active | Old session token still has old role until refresh. User has stale permissions. | Document in PITFALLS: Session token updates aren't instant. Users may need to sign out/in to see new roles. Consider adding refresh button in UI. |
| Navigating from demo to production routes | Full page reload because different root layouts (if using route groups). | This is a Next.js limitation with multiple root layouts. Accept or use shared root layout if reload is unacceptable. |
| Direct URL access to `/demo/orders` without role | Middleware returns 404 via `auth.protect()`. User never sees page. | Edge-level protection. No React component mount. Fast and secure. |
| Concurrent login from multiple devices | Each device has independent session token. Role changes propagate on next token refresh. | Not an issue for this milestone. No session invalidation needed. |
| Session expiry during demo navigation | Clerk middleware redirects to sign-in. Session state lost. | Standard auth flow. After re-auth, redirect to root (safe default) not back to demo (which requires role check). |
| User manually assigns role via Clerk API | Role available immediately in new sessions. Existing sessions have stale token. | Document: Role changes don't affect active sessions until sign out/in or token refresh. |
| Deeply nested demo routes (e.g., `/demo/orders/[id]`) | Route matcher must use glob pattern `/demo(.*)` not `/demo/*` to catch nested routes. | Clerk `createRouteMatcher` uses glob syntax, not filesystem glob. Critical for nested route protection. |
| Special characters in routes (e.g., `/demo/orders?tab=pending`) | Query params don't affect route matching. Middleware checks pathname only. | Route matchers ignore query params. No special handling needed. |

### Automated Testing Strategy

**Middleware Tests (Unit):**
- Mock `auth()` to return different role values
- Verify `createRouteMatcher` correctly identifies demo routes
- Test redirect behavior for unauthorized users
- Verify 404 response from `auth.protect()` for missing roles

**E2E Tests (Playwright - Already have infrastructure from v1.4):**
- Sign in as user with no role → attempt `/demo/orders` → expect 404 or redirect
- Sign in as user with `demo` role → navigate to `/demo/orders` → expect success
- Sign in as any user → navigate to `/settings` → expect success (universal access)
- Sign out from `/demo/*` route → expect redirect to sign-in → after sign-in, expect root `/` not demo
- Test navigation from demo to root and back (verify page reload for different layouts)

**Integration Tests:**
- Verify sidebar shows correct navigation based on route context
- Test active state highlighting in both demo and root contexts
- Verify "Coming Soon" placeholder renders with full layout

**Manual Testing Checklist:**
- [ ] Assign demo role via Clerk dashboard → verify session token includes role in claims
- [ ] Remove demo role → sign out/in → verify no demo access
- [ ] Test all demo routes (orders, customers, mill-production) with demo role
- [ ] Test all demo routes without demo role → expect access denied
- [ ] Verify settings accessible from both demo and root contexts
- [ ] Test browser back/forward through demo and root routes
- [ ] Verify no console errors or React warnings during navigation
- [ ] Test theme toggle works in both contexts (state persists)

## Implementation Complexity Assessment

**Route Restructuring: LOW**
- File moves in Next.js app directory
- Update imports (TypeScript will catch broken imports)
- Risk: Breaking existing route tests (need to update test paths)

**Role-Based Middleware: MEDIUM**
- Clerk middleware already exists from v1.4
- Add route matcher and role check logic
- Risk: Glob pattern syntax errors in route matching (`.*/` not `*`)
- Risk: Session token not configured → `sessionClaims.metadata.role` undefined → crashes

**Session Token Configuration: LOW**
- UI-based configuration in Clerk dashboard
- Add `{{user.public_metadata.role}}` to session claims
- Risk: Exceeding 1.2KB token size limit (not a risk with single role field)

**Context-Aware Sidebar: MEDIUM**
- Conditional rendering based on route context
- Option 1: Single sidebar with conditional logic (simpler)
- Option 2: Separate layout.tsx per route group (more Next.js idiomatic)
- Risk: Duplicate code if using separate layouts
- Risk: Shared state between contexts if using single sidebar

**Coming Soon Homepage: LOW**
- New page component at `/app/(dashboard)/page.tsx`
- Reuse existing layout (header + sidebar)
- Empty state pattern (message + illustration)
- Risk: None — straightforward React component

**TypeScript Role Types: LOW**
- Define `type Roles = 'demo'`
- Extend `CustomJwtSessionClaims` interface
- Add to global types or types/globals.d.ts
- Risk: None — pure TypeScript, no runtime impact

## Dependencies on Existing Auth (v1.4)

**What we're building on:**
- Clerk SDK already integrated (`ClerkProvider`, `clerkMiddleware`)
- Middleware config already exists with route matchers
- `UserButton` in header already shows user info
- Themed sign-in page already matches dashboard design
- Route protection already enforced for all dashboard routes

**What changes:**
- Middleware logic becomes more sophisticated (role-based, not just authenticated)
- Route matcher patterns expand (need to distinguish demo routes from root routes)
- Session token customization required (new Clerk dashboard config)
- TypeScript types need extension (session claims interface)

**What stays the same:**
- Authentication flow (sign-in, sign-out, session management)
- Protected route pattern (middleware-based, edge-level enforcement)
- Clerk UI components (UserButton, SignIn page)
- Theme integration (CSS variables already mapped)

**Migration considerations:**
- All existing authenticated users will NOT have demo role by default
- After v1.5 ships, manually assign demo role to users who should see demo content
- Existing bookmarks to `/orders` will 404 after restructure to `/demo/orders`
- Consider adding rewrites in `next.config.js` if external links exist (unlikely for localhost development)

## Sources

**Role-Based Access Control Patterns:**
- [Clerk: Basic RBAC with Metadata](https://clerk.com/docs/guides/secure/basic-rbac)
- [Clerk Middleware Reference](https://github.com/clerk/clerk-docs/blob/main/docs/reference/nextjs/clerk-middleware.mdx)
- [Auth.js RBAC Guide](https://authjs.dev/guides/role-based-access-control)
- [DEV: Role-Based Navigation in React](https://dev.to/dmadridy/role-based-sidebar-navigation-in-react-applications-415o)
- [IBM: RBAC Implementation Guide](https://www.ibm.com/think/topics/role-based-access-control-implementation)
- [Frontegg: RBAC Best Practices](https://frontegg.com/guides/role-based-access-control-best-practices)

**Next.js Route Patterns:**
- [Next.js: Layouts and Pages](https://nextjs.org/docs/app/getting-started/layouts-and-pages)
- [Next.js: Route Groups](https://nextjs.org/docs/app/api-reference/file-conventions/route-groups)
- [Next.js: Rewrites](https://nextjs.org/docs/app/api-reference/config/next-config-js/rewrites)
- [LogRocket: Guide to Next.js Layouts and Nested Layouts](https://blog.logrocket.com/guide-next-js-layouts-nested-layouts/)
- [This Dot Labs: Next.js Route Groups](https://www.thisdot.co/blog/next-js-route-groups)

**Navigation Patterns:**
- [Fireship: Location Aware Sidebar with React Router](https://fireship.dev/react-router-sidebar-breadcrumbs)
- [DEV: Building Collapsible Admin Sidebar with React Router](https://dev.to/cristiansifuentes/building-a-collapsible-admin-sidebar-with-react-router-uselocation-pro-patterns-7im)
- [Medium: Creating Dynamic Sidebar Menu with React Hooks](https://medium.com/geekculture/creating-a-dynamic-sidebar-menu-with-one-route-using-react-hooks-9d31640fb78c)

**Empty State Design:**
- [UserOnboard: Empty States Onboarding Pattern](https://www.useronboard.com/onboarding-ux-patterns/empty-states/)
- [Pencil & Paper: Empty State UX Best Practices](https://www.pencilandpaper.io/articles/empty-states)
- [Smashing Magazine: The Role of Empty States in User Onboarding](https://www.smashingmagazine.com/2017/02/user-onboarding-empty-states-mobile-apps/)
- [Dashboard Design Patterns (2026)](https://artofstyleframe.com/blog/dashboard-design-patterns-web-apps/)

**Progressive Rollout & Feature Flags:**
- [Feature Flags Production Guide](https://www.askantech.com/feature-flags-production-progressive-delivery-implementation-guide/)
- [Microsoft: Progressive Experimentation with Feature Flags](https://learn.microsoft.com/en-us/devops/operate/progressive-experimentation-feature-flags)
- [GrowthBook: What Are Feature Flags](https://blog.growthbook.io/what-are-feature-flags/)

**Testing & Edge Cases:**
- [Frugal Testing: Testing Login & Authentication Edge Cases](https://www.frugaltesting.com/blog/testing-login-authentication-flows-edge-cases-people-forget)
- [testRigor: What Are Edge Test Cases](https://testrigor.com/blog/what-are-edge-test-cases/)
- [ZAP: Access Control Testing](https://www.zaproxy.org/docs/desktop/addons/access-control-testing/)

---
*Feature research for: CGM Dashboard v1.5 — Role-based demo access*
*Researched: 2026-05-10*
