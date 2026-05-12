# Phase 25: Foundation and Middleware Configuration - Context

**Gathered:** 2026-05-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Establish role-based infrastructure and shared layout components. When complete:
- Authenticated users have role data in session tokens without additional network requests
- TypeScript provides compile-time type safety for role checks
- Middleware can intercept `/demo/*` routes and check for demo role
- All dashboard pages can wrap content with DashboardLayout eliminating duplication

</domain>

<decisions>
## Implementation Decisions

### Middleware Behavior
- **D-01:** Role check failure redirects to root (`/`) with standard 307 redirect — no query params or flash messages
- **D-02:** No logging for failed access attempts — role mismatches are expected behavior, keep middleware simple

### DashboardLayout Scope
- **D-03:** Full layout includes Header + Sidebar + main content wrapper — pages just provide content
- **D-04:** Navigation adapts automatically via route-based detection (usePathname pattern) — no navItems prop

### Type Organization
- **D-05:** Role types and CustomJwtSessionClaims live in `types/clerk.d.ts` — Clerk's documented pattern for extending session claims
- **D-06:** Role values use string union type (`type Role = 'demo' | 'admin' | 'user'`) — simple, no runtime overhead

### Claude's Discretion
None — all areas were explicitly decided.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Clerk Integration
- `.planning/REQUIREMENTS.md` §v1.5 Requirements — ROLE-01, ROLE-02, ACCESS-01, NAV-02 requirements
- `src/middleware.ts` — Existing Clerk middleware pattern with createRouteMatcher
- `src/app/layout.tsx` — ClerkProvider configuration with afterSignOutUrl

### Project Context
- `.planning/PROJECT.md` §Key Decisions — Prior decisions about Clerk, design patterns
- `.planning/STATE.md` §Accumulated Context — Carry-forward decisions about publicMetadata, folder structure

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/middleware.ts`: Existing `clerkMiddleware` and `createRouteMatcher` setup — extend for role checking
- `src/components/Sidebar.tsx`: Uses `usePathname()` for active state detection — same pattern for DashboardLayout
- `src/components/Header.tsx`: Existing Header component — include in DashboardLayout
- `src/components/ThemeProvider.tsx`: Already in layout hierarchy — DashboardLayout slots under it

### Established Patterns
- Route matchers via `createRouteMatcher` arrays — use same pattern for demo routes
- `auth.protect()` for route protection — extend with role-based check
- Path-based detection via Next.js `usePathname()` hook — apply to nav switching

### Integration Points
- `src/app/layout.tsx`: DashboardLayout will be used by page layouts, not root layout
- Page files (`src/app/orders/page.tsx`, etc.): Will wrap content with DashboardLayout after phase 26 migration

</code_context>

<specifics>
## Specific Ideas

No specific requirements — standard Clerk patterns apply.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 25-Foundation and Middleware Configuration*
*Context gathered: 2026-05-10*
