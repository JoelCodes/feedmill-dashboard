# Requirements: CGM Dashboard

**Defined:** 2026-05-10
**Core Value:** Operations staff can see and manage feed orders in real-time, from pending through delivery.

## v1.5 Requirements

Requirements for Production Transition milestone. Each maps to roadmap phases.

### Route Structure

- [ ] **ROUTE-01**: Existing pages (orders, customers, mill-production) moved to `/demo/*` subdirectory
- [ ] **ROUTE-02**: New homepage at `/` displays "Coming Soon" message with full layout (header + sidebar)

### Role System

- [x] **ROLE-01**: Clerk publicMetadata configured with `role` field, included in session token claims
- [x] **ROLE-02**: TypeScript `CustomJwtSessionClaims` interface extended for type-safe role checking

### Access Control

- [x] **ACCESS-01**: Middleware protects `/demo/*` routes, redirecting users without `demo` role to root
- [ ] **ACCESS-02**: Role utility functions (`checkRole()`, `requireRole()`) available for server components

### Navigation

- [ ] **NAV-01**: Sidebar displays different navigation based on route context (demo vs production)
- [x] **NAV-02**: DashboardLayout component wraps all pages, eliminating layout duplication

## Future Requirements

Deferred to future milestones. Tracked but not in current roadmap.

### Route Enhancements

- **ROUTE-03**: 308 redirects from old URLs to `/demo/*` paths (preserves bookmarks/SEO)

### Role Enhancements

- **ROLE-03**: Role assignment UI in admin interface
- **ROLE-04**: Automatic role assignment on sign-up

### UX Enhancements

- **UX-01**: Auto-redirect demo users from root to `/demo/orders`
- **UX-02**: Onboarding flow explaining demo vs production contexts

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Fine-grained permissions | Premature optimization — simple role flags sufficient for v1.5 |
| Client-side role checking for security | Security theater — always enforce server-side |
| Organization-based RBAC | Over-engineering — publicMetadata roles simpler for single-tenant app |
| Nested role hierarchies | Complexity explosion — flat roles sufficient |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| ROUTE-01 | Phase 26 | Pending |
| ROUTE-02 | Phase 26 | Pending |
| ROLE-01 | Phase 25 | Complete |
| ROLE-02 | Phase 25 | Complete |
| ACCESS-01 | Phase 25 | Complete |
| ACCESS-02 | Phase 27 | Pending |
| NAV-01 | Phase 26 | Pending |
| NAV-02 | Phase 25 | Complete |

**Coverage:**
- v1.5 requirements: 8 total
- Mapped to phases: 8
- Unmapped: 0

**Phase distribution:**
- Phase 25: 4 requirements (ROLE-01, ROLE-02, ACCESS-01, NAV-02)
- Phase 26: 3 requirements (ROUTE-01, ROUTE-02, NAV-01)
- Phase 27: 1 requirement (ACCESS-02)
- Phase 28: 0 requirements (security verification phase)

---
*Requirements defined: 2026-05-10*
*Last updated: 2026-05-10 after roadmap creation*
