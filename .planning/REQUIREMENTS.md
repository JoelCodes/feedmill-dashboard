# Requirements: CGM Dashboard

**Defined:** 2026-05-10
**Core Value:** Operations staff can see and manage feed orders in real-time, from pending through delivery.

## v1.5 Requirements

Requirements for Production Transition milestone. Each maps to roadmap phases.

### Route Structure

- [ ] **ROUTE-01**: Existing pages (orders, customers, mill-production) moved to `/demo/*` subdirectory
- [ ] **ROUTE-02**: New homepage at `/` displays "Coming Soon" message with full layout (header + sidebar)

### Role System

- [ ] **ROLE-01**: Clerk publicMetadata configured with `role` field, included in session token claims
- [ ] **ROLE-02**: TypeScript `CustomJwtSessionClaims` interface extended for type-safe role checking

### Access Control

- [ ] **ACCESS-01**: Middleware protects `/demo/*` routes, redirecting users without `demo` role to root
- [ ] **ACCESS-02**: Role utility functions (`checkRole()`, `requireRole()`) available for server components

### Navigation

- [ ] **NAV-01**: Sidebar displays different navigation based on route context (demo vs production)
- [ ] **NAV-02**: DashboardLayout component wraps all pages, eliminating layout duplication

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
| ROUTE-01 | TBD | Pending |
| ROUTE-02 | TBD | Pending |
| ROLE-01 | TBD | Pending |
| ROLE-02 | TBD | Pending |
| ACCESS-01 | TBD | Pending |
| ACCESS-02 | TBD | Pending |
| NAV-01 | TBD | Pending |
| NAV-02 | TBD | Pending |

**Coverage:**
- v1.5 requirements: 8 total
- Mapped to phases: 0
- Unmapped: 8 (pending roadmap creation)

---
*Requirements defined: 2026-05-10*
*Last updated: 2026-05-10 after initial definition*
