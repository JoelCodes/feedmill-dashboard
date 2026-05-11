# Roadmap: v1.5 Production Transition

**Created:** 2026-05-10
**Milestone:** v1.5 Production Transition
**Goal:** Separate demo content from production-ready pages, establishing the foundation for incremental real feature releases.

## Phases

- [x] **Phase 25: Foundation and Middleware Configuration** - Establish role system infrastructure and layout components (completed 2026-05-11)
- [ ] **Phase 26: Route Restructuring and Migration** - Move existing pages to /demo/* namespace with redirects
- [ ] **Phase 27: Role Assignment and Testing** - Assign roles and verify end-to-end access control
- [ ] **Phase 28: Client Component Security Audit** - Audit client components for security compliance

## Phase Details

### Phase 25: Foundation and Middleware Configuration
**Goal**: Role-based middleware and shared layouts are ready for route protection
**Depends on**: Nothing (first phase)
**Requirements**: ROLE-01, ROLE-02, ACCESS-01, NAV-02
**Success Criteria** (what must be TRUE):
  1. Authenticated users have role data available in session token without additional network requests
  2. TypeScript provides compile-time type safety for role checks (no string literals)
  3. Middleware intercepts /demo/* routes and checks for demo role before allowing access
  4. All dashboard pages can wrap content with DashboardLayout eliminating layout duplication
**Plans:** 2/2 plans complete

Plans:
- [x] 25-01-PLAN.md — TypeScript role types and DashboardLayout component
- [x] 25-02-PLAN.md — Middleware role-based route protection (TDD)

### Phase 26: Route Restructuring and Migration
**Goal**: Existing demo pages are accessible at /demo/* paths with navigation and redirects
**Depends on**: Phase 25
**Requirements**: ROUTE-01, ROUTE-02, NAV-01
**Success Criteria** (what must be TRUE):
  1. Users can access orders, customers, and mill production pages at /demo/* paths
  2. Users navigating to old paths (e.g., /orders) are redirected to /demo/* equivalents
  3. Root homepage displays Coming Soon message with full dashboard layout
  4. Sidebar shows demo-specific navigation when on /demo/* routes
  5. Settings page remains accessible to all authenticated users at /settings
**Plans**: TBD
**UI hint**: yes

### Phase 27: Role Assignment and Testing
**Goal**: Role-based access control is enforced and verified end-to-end
**Depends on**: Phase 26
**Requirements**: ACCESS-02
**Success Criteria** (what must be TRUE):
  1. Users with demo role can access all /demo/* pages without redirects
  2. Users without demo role are redirected to root when attempting to access /demo/* pages
  3. Server components can check roles programmatically using utility functions
  4. All users regardless of role can access /settings page
**Plans**: TBD

### Phase 28: Client Component Security Audit
**Goal**: Client components follow security best practices with no data exposure
**Depends on**: Phase 27
**Requirements**: (No direct requirements - security verification)
**Success Criteria** (what must be TRUE):
  1. No sensitive data fetched in client components before server-side role verification
  2. Protect component usage documented with clear guidelines on client vs server checks
  3. All role-dependent data loading happens in Server Components with proper guards
**Plans**: TBD

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 25. Foundation and Middleware Configuration | 2/2 | Complete   | 2026-05-11 |
| 26. Route Restructuring and Migration | 0/? | Not started | - |
| 27. Role Assignment and Testing | 0/? | Not started | - |
| 28. Client Component Security Audit | 0/? | Not started | - |

## Research Flags

All phases use standard, well-documented patterns:
- **Phase 25**: Clerk session token customization, Next.js middleware - official docs cover comprehensively
- **Phase 26**: Next.js route restructuring and redirects - well-established patterns
- **Phase 27**: Clerk Dashboard role assignment - straightforward UI workflow
- **Phase 28**: React Server Components security patterns - clear guidance in official docs

**No phases require /gsd-research-phase during planning.** Research provided comprehensive implementation details with HIGH confidence.

## Notes

**Phase numbering**: Continues from v1.4 milestone (ended at Phase 24)

**Granularity**: Standard (4 phases for 8 requirements)

**Coverage**: All 8 v1.5 requirements mapped to phases

**Dependencies**: Linear chain with clear technical dependencies
- Phase 25 establishes foundation (types, middleware, layout component)
- Phase 26 uses foundation to restructure routes
- Phase 27 assigns roles and tests protection
- Phase 28 audits client security after server protection verified

**UI phases**: Phase 26 involves Coming Soon homepage creation and sidebar navigation

---
*Last updated: 2026-05-11 after Phase 25 planning*
