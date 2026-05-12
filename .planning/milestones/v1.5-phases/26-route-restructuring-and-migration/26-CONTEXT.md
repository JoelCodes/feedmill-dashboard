# Phase 26: Route Restructuring and Migration - Context

**Gathered:** 2026-05-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Move existing demo pages (orders, customers, mill-production) to `/demo/*` namespace with route-based sidebar adaptation and a new Coming Soon homepage. When complete:
- Users can access orders, customers, and mill production pages at `/demo/*` paths
- Root homepage displays Coming Soon message with full DashboardLayout
- Sidebar shows context-appropriate navigation (demo nav vs "Coming Soon" placeholder)
- Settings remains accessible at `/settings` for all authenticated users

</domain>

<decisions>
## Implementation Decisions

### Redirect Behavior
- **D-01:** No redirects from old URLs — old paths (`/orders`, `/customers`, `/mill-production`) will simply 404. Clean break approach.

### Sidebar Navigation
- **D-02:** Route-based detection using `usePathname()` to determine context — consistent with existing Sidebar pattern for active state detection
- **D-03:** Production context (non-demo) shows single "Coming Soon" placeholder link — not empty, not same-as-demo
- **D-04:** Demo context shows full navigation: Orders, Customers, Mill Production (pointing to `/demo/*` paths)

### Coming Soon Homepage
- **D-05:** Minimal placeholder content — simple "Coming Soon" heading with brief professional subtext
- **D-06:** Uses full DashboardLayout (Header + Sidebar + main content) — consistent navigation experience

### Settings Visibility
- **D-07:** Settings link visible in both demo and production sidebar contexts — users can always access settings

### Claude's Discretion
None — all areas were explicitly decided.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Route Structure
- `.planning/REQUIREMENTS.md` §v1.5 Requirements — ROUTE-01, ROUTE-02, NAV-01 requirements
- `.planning/ROADMAP.md` §Phase 26 — Success criteria for route restructuring

### Prior Decisions
- `.planning/phases/25-foundation-and-middleware-configuration/25-CONTEXT.md` — D-01 through D-06 decisions about middleware, layout, and types

### Existing Implementation
- `src/middleware.ts` — Already configured for `/demo(.*)` route matching and role checking
- `src/components/Sidebar.tsx` — Current navItems array and `isActive()` pattern to adapt
- `src/components/DashboardLayout.tsx` — Layout wrapper for all dashboard pages

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/DashboardLayout.tsx`: Already provides Header + Sidebar + main content wrapper — use for Coming Soon page
- `src/components/Sidebar.tsx`: Has `usePathname()` and `isActive()` patterns — extend for context-based navItems switching
- `src/app/layout.tsx`: Root layout with ClerkProvider — no changes needed

### Established Patterns
- Route-based detection via `usePathname()` hook — apply same pattern for demo vs production context
- NavItem component structure — reuse for "Coming Soon" placeholder item
- DashboardLayout wrapping — all dashboard pages follow this pattern

### Integration Points
- `src/app/page.tsx`: Current dashboard page becomes Coming Soon page
- `src/app/demo/`: New directory for orders, customers, mill-production pages
- `src/components/Sidebar.tsx`: Needs context-aware navItems logic

</code_context>

<specifics>
## Specific Ideas

No specific requirements — standard Next.js route restructuring patterns apply.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 26-Route Restructuring and Migration*
*Context gathered: 2026-05-11*
