# Roadmap: v1.5 Production Transition

**Created:** 2026-05-10
**Milestone:** v1.5 Production Transition
**Goal:** Separate demo content from production-ready pages, establishing the foundation for incremental real feature releases.

## Phases

- [x] **Phase 25: Foundation and Middleware Configuration** - Establish role system infrastructure and layout components (completed 2026-05-11)
- [x] **Phase 26: Route Restructuring and Migration** - Move existing pages to /demo/* namespace with navigation (completed 2026-05-11)
- [x] **Phase 27: Role Assignment and Testing** - Assign roles and verify end-to-end access control (completed 2026-05-12)
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
**Goal**: Existing demo pages are accessible at /demo/* paths with navigation
**Depends on**: Phase 25
**Requirements**: ROUTE-01, ROUTE-02, NAV-01
**Success Criteria** (what must be TRUE):
  1. Users can access orders, customers, and mill production pages at /demo/* paths
  2. Old paths (/orders, /customers, /mill-production) return 404 (clean break per D-01)
  3. Root homepage displays Coming Soon message with full dashboard layout
  4. Sidebar shows demo-specific navigation when on /demo/* routes
  5. Settings page remains accessible to all authenticated users at /settings
**Plans:** 3/3 plans complete

Plans:
**Wave 1**
- [x] 26-01-PLAN.md — Context-aware Sidebar navigation (TDD)
- [x] 26-02-PLAN.md — Coming Soon homepage and Header route titles

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 26-03-PLAN.md — Migrate demo pages to /demo/* namespace

### Phase 27: Role Assignment and Testing
**Goal**: Role-based access control is enforced and verified end-to-end
**Depends on**: Phase 26
**Requirements**: ACCESS-02
**Success Criteria** (what must be TRUE):
  1. Users with demo role can access all /demo/* pages without redirects
  2. Users without demo role are redirected to root when attempting to access /demo/* pages
  3. Server components can check roles programmatically using utility functions
  4. All users regardless of role can access /settings page
**Plans:** 5/5 plans complete

Plans:
**Wave 1** *(parallelizable — file-disjoint)*
- [x] 27-01-PLAN.md — src/lib/auth.ts utilities (checkRole + requireRole) via TDD
- [x] 27-02-PLAN.md — src/middleware.ts migration to sessionClaims (TDD)
- [x] 27-03-PLAN.md — docs/clerk-setup.md runbook + .env.example E2E keys

**Wave 2** *(blocked on 27-03; manual Clerk Dashboard work)*
- [x] 27-04-PLAN.md — Clerk Dashboard JWT template + test users (autonomous: false)

**Wave 3** *(blocked on 27-01, 27-02, 27-04)*
- [x] 27-05-PLAN.md — Playwright E2E fixtures + D-11 scenarios + D-15 UAT

### Phase 28: Client Component Security Audit
**Goal**: Client components follow security best practices with no data exposure
**Depends on**: Phase 27
**Requirements**: (No direct requirements - security verification)
**Success Criteria** (what must be TRUE):
  1. No sensitive data fetched in client components before server-side role verification
  2. Protect component usage documented with clear guidelines on client vs server checks
  3. All role-dependent data loading happens in Server Components with proper guards
**Plans:** 1/6 plans executed

Plans:
**Wave 0**
- [x] 28-01-PLAN.md — Reusable Clerk auth + next/navigation test fixture (TDD)

**Wave 1** *(blocked on Wave 0)*
- [ ] 28-02-PLAN.md — Add requireRole guard to customers/[id]/page.tsx (TDD, minimal-delta canonical-pattern proof)

**Wave 2** *(blocked on 28-02; parallelizable — file-disjoint)*
- [ ] 28-03-PLAN.md — Refactor /demo/orders to async RSC + OrdersTable accepts orders prop
- [ ] 28-04-PLAN.md — Refactor /demo/customers to async RSC + extract CustomersList client component
- [ ] 28-05-PLAN.md — Refactor /demo/mill-production to async RSC + extract MillProductionUI client component

**Wave 3** *(blocked on Wave 2)*
- [ ] 28-06-PLAN.md — docs/security-patterns.md (audit findings table + guidelines, all 6 D-09 sections)

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 25. Foundation and Middleware Configuration | 2/2 | Complete    | 2026-05-11 |
| 26. Route Restructuring and Migration | 3/3 | Complete    | 2026-05-11 |
| 27. Role Assignment and Testing | 5/5 | Complete   | 2026-05-12 |
| 28. Client Component Security Audit | 1/6 | In Progress|  |

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
*Last updated: 2026-05-11 after Phase 27 planning*
