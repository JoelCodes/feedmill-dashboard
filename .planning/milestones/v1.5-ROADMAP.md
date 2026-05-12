# Roadmap: v1.5 Production Transition

**Created:** 2026-05-10
**Milestone:** v1.5 Production Transition
**Goal:** Separate demo content from production-ready pages, establishing the foundation for incremental real feature releases.

## Phases

- [x] **Phase 25: Foundation and Middleware Configuration** - Establish role system infrastructure and layout components (completed 2026-05-11)
- [x] **Phase 26: Route Restructuring and Migration** - Move existing pages to /demo/* namespace with navigation (completed 2026-05-11)
- [x] **Phase 27: Role Assignment and Testing** - Assign roles and verify end-to-end access control (completed 2026-05-12)
- [x] **Phase 28: Client Component Security Audit** - Audit client components for security compliance (completed 2026-05-12)
- [x] **Phase 29: Close gap: ROUTE-01 cleanup** - Timeline.tsx href + Header.tsx dead branches + stale E2E specs + settings DashboardLayout (completed 2026-05-12)
- [x] **Phase 30: Close gap: INT-07 CustomerOrdersTab href + SUMMARY frontmatter backfill** - Second-pass closure of ROUTE-01 sibling-component miss (completed 2026-05-12)

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
**Plans:** 6/6 plans complete

Plans:
**Wave 0**
- [x] 28-01-PLAN.md — Reusable Clerk auth + next/navigation test fixture (TDD)

**Wave 1** *(blocked on Wave 0)*
- [x] 28-02-PLAN.md — Add requireRole guard to customers/[id]/page.tsx (TDD, minimal-delta canonical-pattern proof)

**Wave 2** *(blocked on 28-02; parallelizable — file-disjoint)*
- [x] 28-03-PLAN.md — Refactor /demo/orders to async RSC + OrdersTable accepts orders prop
- [x] 28-04-PLAN.md — Refactor /demo/customers to async RSC + extract CustomersList client component
- [x] 28-05-PLAN.md — Refactor /demo/mill-production to async RSC + extract MillProductionUI client component

**Wave 3** *(blocked on Wave 2)*
- [x] 28-06-PLAN.md — docs/security-patterns.md (audit findings table + guidelines, all 6 D-09 sections)

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 25. Foundation and Middleware Configuration | 2/2 | Complete    | 2026-05-11 |
| 26. Route Restructuring and Migration | 3/3 | Complete    | 2026-05-11 |
| 27. Role Assignment and Testing | 5/5 | Complete   | 2026-05-12 |
| 28. Client Component Security Audit | 6/6 | Complete    | 2026-05-12 |
| 29. Close gap: ROUTE-01 cleanup | 6/6 | Complete | 2026-05-12 |
| 30. Close gap: INT-07 + SUMMARY backfill | 2/2 | Complete   | 2026-05-12 |

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

### Phase 29: Close gap: ROUTE-01 cleanup — Timeline.tsx href, Header.tsx dead branches, stale E2E specs, settings → DashboardLayout

**Goal:** Close all v1.5-MILESTONE-AUDIT gaps (1 blocker INT-01/FLOW-01 + 5 warning-level integration items + Phase 27/28 test-pipeline tech debt). After this phase: Timeline links to /demo/orders, Header has no dead legacy branches, settings uses DashboardLayout, stale E2E specs are deleted or repointed to /demo/*, checkRole orphan is removed, and `npm test` / `npx tsc --noEmit` / Playwright authenticated runs / Tailwind dev-server all run clean.
**Requirements**: ROUTE-01, NAV-02, ACCESS-02
**Depends on:** Phase 28
**Plans:** 6/6 plans complete

Plans:
**Wave 1** *(all plans parallel — zero file-modification overlap)*
- [x] 29-01-PLAN.md — Timeline.tsx href fix + Timeline.test.tsx assertion update (TDD: D-05, D-06) — closes INT-01 / FLOW-01 blocker
- [x] 29-02-PLAN.md — Header.tsx dead-branch deletion + Header.test.tsx assertion (TDD: D-11) — closes INT-06
- [x] 29-03-PLAN.md — settings/page.tsx wrap in DashboardLayout (D-07; settings tests deferred per D-08) — closes INT-02
- [x] 29-04-PLAN.md — Playwright cleanup: delete production-smoke spec + project entry (D-09/D-09b), repoint route-protection.spec.ts (D-10), pin authenticated projects to localhost (D-16) — closes INT-04 + INT-05 + env-leak tech debt
- [x] 29-05-PLAN.md — Delete checkRole + 5 unit tests (D-12); update REQUIREMENTS.md ACCESS-02 text (D-13) — closes INT-03
- [x] 29-06-PLAN.md — Jest e2e ignore (D-14), 12 tsc fixture errors (D-15), Tailwind @source verify (D-17) — closes test-pipeline tech debt

### Phase 30: Close gap: INT-07 CustomerOrdersTab href + SUMMARY frontmatter backfill

**Goal:** Close the remaining v1.5 audit gap (INT-07 blocker) so all 7 E2E flows wire end-to-end and ROUTE-01 is fully satisfied. Fix the stale `/orders?selected=…` href in `src/components/CustomerOrdersTab.tsx:159` (sibling-component miss not covered by Phase 29's INT-01 scope), add a mirroring Jest assertion per the D-06 pattern, and backfill four `requirements-completed` SUMMARY frontmatters (ROUTE-01 in 26-03, ROLE-02 in 25-01, NAV-01 in 26-01, NAV-02 in 25-01) to close the documentation-lag tech debt.
**Requirements**: ROUTE-01 (also touches doc-hygiene for ROLE-02, NAV-01, NAV-02)
**Depends on:** Phase 29
**Plans:** 2/2 plans complete

Plans:
**Wave 0** *(both plans parallel — zero file-modification overlap)*
- [x] 30-01-PLAN.md — CustomerOrdersTab.tsx href fix + new CustomerOrdersTab.test.tsx regression assertion (TDD: D-05, D-06) — closes INT-07 / FLOW-07 blocker
- [x] 30-02-PLAN.md — SUMMARY frontmatter backfill: ROUTE-01 → 26-03, ROLE-02 + NAV-02 → 25-01, NAV-01 → 26-01 (D-10) — closes milestone-level documentation-lag tech debt

Source of truth for scope:
- `.planning/v1.5-MILESTONE-AUDIT.md` (re-audit #2, 2026-05-12T23:00:00Z)
- `.planning/v1.5-INTEGRATION-CHECK.md` (INT-07 evidence, FLOW-07 break, fix specification)

Expected scope (single-line fix + Jest assertion mirrors Phase 29 D-05/D-06):
- 1 source edit at `src/components/CustomerOrdersTab.tsx:159` → `/demo/orders?selected=${order.id}`
- 1 Jest assertion in `CustomerOrdersTab` test verifying rendered `<a>` href shape
- 4 single-line YAML frontmatter edits across existing SUMMARY.md files (no behavior change)

---
*Last updated: 2026-05-12 after /gsd-plan-phase 30 (2 plans, wave 0)*
